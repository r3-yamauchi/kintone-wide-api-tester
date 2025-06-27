/**
 * kintone JavaScript API テスター ポップアップスクリプト
 * 
 * ブラウザ拡張機能のポップアップUIを制御するメインスクリプトです。
 * kintoneページで利用可能なすべてのJavaScript APIメソッドを検出し、
 * 順次実行してDevToolsのConsoleに結果を表示します。
 */

import './style.css';
import { DEBUG_MODE, debugLog, debugWarn, debugError, apiLog } from '@/config/debug';

// 型定義
interface KintoneMethodResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}


type KintoneMethodName = string;

interface ExecutionStats {
  success: number;
  error: number;
  skipped: number;
  total: number;
}

// グローバル変数：取得したアプリIDを記憶
let currentAppId: string | number | null = null;

/**
 * ポップアップUIを動的に生成する関数
 * kintoneドメインかどうかによって表示内容を変更
 */
async function initializePopupUI() {
  try {
    debugLog('🚀 ポップアップUI初期化開始');

    // 現在のタブを取得してkintoneドメインかチェック
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    debugLog('📋 現在のタブ:', tab.url);

    const isKintoneDomain = tab.url &&
      (tab.url.includes('cybozu.com') || tab.url.includes('kintone.com'));

    debugLog('🔍 kintoneドメイン判定:', isKintoneDomain);

    if (isKintoneDomain) {
      // kintoneドメインの場合：通常のUI
      document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
        <div>
          <h1>kintone JavaScript API Tester</h1>
          <div class="card">
            <button id="run-all-btn" type="button">Run All kintone Methods</button>
          </div>
          <div id="status" class="status">結果はDevToolsのConsoleで確認してください</div>
        </div>
      `;

      // ボタンにイベントリスナーを追加
      const button = document.getElementById('run-all-btn');
      if (button) {
        button.addEventListener('click', () => {
          debugLog('🔘 ボタンがクリックされました');
          runAllMethods().catch(error => {
            debugError('❌ runAllMethods実行エラー:', error);
          });
        });
        debugLog('✅ ボタンイベントリスナーを設定しました');
      } else {
        debugError('❌ ボタン要素が見つかりません');
      }

    } else {
      // kintoneドメイン以外の場合：メッセージのみ表示
      document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
        <div>
          <h1>kintone JavaScript API Tester</h1>
          <div class="card warning">
            <h3>⚠️ kintoneページではありません</h3>
            <p>この拡張機能はkintoneページでのみ動作します。</p>
            <p><strong>対象ドメイン:</strong></p>
            <ul>
              <li>*.cybozu.com</li>
              <li>*.kintone.com</li>
            </ul>
            <p>kintoneアプリページでお試しください。</p>
          </div>
          <div id="status" class="status">現在のURL: ${tab.url || 'Unknown'}</div>
        </div>
      `;
    }

  } catch (error) {
    // エラーが発生した場合はエラーメッセージを表示
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
      <div>
        <h1>kintone JavaScript API Tester</h1>
        <div class="card error">
          <h3>❌ エラーが発生しました</h3>
          <p>ページ情報の取得に失敗しました。</p>
          <p>拡張機能を再度開いてください。</p>
        </div>
        <div id="status" class="status">Error: ${error}</div>
      </div>
    `;
  }
}

// 初期化実行
initializePopupUI();

/**
 * ステータス表示用のDOM要素を安全に取得
 * @returns HTMLDivElement - ステータス表示要素
 * @throws Error - 要素が見つからない場合
 */
function getStatusElement(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>('#status');
  if (!element) {
    throw new Error('ステータス表示要素が見つかりません');
  }
  return element;
}

/**
 * kintoneメソッドを呼び出すヘルパー関数
 * 
 * @param method - 実行するkintoneメソッド名（例：'getDomain', 'app.get'）
 * @param args - メソッドの引数（現在は未使用）
 * @param appId - 現在のアプリID（利用可能な場合）
 * @returns Promise<KintoneMethodResponse> - メソッドの実行結果
 * @throws Error - タブが見つからない場合やkintoneドメイン以外の場合
 */
async function callKintoneMethod(method: string, args?: unknown[], appId?: string | number | null): Promise<KintoneMethodResponse> {
  // 現在アクティブなタブを取得
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

  if (!tab.id) {
    throw new Error('アクティブなタブが見つかりません');
  }

  // タブのURLがkintoneドメインかチェック
  debugLog('🔍 現在のタブURL:', tab.url);

  if (!tab.url || (!tab.url.includes('cybozu.com') && !tab.url.includes('kintone.com'))) {
    const errorMsg = `このページはkintoneドメインではありません。
現在のURL: ${tab.url}
kintoneページ（*.cybozu.com または *.kintone.com）でお試しください。`;
    throw new Error(errorMsg);
  }

  debugLog('✅ kintoneドメインを確認しました');

  try {
    debugLog(`📤 メソッド実行リクエスト送信: ${method}`);

    // コンテンツスクリプトにメッセージを送信してkintoneメソッドを実行
    const response = await browser.tabs.sendMessage(tab.id, {
      action: 'callKintoneMethod',
      method: method,
      args: args,
      appId: appId
    });

    debugLog('📥 レスポンス受信:', response);
    return response;

  } catch (error) {
    debugError('❌ メッセージ送信エラー:', error);

    // エラーの詳細な情報を構築
    let errorMessage = '';

    // コンテンツスクリプトが読み込まれていない可能性
    if (error instanceof Error && error.message.includes('Could not establish connection')) {
      errorMessage = `コンテンツスクリプトとの接続に失敗しました (メソッド: ${method})

考えられる原因:
1. ページの読み込みが完了していない
2. 拡張機能の権限が不足している
3. kintoneページではない可能性

解決方法:
- ページを再読み込みしてもう一度お試しください
- kintoneアプリページ（例: https://yoursubdomain.cybozu.com/k/appId/）でお試しください

注意: この種のエラーは処理継続には影響しません`;
    } else {
      errorMessage = `メソッド ${method} の実行中にエラーが発生しました: ${error}`;
    }

    // エラー情報をより詳しく記録
    console.warn(`⚠️ callKintoneMethod でエラー (処理は継続):`, {
      method: method,
      error: error,
      timestamp: new Date().toISOString()
    });

    throw new Error(errorMessage);
  }
}

/**
 * API実行結果を見やすい形式にフォーマットするヘルパー関数
 * 
 * @param data - フォーマットするデータ
 * @returns string - フォーマット済みの文字列
 */
/**
 * API実行結果を見やすい形式にフォーマットするヘルパー関数
 * 
 * @param data - フォーマットするデータ
 * @returns string - フォーマット済みの文字列
 */
function formatResult(data: unknown): string {
  if (data === null) return 'null';
  if (data === undefined) return 'undefined';
  if (typeof data === 'string') return `"${data}"`;
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  if (typeof data === 'object') {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      debugWarn('シリアライゼーションエラー:', error);
      return '[Object - シリアライゼーション失敗]';
    }
  }
  return String(data);
}

/**
 * すべてのkintone JavaScript APIメソッドを順次実行するメイン関数
 * 
 * 以下の処理を順番に実行します：
 * 1. 利用可能なメソッド一覧を取得
 * 2. 問題のあるメソッドをフィルタリング
 * 3. 各メソッドを順次実行してConsoleに結果を出力
 * 4. 実行統計をConsoleとUIに表示
 */
async function runAllMethods() {
  try {
    // ステータス表示要素を動的に取得
    const statusDiv = getStatusElement();

    // UIのステータスを更新
    statusDiv.textContent = '実行中...';

    // Console出力の開始ヘッダー
    apiLog('====================================');
    apiLog('🚀 kintone JavaScript API 実行開始');
    apiLog('====================================');
    apiLog('');

    // まず利用可能なメソッド一覧を取得
    const methodsResponse = await callKintoneMethod('listMethods');

    if (!methodsResponse?.success) {
      throw new Error(methodsResponse?.error || 'Failed to get methods list');
    }

    const methods = methodsResponse.data as KintoneMethodName[];

    if (!Array.isArray(methods)) {
      throw new Error('メソッド一覧の取得に失敗しました');
    }
    // メソッド数はbridge scriptで出力される

    // 最初にkintone.app.getId()を実行してアプリIDを取得
    try {
      await callKintoneMethod('logInitialSetup', [], null);
      const appIdResult = await callKintoneMethod('app.getId');
      if (appIdResult?.success && appIdResult.data) {
        currentAppId = appIdResult.data as string | number;
        await callKintoneMethod('logAppIdSuccess', [currentAppId], currentAppId);

        // アプリIDを取得できた場合、getIconsメソッドを実行
        try {
          await callKintoneMethod('logIconsStart', [], currentAppId);
          const iconsResult = await callKintoneMethod('app.getIcons', [[currentAppId]], currentAppId);
          if (iconsResult?.success) {
            // アイコン取得成功はbridge scriptで自動ログ出力される
          } else {
            // エラーもbridge scriptで自動ログ出力される
          }
        } catch (error) {
          // 例外もbridge scriptで自動ログ出力される
        }
      } else {
        await callKintoneMethod('logAppIdFailure', [appIdResult?.error || '不明なエラー'], null);
      }
    } catch (error) {
      await callKintoneMethod('logAppIdError', [String(error)], null);
    }
    apiLog('');

    // 実行をスキップするメソッドのリスト
    // これらのメソッドは引数が必要だったり、副作用があったりするため除外
    const skipMethods = [
      'Promise', 'api', 'events.on',
      'oauth.clearAccessToken', 'oauth.hasAccessToken',
      'oauth.redirectToAuthenticate', 'oauth.proxy',
      'plugin.app.getConfig', 'plugin.app.proxy', 'proxy'
    ];

    // パラメータが必要であるため実行をスキップするメソッド
    const problematicMethods = [
      'app.getRelatedRecordsTargetAppId',
      'app.getLookupTargetAppId',
      'app.getFieldElements',
      'app.record.getFieldElement',
      'app.record.getSpaceElement',
      'app.record.setFieldShown',
      'app.record.setGroupFieldOpen'
    ];

    // 実行統計用のカウンター
    const stats: ExecutionStats = {
      success: 0,
      error: 0,
      skipped: 0,
      total: methods.length
    };

    // 各メソッドを順次実行
    for (let i = 0; i < methods.length; i++) {
      const method = methods[i];

      // 既に実行済みのメソッドはスキップ
      if (method === 'app.getId' || method === 'app.getIcons') {
        if (method === 'app.getId') {
          apiLog(`⏭️  [${i + 1}/${methods.length}] ${method} - スキップ（既に実行済み）`);
        } else {
          apiLog(`⏭️  [${i + 1}/${methods.length}] ${method} - スキップ（アプリID取得時に実行済み）`);
        }
        stats.skipped++;
        continue;
      }

      // スキップ対象のメソッドかチェック（引数が必要なメソッドのみ）
      if (skipMethods.includes(method) ||
        problematicMethods.some(p => method.includes(p))) {

        apiLog(`⏭️  [${i + 1}/${methods.length}] ${method} - スキップ（パラメータが必要）`);
        stats.skipped++;
        continue;
      }

      try {
        apiLog(`📝 [${i + 1}/${methods.length}] kintone.${method}() 実行中...`);

        // メソッドを実行（アプリIDが利用可能な場合は渡す）
        const result = await callKintoneMethod(method, [], currentAppId);

        if (result?.success) {
          // 成功した場合は結果をフォーマットして表示
          const formattedResult = formatResult(result.data);
          apiLog(`✅ kintone.${method}() 結果:`);
          apiLog(`   ${formattedResult}`);
          stats.success++;
        } else {
          // エラーが発生した場合はエラーメッセージを表示
          let errorMsg = result?.error || '不明なエラー';

          // エラータイプ別の詳細な処理
          if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
            errorMsg = '権限不足（403 Forbidden）- このメソッドは権限が必要ですが、処理を継続します';
          } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            errorMsg = '認証エラー（401 Unauthorized）- ログインが必要ですが、処理を継続します';
          } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
            errorMsg = 'リソースが見つかりません（404 Not Found）- 処理を継続します';
          } else if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
            errorMsg = 'サーバーエラー（500）- kintoneサーバー側で問題が発生しましたが、処理を継続します';
          }

          apiLog(`❌ kintone.${method}() エラー: ${errorMsg}`);
          stats.error++;
        }
      } catch (error) {
        // 例外が発生した場合の詳細なエラーハンドリング
        let errorMsg = String(error);
        let continueExecution = true; // 処理継続フラグ

        // エラータイプ別の詳細な処理
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          errorMsg = '権限不足（403 Forbidden）- このメソッドは権限が必要ですが、処理を継続します';
        } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          errorMsg = '認証エラー（401 Unauthorized）- ログインが必要ですが、処理を継続します';
        } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
          errorMsg = 'リソースが見つかりません（404 Not Found）- 処理を継続します';
        } else if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
          errorMsg = 'サーバーエラー（500）- kintoneサーバー側で問題が発生しましたが、処理を継続します';
        } else if (errorMsg.includes('Timeout')) {
          errorMsg = 'タイムアウトエラー - メソッドの実行に時間がかかりすぎましたが、処理を継続します';
        } else {
          // その他のエラーの場合
          errorMsg = `予期しないエラー: ${errorMsg} - 処理を継続します`;
        }

        // エラー情報を詳細にログ出力
        console.warn(`⚠️ ${method} でエラーが発生しました（処理継続）:`, {
          method: method,
          error: error,
          continueExecution: continueExecution,
          index: `${i + 1}/${methods.length}`
        });

        apiLog(`❌ kintone.${method}() 例外: ${errorMsg}`);
        stats.error++;


        // エラーが発生しても処理を継続することを明示的にログ出力（常に出力）
        if (i + 1 < methods.length) {
          apiLog(`🔄 エラー後も処理を継続します (次: ${methods[i + 1]})`);
        } else {
          apiLog(`🔄 エラーが発生しましたが、最後のメソッドでした`);
        }
      }

      apiLog(''); // 見やすさのための空行

      // 適度な待機時間（サーバーへの負荷を軽減し、エラー後の復旧時間を確保）
      const waitTime = stats.error > 0 ? 500 : 300; // エラーがあった場合は少し長めに待機
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // 実行完了の統計情報をkintoneページのコンソールに送信
    try {
      await callKintoneMethod('showExecutionSummary', [stats], currentAppId);
    } catch (error) {
      debugError('❌ 統計サマリー送信エラー:', error);
    }

    // UIのステータスを更新
    statusDiv.textContent = `実行完了！成功:${stats.success} エラー:${stats.error} スキップ:${stats.skipped}`;

  } catch (error) {
    // 全体的なエラーハンドリング
    debugError('❌ 実行エラー:', error);

    try {
      // ステータス表示要素を動的に取得
      const statusDiv = getStatusElement();

      // エラーメッセージを整形してUIに表示
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // 長いエラーメッセージの場合は改行を保持
      statusDiv.innerHTML = `<strong>エラー:</strong><br><pre style="white-space: pre-wrap; font-size: 0.9em;">${errorMessage}</pre>`;
      statusDiv.style.color = '#d32f2f';
      statusDiv.style.backgroundColor = '#ffebee';
      statusDiv.style.border = '1px solid #e57373';
    } catch (statusError) {
      // ステータス要素取得でエラーが発生した場合はコンソールにのみ出力
      debugError('❌ ステータス表示エラー:', statusError);
    }
  }
}

// イベントリスナーはinitializePopupUI()内で設定済み

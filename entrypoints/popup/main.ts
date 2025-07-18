/**
 * kintone ワイドコースAPI テスター ポップアップスクリプト
 * 
 * ブラウザ拡張機能のポップアップUIを制御するメインスクリプトです。
 * kintoneワイドコース契約を確認し、ワイドコース専用APIの動作をテストして
 * DevToolsのConsoleに結果を表示します。
 */

import './style.css';
import { DEBUG_MODE, debugLog, debugWarn, debugError, apiLog } from '@/config/debug';

// 型定義
interface KintoneMethodResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface ExecutionStats {
  success: number;
  error: number;
  skipped: number;
  total: number;
}

// 不要になったグローバル変数を削除（アプリID取得を行わないため）
// let currentAppId: string | number | null = null;

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
      (tab.url.indexOf('cybozu.com') !== -1 || tab.url.indexOf('kintone.com') !== -1);

    debugLog('🔍 kintoneドメイン判定:', isKintoneDomain);

    if (isKintoneDomain) {
      // kintoneドメインの場合：通常のUI
      document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
        <div>
          <h1>kintone Wide API Tester</h1>
          <div class="card">
            <button id="run-all-btn" type="button">Test Wide Course APIs</button>
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
          <h1>kintone Wide API Tester</h1>
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
        <h1>kintone Wide API Tester</h1>
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

  if (!tab.url || (tab.url.indexOf('cybozu.com') === -1 && tab.url.indexOf('kintone.com') === -1)) {
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
    if (error instanceof Error && error.message.indexOf('Could not establish connection') !== -1) {
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
 * kintoneワイドコースAPIをテストするメイン関数
 * 
 * 以下の処理を順番に実行します：
 * 1. ワイドコース契約確認（getAvailableApiTypes）
 * 2. ワイドコース専用APIの実行（getAssignedApps）
 * 3. ワイドコース専用REST API の実行（apps/statistics, spaces/statistics）
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
    apiLog('🚀 kintone Wide API Tester 実行開始');
    apiLog('====================================');
    apiLog('');

    // 最初にkintone.getAvailableApiTypes()を実行してWIDE APIが利用可能かチェック
    let isWideAvailable = false;
    try {
      await callKintoneMethod('logWideCheckStart', [], null);
      const apiTypesResult = await callKintoneMethod('getAvailableApiTypes');
      if (apiTypesResult?.success && Array.isArray(apiTypesResult.data)) {
        const apiTypes = apiTypesResult.data as string[];
        isWideAvailable = apiTypes.includes('WIDE');
        await callKintoneMethod('logWideCheckSuccess', [apiTypes, isWideAvailable], null);
        
        if (!isWideAvailable) {
          // WIDEが利用できない場合は処理を終了
          statusDiv.textContent = 'ワイドコース契約が必要です';
          return;
        }
      } else {
        // APIタイプ取得失敗の場合は警告して処理継続
        await callKintoneMethod('logWideCheckError', [apiTypesResult?.error || '不明なエラー'], null);
      }
    } catch (error) {
      // 例外の場合も警告して処理継続
      await callKintoneMethod('logWideCheckError', [String(error)], null);
    }
    apiLog('');

    // WIDEが利用可能な場合のみ、getAssignedApps()を実行
    try {
      await callKintoneMethod('logAssignedAppsStart', [], null);
      const assignedAppsResult = await callKintoneMethod('app.getAssignedApps');
      if (assignedAppsResult?.success) {
        // 取得成功はbridge scriptで自動ログ出力される
      } else {
        // エラーもbridge scriptで自動ログ出力される
      }
    } catch (error) {
      // 例外もbridge scriptで自動ログ出力される
    }
    apiLog('');

    // ワイドコース専用REST APIをテスト実行
    apiLog('📊 ワイドコース専用REST APIをテスト中...');
    
    // 実行統計用のカウンター
    const stats: ExecutionStats = {
      success: 0,
      error: 0,
      skipped: 0,
      total: 2
    };

    try {
      // kintone.api()を使用してアプリ統計APIを実行
      const result = await callKintoneMethod('api', [
        '/k/v1/apps/statistics.json',
        'GET'
      ], null);

      if (result?.success) {
        // 成功した場合は結果をフォーマットして表示
        const formattedResult = formatResult(result.data);
        apiLog('✅ アプリ統計API実行成功:');
        apiLog(`   ${formattedResult}`);
        stats.success++;
      } else {
        // エラーが発生した場合はエラーメッセージを表示
        let errorMsg = result?.error || '不明なエラー';

        // エラータイプ別の詳細な処理
        if (errorMsg.indexOf('403') !== -1 || errorMsg.indexOf('Forbidden') !== -1) {
          errorMsg = '権限不足（403 Forbidden）- アプリ統計APIの実行権限がありません';
        } else if (errorMsg.indexOf('401') !== -1 || errorMsg.indexOf('Unauthorized') !== -1) {
          errorMsg = '認証エラー（401 Unauthorized）- ログインが必要です';
        } else if (errorMsg.indexOf('404') !== -1 || errorMsg.indexOf('Not Found') !== -1) {
          errorMsg = 'リソースが見つかりません（404 Not Found）- アプリ統計APIが存在しません';
        } else if (errorMsg.indexOf('500') !== -1 || errorMsg.indexOf('Internal Server Error') !== -1) {
          errorMsg = 'サーバーエラー（500）- kintoneサーバー側で問題が発生しました';
        }

        apiLog(`❌ アプリ統計API実行エラー: ${errorMsg}`);
        stats.error++;
      }
    } catch (error) {
      // 例外が発生した場合の詳細なエラーハンドリング
      let errorMsg = String(error);

      // エラータイプ別の詳細な処理
      if (errorMsg.indexOf('403') !== -1 || errorMsg.indexOf('Forbidden') !== -1) {
        errorMsg = '権限不足（403 Forbidden）- アプリ統計APIの実行権限がありません';
      } else if (errorMsg.indexOf('401') !== -1 || errorMsg.indexOf('Unauthorized') !== -1) {
        errorMsg = '認証エラー（401 Unauthorized）- ログインが必要です';
      } else if (errorMsg.indexOf('404') !== -1 || errorMsg.indexOf('Not Found') !== -1) {
        errorMsg = 'リソースが見つかりません（404 Not Found）- アプリ統計APIが存在しません';
      } else if (errorMsg.indexOf('500') !== -1 || errorMsg.indexOf('Internal Server Error') !== -1) {
        errorMsg = 'サーバーエラー（500）- kintoneサーバー側で問題が発生しました';
      } else if (errorMsg.indexOf('Timeout') !== -1) {
        errorMsg = 'タイムアウトエラー - アプリ統計APIの実行に時間がかかりすぎました';
      } else {
        // その他のエラーの場合
        errorMsg = `予期しないエラー: ${errorMsg}`;
      }

      // エラー情報を詳細にログ出力
      console.warn('⚠️ アプリ統計API実行でエラーが発生しました:', {
        error: error,
        timestamp: new Date().toISOString()
      });

      apiLog(`❌ アプリ統計API実行例外: ${errorMsg}`);
      stats.error++;
    }

    apiLog(''); // 見やすさのための空行

    // スペース統計APIを実行
    apiLog('📊 スペース統計APIを実行中...');
    
    try {
      // kintone.api()を使用してスペース統計APIを実行
      const spaceResult = await callKintoneMethod('api', [
        '/k/v1/spaces/statistics.json',
        'GET'
      ], null);

      if (spaceResult?.success) {
        // 成功した場合は結果をフォーマットして表示
        const formattedResult = formatResult(spaceResult.data);
        apiLog('✅ スペース統計API実行成功:');
        apiLog(`   ${formattedResult}`);
        stats.success++;
      } else {
        // エラーが発生した場合はエラーメッセージを表示
        let errorMsg = spaceResult?.error || '不明なエラー';

        // エラータイプ別の詳細な処理
        if (errorMsg.indexOf('403') !== -1 || errorMsg.indexOf('Forbidden') !== -1) {
          errorMsg = '権限不足（403 Forbidden）- スペース統計APIの実行権限がありません';
        } else if (errorMsg.indexOf('401') !== -1 || errorMsg.indexOf('Unauthorized') !== -1) {
          errorMsg = '認証エラー（401 Unauthorized）- ログインが必要です';
        } else if (errorMsg.indexOf('404') !== -1 || errorMsg.indexOf('Not Found') !== -1) {
          errorMsg = 'リソースが見つかりません（404 Not Found）- スペース統計APIが存在しません';
        } else if (errorMsg.indexOf('500') !== -1 || errorMsg.indexOf('Internal Server Error') !== -1) {
          errorMsg = 'サーバーエラー（500）- kintoneサーバー側で問題が発生しました';
        }

        apiLog(`❌ スペース統計API実行エラー: ${errorMsg}`);
        stats.error++;
      }
    } catch (error) {
      // 例外が発生した場合の詳細なエラーハンドリング
      let errorMsg = String(error);

      // エラータイプ別の詳細な処理
      if (errorMsg.indexOf('403') !== -1 || errorMsg.indexOf('Forbidden') !== -1) {
        errorMsg = '権限不足（403 Forbidden）- スペース統計APIの実行権限がありません';
      } else if (errorMsg.indexOf('401') !== -1 || errorMsg.indexOf('Unauthorized') !== -1) {
        errorMsg = '認証エラー（401 Unauthorized）- ログインが必要です';
      } else if (errorMsg.indexOf('404') !== -1 || errorMsg.indexOf('Not Found') !== -1) {
        errorMsg = 'リソースが見つかりません（404 Not Found）- スペース統計APIが存在しません';
      } else if (errorMsg.indexOf('500') !== -1 || errorMsg.indexOf('Internal Server Error') !== -1) {
        errorMsg = 'サーバーエラー（500）- kintoneサーバー側で問題が発生しました';
      } else if (errorMsg.indexOf('Timeout') !== -1) {
        errorMsg = 'タイムアウトエラー - スペース統計APIの実行に時間がかかりすぎました';
      } else {
        // その他のエラーの場合
        errorMsg = `予期しないエラー: ${errorMsg}`;
      }

      // エラー情報を詳細にログ出力
      console.warn('⚠️ スペース統計API実行でエラーが発生しました:', {
        error: error,
        timestamp: new Date().toISOString()
      });

      apiLog(`❌ スペース統計API実行例外: ${errorMsg}`);
      stats.error++;
    }

    apiLog(''); // 見やすさのための空行

    // 実行完了の結果情報をkintoneページのコンソールに送信
    try {
      await callKintoneMethod('showExecutionSummary', [stats], null);
    } catch (error) {
      debugError('❌ 実行結果サマリー送信エラー:', error);
    }

    // UIのステータスを更新
    statusDiv.textContent = `実行完了！成功:${stats.success} エラー:${stats.error}`;

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

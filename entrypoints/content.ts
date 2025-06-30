import { DEBUG_MODE, debugLog, debugWarn, debugError } from '@/config/debug';

/**
 * kintone ワイドコースAPI テスター用コンテンツスクリプト
 * 
 * このスクリプトはkintoneドメイン（*.cybozu.com, *.kintone.com）で実行され、
 * ブラウザ拡張機能のポップアップからのリクエストを受けて、
 * kintoneワイドコース専用APIメソッドを実行します。
 * 
 * 技術的な背景：
 * - ブラウザ拡張機能のポップアップは独立したコンテキストで動作するため、
 *   Webページ上のkintoneオブジェクトに直接アクセスできません
 * - そのため、kintone-bridge.jsをメインワールドに注入し、
 *   window.postMessageを使用してコンテキスト間の通信を行います
 * 
 * 処理フロー：
 * 1. kintone-bridge.jsをページのメインワールドに注入
 * 2. ポップアップからのメッセージを受信
 * 3. bridge scriptにリクエストを転送
 * 4. bridge scriptからのレスポンスをポップアップに返送
 */
export default defineContentScript({
  // 対象ドメイン：kintoneとcybozuのすべてのページ
  matches: ['*://*.cybozu.com/*', '*://*.kintone.com/*'],
  // ページの読み込み完了後に実行（kintoneオブジェクトが確実に利用可能になるため）
  runAt: 'document_idle',

  main() {
    try {
      debugLog('🚀 ワイドコースAPI テスター Content script 初期化開始');
      debugLog('🔍 現在のURL:', window.location.href);
      debugLog('🔍 kintoneオブジェクトの存在:', typeof (window as any).kintone !== 'undefined');

      // セキュリティを考慮してbridge scriptを安全に注入
      injectBridgeScript();
      
      // ポップアップとの通信ハンドラーを設定
      setupMessageHandler();

      debugLog('✅ ワイドコースAPI テスター Content script 初期化完了');
    } catch (error) {
      debugError('❌ ワイドコースAPI テスター Content script 初期化エラー:', error);
    }
  },
});

/**
 * bridge script を安全に注入する関数
 * 
 * kintone-bridge.jsをページのメインワールド（ページのJavaScriptコンテキスト）に注入します。
 * これにより、注入されたスクリプトがページ上のkintoneオブジェクトに直接アクセス可能になります。
 * エラーハンドリングとロード確認も含まれています。
 */
function injectBridgeScript(): void {
  try {
    // script要素を作成してbridge scriptを注入
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('/kintone-bridge.js');

    // スクリプト読み込みエラーのハンドリング
    script.onerror = () => {
      debugError('❌ kintone-bridge.js の読み込みに失敗しました');
    };
    
    // スクリプト読み込み成功の確認
    script.onload = () => {
      debugLog('✅ kintone-bridge.js を正常に読み込みました');
    };

    // DOM要素に安全に追加（head要素が存在しない場合のエラーハンドリングを含む）
    const head = document.head || document.documentElement;
    if (head) {
      head.appendChild(script);
    } else {
      throw new Error('DOMのhead要素が見つかりません - ページがまだ完全に読み込まれていない可能性があります');
    }
  } catch (error) {
    debugError('❌ Bridge script 注入エラー:', error);
    throw error;
  }
}

/**
 * メッセージハンドリングの設定
 * 
 * ポップアップからのメッセージを受信し、bridge scriptに転送するためのイベントリスナーを設定します。
 * セキュリティチェック、タイムアウト管理、リソースクリーンアップなどを含む包括的な処理を行います。
 */
function setupMessageHandler(): void {
  // ポップアップからのメッセージを受信するイベントリスナーを設定
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    debugLog('📨 ポップアップからメッセージ受信:', message);

    // セキュリティチェック: メッセージの形式と内容を検証
    if (!message || typeof message !== 'object') {
      debugWarn('⚠️ 無効なメッセージ形式です:', message);
      return false;
    }

    // kintoneワイドコースAPIメソッド呼び出しリクエストの場合のみ処理
    if (message.action === 'callKintoneMethod') {
      // メソッド名の妥当性を検証
      if (typeof message.method !== 'string' || !message.method.trim()) {
        sendResponse({ success: false, error: '無効なメソッド名が指定されました' });
        return false;
      }

      try {
        debugLog(`📤 Bridge scriptにリクエスト送信: ${message.method.trim()}`);

        // メインワールドに注入したbridge scriptにリクエストを転送
        // window.postMessageを使用してコンテキスト間の安全な通信を行います
        window.postMessage({
          type: 'KINTONE_METHOD_REQUEST',
          method: message.method.trim(),  // 実行するkintoneメソッド名
          args: message.args,             // メソッドの引数
          appId: message.appId            // 現在のアプリID（利用可能な場合）
        }, '*');

        // メモリリーク対策とタイムアウト管理のための状態管理変数
        let isResponseSent = false;
        let timeoutId: number;

        // bridge scriptからのレスポンスを待機するイベントリスナーを設定
        const messageListener = (event: MessageEvent) => {
          // セキュリティチェック: 自分のウィンドウからのメッセージかつ正しいタイプのメッセージのみ処理
          if (event.source !== window ||
            !event.data ||
            event.data.type !== 'KINTONE_METHOD_RESPONSE') {
            return;
          }

          // 重複レスポンス防止（タイムアウト後の遅延レスポンスなどを防ぐ）
          if (isResponseSent) {
            return;
          }
          isResponseSent = true;

          // タイマーとイベントリスナーをクリーンアップ
          cleanupResources();

          // bridge scriptからの実行結果をポップアップに返送
          try {
            debugLog('📥 Bridge scriptからレスポンス受信:', event.data);

            if (event.data.success) {
              // 成功時のレスポンス
              sendResponse({ success: true, data: event.data.data });
            } else {
              // エラー時のレスポンス
              sendResponse({ success: false, error: event.data.error || '不明なエラーが発生しました' });
            }
          } catch (error) {
            debugError('❌ ポップアップへのレスポンス送信エラー:', error);
          }
        };

        // リソースクリーンアップ関数（メモリリーク防止）
        const cleanupResources = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          window.removeEventListener('message', messageListener);
        };

        // bridge scriptからのレスポンスを待機するメッセージリスナーを登録
        window.addEventListener('message', messageListener);

        // タイムアウト設定（APIの実行時間を考慮した適切な時間）
        const TIMEOUT_MS = 10000; // 10秒
        timeoutId = window.setTimeout(() => {
          if (!isResponseSent) {
            isResponseSent = true;
            cleanupResources();
            sendResponse({
              success: false,
              error: `タイムアウト: ${TIMEOUT_MS / 1000}秒以内にレスポンスがありませんでした`
            });
          }
        }, TIMEOUT_MS);

        // 非同期レスポンスのためにメッセージチャンネルを開いたままにする
        return true;
      } catch (error) {
        debugError('❌ メッセージ処理中にエラーが発生:', error);
        sendResponse({
          success: false,
          error: 'メッセージ処理中に予期しないエラーが発生しました'
        });
        return false;
      }
    }

    // kintoneメソッド呼び出し以外のメッセージタイプは処理しない
    return false;
  });
}

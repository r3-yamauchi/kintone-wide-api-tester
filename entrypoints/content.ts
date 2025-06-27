import { DEBUG_MODE, debugLog, debugWarn, debugError } from '@/config/debug';

/**
 * kintone JavaScript API テスター用コンテンツスクリプト
 * 
 * このスクリプトはkintoneドメイン（*.cybozu.com, *.kintone.com）で実行され、
 * ブラウザ拡張機能のポップアップからのリクエストを受けて、
 * kintone JavaScript APIメソッドを実行します。
 * 
 * 技術的な背景：
 * - ブラウザ拡張機能のポップアップは独立したコンテキストで動作するため、
 *   Webページ上のkintoneオブジェクトに直接アクセスできません
 * - そのため、kintone-bridge.jsをメインワールドに注入し、
 *   window.postMessageを使用してコンテキスト間の通信を行います
 */
export default defineContentScript({
  // 対象ドメイン：kintoneとcybozuのすべてのページ
  matches: ['*://*.cybozu.com/*', '*://*.kintone.com/*'],
  // ページの読み込み完了後に実行（kintoneオブジェクトが確実に利用可能になるため）
  runAt: 'document_idle',

  main() {
    try {
      debugLog('🚀 Content script 初期化開始');
      debugLog('🔍 現在のURL:', window.location.href);
      debugLog('🔍 kintoneオブジェクトの存在:', typeof (window as any).kintone !== 'undefined');

      // セキュリティ強化: スクリプト注入の安全性を向上
      injectBridgeScript();
      setupMessageHandler();

      debugLog('✅ Content script 初期化完了');
    } catch (error) {
      debugError('❌ Content script 初期化エラー:', error);
    }
  },
});

/**
 * bridge script を安全に注入する関数
 */
function injectBridgeScript(): void {
  try {
    // kintone-bridge.jsをメインワールド（ページのJavaScriptコンテキスト）に注入
    // これにより、注入されたスクリプトがkintoneオブジェクトにアクセス可能になります
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('/kintone-bridge.js');

    // エラーハンドリングの追加
    script.onerror = () => {
      debugError('kintone-bridge.js の読み込みに失敗しました');
    };
    script.onload = () => {
      debugLog('✅ kintone-bridge.js を正常に読み込みました');
    };

    // DOMに安全に追加
    const head = document.head || document.documentElement;
    if (head) {
      head.appendChild(script);
    } else {
      throw new Error('DOMのhead要素が見つかりません');
    }
  } catch (error) {
    debugError('Bridge script 注入エラー:', error);
    throw error;
  }
}

/**
 * メッセージハンドリングの設定
 */
function setupMessageHandler(): void {
  // ポップアップからのメッセージを受信するリスナーを設定
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    debugLog('📨 メッセージ受信:', message);

    // セキュリティチェック: メッセージの検証
    if (!message || typeof message !== 'object') {
      debugWarn('⚠️ 無効なメッセージ形式:', message);
      return false;
    }

    // kintoneメソッド呼び出しリクエストの場合のみ処理
    if (message.action === 'callKintoneMethod') {
      // メソッド名の検証
      if (typeof message.method !== 'string' || !message.method.trim()) {
        sendResponse({ success: false, error: '無効なメソッド名です' });
        return false;
      }

      try {
        debugLog(`📤 Bridge scriptにリクエスト送信: ${message.method.trim()}`);

        // メインワールドに注入したbridge scriptにリクエストを転送
        // window.postMessageを使用してコンテキスト間の通信を行います
        window.postMessage({
          type: 'KINTONE_METHOD_REQUEST',
          method: message.method.trim(),  // 実行するkintoneメソッド名
          args: message.args,             // メソッドの引数（現在は未使用）
          appId: message.appId            // 現在のアプリID（利用可能な場合）
        }, '*');

        // メモリリーク対策とタイムアウト管理のための状態管理
        let isResponseSent = false;
        let timeoutId: number;

        // bridge scriptからのレスポンスを待機するリスナーを設定
        const messageListener = (event: MessageEvent) => {
          // セキュリティチェック: 自分のウィンドウからのメッセージかつ正しいタイプのメッセージのみ処理
          if (event.source !== window ||
            !event.data ||
            event.data.type !== 'KINTONE_METHOD_RESPONSE') {
            return;
          }

          // 重複レスポンス防止
          if (isResponseSent) {
            return;
          }
          isResponseSent = true;

          // リソースのクリーンアップ
          cleanupResources();

          // 実行結果をポップアップに返送
          try {
            debugLog('📥 Bridge scriptからレスポンス受信:', event.data);

            if (event.data.success) {
              sendResponse({ success: true, data: event.data.data });
            } else {
              sendResponse({ success: false, error: event.data.error || '不明なエラーが発生しました' });
            }
          } catch (error) {
            debugError('❌ レスポンス送信エラー:', error);
          }
        };

        // リソースクリーンアップ関数
        const cleanupResources = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          window.removeEventListener('message', messageListener);
        };

        // メッセージリスナーを登録
        window.addEventListener('message', messageListener);

        // タイムアウト設定（設定可能な時間）
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
        debugError('メッセージ処理エラー:', error);
        sendResponse({
          success: false,
          error: 'メッセージ処理中にエラーが発生しました'
        });
        return false;
      }
    }

    // その他のメッセージタイプは処理しない
    return false;
  });
}

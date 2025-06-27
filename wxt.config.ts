import { defineConfig } from 'wxt';

/**
 * WXT（Web Extension Toolkit）設定ファイル
 * 
 * ブラウザ拡張機能のビルド設定とマニフェスト設定を定義します。
 * 
 * @see https://wxt.dev/api/config.html
 */
export default defineConfig({
  manifest: {
    // ブラウザ拡張機能が必要とする権限
    permissions: [
      'activeTab'  // アクティブなタブにアクセスして、kintoneページと通信するために必要
    ],
    
    // Webページからアクセス可能なリソースを定義
    // kintone-bridge.jsをメインワールドに注入するために必要
    web_accessible_resources: [{
      resources: ['kintone-bridge.js'],  // 公開するファイル
      matches: [
        '*://*.cybozu.com/*',   // cybozu.comドメインでのみアクセス可能
        '*://*.kintone.com/*'   // kintone.comドメインでのみアクセス可能
      ]
    }],
    
    // セキュリティ強化: Content Security Policy (CSP) の設定
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; worker-src 'self';"
    },
    
    // ホスト権限の明示的な定義（より厳密なセキュリティ）
    host_permissions: [
      '*://*.cybozu.com/*',
      '*://*.kintone.com/*'
    ]
  }
});

/**
 * バックグラウンドスクリプト
 * 
 * ブラウザ拡張機能のバックグラウンドで常駐するスクリプトです。
 * 現在は拡張機能の初期化確認とライフサイクル管理を行います。
 */
export default defineBackground(() => {
  try {
    // 拡張機能の初期化
    initializeExtension();

    // ライフサイクルイベントの設定
    setupLifecycleEvents();

  } catch (error) {
    console.error('kintone JavaScript API Tester バックグラウンドスクリプト初期化エラー:', error);
  }
});

/**
 * 拡張機能の初期化処理
 */
function initializeExtension(): void {
  const manifest = browser.runtime.getManifest();

  console.log('kintone JavaScript API Tester バックグラウンドスクリプト開始', {
    extensionId: browser.runtime.id,
    version: manifest.version,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
}

/**
 * ライフサイクルイベントの設定
 */
function setupLifecycleEvents(): void {
  // 拡張機能のインストール/更新時の処理
  browser.runtime.onInstalled.addListener((details) => {
    console.log('kintone JavaScript API Tester インストール/更新イベント:', {
      reason: details.reason,
      version: details.previousVersion || '新規インストール',
      timestamp: new Date().toISOString()
    });

    // 新規インストール時の初期化処理
    if (details.reason === 'install') {
      handleFirstInstall();
    }

    // アップデート時の処理
    if (details.reason === 'update') {
      handleUpdate(details.previousVersion);
    }
  });

  // 拡張機能の起動時の処理
  browser.runtime.onStartup.addListener(() => {
    console.log('kintone JavaScript API Tester 起動イベント:', {
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * 新規インストール時の初期化処理
 */
function handleFirstInstall(): void {
  console.log('🎉 kintone JavaScript API Tester へようこそ！');

  // 将来的に初期設定やウェルカムメッセージなどを追加予定
}

/**
 * アップデート時の処理
 * 
 * @param previousVersion - 前のバージョン
 */
function handleUpdate(previousVersion?: string): void {
  console.log(`🔄 kintone JavaScript API Tester アップデート完了: ${previousVersion} → ${browser.runtime.getManifest().version}`);

  // 将来的にバージョン間のマイグレーション処理などを追加予定
}

/**
 * バックグラウンドスクリプト
 * 
 * ブラウザ拡張機能のバックグラウンドで常駐するスクリプトです。
 * kintoneワイドコースAPIテスターの初期化確認とライフサイクル管理を行います。
 * 拡張機能のインストール、更新、起動時の処理を管理します。
 */
export default defineBackground(() => {
  try {
    // 拡張機能の初期化処理を実行
    initializeExtension();

    // ライフサイクルイベントリスナーを設定
    setupLifecycleEvents();

  } catch (error) {
    console.error('kintone ワイドコースAPI テスター バックグラウンドスクリプト初期化エラー:', error);
  }
});

/**
 * 拡張機能の初期化処理
 * 
 * マニフェスト情報を取得してバックグラウンドスクリプトの開始をログに記録します。
 * 拡張機能ID、バージョン、タイムスタンプ、ユーザーエージェントを含む詳細情報を出力します。
 */
function initializeExtension(): void {
  const manifest = browser.runtime.getManifest();

  console.log('kintone ワイドコースAPI テスター バックグラウンドスクリプト開始', {
    extensionId: browser.runtime.id,
    version: manifest.version,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
}

/**
 * ライフサイクルイベントリスナーの設定
 * 
 * 拡張機能のインストール、更新、起動時のイベントハンドラーを設定します。
 * 各イベントで適切なログ出力と初期化処理を行います。
 */
function setupLifecycleEvents(): void {
  // 拡張機能のインストール/更新時のイベントハンドラー
  browser.runtime.onInstalled.addListener((details) => {
    console.log('kintone ワイドコースAPI テスター インストール/更新イベント:', {
      reason: details.reason,
      version: details.previousVersion || '新規インストール',
      timestamp: new Date().toISOString()
    });

    // 新規インストール時の初期化処理を実行
    if (details.reason === 'install') {
      handleFirstInstall();
    }

    // アップデート時の処理を実行
    if (details.reason === 'update') {
      handleUpdate(details.previousVersion);
    }
  });

  // 拡張機能の起動時のイベントハンドラー
  browser.runtime.onStartup.addListener(() => {
    console.log('kintone ワイドコースAPI テスター 起動イベント:', {
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * 新規インストール時の初期化処理
 * 
 * 拡張機能が初めてインストールされた時に実行される処理です。
 * ウェルカムメッセージを表示し、将来的には初期設定なども行う予定です。
 */
function handleFirstInstall(): void {
  console.log('🎉 kintone ワイドコースAPI テスター へようこそ！');

  // 将来的に初期設定やウェルカムメッセージなどを追加予定
  // 例：初期設定値の保存、使用方法の案内など
}

/**
 * アップデート時の処理
 * 
 * 拡張機能がアップデートされた時に実行される処理です。
 * バージョン情報をログに記録し、必要に応じてマイグレーション処理を行います。
 * 
 * @param previousVersion - アップデート前のバージョン番号（undefined の場合は不明）
 */
function handleUpdate(previousVersion?: string): void {
  const currentVersion = browser.runtime.getManifest().version;
  console.log(`🔄 kintone ワイドコースAPI テスター アップデート完了: ${previousVersion || '不明'} → ${currentVersion}`);

  // 将来的にバージョン間のマイグレーション処理などを追加予定
  // 例：設定の移行、新機能の通知、データ形式の変換など
}

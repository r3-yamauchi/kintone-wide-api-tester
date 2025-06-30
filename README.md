# kintone ワイドコース専用API テストツール

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/r3-yamauchi/kintone-wide-api-tester)

kintoneの使用状況統計情報を取得するブラウザ拡張機能です。  
アプリとスペースの統計情報を一括取得し、DevTools の Console に結果を表示します。

## 🎯 概要

この拡張機能は [kintone REST API](https://cybozu.dev/ja/kintone/docs/rest-api/) の統計情報エンドポイントを使用して、
アプリとスペースの使用状況データを効率的に取得できるツールです。

### 主な機能

- **アプリID自動取得**: 最初に`kintone.app.getId()`を実行してアプリIDを取得・記憶
- **アプリアイコン取得**: アプリID取得成功時に`kintone.app.getIcons([appId])`を自動実行
- **アプリ統計情報取得**: `/k/v1/apps/statistics.json` でアプリの使用状況を取得
- **スペース統計情報取得**: `/k/v1/spaces/statistics.json` でスペースの使用状況を取得
- **インテリジェントなUI**: kintone画面以外では適切なガイダンスを表示し、ボタンを非表示
- **堅牢なエラーハンドリング**: 403、401、404、500エラーが発生しても処理を継続し、詳細なエラー情報を出力
- **詳細なログ出力**: 各APIの実行結果をDevToolsのConsoleに見やすく表示
- **統計情報**: 成功・エラーの件数を表示
- **デバッグモード**: 開発時の詳細なログ出力を制御

## 🚀 使用方法

### 1. インストール

1. [https://github.com/r3-yamauchi/kintone-wide-api-tester/releases](https://github.com/r3-yamauchi/kintone-wide-api-tester/releases) から [kintone-wide-api-tester-1.0.0-chrome.zip](https://github.com/r3-yamauchi/kintone-wide-api-tester/releases/download/1.0.0/kintone-wide-api-tester-1.0.0-chrome.zip) をダウンロード
2. ダウンロードしたzipファイルを展開
3. Chrome拡張機能管理画面（`chrome://extensions/`）で「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」で zipファイルを展開したフォルダを選択

### 2. 基本的な使い方

1. kintoneアプリページを開く（例：`https://your-domain.cybozu.com/k/123/`）
2. 拡張機能アイコンをクリック
3. 「Get App Statistics」ボタンをクリック
4. DevToolsのConsoleタブで実行結果を確認

### 3. 実行例

```
====================================
🚀 kintone Wide API Tester 実行開始
====================================

🔧 初期設定: アプリID取得中...
✅ アプリID取得成功: 768

🔧 実行: kintone.app.getIcons() でアプリアイコン取得中...
✅ kintone.app.getIcons([768]) 結果:
   [
     {
       "app": "768",
       "url": "https://example.cybozu.com/k/api/app/icon?app=768&key=APP39"
     }
   ]

📊 統計情報を取得中...

📝 アプリの使用状況を取得 /k/v1/apps/statistics.json 実行中...
✅ アプリの使用状況を取得 /k/v1/apps/statistics.json 結果:
   {
     "apps": [
       {
         "appId": "768",
         "appName": "プロセス管理",
         "recordsCount": 1250,
         "viewsCount": 8,
         "fieldsCount": 25,
         "actionsCount": 3,
         "processesCount": 1,
         "filesSize": 5242880
       }
     ]
   }

📊 スペース統計情報を取得中...

📝 スペースの使用状況を取得 /k/v1/spaces/statistics.json 実行中...
✅ スペースの使用状況を取得 /k/v1/spaces/statistics.json 結果:
   {
     "spaces": [
       {
         "spaceId": "123",
         "spaceName": "開発チーム",
         "appsCount": 15,
         "threadsCount": 245,
         "membersCount": 12,
         "filesSize": 104857600
       }
     ]
   }

====================================
🎉 kintone Wide API Tester 実行完了
✅ 成功: 2件
❌ エラー: 0件
📊 合計: 2件
====================================
```

### 4. 取得できる統計情報

#### アプリ統計情報 (`/k/v1/apps/statistics.json`)
- アプリID、アプリ名
- レコード数、ビュー数、フィールド数
- アクション数、プロセス数
- ファイルサイズ

#### スペース統計情報 (`/k/v1/spaces/statistics.json`)
- スペースID、スペース名
- アプリ数、スレッド数、メンバー数
- ファイルサイズ

詳細な仕様については以下のドキュメントを参照してください：
- [アプリ統計情報API](https://cybozu.dev/ja/kintone/docs/rest-api/apps/get-apps-statistics/)
- [スペース統計情報API](https://cybozu.dev/ja/kintone/docs/rest-api/spaces/get-spaces-statistics/)

## 🏗️ アーキテクチャ

### 技術スタック

- **フレームワーク**: [WXT](https://wxt.dev/) - Web Extension Toolkit
- **言語**: TypeScript
- **ビルドツール**: Vite 6.3.5
- **対象ブラウザ**: Chrome (Manifest V3), Firefox
- **パッケージサイズ**: ~48KB

### プロジェクト構造

```
kintone-wide-api-tester/
├── entrypoints/              # 拡張機能のエントリーポイント
│   ├── background.ts         # バックグラウンドスクリプト
│   ├── content.ts           # コンテンツスクリプト（クロスコンテキスト通信）
│   └── popup/               # ポップアップUI
│       ├── index.html       # ポップアップHTML
│       ├── main.ts         # ポップアップメインロジック
│       └── style.css       # ポップアップスタイル（警告・エラー対応）
├── public/                  # 公開アセット
│   ├── kintone-bridge.js   # kintone REST API実行ブリッジスクリプト（~20KB）
│   └── icon/               # 拡張機能アイコン
├── config/                  # 設定ファイル
│   └── debug.ts            # デバッグモード設定
├── wxt.config.ts           # WXT設定ファイル
├── package.json            # npm設定
├── CLAUDE.md              # 開発者向け詳細仕様
└── README.md              # このファイル
```

### 通信フロー

```
┌─────────────┐    browser.tabs.sendMessage    ┌─────────────────────┐
│  Popup UI   │ ──────────────────────────────▶ │  Content Script     │
│ (isolated)  │                                │    (isolated)       │
└─────────────┘                                └─────────────────────┘
                                                         │
                                                window.postMessage
                                                         ▼
                                               ┌─────────────────────┐
                                               │  Bridge Script      │
                                               │   (main world)      │
                                               │                     │
                                               │ ▶ kintone.app.getId()│
                                               │ ▶ kintone.app.getIcons()│
                                               │ ▶ kintone.api('/k/v1/apps/statistics.json')│
                                               │ ▶ kintone.api('/k/v1/spaces/statistics.json')│
                                               └─────────────────────┘
```

### 実行フロー

1. **UI初期化**: ページドメインをチェックし、適切なUIを表示
2. **アプリID取得**: `kintone.app.getId()`を最初に実行
3. **アプリアイコン取得**: アプリID取得成功時に`kintone.app.getIcons([appId])`を実行
4. **アプリ統計情報取得**: `kintone.api('/k/v1/apps/statistics.json', 'GET')`を実行
5. **スペース統計情報取得**: `kintone.api('/k/v1/spaces/statistics.json', 'GET')`を実行
6. **エラーハンドリング**: エラー発生時も処理を継続
7. **統計表示**: 実行完了時に詳細な統計情報を表示

### セキュリティ機能

- **Content Security Policy**: スクリプトインジェクション攻撃を防止
- **Origin検証**: クロスコンテキスト通信の安全性強化
- **メッセージ検証**: 不正なデータやコマンドをブロック
- **深度制限**: 無限ループやスタックオーバーフローを防止
- **権限最小化**: 必要最小限の権限で動作

## 🛠️ 開発

### 開発コマンド

```bash
# 依存関係のインストール
npm install

# 開発モード（Chrome用）
npm run dev

# 開発モード（Firefox用）
npm run dev:firefox

# 本番ビルド
npm run build

# Firefox版ビルド
npm run build:firefox

# 配布用ZIPファイル作成
npm run zip

# Firefox版ZIPファイル作成
npm run zip:firefox

# 型チェック
npm run compile
```

### デバッグモード

詳細なデバッグログが必要な場合：

1. `config/debug.ts` の `DEBUG_MODE` を `true` に変更
2. `public/kintone-bridge.js` の `DEBUG_MODE` を `true` に変更
3. 拡張機能をリビルド（`npm run build`）

デバッグモードでは以下のログが追加で出力されます：
- Content script の初期化ログ
- メッセージの送受信ログ
- Bridge script の動作ログ
- kintoneオブジェクトの存在確認ログ
- 内部メソッドの実行ログ（`[内部メソッド]`として明示）

### 開発時の注意点

1. **コード変更時**: 拡張機能を再読み込みしてください
2. **デバッグ**: DevToolsのConsoleでログを確認できます
3. **対象ドメイン**: `*.cybozu.com` と `*.kintone.com` でのみ動作します
4. **TypeScript**: 厳密な型定義でコード品質を保証

### エラーハンドリング

この拡張機能は以下のエラーを適切に処理し、処理を継続します：

- **403 Forbidden**: 権限不足 - ログ出力して継続
- **401 Unauthorized**: 認証エラー - ログ出力して継続
- **404 Not Found**: リソースが見つからない - ログ出力して継続
- **500 Internal Server Error**: サーバーエラー - ログ出力して継続
- **Timeout**: タイムアウト（10秒） - ログ出力して継続

すべてのエラーは詳細な情報と共にログに記録され、統計情報に反映されます。

## 📚 関連リンク

- [kintone REST API リファレンス](https://cybozu.dev/ja/kintone/docs/rest-api/)
- [アプリ統計情報API](https://cybozu.dev/ja/kintone/docs/rest-api/apps/get-apps-statistics/)
- [スペース統計情報API](https://cybozu.dev/ja/kintone/docs/rest-api/spaces/get-spaces-statistics/)
- [kintone JavaScript API リファレンス](https://cybozu.dev/ja/kintone/docs/js-api/)
- [WXT Framework](https://wxt.dev/)
- [ブラウザ拡張機能開発ガイド](https://developer.chrome.com/docs/extensions/)

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開しています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

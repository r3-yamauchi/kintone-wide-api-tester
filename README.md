# kintone ワイドコース専用API テストツール

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/r3-yamauchi/kintone-wide-api-tester)

kintoneワイドコースAPIをテストするブラウザ拡張機能です。

## 🎯 概要

この拡張機能は `kintone.getAvailableApiTypes()` を実行して kintoneのワイドコースAPIを実行できる環境であるかを確認し、
[ワイドコース専用API](https://cybozu.dev/ja/kintone/docs/wide-api/about-wide-api/)
の動作確認を行い、DevToolsのConsoleに結果を表示します。

### 主な機能

- **ワイドコース確認**: `kintone.getAvailableApiTypes()` でWIDE APIの利用可否を自動チェック
- **契約なし時の適切な処理**: ワイドコース未契約の場合は明確なメッセージを表示して処理停止
- **ワイドコース専用REST API**: `/k/v1/apps/statistics.json` と `/k/v1/spaces/statistics.json` を実行
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

1. kintoneページを開く（例：`https://your-domain.cybozu.com/k/123/` or `https://your-domain.cybozu.com/k/` など）
2. 拡張機能アイコンをクリック
3. 「Test Wide Course APIs」ボタンをクリック
4. DevToolsのConsoleタブで実行結果を確認

### 💡 重要な注意事項

**この拡張機能はkintoneワイドコース契約が必要です。**

- ワイドコース未契約の環境では「ワイドコース契約が必要です」というメッセージが表示され、API実行は行われません
- ワイドコース契約がある環境でのみ、専用APIのテストが実行されます

### 3. 実行例

#### ✅ ワイドコース契約がある環境での実行例

```
====================================
🚀 kintone Wide API Tester 実行開始
====================================

🔍 ワイドコース利用可能性チェック中...
✅ ワイドコース確認: WIDE APIが利用可能です
   利用可能APIタイプ: ["CORE", "WIDE"]
   → ワイドコース専用API実行を開始します

🔧 実行: kintone.app.getAssignedApps() で作業者が自分に割り当てられているレコードのあるアプリ一覧を取得中...
✅ kintone.app.getAssignedApps() 結果:
  {
    "apps": [
      {
        "id": "1",
        "name": "アプリの名前",
        "url": "https://dev-demo.cybozu.com/k/1/?bview=ASSIGN",
        "recordCount": 1
      }
    ],
    "next": false
  }

📊 ワイドコース専用REST APIをテスト中...

📝 アプリ統計API /k/v1/apps/statistics.json 実行中...
✅ アプリ統計API /k/v1/apps/statistics.json 結果:
   {
     "apps": [
       {
         "id": "768",
         "name": "プロセス管理",
         "recordCount": "1250",
         "fieldCount": "25",
         "dailyRequestCount": "3",
         "storageUsage": "0",
         "customized": true
       }
     ]
   }

📝 スペース統計API /k/v1/spaces/statistics.json 実行中...
✅ スペース統計API /k/v1/spaces/statistics.json 結果:
   {
     "spaces": [
       {
         "id": "123",
         "name": "開発チーム",
         "administratorCount": "1",
         "memberCount": "1",
         "isPrivate": false,
         "isGuest": false
       }
     ]
   }

====================================
🎉 kintone ワイドコースAPI テスト完了
✅ 成功: 2件
❌ エラー: 0件
📊 合計: 2件
====================================
```

#### ❌ ワイドコース契約がない環境での実行例

```
====================================
🚀 kintone Wide API Tester 実行開始
====================================

🔍 ワイドコース利用可能性チェック中...
⚠️ ワイドコース確認: WIDE APIが利用できません
   利用可能APIタイプ: ["CORE"]
   → kintoneワイドコース契約が必要です。ワイドコース専用API実行をスキップします
```

ポップアップには「ワイドコース契約が必要です」と表示され、処理が停止されます。

#### API仕様ドキュメント
- [「ワイドコース専用API」とは](https://cybozu.dev/ja/kintone/docs/wide-api/about-wide-api/)
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
│   ├── kintone-bridge.js   # kintoneワイドコースAPI実行ブリッジスクリプト（~20KB）
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
                                               │ ▶ kintone.getAvailableApiTypes()│
                                               │ ▶ kintone.api() │
                                               │ ▶ ...               │
                                               └─────────────────────┘
```

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

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開しています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

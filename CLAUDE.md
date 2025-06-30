# CLAUDE.md

このファイルは、このリポジトリで作業する際のClaude Code (claude.ai/code) への指針を提供します。

## プロジェクト概要

このプロジェクトは、kintoneの使用状況統計情報を取得するブラウザ拡張機能です。kintone REST APIの統計情報エンドポイントを使用して、アプリとスペースの使用状況データを効率的に取得し、DevToolsのConsoleに結果を表示します。

### 最新バージョンの主要機能

- **アプリID自動取得**: `kintone.app.getId()`を最初に実行し、アプリIDを取得・記憶
- **アプリアイコン取得**: アプリID取得成功時に`kintone.app.getIcons([appId])`を自動実行
- **アプリ統計情報取得**: `/k/v1/apps/statistics.json` でアプリの使用状況を取得
- **スペース統計情報取得**: `/k/v1/spaces/statistics.json` でスペースの使用状況を取得
- **インテリジェントUI**: 非kintoneページでは適切なガイダンスを表示、ボタンを非表示
- **堅牢なエラーハンドリング**: 403、401、404、500、タイムアウトエラーでも処理継続
- **詳細な統計情報**: 成功・エラー件数の表示

## デバッグモード

デフォルトでは、拡張機能は重要なkintone REST API実行結果のみをコンソールに出力します。
詳細なデバッグログが必要な場合は、以下の手順でデバッグモードを有効にしてください：

1. `config/debug.ts` の `DEBUG_MODE` を `true` に変更
2. `public/kintone-bridge.js` の `DEBUG_MODE` を `true` に変更
3. 拡張機能をリビルド（`npm run build` または `npm run dev`）

デバッグモードでは以下のログが追加で出力されます：
- Content script の初期化ログ
- メッセージの送受信ログ
- Bridge script の動作ログ
- kintoneオブジェクトの存在確認ログ
- 内部メソッドの実行ログ（`[内部メソッド]`として明示）
- API URL の生成ログ

## エラーハンドリング

この拡張機能は403エラー（権限不足）などが発生しても処理を継続するように設計されています：

- **403 Forbidden**: 権限が必要なAPIでも、エラーログを出力して次のメソッドに継続
- **401 Unauthorized**: 認証エラーも同様に継続
- **404 Not Found**: リソースが見つからない場合も継続
- **500 Internal Server Error**: サーバーエラーも継続
- **Timeout**: タイムアウトエラーも継続

すべてのエラーは詳細な情報と共にログに記録され、統計情報に反映されます。

詳細なデバッグログが必要な場合は、以下の手順でデバッグモードを有効にしてください：

1. `config/debug.ts` の `DEBUG_MODE` を `true` に変更
2. `public/kintone-bridge.js` の `DEBUG_MODE` を `true` に変更  
3. 拡張機能をリビルド（`npm run build` または `npm run dev`）

デバッグモードでは以下のログが追加で出力されます：

- Content script の初期化ログ
- メッセージの送受信ログ
- Bridge script の動作ログ
- kintoneオブジェクトの存在確認ログ

## 開発コマンド

### 基本的な開発コマンド

- `npm run dev` - 開発モード（Chrome用）で拡張機能を起動
- `npm run dev:firefox` - Firefox用の開発モードで起動
- `npm run build` - Chrome用の本番ビルド
- `npm run build:firefox` - Firefox用の本番ビルド
- `npm run zip` - Chrome用の配布用ZIPファイルを作成
- `npm run zip:firefox` - Firefox用の配布用ZIPファイルを作成
- `npm run compile` - TypeScriptの型チェック（コンパイルなし）

### 開発・デバッグ時の注意事項

- コード変更後は拡張機能の再読み込みが必要です
- 実行結果の確認はDevToolsのConsoleタブで行います
- 対象ドメインは`*.cybozu.com`と`*.kintone.com`のみです

## アーキテクチャとプロジェクト構造

このプロジェクトは[WXT](https://wxt.dev/)フレームワークを使用したブラウザ拡張機能です。

### 主要な機能

- **アプリID自動取得**: 最初に`kintone.app.getId()`を実行してアプリIDを取得・記憶
- **アプリアイコン取得**: アプリID取得成功時に`kintone.app.getIcons([appId])`を自動実行
- **アプリ統計情報取得**: `kintone.api('/k/v1/apps/statistics.json', 'GET')`でアプリの使用状況を取得
- **スペース統計情報取得**: `kintone.api('/k/v1/spaces/statistics.json', 'GET')`でスペースの使用状況を取得
- **インテリジェントUI**: 非kintoneページでは適切なガイダンスメッセージを表示し、ボタンを非表示
- **堅牢なエラーハンドリング**: 403、401、404、500、タイムアウトエラーが発生しても処理を継続
- **詳細なログ出力**: 各APIの実行結果をDevToolsのConsoleに見やすく表示
- **統計情報**: 成功・エラーの件数を表示
- **内部メソッド制御**: デバッグモード以外では内部処理メソッドのログを非表示

### ディレクトリ構造

```text
kintone-wide-api-tester/
├── entrypoints/              # 拡張機能のエントリーポイント
│   ├── background.ts         # バックグラウンドスクリプト
│   ├── content.ts           # コンテンツスクリプト（クロスコンテキスト通信）
│   └── popup/               # ポップアップUI
│       ├── index.html       # ポップアップHTML
│       ├── main.ts         # ポップアップメインロジック
│       └── style.css       # ポップアップスタイル
├── public/                  # 公開アセット
│   ├── kintone-bridge.js   # kintone REST API実行ブリッジスクリプト
│   └── icon/               # 拡張機能アイコン
├── wxt.config.ts           # WXT設定ファイル
└── package.json            # npm設定
```

### 重要なファイルの説明

#### `entrypoints/popup/main.ts`

- ポップアップUIのメインロジック（動的UI生成）
- kintone REST APIの実行統制とエラーハンドリング
- アプリID自動取得とアプリアイコン取得機能
- アプリ統計情報とスペース統計情報の取得
- 実行結果のフォーマットと表示
- 非kintoneページでのガイダンス表示制御

#### `entrypoints/content.ts`

- コンテンツスクリプト（isolated world）
- ポップアップとbridge scriptの間のメッセージ中継
- browser.tabs.sendMessageとwindow.postMessageの橋渡し

#### `public/kintone-bridge.js`

- メインワールドで実行されるブリッジスクリプト（~20KB）
- kintoneオブジェクトに直接アクセスしてAPIを実行
- `kintone.api()`を使用した統計情報APIの実行
- DOM要素の文字列変換
- DevToolsコンソールへの実行結果ログ出力
- 内部メソッドとkintone APIメソッドの適切な区別表示
- HTTPエラー（403、401、404、500）の詳細情報付きエラーハンドリング
- APIのURLに応じた適切なログメッセージ表示

#### `wxt.config.ts`

- マニフェスト設定（permissions、web_accessible_resources）
- kintoneドメインでのみ動作するよう制限

#### `config/debug.ts`

- デバッグモードの一元管理
- ログ出力関数の定義（debugLog、debugWarn、debugError、apiLog）
- TypeScript型安全性を確保

#### `entrypoints/popup/style.css`

- ポップアップUIのスタイル定義
- 警告・エラーメッセージ用の専用スタイル
- ライトモード・ダークモード対応

### 技術的アーキテクチャ

#### クロスコンテキスト通信フロー

```text
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
                                               │ ▶ kintone.getDomain()│
                                               │ ▶ kintone.app.get() │
                                               │ ▶ ...               │
                                               └─────────────────────┘
```

#### なぜこの複雑な構造が必要なのか

- **セキュリティ制約**: ブラウザ拡張機能のコンテンツスクリプトは分離されたワールドで実行され、ページのJavaScriptオブジェクトに直接アクセスできません
- **kintoneアクセス**: kintoneオブジェクトはWebページのメインワールドにのみ存在するため、bridge scriptの注入が必要です
- **通信方式**: window.postMessageを使用してコンテキスト間でデータを安全にやり取りします

### WXT設定とマニフェスト

- TypeScriptとViteベースのビルドシステム
- モジュールパスエイリアス: `@/` はプロジェクトルートを指す
- WXTが自動的に`manifest.json`を生成し、ビルドプロセスを管理
- `.wxt/` ディレクトリには自動生成されるファイルが含まれる（gitignore対象）

### 重要な技術的実装詳細

#### API実行フロー

1. **アプリID取得**: `kintone.app.getId()`を最初に実行
2. **アプリアイコン取得**: アプリID取得成功時に`kintone.app.getIcons([appId])`を実行
3. **アプリ統計情報取得**: `kintone.api('/k/v1/apps/statistics.json', 'GET')`を実行
4. **スペース統計情報取得**: `kintone.api('/k/v1/spaces/statistics.json', 'GET')`を実行

#### 取得可能な統計情報

**アプリ統計情報 (`/k/v1/apps/statistics.json`)**
- アプリID、アプリ名
- レコード数、ビュー数、フィールド数
- アクション数、プロセス数
- ファイルサイズ

**スペース統計情報 (`/k/v1/spaces/statistics.json`)**
- スペースID、スペース名
- アプリ数、スレッド数、メンバー数
- ファイルサイズ

#### エラーハンドリングとパフォーマンス

- **DOM要素処理**: DOM要素は安全に文字列表現に変換
- **包括的例外処理**: 全段階で多層のtry-catch構造を実装
- **HTTPエラー対応**: 403、401、404、500エラーを詳細分類して適切にログ出力
- **処理継続**: エラー発生時も必ず次のメソッドに進む設計
- **メモリ管理**: イベントリスナーの適切なクリーンアップ
- **タイムアウト**: 設定可能なタイムアウト（デフォルト10秒）
- **順次実行**: 各APIを順次実行し、エラー発生時も処理を継続
- **適応的ログ**: APIのURLに応じてログメッセージを適切に表示

## 開発時の注意事項

### コード変更時

1. 拡張機能の再読み込みが必要です
2. TypeScriptの型チェックは`npm run compile`で実行
3. ビルドエラーは`.wxt/`ディレクトリを削除して再ビルドすることで解決する場合があります
4. デバッグモードの変更時は、TypeScriptとJavaScript両方のファイルを同期する必要があります

### デバッグとテスト

1. kintoneページ（`*.cybozu.com`または`*.kintone.com`）でのみ動作します
2. DevToolsのConsoleでAPI実行結果を確認します
   - 非デバッグモード: kintone REST APIの実行結果のみ
   - デバッグモード: 内部処理も含む詳細ログ
3. 非kintoneページでは適切なガイダンスが表示されることを確認します
4. エラーハンドリングのテストには403エラーが発生しやすいAPIを使用します
5. ネットワークタブでAPI通信を監視できます

### セキュリティと品質保証

#### セキュリティ対策

- **Content Security Policy (CSP)**: スクリプトインジェクション攻撃を防止
- **Origin検証**: クロスコンテキスト通信の安全性強化
- **メッセージ検証**: 不正なデータやコマンドをブロック
- **深度制限**: 無限ループやスタックオーバーフローを防止
- **権限最小化**: 必要最小限の権限で動作

#### コード品質

- **TypeScript型安全性**: `any`型を排除し厳密な型定義
- **エラーハンドリング**: 包括的な例外処理とログ出力
- **メモリ管理**: リスナーの適切なクリーンアップ
- **パフォーマンス**: 非同期処理とタイムアウト管理

#### 本番環境での使用注意

- APIキーや認証情報はログに出力されない
- 統計情報APIのみを実行し、データの変更は行わない
- 適切な権限管理とモニタリングが必要
- HTTPエラー（403、401、404、500）は正常な動作として扱われる
- 内部メソッドのログは本番環境では非表示

### ビルドとデプロイ

```bash
# 品質チェック
npm run compile  # TypeScript型チェック
npm run build    # Chrome版ビルド
npm run build:firefox  # Firefox版ビルド

# 配布用パッケージ作成
npm run zip      # Chrome版ZIP
npm run zip:firefox  # Firefox版ZIP
```

## コンソール出力仕様

この拡張機能は、kintone REST APIの実行結果をkintoneページのDevToolsコンソールに出力します。

### ログ出力の種類

1. **API実行ログ**:
   - `📝 アプリの使用状況を取得 /k/v1/apps/statistics.json 実行中...`
   - `📝 スペースの使用状況を取得 /k/v1/spaces/statistics.json 実行中...`
2. **成功結果ログ**:
   - `✅ アプリの使用状況を取得 /k/v1/apps/statistics.json 結果:`
   - `✅ スペースの使用状況を取得 /k/v1/spaces/statistics.json 結果:`
3. **エラーログ**:
   - `❌ アプリの使用状況を取得 /k/v1/apps/statistics.json エラー:`
   - `❌ スペースの使用状況を取得 /k/v1/spaces/statistics.json エラー:`
4. **統計情報**: 実行完了時の成功・エラー件数

### デバッグモード別出力

- **非デバッグモード** (`DEBUG_MODE = false`): kintone REST APIの実行結果のみ
- **デバッグモード** (`DEBUG_MODE = true`): 内部処理を含む詳細ログ

### 内部メソッドの処理

以下の内部メソッドは、非デバッグモードではログが非表示となります：
- `logInitialSetup` - 初期設定ログ
- `logAppIdSuccess` - アプリID取得成功ログ
- `logAppIdFailure` - アプリID取得失敗ログ
- `logAppIdError` - アプリID取得エラーログ
- `logIconsStart` - アイコン取得開始ログ
- `showExecutionSummary` - 実行結果サマリー

デバッグモードでは、これらのメソッドに`[内部メソッド]`のプレフィックスが付いて表示されます。

---

**最終更新**: 2025年6月30日  
**バージョン**: v2.0.0  
**主要機能**: アプリ・スペース統計情報取得、アプリID自動取得、堅牢なエラーハンドリング、インテリジェントUI、内部メソッドログ制御、TypeScript完全対応

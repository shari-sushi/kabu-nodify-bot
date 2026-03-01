# kabu-notify-bot - Claude向けプロジェクトガイド

## プロジェクト概要

日本株の株価情報をDiscordチャンネルに定期配信するDiscord Bot。
チャンネルごとに銘柄とスケジュールを管理し、指定された時刻に株価チャートと情報を投稿する。

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js
- **Discord**: discord.js v14
- **データベース**: SQLite (better-sqlite3)
- **株価取得**: yahoo-finance2
- **チャート生成**: chart.js + chartjs-node-canvas
- **スケジューラ**: node-cron
- **フォーマッター**: Prettier

## アーキテクチャ

### ディレクトリ構造

```txt
src/
├── commands/          # Discordスラッシュコマンド実装
│   ├── add-stock.ts       # 銘柄追加
│   ├── remove-stock.ts    # 銘柄削除
│   ├── set-schedule.ts    # スケジュール設定
│   ├── remove-schedule.ts # スケジュール削除
│   ├── list.ts            # 設定一覧表示
│   └── help.ts            # ヘルプ表示
├── db/                # データベース層
│   ├── schema.ts          # マイグレーション定義
│   └── repository.ts      # データアクセス層
├── services/          # ビジネスロジック
│   ├── stock.ts           # 株価取得処理
│   ├── chart.ts           # チャート画像生成
│   ├── scheduler.ts       # cron登録・管理
│   └── schedule-parser.ts # スケジュール文字列パース
├── config.ts          # 環境変数・設定
├── index.ts           # エントリポイント
└── deploy-commands.ts # スラッシュコマンド登録スクリプト
```

### データベーススキーマ

**channels**: チャンネル情報

- channel_id (PK)
- guild_id

**stocks**: 銘柄マスタ

- id (PK)
- ticker (銘柄コード, UNIQUE)
- name (銘柄名)

**channel_stocks**: チャンネル×銘柄の中間テーブル

- channel_id (FK)
- stock_id (FK)
- added_by (追加したユーザーID)
- created_at

**schedules**: 通知スケジュール

- id (PK)
- channel_id (FK)
- cron_expression (cron形式)

### コマンドプレフィックス

全てのDiscordスラッシュコマンドは `kabu-` プレフィックスが付く。
定義: [src/config.ts](src/config.ts#L12)

**利用可能なコマンド**:

- `/kabu-add-stock <銘柄コード>` - 銘柄追加
- `/kabu-remove-stock <銘柄コード>` - 銘柄削除
- `/kabu-set-schedule <曜日> <時刻1> [時刻2] [時刻3]` - スケジュール設定
- `/kabu-remove-schedule <ID>` - スケジュール削除
- `/kabu-list` - 設定一覧表示
- `/kabu-help` - ヘルプ表示

## 主要コンポーネント

### 1. コマンドハンドラ ([src/index.ts](src/index.ts))

- スラッシュコマンドの登録とルーティング
- エラーハンドリング
- Graceful shutdown処理

### 2. Repository ([src/db/repository.ts](src/db/repository.ts))

データベースへのアクセスを抽象化:

- チャンネル・銘柄・スケジュールのCRUD操作
- トランザクション管理

### 3. Scheduler ([src/services/scheduler.ts](src/services/scheduler.ts))

node-cronを使用した定期実行管理:

- DB上のスケジュールをcronジョブとして登録
- 指定時刻に株価情報を投稿
- ジョブの追加・削除・再登録

### 4. Stock Service ([src/services/stock.ts](src/services/stock.ts))

yahoo-finance2を利用した株価データ取得:

- 日本株の場合は `.T` サフィックスを付与 (例: 7203.T)
- 過去データの取得と整形

### 5. Chart Service ([src/services/chart.ts](src/services/chart.ts))

chart.jsでローソク足チャートを生成し、PNG画像として返す:

- Canvas APIを使用
- Discord添付ファイルとして送信可能な形式

## 開発時の注意点

### コマンドの追加・変更

1. `src/commands/` に新しいコマンドファイルを作成
2. `SlashCommandBuilder` でコマンド定義
3. `execute` 関数で処理実装
4. [src/index.ts](src/index.ts) でインポート・登録
5. `npm run deploy-commands` でDiscordに登録

### プレフィックス変更

`COMMAND_PREFIX` を変更する場合:

- [src/config.ts](src/config.ts#L12) の定数を変更
- コマンド再デプロイが必要

### データベース変更

- [src/db/schema.ts](src/db/schema.ts) の `MIGRATIONS` 配列に追記
- マイグレーションは起動時に自動実行
- **注意**: ロールバック機能はないため、ALTER TABLEは慎重に

### フォーマット

```bash
npm run format
```

Prettierによる自動整形。コミット前に実行推奨。

## 環境変数

```bash
DISCORD_BOT_TOKEN=your_token      # 必須
DISCORD_CLIENT_ID=your_client_id  # 必須
DB_PATH=./data/kabu-notify.db     # オプション（デフォルト値あり）
```

## デプロイ

### Railway

- ビルド: `npm run build`
- 起動: `npm start`
- Volume: `/app/data` をマウント (SQLiteデータ永続化)
- 環境変数をダッシュボードで設定

## 既知の制約

- 株価データは yahoo-finance2 に依存（APIの可用性に注意）
- SQLiteのため大規模サーバーには不向き（単一ファイルDB）
- スケジュール変更時はBotの再起動またはスケジュール再登録が必要

## コーディング規約

- TypeScript strictモード有効
- Prettierの設定に従う
- 非同期処理は async/await を使用
- エラーハンドリングは必須（特にDiscordインタラクション）
- **UI関連のロジックは純粋関数に切り出し、単体テストによるTDDで開発すること**
  - Discord Embed生成、チャート描画、メッセージフォーマットなどのUI処理(画像のテストは不要)
  - 副作用を持たない純粋関数として実装し、テスタビリティを確保
  - 実装前にテストケースを作成し、Red-Green-Refactorサイクルで開発

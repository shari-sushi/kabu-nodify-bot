# kabu-notify-bot

## 前置き

この開発は、意図的にAI任せの領域を増やし、どこまで簡単に、手間をかけずに開発できるかの実験でもあります。

[初期実装](<https://github.com/shari-sushi/kabu-notify-discord-bot/tree/6ad04ce88df07ff6e4c69a7a2417045b294f8b81>)である  
<img src="https://pbs.twimg.com/media/HCOC4pibgAA6OsV?format=jpg&name=large" alt="初期実装のスクリーンショット" width="300" />  
までは全てClaude.aiが作りました。
初期構想を伝えて出力されたプロジェクト全体の設計に修正指示を出したのみで、エディターやターミナルを使わずにClaude, GitHub, Railwayの各ブラウザだけで完結させました。
そこまではGUIの見方、操作方法の指南書があれば非エンジニアでもなんとか作れたのではないかと思います。
<https://claude.ai/share/6eff4a8a-6500-40e1-b1e9-3e931b7f76df>
(1度ミスった時に`git reset --hard`だけVScodeでやりましたが。)

その後は__あまりコードを読まず__にClaude code上でバイブコーディングモドキで開発しています。
(他の個人プロジェクトの開発の隙間で片手間にやってます)

---

Discord bot で日本株の株価通知を定期配信する。

## コマンド一覧

- `/kabu-list` — そのDiscordサーバーの全設定を表示（銘柄・スケジュール）
- `/kabu-add-stock <銘柄コード>` — そのチャンネルで通知する銘柄を追加
- `/kabu-remove-stock <銘柄コード>` — そのチャンネルから銘柄を削除
- `/kabu-set-schedule <曜日> <時刻1> [時刻2] [時刻3]` — そのチャンネルに通知スケジュールを追加
- `/kabu-remove-schedule <ID>` — 指定したIDのスケジュールを削除（IDは `/list` で確認）
- `/kabu-help` — コマンドの使い方を表示

## セットアップ

### 1. Discord Bot 作成

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリケーション作成
2. Bot を追加し、トークンを取得
3. OAuth2 → URL Generator で `bot` + `applications.commands` スコープを選択
4. Bot Permissions: `Send Messages`, `Attach Files`, `Embed Links`
5. 生成されたURLでサーバーに招待

### 2. 環境変数

```bash
cp .env.example .env
# .env を編集
```

### 3. インストール・起動

```bash
npm install
npm run deploy-commands  # スラッシュコマンド登録（初回のみ）
npm run dev              # 開発時
# or
npm run build && npm start  # 本番
```

## Railway デプロイ

```bash
railway init
railway up
```

環境変数は Railway のダッシュボードで設定。  
SQLite のデータ永続化には Volume を `/app/data` にマウントし、`DB_PATH=/app/data/kabu-notify.db` を設定。

## 技術スタック

- TypeScript / Node.js
- discord.js
- yahoo-finance2（株価取得）
- better-sqlite3（DB）
- chart.js + chartjs-node-canvas（チャート画像生成）
- node-cron（スケジューラ）

---

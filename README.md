# 前置き
全てClaude.aiが作りました  
意図的にエディターやターミナルを使わずにClaude, GitHub, Railwayの各ブラウザだけで完結させたので、コーディングの仕方とかはai流です。  
https://claude.ai/share/6eff4a8a-6500-40e1-b1e9-3e931b7f76df  
※1度ミスった時に`git reset --hard`だけVScodeでやりました。  

---

# kabu-notify-bot

Discord bot で日本株の株価通知を定期配信する。

## 機能

- `/add-stock <銘柄コード>` — チャンネルに銘柄を追加
- `/remove-stock <銘柄コード>` — チャンネルから銘柄を削除
- `/set-schedule <曜日> <時刻1> [時刻2] [時刻3]` — 通知スケジュール設定
- `/list` — サーバー全体の設定を一覧表示

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



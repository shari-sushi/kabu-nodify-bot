import Database from "better-sqlite3";

export interface Stock {
  id: number;
  ticker: string;
  name: string | null;
}

export interface ChannelStock {
  channelId: string;
  ticker: string;
  name: string | null;
  addedBy: string;
}

export interface Schedule {
  id: number;
  channelId: string;
  cronExpression: string;
}

export interface ChannelInfo {
  channelId: string;
  guildId: string;
  stocks: { ticker: string; name: string | null }[];
  schedules: string[];
}

export class Repository {
  constructor(private db: Database.Database) {}

  // -- channels --

  ensureChannel(channelId: string, guildId: string): void {
    this.db
      .prepare(`INSERT OR IGNORE INTO channels (channel_id, guild_id) VALUES (?, ?)`)
      .run(channelId, guildId);
  }

  // -- stocks --

  findStockByTicker(ticker: string): Stock | undefined {
    return this.db.prepare(`SELECT id, ticker, name FROM stocks WHERE ticker = ?`).get(ticker) as
      | Stock
      | undefined;
  }

  upsertStock(ticker: string, name: string | null): number {
    const existing = this.findStockByTicker(ticker);
    if (existing) {
      if (name && !existing.name) {
        this.db.prepare(`UPDATE stocks SET name = ? WHERE id = ?`).run(name, existing.id);
      }
      return existing.id;
    }
    const result = this.db
      .prepare(`INSERT INTO stocks (ticker, name) VALUES (?, ?)`)
      .run(ticker, name);
    return Number(result.lastInsertRowid);
  }

  // -- channel_stocks --

  addChannelStock(channelId: string, guildId: string, stockId: number, addedBy: string): boolean {
    this.ensureChannel(channelId, guildId);
    try {
      this.db
        .prepare(`INSERT INTO channel_stocks (channel_id, stock_id, added_by) VALUES (?, ?, ?)`)
        .run(channelId, stockId, addedBy);
      return true;
    } catch (e: any) {
      if (e.code === "SQLITE_CONSTRAINT_PRIMARYKEY") return false;
      throw e;
    }
  }

  removeChannelStock(channelId: string, ticker: string): boolean {
    const stock = this.findStockByTicker(ticker);
    if (!stock) return false;
    const result = this.db
      .prepare(`DELETE FROM channel_stocks WHERE channel_id = ? AND stock_id = ?`)
      .run(channelId, stock.id);
    return result.changes > 0;
  }

  getChannelStocks(channelId: string): Stock[] {
    return this.db
      .prepare(
        `SELECT s.id, s.ticker, s.name
         FROM channel_stocks cs
         JOIN stocks s ON s.id = cs.stock_id
         WHERE cs.channel_id = ?
         ORDER BY cs.created_at`
      )
      .all(channelId) as Stock[];
  }

  // -- schedules --

  setSchedules(channelId: string, guildId: string, crons: string[]): void {
    this.ensureChannel(channelId, guildId);
    this.db.transaction(() => {
      this.db.prepare(`DELETE FROM schedules WHERE channel_id = ?`).run(channelId);
      const insert = this.db.prepare(
        `INSERT INTO schedules (channel_id, cron_expression) VALUES (?, ?)`
      );
      for (const cron of crons) {
        insert.run(channelId, cron);
      }
    })();
  }

  getSchedules(channelId: string): Schedule[] {
    return this.db
      .prepare(
        `SELECT id, channel_id as channelId, cron_expression as cronExpression
         FROM schedules WHERE channel_id = ?`
      )
      .all(channelId) as Schedule[];
  }

  // -- 全チャンネル情報（スケジューラ用） --

  getAllScheduledChannels(): {
    channelId: string;
    cronExpression: string;
  }[] {
    return this.db
      .prepare(
        `SELECT channel_id as channelId, cron_expression as cronExpression
         FROM schedules`
      )
      .all() as { channelId: string; cronExpression: string }[];
  }

  /** スケジューラ用: 全登録銘柄のtickerをユニークに取得 */
  getAllUniqueTickers(): string[] {
    const rows = this.db
      .prepare(
        `SELECT DISTINCT s.ticker FROM channel_stocks cs JOIN stocks s ON s.id = cs.stock_id`
      )
      .all() as { ticker: string }[];
    return rows.map((r) => r.ticker);
  }

  // -- /list 用: サーバー全体の設定取得 --

  getGuildOverview(guildId: string): ChannelInfo[] {
    const channels = this.db
      .prepare(`SELECT channel_id, guild_id FROM channels WHERE guild_id = ?`)
      .all(guildId) as { channel_id: string; guild_id: string }[];

    return channels.map((ch) => {
      const stocks = this.db
        .prepare(
          `SELECT s.ticker, s.name
           FROM channel_stocks cs
           JOIN stocks s ON s.id = cs.stock_id
           WHERE cs.channel_id = ?
           ORDER BY cs.created_at`
        )
        .all(ch.channel_id) as { ticker: string; name: string | null }[];

      const schedules = this.db
        .prepare(`SELECT cron_expression FROM schedules WHERE channel_id = ?`)
        .all(ch.channel_id) as { cron_expression: string }[];

      return {
        channelId: ch.channel_id,
        guildId: ch.guild_id,
        stocks,
        schedules: schedules.map((s) => s.cron_expression),
      };
    });
  }
}

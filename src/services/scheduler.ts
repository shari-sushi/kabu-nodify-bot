import cron, { ScheduledTask } from "node-cron";
import { Client, TextChannel } from "discord.js";
import { Repository } from "../db/repository";
import { getQuotes } from "./stock";
import { cronToDescription } from "./schedule-parser";
import { createStockNotification } from "./stock-ui";

export class Scheduler {
  private tasks: Map<string, ScheduledTask> = new Map();

  constructor(
    private client: Client,
    private repo: Repository
  ) {}

  /** DB上の全スケジュールを読み込んでcronタスクを登録 */
  registerAll(): void {
    this.clearAll();

    const schedules = this.repo.getAllScheduledChannels();
    // channelId+cronExpression でグルーピング
    for (const { channelId, cronExpression } of schedules) {
      const taskKey = `${channelId}:${cronExpression}`;
      if (this.tasks.has(taskKey)) continue;

      const task = cron.schedule(
        cronExpression,
        () => {
          this.sendNotification(channelId).catch((e) =>
            console.error(`通知送信失敗 [${channelId}]:`, e)
          );
        },
        { timezone: "Asia/Tokyo" }
      );

      this.tasks.set(taskKey, task);
      console.log(`Scheduled: ${channelId} → ${cronToDescription(cronExpression)}`);
    }

    console.log(`${this.tasks.size} cron tasks registered`);
  }

  /** 全タスクを停止・削除 */
  clearAll(): void {
    for (const task of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();
  }

  /** 指定チャンネルに株価通知を送信 */
  async sendNotification(channelId: string): Promise<void> {
    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.error(`Channel not found or not text channel: ${channelId}`);
      return;
    }

    const stocks = this.repo.getChannelStocks(channelId);
    if (stocks.length === 0) return;

    const tickers = stocks.map((s) => s.ticker);
    const quotes = await getQuotes(tickers);

    if (quotes.size === 0) {
      await channel.send("⚠️ 株価の取得に失敗しました。");
      return;
    }

    // 株価通知メッセージを作成（チャート生成を含む）
    const message = await createStockNotification(quotes, tickers);
    await channel.send(message);
  }
}

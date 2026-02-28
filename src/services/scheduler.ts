import cron, { ScheduledTask } from "node-cron";
import { Client, TextChannel, AttachmentBuilder, EmbedBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { getQuotes, getHistory, displayTicker, StockQuote } from "./stock";
import { generateChart } from "./chart";
import { cronToDescription } from "./schedule-parser";

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

    // Embed作成
    const now = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const embed = new EmbedBuilder().setTitle(`📈 株価通知 - ${now}`).setColor(0x89b4fa);

    for (const ticker of tickers) {
      const quote = quotes.get(ticker);
      if (!quote) {
        embed.addFields({
          name: displayTicker(ticker),
          value: "取得失敗",
          inline: true,
        });
        continue;
      }

      const arrow = quote.change >= 0 ? "🔺" : "🔻";
      const sign = quote.change >= 0 ? "+" : "";
      const price = `¥${quote.price.toLocaleString()}`;
      const change = `${sign}${quote.change.toFixed(0)} (${sign}${quote.changePercent.toFixed(2)}%)`;

      embed.addFields({
        name: `${quote.name} (${displayTicker(ticker)})`,
        value: `${price}　${arrow} ${change}`,
        inline: false,
      });
    }

    // チャート画像生成
    try {
      const historyMap = new Map<string, Awaited<ReturnType<typeof getHistory>>>();
      await Promise.all(
        tickers.map(async (ticker) => {
          const history = await getHistory(ticker, 30);
          if (history.length > 0) historyMap.set(ticker, history);
        })
      );

      if (historyMap.size > 0) {
        const chartBuffer = await generateChart(historyMap);
        const attachment = new AttachmentBuilder(chartBuffer, {
          name: "chart.png",
        });
        embed.setImage("attachment://chart.png");
        await channel.send({ embeds: [embed], files: [attachment] });
      } else {
        await channel.send({ embeds: [embed] });
      }
    } catch (e) {
      console.error("Chart generation failed:", e);
      await channel.send({ embeds: [embed] });
    }
  }
}

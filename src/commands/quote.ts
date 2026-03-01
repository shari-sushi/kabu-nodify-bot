import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { getQuotes } from "../services/stock";
import { COMMAND_PREFIX } from "../config";
import { createStockNotification } from "../services/stock-ui";

export const data = new SlashCommandBuilder()
  .setName(COMMAND_PREFIX + "quote")
  .setDescription("このチャンネルに登録されている銘柄の現在の株価を即座に取得");

export async function execute(
  interaction: ChatInputCommandInteraction,
  repo: Repository
): Promise<void> {
  await interaction.deferReply();

  const stocks = repo.getChannelStocks(interaction.channelId);

  if (stocks.length === 0) {
    await interaction.editReply({
      content:
        "📋 このチャンネルには銘柄が登録されていません。\n`/kabu-add-stock` で銘柄を追加してください。",
    });
    return;
  }

  const tickers = stocks.map((s) => s.ticker);
  const quotes = await getQuotes(tickers);

  if (quotes.size === 0) {
    await interaction.editReply(
      "⚠️ 株価の取得に失敗しました。\n 登録済み銘柄:" +
        stocks.map((s) => {
          s.id + (s.name ?? "") + s.ticker + "\n";
        })
    );
    return;
  }

  // 現在時刻を生成
  const now = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 株価通知メッセージを作成
  const message = await createStockNotification(quotes, tickers, `📈 株価情報 - ${now}`);
  await interaction.editReply(message);
}

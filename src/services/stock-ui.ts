import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { StockQuote, displayTicker, getHistory } from "./stock";
import { generateChart } from "./chart";

/**
 * 株価情報からEmbedを作成する（再利用可能な関数）
 */
export function createStockQuoteEmbed(
  quotes: Map<string, StockQuote>,
  tickers: string[],
  title?: string
): EmbedBuilder {
  const now = new Date().toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const embed = new EmbedBuilder()
    .setTitle(title ?? `📈 株価通知 - ${now}`)
    .setColor(0x89b4fa);

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

  return embed;
}

/**
 * チャート画像付きのメッセージオプションを作成する
 */
export function createStockMessageWithChart(
  embed: EmbedBuilder,
  chartBuffer: Buffer
): { embeds: EmbedBuilder[]; files: AttachmentBuilder[] } {
  const attachment = new AttachmentBuilder(chartBuffer, {
    name: "chart.png",
  });
  embed.setImage("attachment://chart.png");
  return { embeds: [embed], files: [attachment] };
}

/**
 * 株価通知メッセージをチャート付きで作成する（再利用可能な高レベル関数）
 */
export async function createStockNotification(
  quotes: Map<string, StockQuote>,
  tickers: string[],
  title?: string
): Promise<{ embeds: EmbedBuilder[] } | { embeds: EmbedBuilder[]; files: AttachmentBuilder[] }> {
  const embed = createStockQuoteEmbed(quotes, tickers, title);

  // チャート画像生成を試みる
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
      return createStockMessageWithChart(embed, chartBuffer);
    } else {
      return { embeds: [embed] };
    }
  } catch (e) {
    console.error("Chart generation failed:", e);
    return { embeds: [embed] };
  }
}
import yahooFinance from "yahoo-finance2";

export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface StockHistory {
  date: Date;
  close: number;
}

/**
 * 銘柄コードを東証フォーマットに変換
 * "7203" → "7203.T"
 * "7203.T" → "7203.T"（そのまま）
 */
export function toTokyoTicker(input: string): string {
  const trimmed = input.trim().toUpperCase();
  return trimmed.endsWith(".T") ? trimmed : `${trimmed}.T`;
}

/** 表示用の銘柄コード（.Tを除去） */
export function displayTicker(ticker: string): string {
  return ticker.replace(/\.T$/, "");
}

/** 現在の株価を取得 */
export async function getQuote(ticker: string): Promise<StockQuote | null> {
  try {
    const result = await yahooFinance.quote(ticker);
    if (!result || !result.regularMarketPrice) return null;

    const price = result.regularMarketPrice;
    const previousClose = result.regularMarketPreviousClose ?? price;
    const change = price - previousClose;
    const changePercent =
      previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      ticker,
      name: result.shortName ?? result.longName ?? ticker,
      price,
      previousClose,
      change,
      changePercent,
      currency: result.currency ?? "JPY",
    };
  } catch (e) {
    console.error(`Failed to fetch quote for ${ticker}:`, e);
    return null;
  }
}

/** 複数銘柄の株価を一括取得 */
export async function getQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  // yahoo-finance2にはbatch APIがないので並列で取得
  const promises = tickers.map(async (ticker) => {
    const quote = await getQuote(ticker);
    if (quote) results.set(ticker, quote);
  });
  await Promise.all(promises);
  return results;
}

/** 銘柄の存在確認（追加時のバリデーション） */
export async function validateTicker(ticker: string): Promise<{ valid: boolean; name?: string }> {
  try {
    const result = await yahooFinance.quote(ticker);
    if (result && result.regularMarketPrice) {
      return { valid: true, name: result.shortName ?? result.longName ?? undefined };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/** 過去N日の終値履歴を取得（チャート用） */
export async function getHistory(
  ticker: string,
  days: number = 30
): Promise<StockHistory[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    return result.map((row) => ({
      date: row.date,
      close: row.close,
    }));
  } catch (e) {
    console.error(`Failed to fetch history for ${ticker}:`, e);
    return [];
  }
}

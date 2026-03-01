/**
 * Yahoo Finance API クライアント
 * 外部APIとのやり取りを抽象化し、ライブラリの変更に強い設計にする
 */

import { retryWithBackoff, isNetworkError } from "./retry";
import { YahooFinanceChartResult } from "../libs/yahoo-finance/types";

export type { YahooFinanceChartResult };

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000; // 1秒

/**
 * Yahoo Finance APIからチャートデータを取得（内部実装）
 * AbortControllerを使わないシンプルな実装（Railway環境対応）
 */
async function fetchYahooFinanceChartInternal(
  ticker: string,
  range: string,
  interval: string
): Promise<YahooFinanceChartResult> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "kabu-notify-bot/1.0" },
  });

  if (!res.ok) {
    // 404やその他のHTTPエラー
    const error: any = new Error(`Yahoo Finance API error: HTTP ${res.status}`);
    error.status = res.status;
    error.isHttpError = true;
    throw error;
  }

  const json = (await res.json()) as any;
  const result = json?.chart?.result?.[0];

  if (!result) {
    // データが存在しない場合
    const error: any = new Error("No data returned from Yahoo Finance API");
    error.isDataError = true;
    throw error;
  }

  return result;
}

/**
 * Yahoo Finance APIからチャートデータを取得
 * リトライ機能付き（ネットワークエラーのみリトライ）
 */
export async function fetchYahooFinanceChart(
  ticker: string,
  range: string = "1d",
  interval: string = "1d"
): Promise<YahooFinanceChartResult> {
  return retryWithBackoff(() => fetchYahooFinanceChartInternal(ticker, range, interval), {
    maxRetries: MAX_RETRIES,
    initialDelay: INITIAL_RETRY_DELAY_MS,
    shouldRetry: (error: unknown) => {
      // HTTPエラーやデータエラーはリトライしない
      // ネットワークエラーのみリトライする
      const err = error as any;
      if (err?.isHttpError || err?.isDataError) {
        return false;
      }
      return isNetworkError(error);
    },
  });
}

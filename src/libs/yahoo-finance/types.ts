/**
 * Yahoo Finance API の型定義
 * 外部APIのレスポンス構造を定義
 */

export interface YahooFinanceChartResult {
  meta: {
    regularMarketPrice: number;
    previousClose?: number;
    chartPreviousClose?: number;
    shortName?: string;
    longName?: string;
    symbol?: string;
    currency?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: number[];
    }>;
  };
}

import { EmbedBuilder } from "discord.js";
import {
  createStockQuoteEmbed,
  createStockMessageWithChart,
  createStockNotification,
} from "./stock-ui";
import { StockQuote } from "./stock";
import * as stock from "./stock";
import * as chart from "./chart";
import { getEmojiForIndex } from "../utils/stock-colors";

// getHistory と generateChart をモック（一部の関数は実際の実装を使う）
jest.mock("./stock", () => {
  const actual = jest.requireActual("./stock");
  return {
    ...actual,
    getHistory: jest.fn(),
  };
});
jest.mock("./chart");

describe("stock-ui", () => {
  describe("createStockQuoteEmbed", () => {
    it("正常な株価データでEmbedを作成できる", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T"];

      const embed = createStockQuoteEmbed(quotes, tickers);

      expect(embed).toBeInstanceOf(EmbedBuilder);
      const data = embed.toJSON();
      expect(data.title).toContain("📈 株価通知");
      expect(data.color).toBe(0x89b4fa);
      expect(data.fields).toHaveLength(1);
      expect(data.fields![0].name).toContain("トヨタ自動車");
      expect(data.fields![0].name).toContain("7203");
      expect(data.fields![0].value).toContain("¥3,000");
      expect(data.fields![0].value).toContain("🔺");
      expect(data.fields![0].value).toContain("+50");
      expect(data.fields![0].value).toContain("+1.69%");
    });

    it("値下がりの場合は下矢印とマイナス記号を表示する", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 2900,
            previousClose: 2950,
            change: -50,
            changePercent: -1.69,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T"];

      const embed = createStockQuoteEmbed(quotes, tickers);

      const data = embed.toJSON();
      expect(data.fields![0].value).toContain("🔻");
      expect(data.fields![0].value).toContain("-50");
      expect(data.fields![0].value).toContain("-1.69%");
    });

    it("複数銘柄の株価データを処理できる", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
        [
          "9984.T",
          {
            ticker: "9984.T",
            name: "ソフトバンクグループ",
            price: 5000,
            previousClose: 5100,
            change: -100,
            changePercent: -1.96,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T", "9984.T"];

      const embed = createStockQuoteEmbed(quotes, tickers);

      const data = embed.toJSON();
      expect(data.fields).toHaveLength(2);
      expect(data.fields![0].name).toContain("トヨタ自動車");
      expect(data.fields![1].name).toContain("ソフトバンクグループ");
    });

    it("株価取得失敗時は「取得失敗」と表示する", () => {
      const quotes = new Map<string, StockQuote>();
      const tickers = ["7203.T"];

      const embed = createStockQuoteEmbed(quotes, tickers);

      const data = embed.toJSON();
      expect(data.fields).toHaveLength(1);
      expect(data.fields![0].name).toBe("7203");
      expect(data.fields![0].value).toBe("取得失敗");
      expect(data.fields![0].inline).toBe(true);
    });

    it("カスタムタイトルを指定できる", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T"];
      const customTitle = "📊 カスタムタイトル";

      const embed = createStockQuoteEmbed(quotes, tickers, customTitle);

      const data = embed.toJSON();
      expect(data.title).toBe(customTitle);
    });

    it("一部の銘柄が取得失敗でも正常に処理する", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T", "9999.T"]; // 9999.Tは取得失敗

      const embed = createStockQuoteEmbed(quotes, tickers);

      const data = embed.toJSON();
      expect(data.fields).toHaveLength(2);
      expect(data.fields![0].name).toContain("トヨタ自動車");
      expect(data.fields![1].name).toBe("9999");
      expect(data.fields![1].value).toBe("取得失敗");
    });

    it("価格が3桁区切りで表示される", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 1234567,
            previousClose: 1234500,
            change: 67,
            changePercent: 0.01,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T"];

      const embed = createStockQuoteEmbed(quotes, tickers);

      const data = embed.toJSON();
      expect(data.fields![0].value).toContain("¥1,234,567");
    });

    it("銘柄名の前にインデックスに応じた色マークが表示される", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
        [
          "9984.T",
          {
            ticker: "9984.T",
            name: "ソフトバンクグループ",
            price: 5000,
            previousClose: 5100,
            change: -100,
            changePercent: -1.96,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T", "9984.T"];

      const embed = createStockQuoteEmbed(quotes, tickers);

      const data = embed.toJSON();
      // インデックス0の銘柄 = 0番目の色絵文字
      expect(data.fields![0].name).toContain(getEmojiForIndex(0));
      expect(data.fields![0].name).toContain("トヨタ自動車");
      // インデックス1の銘柄 = 1番目の色絵文字
      expect(data.fields![1].name).toContain(getEmojiForIndex(1));
      expect(data.fields![1].name).toContain("ソフトバンクグループ");
    });

    it("複数銘柄でそれぞれ異なる色マークが表示される", () => {
      const quotes = new Map<string, StockQuote>([
        [
          "1",
          {
            ticker: "1",
            name: "銘柄A",
            price: 100,
            previousClose: 100,
            change: 0,
            changePercent: 0,
            currency: "JPY",
          },
        ],
        [
          "2",
          {
            ticker: "2",
            name: "銘柄B",
            price: 200,
            previousClose: 200,
            change: 0,
            changePercent: 0,
            currency: "JPY",
          },
        ],
        [
          "3",
          {
            ticker: "3",
            name: "銘柄C",
            price: 300,
            previousClose: 300,
            change: 0,
            changePercent: 0,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["1", "2", "3"];
      const embed = createStockQuoteEmbed(quotes, tickers);
      const data = embed.toJSON();
      // 各銘柄が異なる色マークを持つ
      const emoji0 = getEmojiForIndex(0);
      const emoji1 = getEmojiForIndex(1);
      const emoji2 = getEmojiForIndex(2);

      expect(data.fields![0].name).toContain(emoji0);
      expect(data.fields![1].name).toContain(emoji1);
      expect(data.fields![2].name).toContain(emoji2);

      // 異なる色が使われている
      expect(emoji0).not.toBe(emoji1);
      expect(emoji1).not.toBe(emoji2);
    });
  });

  describe("createStockMessageWithChart", () => {
    it("チャート画像付きのメッセージオプションを作成できる", () => {
      const embed = new EmbedBuilder().setTitle("テスト").setColor(0x89b4fa);
      const chartBuffer = Buffer.from("fake-chart-data");

      const result = createStockMessageWithChart(embed, chartBuffer);

      expect(result).toHaveProperty("embeds");
      expect(result).toHaveProperty("files");
      expect(result.embeds).toHaveLength(1);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe("chart.png");
    });

    it("Embedに画像URLが設定される", () => {
      const embed = new EmbedBuilder().setTitle("テスト").setColor(0x89b4fa);
      const chartBuffer = Buffer.from("fake-chart-data");

      const result = createStockMessageWithChart(embed, chartBuffer);

      const embedData = result.embeds[0].toJSON();
      expect(embedData.image).toEqual({
        url: "attachment://chart.png",
      });
    });
  });

  describe("createStockNotification", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("履歴データがある場合はチャート付きメッセージを作成する", async () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T"];

      // モックの設定
      (stock.getHistory as jest.Mock).mockResolvedValue([
        { date: new Date("2024-01-01"), close: 2900 },
        { date: new Date("2024-01-02"), close: 3000 },
      ]);
      (chart.generateChart as jest.Mock).mockResolvedValue(Buffer.from("chart-data"));

      const result = await createStockNotification(quotes, tickers);

      expect(result).toHaveProperty("embeds");
      expect(result).toHaveProperty("files");
      expect(stock.getHistory).toHaveBeenCalledWith("7203.T", 30);
      expect(chart.generateChart).toHaveBeenCalled();
    });

    it("履歴データがない場合はチャートなしメッセージを作成する", async () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T"];

      // 履歴データなし
      (stock.getHistory as jest.Mock).mockResolvedValue([]);

      const result = await createStockNotification(quotes, tickers);

      expect(result).toHaveProperty("embeds");
      expect(result).not.toHaveProperty("files");
      expect(stock.getHistory).toHaveBeenCalledWith("7203.T", 30);
      expect(chart.generateChart).not.toHaveBeenCalled();
    });

    it("チャート生成に失敗した場合はチャートなしメッセージを作成する", async () => {
      const quotes = new Map<string, StockQuote>([
        [
          "7203.T",
          {
            ticker: "7203.T",
            name: "トヨタ自動車",
            price: 3000,
            previousClose: 2950,
            change: 50,
            changePercent: 1.69,
            currency: "JPY",
          },
        ],
      ]);
      const tickers = ["7203.T"];

      // 履歴データはあるがチャート生成に失敗
      (stock.getHistory as jest.Mock).mockResolvedValue([
        { date: new Date("2024-01-01"), close: 2900 },
      ]);
      (chart.generateChart as jest.Mock).mockRejectedValue(new Error("Chart generation failed"));

      const result = await createStockNotification(quotes, tickers);

      expect(result).toHaveProperty("embeds");
      expect(result).not.toHaveProperty("files");
    });
  });
});

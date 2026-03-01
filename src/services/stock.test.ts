import { validateTicker, toTokyoTicker } from "./stock";

/**
 * Yahoo Finance API 統合テスト
 * 実際のAPIを呼び出すため、ネットワーク接続が必要
 */
describe("Yahoo Finance API integration", () => {
  // APIリクエストに時間がかかる可能性があるため、タイムアウトを30秒に設定
  jest.setTimeout(30000);

  describe("validateTicker", () => {
    it("2802 が入力された時にAJINOMOTO CO INC が取得できる", async () => {
      const ticker = toTokyoTicker("2802");

      expect(ticker).toBe("2802.T");

      const result = await validateTicker(ticker);

      expect(result.valid).toBe(true);
      expect(result.name).toBeDefined();
      expect(result.name).toContain("AJINOMOTO");
    });

    it("2802.T が入力された時にAJINOMOTO CO INC が取得できる", async () => {
      const ticker = "2802.T";
      const result = await validateTicker(ticker);

      expect(result.valid).toBe(true);
      expect(result.name).toBeDefined();
      expect(result.name).toContain("AJINOMOTO");
    });
  });
});

// 環境変数をモック（他のインポートより前に設定）
process.env.DISCORD_BOT_TOKEN = "test-token";
process.env.DISCORD_CLIENT_ID = "test-client-id";

import { allCommands } from "./commands";
import { getHelpCommandFields } from "./commands/help";

describe("コマンド登録の整合性", () => {
  it("allCommands と help で登録されるコマンド数が一致すること", () => {
    const helpFields = getHelpCommandFields();

    expect(allCommands.length).toBe(helpFields.length);
  });

  it("各コマンドのコマンド名が一致すること", () => {
    const helpFields = getHelpCommandFields();

    const allCommandNames = allCommands.map((cmd) => cmd.name).sort();
    const helpNames = helpFields.map((field) => field.commandName).sort();

    expect(allCommandNames).toEqual(helpNames);
  });
});

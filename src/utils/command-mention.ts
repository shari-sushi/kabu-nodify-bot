import { Client } from "discord.js";
import { COMMAND_PREFIX } from "../config";

/**
 * コマンド名からコマンドメンション文字列を生成する
 * @param client Discord Client
 * @param commandName プレフィックスを除いたコマンド名（例: "add-stock"）
 * @returns コマンドメンション文字列（例: "</kabu-add-stock:123>"）または通常の文字列
 */
export async function getCommandMention(
  client: Client,
  commandName: string
): Promise<string> {
  try {
    const fullCommandName = COMMAND_PREFIX + commandName;
    const commands = await client.application?.commands.fetch();

    if (!commands) {
      return `\`/${fullCommandName}\``;
    }

    const command = commands.find((cmd) => cmd.name === fullCommandName);

    if (command) {
      return `</${fullCommandName}:${command.id}>`;
    }

    return `\`/${fullCommandName}\``;
  } catch (error) {
    // エラー時はバックティック形式で返す
    return `\`/${COMMAND_PREFIX + commandName}\``;
  }
}

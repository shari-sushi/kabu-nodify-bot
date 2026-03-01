import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COMMAND_PREFIX } from "../config";
import { allCommands } from "./index";
import { getCommandMention } from "../utils/command-mention";

export const data = new SlashCommandBuilder()
  .setName(COMMAND_PREFIX + "help")
  .setDescription("コマンドの使い方を表示");

export function getHelpCommandFields() {
  return allCommands.map((cmd) => ({
    commandName: cmd.name,
  }));
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  // 全てのコマンドメンションを取得
  const [addStockCmd, removeStockCmd, setScheduleCmd, removeScheduleCmd, listCmd, quoteCmd, helpCmd] =
    await Promise.all([
      getCommandMention(interaction.client, "add-stock"),
      getCommandMention(interaction.client, "remove-stock"),
      getCommandMention(interaction.client, "set-schedule"),
      getCommandMention(interaction.client, "remove-schedule"),
      getCommandMention(interaction.client, "list"),
      getCommandMention(interaction.client, "quote"),
      getCommandMention(interaction.client, "help"),
    ]);

  const embed = new EmbedBuilder()
    .setTitle("📖 コマンド一覧")
    .setColor(0x89b4fa)
    .addFields(
      {
        name: addStockCmd,
        value: "このチャンネルで通知する銘柄を追加",
        inline: false,
      },
      {
        name: removeStockCmd,
        value: "このチャンネルから銘柄を削除",
        inline: false,
      },
      {
        name: setScheduleCmd,
        value: "このチャンネルの通知スケジュールを設定（曜日・時刻を指定）",
        inline: false,
      },
      {
        name: removeScheduleCmd,
        value: `指定したIDのスケジュールを削除（IDは ${listCmd} で確認）`,
        inline: false,
      },
      {
        name: listCmd,
        value: "このサーバーの全設定を表示（銘柄・スケジュールID含む）",
        inline: false,
      },
      {
        name: quoteCmd,
        value: "このチャンネルで登録した銘柄の現株価を表示",
        inline: false,
      },
      {
        name: helpCmd,
        value: "このヘルプを表示",
        inline: false,
      }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

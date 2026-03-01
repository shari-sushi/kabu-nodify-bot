import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { COMMAND_PREFIX } from "../config";
import { allCommands } from "./index";

export const data = new SlashCommandBuilder()
  .setName(COMMAND_PREFIX + "help")
  .setDescription("コマンドの使い方を表示");

export function getHelpCommandFields() {
  return allCommands.map((cmd) => ({
    commandName: cmd.name,
  }));
}

export async function execute(
  interaction: ChatInputCommandInteraction,
  commandIds: Map<string, string>
): Promise<void> {
  const formatCommand = (name: string) => {
    const fullName = COMMAND_PREFIX + name;
    const id = commandIds.get(fullName);
    return id ? `</${fullName}:${id}>` : `/${fullName}`;
  };

  const embed = new EmbedBuilder()
    .setTitle("📖 コマンド一覧")
    .setColor(0x89b4fa)
    .addFields(
      {
        name: formatCommand("add-stock"),
        value: "このチャンネルで通知する銘柄を追加",
        inline: false,
      },
      {
        name: formatCommand("remove-stock"),
        value: "このチャンネルから銘柄を削除",
        inline: false,
      },
      {
        name: formatCommand("set-schedule"),
        value: "このチャンネルの通知スケジュールを設定（曜日・時刻を指定）",
        inline: false,
      },
      {
        name: formatCommand("remove-schedule"),
        value: `指定したIDのスケジュールを削除（IDは ${formatCommand("list")} で確認）`,
        inline: false,
      },
      {
        name: formatCommand("list"),
        value: "このサーバーの全設定を表示（銘柄・スケジュールID含む）",
        inline: false,
      },
      {
        name: formatCommand("quote"),
        value: "このチャンネルで登録した銘柄の現株価を表示",
        inline: false,
      },
      {
        name: formatCommand("help"),
        value: "このヘルプを表示",
        inline: false,
      }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("コマンドの使い方を表示");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const embed = new EmbedBuilder().setTitle("📖 コマンド一覧").setColor(0x89b4fa).addFields(
    {
      name: "/add-stock",
      value: "このチャンネルで通知する銘柄を追加",
      inline: false,
    },
    {
      name: "/remove-stock",
      value: "このチャンネルから銘柄を削除",
      inline: false,
    },
    {
      name: "/set-schedule",
      value: "このチャンネルの通知スケジュールを設定（曜日・時刻を指定）",
      inline: false,
    },
    {
      name: "/remove-schedule",
      value: "指定したIDのスケジュールを削除（IDは /list で確認）",
      inline: false,
    },
    {
      name: "/list",
      value: "このサーバーの全設定を表示（銘柄・スケジュールID含む）",
      inline: false,
    },
    {
      name: "/help",
      value: "このヘルプを表示",
      inline: false,
    }
  );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

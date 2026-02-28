import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { toTokyoTicker, displayTicker } from "../services/stock";
import { COMMAND_PREFIX } from "../config";

export const data = new SlashCommandBuilder()
  .setName(COMMAND_PREFIX + "remove-stock")
  .setDescription("このチャンネルから銘柄を削除")
  .addStringOption((option) =>
    option.setName("code").setDescription("銘柄コード（例: 7203）").setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  repo: Repository
): Promise<void> {
  const input = interaction.options.getString("code", true);
  const ticker = toTokyoTicker(input);

  const removed = repo.removeChannelStock(interaction.channelId, ticker);

  if (!removed) {
    await interaction.reply({
      content: `⚠️ \`${displayTicker(ticker)}\` はこのチャンネルに登録されていません。`,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply(`🗑️ **${displayTicker(ticker)}** を削除しました。`);
}

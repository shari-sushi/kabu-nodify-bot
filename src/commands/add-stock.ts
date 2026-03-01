import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Repository } from "../db/repository";
import { toTokyoTicker, validateTicker, displayTicker } from "../services/stock";
import { COMMAND_PREFIX } from "../config";

export const data = new SlashCommandBuilder()
  .setName(COMMAND_PREFIX + "add-stock")
  .setDescription("このチャンネルに株価通知する銘柄を追加")
  .addStringOption((option) =>
    option.setName("code").setDescription("銘柄コード（例: 7203）").setRequired(true)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  repo: Repository
): Promise<void> {
  const input = interaction.options.getString("code", true);
  const ticker = toTokyoTicker(input);

  await interaction.deferReply();

  // 銘柄の存在確認
  const validation = await validateTicker(ticker);
  if (!validation.valid) {
    let errorMessage: string;
    switch (validation.error) {
      case "network":
        errorMessage = `⚠️ ${validation.message}\n株価データの取得に失敗しました。時間を置いてから再度お試しください。`;
        break;
      case "not_found":
        errorMessage = `❌ 銘柄コード \`${displayTicker(ticker)}\` が見つかりません。東証の銘柄コードを確認してください。`;
        break;
      default:
        errorMessage = `❌ ${validation.message ?? "予期しないエラーが発生しました"}`;
    }
    await interaction.editReply(errorMessage);
    return;
  }

  const stockId = repo.upsertStock(ticker, validation.name ?? null);
  const added = repo.addChannelStock(
    interaction.channelId,
    interaction.guildId!,
    stockId,
    interaction.user.id
  );

  if (!added) {
    await interaction.editReply(
      `⚠️ \`${validation.name ?? displayTicker(ticker)}\` (${displayTicker(ticker)}) は既に登録されています。`
    );
    return;
  }

  await interaction.editReply(
    `✅ **${validation.name ?? displayTicker(ticker)}** (${displayTicker(ticker)}) を追加しました。`
  );
}

import { REST, Routes } from "discord.js";
import { config } from "./config";
import { allCommands } from "./commands";

const commands = allCommands.map((cmd) => cmd.toJSON());

async function main() {
  const rest = new REST({ version: "10" }).setToken(config.botToken);

  console.log(`Registering ${commands.length} slash commands...`);

  await rest.put(Routes.applicationCommands(config.clientId), {
    body: commands,
  });

  console.log("Slash commands registered successfully.");
}

if (require.main === module) {
  main().catch(console.error);
}

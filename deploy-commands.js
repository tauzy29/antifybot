require('dotenv').config();

const {
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

console.log("🚀 Starting global command deployment...");

const commands = [

  // ==========================
  // /ping
  // ==========================

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check bot status'),

  // ==========================
  // /scan
  // ==========================

  new SlashCommandBuilder()
    .setName('scan')
    .setDescription('Scan text for scams')
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Text to scan')
        .setRequired(true)
    ),

  // ==========================
  // /scanhistory
  // ==========================

  new SlashCommandBuilder()
    .setName('scanhistory')
    .setDescription('Scan previous messages for scams')

].map(command => command.toJSON());

const rest = new REST({
  version: '10'
}).setToken(process.env.DISCORD_TOKEN);

// ==============================
// GLOBAL DEPLOY
// ==============================

(async () => {

  try {

    console.log("📡 Deploying global commands...");

    await rest.put(

      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),

      {
        body: commands
      }
    );

    console.log(
      "✅ Global slash commands deployed successfully"
    );

  } catch (error) {

    console.error(error);
  }
})();
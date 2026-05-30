require('dotenv').config();

const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

console.log("🚀 Starting global command deployment...");

const defineScanHistoryCommand = (name) => {
  return new SlashCommandBuilder()
    .setName(name)
    .setDescription('Scan previous channel history for threat logs & recovery')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action to perform: start, resume, or cancel')
        .setRequired(false)
        .addChoices(
          { name: 'Start New Scan', value: 'start' },
          { name: 'Resume Interrupted Scan', value: 'resume' },
          { name: 'Cancel Active Scan', value: 'cancel' }
        )
    )
    .addIntegerOption(option => 
      option.setName('depth')
        .setDescription('Number of messages to scan per channel')
        .setRequired(false)
        .addChoices(
          { name: '50 messages', value: 50 },
          { name: '100 messages (Default)', value: 100 },
          { name: '500 messages', value: 500 },
          { name: '1000 messages (Enterprise)', value: 1000 }
        )
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Specific channel to scan (Default: All Channels)')
        .setRequired(false)
    );
};

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
  // Historical Scanning Commands
  // ==========================
  defineScanHistoryCommand('scanhistory'),
  defineScanHistoryCommand('historyscan'),
  defineScanHistoryCommand('scanprevious'),
  defineScanHistoryCommand('loghistory')
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
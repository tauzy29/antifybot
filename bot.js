require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require('discord.js');

const Tesseract = require('tesseract.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🚩 Scam keywords
const scamKeywords = [
  "free nitro",
  "crypto",
  "usdt",
  "withdrawal",
  "bonus",
  "claim reward",
  "wallet",
  "deposit",
  "promo code",
  "mrbeast",
  "elon musk"
];

// 🔍 Detect suspicious text
function isScam(text) {
  text = text.toLowerCase();

  return scamKeywords.some(word =>
    text.includes(word)
  );
}

// 🚨 Handle punishment
async function punish(message, reason) {

  try {
    await message.delete();

    await message.member.timeout(
      5 * 60 * 1000,
      reason
    );

    await message.channel.send(
      `🚨 ${message.author} muted for scam content`
    );

    console.log(`Blocked: ${message.author.tag}`);

  } catch (err) {
    console.log(err);
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 💬 Message scanner
client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  console.log(`${message.author.tag}: ${message.content}`);

  // 🔍 Scan normal text
  if (isScam(message.content)) {
    return punish(message, "Scam message detected");
  }

  // 🖼️ Scan images using OCR
  if (message.attachments.size > 0) {

    for (const attachment of message.attachments.values()) {

      if (attachment.contentType?.startsWith('image')) {

        try {

          console.log("Scanning image...");

          const result = await Tesseract.recognize(
            attachment.url,
            'eng'
          );

          const text = result.data.text;

          console.log("OCR TEXT:", text);

          if (isScam(text)) {
            return punish(message, "Scam image detected");
          }

        } catch (err) {
          console.log("OCR Error:", err);
        }
      }
    }
  }
});

// ⚡ Slash commands
client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    return interaction.reply('🏓 Pong!');
  }

  if (interaction.commandName === 'scan') {

    const text = interaction.options.getString('text');

    if (isScam(text)) {
      return interaction.reply("⚠️ Suspicious text detected");
    }

    return interaction.reply("✅ Looks safe");
  }
});

client.login(process.env.DISCORD_TOKEN);
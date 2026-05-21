// ==============================
// ANTIFY BOT - COMPLETE bot.js
// ==============================

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require('discord.js');

const Tesseract = require('tesseract.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==============================
// CONFIG
// ==============================

const scamKeywords = [
  "free nitro",
  "crypto",
  "usdt",
  "withdrawal",
  "bonus",
  "wallet",
  "claim reward",
  "deposit",
  "promo code",
  "mrbeast",
  "elon musk",
  "gift",
  "btc",
  "eth",
  "telegram",
  "airdrop"
];

const badDomains = [
  ".xyz",
  ".click",
  ".top",
  ".gq"
];

// ==============================
// HELPERS
// ==============================

// Normalize text
function normalize(text) {

  return text
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/@/g, 'a')
    .replace(/[^a-z0-9 ]/g, '');
}

// Scam detection
function isScam(text) {

  text = normalize(text);

  return scamKeywords.some(word =>
    text.includes(word)
  );
}

// URL extraction
function extractUrls(text) {

  return text.match(/https?:\/\/[^\s]+/g);
}

// Bad domain detection
function hasBadDomain(url) {

  return badDomains.some(domain =>
    url.includes(domain)
  );
}

// VirusTotal Scan
async function scanUrl(url) {

  try {

    const submit = await axios.post(
      'https://www.virustotal.com/api/v3/urls',
      new URLSearchParams({ url }),
      {
        headers: {
          'x-apikey': process.env.VT_API_KEY
        }
      }
    );

    const analysisId = submit.data.data.id;

    const result = await axios.get(
      `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
      {
        headers: {
          'x-apikey': process.env.VT_API_KEY
        }
      }
    );

    const stats = result.data.data.attributes.stats;

    return stats.malicious > 0;

  } catch (err) {

    console.log("VirusTotal Error:", err.message);

    return false;
  }
}

// Punishment
async function punish(message, reason) {

  try {

    await message.delete();

    if (
      message.member &&
      message.member.moderatable
    ) {

      await message.member.timeout(
        5 * 60 * 1000,
        reason
      );
    }

    await message.channel.send(
      `🚨 ${message.author} muted.\nReason: ${reason}`
    );

    console.log(
      `Blocked ${message.author.tag} | ${reason}`
    );

  } catch (err) {

    console.log("Punish Error:", err);
  }
}

// ==============================
// READY EVENT
// ==============================

client.once('ready', () => {

  console.log(
    `✅ Logged in as ${client.user.tag}`
  );
});

// ==============================
// LIVE MESSAGE SCANNER
// ==============================

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  console.log(
    `${message.author.tag}: ${message.content}`
  );

  // ==========================
  // TEXT SCAN
  // ==========================

  if (isScam(message.content)) {

    return punish(
      message,
      "Scam text detected"
    );
  }

  // ==========================
  // LINK SCAN
  // ==========================

  const urls = extractUrls(message.content);

  if (urls) {

    for (const url of urls) {

      // suspicious domains
      if (hasBadDomain(url)) {

        return punish(
          message,
          "Suspicious domain detected"
        );
      }

      // VirusTotal
      const malicious = await scanUrl(url);

      if (malicious) {

        return punish(
          message,
          "Malicious link detected"
        );
      }
    }
  }

  // ==========================
  // IMAGE OCR SCAN
  // ==========================

  if (message.attachments.size > 0) {

    for (const attachment of message.attachments.values()) {

      if (
        attachment.contentType?.startsWith('image')
      ) {

        try {

          console.log("Scanning image...");

          const result = await Tesseract.recognize(
            attachment.url,
            'eng'
          );

          const extractedText =
            result.data.text;

          console.log(
            "OCR TEXT:",
            extractedText
          );

          // OCR keyword scan
          if (isScam(extractedText)) {

            return punish(
              message,
              "Scam image detected"
            );
          }

          // OCR URL scan
          const imageUrls =
            extractUrls(extractedText);

          if (imageUrls) {

            for (const url of imageUrls) {

              if (hasBadDomain(url)) {

                return punish(
                  message,
                  "Bad domain inside image"
                );
              }

              const malicious =
                await scanUrl(url);

              if (malicious) {

                return punish(
                  message,
                  "Malicious URL inside image"
                );
              }
            }
          }

        } catch (err) {

          console.log(
            "OCR Error:",
            err.message
          );
        }
      }
    }
  }
});

// ==============================
// SLASH COMMANDS
// ==============================

client.on('interactionCreate', async interaction => {

  try {

    if (!interaction.isChatInputCommand()) return;

    console.log(
      "Slash Command:",
      interaction.commandName
    );

    // ==========================
    // /ping
    // ==========================

    if (interaction.commandName === 'ping') {

      return interaction.reply('🏓 Pong!');
    }

    // ==========================
    // /scan
    // ==========================

    if (interaction.commandName === 'scan') {

      const text =
        interaction.options.getString('text');

      if (isScam(text)) {

        return interaction.reply(
          "⚠️ Suspicious text detected"
        );
      }

      return interaction.reply(
        "✅ Looks safe"
      );
    }

    // ==========================
    // /scanhistory
    // ==========================

    if (
      interaction.commandName === 'scanhistory'
    ) {

      await interaction.reply(
        "🔍 Scanning previous messages..."
      );

      const messages =
        await interaction.channel.messages.fetch({
          limit: 100
        });

      let deleted = 0;

      for (const msg of messages.values()) {

        if (msg.author.bot) continue;

        let flagged = false;

        // TEXT SCAN
        if (isScam(msg.content)) {

          flagged = true;
        }

        // IMAGE OCR SCAN
        if (
          !flagged &&
          msg.attachments.size > 0
        ) {

          for (const attachment of msg.attachments.values()) {

            if (
              attachment.contentType?.startsWith('image')
            ) {

              try {

                console.log(
                  `Scanning old image from ${msg.author.tag}`
                );

                const result =
                  await Tesseract.recognize(
                    attachment.url,
                    'eng'
                  );

                const extractedText =
                  result.data.text;

                console.log(
                  "OLD OCR:",
                  extractedText
                );

                if (isScam(extractedText)) {

                  flagged = true;
                }

              } catch (err) {

                console.log(
                  "History OCR Error:",
                  err.message
                );
              }
            }
          }
        }

        // DELETE
        if (flagged) {

          try {

            await msg.delete();

            deleted++;

            console.log(
              "Deleted old scam message"
            );

          } catch (err) {

            console.log(
              "Delete Error:",
              err.message
            );
          }
        }
      }

      await interaction.followUp(
        `✅ Scan complete.\nDeleted ${deleted} scam messages.`
      );
    }

  } catch (err) {

    console.log(
      "Interaction Error:",
      err
    );
  }
});

// ==============================
// LOGIN
// ==============================

client.login(process.env.DISCORD_TOKEN);
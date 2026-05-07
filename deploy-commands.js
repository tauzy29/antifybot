require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

console.log("Starting deploy...");

const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong'),

    new SlashCommandBuilder()
        .setName('scan')
        .setDescription('Scan text')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to scan')
                .setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {

        console.log("Deploying commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                "1402903975908606013"
            ),
            { body: commands }
        );

        console.log("✅ Commands deployed successfully");

    } catch (error) {
        console.error(error);
    }
})();
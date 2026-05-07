require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

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

        console.log('Deploying slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('✅ Slash commands deployed');

    } catch (error) {
        console.error(error);
    }
})();
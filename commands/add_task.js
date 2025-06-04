const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add_task')
    .setDescription('提出物を登録します')
    .addStringOption(option =>
      option.setName('date')
        .setDescription('締切日（例: 2025-06-10）')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('detail')
        .setDescription('課題やテストの内容')
        .setRequired(true)),

  async execute(interaction) {
    const date = interaction.options.getString('date');
    const detail = interaction.options.getString('detail');

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(fs.readFileSync('credentials.json')),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const spreadsheetId = process.env.SPREADSHEET_ID;

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Tasks!A:B',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[date, detail]],
        },
      });

      await interaction.reply(`✅ 提出物を追加しました:\n📅 ${date}\n📘 ${detail}`);
    } catch (err) {
      console.error(err);
      await interaction.reply('❌ 登録中にエラーが発生しました。');
    }
  },
};

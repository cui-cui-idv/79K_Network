const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');
const fs = require('fs');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('check_tasks')
    .setDescription('登録された提出物をAIが要約して表示します'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(fs.readFileSync('credentials.json')),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });

      const spreadsheetId = process.env.SPREADSHEET_ID;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Tasks!A:B',
      });

      const rows = res.data.values;

      if (!rows || rows.length === 0) {
        return interaction.editReply('📭 登録されたタスクがありません。');
      }

      const formatted = rows.map(row => `- ${row[0]}: ${row[1]}`).join('\n');

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(`
以下は学校の提出予定の一覧です。読みやすく整理し、提出日が近い順で簡潔に要約してください：

${formatted}
      `);

      const response = await result.response;
      const text = response.text();

      await interaction.editReply(`📋 提出物一覧:\n${text}`);
    } catch (err) {
      console.error(err);
      await interaction.editReply('❌ タスクの取得または要約中にエラーが発生しました。');
    }
  },
};

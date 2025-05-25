const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// === Bot Configuration ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VIJAY_TELEGRAM_ID = process.env.VIJAY_TELEGRAM_ID;
const RENDER_API_URL = process.env.RENDER_API_URL; // Must end with /chat/

// === Initialize Telegram Bot ===
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log("🤖 VijayBot is running...");

// === Detect if message is trying to inform Vijay ===
function messageMentionsVijay(text) {
  const lowered = text.toLowerCase();
  return lowered.includes("tell vijay") ||
         lowered.includes("inform vijay") ||
         lowered.includes("bol vijay") ||
         lowered.includes("say to vijay") ||
         lowered.includes("vijay ko bol") ||
         lowered.includes("vijay ko kehna");
}

// === Send user input to LLM server ===
async function getLLMReply(userInput, senderName) {
  try {
    const response = await axios.post(RENDER_API_URL, {
      user_input: `Message from ${senderName}:\n"${userInput}"`,
      user_id: "1"
    });
    return response.data.response || "I'm not sure how to respond.";
  } catch (err) {
    console.error("LLM API error:", err.message);
    return "Something went wrong while chatting with me. 😓";
  }
}

// === Handle Incoming Messages ===
bot.on('message', async (msg) => {
  const text = msg.text || "";
  const chatId = msg.chat.id;
  const telegramUserId = String(msg.from.id);

  // Build sender name smartly
  let senderName = "";
  if (msg.from.username) {
    senderName = `@${msg.from.username}`;
  } else {
    senderName = `${msg.from.first_name || "Unknown"} ${msg.from.last_name || ""}`.trim();
  }

  if (messageMentionsVijay(text)) {
    const notifyMessage = `📩 Someone wants to tell you something!\nFrom: ${senderName} (ID: ${telegramUserId})\n\n"${text}"`;
    await bot.sendMessage(VIJAY_TELEGRAM_ID, notifyMessage);
    await bot.sendMessage(chatId, `✅ Got it! I've informed Vijay.`);
  } else {
    const reply = await getLLMReply(text, senderName, telegramUserId);
    await bot.sendMessage(chatId, reply);
  }
});

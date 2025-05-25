const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

// === Bot Configuration ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VIJAY_TELEGRAM_ID = process.env.VIJAY_TELEGRAM_ID;
const RENDER_API_URL = process.env.RENDER_API_URL; // Ends with /chat/

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
console.log("🤖 VijayBot is running...");

// === Check if message is trying to inform Vijay ===
function messageMentionsVijay(text) {
  const lowered = text.toLowerCase();
  return lowered.includes("tell vijay") ||
         lowered.includes("inform vijay") ||
         lowered.includes("bol vijay") ||
         lowered.includes("say to vijay") ||
         lowered.includes("vijay ko bol");
}

// === Get LLM Response from your FastAPI server ===
async function getLLMReply(userInput, userId) {
  try {
    const response = await axios.post(RENDER_API_URL, {
      user_input: userInput,
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
  const senderName = msg.from.username || `${msg.from.first_name} ${msg.from.last_name || ""}`;
  const telegramUserId = String(msg.from.id);
  const chatId = msg.chat.id;

  if (messageMentionsVijay(text)) {
    // Notify Vijay only
    const notifyMessage = `📩 Someone wants to tell you something!\nFrom: @${senderName} (ID: ${telegramUserId})\n\n"${text}"`;
    await bot.sendMessage(VIJAY_TELEGRAM_ID, notifyMessage);
    await bot.sendMessage(chatId, `✅ Got it! I've informed Vijay.`);
  } else {
    // Handle chat via LLM
    const reply = await getLLMReply(text, telegramUserId);
    await bot.sendMessage(chatId, reply);
  }
});

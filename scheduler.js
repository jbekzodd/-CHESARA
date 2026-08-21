const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN topilmadi. Scheduler Telegram xabar yubora olmaydi.");
}

/**
 * Telegram orqali xabar yuborish
 */
async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN mavjud emas.");
    return false;
  }

  if (!chatId) {
    console.error("chatId mavjud emas.");
    return false;
  }

  try {
    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML"
    });

    return response.data.ok;
  } catch (error) {
    console.error(
      "Telegram xabar yuborishda xatolik:",
      error.response?.data || error.message
    );

    return false;
  }
}

/**
 * Scheduler ishga tushiriladi
 */
function startScheduler() {
  console.log("Scheduler ishga tushdi.");

  // Har 1 soatda tekshiradi.
  setInterval(() => {
    console.log(
      "Scheduler tekshiruvi:",
      new Date().toISOString()
    );
  }, 60 * 60 * 1000);
}

module.exports = {
  startScheduler,
  sendTelegramMessage
};

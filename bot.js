// CHESARA Telegram Bot — boshlang'ich bot serveri

const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN topilmadi!");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Vaqtincha xotirada saqlanadigan ma'lumotlar.
// Keyingi bosqichda buni asosiy CHESARA bazasiga ulaymiz.
const telegramUsers = new Map();

function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        ["♟ Mening darslarim", "📅 Davomat"],
        ["📊 Hisobotlar", "🔔 Ogohlantirishlar"],
        ["♟ O'yin tahlili", "🏆 Turnirlar"],
        ["📰 Yangiliklar", "👤 Profil"]
      ],
      resize_keyboard: true
    }
  };
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  telegramUsers.set(chatId, {
    chatId,
    username: msg.from?.username || "",
    firstName: msg.from?.first_name || "",
    lastName: msg.from?.last_name || "",
    role: "unknown",
    createdAt: new Date().toISOString()
  });

  await bot.sendMessage(
    chatId,
    `♟️ *CHESARA* ga xush kelibsiz!

AI shaxmat platformasi

Bu bot orqali:
• darslar va davomatni nazorat qilish
• o'quvchi va ustoz ogohlantirishlari
• oylik hisobotlar
• Lichess / Chess.com o'yinlarini tahlil qilish
• screenshot orqali shaxmat o'yinlarini tahlil qilish
• turnirlar va yangiliklarni kuzatish

amalga oshiriladi.

Hozircha tizimning asosiy Telegram qismi ishga tushirildi.`,
    {
      parse_mode: "Markdown",
      ...mainMenu()
    }
  );
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "📅 Davomat") {
    return bot.sendMessage(
      chatId,
      "📅 Davomat bo'limi\n\nHozircha bog'langan darslar mavjud emas. Keyingi bosqichda CHESARA CRM bilan ulanadi."
    );
  }

  if (text === "♟ Mening darslarim") {
    return bot.sendMessage(
      chatId,
      "♟ Mening darslarim\n\nDars jadvali CHESARA tizimidan olinadi."
    );
  }

  if (text === "📊 Hisobotlar") {
    return bot.sendMessage(
      chatId,
      "📊 Hisobotlar\n\nOylik hisobotlar keyingi modulda avtomatik shakllantiriladi."
    );
  }

  if (text === "🔔 Ogohlantirishlar") {
    return bot.sendMessage(
      chatId,
      "🔔 Ogohlantirish tizimi tayyorlanmoqda.\n\nMasalan: ustoz dars boshlanganidan 15 daqiqa ichida davomat qilmasa, direktor Telegram orqali xabar oladi."
    );
  }

  if (text === "♟ O'yin tahlili") {
    return bot.sendMessage(
      chatId,
      "♟ O'yin tahlili\n\nLichess, Chess.com va screenshot orqali yuborilgan o'yinlarni tahlil qilish moduli keyingi bosqichda ulanadi."
    );
  }

  if (text === "🏆 Turnirlar") {
    return bot.sendMessage(
      chatId,
      "🏆 Turnirlar\n\nTurnirlar, natijalar, reytinglar va tayyorgarlik bo'limi ulanadi."
    );
  }

  if (text === "📰 Yangiliklar") {
    return bot.sendMessage(
      chatId,
      "📰 CHESARA yangiliklari\n\nTurnirlar, g'oliblar, natijalar va jonli strimlar shu bo'limda chiqadi."
    );
  }

  if (text === "👤 Profil") {
    const user = telegramUsers.get(chatId);

    return bot.sendMessage(
      chatId,
      `👤 Profil

Telegram ID: ${user?.chatId || chatId}
Username: @${user?.username || "noma'lum"}

CHESARA akkauntingiz keyingi bosqichda shu Telegram hisobiga bog'lanadi.`
    );
  }
});

bot.on("polling_error", (error) => {
  console.error("Telegram polling xatosi:", error.message);
});

console.log("♟ CHESARA Telegram Bot ishga tushdi.");

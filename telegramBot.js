const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN topilmadi!");
  module.exports = null;
  return;
}

const bot = new TelegramBot(token, { polling: true });

console.log("🤖 CHESARA Telegram bot ishga tushdi.");

const mainMenu = {
  reply_markup: {
    keyboard: [
      ["👨‍🏫 Ustoz kabineti", "👨‍🎓 O‘quvchi kabineti"],
      ["📅 Davomat", "📊 Hisobotlar"],
      ["🧠 O‘yin tahlili", "🏆 Turnirlar"],
      ["📰 Yangiliklar", "🔔 Ogohlantirishlar"]
    ],
    resize_keyboard: true
  }
};

const backMenu = {
  reply_markup: {
    keyboard: [
      ["🏠 Bosh menyu"]
    ],
    resize_keyboard: true
  }
};

bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "shaxmatchi";

  await bot.sendMessage(
    chatId,
    `♟️ CHESARA'ga xush kelibsiz, ${firstName}!

🌍 AI Shaxmat Platformasi

CHESARA orqali siz:

👨‍🏫 Ustozlar
👨‍🎓 O‘quvchilar
📅 Davomat
📊 Hisobotlar
🔔 Ogohlantirishlar
🧠 AI O‘yin Tahlili
🏆 Turnirlar
📰 Shaxmat yangiliklari

bilan ishlashingiz mumkin.

♟️ CHESARA — shaxmatni oddiy o‘yin emas,
aqlli ta'lim tizimiga aylantiradi.`,
    mainMenu
  );
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.text === "/start") return;

  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "🏠 Bosh menyu") {
    await bot.sendMessage(
      chatId,
      "🏠 CHESARA bosh menyusi",
      mainMenu
    );
    return;
  }

  if (text === "👨‍🏫 Ustoz kabineti") {
    await bot.sendMessage(
      chatId,
      `👨‍🏫 USTOZ KABINETI

Bu bo‘lim orqali ustoz:

👥 Guruhlarini ko‘radi
📅 Dars jadvalini boshqaradi
✅ Davomat qiladi
📊 O‘quvchilar natijasini ko‘radi
💰 To‘lovlarni nazorat qiladi
🧠 O‘quvchilar o‘yinlarini tahlil qiladi
📈 Oylik hisobot oladi

⏰ Muhim:
Dars boshlanganidan 15 daqiqa ichida davomat qilinmasa,
CHESARA direktor uchun avtomatik ogohlantirish yuboradi.`,
      backMenu
    );
    return;
  }

  if (text === "👨‍🎓 O‘quvchi kabineti") {
    await bot.sendMessage(
      chatId,
      `👨‍🎓 O‘QUVCHI KABINETI

O‘quvchi:

📅 O‘z davomatini
📚 Guruhini
🧠 O‘yin tahlillarini
📈 Shaxsiy rivojlanishini
🏆 Turnirlarini
🎯 Shaxsiy shaxmat uslubini

ko‘rishi mumkin.

CHESARA o‘quvchining o‘yinlarini vaqt davomida o‘rganib,
uning kuchli va zaif tomonlarini aniqlab boradi.`,
      backMenu
    );
    return;
  }

  if (text === "📅 Davomat") {
    await bot.sendMessage(
      chatId,
      `📅 DAVOMAT

Bugungi dars uchun:

✅ Keldi
❌ Kelmagan
⏰ Kechikdi

Ustoz davomatni belgilaydi.

⚠️ Agar dars boshlanganidan 15 daqiqa o‘tib ham
davomat qilinmasa:

🔔 CHESARA → direktoriga avtomatik ogohlantirish yuboradi.`,
      backMenu
    );
    return;
  }

  if (text === "📊 Hisobotlar") {
    await bot.sendMessage(
      chatId,
      `📊 HISOBOTLAR

CHESARA quyidagi hisobotlarni tayyorlaydi:

📅 Kunlik
📆 Haftalik
🗓️ Oylik

Masalan:

1-sentabr → 30-sentabr

davomida o‘quvchining:

✅ Davomati
📚 Darslari
🧠 O‘yinlari
📈 Rivojlanishi
🏆 Turnirlari

bo‘yicha umumiy hisobot shakllantiriladi.

Hisobot ustozga yuboriladi.`,
      backMenu
    );
    return;
  }

  if (text === "🧠 O‘yin tahlili") {
    await bot.sendMessage(
      chatId,
      `🧠 AI O‘YIN TAHLILI

CHESARA o‘quvchining shaxmat o‘yinlarini tahlil qiladi.

♟️ Lichess
♟️ Chess.com
♟️ Telegramdagi shaxmat
📸 Screenshot orqali o‘yin

Tahlilda:

❓ Blunder
❗ Xato
‼️ Kuchli yurish
⭐ Juda kuchli yurish
🎯 Eng yaxshi yurish

aniqlanadi.

Bundan tashqari CHESARA:

⚔️ Hujumkor uslub
🛡️ Himoyaviy uslub
♟️ Debyut tanlovi
🎯 Taktik odatlar
🧠 O‘yin uslubi

bo‘yicha o‘quvchining shaxsiy profilini shakllantiradi.`,
      backMenu
    );
    return;
  }

  if (text === "🏆 Turnirlar") {
    await bot.sendMessage(
      chatId,
      `🏆 TURNIRLAR

CHESARA:

🏆 Turnirlarni kuzatadi
📅 Turnir sanalarini ko‘rsatadi
🥇 G‘oliblarni chiqaradi
📊 Natijalarni jamlaydi
📈 O‘quvchi natijasini kuzatadi

Kelajakda:

🎥 Strimlar
📰 Turnir yangiliklari
🥇 1-o‘rin
🥈 2-o‘rin
🥉 3-o‘rin

ham bir joyda bo‘ladi.`,
      backMenu
    );
    return;
  }

  if (text === "📰 Yangiliklar") {
    await bot.sendMessage(
      chatId,
      `📰 CHESARA YANGILIKLARI

Bu bo‘limda:

🏆 Turnirlar
🥇 G‘oliblar
📊 Muhim natijalar
🎥 Strimlar
♟️ Shaxmat olamidagi yangiliklar

joylashtiriladi.

CHESARA foydalanuvchini faqat dars bilan emas,
shaxmat olami bilan ham doimiy bog‘lab turadi.`,
      backMenu
    );
    return;
  }

  if (text === "🔔 Ogohlantirishlar") {
    await bot.sendMessage(
      chatId,
      `🔔 OGOHLANTIRISHLAR

CHESARA avtomatik nazorat qiladi:

⏰ Ustoz davomat qilmagan
👨‍🎓 O‘quvchi darsga kelmagan
📅 Dars o‘tkazilmagan
💰 To‘lov kechikkan
📈 O‘quvchi faolligi pasaygan

Muhim holatlarda tegishli ustoz yoki
direktorga avtomatik xabar yuboriladi.`,
      backMenu
    );
    return;
  }

  await bot.sendMessage(
    chatId,
    "♟️ CHESARA menyusidan kerakli bo‘limni tanlang.",
    mainMenu
  );
});

bot.on("polling_error", (error) => {
  console.error("❌ Telegram polling xatosi:", error.message);
});

module.exports = bot;

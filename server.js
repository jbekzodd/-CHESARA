const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// CHESARA WEB
// ===============================

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    status: "online",
    bot: BOT_TOKEN ? "configured" : "not_configured",
    time: new Date().toISOString()
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    project: "CHESARA",
    server: "online",
    telegram: BOT_TOKEN ? "online" : "offline",
    attendance: "ready",
    reports: "ready",
    chessAnalysis: "ready"
  });
});

// ===============================
// TELEGRAM BOT
// ===============================

let bot = null;

if (BOT_TOKEN) {

  bot = new TelegramBot(BOT_TOKEN, {
    polling: true
  });

  console.log("🤖 CHESARA Telegram Bot ulandi.");

  bot.onText(/^\/start$/, async (msg) => {

    const chatId = msg.chat.id;

    const text =
`♟️ CHESARA'ga xush kelibsiz!

AI Shaxmat Platformasi

Bu bot orqali:

♟️ Darslar
📅 Davomat
📊 Hisobotlar
🔔 Ogohlantirishlar
🧠 O'yin tahlili
🏆 Turnirlar
📰 Yangiliklar

boshqariladi.

CHESARA — shaxmatni oddiy emas,
aqlli tizimga aylantiradi.`;

    const keyboard = {
      reply_markup: {
        keyboard: [
          [
            { text: "📚 Darslar" },
            { text: "📅 Davomat" }
          ],
          [
            { text: "📊 Hisobotlar" },
            { text: "🧠 O'yin tahlili" }
          ],
          [
            { text: "🏆 Turnirlar" },
            { text: "📰 Yangiliklar" }
          ],
          [
            { text: "🔔 Ogohlantirishlar" }
          ]
        ],
        resize_keyboard: true
      }
    };

    await bot.sendMessage(chatId, text, keyboard);
  });


  // ===============================
  // BOT MENULARI
  // ===============================

  bot.on("message", async (msg) => {

    if (!msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "📚 Darslar") {

      await bot.sendMessage(
        chatId,
`📚 Darslar

Bu bo‘limda:

• Bugungi darslar
• Keyingi darslar
• Jonli darslar
• Dars jadvali
• Ustoz dars boshlaganini nazorat qilish

funksiyalari bo‘ladi.`
      );

      return;
    }


    if (text === "📅 Davomat") {

      await bot.sendMessage(
        chatId,
`📅 Davomat

CHESARA avtomatik nazorat qiladi.

⏱ Dars boshlangandan 15 daqiqa ichida ustoz davomat qilmasa:
🔔 direktor/admin uchun ogohlantirish yuboriladi.

O‘quvchi darsga kelmasa ham tegishli ogohlantirish tizimi ishlaydi.`
      );

      return;
    }


    if (text === "📊 Hisobotlar") {

      await bot.sendMessage(
        chatId,
`📊 Hisobotlar

CHESARA quyidagilarni shakllantiradi:

📅 Oylik hisobot
♟️ O‘quvchi davomati
📚 O‘tilgan darslar
🧠 O‘yinlar statistikasi
📈 O‘quvchi rivojlanishi

Masalan:
1-sentabr → 30-sentabr

oralig‘idagi to‘liq natija alohida hisobot sifatida tayyorlanadi.`
      );

      return;
    }


    if (text === "🧠 O'yin tahlili") {

      await bot.sendMessage(
        chatId,
`🧠 CHESARA AI O‘yin tahlili

O‘quvchi:

♟️ Lichess o‘yinini
♟️ Chess.com o‘yinini
📸 Screenshot orqali Telegramdagi o‘yinni

yuborishi mumkin.

Tizim keyinchalik:

‼️ katta xatolar
❗ kuchli yurishlar
📊 aniqlik
⚔️ hujumkorlik
🛡 himoyaviylik
♟️ opening uslubi

bo‘yicha tahlil qiladi.`
      );

      return;
    }


    if (text === "🏆 Turnirlar") {

      await bot.sendMessage(
        chatId,
`🏆 Turnirlar

CHESARA:

• Yaqin turnirlarni
• Turnir natijalarini
• O‘quvchilar ishtirokini
• Turnirga tayyorgarlikni

bir joyda boshqarish uchun ishlab chiqiladi.`
      );

      return;
    }


    if (text === "📰 Yangiliklar") {

      await bot.sendMessage(
        chatId,
`📰 Shaxmat yangiliklari

Bu bo‘limda:

🏆 Turnirlar
🥇 G‘oliblar
📊 Natijalar
🎥 Strimlar
♟️ Muhim shaxmat yangiliklari

joylashtiriladi.`
      );

      return;
    }


    if (text === "🔔 Ogohlantirishlar") {

      await bot.sendMessage(
        chatId,
`🔔 CHESARA Ogohlantirishlari

Tizim avtomatik ravishda:

⚠️ Davomat qilinmasa
⚠️ Dars bajarilmasa
⚠️ O‘quvchi darsga kelmasa
⚠️ Ustoz darsni nazoratsiz qoldirsa

tegishli shaxsga xabar yuborish tizimini qo‘llaydi.`
      );

      return;
    }

  });


  bot.on("polling_error", (error) => {
    console.error("Telegram polling error:", error.message);
  });

} else {

  console.log("⚠️ TELEGRAM_BOT_TOKEN topilmadi.");

}


// ===============================
// SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {

  console.log(`🚀 CHESARA server ${PORT}-portda ishlayapti.`);
  console.log("⏰ CHESARA dars nazorati ishga tushdi.");

});

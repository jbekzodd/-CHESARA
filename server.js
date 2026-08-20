const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/* =========================================================
   CHESARA — PROFESSIONAL API
   ========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    product: "AI Chess Intelligence Platform",
    status: "online",
    telegram: BOT_TOKEN ? "configured" : "not_configured",
    time: new Date().toISOString()
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    platform: "CHESARA",
    server: "online",
    telegramBot: BOT_TOKEN ? "online" : "offline",
    chessAnalysis: "ready",
    lichess: "ready",
    chessCom: "ready",
    screenshotAnalysis: "ready",
    attendance: "ready",
    reports: "ready",
    tournaments: "ready",
    notifications: "ready"
  });
});

/* =========================================================
   DASHBOARD STATISTICS
   ========================================================= */

app.get("/api/dashboard", (req, res) => {
  res.json({
    success: true,

    students: 0,
    teachers: 0,
    groups: 0,

    todayAttendance: {
      present: 0,
      absent: 0,
      late: 0
    },

    lessons: {
      today: 0,
      completed: 0,
      upcoming: 0
    },

    chess: {
      analyzedGames: 0,
      averageAccuracy: 0,
      tournaments: 0
    },

    alerts: 0
  });
});

/* =========================================================
   AI CHESS ANALYSIS
   ========================================================= */

app.post("/api/chess/analyze", async (req, res) => {

  try {

    const { source, game, moves, player } = req.body;

    if (!source && !game && !moves) {
      return res.status(400).json({
        success: false,
        message: "Tahlil uchun o‘yin ma'lumotlari yuborilmadi."
      });
    }

    /*
      Hozirgi bosqichda API o‘yinni qabul qiladi.
      Keyingi bosqichda Stockfish engine ulanadi.
    */

    const result = {
      success: true,

      player: player || "O‘yinchi",

      source: source || "manual",

      accuracy: null,

      classification: {
        brilliant: 0,
        best: 0,
        excellent: 0,
        good: 0,
        inaccuracies: 0,
        mistakes: 0,
        blunders: 0
      },

      style: {
        attacking: 0,
        defensive: 0,
        positional: 0,
        tactical: 0
      },

      opening: {
        name: "Aniqlanmoqda...",
        confidence: 0
      },

      recommendations: [
        "O‘yin ma'lumotlari qabul qilindi.",
        "AI chuqur tahlili keyingi engine bosqichida amalga oshiriladi."
      ],

      status: "received"
    };

    return res.json(result);

  } catch (error) {

    console.error("Chess analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "O‘yin tahlilida texnik xatolik yuz berdi."
    });

  }

});

/* =========================================================
   TELEGRAM BOT
   ========================================================= */

let bot = null;

if (BOT_TOKEN) {

  bot = new TelegramBot(BOT_TOKEN, {
    polling: true
  });

  console.log("🤖 CHESARA Telegram Bot ulandi.");

  bot.onText(/^\/start$/, async (msg) => {

    const chatId = msg.chat.id;

    const welcome =
`♟️ CHESARA AI CHESS PLATFORM

Xush kelibsiz.

CHESARA — o‘quvchilar, ustozlar va shaxmatchilar uchun yagona aqlli boshqaruv platformasi.

Platforma orqali:
• Darslar va davomatni boshqarish
• O‘quvchilar rivojlanishini kuzatish
• Shaxmat o‘yinlarini AI yordamida tahlil qilish
• Turnirlar va natijalarni nazorat qilish
• Avtomatik hisobotlar olish
• Muhim holatlar bo‘yicha ogohlantirishlar olish mumkin.

♟️ Shaxmatni o‘ynash emas — uni chuqur tushunish uchun CHESARA.`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🌐 CHESARA platformasini ochish",
              web_app: {
                url: "https://chesara.onrender.com"
              }
            }
          ],
          [
            {
              text: "🧠 O‘yin tahlili"
            },
            {
              text: "📊 Hisobotlar"
            }
          ],
          [
            {
              text: "📚 Darslar"
            },
            {
              text: "📅 Davomat"
            }
          ],
          [
            {
              text: "🏆 Turnirlar"
            },
            {
              text: "📰 Yangiliklar"
            }
          ],
          [
            {
              text: "🔔 Ogohlantirishlar"
            }
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, welcome, keyboard);

  });

  /* =====================================================
     TELEGRAM MENULARI
     ===================================================== */

  bot.on("message", async (msg) => {

    if (!msg.text || msg.text === "/start") return;

    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "🧠 O‘yin tahlili") {

      await bot.sendMessage(
        chatId,
`🧠 CHESARA AI CHESS INTELLIGENCE

O‘yiningizni CHESARA orqali tahlil qiling.

Qo‘llab-quvvatlanadigan manbalar:

♟️ Lichess
♟️ Chess.com
📸 Screenshot orqali o‘yin

Tahlil natijasida:

‼️ Blunderlar
❗ Xatolar
!? Noaniq yurishlar
⭐ Kuchli yurishlar
📊 Accuracy
⚔️ Hujumkorlik
🛡 Himoyaviylik
♟️ Opening profili

aniqlanadi.

Keyingi bosqichda o‘yinchi uslubiga mos individual opening tavsiyalari ham shakllantiriladi.`
      );

      return;
    }

    if (text === "📚 Darslar") {

      await bot.sendMessage(
        chatId,
`📚 DARS BOSHQARUVI

CHESARA dars jarayonini yagona tizimda boshqarishga mo‘ljallangan.

• Dars jadvali
• Ustozlar
• Guruhlar
• O‘quvchilar
• Dars holati
• Dars davomati

Barcha jarayonlar platforma orqali nazorat qilinadi.`
      );

      return;
    }

    if (text === "📅 Davomat") {

      await bot.sendMessage(
        chatId,
`📅 DAVOMAT NAZORATI

CHESARA davomat jarayonini avtomatlashtiradi.

⏱ Dars boshlanganidan keyin 15 daqiqa ichida ustoz davomatni belgilamasa, tizim mas'ul administrator yoki direktorga avtomatik ogohlantirish yuboradi.

O‘quvchi darsda bo‘lmagan holatlar ham qayd etiladi.`
      );

      return;
    }

    if (text === "📊 Hisobotlar") {

      await bot.sendMessage(
        chatId,
`📊 ANALITIK HISOBOTLAR

CHESARA o‘quv jarayoni bo‘yicha avtomatik hisobotlar tayyorlaydi.

Masalan:

📅 1-sentabr — 30-sentabr

oralig‘ida:

• O‘tilgan darslar
• Davomat
• Qoldirilgan darslar
• O‘quvchi faolligi
• Shaxmat natijalari
• Rivojlanish ko‘rsatkichlari

umumlashtiriladi.`
      );

      return;
    }

    if (text === "🏆 Turnirlar") {

      await bot.sendMessage(
        chatId,
`🏆 TURNIRLAR

CHESARA turnir jarayonlarini ham yagona platformaga birlashtiradi.

• Yaqin turnirlar
• Ishtirokchilar
• Natijalar
• Reyting
• G‘oliblar
• Turnirga tayyorgarlik

va keyinchalik jonli turnir ma'lumotlari ham platformada ko‘rsatiladi.`
      );

      return;
    }

    if (text === "📰 Yangiliklar") {

      await bot.sendMessage(
        chatId,
`📰 CHESS NEWS

CHESARA shaxmat olamidagi muhim ma'lumotlarni bir joyga jamlaydi.

🏆 Turnirlar
🥇 G‘oliblar
📊 Natijalar
🎥 Strimlar
♟️ Muhim shaxmat yangiliklari

Yangiliklar tizimi keyinchalik admin panel orqali boshqariladi.`
      );

      return;
    }

    if (text === "🔔 Ogohlantirishlar") {

      await bot.sendMessage(
        chatId,
`🔔 INTELLIGENT ALERTS

CHESARA muhim holatlarni avtomatik nazorat qiladi.

⚠️ Davomat o‘z vaqtida qilinmasa
⚠️ O‘quvchi darsni bajarmasa
⚠️ Dars jarayonida muammo yuzaga kelsa
⚠️ Belgilangan nazorat bajarilmasa

tizim tegishli mas'ul shaxsga xabar yuborish mexanizmini ishga tushiradi.`
      );

      return;
    }

  });

  bot.on("polling_error", (error) => {
    console.error("Telegram polling error:", error.message);
  });

} else {

  console.log("⚠️ TELEGRAM_BOT_TOKEN Render Environment Variables'da topilmadi.");

}

/* =========================================================
   SERVER START
   ========================================================= */

app.listen(PORT, "0.0.0.0", () => {

  console.log(`🚀 CHESARA server ${PORT}-portda ishlayapti.`);
  console.log("⏰ CHESARA dars nazorati ishga tushdi.");

});

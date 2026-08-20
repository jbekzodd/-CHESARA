const express = require("express");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

const app = express();

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = "https://chesara.onrender.com";

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/* =====================================================
   WEBSITE
===================================================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    status: "online",
    telegram: BOT_TOKEN ? "configured" : "missing",
    time: new Date().toISOString()
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    project: "CHESARA",
    server: "online",
    telegramBot: BOT_TOKEN ? "online" : "offline",
    chessAnalysis: "ready",
    attendance: "ready",
    reports: "ready",
    tournaments: "ready",
    notifications: "ready"
  });
});

/* =====================================================
   DASHBOARD API
===================================================== */

app.get("/api/dashboard", (req, res) => {
  res.json({
    success: true,

    students: 0,
    teachers: 0,
    groups: 0,

    attendance: {
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
      gamesAnalyzed: 0,
      averageAccuracy: 0
    },

    alerts: 0
  });
});

/* =====================================================
   CHESS ANALYSIS API
===================================================== */

app.post("/api/chess/analyze", async (req, res) => {
  try {
    const { source, game, moves, player } = req.body;

    if (!game && !moves) {
      return res.status(400).json({
        success: false,
        message: "Tahlil qilish uchun o‘yin ma'lumotlari yuborilmadi."
      });
    }

    res.json({
      success: true,
      status: "received",

      player: player || "O‘yinchi",
      source: source || "manual",

      message:
        "O‘yin CHESARA AI tahlil tizimiga qabul qilindi.",

      analysis: {
        accuracy: null,
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
        tactical: 0,
        positional: 0
      },

      opening: {
        name: "Aniqlanmoqda",
        confidence: 0
      },

      recommendations: [
        "O‘yin qabul qilindi.",
        "Chuqur Stockfish tahlili keyingi modul orqali bajariladi."
      ]
    });

  } catch (error) {
    console.error("CHESS ANALYSIS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "O‘yin tahlilida texnik xatolik yuz berdi."
    });
  }
});

/* =====================================================
   TELEGRAM BOT
===================================================== */

let bot = null;

if (BOT_TOKEN) {

  bot = new TelegramBot(BOT_TOKEN, {
    polling: true
  });

  console.log("🤖 CHESARA Telegram Bot ulandi.");

  /* ===================================================
     START
  =================================================== */

  bot.onText(/^\/start$/, async (msg) => {

    const chatId = msg.chat.id;

    const welcome = `
♟️ CHESARA AI CHESS PLATFORM

Xush kelibsiz.

CHESARA — shaxmat markazlari, ustozlar va o‘quvchilar uchun yagona aqlli boshqaruv platformasi.

Platformada:

♟ O‘quvchilar
♜ Ustozlar
👥 Guruhlar
📚 Darslar
📅 Davomat
🧠 AI o‘yin tahlili
🏆 Turnirlar
📰 Yangiliklar
📊 Hisobotlar
🔔 Avtomatik ogohlantirishlar

bitta tizimga birlashtiriladi.

Shaxmatni oddiy o‘yin emas,
rivojlanish tizimiga aylantiring.

— CHESARA
`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [

          [
            {
              text: "🌐 CHESARA platformasini ochish",
              web_app: {
                url: SITE_URL
              }
            }
          ],

          [
            {
              text: "🧠 O‘yin tahlili",
              callback_data: "analysis"
            },
            {
              text: "📊 Hisobotlar",
              callback_data: "reports"
            }
          ],

          [
            {
              text: "📚 Darslar",
              callback_data: "lessons"
            },
            {
              text: "📅 Davomat",
              callback_data: "attendance"
            }
          ],

          [
            {
              text: "🏆 Turnirlar",
              callback_data: "tournaments"
            },
            {
              text: "📰 Yangiliklar",
              callback_data: "news"
            }
          ],

          [
            {
              text: "🔔 Ogohlantirishlar",
              callback_data: "alerts"
            }
          ]

        ]
      }
    };

    await bot.sendMessage(chatId, welcome, keyboard);
  });

  /* ===================================================
     INLINE BUTTON CALLBACKS
  =================================================== */

  bot.on("callback_query", async (query) => {

    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const action = query.data;

    try {

      await bot.answerCallbackQuery(query.id);

      /* ---------------- ANALYSIS ---------------- */

      if (action === "analysis") {

        await bot.editMessageText(
`🧠 CHESARA AI CHESS INTELLIGENCE

O‘yin tahlili markazi.

CHESARA quyidagi manbalar bilan ishlash uchun ishlab chiqiladi:

♟️ Lichess
♟️ Chess.com
📸 Screenshot orqali Telegram o‘yini

Tahlilda:

‼️ Blunder
❗ Mistake
?! Inaccuracy
⭐ Best Move
‼️ Brilliant Move
📊 Accuracy
⚔️ Hujumkorlik
🛡 Himoyaviylik
♟️ Opening profili

aniqlanadi.

Eng muhimi — tizim o‘yinchining o‘ziga xos uslubini o‘rganib boradi.

Masalan:
"Hujumkor o‘yinchi"
"Pozitsion o‘yinchi"
"Taktik o‘yinchi"

va shu asosida individual opening tavsiyalarini shakllantiradi.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Tahlil markazini ochish",
                    web_app: {
                      url: `${SITE_URL}?page=analysis`
                    }
                  }
                ],
                [
                  {
                    text: "⬅️ Bosh menyu",
                    callback_data: "home"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

      /* ---------------- REPORTS ---------------- */

      if (action === "reports") {

        await bot.editMessageText(
`📊 CHESARA ANALITIK HISOBOTLAR

Platforma avtomatik ravishda:

📅 Oylik hisobot
📚 Darslar statistikasi
📅 Davomat
♟️ O‘yinlar soni
📈 Accuracy
🧠 O‘yinchi rivojlanishi
🏆 Turnir natijalari

bo‘yicha hisobot tayyorlaydi.

Masalan:

01.09 — 30.09

oralig‘idagi o‘quvchi faoliyati alohida hisobot sifatida shakllantiriladi.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Hisobotlar paneli",
                    web_app: {
                      url: `${SITE_URL}?page=reports`
                    }
                  }
                ],
                [
                  {
                    text: "⬅️ Bosh menyu",
                    callback_data: "home"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

      /* ---------------- LESSONS ---------------- */

      if (action === "lessons") {

        await bot.editMessageText(
`📚 DARS BOSHQARUVI

CHESARA dars jarayonini markazlashtiradi.

• Ustozlar
• O‘quvchilar
• Guruhlar
• Dars jadvali
• Jonli darslar
• Dars holati
• Davomat nazorati

hammasi bitta tizimda ishlaydi.

Ustoz darsni boshlaydi → tizim darsni qayd qiladi → davomat nazorat qilinadi.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Darslar paneli",
                    web_app: {
                      url: `${SITE_URL}?page=lessons`
                    }
                  }
                ],
                [
                  {
                    text: "⬅️ Bosh menyu",
                    callback_data: "home"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

      /* ---------------- ATTENDANCE ---------------- */

      if (action === "attendance") {

        await bot.editMessageText(
`📅 DAVOMAT NAZORATI

CHESARA avtomatik nazorat tizimiga ega bo‘ladi.

⏱ Dars boshlanganidan 15 daqiqa ichida ustoz davomat qilmasa:

🔔 direktor yoki super admin'ga ogohlantirish yuboriladi.

O‘quvchi darsga kelmasa:

⚠️ tegishli mas'ul shaxsga xabar beriladi.

Barcha ma'lumotlar oylik hisobotga qo‘shiladi.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Davomat paneli",
                    web_app: {
                      url: `${SITE_URL}?page=attendance`
                    }
                  }
                ],
                [
                  {
                    text: "⬅️ Bosh menyu",
                    callback_data: "home"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

      /* ---------------- TOURNAMENTS ---------------- */

      if (action === "tournaments") {

        await bot.editMessageText(
`🏆 TURNIRLAR

CHESARA turnirga tayyorgarlik jarayonini ham boshqaradi.

🏆 Yaqin turnirlar
👥 Ishtirokchilar
🥇 Natijalar
📊 Reyting
🎥 Strimlar
📰 Turnir yangiliklari

O‘quvchi qaysi turnirga tayyorlanayotganini ham tizimda kuzatish mumkin bo‘ladi.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Turnirlar",
                    web_app: {
                      url: `${SITE_URL}?page=tournaments`
                    }
                  }
                ],
                [
                  {
                    text: "⬅️ Bosh menyu",
                    callback_data: "home"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

      /* ---------------- NEWS ---------------- */

      if (action === "news") {

        await bot.editMessageText(
`📰 CHESARA CHESS NEWS

Platformada shaxmatga oid muhim yangiliklar jamlanadi.

🏆 Turnirlar
🥇 G‘oliblar
📊 Natijalar
🎥 Jonli strimlar
♟️ Muhim voqealar

Yangiliklarni Super Admin boshqaradi.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Yangiliklar",
                    web_app: {
                      url: `${SITE_URL}?page=news`
                    }
                  }
                ],
                [
                  {
                    text: "⬅️ Bosh menyu",
                    callback_data: "home"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

      /* ---------------- ALERTS ---------------- */

      if (action === "alerts") {

        await bot.editMessageText(
`🔔 INTELLIGENT ALERTS

CHESARA muhim jarayonlarni avtomatik nazorat qiladi.

⚠️ Ustoz davomat qilmasa
⚠️ O‘quvchi darsga kelmasa
⚠️ Dars bajarilmasa
⚠️ Nazorat vazifasi bajarilmasa

tizim tegishli mas'ul shaxsga avtomatik xabar yuboradi.

15 daqiqalik davomat nazorati ham shu tizimning bir qismi bo‘ladi.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 Ogohlantirishlar",
                    web_app: {
                      url: `${SITE_URL}?page=alerts`
                    }
                  }
                ],
                [
                  {
                    text: "⬅️ Bosh menyu",
                    callback_data: "home"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

      /* ---------------- HOME ---------------- */

      if (action === "home") {

        await bot.editMessageText(
`♟️ CHESARA AI CHESS PLATFORM

Bosh menyu.

Platformaga kirish yoki kerakli modulni tanlang.`,
          {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🌐 CHESARA platformasini ochish",
                    web_app: {
                      url: SITE_URL
                    }
                  }
                ],
                [
                  {
                    text: "🧠 O‘yin tahlili",
                    callback_data: "analysis"
                  },
                  {
                    text: "📊 Hisobotlar",
                    callback_data: "reports"
                  }
                ],
                [
                  {
                    text: "📚 Darslar",
                    callback_data: "lessons"
                  },
                  {
                    text: "📅 Davomat",
                    callback_data: "attendance"
                  }
                ],
                [
                  {
                    text: "🏆 Turnirlar",
                    callback_data: "tournaments"
                  },
                  {
                    text: "📰 Yangiliklar",
                    callback_data: "news"
                  }
                ],
                [
                  {
                    text: "🔔 Ogohlantirishlar",
                    callback_data: "alerts"
                  }
                ]
              ]
            }
          }
        );

        return;
      }

    } catch (error) {

      console.error("TELEGRAM CALLBACK ERROR:", error);

    }

  });

  bot.on("polling_error", (error) => {
    console.error("TELEGRAM POLLING ERROR:", error.message);
  });

} else {

  console.log(
    "⚠️ TELEGRAM_BOT_TOKEN Render Environment Variables'da topilmadi."
  );

}

/* =====================================================
   SERVER START
===================================================== */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 CHESARA server ${PORT}-portda ishlayapti.`);
  console.log("⏰ CHESARA dars nazorati ishga tushdi.");
});

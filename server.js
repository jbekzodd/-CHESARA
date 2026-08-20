// ============================================================
// CHESARA — Main Server
// Render + Telegram Bot + Attendance Scheduler
// ============================================================

const express = require("express");
const cors = require("cors");

const {
  startScheduler,
  getLessons,
  getLesson,
  addLesson,
  markAttendance,
  finishLesson
} = require("./scheduler");

const app = express();

const PORT = process.env.PORT || 3000;

// Telegram bot
let bot = null;

try {
  const TelegramBot = require("node-telegram-bot-api");

  if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(
      process.env.TELEGRAM_BOT_TOKEN,
      {
        polling: true
      }
    );

    console.log("🤖 CHESARA Telegram Bot ulandi.");
  } else {
    console.log(
      "⚠️ TELEGRAM_BOT_TOKEN hali Render Environment Variables'da yo'q."
    );
  }
} catch (error) {
  console.log(
    "⚠️ Telegram moduli hali o'rnatilmagan yoki mavjud emas."
  );
}

// ------------------------------------------------------------
// Middleware
// ------------------------------------------------------------

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------------------------------------------------
// Health Check
// ------------------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    message: "CHESARA server ishlayapti ♟️",
    status: "online",
    time: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    telegramBot: Boolean(bot),
    serverTime: new Date().toISOString()
  });
});

// ------------------------------------------------------------
// API — Darslar
// ------------------------------------------------------------

app.get("/api/lessons", (req, res) => {
  try {
    const lessons = getLessons();

    res.json({
      success: true,
      count: lessons.length,
      lessons
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Darslarni olishda xatolik."
    });
  }
});

// ------------------------------------------------------------
// API — Bitta dars
// ------------------------------------------------------------

app.get("/api/lessons/:id", (req, res) => {
  const lesson = getLesson(req.params.id);

  if (!lesson) {
    return res.status(404).json({
      success: false,
      message: "Dars topilmadi."
    });
  }

  res.json({
    success: true,
    lesson
  });
});

// ------------------------------------------------------------
// API — Yangi dars yaratish
// ------------------------------------------------------------

app.post("/api/lessons", (req, res) => {
  try {
    const {
      id,
      groupId,
      groupName,
      coachId,
      coachName,
      directorTelegramId,
      startTime,
      durationMinutes
    } = req.body;

    if (
      !groupName ||
      !coachName ||
      !startTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "groupName, coachName va startTime kerak."
      });
    }

    const lesson = addLesson({
      id:
        id ||
        "lesson_" +
          Date.now(),

      groupId:
        groupId || null,

      groupName,

      coachId:
        coachId || null,

      coachName,

      directorTelegramId:
        directorTelegramId || null,

      startTime,

      durationMinutes:
        Number(durationMinutes) || 90
    });

    res.json({
      success: true,
      message: "Dars yaratildi.",
      lesson
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Dars yaratishda xatolik."
    });
  }
});

// ------------------------------------------------------------
// API — Davomat qilish
// ------------------------------------------------------------

app.post(
  "/api/lessons/:id/attendance",
  (req, res) => {
    try {
      const result =
        markAttendance(req.params.id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json({
        success: true,
        message:
          "Davomat muvaffaqiyatli qayd qilindi.",
        lesson: result.lesson
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Davomatni saqlashda xatolik."
      });
    }
  }
);

// ------------------------------------------------------------
// API — Darsni tugatish
// ------------------------------------------------------------

app.post(
  "/api/lessons/:id/finish",
  (req, res) => {
    try {
      const result =
        finishLesson(req.params.id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Dars topilmadi."
        });
      }

      res.json({
        success: true,
        message: "Dars tugatildi."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Darsni tugatishda xatolik."
      });
    }
  }
);

// ------------------------------------------------------------
// Telegram — Test xabari
// ------------------------------------------------------------

app.post("/api/telegram/test", async (req, res) => {
  if (!bot) {
    return res.status(503).json({
      success: false,
      message:
        "Telegram bot ulanmagan. TELEGRAM_BOT_TOKEN ni tekshiring."
    });
  }

  const {
    chatId,
    message
  } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({
      success: false,
      message:
        "chatId va message kerak."
    });
  }

  try {
    await bot.sendMessage(
      chatId,
      message
    );

    res.json({
      success: true,
      message:
        "Telegram xabari yuborildi."
    });
  } catch (error) {
    console.error(
      "Telegram xatosi:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Telegram xabarini yuborib bo'lmadi.",
      error: error.message
    });
  }
});

// ------------------------------------------------------------
// Scheduler → Telegram
// ------------------------------------------------------------

function sendAttendanceWarning(warning) {
  if (!bot) {
    console.log(
      "⚠️ Bot ulanmagan. Ogohlantirish:",
      warning.message
    );

    return;
  }

  const chatId =
    warning.directorTelegramId;

  if (!chatId) {
    console.log(
      "⚠️ Direktor Telegram ID mavjud emas."
    );

    return;
  }

  bot
    .sendMessage(
      chatId,
      warning.message
    )
    .then(() => {
      console.log(
        "✅ Direktor ogohlantirildi:",
        chatId
      );
    })
    .catch(error => {
      console.error(
        "❌ Telegram ogohlantirish xatosi:",
        error.message
      );
    });
}

// ------------------------------------------------------------
// Telegram Bot Commands
// ------------------------------------------------------------

if (bot) {

  bot.setMyCommands([
    {
      command: "start",
      description:
        "CHESARA'ni boshlash"
    },
    {
      command: "darslar",
      description:
        "Mening darslarim"
    },
    {
      command: "davomat",
      description:
        "Davomat"
    },
    {
      command: "hisobot",
      description:
        "Hisobotlar"
    },
    {
      command: "tahlil",
      description:
        "Shaxmat o'yini tahlili"
    }
  ]).catch(error => {
    console.error(
      "Bot command xatosi:",
      error.message
    );
  });

  bot.onText(
    /\/start/,
    async msg => {

      const chatId =
        msg.chat.id;

      await bot.sendMessage(
        chatId,

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
aqlli tizimga aylantiradi.`
      );
    }
  );

  bot.onText(
    /\/darslar/,
    async msg => {

      const lessons =
        getLessons();

      const chatId =
        msg.chat.id;

      const myLessons =
        lessons.filter(
          lesson =>
            String(
              lesson.coachTelegramId
            ) === String(chatId)
        );

      if (myLessons.length === 0) {

        return bot.sendMessage(
          chatId,
          "📚 Hozircha sizga biriktirilgan dars topilmadi."
        );
      }

      const text =
        myLessons
          .slice(0, 10)
          .map(
            lesson =>
              `♟️ ${lesson.groupName}\n` +
              `👨‍🏫 ${lesson.coachName}\n` +
              `⏰ ${lesson.startTime}\n` +
              `📅 Davomat: ${
                lesson.attendanceTaken
                  ? "Qilingan ✅"
                  : "Kutilmoqda ⏳"
              }`
          )
          .join("\n\n");

      await bot.sendMessage(
        chatId,
        text
      );
    }
  );

  bot.onText(
    /\/davomat/,
    async msg => {

      await bot.sendMessage(
        msg.chat.id,

        `📅 DAVOMAT

Davomatni CHESARA web panelidan
bir bosishda qayd qilishingiz mumkin.

Keyingi bosqichda Telegramning
o'zidan ham davomat qilish
imkoniyatini qo'shamiz.`
      );
    }
  );

  bot.onText(
    /\/hisobot/,
    async msg => {

      await bot.sendMessage(
        msg.chat.id,

        `📊 OYLIK HISOBOT

CHESARA keyinchalik:

• o'quvchi qatnashuvi
• darslar soni
• o'tkazib yuborilgan darslar
• to'lovlar
• qarzdorlik
• ustoz faoliyati

bo'yicha avtomatik hisobot yaratadi.`
      );
    }
  );

  bot.onText(
    /\/tahlil/,
    async msg => {

      await bot.sendMessage(
        msg.chat.id,

        `🧠 CHESARA O'YIN TAHLILI

Lichess
Chess.com
Telegram shaxmat
Screenshot

orqali yuborilgan o'yinlarni
tahlil qilish moduli ulanadi.

♟️ ?? — katta xato
♟️ ? — xato
♟️ ! — yaxshi yurish
♟️ !! — ajoyib yurish

Bundan tashqari o'yinchining
shaxsiy o'yin uslubi va debuti
aniqlanadi.`
      );
    }
  );
}

// ------------------------------------------------------------
// Server Start
// ------------------------------------------------------------

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🚀 CHESARA server ${PORT}-portda ishlayapti.`
    );

    startScheduler(
      sendAttendanceWarning
    );
  }
);

// ------------------------------------------------------------
// Global error handling
// ------------------------------------------------------------

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled Rejection:",
      error
    );
  }
);

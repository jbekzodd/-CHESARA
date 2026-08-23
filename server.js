'use strict';

const express = require('express');
const path = require('path');
const cors = require('cors');

const {
  startScheduler,
  getLessons,
  getLesson,
  addLesson,
  markAttendance,
  finishLesson
} = require('./scheduler');

const app = express();
const PORT = Number(process.env.PORT) || 10000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// STATIC FILES
// ============================================================

app.use(express.static(__dirname));

const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

// ============================================================
// TELEGRAM BOT
// ============================================================

let bot = null;

const botToken =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

function startTelegramBot() {
  if (!botToken) {
    console.log(
      '⚠️ TELEGRAM_BOT_TOKEN yoki BOT_TOKEN topilmadi.'
    );
    return null;
  }

  try {
    const TelegramBot = require('node-telegram-bot-api');

    const telegramBot = new TelegramBot(botToken, {
      polling: true
    });

    console.log(
      '🤖 CHESARA Telegram Bot ishga tushdi.'
    );

    // --------------------------------------------------------
    // /start
    // --------------------------------------------------------

    telegramBot.onText(/^\/start(?:\s.*)?$/, async (msg) => {
      const chatId = msg.chat.id;
      const firstName =
        msg.from?.first_name || 'Foydalanuvchi';

      const welcomeText =
        `Assalomu alaykum, ${firstName}! ♟️\n\n` +
        `CHESARA platformasiga xush kelibsiz.\n\n` +
        `Bu yerda shaxmat darslari, davomat va o'quv jarayoni boshqariladi.\n\n` +
        `📚 /lessons — darslar\n` +
        `📊 /status — tizim holati\n` +
        `❓ /help — yordam`;

      try {
        await telegramBot.sendMessage(
          chatId,
          welcomeText
        );
      } catch (error) {
        console.error(
          '❌ /start xabari yuborilmadi:',
          error.message
        );
      }
    });

    // --------------------------------------------------------
    // /lessons
    // --------------------------------------------------------

    telegramBot.onText(/^\/lessons$/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const lessons = getLessons();

        if (!lessons.length) {
          await telegramBot.sendMessage(
            chatId,
            '📭 Hozircha rejalashtirilgan darslar mavjud emas.'
          );
          return;
        }

        let text = '📋 REJALASHTIRILGAN DARSLAR\n\n';

        lessons.forEach((lesson, index) => {
          text += `${index + 1}. ${lesson.title || 'Shaxmat darsi'}\n`;
          text += `👥 Guruh: ${lesson.groupName || '-'}\n`;
          text += `👨‍🏫 Ustoz: ${lesson.coachName || '-'}\n`;
          text += `🕒 Vaqt: ${lesson.startTime || '-'}\n`;
          text += `📌 Davomat: ${
            lesson.attendanceTaken
              ? 'Qilingan ✅'
              : 'Kutilmoqda ⏳'
          }\n`;
          text += `🏁 Holat: ${
            lesson.finished
              ? 'Yakunlangan'
              : 'Davom etmoqda / kutilmoqda'
          }\n\n`;
        });

        await telegramBot.sendMessage(
          chatId,
          text
        );
      } catch (error) {
        console.error(
          '❌ /lessons xatosi:',
          error.message
        );

        await telegramBot.sendMessage(
          chatId,
          '❌ Darslarni olishda xatolik yuz berdi.'
        );
      }
    });

    // --------------------------------------------------------
    // /status
    // --------------------------------------------------------

    telegramBot.onText(/^\/status$/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const lessons = getLessons();

        await telegramBot.sendMessage(
          chatId,
          `✅ CHESARA server faol.\n\n` +
          `📚 Jami darslar: ${lessons.length} ta\n` +
          `🤖 Telegram bot: faol\n` +
          `🟢 Server: online`
        );
      } catch (error) {
        console.error(
          '❌ /status xatosi:',
          error.message
        );
      }
    });

    // --------------------------------------------------------
    // /help
    // --------------------------------------------------------

    telegramBot.onText(/^\/help$/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        await telegramBot.sendMessage(
          chatId,
          `❓ CHESARA YORDAM\n\n` +
          `/start — Boshlash\n` +
          `/lessons — Darslarni ko'rish\n` +
          `/status — Server holati\n` +
          `/help — Yordam`
        );
      } catch (error) {
        console.error(
          '❌ /help xatosi:',
          error.message
        );
      }
    });

    // --------------------------------------------------------
    // POLLING ERROR
    // --------------------------------------------------------

    telegramBot.on(
      'polling_error',
      (error) => {
        console.error(
          '⚠️ Telegram polling xatosi:',
          error.code || '',
          error.message
        );
      }
    );

    return telegramBot;

  } catch (error) {
    console.error(
      '❌ Telegram botni ishga tushirishda xato:',
      error.message
    );

    return null;
  }
}

bot = startTelegramBot();

// ============================================================
// MAIN PAGE
// ============================================================

app.get('/', (req, res) => {
  const indexFile = path.join(
    __dirname,
    'index.html'
  );

  res.sendFile(indexFile, (error) => {
    if (error) {
      console.error(
        '❌ index.html yuborilmadi:',
        error.message
      );

      res.status(500).send(
        'CHESARA: index.html topilmadi.'
      );
    }
  });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    project: 'CHESARA',
    status: 'online',
    telegramBot: Boolean(bot),
    scheduler: true,
    time: new Date().toISOString()
  });
});

// ============================================================
// API — DASHBOARD
// ============================================================

app.get('/api/dashboard', (req, res) => {
  try {
    const lessons = getLessons();

    res.json({
      success: true,
      project: 'CHESARA',
      lessonsCount: lessons.length,
      telegramBot: Boolean(bot),
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error(
      '❌ Dashboard xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Dashboard maʼlumotlarini olishda xatolik.'
    });
  }
});

// ============================================================
// API — ALL LESSONS
// ============================================================

app.get('/api/lessons', (req, res) => {
  try {
    const lessons = getLessons();

    res.json({
      success: true,
      count: lessons.length,
      lessons
    });
  } catch (error) {
    console.error(
      '❌ Darslarni olish xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Darslarni olishda xatolik.'
    });
  }
});

// ============================================================
// API — ONE LESSON
// ============================================================

app.get('/api/lessons/:id', (req, res) => {
  try {
    const lesson = getLesson(
      req.params.id
    );

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Dars topilmadi.'
      });
    }

    res.json({
      success: true,
      lesson
    });
  } catch (error) {
    console.error(
      '❌ Bitta darsni olish xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Darsni olishda xatolik.'
    });
  }
});

// ============================================================
// API — CREATE LESSON
// ============================================================

app.post('/api/lessons', (req, res) => {
  try {
    const {
      id,
      groupId,
      groupName,
      coachId,
      coachName,
      coachTelegramId,
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
          'groupName, coachName va startTime kerak.'
      });
    }

    const lesson = addLesson({
      id,
      groupId,
      groupName,
      coachId,
      coachName,
      coachTelegramId,
      directorTelegramId,
      startTime,
      durationMinutes
    });

    res.status(201).json({
      success: true,
      message: 'Dars muvaffaqiyatli yaratildi.',
      lesson
    });
  } catch (error) {
    console.error(
      '❌ Dars yaratish xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Dars yaratishda xatolik.'
    });
  }
});

// ============================================================
// API — ATTENDANCE
// ============================================================

app.post('/api/attendance', (req, res) => {
  try {
    const {
      lessonId
    } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId kerak.'
      });
    }

    const result =
      markAttendance(lessonId);

    if (!result || result.success === false) {
      return res.status(404).json({
        success: false,
        message:
          result?.message || 'Davomat qayd qilinmadi.'
      });
    }

    res.json({
      success: true,
      message:
        'Davomat muvaffaqiyatli qayd qilindi.',
      result
    });
  } catch (error) {
    console.error(
      '❌ Davomat xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        'Davomatni qayd qilishda xatolik.'
    });
  }
});

// ============================================================
// API — FINISH LESSON
// ============================================================

app.post(
  '/api/lessons/:id/finish',
  (req, res) => {
    try {
      const result =
        finishLesson(req.params.id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Dars topilmadi.'
        });
      }

      res.json({
        success: true,
        message: 'Dars yakunlandi.',
        result
      });
    } catch (error) {
      console.error(
        '❌ Dars yakunlash xatosi:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'Darsni yakunlashda xatolik.'
      });
    }
  }
);

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "CHESARA: so'ralgan manzil topilmadi."
  });
});

// ============================================================
// START SERVER
// ============================================================

const server = app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `🚀 CHESARA server ${PORT}-portda ishlayapti.`
    );

    console.log(
      '♟️ CHESARA AI Chess Platform ishga tushdi.'
    );

    try {
      startScheduler((warning) => {
        if (
          !bot ||
          !warning ||
          !warning.directorTelegramId
        ) {
          return;
        }

        const message =
          warning.message ||
          (
            `⚠️ CHESARA DAVOMAT OGOHLANTIRISH\n\n` +
            `📚 Guruh: ${
              warning.groupName || 'Nomaʼlum'
            }\n` +
            `👨‍🏫 Ustoz: ${
              warning.coachName || 'Nomaʼlum'
            }\n` +
            `⏰ Dars: ${
              warning.startTime || ''
            }\n\n` +
            `Dars boshlanganiga 15 daqiqadan oshdi, ` +
            `ammo davomat hali qilinmagan.`
          );

        bot.sendMessage(
          warning.directorTelegramId,
          message
        ).catch((error) => {
          console.error(
            '❌ Davomat ogohlantirishi yuborilmadi:',
            error.message
          );
        });
      });

      console.log(
        '⏰ CHESARA Attendance Scheduler ishga tushdi.'
      );

    } catch (error) {
      console.error(
        '❌ Scheduler ishga tushmadi:',
        error.message
      );
    }
  }
);

// ============================================================
// SERVER ERROR
// ============================================================

server.on('error', (error) => {
  console.error(
    '❌ Server xatosi:',
    error.message
  );
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

function shutdown(signal) {
  console.log(
    `\n🛑 ${signal} qabul qilindi. Server yopilmoqda...`
  );

  server.close(() => {
    console.log(
      '✅ CHESARA server toza yopildi.'
    );

    process.exit(0);
  });
}

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

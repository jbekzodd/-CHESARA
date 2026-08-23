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
const PORT = process.env.PORT || 10000;

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
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// TELEGRAM BOT
// ============================================================

let bot = null;

const botToken =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

if (botToken) {
  try {
    const TelegramBot = require('node-telegram-bot-api');

    bot = new TelegramBot(botToken, {
      polling: true
    });

    console.log('🤖 CHESARA Telegram Bot ishga tushdi.');

    // ----------------------------------------------------------
    // /start
    // ----------------------------------------------------------

    bot.onText(/^\/start$/, (msg) => {
      const chatId = msg.chat.id;
      const firstName =
        msg.from?.first_name || 'Foydalanuvchi';

      const welcomeText =
        `Assalomu alaykum, ${firstName}! ♟️\n\n` +
        `CHESARA platformasiga xush kelibsiz.\n\n` +
        `Mavjud buyruqlar:\n` +
        `/lessons — darslar\n` +
        `/status — tizim holati\n` +
        `/help — yordam`;

      bot.sendMessage(chatId, welcomeText)
        .catch((error) => {
          console.error(
            'Telegram /start xatosi:',
            error.message
          );
        });
    });

    // ----------------------------------------------------------
    // /lessons
    // ----------------------------------------------------------

    bot.onText(/^\/lessons$/, (msg) => {
      const chatId = msg.chat.id;

      try {
        const lessons = getLessons();

        if (!lessons || lessons.length === 0) {
          bot.sendMessage(
            chatId,
            'Hozircha rejalashtirilgan darslar mavjud emas. 📭'
          );
          return;
        }

        let text = '📋 REJALASHTIRILGAN DARSLAR\n\n';

        lessons.forEach((lesson, index) => {
          text += `${index + 1}. ${lesson.groupName || 'Guruh'}\n`;
          text += `👨‍🏫 Ustoz: ${lesson.coachName || '-'}\n`;
          text += `⏰ Vaqt: ${lesson.startTime || '-'}\n`;
          text += `⏱ Davomiyligi: ${lesson.durationMinutes || 90} daqiqa\n`;
          text += `📊 Davomat: ${
            lesson.attendanceTaken
              ? '✅ Qilingan'
              : '❌ Qilinmagan'
          }\n`;
          text += `🏁 Holat: ${
            lesson.finished
              ? 'Yakunlangan'
              : 'Davom etmoqda/rejalashtirilgan'
          }\n\n`;
        });

        bot.sendMessage(chatId, text);
      } catch (error) {
        console.error(
          '/lessons xatosi:',
          error.message
        );

        bot.sendMessage(
          chatId,
          '❌ Darslarni olishda xatolik yuz berdi.'
        );
      }
    });

    // ----------------------------------------------------------
    // /status
    // ----------------------------------------------------------

    bot.onText(/^\/status$/, (msg) => {
      const chatId = msg.chat.id;

      try {
        const lessons = getLessons();

        bot.sendMessage(
          chatId,
          `✅ CHESARA server faol.\n\n` +
          `📚 Jami darslar: ${lessons.length} ta\n` +
          `🤖 Telegram bot: faol`
        );
      } catch (error) {
        console.error(
          '/status xatosi:',
          error.message
        );

        bot.sendMessage(
          chatId,
          '❌ Tizim holatini olishda xatolik.'
        );
      }
    });

    // ----------------------------------------------------------
    // /help
    // ----------------------------------------------------------

    bot.onText(/^\/help$/, (msg) => {
      const chatId = msg.chat.id;

      bot.sendMessage(
        chatId,
        `♟️ CHESARA YORDAM\n\n` +
        `/start — bosh menyu\n` +
        `/lessons — darslar ro'yxati\n` +
        `/status — server holati\n` +
        `/help — yordam`
      );
    });

    // ----------------------------------------------------------
    // TELEGRAM POLLING ERROR
    // ----------------------------------------------------------

    bot.on('polling_error', (error) => {
      console.error(
        '⚠️ Telegram Polling xatosi:',
        error.message || error
      );
    });

    console.log(
      '🤖 Telegram polling muvaffaqiyatli yoqildi.'
    );
  } catch (error) {
    console.error(
      '❌ Telegram botni ishga tushirishda xato:',
      error.message
    );

    bot = null;
  }
} else {
  console.log(
    '⚠️ TELEGRAM_BOT_TOKEN yoki BOT_TOKEN topilmadi.'
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'index.html')
  );
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
    time: new Date().toISOString()
  });
});

// ============================================================
// DASHBOARD
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
      'Dashboard xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Dashboard ma\'lumotlarini olishda xatolik.'
    });
  }
});

// ============================================================
// GET ALL LESSONS
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
      'Darslarni olish xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Darslarni olishda xatolik.'
    });
  }
});

// ============================================================
// GET ONE LESSON
// ============================================================

app.get('/api/lessons/:id', (req, res) => {
  try {
    const lesson = getLesson(req.params.id);

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
      'Bitta dars xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Darsni olishda xatolik.'
    });
  }
});

// ============================================================
// CREATE LESSON
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

    res.json({
      success: true,
      message: 'Dars muvaffaqiyatli yaratildi.',
      lesson
    });
  } catch (error) {
    console.error(
      'Dars yaratish xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: 'Dars yaratishda xatolik.'
    });
  }
});

// ============================================================
// MARK ATTENDANCE
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

    // scheduler.js aynan bitta ID qabul qiladi
    const result = markAttendance(lessonId);

    if (!result || result.success === false) {
      return res.status(404).json({
        success: false,
        message:
          result?.message || 'Dars topilmadi.'
      });
    }

    res.json({
      success: true,
      message:
        'Davomat muvaffaqiyatli qayd qilindi.',
      lesson: result.lesson
    });
  } catch (error) {
    console.error(
      'Davomat xatosi:',
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
// FINISH LESSON
// ============================================================

app.post('/api/lessons/:id/finish', (req, res) => {
  try {
    // scheduler.js aynan bitta ID qabul qiladi
    const result = finishLesson(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Dars topilmadi.'
      });
    }

    res.json({
      success: true,
      message: 'Dars yakunlandi.',
      lesson: result
    });
  } catch (error) {
    console.error(
      'Dars yakunlash xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        'Darsni yakunlashda xatolik.'
    });
  }
});

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

app.listen(
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
      // scheduler.js warning obyektini yuboradi.
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
          `⚠️ CHESARA DAVOMAT OGOHLANTIRISH\n\n` +
          `📚 Guruh: ${
            warning.groupName || 'Noma\'lum'
          }\n` +
          `👨‍🏫 Ustoz: ${
            warning.coachName || 'Noma\'lum'
          }\n` +
          `⏰ Dars: ${
            warning.startTime || '-'
          }`;

        bot.sendMessage(
          warning.directorTelegramId,
          message
        ).catch((error) => {
          console.error(
            '⚠️ Ogohlantirish yuborishda xato:',
            error.message
          );
        });
      });

      console.log(
        '⏰ CHESARA dars nazorati ishga tushdi.'
      );
    } catch (error) {
      console.error(
        '⚠️ Scheduler ishga tushmadi:',
        error.message
      );
    }
  }
);

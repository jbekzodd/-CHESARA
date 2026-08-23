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

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// STATIK FAYLLAR
// ======================================================

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// ======================================================
// TELEGRAM BOT
// POLLING O'CHIRILGAN — FAQAT WEBHOOK
// ======================================================

let bot = null;

const botToken =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

if (botToken) {
  try {
    const TelegramBot = require('node-telegram-bot-api');

    // MUHIM:
    // polling: true YO'Q
    bot = new TelegramBot(botToken);

    console.log('🤖 Telegram token topildi.');
    console.log('⏸️ Telegram polling o‘chirilgan.');

    // ==================================================
    // TELEGRAM WEBHOOK
    // ==================================================

    app.post('/telegram/webhook', (req, res) => {
      try {
        if (bot) {
          bot.processUpdate(req.body);
        }

        res.sendStatus(200);
      } catch (error) {
        console.error(
          'Telegram webhook xatosi:',
          error.message
        );

        res.sendStatus(500);
      }
    });

    // ==================================================
    // /START
    // ==================================================

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const firstName =
        msg.from?.first_name || 'Foydalanuvchi';

      const welcomeText =
        `Assalomu alaykum, ${firstName}! ♟️\n\n` +
        `CHESARA platformasiga xush kelibsiz.\n\n` +
        `Quyidagi menyudan kerakli bo‘limni tanlang.`;

      bot.sendMessage(chatId, welcomeText, {
        reply_markup: {
          keyboard: [
            ['👨‍🎓 Shogird', '👨‍🏫 Ustoz'],
            ['👨‍👩‍👦 Ota-ona', '🏢 Markaz'],
            ['♟️ Shaxmat', '📊 Hisobot'],
            ['⚙️ Profil']
          ],
          resize_keyboard: true
        }
      }).catch((error) => {
        console.error(
          'Start xabari xatosi:',
          error.message
        );
      });
    });

    // ==================================================
    // DARSlar
    // ==================================================

    bot.onText(/\/lessons/, (msg) => {
      const chatId = msg.chat.id;

      try {
        const lessons = getLessons();

        if (!lessons || lessons.length === 0) {
          return bot.sendMessage(
            chatId,
            'Hozircha rejalashtirilgan darslar mavjud emas. 📭'
          );
        }

        let text = '📋 Rejalashtirilgan darslar:\n\n';

        lessons.forEach((lesson, index) => {
          text += `${index + 1}. ${lesson.title || 'Dars'}\n`;
          text += `👥 Guruh: ${
            lesson.studentName ||
            lesson.groupName ||
            '-'
          }\n`;
          text += `👨‍🏫 Ustoz: ${
            lesson.teacherName ||
            lesson.coachName ||
            '-'
          }\n`;
          text += `🕒 Vaqt: ${
            lesson.startTime ||
            lesson.date ||
            '-'
          }\n`;
          text += `📊 Holat: ${
            lesson.status || '-'
          }\n\n`;
        });

        bot.sendMessage(chatId, text);
      } catch (error) {
        console.error(
          'Lessons xatosi:',
          error.message
        );

        bot.sendMessage(
          chatId,
          'Darslarni olishda xatolik yuz berdi.'
        );
      }
    });

    // ==================================================
    // STATUS
    // ==================================================

    bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;

      try {
        const lessons = getLessons();

        bot.sendMessage(
          chatId,
          `✅ CHESARA server faol.\n\n` +
          `📚 Jami darslar: ${lessons.length} ta\n` +
          `🤖 Telegram: ulangan\n` +
          `🌐 Webhook: faol`
        );
      } catch (error) {
        console.error(
          'Status xatosi:',
          error.message
        );
      }
    });

    // ==================================================
    // HELP
    // ==================================================

    bot.onText(/\/help/, (msg) => {
      bot.sendMessage(
        msg.chat.id,
        'CHESARA yordam markazi.\n\n' +
        'Kerakli bo‘limni menyudan tanlang.'
      );
    });

  } catch (error) {
    console.error(
      '⚠️ Telegram botni ishga tushirishda xato:',
      error.message
    );
  }
} else {
  console.log(
    '⚠️ TELEGRAM_BOT_TOKEN yoki BOT_TOKEN topilmadi.'
  );
}

// ======================================================
// ASOSIY SAYT
// ======================================================

app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, 'index.html')
  );
});

// ======================================================
// HEALTH
// ======================================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    project: 'CHESARA',
    status: 'online',
    telegramBot: Boolean(bot),
    telegramPolling: false,
    telegramWebhook: Boolean(bot),
    message: 'CHESARA server ishlayapti ♟️',
    time: new Date().toISOString()
  });
});

// ======================================================
// DASHBOARD
// ======================================================

app.get('/api/dashboard', (req, res) => {
  try {
    const lessons = getLessons();

    res.json({
      success: true,
      project: 'CHESARA',
      lessonsCount: lessons.length,
      telegramBot: Boolean(bot),
      telegramPolling: false,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error(
      'Dashboard xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        'Dashboard ma’lumotlarini olishda xatolik.'
    });
  }
});

// ======================================================
// BARCHA DARSLAR
// ======================================================

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
      message:
        'Darslarni olishda xatolik.'
    });
  }
});

// ======================================================
// BITTA DARS
// ======================================================

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
      message:
        'Darsni olishda xatolik.'
    });
  }
});

// ======================================================
// YANGI DARS
// ======================================================

app.post('/api/lessons', (req, res) => {
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

    if (!groupName || !coachName || !startTime) {
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
      directorTelegramId,
      startTime,
      durationMinutes
    });

    res.json({
      success: true,
      message:
        'Dars muvaffaqiyatli yaratildi.',
      lesson
    });
  } catch (error) {
    console.error(
      'Dars yaratish xatosi:',
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        'Dars yaratishda xatolik.'
    });
  }
});

// ======================================================
// DAVOMAT
// ======================================================

app.post('/api/attendance', (req, res) => {
  try {
    const {
      lessonId,
      status,
      note
    } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId kerak.'
      });
    }

    const result = markAttendance(
      lessonId,
      {
        status,
        note
      }
    );

    res.json({
      success: true,
      message:
        'Davomat muvaffaqiyatli qayd qilindi.',
      result
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

// ======================================================
// DARSNI YAKUNLASH
// ======================================================

app.post(
  '/api/lessons/:id/finish',
  (req, res) => {
    try {
      const result = finishLesson(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        message:
          'Dars yakunlandi.',
        result
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
  }
);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      'CHESARA: so‘ralgan manzil topilmadi.'
  });
});

// ======================================================
// SERVER
// ======================================================

const server = app.listen(
  PORT,
  '0.0.0.0',
  async () => {
    console.log(
      `🚀 CHESARA server ${PORT}-portda ishlayapti.`
    );

    console.log(
      '♟️ CHESARA AI Chess Platform ishga tushdi.'
    );

    // ==================================================
    // TELEGRAM WEBHOOKNI ULASH
    // ==================================================

    if (bot && botToken) {
      try {
        const publicUrl =
          process.env.RENDER_EXTERNAL_URL ||
          process.env.PUBLIC_URL;

        if (publicUrl) {
          const webhookUrl =
            `${publicUrl}/telegram/webhook`;

          await bot.setWebHook(webhookUrl);

          console.log(
            '🔗 Telegram webhook ulandi:'
          );

          console.log(webhookUrl);
        } else {
          console.log(
            '⚠️ RENDER_EXTERNAL_URL topilmadi.'
          );
        }
      } catch (error) {
        console.error(
          '⚠️ Telegram webhook xatosi:',
          error.message
        );
      }
    }

    // ==================================================
    // SCHEDULER
    // ==================================================

    try {
      startScheduler((lesson) => {
        if (
          bot &&
          lesson &&
          lesson.directorTelegramId
        ) {
          bot.sendMessage(
            lesson.directorTelegramId,
            `⏰ Eslatma: "${
              lesson.title ||
              'Shaxmat'
            }" darsi 15 daqiqadan so‘ng boshlanadi!`
          ).catch(() => {});
        }
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

// ======================================================
// SERVERNI TOZA YOPISH
// ======================================================

const shutdown = async () => {
  console.log(
    '🛑 Server yopilmoqda...'
  );

  try {
    if (bot) {
      await bot.deleteWebHook();
      console.log(
        '✅ Telegram webhook o‘chirildi.'
      );
    }
  } catch (error) {
    console.error(
      'Webhook yopilish xatosi:',
      error.message
    );
  }

  server.close(() => {
    console.log(
      '✅ CHESARA server toza yopildi.'
    );

    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

'use strict';

const express = require('express');
const path = require('path');
const crypto = require('crypto');
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
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const PUBLIC_URL = (
  process.env.RENDER_EXTERNAL_URL ||
  process.env.PUBLIC_URL ||
  'https://chesara.onrender.com'
).replace(/\/$/, '');

const WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET ||
  (
    BOT_TOKEN
      ? crypto
          .createHash('sha256')
          .update(BOT_TOKEN)
          .digest('hex')
          .slice(0, 32)
      : 'chesara-webhook'
  );

const WEBHOOK_PATH = `/telegram/webhook/${WEBHOOK_SECRET}`;
const WEBHOOK_URL = `${PUBLIC_URL}${WEBHOOK_PATH}`;

let bot = null;
let telegramReady = false;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(
  express.json({
    limit: '2mb'
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);

// ============================================================
// STATIK FAYLLAR
// ============================================================

app.use(
  express.static(__dirname, {
    index: false,
    dotfiles: 'ignore'
  })
);

app.use(
  express.static(path.join(__dirname, 'public'), {
    index: false,
    dotfiles: 'ignore'
  })
);

// ============================================================
// TELEGRAM MENULARI
// ============================================================

function mainKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📚 Darslar',
          callback_data: 'lessons'
        },
        {
          text: '📅 Davomat',
          callback_data: 'attendance'
        }
      ],
      [
        {
          text: '📊 Hisobotlar',
          callback_data: 'reports'
        },
        {
          text: '🧠 O‘yin tahlili',
          callback_data: 'analysis'
        }
      ],
      [
        {
          text: '🏆 Turnirlar',
          callback_data: 'tournaments'
        },
        {
          text: '🌐 Sayt',
          url: PUBLIC_URL
        }
      ]
    ]
  };
}

function backKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '⬅️ Bosh menyu',
          callback_data: 'home'
        }
      ]
    ]
  };
}

function telegramHomeText(firstName = 'Foydalanuvchi') {
  return [
    `♟️ Assalomu alaykum, ${firstName}!`,
    '',
    'CHESARA boshqaruv botiga xush kelibsiz.',
    '',
    'Kerakli bo‘limni menyudan tanlang:'
  ].join('\n');
}

async function sendTelegramMenu(
  chatId,
  firstName
) {
  if (!bot) return;

  await bot.sendMessage(
    chatId,
    telegramHomeText(firstName),
    {
      reply_markup: mainKeyboard()
    }
  );
}

// ============================================================
// TELEGRAM ACTIONS
// ============================================================

async function handleTelegramAction(
  chatId,
  action
) {
  if (!bot) return;

  // ---------------- HOME ----------------

  if (action === 'home') {
    await sendTelegramMenu(chatId);
    return;
  }

  // ---------------- LESSONS ----------------

  if (action === 'lessons') {
    const lessons = getLessons();

    const text =
      lessons.length > 0
        ? lessons
            .slice(0, 10)
            .map(
              (lesson, index) =>
                [
                  `${index + 1}. ♟️ ${
                    lesson.groupName || 'Guruh'
                  }`,
                  `👨‍🏫 ${
                    lesson.coachName || 'Ustoz'
                  }`,
                  `⏰ ${
                    lesson.startTime || '-'
                  }`,
                  `📅 Davomat: ${
                    lesson.attendanceTaken
                      ? 'Qilingan ✅'
                      : 'Kutilmoqda ⏳'
                  }`
                ].join('\n')
            )
            .join('\n\n')
        : '📚 Hozircha rejalashtirilgan darslar yo‘q.';

    await bot.sendMessage(
      chatId,
      `📚 DARSLAR\n\n${text}`,
      {
        reply_markup: backKeyboard()
      }
    );

    return;
  }

  // ---------------- ATTENDANCE ----------------

  if (action === 'attendance') {
    const lessons = getLessons();

    const pending = lessons.filter(
      lesson =>
        !lesson.attendanceTaken &&
        !lesson.finished
    );

    const text =
      pending.length > 0
        ? [
            '📅 DAVOMAT',
            '',
            `Davomati kutilayotgan darslar: ${pending.length} ta.`
          ].join('\n')
        : [
            '📅 DAVOMAT',
            '',
            'Hozircha kutilayotgan davomat yo‘q.'
          ].join('\n');

    await bot.sendMessage(
      chatId,
      text,
      {
        reply_markup: backKeyboard()
      }
    );

    return;
  }

  // ---------------- REPORTS ----------------

  if (action === 'reports') {
    const lessons = getLessons();

    const finished = lessons.filter(
      lesson => lesson.finished
    ).length;

    const attendance = lessons.filter(
      lesson => lesson.attendanceTaken
    ).length;

    await bot.sendMessage(
      chatId,
      [
        '📊 HISOBOTLAR',
        '',
        `Jami darslar: ${lessons.length} ta`,
        `Davomati olingan: ${attendance} ta`,
        `Yakunlangan: ${finished} ta`,
        '',
        'Oylik to‘lov va markaz hisobotlari keyingi bosqichda ulanadi.'
      ].join('\n'),
      {
        reply_markup: backKeyboard()
      }
    );

    return;
  }

  // ---------------- ANALYSIS ----------------

  if (action === 'analysis') {
    await bot.sendMessage(
      chatId,
      [
        '🧠 O‘YIN TAHLILI',
        '',
        'Bu bo‘limda PGN yoki o‘yin ma’lumotlarini yuborish va keyinchalik CHESARA tahlilini olish mumkin bo‘ladi.',
        '',
        '♟️ ?? — katta xato',
        '♟️ ? — xato',
        '♟️ ! — yaxshi yurish',
        '♟️ !! — ajoyib yurish'
      ].join('\n'),
      {
        reply_markup: backKeyboard()
      }
    );

    return;
  }

  // ---------------- TOURNAMENTS ----------------

  if (action === 'tournaments') {
    await bot.sendMessage(
      chatId,
      [
        '🏆 TURNIRLAR',
        '',
        'Turnirlar, joylar, sanalar, formatlar va sovrinlar bo‘limi keyingi bosqichda ulanadi.'
      ].join('\n'),
      {
        reply_markup: backKeyboard()
      }
    );
  }
}

// ============================================================
// TELEGRAMNI WEBHOOK ORQALI ULASH
// POLLING YO‘Q
// ============================================================

async function setupTelegram() {
  if (!BOT_TOKEN) {
    console.log(
      '⚠️ TELEGRAM_BOT_TOKEN topilmadi. Telegram bot o‘chiq.'
    );

    return;
  }

  try {
    const TelegramBot =
      require('node-telegram-bot-api');

    bot = new TelegramBot(
      BOT_TOKEN,
      {
        polling: false
      }
    );

    const me = await bot.getMe();

    console.log(
      `🤖 Telegram token topildi: @${
        me.username || me.first_name
      }`
    );

    await bot.setWebHook(
      WEBHOOK_URL
    );

    telegramReady = true;

    console.log(
      '🔗 Telegram webhook ulandi:'
    );

    console.log(
      WEBHOOK_URL
    );
  } catch (error) {
    telegramReady = false;

    console.error(
      '❌ Telegram webhook xatosi:',
      error.message
    );
  }
}

// ============================================================
// TELEGRAM WEBHOOK
// ============================================================

app.post(
  WEBHOOK_PATH,
  async (req, res) => {
    if (!bot) {
      return res.sendStatus(503);
    }

    // Telegramga tezda javob beramiz.
    res.sendStatus(200);

    try {
      const update = req.body;

      // ---------------- CALLBACK ----------------

      if (update.callback_query) {
        const query =
          update.callback_query;

        const chatId =
          query.message?.chat?.id;

        const action =
          query.data;

        await bot.answerCallbackQuery(
          query.id
        );

        if (
          chatId &&
          action
        ) {
          await handleTelegramAction(
            chatId,
            action
          );
        }

        return;
      }

      // ---------------- MESSAGE ----------------

      if (update.message) {
        const message =
          update.message;

        const chatId =
          message.chat?.id;

        const firstName =
          message.from?.first_name ||
          'Foydalanuvchi';

        if (chatId) {
          await sendTelegramMenu(
            chatId,
            firstName
          );
        }
      }
    } catch (error) {
      console.error(
        '❌ Telegram update xatosi:',
        error.message
      );
    }
  }
);

// ============================================================
// HEALTH
// ============================================================

app.get(
  '/health',
  (req, res) => {
    res.json({
      success: true,
      project: 'CHESARA',
      status: 'online',
      telegramBot: Boolean(bot),
      telegramWebhook:
        telegramReady,
      serverTime:
        new Date().toISOString()
    });
  }
);

// ============================================================
// DASHBOARD API
// ============================================================

app.get(
  '/api/dashboard',
  (req, res) => {
    try {
      const lessons =
        getLessons();

      res.json({
        success: true,
        project: 'CHESARA',
        lessonsCount:
          lessons.length,
        telegramBot:
          Boolean(bot),
        telegramWebhook:
          telegramReady,
        serverTime:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        'Dashboard xatosi:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Dashboard ma’lumotlarini olishda xatolik.'
      });
    }
  }
);

// ============================================================
// LESSONS API
// ============================================================

app.get(
  '/api/lessons',
  (req, res) => {
    try {
      const lessons =
        getLessons();

      res.json({
        success: true,
        count:
          lessons.length,
        lessons
      });
    } catch (error) {
      console.error(
        'Darslar xatosi:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Darslarni olishda xatolik.'
      });
    }
  }
);

// ============================================================
// BITTA DARS
// ============================================================

app.get(
  '/api/lessons/:id',
  (req, res) => {
    try {
      const lesson =
        getLesson(
          req.params.id
        );

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message:
            'Dars topilmadi.'
        });
      }

      res.json({
        success: true,
        lesson
      });
    } catch (error) {
      console.error(
        'Bitta dars xatosi:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Darsni olishda xatolik.'
      });
    }
  }
);

// ============================================================
// YANGI DARS
// ============================================================

app.post(
  '/api/lessons',
  (req, res) => {
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

      const lesson =
        addLesson({
          id,
          groupId,
          groupName,
          coachId,
          coachName,
          coachTelegramId,
          directorTelegramId,
          startTime,
          durationMinutes:
            Number(
              durationMinutes
            ) > 0
              ? Number(
                  durationMinutes
                )
              : 90
        });

      res.status(201).json({
        success: true,
        message:
          'Dars muvaffaqiyatli yaratildi.',
        lesson
      });
    } catch (error) {
      console.error(
        'Dars yaratish xatosi:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Dars yaratishda xatolik.'
      });
    }
  }
);

// ============================================================
// DAVOMAT
// ============================================================

app.post(
  '/api/lessons/:id/attendance',
  (req, res) => {
    try {
      const result =
        markAttendance(
          req.params.id
        );

      if (!result.success) {
        return res.status(404).json(
          result
        );
      }

      res.json({
        success: true,
        message:
          'Davomat muvaffaqiyatli qayd qilindi.',
        lesson:
          result.lesson
      });
    } catch (error) {
      console.error(
        'Davomat xatosi:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Davomatni saqlashda xatolik.'
      });
    }
  }
);

// ============================================================
// DARSNI YAKUNLASH
// ============================================================

app.post(
  '/api/lessons/:id/finish',
  (req, res) => {
    try {
      const result =
        finishLesson(
          req.params.id
        );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            'Dars topilmadi.'
        });
      }

      res.json({
        success: true,
        message:
          'Dars tugatildi.',
        lesson: result
      });
    } catch (error) {
      console.error(
        'Dars yakunlash xatosi:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Darsni tugatishda xatolik.'
      });
    }
  }
);

// ============================================================
// TELEGRAM TEST
// ============================================================

app.post(
  '/api/telegram/test',
  async (req, res) => {
    if (!bot) {
      return res.status(503).json({
        success: false,
        message:
          'Telegram bot ulanmagan.'
      });
    }

    const {
      chatId,
      message
    } = req.body;

    if (
      !chatId ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          'chatId va message kerak.'
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
          'Telegram xabari yuborildi.'
      });
    } catch (error) {
      console.error(
        'Telegram xabari xatosi:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'Telegram xabarini yuborib bo‘lmadi.'
      });
    }
  }
);

// ============================================================
// SCHEDULER → TELEGRAM
// ============================================================

function sendAttendanceWarning(
  warning
) {
  if (
    !bot ||
    !warning?.directorTelegramId
  ) {
    return;
  }

  bot.sendMessage(
    warning.directorTelegramId,
    warning.message,
    {
      reply_markup:
        mainKeyboard()
    }
  ).catch(error => {
    console.error(
      '❌ Telegram ogohlantirish xatosi:',
      error.message
    );
  });
}

// ============================================================
// API 404
// ============================================================

app.use(
  '/api',
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        'CHESARA API manzili topilmadi.'
    });
  }
);

// ============================================================
// SAYT
// ============================================================

app.get(
  '*',
  (req, res) => {
    if (
      req.path.startsWith(
        '/telegram/webhook/'
      )
    ) {
      return res
        .status(404)
        .send(
          'Webhook topilmadi.'
        );
    }

    res.sendFile(
      path.join(
        __dirname,
        'index.html'
      )
    );
  }
);

// ============================================================
// SERVERNI ISHGA TUSHIRISH
// ============================================================

const server =
  app.listen(
    PORT,
    '0.0.0.0',
    async () => {
      console.log(
        `🚀 CHESARA server ${PORT}-portda ishlayapti.`
      );

      console.log(
        '♟️ CHESARA AI Chess Platform ishga tushdi.'
      );

      try {
        startScheduler(
          sendAttendanceWarning
        );

        console.log(
          '⏰ CHESARA dars nazorati ishga tushdi.'
        );
      } catch (error) {
        console.error(
          '⚠️ Scheduler ishga tushmadi:',
          error.message
        );
      }

      await setupTelegram();
    }
  );

// ============================================================
// TOZA YOPILISH
// ============================================================

async function shutdown(
  signal
) {
  console.log(
    `🛑 ${signal} qabul qilindi. Server yopilmoqda...`
  );

  try {
    server.close(
      () => {
        console.log(
          '✅ CHESARA server toza yopildi.'
        );

        process.exit(0);
      }
    );

    if (bot) {
      await bot
        .deleteWebHook({
          drop_pending_updates:
            false
        })
        .catch(() => {});
    }
  } catch (error) {
    console.error(
      '❌ Yopilish xatosi:',
      error.message
    );

    process.exit(1);
  }
}

process.once(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

process.once(
  'SIGINT',
  () => shutdown('SIGINT')
);

// ============================================================
// GLOBAL ERROR
// ============================================================

process.on(
  'uncaughtException',
  error => {
    console.error(
      '❌ Uncaught Exception:',
      error
    );
  }
);

process.on(
  'unhandledRejection',
  error => {
    console.error(
      '❌ Unhandled Rejection:',
      error
    );
  }
);

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

const {
  requireSubscription,
  isSubscribed
} = require('./subscription');

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

const WEBHOOK_PATH =
  `/telegram/webhook/${WEBHOOK_SECRET}`;

const WEBHOOK_URL =
  `${PUBLIC_URL}${WEBHOOK_PATH}`;

let bot = null;
let telegramReady = false;

/*
============================================================
FOYDALANUVCHI HOLATI
============================================================
Hozircha vaqtinchalik xotirada saqlanadi.
Keyingi bosqichda access.js/database bilan almashtiramiz.
*/

const userRoles = new Map();

const ROLES = {
  PARENT: 'parent',
  STUDENT: 'student',
  TEACHER: 'teacher'
};

/*
============================================================
MIDDLEWARE
============================================================
*/

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

/*
============================================================
STATIK FAYLLAR
============================================================
*/

app.use(
  express.static(__dirname, {
    index: false,
    dotfiles: 'ignore'
  })
);

app.use(
  express.static(
    path.join(__dirname, 'public'),
    {
      index: false,
      dotfiles: 'ignore'
    }
  )
);

/*
============================================================
TELEGRAM MENULARI
============================================================
*/

/*
  Kanalga obuna bo'lmagan odamga faqat
  obuna menyusi ko'rsatiladi.
*/

function subscriptionKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📢 @uzchesara kanaliga obuna bo‘lish',
          url: 'https://t.me/uzchesara'
        }
      ],
      [
        {
          text: '✅ Obunani tekshirish',
          callback_data: 'check_subscription'
        }
      ]
    ]
  };
}

/*
  Obuna bo'lgandan keyingi birinchi menyu.
*/

function roleKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '👨‍👩‍👧 Ota-ona',
          callback_data: 'role_parent'
        }
      ],
      [
        {
          text: '👨‍🎓 O‘quvchi',
          callback_data: 'role_student'
        }
      ],
      [
        {
          text: '👨‍🏫 Ustoz',
          callback_data: 'role_teacher'
        }
      ],
      [
        {
          text: '🏢 Markazga qo‘shilish',
          callback_data: 'join_center'
        }
      ],
      [
        {
          text: '🌐 CHESARA sayt',
          web_app: {
            url: PUBLIC_URL
          }
        }
      ],
      [
        {
          text: 'ℹ️ Yordam',
          callback_data: 'help'
        }
      ]
    ]
  };
}

/*
  Rol tanlangandan keyingi menyu.
*/

function parentKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '👨‍👩‍👧 Farzandlarim',
          callback_data: 'parent_children'
        }
      ],
      [
        {
          text: '📊 Farzandim natijalari',
          callback_data: 'parent_results'
        }
      ],
      [
        {
          text: '📅 Davomat',
          callback_data: 'parent_attendance'
        }
      ],
      [
        {
          text: '⬅️ Rolni o‘zgartirish',
          callback_data: 'change_role'
        }
      ]
    ]
  };
}

function studentKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📚 Darslarim',
          callback_data: 'student_lessons'
        }
      ],
      [
        {
          text: '📅 Davomatim',
          callback_data: 'student_attendance'
        }
      ],
      [
        {
          text: '🏆 Turnirlar',
          callback_data: 'student_tournaments'
        }
      ],
      [
        {
          text: '🧠 O‘yin tahlili',
          callback_data: 'analysis'
        }
      ],
      [
        {
          text: '⬅️ Rolni o‘zgartirish',
          callback_data: 'change_role'
        }
      ]
    ]
  };
}

function teacherKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '📚 Darslar',
          callback_data: 'teacher_lessons'
        }
      ],
      [
        {
          text: '📅 Davomat olish',
          callback_data: 'attendance'
        }
      ],
      [
        {
          text: '👨‍🎓 O‘quvchilar',
          callback_data: 'teacher_students'
        }
      ],
      [
        {
          text: '📊 Hisobotlar',
          callback_data: 'reports'
        }
      ],
      [
        {
          text: '⬅️ Rolni o‘zgartirish',
          callback_data: 'change_role'
        }
      ]
    ]
  };
}

function backToRolesKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text: '⬅️ Asosiy menyu',
          callback_data: 'home'
        }
      ]
    ]
  };
}

/*
============================================================
MATNLAR
============================================================
*/

function roleText(role) {
  if (role === ROLES.PARENT) {
    return [
      '👨‍👩‍👧 OTA-ONA',
      '',
      'Ota-ona paneliga xush kelibsiz.',
      '',
      'Farzandingizning darslari,',
      'davomati va natijalarini ko‘rishingiz mumkin.'
    ].join('\n');
  }

  if (role === ROLES.STUDENT) {
    return [
      '👨‍🎓 O‘QUVCHI',
      '',
      'O‘quvchi paneliga xush kelibsiz.',
      '',
      'Darslar, davomat, turnirlar',
      'va shaxmat tahlillaridan foydalanishingiz mumkin.'
    ].join('\n');
  }

  if (role === ROLES.TEACHER) {
    return [
      '👨‍🏫 USTOZ',
      '',
      'Ustoz paneliga xush kelibsiz.',
      '',
      'Darslar, davomat, o‘quvchilar',
      'va hisobotlarni boshqarishingiz mumkin.'
    ].join('\n');
  }

  return [
    '♟️ CHESARA',
    '',
    'Davom etish uchun o‘zingizga mos bo‘limni tanlang.'
  ].join('\n');
}

function subscriptionText() {
  return [
    '♟️ CHESARA',
    '',
    'Botdan foydalanish uchun',
    'rasmiy kanalimizga obuna bo‘lish kerak.',
    '',
    '📢 @uzchesara',
    '',
    'Obuna bo‘lmagan foydalanuvchining',
    'CHESARA funksiyalaridan foydalanishi cheklanadi.',
    '',
    'Obuna bo‘lgach,',
    '«✅ Obunani tekshirish» tugmasini bosing.'
  ].join('\n');
}

function telegramHomeText(firstName = 'Foydalanuvchi') {
  return [
    `♟️ Assalomu alaykum, ${firstName}!`,
    '',
    'CHESARA platformasiga xush kelibsiz.',
    '',
    'Avval o‘zingizga mos rolni tanlang:'
  ].join('\n');
}

/*
============================================================
KANAL OBUNASINI TEKSHIRISH
============================================================
*/

async function checkUserSubscription(chatId) {
  if (!bot) {
    return false;
  }

  try {
    return await isSubscribed(
      bot,
      chatId
    );
  } catch (error) {
    console.error(
      '❌ Obuna tekshirish xatosi:',
      error.message
    );

    return false;
  }
}

/*
  Har bir muhim Telegram harakatidan oldin ishlaydi.
*/

async function requireChannelSubscription(chatId) {
  if (!bot) {
    return false;
  }

  const subscribed =
    await checkUserSubscription(chatId);

  if (subscribed) {
    return true;
  }

  await bot.sendMessage(
    chatId,
    subscriptionText(),
    {
      reply_markup:
        subscriptionKeyboard()
    }
  );

  return false;
}

/*
============================================================
MENYU YUBORISH
============================================================
*/

async function sendRoleMenu(
  chatId,
  firstName = 'Foydalanuvchi'
) {
  if (!bot) return;

  const subscribed =
    await checkUserSubscription(chatId);

  if (!subscribed) {
    await bot.sendMessage(
      chatId,
      subscriptionText(),
      {
        reply_markup:
          subscriptionKeyboard()
      }
    );

    return;
  }

  await bot.sendMessage(
    chatId,
    telegramHomeText(firstName),
    {
      reply_markup:
        roleKeyboard()
    }
  );
}

async function sendSelectedRoleMenu(
  chatId,
  role
) {
  if (!bot) return;

  const subscribed =
    await checkUserSubscription(chatId);

  if (!subscribed) {
    await bot.sendMessage(
      chatId,
      subscriptionText(),
      {
        reply_markup:
          subscriptionKeyboard()
      }
    );

    return;
  }

  if (role === ROLES.PARENT) {
    await bot.sendMessage(
      chatId,
      roleText(role),
      {
        reply_markup:
          parentKeyboard()
      }
    );

    return;
  }

  if (role === ROLES.STUDENT) {
    await bot.sendMessage(
      chatId,
      roleText(role),
      {
        reply_markup:
          studentKeyboard()
      }
    );

    return;
  }

  if (role === ROLES.TEACHER) {
    await bot.sendMessage(
      chatId,
      roleText(role),
      {
        reply_markup:
          teacherKeyboard()
      }
    );
  }
}

/*
============================================================
TELEGRAM ACTIONS
============================================================
*/

async function handleTelegramAction(
  chatId,
  action,
  fromUser
) {
  if (!bot) return;

  /*
    OBUNA TEKSHIRISH tugmasi bundan mustasno.
  */

  if (action === 'check_subscription') {
    const subscribed =
      await checkUserSubscription(chatId);

    if (!subscribed) {
      await bot.sendMessage(
        chatId,
        [
          '❌ Hali obuna bo‘lmagansiz.',
          '',
          'Avval @uzchesara kanaliga obuna bo‘ling.',
          '',
          'Keyin yana «✅ Obunani tekshirish»ni bosing.'
        ].join('\n'),
        {
          reply_markup:
            subscriptionKeyboard()
        }
      );

      return;
    }

    await bot.sendMessage(
      chatId,
      [
        '✅ Obuna tasdiqlandi!',
        '',
        'Endi CHESARA xizmatlaridan foydalanishingiz mumkin.'
      ].join('\n'),
      {
        reply_markup:
          roleKeyboard()
      }
    );

    return;
  }

  /*
    Qolgan barcha tugmalar uchun
    kanal obunasi majburiy.
  */

  const subscribed =
    await requireChannelSubscription(chatId);

  if (!subscribed) {
    return;
  }

  /*
    ASOSIY MENYU
  */

  if (action === 'home') {
    await sendRoleMenu(
      chatId,
      fromUser?.first_name ||
        'Foydalanuvchi'
    );

    return;
  }

  /*
    ROL TANLASH
  */

  if (action === 'role_parent') {
    userRoles.set(
      String(chatId),
      ROLES.PARENT
    );

    await sendSelectedRoleMenu(
      chatId,
      ROLES.PARENT
    );

    return;
  }

  if (action === 'role_student') {
    userRoles.set(
      String(chatId),
      ROLES.STUDENT
    );

    await sendSelectedRoleMenu(
      chatId,
      ROLES.STUDENT
    );

    return;
  }

  if (action === 'role_teacher') {
    userRoles.set(
      String(chatId),
      ROLES.TEACHER
    );

    await sendSelectedRoleMenu(
      chatId,
      ROLES.TEACHER
    );

    return;
  }

  if (action === 'change_role') {
    await sendRoleMenu(
      chatId,
      fromUser?.first_name ||
        'Foydalanuvchi'
    );

    return;
  }

  /*
    MARKAZGA QO‘SHILISH
  */

  if (action === 'join_center') {
    await bot.sendMessage(
      chatId,
      [
        '🏢 MARKAZGA QO‘SHILISH',
        '',
        'Bu bo‘lim orqali CHESARA markaziga',
        'qo‘shilish uchun so‘rov yuborishingiz mumkin.',
        '',
        '🔐 Keyingi bosqichda markaz kodi yoki',
        'markaz tanlash tizimini ulaymiz.'
      ].join('\n'),
      {
        reply_markup:
          backToRolesKeyboard()
      }
    );

    return;
  }

  /*
    YORDAM
  */

  if (action === 'help') {
    await bot.sendMessage(
      chatId,
      [
        'ℹ️ CHESARA YORDAM',
        '',
        '1️⃣ @uzchesara kanaliga obuna bo‘ling.',
        '2️⃣ O‘zingizga mos rolni tanlang.',
        '3️⃣ Markazingizga qo‘shiling.',
        '4️⃣ Tasdiqlangandan keyin panelingiz ochiladi.'
      ].join('\n'),
      {
        reply_markup:
          backToRolesKeyboard()
      }
    );

    return;
  }

  /*
    OTA-ONA
  */

  if (action === 'parent_children') {
    await bot.sendMessage(
      chatId,
      '👨‍👩‍👧 Hozircha sizga biriktirilgan farzandlar yo‘q.',
      {
        reply_markup:
          parentKeyboard()
      }
    );

    return;
  }

  if (action === 'parent_results') {
    await bot.sendMessage(
      chatId,
      '📊 Farzandlar natijalari keyingi bosqichda ulanadi.',
      {
        reply_markup:
          parentKeyboard()
      }
    );

    return;
  }

  if (action === 'parent_attendance') {
    await bot.sendMessage(
      chatId,
      '📅 Farzandingiz davomatini keyingi bosqichda ko‘rsatamiz.',
      {
        reply_markup:
          parentKeyboard()
      }
    );

    return;
  }

  /*
    O‘QUVCHI
  */

  if (action === 'student_lessons') {
    const lessons =
      getLessons();

    const text =
      lessons.length > 0
        ? lessons
            .slice(0, 10)
            .map(
              (lesson, index) =>
                [
                  `${index + 1}. ♟️ ${
                    lesson.groupName ||
                    'Guruh'
                  }`,
                  `👨‍🏫 ${
                    lesson.coachName ||
                    'Ustoz'
                  }`,
                  `⏰ ${
                    lesson.startTime ||
                    '-'
                  }`
                ].join('\n')
            )
            .join('\n\n')
        : '📚 Hozircha darslar yo‘q.';

    await bot.sendMessage(
      chatId,
      `📚 DARSLARIM\n\n${text}`,
      {
        reply_markup:
          studentKeyboard()
      }
    );

    return;
  }

  if (action === 'student_attendance') {
    await bot.sendMessage(
      chatId,
      '📅 Sizning davomat ma’lumotlaringiz keyingi bosqichda ulanadi.',
      {
        reply_markup:
          studentKeyboard()
      }
    );

    return;
  }

  if (action === 'student_tournaments') {
    await bot.sendMessage(
      chatId,
      '🏆 Turnirlar bo‘limi keyingi bosqichda ulanadi.',
      {
        reply_markup:
          studentKeyboard()
      }
    );

    return;
  }

  /*
    USTOZ
  */

  if (action === 'teacher_lessons') {
    const lessons =
      getLessons();

    await bot.sendMessage(
      chatId,
      [
        '📚 USTOZ DARS LARI',
        '',
        `Jami darslar: ${lessons.length} ta`
      ].join('\n'),
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  if (action === 'teacher_students') {
    await bot.sendMessage(
      chatId,
      '👨‍🎓 O‘quvchilar ro‘yxati keyingi bosqichda markaz tizimiga ulanadi.',
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  /*
    UMUMIY DAVOMAT
  */

  if (action === 'attendance') {
    const lessons =
      getLessons();

    const pending =
      lessons.filter(
        lesson =>
          !lesson.attendanceTaken &&
          !lesson.finished
      );

    await bot.sendMessage(
      chatId,
      [
        '📅 DAVOMAT',
        '',
        `Davomati kutilayotgan darslar: ${pending.length} ta.`
      ].join('\n'),
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  /*
    HISOBOT
  */

  if (action === 'reports') {
    const lessons =
      getLessons();

    const finished =
      lessons.filter(
        lesson =>
          lesson.finished
      ).length;

    const attendance =
      lessons.filter(
        lesson =>
          lesson.attendanceTaken
      ).length;

    await bot.sendMessage(
      chatId,
      [
        '📊 HISOBOTLAR',
        '',
        `Jami darslar: ${lessons.length} ta`,
        `Davomati olingan: ${attendance} ta`,
        `Yakunlangan: ${finished} ta`
      ].join('\n'),
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  /*
    AI TAHLIL
  */

  if (action === 'analysis') {
    await bot.sendMessage(
      chatId,
      [
        '🧠 O‘YIN TAHLILI',
        '',
        'Bu bo‘limda shaxmat o‘yinlarini',
        'AI va Stockfish yordamida tahlil qilish tizimi ishlaydi.'
      ].join('\n'),
      {
        reply_markup:
          studentKeyboard()
      }
    );

    return;
  }
}

/*
============================================================
TELEGRAM
============================================================
*/

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

    const me =
      await bot.getMe();

    console.log(
      `🤖 Telegram token topildi: @${
        me.username ||
        me.first_name
      }`
    );

    /*
      Eski polling/webhook konfliktini oldini olish.
    */

    await bot.deleteWebHook({
      drop_pending_updates: false
    }).catch(() => {});

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

/*
============================================================
TELEGRAM WEBHOOK
============================================================
*/

app.post(
  WEBHOOK_PATH,
  async (req, res) => {
    if (!bot) {
      return res.sendStatus(503);
    }

    /*
      Telegramga darhol 200 qaytaramiz.
    */

    res.sendStatus(200);

    try {
      const update =
        req.body;

      /*
        CALLBACK
      */

      if (update.callback_query) {
        const query =
          update.callback_query;

        const chatId =
          query.message?.chat?.id;

        const action =
          query.data;

        const fromUser =
          query.from;

        await bot.answerCallbackQuery(
          query.id
        ).catch(() => {});

        if (
          chatId &&
          action
        ) {
          await handleTelegramAction(
            chatId,
            action,
            fromUser
          );
        }

        return;
      }

      /*
        MESSAGE
      */

      if (update.message) {
        const message =
          update.message;

        const chatId =
          message.chat?.id;

        const firstName =
          message.from?.first_name ||
          'Foydalanuvchi';

        const text =
          String(
            message.text || ''
          ).trim();

        if (!chatId) {
          return;
        }

        /*
          /start
        */

        if (
          text === '/start' ||
          text.startsWith('/start ')
        ) {
          const subscribed =
            await checkUserSubscription(
              chatId
            );

          if (!subscribed) {
            await bot.sendMessage(
              chatId,
              subscriptionText(),
              {
                reply_markup:
                  subscriptionKeyboard()
              }
            );

            return;
          }

          await sendRoleMenu(
            chatId,
            firstName
          );

          return;
        }

        /*
          /menu
        */

        if (text === '/menu') {
          const subscribed =
            await checkUserSubscription(
              chatId
            );

          if (!subscribed) {
            await bot.sendMessage(
              chatId,
              subscriptionText(),
              {
                reply_markup:
                  subscriptionKeyboard()
              }
            );

            return;
          }

          await sendRoleMenu(
            chatId,
            firstName
          );

          return;
        }

        /*
          /markaz hozircha faqat
          keyingi bosqich uchun.
        */

        if (text === '/markaz') {
          const subscribed =
            await checkUserSubscription(
              chatId
            );

          if (!subscribed) {
            await bot.sendMessage(
              chatId,
              subscriptionText(),
              {
                reply_markup:
                  subscriptionKeyboard()
              }
            );

            return;
          }

          await bot.sendMessage(
            chatId,
            [
              '🏢 MARKAZ BOSHQARUVI',
              '',
              'Bu bo‘lim faqat tasdiqlangan',
              'Super Admin / Admin / Direktorlar uchun bo‘ladi.',
              '',
              '🔐 Ruxsat tizimini keyingi bosqichda ulaymiz.'
            ].join('\n')
          );

          return;
        }

        /*
          Oddiy matn yuborilsa ham
          obuna tekshiriladi.
        */

        const subscribed =
          await checkUserSubscription(
            chatId
          );

        if (!subscribed) {
          await bot.sendMessage(
            chatId,
            subscriptionText(),
            {
              reply_markup:
                subscriptionKeyboard()
            }
          );

          return;
        }

        await bot.sendMessage(
          chatId,
          [
            '♟️ CHESARA',
            '',
            'Iltimos, kerakli bo‘limni menyudan tanlang.'
          ].join('\n'),
          {
            reply_markup:
              roleKeyboard()
          }
        );
      }
    } catch (error) {
      console.error(
        '❌ Telegram update xatosi:',
        error.message
      );
    }
  }
);

/*
============================================================
HEALTH
============================================================
*/

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

/*
============================================================
DASHBOARD
============================================================
*/

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

/*
============================================================
DARSLAR
============================================================
*/

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

/*
============================================================
BITTA DARS
============================================================
*/

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

/*
============================================================
YANGI DARS
============================================================
*/

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

/*
============================================================
DAVOMAT
============================================================
*/

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

/*
============================================================
DARSNI YAKUNLASH
============================================================
*/

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
        lesson:
          result
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

/*
============================================================
TELEGRAM TEST
============================================================
*/

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

    if (!chatId || !message) {
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

/*
============================================================
SCHEDULER
============================================================
*/

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
        teacherKeyboard()
    }
  ).catch(error => {
    console.error(
      '❌ Telegram ogohlantirish xatosi:',
      error.message
    );
  });
}

/*
============================================================
API 404
============================================================
*/

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

/*
============================================================
SAYT FALLBACK
============================================================
*/

app.use(
  (req, res, next) => {
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
      ),
      error => {
        if (error) {
          next(error);
        }
      }
    );
  }
);

/*
============================================================
SERVER
============================================================
*/

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

/*
============================================================
TOZA YOPILISH
============================================================
*/

async function shutdown(
  signal
) {
  console.log(
    `🛑 ${signal} qabul qilindi. Server yopilmoqda...`
  );

  try {
    if (bot) {
      await bot
        .deleteWebHook({
          drop_pending_updates:
            false
        })
        .catch(() => {});
    }

    server.close(() => {
      console.log(
        '✅ CHESARA server toza yopildi.'
      );

      process.exit(0);
    });
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
  () =>
    shutdown('SIGTERM')
);

process.once(
  'SIGINT',
  () =>
    shutdown('SIGINT')
);

/*
============================================================
GLOBAL ERROR
============================================================
*/

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

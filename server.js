'use strict';

/*
============================================================
 CHESARA SERVER
============================================================

 Yangi CHESARA PASSPORT tizimi bilan ishlaydi.

 ASOSIY:
 - CHESARA ID
 - Rollar
 - /rol
 - Super Admin
 - CHESARA Passport tekshirish
 - Ustozni CHESARA ID orqali markazga qo‘shish
 - Mustaqil ustoz
 - Markaz direktor/admin/nazoratchi
 - Ustoz oyligi
 - Darslar
 - Davomat
 - Telegram
 - Web API
============================================================
*/

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const {
  startScheduler,
  getLessons,
  getLesson,
  addLesson,
  markAttendance,
  finishLesson
} = require('./scheduler');

const {
  isSubscribed
} = require('./subscription');

const access = require('./access');

const {
  ROLES,
  TEACHER_TYPES,
  SUPER_ADMIN_ID,
  SUPER_ADMIN_USERNAME,

  ensureUser,
  getUser,
  getUsers,
  getUserByChesaraId,
  getPublicPassport,
  updatePassport,

  getRole,
  canChangeRole,
  setRole,

  verifyChesaraTrainer,
  addCertificate,
  removeCertificate,

  createCenter,
  getCenter,
  getCenters,
  canManageCenter,

  findTeacherByChesaraId,
  addTeacherToCenter,
  removeTeacherFromCenter,

  addCenterAdmin,
  addCenterController,
  setTeacherSalary,

  getAdminDashboard
} = access;


/*
============================================================
 APP
============================================================
*/

const app = express();

const PORT =
  Number(process.env.PORT) || 10000;

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '';

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
 MIDDLEWARE
============================================================
*/

app.use(cors());

app.use(
  express.json({
    limit: '5mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '5mb'
  })
);


/*
============================================================
 STATIC
============================================================
*/

app.use(
  express.static(
    __dirname,
    {
      index: false,
      dotfiles: 'ignore'
    }
  )
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
 TELEGRAM USER
============================================================
*/

function telegramUser(message) {

  return {

    id:
      message?.from?.id,

    username:
      message?.from?.username,

    first_name:
      message?.from?.first_name,

    last_name:
      message?.from?.last_name

  };

}


/*
============================================================
 USER
============================================================
*/

function ensureTelegramUser(fromUser) {

  if (!fromUser?.id) {
    return null;
  }

  return ensureUser({

    id:
      fromUser.id,

    username:
      fromUser.username,

    first_name:
      fromUser.first_name,

    last_name:
      fromUser.last_name

  });

}


function isSuperAdmin(user) {

  if (!user) {
    return false;
  }

  const id =
    String(
      user.id ||
      user.telegramId ||
      ''
    );

  const username =
    String(
      user.username ||
      ''
    )
      .replace('@', '')
      .toLowerCase();

  return (
    id ===
      SUPER_ADMIN_ID ||

    username ===
      SUPER_ADMIN_USERNAME
  );

}


/*
============================================================
 SUBSCRIPTION
============================================================
*/

function subscriptionKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text:
            '📢 @uzchesara kanaliga obuna bo‘lish',

          url:
            'https://t.me/uzchesara'
        }
      ],

      [
        {
          text:
            '✅ Obunani tekshirish',

          callback_data:
            'check_subscription'
        }
      ]

    ]

  };

}


async function checkSubscription(
  chatId
) {

  if (!bot) {
    return false;
  }

  if (
    String(chatId) ===
    SUPER_ADMIN_ID
  ) {

    return true;

  }

  try {

    return await isSubscribed(
      bot,
      chatId
    );

  } catch (error) {

    console.error(
      'Obuna tekshirish xatosi:',
      error.message
    );

    return false;

  }

}


async function requireSubscription(
  chatId
) {

  if (
    String(chatId) ===
    SUPER_ADMIN_ID
  ) {

    return true;

  }

  const ok =
    await checkSubscription(
      chatId
    );

  if (ok) {
    return true;
  }

  await bot.sendMessage(
    chatId,

    [
      '♟️ CHESARA',
      '',
      'Botdan foydalanish uchun',
      'rasmiy kanalga obuna bo‘ling.',
      '',
      '📢 @uzchesara'
    ].join('\n'),

    {
      reply_markup:
        subscriptionKeyboard()
    }
  );

  return false;

}


/*
============================================================
 ROLE KEYBOARD
============================================================
*/

function roleKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text:
            '👨‍🎓 O‘quvchi',

          callback_data:
            'role_student'
        }
      ],

      [
        {
          text:
            '👨‍🏫 Ustoz',

          callback_data:
            'role_teacher'
        }
      ],

      [
        {
          text:
            '👨‍👩‍👧 Ota-ona',

          callback_data:
            'role_parent'
        }
      ],

      [
        {
          text:
            '🪪 CHESARA Passport',

          callback_data:
            'passport'
        }
      ],

      [
        {
          text:
            '🌐 CHESARA sayt',

          web_app: {
            url:
              PUBLIC_URL
          }
        }
      ]

    ]

  };

}


/*
============================================================
 STUDENT MENU
============================================================
*/

function studentKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text:
            '📚 Darslarim',

          callback_data:
            'student_lessons'
        }
      ],

      [
        {
          text:
            '📅 Davomatim',

          callback_data:
            'student_attendance'
        }
      ],

      [
        {
          text:
            '🏆 Turnirlar',

          callback_data:
            'student_tournaments'
        }
      ],

      [
        {
          text:
            '🧠 O‘yin tahlili',

          callback_data:
            'analysis'
        }
      ],

      [
        {
          text:
            '🪪 Passport',

          callback_data:
            'passport'
        }
      ],

      [
        {
          text:
            '🔄 /rol',

          callback_data:
            'change_role'
        }
      ]

    ]

  };

}


/*
============================================================
 TEACHER MENU
============================================================
*/

function teacherKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text:
            '📚 Darslar',

          callback_data:
            'teacher_lessons'
        }
      ],

      [
        {
          text:
            '➕ Dars qo‘shish',

          callback_data:
            'teacher_add_lesson'
        }
      ],

      [
        {
          text:
            '📅 Davomat',

          callback_data:
            'attendance'
        }
      ],

      [
        {
          text:
            '👨‍🎓 O‘quvchilar',

          callback_data:
            'teacher_students'
        }
      ],

      [
        {
          text:
            '🏢 Markaz / shaxsiy kurs',

          callback_data:
            'teacher_center'
        }
      ],

      [
        {
          text:
            '🪪 CHESARA Passport',

          callback_data:
            'passport'
        }
      ],

      [
        {
          text:
            '📜 Sertifikatlar',

          callback_data:
            'certificates'
        }
      ],

      [
        {
          text:
            '📊 Hisobot',

          callback_data:
            'reports'
        }
      ],

      [
        {
          text:
            '⚙️ Profil',

          callback_data:
            'profile'
        }
      ],

      [
        {
          text:
            '🔄 /rol',

          callback_data:
            'change_role'
        }
      ]

    ]

  };

}


/*
============================================================
 DIRECTOR MENU
============================================================
*/

function directorKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text:
            '🏢 Mening markazim',

          callback_data:
            'director_center'
        }
      ],

      [
        {
          text:
            '👨‍🏫 Ustoz qo‘shish',

          callback_data:
            'director_add_teacher'
        }
      ],

      [
        {
          text:
            '👥 Admin / nazoratchilar',

          callback_data:
            'director_staff'
        }
      ],

      [
        {
          text:
            '👨‍🎓 O‘quvchilar',

          callback_data:
            'director_students'
        }
      ],

      [
        {
          text:
            '📚 Guruhlar',

          callback_data:
            'director_groups'
        }
      ],

      [
        {
          text:
            '📅 Darslar',

          callback_data:
            'director_lessons'
        }
      ],

      [
        {
          text:
            '💰 Ustoz oyliklari',

          callback_data:
            'director_salary'
        }
      ],

      [
        {
          text:
            '📊 Hisobotlar',

          callback_data:
            'director_reports'
        }
      ],

      [
        {
          text:
            '🪪 Passport',

          callback_data:
            'passport'
        }
      ],

      [
        {
          text:
            '🔄 /rol',

          callback_data:
            'change_role'
        }
      ]

    ]

  };

}


/*
============================================================
 SUPER ADMIN MENU
============================================================
*/

function superAdminKeyboard() {

  return {

    inline_keyboard: [

      [
        {
          text:
            '👥 Foydalanuvchilar',

          callback_data:
            'admin_users'
        }
      ],

      [
        {
          text:
            '🏢 Markazlar',

          callback_data:
            'admin_centers'
        }
      ],

      [
        {
          text:
            '👨‍🏫 Trenerlar',

          callback_data:
            'admin_teachers'
        }
      ],

      [
        {
          text:
            '📜 Sertifikatlar',

          callback_data:
            'admin_certificates'
        }
      ],

      [
        {
          text:
            '📚 Kurslar',

          callback_data:
            'admin_courses'
        }
      ],

      [
        {
          text:
            '📋 Guruhlar',

          callback_data:
            'admin_groups'
        }
      ],

      [
        {
          text:
            '📅 Darslar',

          callback_data:
            'admin_lessons'
        }
      ],

      [
        {
          text:
            '🪪 Passportlar',

          callback_data:
            'admin_passports'
        }
      ],

      [
        {
          text:
            '🧩 Menyular',

          callback_data:
            'admin_menus'
        }
      ],

      [
        {
          text:
            '✏️ Matnlar',

          callback_data:
            'admin_texts'
        }
      ],

      [
        {
          text:
            '📢 Kanal / obuna',

          callback_data:
            'admin_subscription'
        }
      ],

      [
        {
          text:
            '⚙️ Sozlamalar',

          callback_data:
            'admin_settings'
        }
      ],

      [
        {
          text:
            '📊 Tizim statistikasi',

          callback_data:
            'admin_stats'
        }
      ]

    ]

  };

}


/*
============================================================
 HOME
============================================================
*/

async function sendHome(
  chatId,
  firstName = 'Foydalanuvchi'
) {

  if (!bot) {
    return;
  }

  const user =
    getUser(chatId);

  if (
    String(chatId) ===
    SUPER_ADMIN_ID
  ) {

    await bot.sendMessage(

      chatId,

      [
        '👑 CHESARA SUPER ADMIN',
        '',
        'Assalomu alaykum, Bekzod.',
        '',
        `CHESARA ID: ${
          user?.passport?.chesaraId ||
          'CH-000001'
        }`,
        '',
        'Tizimning barcha qismlarini',
        'boshqarishingiz mumkin.'
      ].join('\n'),

      {
        reply_markup:
          superAdminKeyboard()
      }

    );

    return;

  }

  if (
    !await requireSubscription(
      chatId
    )
  ) {

    return;

  }

  if (!user?.role) {

    await bot.sendMessage(

      chatId,

      [
        `♟️ Assalomu alaykum, ${firstName}!`,
        '',
        'CHESARA platformasiga xush kelibsiz.',
        '',
        'Avval o‘zingizga mos rolni tanlang.'
      ].join('\n'),

      {
        reply_markup:
          roleKeyboard()
      }

    );

    return;

  }

  await sendRoleMenu(
    chatId,
    user
  );

}


/*
============================================================
 ROLE MENU
============================================================
*/

async function sendRoleMenu(
  chatId,
  user
) {

  if (!user) {
    user =
      getUser(chatId);
  }

  if (!user) {
    return;
  }

  if (
    user.role ===
      ROLES.SUPER_ADMIN
  ) {

    return sendHome(
      chatId
    );

  }

  if (
    user.role ===
      ROLES.TEACHER
  ) {

    let text =
      '👨‍🏫 USTOZ\n\n';

    if (
      user.teacherType ===
      TEACHER_TYPES.CENTER &&
      user.centerId
    ) {

      const center =
        getCenter(
          user.centerId
        );

      text +=
        `🏢 Markaz: ${
          center?.name ||
          'Noma’lum'
        }\n`;

    }

    if (
      user.teacherType ===
      TEACHER_TYPES.INDEPENDENT
    ) {

      text +=
        '🌐 Mustaqil / shaxsiy kurs\n';

    }

    text +=
      `\n🪪 CHESARA ID: ${
        user.passport?.chesaraId ||
        '-'
      }`;

    if (
      user.passport
        ?.isChesaraTrainer
    ) {

      text +=
        '\n\n🏅 CHESARA TRENERI ✓';

    }

    await bot.sendMessage(

      chatId,

      text,

      {
        reply_markup:
          teacherKeyboard()
      }

    );

    return;

  }


  if (
    user.role ===
      ROLES.DIRECTOR
  ) {

    const center =
      getCenter(
        user.centerId
      );

    await bot.sendMessage(

      chatId,

      [
        '🏢 MARKAZ DIREKTORI',
        '',
        `Markaz: ${
          center?.name ||
          'Markaz topilmadi'
        }`,
        '',
        `CHESARA ID: ${
          user.passport?.chesaraId ||
          '-'
        }`
      ].join('\n'),

      {
        reply_markup:
          directorKeyboard()
      }

    );

    return;

  }


  if (
    user.role ===
      ROLES.ADMIN
  ) {

    await bot.sendMessage(

      chatId,

      [
        '🧑‍💼 MARKAZ ADMINI',
        '',
        `CHESARA ID: ${
          user.passport?.chesaraId ||
          '-'
        }`
      ].join('\n'),

      {
        reply_markup:
          directorKeyboard()
      }

    );

    return;

  }


  if (
    user.role ===
      ROLES.CONTROLLER
  ) {

    await bot.sendMessage(

      chatId,

      [
        '👁 NAZORATCHI',
        '',
        `CHESARA ID: ${
          user.passport?.chesaraId ||
          '-'
        }`
      ].join('\n'),

      {
        reply_markup:
          directorKeyboard()
      }

    );

    return;

  }


  if (
    user.role ===
      ROLES.STUDENT
  ) {

    await bot.sendMessage(

      chatId,

      [
        '👨‍🎓 O‘QUVCHI',
        '',
        `CHESARA ID: ${
          user.passport?.chesaraId ||
          '-'
        }`
      ].join('\n'),

      {
        reply_markup:
          studentKeyboard()
      }

    );

    return;

  }


  if (
    user.role ===
      ROLES.PARENT
  ) {

    await bot.sendMessage(

      chatId,

      [
        '👨‍👩‍👧 OTA-ONA',
        '',
        `CHESARA ID: ${
          user.passport?.chesaraId ||
          '-'
        }`
      ].join('\n'),

      {
        reply_markup:
          roleKeyboard()
      }

    );

  }

}


/*
============================================================
 ROLE TANLASH
============================================================
*/

async function selectRole(
  chatId,
  fromUser,
  role
) {

  const user =
    ensureTelegramUser(
      fromUser
    );

  if (!user) {
    return;
  }

  try {

    /*
    Super Admin uchun
    rol o‘zgartirish cheklovi yo‘q.
    */

    const result =
      setRole(

        {
          id:
            chatId,

          username:
            fromUser.username
        },

        chatId,

        role

      );

    if (
      role ===
        ROLES.TEACHER
    ) {

      await bot.sendMessage(

        chatId,

        [
          '👨‍🏫 USTOZ',
          '',
          'Faoliyat turini tanlang:',
          '',
          '🏢 Siz markazda ustoz bo‘lib ishlashingiz mumkin.',
          '',
          '🌐 Yoki markazsiz mustaqil/shaxsiy kurs yuritishingiz mumkin.',
          '',
          'Muhim: ustoz markaz qidirmaydi.',
          'Keyinchalik markaz direktori sizni',
          'CHESARA ID orqali topib qo‘shadi.'
        ].join('\n'),

        {
          reply_markup: {
            inline_keyboard: [

              [
                {
                  text:
                    '🏢 Markazda ustozman',

                  callback_data:
                    'teacher_center'
                }
              ],

              [
                {
                  text:
                    '🌐 Mustaqil / shaxsiy kurs',

                  callback_data:
                    'teacher_independent'
                }
              ],

              [
                {
                  text:
                    '🪪 Passport',

                  callback_data:
                    'passport'
                }
              ]

            ]
          }
        }

      );

      return;

    }

    await sendRoleMenu(
      chatId,
      result
    );

  } catch (error) {

    await bot.sendMessage(

      chatId,

      `🔒 ${error.message}`,

      {
        reply_markup:
          roleKeyboard()
      }

    );

  }

}


/*
============================================================
 ROLE O‘ZGARTIRISH
============================================================
*/

async function handleChangeRole(
  chatId
) {

  const user =
    getUser(chatId);

  if (!user) {

    await sendHome(
      chatId
    );

    return;

  }

  if (
    String(chatId) ===
    SUPER_ADMIN_ID
  ) {

    await bot.sendMessage(

      chatId,

      [
        '👑 SUPER ADMIN',
        '',
        'Siz rolni istalgan vaqtda',
        'almashtira olasiz.',
        '',
        'Yangi rolni tanlang.'
      ].join('\n'),

      {
        reply_markup:
          roleKeyboard()
      }

    );

    return;

  }

  const permission =
    canChangeRole(
      chatId
    );

  if (
    !permission.allowed
  ) {

    await bot.sendMessage(

      chatId,

      [
        `🔒 Hozirgi rol: ${user.role}`,
        '',
        permission.reason,
        '',
        'Muddatidan oldin almashtirish',
        'uchun Super Admin bilan bog‘laning.'
      ].join('\n')

    );

    return;

  }

  await bot.sendMessage(

    chatId,

    [
      `🔄 Hozirgi rol: ${user.role}`,
      '',
      'Yangi rolni tanlang:'
    ].join('\n'),

    {
      reply_markup:
        roleKeyboard()
    }

  );

}


/*
============================================================
 PASSPORT
============================================================
*/

async function sendPassport(
  chatId,
  chesaraId = null
) {

  const user =
    chesaraId
      ? getUserByChesaraId(
          chesaraId
        )
      : getUser(chatId);

  if (!user) {

    await bot.sendMessage(

      chatId,

      [
        '❌ CHESARA Passport topilmadi.',
        '',
        'CHESARA ID ni tekshiring.'
      ].join('\n')

    );

    return;

  }

  const p =
    user.passport;

  const certificates =
    p?.certificates || [];

  const lines = [

    '🪪 CHESARA PASSPORT',

    '',

    `ID: ${p?.chesaraId || '-'}`,

    '',

    `👤 F.I.Sh.: ${
      [
        p?.firstName,
        p?.lastName,
        p?.middleName
      ]
        .filter(Boolean)
        .join(' ') ||
      '-'
    }`,

    `📅 Tug‘ilgan sana: ${
      p?.birthDate ||
      '—'
    }`,

    `♟ Shaxmat unvoni: ${
      p?.chessTitle ||
      '—'
    }`,

    `⭐ Reyting: ${
      p?.chessRating ??
      '—'
    }`,

    '',

    p?.isChesaraTrainer
      ? '🏅 CHESARA TRENERI ✓'
      : '👤 CHESARA foydalanuvchisi',

    '',

    `Holati: ${
      p?.status === 'active'
        ? '🟢 FAOL'
        : p?.status === 'blocked'
          ? '🔴 BLOKLANGAN'
          : '🟡 KUTILMOQDA'
    }`,

    '',

    `📜 Sertifikatlar: ${
      certificates.length
    }`

  ];

  if (
    p?.fideId
  ) {

    lines.push(
      `FIDE ID: ${p.fideId}`
    );

  }

  await bot.sendMessage(

    chatId,

    lines.join('\n'),

    {
      reply_markup: {

        inline_keyboard: [

          [
            {
              text:
                '🔎 Boshqa CHESARA ID tekshirish',

              callback_data:
                'passport_search'
            }
          ],

          [
            {
              text:
                '⬅️ Menyu',

              callback_data:
                'home'
            }
          ]

        ]

      }

    }

  );

}


/*
============================================================
 PASSPORT SEARCH STATE
============================================================
*/

const states =
  new Map();


function setState(
  chatId,
  state
) {

  states.set(
    String(chatId),
    state
  );

}


function getState(
  chatId
) {

  return states.get(
    String(chatId)
  );

}


function clearState(
  chatId
) {

  states.delete(
    String(chatId)
  );

}


/*
============================================================
 TEACHER / CENTER
============================================================
*/

async function teacherCenterMenu(
  chatId
) {

  const user =
    getUser(chatId);

  if (!user) {
    return;
  }

  if (
    user.centerId
  ) {

    const center =
      getCenter(
        user.centerId
      );

    await bot.sendMessage(

      chatId,

      [
        '🏢 MARKAZ',
        '',
        `Siz hozir: ${
          center?.name ||
          'Noma’lum'
        }`,
        '',
        'Markazga ustozni direktor qo‘shadi.',
        'Ustoz o‘zi markaz qidirmaydi.'
      ].join('\n'),

      {
        reply_markup: {

          inline_keyboard: [

            [
              {
                text:
                  '🪪 Mening Passportim',

                callback_data:
                  'passport'
              }
            ],

            [
              {
                text:
                  '⬅️ Orqaga',

                callback_data:
                  'home'
              }
            ]

          ]

        }

      }

    );

    return;

  }

  await bot.sendMessage(

    chatId,

    [
      '🏢 MARKAZ / KURS',
      '',
      'Siz hali markazga biriktirilmagansiz.',
      '',
      'Markaz direktori sizni',
      'CHESARA ID orqali topib qo‘shadi.',
      '',
      'Agar mustaqil ishlasangiz:',
      '🌐 shaxsiy kurs sifatida davom etishingiz mumkin.'
    ].join('\n'),

    {
      reply_markup: {

        inline_keyboard: [

          [
            {
              text:
                '🌐 Mustaqil kurs',

              callback_data:
                'teacher_independent'
            }
          ],

          [
            {
              text:
                '🪪 Passport',

              callback_data:
                'passport'
            }
          ],

          [
            {
              text:
                '⬅️ Orqaga',

              callback_data:
                'home'
            }
          ]

        ]

      }

    }

  );

}


/*
============================================================
 DIRECTOR ADD TEACHER
============================================================
*/

async function directorAddTeacher(
  chatId
) {

  const user =
    getUser(chatId);

  if (
    !user?.centerId
  ) {

    await bot.sendMessage(

      chatId,

      '❌ Sizga markaz biriktirilmagan.'

    );

    return;

  }

  setState(

    chatId,

    {
      type:
        'director_add_teacher'
    }

  );

  await bot.sendMessage(

    chatId,

    [
      '👨‍🏫 USTOZ QO‘SHISH',
      '',
      'Ustozning CHESARA Passport ID raqamini yuboring.',
      '',
      'Masalan:',
      'CH-000125',
      '',
      'Ustozni ism bilan emas,',
      'CHESARA ID orqali topamiz.'
    ].join('\n')

  );

}


/*
============================================================
 DIRECTOR CENTER
============================================================
*/

async function directorCenter(
  chatId
) {

  const user =
    getUser(chatId);

  const center =
    getCenter(
      user?.centerId
    );

  if (!center) {

    await bot.sendMessage(
      chatId,
      '❌ Markaz topilmadi.'
    );

    return;

  }

  const teachers =
    center.teachers || [];

  const teacherNames =
    teachers
      .map(
        id =>
          getUser(id)
      )
      .filter(Boolean)
      .map(
        u =>
          `• ${
            [
              u.passport?.firstName,
              u.passport?.lastName
            ]
              .filter(Boolean)
              .join(' ') ||
            u.username ||
            u.id
          } — ${
            u.passport?.chesaraId ||
            '-'
          }`
      );

  await bot.sendMessage(

    chatId,

    [
      '🏢 MENING MARKAZIM',
      '',
      `Nomi: ${center.name}`,
      '',
      `👨‍🏫 Ustozlar: ${
        teachers.length
      }`,
      '',
      teacherNames.length
        ? teacherNames.join('\n')
        : 'Hozircha ustoz yo‘q.'
    ].join('\n'),

    {
      reply_markup: {

        inline_keyboard: [

          [
            {
              text:
                '➕ Ustoz qo‘shish',

              callback_data:
                'director_add_teacher'
            }
          ],

          [
            {
              text:
                '⬅️ Orqaga',

              callback_data:
                'home'
            }
          ]

        ]

      }

    }

  );

}


/*
============================================================
 SUPER ADMIN
============================================================
*/

async function superAdminAction(
  chatId,
  action
) {

  if (
    String(chatId) !==
    SUPER_ADMIN_ID
  ) {

    return;

  }

  if (
    action ===
      'admin_stats'
  ) {

    const stats =
      getAdminDashboard();

    await bot.sendMessage(

      chatId,

      [
        '📊 CHESARA STATISTIKA',
        '',
        `👥 Foydalanuvchilar: ${stats.users}`,
        `👨‍🏫 Ustozlar: ${stats.teachers}`,
        `🏅 Trenerlar: ${stats.trainers}`,
        `👑 Direktorlar: ${stats.directors}`,
        `🧑‍💼 Adminlar: ${stats.admins}`,
        `👁 Nazoratchilar: ${stats.controllers}`,
        `👨‍🎓 O‘quvchilar: ${stats.students}`,
        `🏢 Markazlar: ${stats.centers}`,
        `📜 Sertifikatlar: ${stats.certificates}`
      ].join('\n'),

      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  '⬅️ Super Admin',

                callback_data:
                  'admin_home'
              }
            ]
          ]
        }
      }

    );

    return;

  }


  if (
    action ===
      'admin_users'
  ) {

    const users =
      getUsers();

    await bot.sendMessage(

      chatId,

      [
        '👥 FOYDALANUVCHILAR',
        '',
        `Jami: ${users.length}`,
        '',
        ...users
          .slice(-20)
          .map(
            (u, i) =>
              `${i + 1}. ${
                [
                  u.passport?.firstName,
                  u.passport?.lastName
                ]
                  .filter(Boolean)
                  .join(' ') ||
                u.username ||
                'Foydalanuvchi'
              }`,
          )
      ].join('\n'),

      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  '⬅️ Super Admin',

                callback_data:
                  'admin_home'
              }
            ]
          ]
        }
      }

    );

    return;

  }


  if (
    action ===
      'admin_centers'
  ) {

    const centers =
      getCenters();

    await bot.sendMessage(

      chatId,

      [
        '🏢 MARKAZLAR',
        '',
        `Jami: ${centers.length}`,
        '',
        ...centers
          .slice(0, 30)
          .map(
            (c, i) =>
              `${i + 1}. ${c.name}`
          )
      ].join('\n'),

      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  '⬅️ Super Admin',

                callback_data:
                  'admin_home'
              }
            ]
          ]
        }
      }

    );

    return;

  }


  if (
    action ===
      'admin_teachers'
  ) {

    const teachers =
      getUsers()
        .filter(
          u =>
            u.role ===
            ROLES.TEACHER
        );

    await bot.sendMessage(

      chatId,

      [
        '👨‍🏫 CHESARA TRENERLARI',
        '',
        `Jami ustozlar: ${
          teachers.length
        }`,
        '',
        ...teachers
          .slice(0, 30)
          .map(
            (u, i) =>
              `${i + 1}. ${
                [
                  u.passport?.firstName,
                  u.passport?.lastName
                ]
                  .filter(Boolean)
                  .join(' ') ||
                'Ustoz'
              } — ${
                u.passport?.chesaraId ||
                '-'
              } ${
                u.passport?.isChesaraTrainer
                  ? '🏅'
                  : ''
              }`
          )
      ].join('\n'),

      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  '⬅️ Super Admin',

                callback_data:
                  'admin_home'
              }
            ]
          ]
        }
      }

    );

    return;

  }


  if (
    action ===
      'admin_passports'
  ) {

    await bot.sendMessage(

      chatId,

      [
        '🪪 CHESARA PASSPORT',
        '',
        'Passport tizimi faol.',
        '',
        'Har bir foydalanuvchining',
        'yagona CHESARA ID raqami mavjud.',
        '',
        'Masalan:',
        'CH-000001'
      ].join('\n'),

      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  '⬅️ Super Admin',

                callback_data:
                  'admin_home'
              }
            ]
          ]
        }
      }

    );

    return;

  }


  /*
  Hali keyingi modulga ulanadigan
  Super Admin bo‘limlari.
  */

  await bot.sendMessage(

    chatId,

    [
      '👑 SUPER ADMIN',
      '',
      'Bu bo‘lim mavjud.',
      '',
      'Keyingi modulda bu yerga:',
      '',
      '➕ Qo‘shish',
      '✏️ Tahrirlash',
      '🗑 Olib tashlash',
      '',
      'funksiyalari ulanadi.'
    ].join('\n'),

    {
      reply_markup:
        superAdminKeyboard()
    }

  );

}


/*
============================================================
 TELEGRAM CALLBACK
============================================================
*/

async function handleCallback(
  query
) {

  const chatId =
    query?.message?.chat?.id;

  const fromUser =
    query?.from;

  const action =
    query?.data;

  if (!chatId || !action) {
    return;
  }

  try {

    await bot.answerCallbackQuery(
      query.id
    );

  } catch (_) {}


  ensureTelegramUser(
    fromUser
  );


  /*
  ==========================================
  SUPER ADMIN
  ==========================================
  */

  if (
    String(chatId) ===
    SUPER_ADMIN_ID
  ) {

    if (
      action ===
        'admin_home'
    ) {

      await sendHome(
        chatId,
        fromUser?.first_name
      );

      return;

    }

    if (
      action.startsWith(
        'admin_'
      )
    ) {

      await superAdminAction(
        chatId,
        action
      );

      return;

    }

  }


  /*
  ==========================================
  OBUNA
  ==========================================
  */

  if (
    action ===
      'check_subscription'
  ) {

    if (
      await checkSubscription(
        chatId
      )
    ) {

      await sendHome(
        chatId,
        fromUser?.first_name
      );

    } else {

      await bot.sendMessage(

        chatId,

        '❌ Hali kanalga obuna bo‘lmagansiz.',

        {
          reply_markup:
            subscriptionKeyboard()
        }

      );

    }

    return;

  }


  /*
  ==========================================
  HOME
  ==========================================
  */

  if (
    action ===
      'home'
  ) {

    await sendHome(
      chatId,
      fromUser?.first_name
    );

    return;

  }


  /*
  ==========================================
  PASSPORT
  ==========================================
  */

  if (
    action ===
      'passport'
  ) {

    await sendPassport(
      chatId
    );

    return;

  }


  if (
    action ===
      'passport_search'
  ) {

    setState(

      chatId,

      {
        type:
          'passport_search'
      }

    );

    await bot.sendMessage(

      chatId,

      [
        '🔎 CHESARA PASSPORT TEKSHIRUVI',
        '',
        'CHESARA ID raqamini yuboring.',
        '',
        'Masalan:',
        'CH-000125'
      ].join('\n')

    );

    return;

  }


  /*
  ==========================================
  ROLE
  ==========================================
  */

  if (
    action ===
      'change_role'
  ) {

    await handleChangeRole(
      chatId
    );

    return;

  }


  if (
    action ===
      'role_student'
  ) {

    await selectRole(
      chatId,
      fromUser,
      ROLES.STUDENT
    );

    return;

  }


  if (
    action ===
      'role_parent'
  ) {

    await selectRole(
      chatId,
      fromUser,
      ROLES.PARENT
    );

    return;

  }


  if (
    action ===
      'role_teacher'
  ) {

    await selectRole(
      chatId,
      fromUser,
      ROLES.TEACHER
    );

    return;

  }


  /*
  ==========================================
  TEACHER
  ==========================================
  */

  if (
    action ===
      'teacher_center'
  ) {

    await teacherCenterMenu(
      chatId
    );

    return;

  }


  if (
    action ===
      'teacher_independent'
  ) {

    const user =
      getUser(chatId);

    if (user) {

      user.teacherType =
        TEACHER_TYPES.INDEPENDENT;

      access.saveData(
        access.loadData()
      );

    }

    await bot.sendMessage(

      chatId,

      [
        '🌐 MUSTAQIL / SHAXSIY KURS',
        '',
        'Siz mustaqil ustoz sifatida',
        'faoliyat yuritishingiz mumkin.',
        '',
        'Markazga biriktirilishingiz shart emas.',
        '',
        '🏢 Agar keyinchalik markaz sizni',
        'qo‘shmoqchi bo‘lsa, direktor',
        'CHESARA ID orqali sizni topadi.'
      ].join('\n'),

      {
        reply_markup:
          teacherKeyboard()
      }

    );

    return;

  }


  /*
  ==========================================
  DIRECTOR
  ==========================================
  */

  if (
    action ===
      'director_center'
  ) {

    await directorCenter(
      chatId
    );

    return;

  }


  if (
    action ===
      'director_add_teacher'
  ) {

    await directorAddTeacher(
      chatId
    );

    return;

  }


  /*
  ==========================================
  QOLGAN BO‘LIMLAR
  ==========================================
  */

  if (
    action ===
      'teacher_lessons' ||
    action ===
      'student_lessons' ||
    action ===
      'director_lessons' ||
    action ===
      'admin_lessons'
  ) {

    const lessons =
      getLessons();

    await bot.sendMessage(

      chatId,

      [
        '📅 DARSLAR',
        '',
        `Jami darslar: ${
          lessons.length
        }`,
        '',
        lessons.length
          ? lessons
              .slice(-15)
              .map(
                (l, i) =>
                  `${i + 1}. ${
                    l.groupName ||
                    'Guruh'
                  } — ${
                    l.startTime ||
                    '-'
                  }`
              )
              .join('\n')
          : 'Hozircha darslar yo‘q.'
      ].join('\n'),

      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  '⬅️ Menyu',

                callback_data:
                  'home'
              }
            ]
          ]
        }
      }

    );

    return;

  }


  if (
    action ===
      'admin_stats'
  ) {

    await superAdminAction(
      chatId,
      action
    );

    return;

  }


  await bot.sendMessage(

    chatId,

    [
      '♟️ CHESARA',
      '',
      'Bu bo‘lim tayyorlanmoqda.'
    ].join('\n'),

    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text:
                '⬅️ Menyu',

              callback_data:
                'home'
            }
          ]
        ]
      }
    }

  );

}


/*
============================================================
 TELEGRAM MESSAGE
============================================================
*/

async function handleMessage(
  message
) {

  const chatId =
    message?.chat?.id;

  if (!chatId) {
    return;
  }

  const fromUser =
    telegramUser(
      message
    );

  const text =
    String(
      message?.text ||
      ''
    ).trim();

  const user =
    ensureTelegramUser(
      fromUser
    );

  /*
  ==========================================
  STATE
  ==========================================
  */

  const state =
    getState(chatId);

  if (
    state?.type ===
      'passport_search'
  ) {

    const id =
      text
        .trim()
        .toUpperCase();

    clearState(
      chatId
    );

    const target =
      getUserByChesaraId(
        id
      );

    if (!target) {

      await bot.sendMessage(

        chatId,

        [
          '❌ CHESARA Passport topilmadi.',
          '',
          `Kiritilgan ID: ${id}`,
          '',
          'ID raqamini qayta tekshiring.'
        ].join('\n')

      );

      return;

    }

    await sendPassport(
      chatId,
      id
    );

    return;

  }


  if (
    state?.type ===
      'director_add_teacher'
  ) {

    const id =
      text
        .trim()
        .toUpperCase();

    clearState(
      chatId
    );

    try {

      const currentUser =
        getUser(chatId);

      const result =
        addTeacherToCenter(

          {
            id:
              chatId,

            username:
              fromUser.username
          },

          currentUser.centerId,

          id

        );

      const teacher =
        result.teacher;

      await bot.sendMessage(

        chatId,

        [
          '✅ USTOZ TOPILDI',
          '',
          `👤 ${
            [
              teacher.passport?.firstName,
              teacher.passport?.lastName
            ]
              .filter(Boolean)
              .join(' ')
          }`,
          '',
          `🪪 CHESARA ID: ${
            teacher.passport?.chesaraId
          }`,
          '',
          '🏢 Markazga biriktirildi.',
          '',
          'Ustoz endi o‘z kabinetida',
          'ushbu markazni ko‘radi.'
        ].join('\n'),

        {
          reply_markup:
            directorKeyboard()
        }

      );

    } catch (error) {

      await bot.sendMessage(

        chatId,

        `❌ ${error.message}`

      );

    }

    return;

  }


  /*
  ==========================================
  COMMANDS
  ==========================================
  */

  if (
    text === '/start' ||
    text.startsWith('/start ')
  ) {

    await sendHome(
      chatId,
      fromUser.first_name
    );

    return;

  }


  if (
    text === '/menu'
  ) {

    await sendHome(
      chatId,
      fromUser.first_name
    );

    return;

  }


  if (
    text === '/rol'
  ) {

    await handleChangeRole(
      chatId
    );

    return;

  }


  if (
    text === '/passport'
  ) {

    await sendPassport(
      chatId
    );

    return;

  }


  if (
    text === '/admin'
  ) {

    if (
      String(chatId) ===
      SUPER_ADMIN_ID
    ) {

      await sendHome(
        chatId,
        fromUser.first_name
      );

    } else {

      await bot.sendMessage(
        chatId,
        '❌ Sizda Super Admin huquqi yo‘q.'
      );

    }

    return;

  }


  /*
  ==========================================
  PASSPORT ID
  ==========================================
  */

  if (
    /^CH-\d{6}$/i.test(
      text
    )
  ) {

    await sendPassport(
      chatId,
      text
    );

    return;

  }


  /*
  ==========================================
  ODDIY MATN
  ==========================================
  */

  await bot.sendMessage(

    chatId,

    [
      '♟️ CHESARA',
      '',
      'Kerakli bo‘limni menyudan tanlang.',
      '',
      '🪪 Passport tekshirish:',
      '/passport',
      '',
      '🔄 Rolni o‘zgartirish:',
      '/rol',
      '',
      '🏠 Menyu:',
      '/menu'
    ].join('\n'),

    {
      reply_markup:
        String(chatId) ===
        SUPER_ADMIN_ID
          ? superAdminKeyboard()
          : user?.role
            ? (
                user.role === ROLES.TEACHER
                  ? teacherKeyboard()
                  : user.role === ROLES.DIRECTOR ||
                    user.role === ROLES.ADMIN ||
                    user.role === ROLES.CONTROLLER
                    ? directorKeyboard()
                    : studentKeyboard()
              )
            : roleKeyboard()
    }

  );

}


/*
============================================================
 TELEGRAM SETUP
============================================================
*/

async function setupTelegram() {

  if (!BOT_TOKEN) {

    console.warn(
      '⚠️ TELEGRAM_BOT_TOKEN topilmadi.'
    );

    return;

  }

  try {

    bot =
      new TelegramBot(
        BOT_TOKEN
      );

    await bot.setWebHook(
      WEBHOOK_URL
    );

    telegramReady =
      true;

    console.log(
      '✅ Telegram webhook:',
      WEBHOOK_URL
    );

    bot.on(
      'webhook_error',
      error => {

        console.error(
          'Telegram webhook xatosi:',
          error.message
        );

      }
    );

  } catch (error) {

    telegramReady =
      false;

    console.error(
      '❌ Telegram ishga tushmadi:',
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

    res.sendStatus(200);

    try {

      const update =
        req.body;

      if (
        update.callback_query
      ) {

        await handleCallback(
          update.callback_query
        );

        return;

      }

      if (
        update.message
      ) {

        await handleMessage(
          update.message
        );

      }

    } catch (error) {

      console.error(
        '❌ Telegram update xatosi:',
        error
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

      success:
        true,

      project:
        'CHESARA',

      status:
        'online',

      telegramBot:
        Boolean(bot),

      telegramWebhook:
        telegramReady,

      superAdmin: {

        telegramId:
          SUPER_ADMIN_ID,

        username:
          SUPER_ADMIN_USERNAME

      },

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

      const stats =
        getAdminDashboard();

      res.json({

        success:
          true,

        project:
          'CHESARA',

        lessonsCount:
          lessons.length,

        ...stats,

        telegramBot:
          Boolean(bot),

        telegramWebhook:
          telegramReady,

        serverTime:
          new Date().toISOString()

      });

    } catch (error) {

      res.status(500).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 PUBLIC PASSPORT API
============================================================
*/

app.get(
  '/api/passport/:chesaraId',
  (req, res) => {

    try {

      const passport =
        getPublicPassport(
          req.params.chesaraId
        );

      if (!passport) {

        return res.status(404).json({

          success:
            false,

          message:
            'CHESARA Passport topilmadi.'

        });

      }

      res.json({

        success:
          true,

        passport

      });

    } catch (error) {

      res.status(500).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 USERS
============================================================
*/

app.get(
  '/api/users',
  (req, res) => {

    res.json({

      success:
        true,

      count:
        getUsers().length,

      users:
        getUsers()

    });

  }
);


app.get(
  '/api/users/:telegramId',
  (req, res) => {

    const user =
      getUser(
        req.params.telegramId
      );

    if (!user) {

      return res.status(404).json({

        success:
          false,

        message:
          'Foydalanuvchi topilmadi.'

      });

    }

    res.json({

      success:
        true,

      user

    });

  }
);


/*
============================================================
 ROLE API
============================================================
*/

app.get(
  '/api/users/:telegramId/role',
  (req, res) => {

    const user =
      getUser(
        req.params.telegramId
      );

    res.json({

      success:
        true,

      role:
        user?.role ||
        null,

      isSuperAdmin:
        String(
          req.params.telegramId
        ) === SUPER_ADMIN_ID,

      canChangeRole:
        canChangeRole(
          req.params.telegramId
        )

    });

  }
);


/*
============================================================
 CENTERS
============================================================
*/

app.get(
  '/api/centers',
  (req, res) => {

    res.json({

      success:
        true,

      count:
        getCenters().length,

      centers:
        getCenters()

    });

  }
);


app.get(
  '/api/centers/:id',
  (req, res) => {

    const center =
      getCenter(
        req.params.id
      );

    if (!center) {

      return res.status(404).json({

        success:
          false,

        message:
          'Markaz topilmadi.'

      });

    }

    res.json({

      success:
        true,

      center

    });

  }
);


/*
============================================================
 CENTER CREATE
============================================================
*/

app.post(
  '/api/centers',
  (req, res) => {

    try {

      const {

        actorTelegramId,

        name,

        address,

        phone

      } = req.body;

      if (!actorTelegramId) {

        return res.status(400).json({

          success:
            false,

          message:
            'actorTelegramId kerak.'

        });

      }

      const actor =
        getUser(
          actorTelegramId
        );

      if (
        String(actorTelegramId) !==
          SUPER_ADMIN_ID &&
        actor?.role !==
          ROLES.DIRECTOR
      ) {

        return res.status(403).json({

          success:
            false,

          message:
            'Markaz yaratish huquqi yo‘q.'

        });

      }

      const center =
        createCenter(

          {
            id:
              actorTelegramId
          },

          {
            name,

            address,

            phone,

            directorId:
              actorTelegramId

          }

        );

      res.status(201).json({

        success:
          true,

        center

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 FIND TEACHER BY CHESARA ID
============================================================
*/

app.get(
  '/api/passport/:chesaraId/teacher',
  (req, res) => {

    const teacher =
      findTeacherByChesaraId(
        req.params.chesaraId
      );

    if (!teacher) {

      return res.status(404).json({

        success:
          false,

        message:
          'Bu CHESARA ID orqali faol ustoz topilmadi.'

      });

    }

    res.json({

      success:
        true,

      teacher:
        getPublicPassport(
          req.params.chesaraId
        )

    });

  }
);


/*
============================================================
 DIRECTOR ADD TEACHER
============================================================
*/

app.post(
  '/api/centers/:centerId/teachers',
  (req, res) => {

    try {

      const {

        actorTelegramId,

        chesaraId

      } = req.body;

      const result =
        addTeacherToCenter(

          {
            id:
              actorTelegramId
          },

          req.params.centerId,

          chesaraId

        );

      res.json({

        success:
          true,

        message:
          'Ustoz markazga qo‘shildi.',

        teacher:
          getPublicPassport(
            chesaraId
          ),

        center:
          result.center

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 REMOVE TEACHER
============================================================
*/

app.delete(
  '/api/centers/:centerId/teachers/:teacherId',
  (req, res) => {

    try {

      removeTeacherFromCenter(

        {
          id:
            req.body.actorTelegramId
        },

        req.params.centerId,

        req.params.teacherId

      );

      res.json({

        success:
          true,

        message:
          'Ustoz markazdan chiqarildi.'

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 SALARY
============================================================
*/

app.post(
  '/api/centers/:centerId/teachers/:teacherId/salary',
  (req, res) => {

    try {

      const teacher =
        setTeacherSalary(

          {
            id:
              req.body.actorTelegramId
          },

          req.params.centerId,

          req.params.teacherId,

          req.body.salary,

          req.body.currency ||
            'UZS'

        );

      res.json({

        success:
          true,

        teacher

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 CENTER ADMIN
============================================================
*/

app.post(
  '/api/centers/:centerId/admins',
  (req, res) => {

    try {

      const user =
        addCenterAdmin(

          {
            id:
              req.body.actorTelegramId
          },

          req.params.centerId,

          req.body.targetUserId

        );

      res.json({

        success:
          true,

        user

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 CENTER CONTROLLER
============================================================
*/

app.post(
  '/api/centers/:centerId/controllers',
  (req, res) => {

    try {

      const user =
        addCenterController(

          {
            id:
              req.body.actorTelegramId
          },

          req.params.centerId,

          req.body.targetUserId

        );

      res.json({

        success:
          true,

        user

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 PASSPORT UPDATE
============================================================
*/

app.patch(
  '/api/passport/:telegramId',
  (req, res) => {

    try {

      const user =
        updatePassport(

          {
            id:
              req.body.actorTelegramId ||
              req.params.telegramId
          },

          req.params.telegramId,

          req.body

        );

      res.json({

        success:
          true,

        user

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 LESSONS
============================================================
*/

app.get(
  '/api/lessons',
  (req, res) => {

    res.json({

      success:
        true,

      count:
        getLessons().length,

      lessons:
        getLessons()

    });

  }
);


app.get(
  '/api/lessons/:id',
  (req, res) => {

    const lesson =
      getLesson(
        req.params.id
      );

    if (!lesson) {

      return res.status(404).json({

        success:
          false,

        message:
          'Dars topilmadi.'

      });

    }

    res.json({

      success:
        true,

      lesson

    });

  }
);


app.post(
  '/api/lessons',
  (req, res) => {

    try {

      const lesson =
        addLesson({

          id:
            req.body.id,

          groupId:
            req.body.groupId,

          groupName:
            req.body.groupName,

          coachId:
            req.body.coachId,

          coachName:
            req.body.coachName,

          coachTelegramId:
            req.body.coachTelegramId,

          directorTelegramId:
            req.body.directorTelegramId,

          startTime:
            req.body.startTime,

          durationMinutes:
            Number(
              req.body.durationMinutes
            ) || 90

        });

      res.status(201).json({

        success:
          true,

        lesson

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 ATTENDANCE
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

      res.json(
        result
      );

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

      });

    }

  }
);


/*
============================================================
 FINISH LESSON
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

          success:
            false,

          message:
            'Dars topilmadi.'

        });

      }

      res.json({

        success:
          true,

        lesson:
          result

      });

    } catch (error) {

      res.status(400).json({

        success:
          false,

        message:
          error.message

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

        success:
          false,

        message:
          'Telegram bot ulanmagan.'

      });

    }

    try {

      await bot.sendMessage(

        req.body.chatId,

        req.body.message

      );

      res.json({

        success:
          true

      });

    } catch (error) {

      res.status(500).json({

        success:
          false,

        message:
          error.message

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

    warning.message

  ).catch(
    error =>
      console.error(
        'Scheduler Telegram xatosi:',
        error.message
      )
  );

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

      success:
        false,

      message:
        'CHESARA API manzili topilmadi.'

    });

  }
);


/*
============================================================
 WEBSITE FALLBACK
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
 SERVER START
============================================================
*/

const server =
  app.listen(

    PORT,

    '0.0.0.0',

    async () => {

      console.log(
        `🚀 CHESARA ${PORT}-portda ishlayapti.`
      );

      console.log(
        '♟️ CHESARA AI Chess Platform'
      );

      console.log(
        `👑 Super Admin: ${SUPER_ADMIN_ID} (@${SUPER_ADMIN_USERNAME})`
      );

      try {

        startScheduler(
          sendAttendanceWarning
        );

        console.log(
          '⏰ Scheduler ishga tushdi.'
        );

      } catch (error) {

        console.error(
          'Scheduler xatosi:',
          error.message
        );

      }

      await setupTelegram();

    }

  );


/*
============================================================
 SHUTDOWN
============================================================
*/

async function shutdown(
  signal
) {

  console.log(
    `🛑 ${signal} qabul qilindi.`
  );

  try {

    if (bot) {

      await bot
        .deleteWebHook({
          drop_pending_updates:
            false
        })
        .catch(
          () => {}
        );

    }

    server.close(
      () => {

        console.log(
          '✅ CHESARA server yopildi.'
        );

        process.exit(0);

      }
    );

  } catch (error) {

    console.error(
      error
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
 GLOBAL ERRORS
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

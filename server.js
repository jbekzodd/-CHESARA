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
  isSubscribed
} = require('./subscription');

const {
  SUPER_ADMIN,
  getOrCreateUser,
  getUser,
  isSuperAdmin,
  setRole,
  getRole,
  canChangeRole,
  getRoleChangeMessage,
  getNextRoleChangeDate,
  getPermissions,
  hasPermission,
  createCenter,
  getCenters,
  getCenter,
  requestCenterJoin,
  approveCenterJoin,
  setIndependentTeacher,
  setCenterTeacher,
  getAllUsers
} = require('./access');

const app = express();

const PORT =
  Number(process.env.PORT) || 10000;

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN;

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
ROLLAR
============================================================
*/

const ROLES = {
  PARENT: 'parent',
  STUDENT: 'student',
  TEACHER: 'teacher',
  SUPER_ADMIN: 'super_admin'
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
 YORDAMCHI FUNKSIYALAR
============================================================
*/

function getTelegramUserFromMessage(message) {
  return {
    id: message?.from?.id,
    username: message?.from?.username,
    first_name:
      message?.from?.first_name,
    last_name:
      message?.from?.last_name
  };
}

function ensureUser(fromUser) {
  if (!fromUser?.id) {
    return null;
  }

  return getOrCreateUser({
    telegramId: fromUser.id,
    username: fromUser.username,
    firstName: fromUser.first_name,
    lastName: fromUser.last_name
  });
}

function userIsSuperAdmin(fromUser) {
  return isSuperAdmin({
    id: fromUser?.id,
    username: fromUser?.username
  });
}

/*
============================================================
 TELEGRAM MENULARI
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

function roleKeyboard() {
  return {
    inline_keyboard: [
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
            '🏢 Markazga qo‘shilish',
          callback_data:
            'join_center'
        }
      ],
      [
        {
          text:
            '🌐 CHESARA sayt',
          web_app: {
            url: PUBLIC_URL
          }
        }
      ],
      [
        {
          text:
            'ℹ️ Yordam',
          callback_data:
            'help'
        }
      ]
    ]
  };
}

function parentKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text:
            '👨‍👩‍👧 Farzandlarim',
          callback_data:
            'parent_children'
        }
      ],
      [
        {
          text:
            '📊 Farzandim natijalari',
          callback_data:
            'parent_results'
        }
      ],
      [
        {
          text:
            '📅 Davomat',
          callback_data:
            'parent_attendance'
        }
      ],
      [
        {
          text:
            '⬅️ Rolni o‘zgartirish',
          callback_data:
            'change_role'
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
            '📅 Davomat olish',
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
            '🏢 Markaz / kurs',
          callback_data:
            'teacher_center'
        }
      ],
      [
        {
          text:
            '📊 Hisobotlar',
          callback_data:
            'reports'
        }
      ],
      [
        {
          text:
            '🧩 Tizim qurish',
          callback_data:
            'teacher_build'
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
            '⚙️ Tizim sozlamalari',
          callback_data:
            'admin_settings'
        }
      ],
      [
        {
          text:
            '👑 Super Admin profili',
          callback_data:
            'admin_profile'
        }
      ]
    ]
  };
}

function backKeyboard(action = 'home') {
  return {
    inline_keyboard: [
      [
        {
          text:
            '⬅️ Orqaga',
          callback_data:
            action
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
          text:
            '⬅️ Asosiy menyu',
          callback_data:
            'home'
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

function subscriptionText() {
  return [
    '♟️ CHESARA',
    '',
    'Botdan foydalanish uchun',
    'rasmiy kanalimizga obuna bo‘lish kerak.',
    '',
    '📢 @uzchesara',
    '',
    'Obuna bo‘lgach,',
    '«✅ Obunani tekshirish» tugmasini bosing.'
  ].join('\n');
}

function telegramHomeText(
  firstName = 'Foydalanuvchi'
) {
  return [
    `♟️ Assalomu alaykum, ${firstName}!`,
    '',
    'CHESARA platformasiga xush kelibsiz.',
    '',
    'Avval o‘zingizga mos rolni tanlang:'
  ].join('\n');
}

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
      'Siz markazga qo‘shilishingiz',
      'yoki mustaqil kurs sifatida ishlashingiz mumkin.'
    ].join('\n');
  }

  return [
    '♟️ CHESARA',
    '',
    'Davom etish uchun rol tanlang.'
  ].join('\n');
}

/*
============================================================
 SUPER ADMIN
============================================================
*/

function superAdminText() {
  return [
    '👑 CHESARA SUPER ADMIN',
    '',
    `Telegram ID: ${SUPER_ADMIN.telegramId}`,
    `Username: @${SUPER_ADMIN.username}`,
    '',
    'Sizda CHESARA tizimining barcha',
    'qismlarini boshqarish huquqi mavjud.',
    '',
    'Menyu, matn, foydalanuvchi, markaz,',
    'kanal/obuna va boshqa tizim sozlamalari'
    ,'shu yerdan boshqariladi.'
  ].join('\n');
}

async function sendSuperAdminMenu(
  chatId
) {
  if (!bot) return;

  await bot.sendMessage(
    chatId,
    superAdminText(),
    {
      reply_markup:
        superAdminKeyboard()
    }
  );
}

/*
============================================================
 OBUNA
============================================================
*/

async function checkUserSubscription(
  chatId
) {
  if (!bot) {
    return false;
  }

  /*
    SUPER ADMIN uchun obuna cheklovi yo‘q.
  */

  if (isSuperAdmin(chatId)) {
    return true;
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

async function requireChannelSubscription(
  chatId
) {
  if (isSuperAdmin(chatId)) {
    return true;
  }

  const subscribed =
    await checkUserSubscription(
      chatId
    );

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
 ROL MENUSI
============================================================
*/

async function sendRoleMenu(
  chatId,
  firstName = 'Foydalanuvchi'
) {
  if (!bot) return;

  if (isSuperAdmin(chatId)) {
    await sendSuperAdminMenu(chatId);
    return;
  }

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

  const user =
    getUser(chatId);

  /*
    Agar foydalanuvchi avval rol tanlagan bo‘lsa,
    rol tanlash oynasini qayta ko‘rsatmaymiz.
  */

  if (user?.role) {
    await sendSelectedRoleMenu(
      chatId,
      user.role
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

  if (isSuperAdmin(chatId)) {
    await sendSuperAdminMenu(chatId);
    return;
  }

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
    await sendTeacherMenu(
      chatId
    );
  }
}

async function sendTeacherMenu(
  chatId
) {
  const user =
    getUser(chatId);

  let extra = '';

  if (
    user?.teacherType ===
    'independent'
  ) {
    extra =
      '\n\n🌐 Faoliyat turi: Mustaqil / shaxsiy kurs';
  }

  if (
    user?.teacherType ===
    'center' &&
    user.centerId
  ) {
    const center =
      getCenter(
        user.centerId
      );

    if (center) {
      extra =
        `\n\n🏢 Markaz: ${center.name}`;
    }
  }

  await bot.sendMessage(
    chatId,
    roleText(
      ROLES.TEACHER
    ) + extra,
    {
      reply_markup:
        teacherKeyboard()
    }
  );
}

/*
============================================================
 USTOZ TANLOVI
============================================================
*/

function teacherTypeKeyboard() {
  return {
    inline_keyboard: [
      [
        {
          text:
            '🏢 Mavjud markazga qo‘shilaman',
          callback_data:
            'teacher_join_center'
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
            '⬅️ Orqaga',
          callback_data:
            'home'
        }
      ]
    ]
  };
}

async function sendTeacherTypeMenu(
  chatId
) {
  await bot.sendMessage(
    chatId,
    [
      '👨‍🏫 USTOZ',
      '',
      'Siz qanday faoliyat yuritasiz?',
      '',
      '🏢 Mavjud o‘quv markaziga qo‘shilishingiz mumkin.',
      '',
      '🌐 Yoki hech qanday markazsiz',
      'mustaqil / shaxsiy kurs sifatida ishlashingiz mumkin.'
    ].join('\n'),
    {
      reply_markup:
        teacherTypeKeyboard()
    }
  );
}

/*
============================================================
 MARKAZLAR
============================================================
*/

function centersKeyboard() {
  const centers =
    getCenters();

  const rows =
    centers.map(center => [
      {
        text:
          `🏢 ${center.name}`,
        callback_data:
          `center_join_${center.id}`
      }
    ]);

  rows.push([
    {
      text:
        '⬅️ Orqaga',
      callback_data:
        'teacher_type'
    }
  ]);

  return {
    inline_keyboard:
      rows
  };
}

async function sendCenters(
  chatId
) {
  const centers =
    getCenters();

  if (centers.length === 0) {
    await bot.sendMessage(
      chatId,
      [
        '🏢 MARKAZLAR',
        '',
        'Hozircha CHESARAda mavjud',
        'o‘quv markazlari yo‘q.',
        '',
        'Siz mustaqil / shaxsiy kurs',
        'sifatida boshlashingiz mumkin.'
      ].join('\n'),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  '🌐 Shaxsiy kurs',
                callback_data:
                  'teacher_independent'
              }
            ],
            [
              {
                text:
                  '⬅️ Orqaga',
                callback_data:
                  'teacher_type'
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
      '🏢 MARKAZLAR',
      '',
      'Qo‘shilmoqchi bo‘lgan markazingizni tanlang:'
    ].join('\n'),
    {
      reply_markup:
        centersKeyboard()
    }
  );
}

/*
============================================================
 ROL TANLASH
============================================================
*/

async function selectRole(
  chatId,
  fromUser,
  role
) {
  const user =
    ensureUser(fromUser);

  if (!user) return;

  const result =
    setRole(
      chatId,
      role
    );

  if (!result.success) {
    await bot.sendMessage(
      chatId,
      `🔒 ${result.message}`,
      {
        reply_markup:
          backToRolesKeyboard()
      }
    );

    return;
  }

  if (role === ROLES.TEACHER) {
    await sendTeacherTypeMenu(
      chatId
    );

    return;
  }

  await sendSelectedRoleMenu(
    chatId,
    role
  );
}

/*
============================================================
 ROLNI O‘ZGARTIRISH
============================================================
*/

async function handleChangeRole(
  chatId
) {
  const user =
    getUser(chatId);

  if (
    isSuperAdmin(chatId)
  ) {
    await bot.sendMessage(
      chatId,
      [
        '👑 SUPER ADMIN',
        '',
        'Siz rolni istalgan vaqtda',
        'almashtirishingiz mumkin.',
        '',
        'Yangi rolni tanlang:'
      ].join('\n'),
      {
        reply_markup:
          roleKeyboard()
      }
    );

    return;
  }

  if (!user?.role) {
    await sendRoleMenu(
      chatId
    );

    return;
  }

  if (
    !canChangeRole(chatId)
  ) {
    await bot.sendMessage(
      chatId,
      [
        `🔒 Hozirgi rolingiz: ${user.role}`,
        '',
        getRoleChangeMessage(user),
        '',
        'Rolni muddatidan oldin almashtirish',
        'uchun Super Adminga murojaat qiling.'
      ].join('\n'),
      {
        reply_markup:
          backKeyboard()
      }
    );

    return;
  }

  await bot.sendMessage(
    chatId,
    [
      `🔄 Hozirgi rolingiz: ${user.role}`,
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
 TELEGRAM ACTIONS
============================================================
*/

async function handleTelegramAction(
  chatId,
  action,
  fromUser
) {
  if (!bot) return;

  const user =
    ensureUser(fromUser);

  const superAdmin =
    userIsSuperAdmin(
      fromUser
    );

  /*
    SUPER ADMIN har doim kirishi mumkin.
  */

  if (
    action ===
    'check_subscription'
  ) {
    const subscribed =
      await checkUserSubscription(
        chatId
      );

    if (!subscribed) {
      await bot.sendMessage(
        chatId,
        [
          '❌ Hali obuna bo‘lmagansiz.',
          '',
          'Avval @uzchesara kanaliga obuna bo‘ling.',
          '',
          'Keyin yana tekshiring.'
        ].join('\n'),
        {
          reply_markup:
            subscriptionKeyboard()
        }
      );

      return;
    }

    await sendRoleMenu(
      chatId,
      fromUser?.first_name ||
        'Foydalanuvchi'
    );

    return;
  }

  if (!superAdmin) {
    const subscribed =
      await requireChannelSubscription(
        chatId
      );

    if (!subscribed) {
      return;
    }
  }

  /*
  ==========================================================
  HOME
  ==========================================================
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
  ==========================================================
  SUPER ADMIN
  ==========================================================
  */

  if (superAdmin) {
    if (
      action ===
      'admin_users'
    ) {
      const users =
        getAllUsers();

      const counts = {
        total: users.length,
        teachers:
          users.filter(
            u =>
              u.role ===
              ROLES.TEACHER
          ).length,
        students:
          users.filter(
            u =>
              u.role ===
              ROLES.STUDENT
          ).length,
        parents:
          users.filter(
            u =>
              u.role ===
              ROLES.PARENT
          ).length
      };

      await bot.sendMessage(
        chatId,
        [
          '👥 FOYDALANUVCHILAR',
          '',
          `Jami: ${counts.total}`,
          `👨‍🏫 Ustozlar: ${counts.teachers}`,
          `👨‍🎓 O‘quvchilar: ${counts.students}`,
          `👨‍👩‍👧 Ota-onalar: ${counts.parents}`,
          '',
          'Keyingi bosqichda bu bo‘limdan',
          'foydalanuvchilarni to‘liq boshqaramiz.'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
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
          `Jami markazlar: ${centers.length}`,
          '',
          centers.length
            ? centers
                .slice(0, 20)
                .map(
                  (c, i) =>
                    `${i + 1}. ${c.name}`
                )
                .join('\n')
            : 'Hozircha markaz yo‘q.',
          '',
          'Keyingi bosqichda markazlarni',
          'shu menyudan yaratish va boshqarish qo‘shiladi.'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_courses'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '📚 KURSLAR',
          '',
          'Bu bo‘lim CHESARA kurslari',
          'va metodikalarini boshqarish uchun bo‘ladi.',
          '',
          '🔧 Modul keyingi bosqichda ulanadi.'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_groups'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '📋 GURUHLAR',
          '',
          'Guruhlarni markaz, ustoz va',
          'o‘quvchilar bilan bog‘lash moduli.',
          '',
          '🔧 Keyingi bosqichda ulanadi.'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_menus'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '🧩 MENYULAR',
          '',
          'Super Admin keyinchalik:',
          '',
          '• menyu qo‘shishi',
          '• menyuni o‘chirishi',
          '• nomini o‘zgartirishi',
          '• tartibini o‘zgartirishi',
          '• kimga ko‘rinishini belgilashi',
          '',
          'mumkin bo‘ladi.',
          '',
          '🔧 To‘liq menu builder keyingi bosqichda ulanadi.'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_texts'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '✏️ MATNLAR',
          '',
          'Super Admin barcha Telegram',
          'matnlarini boshqarishi mumkin bo‘ladi.',
          '',
          '• Welcome',
          '• Help',
          '• Rol matnlari',
          '• Tugma matnlari',
          '• Obuna matnlari',
          '',
          '🔧 Matn editori keyingi bosqichda ulanadi.'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_subscription'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '📢 KANAL / OBUNA',
          '',
          'Super Admin bu yerdan:',
          '',
          '• kanalni',
          '• guruhni',
          '• obuna talabini',
          '• obuna tekshiruvini',
          '',
          'boshqarishi mumkin bo‘ladi.',
          '',
          'Hozirgi kanal: @uzchesara'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_settings'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '⚙️ TIZIM SOZLAMALARI',
          '',
          '👑 Super Admin uchun barcha',
          'tizim sozlamalari ochiq.',
          '',
          'Bu bo‘lim keyingi bosqichlarda',
          'real sozlama paneliga aylantiriladi.'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_profile'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '👑 SUPER ADMIN PROFILI',
          '',
          `ID: ${SUPER_ADMIN.telegramId}`,
          `Username: @${SUPER_ADMIN.username}`,
          '',
          '🔓 To‘liq tizim huquqi'
        ].join('\n'),
        {
          reply_markup:
            backKeyboard(
              'admin_home'
            )
        }
      );

      return;
    }

    if (
      action ===
      'admin_home'
    ) {
      await sendSuperAdminMenu(
        chatId
      );

      return;
    }
  }

  /*
  ==========================================================
  ROL TANLASH
  ==========================================================
  */

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
    'role_teacher'
  ) {
    await selectRole(
      chatId,
      fromUser,
      ROLES.TEACHER
    );

    return;
  }

  if (
    action ===
    'change_role'
  ) {
    await handleChangeRole(
      chatId
    );

    return;
  }

  /*
  ==========================================================
  USTOZ FAOLIYAT TURI
  ==========================================================
  */

  if (
    action ===
    'teacher_type'
  ) {
    await sendTeacherTypeMenu(
      chatId
    );

    return;
  }

  if (
    action ===
    'teacher_independent'
  ) {
    const result =
      setIndependentTeacher(
        chatId
      );

    if (!result.success) {
      await bot.sendMessage(
        chatId,
        `❌ ${result.message}`
      );

      return;
    }

    await bot.sendMessage(
      chatId,
      [
        '🌐 MUSTAQIL USTOZ',
        '',
        'Siz mustaqil / shaxsiy kurs',
        'sifatida belgilandingiz.',
        '',
        'Endi CHESARA orqali o‘zingiz:',
        '• kurs',
        '• guruh',
        '• o‘quvchi',
        '• dars',
        '• davomat',
        '• hisobot',
        '',
        'bilan ishlashingiz mumkin bo‘ladi.',
        '',
        '🔧 Keyingi modullarda bu funksiyalar to‘liq ulanadi.'
      ].join('\n'),
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  if (
    action ===
    'teacher_join_center'
  ) {
    await sendCenters(
      chatId
    );

    return;
  }

  if (
    action.startsWith(
      'center_join_'
    )
  ) {
    const centerId =
      action.replace(
        'center_join_',
        ''
      );

    const center =
      getCenter(centerId);

    if (!center) {
      await bot.sendMessage(
        chatId,
        '❌ Markaz topilmadi.'
      );

      return;
    }

    const result =
      requestCenterJoin({
        telegramId: chatId,
        centerId
      });

    if (!result.success) {
      await bot.sendMessage(
        chatId,
        `❌ ${result.message}`
      );

      return;
    }

    await bot.sendMessage(
      chatId,
      [
        '📨 SO‘ROV YUBORILDI',
        '',
        `🏢 Markaz: ${center.name}`,
        '',
        'Markazga qo‘shilish so‘rovingiz',
        'Super Admin tomonidan ko‘rib chiqiladi.',
        '',
        'Tasdiqlangandan keyin markaz',
        'tarkibida ishlashingiz mumkin bo‘ladi.'
      ].join('\n'),
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  /*
  ==========================================================
  MARKAZ
  ==========================================================
  */

  if (
    action ===
    'join_center'
  ) {
    await sendCenters(
      chatId
    );

    return;
  }

  if (
    action ===
    'teacher_center'
  ) {
    const currentUser =
      getUser(chatId);

    if (
      currentUser?.teacherType ===
      'independent'
    ) {
      await bot.sendMessage(
        chatId,
        [
          '🌐 SHAXSIY KURS',
          '',
          'Siz hozir mustaqil ustozsiz.',
          '',
          'Keyingi bosqichda bu yerdan',
          'shaxsiy kursingizni to‘liq boshqarasiz.'
        ].join('\n'),
        {
          reply_markup:
            teacherKeyboard()
        }
      );

      return;
    }

    if (
      currentUser?.centerId
    ) {
      const center =
        getCenter(
          currentUser.centerId
        );

      await bot.sendMessage(
        chatId,
        [
          '🏢 MARKAZ',
          '',
          `Nomi: ${center?.name || '-'}`,
          '',
          'Keyingi bosqichda markaz kabineti ulanadi.'
        ].join('\n'),
        {
          reply_markup:
            teacherKeyboard()
        }
      );

      return;
    }

    await sendTeacherTypeMenu(
      chatId
    );

    return;
  }

  /*
  ==========================================================
  YORDAM
  ==========================================================
  */

  if (
    action ===
    'help'
  ) {
    await bot.sendMessage(
      chatId,
      [
        'ℹ️ CHESARA YORDAM',
        '',
        '1️⃣ Kanalga obuna bo‘ling.',
        '2️⃣ Rolni birinchi marta tanlang.',
        '3️⃣ Ustoz bo‘lsangiz markazga qo‘shiling yoki mustaqil ishlang.',
        '4️⃣ Keyingi bosqichlarda CHESARA kabinetlari orqali tizimni boshqaring.',
        '',
        'Rolni almashtirish uchun /rol buyrug‘idan foydalaning.'
      ].join('\n'),
      {
        reply_markup:
          backToRolesKeyboard()
      }
    );

    return;
  }

  /*
  ==========================================================
  OTA-ONA
  ==========================================================
  */

  if (
    action ===
    'parent_children'
  ) {
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

  if (
    action ===
    'parent_results'
  ) {
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

  if (
    action ===
    'parent_attendance'
  ) {
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
  ==========================================================
  O‘QUVCHI
  ==========================================================
  */

  if (
    action ===
    'student_lessons'
  ) {
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

  if (
    action ===
    'student_attendance'
  ) {
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

  if (
    action ===
    'student_tournaments'
  ) {
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
  ==========================================================
  USTOZ
  ==========================================================
  */

  if (
    action ===
    'teacher_lessons'
  ) {
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

  if (
    action ===
    'teacher_students'
  ) {
    const users =
      getAllUsers();

    const students =
      users.filter(
        u =>
          u.role ===
          ROLES.STUDENT
      );

    await bot.sendMessage(
      chatId,
      [
        '👨‍🎓 O‘QUVCHILAR',
        '',
        `CHESARA bazasidagi o‘quvchilar: ${students.length} ta`,
        '',
        'Keyingi bosqichda bu yerda',
        'ustozning o‘z o‘quvchilari ko‘rsatiladi.'
      ].join('\n'),
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  if (
    action ===
    'teacher_build'
  ) {
    await bot.sendMessage(
      chatId,
      [
        '🧩 TIZIM QURISH',
        '',
        'Ustoz uchun keyingi bosqichlarda:',
        '',
        '🏢 Markaz',
        '📚 Kurs',
        '📋 Guruh',
        '👨‍🎓 O‘quvchi',
        '📅 Dars jadvali',
        '📊 Hisobot',
        '',
        'modullari shu yerda boshqariladi.'
      ].join('\n'),
      {
        reply_markup:
          teacherKeyboard()
      }
    );

    return;
  }

  if (
    action ===
    'attendance'
  ) {
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

  if (
    action ===
    'reports'
  ) {
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
  ==========================================================
  AI TAHLIL
  ==========================================================
  */

  if (
    action ===
    'analysis'
  ) {
    await bot.sendMessage(
      chatId,
      [
        '🧠 O‘YIN TAHLILI',
        '',
        'Bu bo‘limda shaxmat o‘yinlarini',
        'AI va Stockfish yordamida',
        'tahlil qilish tizimi ishlaydi.',
        '',
        '🔧 AI moduli keyingi bosqichda ulanadi.'
      ].join('\n'),
      {
        reply_markup:
          studentKeyboard()
      }
    );

    return;
  }

  /*
  ==========================================================
  PROFIL
  ==========================================================
  */

  if (
    action ===
    'profile'
  ) {
    const currentUser =
      getUser(chatId);

    await bot.sendMessage(
      chatId,
      [
        '👤 PROFIL',
        '',
        `Telegram ID: ${currentUser?.telegramId || chatId}`,
        `Username: ${
          currentUser?.username
            ? '@' + currentUser.username
            : '-'
        }`,
        `Rol: ${currentUser?.role || '-'}`,
        `Faoliyat turi: ${
          currentUser?.teacherType || '-'
        }`
      ].join('\n'),
      {
        reply_markup:
          currentUser?.role ===
          ROLES.TEACHER
            ? teacherKeyboard()
            : studentKeyboard()
      }
    );

    return;
  }

  /*
  ==========================================================
  NOMA’LUM ACTION
  ==========================================================
  */

  await bot.sendMessage(
    chatId,
    [
      '⚠️ Bu bo‘lim hali ulanmagan.',
      '',
      'CHESARA ishlab chiqilishi davom etmoqda.'
    ].join('\n'),
    {
      reply_markup:
        superAdmin
          ? superAdminKeyboard()
          : roleKeyboard()
    }
  );
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

    bot =
      new TelegramBot(
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

    await bot.deleteWebHook({
      drop_pending_updates:
        false
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

    res.sendStatus(200);

    try {
      const update =
        req.body;

      /*
      CALLBACK
      */

      if (
        update.callback_query
      ) {
        const query =
          update.callback_query;

        const chatId =
          query.message?.chat?.id;

        const action =
          query.data;

        const fromUser =
          query.from;

        await bot
          .answerCallbackQuery(
            query.id
          )
          .catch(() => {});

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

      if (
        update.message
      ) {
        const message =
          update.message;

        const chatId =
          message.chat?.id;

        const firstName =
          message.from?.first_name ||
          'Foydalanuvchi';

        const fromUser =
          getTelegramUserFromMessage(
            message
          );

        const text =
          String(
            message.text || ''
          ).trim();

        if (!chatId) {
          return;
        }

        /*
        FOYDALANUVCHINI BAZAGA YOZISH
        */

        ensureUser(
          fromUser
        );

        /*
        /start
        */

        if (
          text === '/start' ||
          text.startsWith('/start ')
        ) {
          await sendRoleMenu(
            chatId,
            firstName
          );

          return;
        }

        /*
        /menu
        */

        if (
          text === '/menu'
        ) {
          await sendRoleMenu(
            chatId,
            firstName
          );

          return;
        }

        /*
        /rol
        */

        if (
          text === '/rol'
        ) {
          await handleChangeRole(
            chatId
          );

          return;
        }

        /*
        /admin
        */

        if (
          text === '/admin'
        ) {
          if (
            userIsSuperAdmin(
              fromUser
            )
          ) {
            await sendSuperAdminMenu(
              chatId
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
        /markaz
        */

        if (
          text === '/markaz'
        ) {
          const subscribed =
            await requireChannelSubscription(
              chatId
            );

          if (!subscribed) {
            return;
          }

          const currentUser =
            getUser(chatId);

          if (
            currentUser?.role ===
            ROLES.TEACHER
          ) {
            await sendTeacherTypeMenu(
              chatId
            );
          } else if (
            userIsSuperAdmin(
              fromUser
            )
          ) {
            await sendSuperAdminMenu(
              chatId
            );
          } else {
            await bot.sendMessage(
              chatId,
              [
                '🏢 MARKAZ',
                '',
                'Markaz bilan bog‘liq funksiyalar',
                'ustoz roli orqali ishlaydi.'
              ].join('\n')
            );
          }

          return;
        }

        /*
        Oddiy matn
        */

        if (
          !userIsSuperAdmin(
            fromUser
          )
        ) {
          const subscribed =
            await requireChannelSubscription(
              chatId
            );

          if (!subscribed) {
            return;
          }
        }

        await bot.sendMessage(
          chatId,
          [
            '♟️ CHESARA',
            '',
            'Iltimos, kerakli bo‘limni',
            'menyudan tanlang.',
            '',
            'Rolni almashtirish kerak bo‘lsa:',
            '/rol'
          ].join('\n'),
          {
            reply_markup:
              userIsSuperAdmin(
                fromUser
              )
                ? superAdminKeyboard()
                : roleKeyboard()
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
      telegramBot:
        Boolean(bot),
      telegramWebhook:
        telegramReady,
      superAdmin:
        SUPER_ADMIN,
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

      const users =
        getAllUsers();

      const centers =
        getCenters();

      res.json({
        success: true,
        project:
          'CHESARA',

        lessonsCount:
          lessons.length,

        usersCount:
          users.length,

        studentsCount:
          users.filter(
            u =>
              u.role ===
              ROLES.STUDENT
          ).length,

        teachersCount:
          users.filter(
            u =>
              u.role ===
              ROLES.TEACHER
          ).length,

        parentsCount:
          users.filter(
            u =>
              u.role ===
              ROLES.PARENT
          ).length,

        centersCount:
          centers.length,

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
 USERS API
============================================================
*/

app.get(
  '/api/users',
  (req, res) => {
    try {
      res.json({
        success: true,
        count:
          getAllUsers().length,
        users:
          getAllUsers()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Foydalanuvchilarni olishda xatolik.'
      });
    }
  }
);

app.get(
  '/api/users/:telegramId',
  (req, res) => {
    try {
      const user =
        getUser(
          req.params.telegramId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            'Foydalanuvchi topilmadi.'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Foydalanuvchini olishda xatolik.'
      });
    }
  }
);

/*
============================================================
 CENTERS API
============================================================
*/

app.get(
  '/api/centers',
  (req, res) => {
    try {
      const centers =
        getCenters();

      res.json({
        success: true,
        count:
          centers.length,
        centers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Markazlarni olishda xatolik.'
      });
    }
  }
);

app.get(
  '/api/centers/:id',
  (req, res) => {
    try {
      const center =
        getCenter(
          req.params.id
        );

      if (!center) {
        return res.status(404).json({
          success: false,
          message:
            'Markaz topilmadi.'
        });
      }

      res.json({
        success: true,
        center
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Markazni olishda xatolik.'
      });
    }
  }
);

app.post(
  '/api/centers',
  (req, res) => {
    try {
      const {
        name,
        ownerTelegramId,
        description
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            'Markaz nomi kerak.'
        });
      }

      const center =
        createCenter({
          name,
          ownerTelegramId,
          description
        });

      res.status(201).json({
        success: true,
        message:
          'Markaz yaratildi.',
        center
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Markaz yaratishda xatolik.'
      });
    }
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
    try {
      const user =
        getUser(
          req.params.telegramId
        );

      res.json({
        success: true,
        role:
          user?.role || null,
        isSuperAdmin:
          isSuperAdmin(
            req.params.telegramId
          ),
        canChangeRole:
          canChangeRole(
            req.params.telegramId
          ),
        nextRoleChange:
          user
            ? getNextRoleChangeDate(
                user
              )
            : null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          'Rolni olishda xatolik.'
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

      console.log(
        `👑 Super Admin: ${SUPER_ADMIN.telegramId} (@${SUPER_ADMIN.username})`
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

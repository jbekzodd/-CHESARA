'use strict';

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN topilmadi!');
  module.exports = null;
  return;
}

const bot = new TelegramBot(token, {
  polling: false
});

console.log('🤖 CHESARA Telegram bot moduli ishga tushdi.');

/* =========================================================
   SUPER ADMIN
========================================================= */

const SUPER_ADMIN = {
  telegramId: 1148401454,
  username: 'jovliyev_bekzod'
};

/* =========================================================
   SUPER ADMINNI TEKSHIRISH
========================================================= */

function isSuperAdmin(user) {
  if (!user) return false;

  const id = Number(user.id || user.telegramId);

  const username = String(
    user.username || ''
  )
    .replace('@', '')
    .toLowerCase();

  return (
    id === SUPER_ADMIN.telegramId ||
    username === SUPER_ADMIN.username.toLowerCase()
  );
}

/* =========================================================
   FOYDALANUVCHI HOLATI
========================================================= */

const userState = new Map();

function setUserState(userId, state) {
  userState.set(String(userId), state);
}

function getUserState(userId) {
  return userState.get(String(userId)) || null;
}

function clearUserState(userId) {
  userState.delete(String(userId));
}

/* =========================================================
   ASOSIY MENYU
========================================================= */

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['👨‍🏫 Ustoz kabineti'],
      ['👨‍🎓 O‘quvchi kabineti'],
      ['📅 Davomat', '📊 Hisobotlar'],
      ['🧠 O‘yin tahlili', '🏆 Turnirlar'],
      ['📰 Yangiliklar', '🔔 Ogohlantirishlar'],
      ['🪪 CHESARA Pasport'],
      ['🔎 ID orqali tekshirish'],
      ['⚙️ Profil'],
      ['🔄 Rolni o‘zgartirish']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/* =========================================================
   SUPER ADMIN MENYU
========================================================= */

const superAdminMenu = {
  reply_markup: {
    keyboard: [
      ['👑 Super Admin'],
      ['👥 Foydalanuvchilar'],
      ['🪪 CHESARA Pasportlar'],
      ['🏢 Markazlar'],
      ['📚 Kurslar'],
      ['📋 Guruhlar'],
      ['📅 Darslar'],
      ['👨‍🏫 Ustozlar'],
      ['👨‍💼 Direktorlar'],
      ['🛡 Nazoratchilar'],
      ['🧩 Menyular'],
      ['✏️ Matnlar'],
      ['📢 Kanal / Obuna'],
      ['⚙️ Tizim sozlamalari'],
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/* =========================================================
   USTOZ MENYU
========================================================= */

const teacherMenu = {
  reply_markup: {
    keyboard: [
      ['👨‍🎓 O‘quvchilar'],
      ['📚 Kurslar'],
      ['📋 Guruhlar'],
      ['📅 Darslar'],
      ['📅 Davomat'],
      ['📊 Hisobotlar'],
      ['💰 To‘lovlar'],
      ['🪪 CHESARA Pasport'],
      ['🏢 Markaz / Shaxsiy kurs'],
      ['🧩 Tizim qurish'],
      ['⚙️ Profil'],
      ['🔄 Rolni o‘zgartirish'],
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/* =========================================================
   O‘QUVCHI MENYU
========================================================= */

const studentMenu = {
  reply_markup: {
    keyboard: [
      ['📚 Darslarim'],
      ['📅 Davomatim'],
      ['🧠 O‘yin tahlili'],
      ['🏆 Turnirlar'],
      ['📈 Rivojlanishim'],
      ['🪪 CHESARA Pasport'],
      ['🔎 ID orqali tekshirish'],
      ['⚙️ Profil'],
      ['🔄 Rolni o‘zgartirish'],
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/* =========================================================
   OTA-ONA MENYU
========================================================= */

const parentMenu = {
  reply_markup: {
    keyboard: [
      ['👨‍👩‍👧 Farzandlarim'],
      ['📊 Natijalar'],
      ['📅 Davomat'],
      ['🔔 Ogohlantirishlar'],
      ['🪪 CHESARA Pasport'],
      ['🔎 ID orqali tekshirish'],
      ['⚙️ Profil'],
      ['🔄 Rolni o‘zgartirish'],
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/* =========================================================
   ORQAGA
========================================================= */

const backMenu = {
  reply_markup: {
    keyboard: [
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true
  }
};

/* =========================================================
   ROL TANLASH
========================================================= */

const roleMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: '👨‍🏫 Ustoz',
          callback_data: 'role_teacher'
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
          text: '👨‍👩‍👧 Ota-ona',
          callback_data: 'role_parent'
        }
      ]
    ]
  }
};

/* =========================================================
   USTOZ FAOLIYAT TURI
========================================================= */

const teacherTypeMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: '🏢 Mavjud markazga qo‘shilaman',
          callback_data: 'teacher_join_center'
        }
      ],
      [
        {
          text: '🌐 Mustaqil / shaxsiy kurs',
          callback_data: 'teacher_independent'
        }
      ],
      [
        {
          text: '⬅️ Orqaga',
          callback_data: 'home'
        }
      ]
    ]
  }
};

/* =========================================================
   ADMIN CRUD MENYU
========================================================= */

function adminCrudMenu(type) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '➕ Qo‘shish',
            callback_data: `crud_add_${type}`
          }
        ],
        [
          {
            text: '✏️ Tahrirlash',
            callback_data: `crud_edit_${type}`
          }
        ],
        [
          {
            text: '🗑 O‘chirish',
            callback_data: `crud_delete_${type}`
          }
        ],
        [
          {
            text: '👁 Ko‘rish',
            callback_data: `crud_view_${type}`
          }
        ],
        [
          {
            text: '⬅️ Super Admin',
            callback_data: 'admin_home'
          }
        ]
      ]
    }
  };
}

/* =========================================================
   PASPORT MENYU
========================================================= */

const passportMenu = {
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: '🪪 Mening CHESARA Pasportim',
          callback_data: 'passport_me'
        }
      ],
      [
        {
          text: '🔎 ID orqali tekshirish',
          callback_data: 'passport_verify'
        }
      ],
      [
        {
          text: '⬅️ Orqaga',
          callback_data: 'home'
        }
      ]
    ]
  }
};

/* =========================================================
   SUPER ADMIN
========================================================= */

async function showSuperAdmin(chatId) {
  await bot.sendMessage(
    chatId,
    [
      '👑 CHESARA SUPER ADMIN',
      '',
      `CHESARA ID: ${SUPER_ADMIN.telegramId}`,
      `Telegram: @${SUPER_ADMIN.username}`,
      '',
      'Siz CHESARA tizimining barcha qismlarini',
      'boshqarishingiz mumkin.',
      '',
      '🔐 To‘liq huquq:',
      '• Foydalanuvchilar',
      '• Pasportlar',
      '• Markazlar',
      '• Direktorlar',
      '• Nazoratchilar',
      '• Ustozlar',
      '• Kurslar',
      '• Guruhlar',
      '• Darslar',
      '• Menyular',
      '• Matnlar',
      '• Kanal / obuna',
      '• Tizim sozlamalari'
    ].join('\n'),
    superAdminMenu
  );
}

/* =========================================================
   START
========================================================= */

async function showStart(chatId, firstName, user) {
  if (isSuperAdmin(user)) {
    await showSuperAdmin(chatId);
    return;
  }

  await bot.sendMessage(
    chatId,
    [
      `♟️ CHESARA'ga xush kelibsiz, ${firstName}!`,
      '',
      '🌍 AI Shaxmat Platformasi',
      '',
      'CHESARA orqali:',
      '',
      '👨‍🏫 Ustoz',
      '👨‍🎓 O‘quvchi',
      '👨‍👩‍👧 Ota-ona',
      '',
      'sifatida foydalanishingiz mumkin.',
      '',
      'Iltimos, o‘zingizga mos rolni tanlang.'
    ].join('\n'),
    roleMenu
  );
}

/* =========================================================
   PASPORT
========================================================= */

async function sendPassport(chatId, user) {
  const telegramId = user?.id || '-';

  await bot.sendMessage(
    chatId,
    [
      '🪪 CHESARA PASPORTI',
      '',
      `CHESARA ID: CH-${telegramId}`,
      '',
      `Ism: ${user?.first_name || '-'}`,
      `Familiya: ${user?.last_name || '-'}`,
      `Telegram: ${
        user?.username
          ? '@' + user.username
          : '-'
      }`,
      '',
      '👤 Maqom: Hozircha aniqlanmagan',
      '🏢 Markaz: Hozircha biriktirilmagan',
      '👨‍🏫 CHESARA trener: Tekshirilmoqda',
      '',
      '📜 Sertifikatlar:',
      'Hozircha sertifikat mavjud emas.',
      '',
      'CHESARA Pasporti foydalanuvchining',
      'platformadagi rasmiy profilidir.'
    ].join('\n'),
    passportMenu
  );
}

/* =========================================================
   ID TEKSHIRISH
========================================================= */

async function requestPassportVerification(chatId, userId) {
  setUserState(userId, {
    action: 'verify_passport'
  });

  await bot.sendMessage(
    chatId,
    [
      '🔎 CHESARA ID ORQALI TEKSHIRISH',
      '',
      'Tekshirmoqchi bo‘lgan CHESARA ID raqamini',
      'yuboring.',
      '',
      'Masalan:',
      'CH-1148401454',
      '',
      '⬅️ Bekor qilish uchun:',
      '/bekor'
    ].join('\n'),
    backMenu
  );
}

/* =========================================================
   ROLE TEXT
========================================================= */

const roleTexts = {
  teacher: [
    '👨‍🏫 USTOZ',
    '',
    'Ustoz kabinetiga xush kelibsiz.',
    '',
    'Siz:',
    '👥 O‘quvchilar',
    '📚 Kurslar',
    '📋 Guruhlar',
    '📅 Darslar',
    '✅ Davomat',
    '💰 To‘lovlar',
    '📊 Hisobotlar',
    '🪪 CHESARA Pasport',
    '',
    'bilan ishlashingiz mumkin.'
  ].join('\n'),

  student: [
    '👨‍🎓 O‘QUVCHI',
    '',
    'O‘quvchi kabinetiga xush kelibsiz.',
    '',
    '📚 Darslar',
    '📅 Davomat',
    '🧠 O‘yin tahlili',
    '🏆 Turnirlar',
    '📈 Rivojlanish',
    '🪪 CHESARA Pasport'
  ].join('\n'),

  parent: [
    '👨‍👩‍👧 OTA-ONA',
    '',
    'Ota-ona kabinetiga xush kelibsiz.',
    '',
    'Farzandingizning:',
    '📚 Darslari',
    '📅 Davomati',
    '📊 Natijalari',
    '📈 Rivojlanishi',
    '',
    'shu yerda ko‘rsatiladi.'
  ].join('\n')
};

/* =========================================================
   ROLE
========================================================= */

async function showRole(chatId, role) {

  if (role === 'teacher') {
    await bot.sendMessage(
      chatId,
      roleTexts.teacher,
      teacherMenu
    );

    await bot.sendMessage(
      chatId,
      [
        '👨‍🏫 FAOLIYAT TURINI TANLANG',
        '',
        '🏢 Mavjud markazga qo‘shilish',
        'yoki',
        '🌐 Mustaqil / shaxsiy kurs'
      ].join('\n'),
      teacherTypeMenu
    );

    return;
  }

  if (role === 'student') {
    await bot.sendMessage(
      chatId,
      roleTexts.student,
      studentMenu
    );
    return;
  }

  if (role === 'parent') {
    await bot.sendMessage(
      chatId,
      roleTexts.parent,
      parentMenu
    );
  }
}

/* =========================================================
   ADMIN SECTION
========================================================= */

const adminTypes = {
  users: 'users',
  passports: 'passports',
  centers: 'centers',
  courses: 'courses',
  groups: 'groups',
  lessons: 'lessons',
  teachers: 'teachers',
  directors: 'directors',
  controllers: 'controllers',
  menus: 'menus',
  texts: 'texts',
  subscriptions: 'subscriptions'
};

const adminTitles = {
  users: '👥 FOYDALANUVCHILAR',
  passports: '🪪 CHESARA PASPORTLAR',
  centers: '🏢 MARKAZLAR',
  courses: '📚 KURSLAR',
  groups: '📋 GURUHLAR',
  lessons: '📅 DARSLAR',
  teachers: '👨‍🏫 USTOZLAR',
  directors: '👨‍💼 DIREKTORLAR',
  controllers: '🛡 NAZORATCHILAR',
  menus: '🧩 MENYULAR',
  texts: '✏️ MATNLAR',
  subscriptions: '📢 KANAL / OBUNA'
};

async function adminSection(chatId, type) {
  const title = adminTitles[type] || '⚙️ BO‘LIM';

  await bot.sendMessage(
    chatId,
    [
      title,
      '',
      'Bu bo‘lim Super Admin tomonidan',
      'to‘liq boshqariladi.',
      '',
      'Kerakli amalni tanlang:'
    ].join('\n'),
    adminCrudMenu(type)
  );
}

/* =========================================================
   CRUD ACTION
========================================================= */

async function handleCrudAction(chatId, user, action) {

  if (!isSuperAdmin(user)) {
    await bot.sendMessage(
      chatId,
      '❌ Bu amal faqat Super Admin uchun.',
      backMenu
    );
    return;
  }

  const parts = action.split('_');
  const operation = parts[1];
  const type = parts.slice(2).join('_');

  const title = adminTitles[type] || 'BO‘LIM';

  if (operation === 'add') {
    setUserState(user.id, {
      action: 'admin_add',
      type
    });

    await bot.sendMessage(
      chatId,
      [
        '➕ QO‘SHISH',
        '',
        title,
        '',
        'Yangi ma’lumot uchun kerakli nom yoki',
        'ma’lumotni yuboring.',
        '',
        'Masalan markaz bo‘lsa:',
        'Markaz nomi + shahar',
        '',
        '🔧 Ma’lumotlar bazasi moduli ulanganida',
        'bu amal real yozuv yaratadi.',
        '',
        '⬅️ Bekor qilish: /bekor'
      ].join('\n'),
      backMenu
    );

    return;
  }

  if (operation === 'edit') {
    setUserState(user.id, {
      action: 'admin_edit',
      type
    });

    await bot.sendMessage(
      chatId,
      [
        '✏️ TAHRIRLASH',
        '',
        title,
        '',
        'Tahrirlanadigan CHESARA ID yoki',
        'obyekt ID sini yuboring.',
        '',
        '⬅️ Bekor qilish: /bekor'
      ].join('\n'),
      backMenu
    );

    return;
  }

  if (operation === 'delete') {
    setUserState(user.id, {
      action: 'admin_delete',
      type
    });

    await bot.sendMessage(
      chatId,
      [
        '🗑 O‘CHIRISH',
        '',
        title,
        '',
        'O‘chiriladigan obyektning ID raqamini',
        'yuboring.',
        '',
        '⚠️ O‘chirishdan oldin CHESARA',
        'tasdiqlashni talab qiladi.',
        '',
        '⬅️ Bekor qilish: /bekor'
      ].join('\n'),
      backMenu
    );

    return;
  }

  if (operation === 'view') {
    await bot.sendMessage(
      chatId,
      [
        '👁 KO‘RISH',
        '',
        title,
        '',
        'Bu yerda mavjud yozuvlar ro‘yxati',
        'ko‘rsatiladi.',
        '',
        '🔧 Real ma’lumotlar bazasi bilan',
        'keyingi backend modulida ulanadi.'
      ].join('\n'),
      adminCrudMenu(type)
    );
  }
}

/* =========================================================
   START
========================================================= */

async function handleText(msg) {

  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const user = msg.from || {};

  /* ---------------------------------------------
     BEKOR
  --------------------------------------------- */

  if (text === '/bekor') {
    clearUserState(user.id);

    await showStart(
      chatId,
      user.first_name || 'shaxmatchi',
      user
    );

    return;
  }

  /* ---------------------------------------------
     STATE
  --------------------------------------------- */

  const state = getUserState(user.id);

  if (state) {

    if (state.action === 'verify_passport') {

      clearUserState(user.id);

      await bot.sendMessage(
        chatId,
        [
          '🔎 CHESARA ID TEKSHIRUVI',
          '',
          `Kiritilgan ID: ${text}`,
          '',
          '⏳ Ma’lumotlar bazasidan tekshirilmoqda...',
          '',
          '🔧 Pasport bazasi backend moduliga',
          'ulangandan so‘ng bu yerda:',
          '',
          '🪪 Pasport',
          '👤 F.I.Sh.',
          '📸 Foto',
          '👨‍🏫 Trener maqomi',
          '🏢 Markaz',
          '📜 Sertifikatlar',
          '✅ CHESARAda faol yoki faol emasligi',
          '',
          'to‘liq ko‘rsatiladi.'
        ].join('\n'),
        backMenu
      );

      return;
    }

    if (
      state.action === 'admin_add' ||
      state.action === 'admin_edit' ||
      state.action === 'admin_delete'
    ) {

      const actionText =
        state.action === 'admin_add'
          ? '➕ QO‘SHISH'
          : state.action === 'admin_edit'
            ? '✏️ TAHRIRLASH'
            : '🗑 O‘CHIRISH';

      const typeTitle =
        adminTitles[state.type] ||
        'BO‘LIM';

      clearUserState(user.id);

      await bot.sendMessage(
        chatId,
        [
          actionText,
          '',
          typeTitle,
          '',
          `Qabul qilindi: ${text}`,
          '',
          '🔧 Keyingi backend bosqichida',
          'bu amal ma’lumotlar bazasiga ulanadi.'
        ].join('\n'),
        adminCrudMenu(state.type)
      );

      return;
    }
  }

  /* ---------------------------------------------
     START
  --------------------------------------------- */

  if (text === '/start') {
    await showStart(
      chatId,
      user.first_name || 'shaxmatchi',
      user
    );
    return;
  }

  /* ---------------------------------------------
     ADMIN
  --------------------------------------------- */

  if (text === '/admin') {

    if (isSuperAdmin(user)) {
      await showSuperAdmin(chatId);
    } else {
      await bot.sendMessage(
        chatId,
        '❌ Sizda Super Admin huquqi yo‘q.',
        backMenu
      );
    }

    return;
  }

  /* ---------------------------------------------
     ROL
  --------------------------------------------- */

  if (
    text === '/rol' ||
    text === '🔄 Rolni o‘zgartirish'
  ) {

    if (isSuperAdmin(user)) {
      await bot.sendMessage(
        chatId,
        [
          '👑 SUPER ADMIN',
          '',
          'Siz uchun rol almashtirish cheklanmagan.',
          '',
          'Rolni tanlang:'
        ].join('\n'),
        roleMenu
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      [
        '🔄 ROLNI O‘ZGARTIRISH',
        '',
        'Yangi rolni tanlang:'
      ].join('\n'),
      roleMenu
    );

    return;
  }

  /* ---------------------------------------------
     SUPER ADMIN MENYU
  --------------------------------------------- */

  if (isSuperAdmin(user)) {

    const adminMap = {
      '👥 Foydalanuvchilar': 'users',
      '🪪 CHESARA Pasportlar': 'passports',
      '🏢 Markazlar': 'centers',
      '📚 Kurslar': 'courses',
      '📋 Guruhlar': 'groups',
      '📅 Darslar': 'lessons',
      '👨‍🏫 Ustozlar': 'teachers',
      '👨‍💼 Direktorlar': 'directors',
      '🛡 Nazoratchilar': 'controllers',
      '🧩 Menyular': 'menus',
      '✏️ Matnlar': 'texts',
      '📢 Kanal / Obuna': 'subscriptions'
    };

    if (adminMap[text]) {
      await adminSection(
        chatId,
        adminMap[text]
      );
      return;
    }

    if (text === '👑 Super Admin') {
      await showSuperAdmin(chatId);
      return;
    }

    if (text === '⚙️ Tizim sozlamalari') {
      await adminSection(
        chatId,
        'menus'
      );
      return;
    }
  }

  /* ---------------------------------------------
     BOSH MENYU
  --------------------------------------------- */

  if (text === '🏠 Bosh menyu') {
    await showStart(
      chatId,
      user.first_name || 'shaxmatchi',
      user
    );
    return;
  }

  /* ---------------------------------------------
     PASPORT
  --------------------------------------------- */

  if (text === '🪪 CHESARA Pasport') {
    await sendPassport(chatId, user);
    return;
  }

  if (text === '🔎 ID orqali tekshirish') {
    await requestPassportVerification(
      chatId,
      user.id
    );
    return;
  }

  /* ---------------------------------------------
     USTOZ
  --------------------------------------------- */

  if (text === '👨‍🏫 Ustoz kabineti') {
    await bot.sendMessage(
      chatId,
      roleTexts.teacher,
      teacherMenu
    );
    return;
  }

  if (text === '👨‍🎓 O‘quvchilar') {
    await bot.sendMessage(
      chatId,
      [
        '👨‍🎓 O‘QUVCHILAR',
        '',
        'Ustozning o‘quvchilari.',
        '',
        '➕ O‘quvchi qo‘shish',
        '✏️ Ma’lumotini tahrirlash',
        '🗑 O‘quvchini chiqarish',
        '👁 Profilini ko‘rish'
      ].join('\n'),
      teacherMenu
    );
    return;
  }

  if (text === '📚 Kurslar') {
    await bot.sendMessage(
      chatId,
      [
        '📚 KURSLAR',
        '',
        'Ustoz o‘z kurslarini boshqaradi.',
        '',
        '➕ Kurs qo‘shish',
        '✏️ Tahrirlash',
        '🗑 O‘chirish'
      ].join('\n'),
      teacherMenu
    );
    return;
  }

  if (text === '📋 Guruhlar') {
    await bot.sendMessage(
      chatId,
      [
        '📋 GURUHLAR',
        '',
        'Guruhlarni boshqarish.',
        '',
        '➕ Guruh qo‘shish',
        '✏️ Tahrirlash',
        '🗑 O‘chirish'
      ].join('\n'),
      teacherMenu
    );
    return;
  }

  if (text === '📅 Darslar') {
    await bot.sendMessage(
      chatId,
      [
        '📅 DARSLAR',
        '',
        'Ustoz darslarini boshqaradi.',
        '',
        '➕ Dars qo‘shish',
        '✏️ Tahrirlash',
        '🗑 O‘chirish'
      ].join('\n'),
      teacherMenu
    );
    return;
  }

  if (text === '💰 To‘lovlar') {
    await bot.sendMessage(
      chatId,
      [
        '💰 TO‘LOVLAR',
        '',
        'O‘quvchilar to‘lovlari va ustoz',
        'hisob-kitoblari shu yerda boshqariladi.'
      ].join('\n'),
      teacherMenu
    );
    return;
  }

  if (text === '🏢 Markaz / Shaxsiy kurs') {
    await bot.sendMessage(
      chatId,
      [
        '🏢 / 🌐 FAOLIYAT TURI',
        '',
        'Qaysi shaklda ishlamoqchisiz?'
      ].join('\n'),
      teacherTypeMenu
    );
    return;
  }

  if (text === '🧩 Tizim qurish') {
    await bot.sendMessage(
      chatId,
      [
        '🧩 TIZIM QURISH',
        '',
        'Ustoz:',
        '',
        '📚 Kurs',
        '📋 Guruh',
        '👨‍🎓 O‘quvchi',
        '📅 Dars',
        '',
        'yaratishi mumkin.'
      ].join('\n'),
      teacherMenu
    );
    return;
  }

  /* ---------------------------------------------
     ODDIY BO‘LIMLAR
  --------------------------------------------- */

  if (text === '👨‍🎓 O‘quvchi kabineti') {
    await bot.sendMessage(
      chatId,
      roleTexts.student,
      studentMenu
    );
    return;
  }

  if (text === '📅 Davomat') {
    await bot.sendMessage(
      chatId,
      [
        '📅 DAVOMAT',
        '',
        '✅ Keldi',
        '❌ Kelmagan',
        '⏰ Kechikdi',
        '',
        'Ustoz davomatni belgilaydi.'
      ].join('\n'),
      backMenu
    );
    return;
  }

  if (text === '📊 Hisobotlar') {
    await bot.sendMessage(
      chatId,
      [
        '📊 HISOBOTLAR',
        '',
        '📅 Kunlik',
        '📆 Haftalik',
        '🗓️ Oylik',
        '',
        'Davomat, darslar, o‘quvchilar',
        'va natijalar bo‘yicha hisobotlar.'
      ].join('\n'),
      backMenu
    );
    return;
  }

  if (text === '🧠 O‘yin tahlili') {
    await bot.sendMessage(
      chatId,
      [
        '🧠 AI O‘YIN TAHLILI',
        '',
        '♟️ Lichess',
        '♟️ Chess.com',
        '📸 Screenshot',
        '',
        'orqali o‘yinlarni tahlil qilish.'
      ].join('\n'),
      backMenu
    );
    return;
  }

  if (text === '🏆 Turnirlar') {
    await bot.sendMessage(
      chatId,
      [
        '🏆 TURNIRLAR',
        '',
        'Turnirlar, natijalar va',
        'o‘quvchilar reytingi.'
      ].join('\n'),
      backMenu
    );
    return;
  }

  if (text === '📰 Yangiliklar') {
    await bot.sendMessage(
      chatId,
      [
        '📰 CHESARA YANGILIKLARI',
        '',
        'Turnirlar, g‘oliblar, natijalar',
        'va shaxmat yangiliklari.'
      ].join('\n'),
      backMenu
    );
    return;
  }

  if (text === '🔔 Ogohlantirishlar') {
    await bot.sendMessage(
      chatId,
      [
        '🔔 OGOHLANTIRISHLAR',
        '',
        '⏰ Davomat',
        '📅 Darslar',
        '💰 To‘lovlar',
        '👨‍🎓 O‘quvchilar',
        '',
        'bo‘yicha avtomatik nazorat.'
      ].join('\n'),
      backMenu
    );
    return;
  }

  /* ---------------------------------------------
     PROFIL
  --------------------------------------------- */

  if (text === '⚙️ Profil') {
    await bot.sendMessage(
      chatId,
      [
        '⚙️ PROFIL',
        '',
        `Telegram ID: ${user.id || '-'}`,
        `Username: ${
          user.username
            ? '@' + user.username
            : '-'
        }`,
        `Ism: ${user.first_name || '-'}`,
        `Familiya: ${user.last_name || '-'}`,
        '',
        `CHESARA ID: CH-${user.id || '-'}`
      ].join('\n'),
      backMenu
    );
    return;
  }

  /* ---------------------------------------------
     FALLBACK
  --------------------------------------------- */

  await bot.sendMessage(
    chatId,
    [
      '♟️ CHESARA',
      '',
      'Iltimos, menyudan kerakli bo‘limni tanlang.',
      '',
      '/rol — rolni o‘zgartirish'
    ].join('\n'),
    isSuperAdmin(user)
      ? superAdminMenu
      : mainMenu
  );
}

/* =========================================================
   CALLBACK
========================================================= */

async function handleCallback(query) {

  const chatId = query.message?.chat?.id;
  const action = query.data;
  const user = query.from || {};

  if (!chatId) return;

  await bot
    .answerCallbackQuery(query.id)
    .catch(() => {});

  /* ADMIN HOME */

  if (action === 'admin_home') {
    await showSuperAdmin(chatId);
    return;
  }

  /* CRUD */

  if (
    action.startsWith('crud_')
  ) {
    await handleCrudAction(
      chatId,
      user,
      action
    );
    return;
  }

  /* HOME */

  if (action === 'home') {
    await showStart(
      chatId,
      user.first_name || 'shaxmatchi',
      user
    );
    return;
  }

  /* PASSPORT */

  if (action === 'passport_me') {
    await sendPassport(
      chatId,
      user
    );
    return;
  }

  if (action === 'passport_verify') {
    await requestPassportVerification(
      chatId,
      user.id
    );
    return;
  }

  /* ROLE */

  if (action === 'role_teacher') {
    await showRole(
      chatId,
      'teacher'
    );
    return;
  }

  if (action === 'role_student') {
    await showRole(
      chatId,
      'student'
    );
    return;
  }

  if (action === 'role_parent') {
    await showRole(
      chatId,
      'parent'
    );
    return;
  }

  /* TEACHER */

  if (action === 'teacher_independent') {

    await bot.sendMessage(
      chatId,
      [
        '🌐 MUSTAQIL / SHAXSIY KURS',
        '',
        'Siz markazsiz mustaqil ustoz',
        'sifatida ishlashingiz mumkin.',
        '',
        '📚 Kurslar',
        '📋 Guruhlar',
        '👨‍🎓 O‘quvchilar',
        '📅 Darslar',
        '📊 Hisobotlar',
        '',
        'hammasi CHESARA orqali boshqariladi.'
      ].join('\n'),
      teacherMenu
    );

    return;
  }

  if (action === 'teacher_join_center') {

    await bot.sendMessage(
      chatId,
      [
        '🏢 MARKAZGA QO‘SHILISH',
        '',
        '⚠️ Muhim:',
        'Ustoz markaz qidirmaydi.',
        '',
        'Markaz direktori ustozni',
        'CHESARA ID orqali topib,',
        'markaziga qo‘shadi.',
        '',
        'Sizning CHESARA ID:',
        `CH-${user.id}`,
        '',
        'Direktorga shu IDni berishingiz mumkin.'
      ].join('\n'),
      teacherMenu
    );

    return;
  }
}

/* =========================================================
   MESSAGE LISTENER
========================================================= */

bot.on(
  'message',
  async msg => {

    try {

      if (msg.text) {
        await handleText(msg);
      }

    } catch (error) {

      console.error(
        '❌ Telegram message xatosi:',
        error.message
      );

    }
  }
);

/* =========================================================
   CALLBACK LISTENER
========================================================= */

bot.on(
  'callback_query',
  async query => {

    try {

      await handleCallback(query);

    } catch (error) {

      console.error(
        '❌ Telegram callback xatosi:',
        error.message
      );

    }
  }
);

/* =========================================================
   POLLING ERROR
========================================================= */

bot.on(
  'polling_error',
  error => {
    console.error(
      '❌ Telegram polling xatosi:',
      error.message
    );
  }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  bot,
  SUPER_ADMIN,

  mainMenu,
  superAdminMenu,
  teacherMenu,
  studentMenu,
  parentMenu,

  roleMenu,
  teacherTypeMenu,
  passportMenu,

  isSuperAdmin,
  showStart,
  showSuperAdmin,
  showRole,

  handleText,
  handleCallback
};

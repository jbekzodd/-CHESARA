'use strict';

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN topilmadi!');
  module.exports = null;
  return;
}

/*
============================================================
 CHESARA TELEGRAM BOT
============================================================

MUHIM:
Bot polling qilmaydi.

Telegram webhook server.js orqali boshqariladi.
Shuning uchun bu faylda polling = true ishlatilmaydi.
*/

const bot = new TelegramBot(token, {
  polling: false
});

console.log('🤖 CHESARA Telegram bot moduli tayyor.');

/*
============================================================
 SUPER ADMIN
============================================================
*/

const SUPER_ADMIN = {
  telegramId: 1148401454,
  username: 'jovliyev_bekzod'
};

/*
============================================================
 UMUMIY MENYU
============================================================
*/

const mainMenu = {
  reply_markup: {
    keyboard: [
      ['👨‍🏫 Ustoz kabineti'],
      ['👨‍🎓 O‘quvchi kabineti'],
      ['📅 Davomat', '📊 Hisobotlar'],
      ['🧠 O‘yin tahlili', '🏆 Turnirlar'],
      ['📰 Yangiliklar', '🔔 Ogohlantirishlar'],
      ['⚙️ Profil'],
      ['🔄 Rolni o‘zgartirish']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/*
============================================================
 SUPER ADMIN MENYU
============================================================
*/

const superAdminMenu = {
  reply_markup: {
    keyboard: [
      ['👑 Super Admin'],
      ['👥 Foydalanuvchilar'],
      ['🏢 Markazlar'],
      ['📚 Kurslar'],
      ['📋 Guruhlar'],
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

/*
============================================================
 USTOZ MENYU
============================================================
*/

const teacherMenu = {
  reply_markup: {
    keyboard: [
      ['👨‍🎓 O‘quvchilar'],
      ['📚 Darslar'],
      ['📅 Davomat'],
      ['📊 Hisobotlar'],
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

/*
============================================================
 O‘QUVCHI MENYU
============================================================
*/

const studentMenu = {
  reply_markup: {
    keyboard: [
      ['📚 Darslarim'],
      ['📅 Davomatim'],
      ['🧠 O‘yin tahlili'],
      ['🏆 Turnirlar'],
      ['📈 Rivojlanishim'],
      ['⚙️ Profil'],
      ['🔄 Rolni o‘zgartirish'],
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/*
============================================================
 OTA-ONA MENYU
============================================================
*/

const parentMenu = {
  reply_markup: {
    keyboard: [
      ['👨‍👩‍👧 Farzandlarim'],
      ['📊 Natijalar'],
      ['📅 Davomat'],
      ['🔔 Ogohlantirishlar'],
      ['⚙️ Profil'],
      ['🔄 Rolni o‘zgartirish'],
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

/*
============================================================
 ORQAGA
============================================================
*/

const backMenu = {
  reply_markup: {
    keyboard: [
      ['🏠 Bosh menyu']
    ],
    resize_keyboard: true
  }
};

/*
============================================================
 ROL TANLASH
============================================================
*/

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

/*
============================================================
 USTOZ FAOLIYAT TURI
============================================================
*/

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

/*
============================================================
 SUPER ADMINNI ANIQLASH
============================================================
*/

function isSuperAdmin(user) {
  if (!user) {
    return false;
  }

  const id =
    Number(user.id || user.telegramId);

  const username =
    String(
      user.username || ''
    )
      .replace('@', '')
      .toLowerCase();

  return (
    id === SUPER_ADMIN.telegramId ||
    username ===
      SUPER_ADMIN.username.toLowerCase()
  );
}

/*
============================================================
 SUPER ADMIN MENYUSI
============================================================
*/

async function showSuperAdmin(chatId) {
  await bot.sendMessage(
    chatId,
    [
      '👑 CHESARA SUPER ADMIN',
      '',
      `ID: ${SUPER_ADMIN.telegramId}`,
      `Username: @${SUPER_ADMIN.username}`,
      '',
      'Sizda CHESARA tizimining',
      'to‘liq boshqaruv huquqi mavjud.',
      '',
      'Siz quyidagilarni boshqarishingiz mumkin:',
      '',
      '👥 Foydalanuvchilar',
      '🏢 Markazlar',
      '📚 Kurslar',
      '📋 Guruhlar',
      '🧩 Menyular',
      '✏️ Barcha matnlar',
      '📢 Kanal va guruh obunasi',
      '⚙️ Tizim sozlamalari'
    ].join('\n'),
    superAdminMenu
  );
}

/*
============================================================
 START MATNI
============================================================
*/

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

/*
============================================================
 ROL MATNLARI
============================================================
*/

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
    '📊 Hisobotlar',
    '🧠 O‘yin tahlili',
    '',
    'bilan ishlashingiz mumkin.',
    '',
    'Siz mavjud markazga qo‘shilishingiz',
    'yoki mustaqil / shaxsiy kurs',
    'sifatida ishlashingiz mumkin.'
  ].join('\n'),

  student: [
    '👨‍🎓 O‘QUVCHI',
    '',
    'O‘quvchi kabinetiga xush kelibsiz.',
    '',
    'Siz:',
    '📚 Darslaringiz',
    '📅 Davomatingiz',
    '🧠 O‘yin tahlili',
    '🏆 Turnirlar',
    '📈 Rivojlanishingiz',
    '',
    'bo‘yicha ma’lumot olishingiz mumkin.'
  ].join('\n'),

  parent: [
    '👨‍👩‍👧 OTA-ONA',
    '',
    'Ota-ona kabinetiga xush kelibsiz.',
    '',
    'Bu yerda farzandingizning:',
    '📚 Darslari',
    '📅 Davomati',
    '📊 Natijalari',
    '📈 Rivojlanishi',
    '',
    'ko‘rsatiladi.'
  ].join('\n')
};

/*
============================================================
 ROL TANLANGANDA
============================================================
*/

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
        '🏢 Mavjud o‘quv markaziga qo‘shilishingiz mumkin.',
        '',
        '🌐 Yoki hech qanday markazsiz',
        'mustaqil / shaxsiy kurs sifatida',
        'dars berishingiz mumkin.'
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

    return;
  }
}

/*
============================================================
 ODDIY BO‘LIMLAR
============================================================
*/

async function sendTeacherCabinet(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '👨‍🏫 USTOZ KABINETI',
      '',
      'Bu bo‘lim orqali ustoz:',
      '',
      '👥 Guruhlarini ko‘radi',
      '📅 Dars jadvalini boshqaradi',
      '✅ Davomat qiladi',
      '📊 O‘quvchilar natijasini ko‘radi',
      '💰 To‘lovlarni nazorat qiladi',
      '🧠 O‘yinlarni tahlil qiladi',
      '📈 Hisobot oladi',
      '',
      '⏰ Dars boshlanganidan 15 daqiqa',
      'ichida davomat qilinmasa,',
      'CHESARA avtomatik ogohlantiradi.'
    ].join('\n'),
    teacherMenu
  );
}

async function sendStudentCabinet(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '👨‍🎓 O‘QUVCHI KABINETI',
      '',
      'O‘quvchi:',
      '',
      '📅 Davomatini',
      '📚 Guruhini',
      '🧠 O‘yinlarini',
      '📈 Rivojlanishini',
      '🏆 Turnirlarini',
      '',
      'ko‘rishi mumkin.'
    ].join('\n'),
    studentMenu
  );
}

async function sendAttendance(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '📅 DAVOMAT',
      '',
      'Bugungi dars:',
      '',
      '✅ Keldi',
      '❌ Kelmagan',
      '⏰ Kechikdi',
      '',
      'Ustoz davomatni belgilaydi.',
      '',
      '⚠️ Davomat 15 daqiqa ichida',
      'qilinmasa direktor ogohlantiriladi.'
    ].join('\n'),
    backMenu
  );
}

async function sendReports(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '📊 HISOBOTLAR',
      '',
      'CHESARA:',
      '',
      '📅 Kunlik',
      '📆 Haftalik',
      '🗓️ Oylik',
      '',
      'hisobotlarni tayyorlaydi.',
      '',
      'Hisobotda:',
      '✅ Davomat',
      '📚 Darslar',
      '🧠 O‘yinlar',
      '📈 Rivojlanish',
      '🏆 Turnirlar'
    ].join('\n'),
    backMenu
  );
}

async function sendAnalysis(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '🧠 AI O‘YIN TAHLILI',
      '',
      'CHESARA o‘quvchi o‘yinlarini:',
      '',
      '♟️ Lichess',
      '♟️ Chess.com',
      '📸 Screenshot',
      '',
      'orqali tahlil qilish tizimini qo‘llab-quvvatlaydi.',
      '',
      'Tahlilda:',
      '❓ Blunder',
      '❗ Xato',
      '‼️ Kuchli yurish',
      '⭐ Juda kuchli yurish',
      '🎯 Eng yaxshi yurish',
      '',
      'aniqlanadi.'
    ].join('\n'),
    backMenu
  );
}

async function sendTournaments(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '🏆 TURNIRLAR',
      '',
      'CHESARA:',
      '',
      '🏆 Turnirlarni kuzatadi',
      '📅 Sanalarni ko‘rsatadi',
      '🥇 G‘oliblarni chiqaradi',
      '📊 Natijalarni jamlaydi',
      '📈 O‘quvchi natijasini kuzatadi.'
    ].join('\n'),
    backMenu
  );
}

async function sendNews(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '📰 CHESARA YANGILIKLARI',
      '',
      'Bu bo‘limda:',
      '',
      '🏆 Turnirlar',
      '🥇 G‘oliblar',
      '📊 Natijalar',
      '🎥 Strimlar',
      '♟️ Shaxmat yangiliklari'
    ].join('\n'),
    backMenu
  );
}

async function sendNotifications(chatId) {

  await bot.sendMessage(
    chatId,
    [
      '🔔 OGOHLANTIRISHLAR',
      '',
      'CHESARA avtomatik nazorat qiladi:',
      '',
      '⏰ Davomat qilinmagan',
      '👨‍🎓 O‘quvchi kelmagan',
      '📅 Dars o‘tkazilmagan',
      '💰 To‘lov kechikkan',
      '📈 Faollik pasaygan',
      '',
      'Muhim holatda tegishli ustoz',
      'yoki direktorga xabar yuboriladi.'
    ].join('\n'),
    backMenu
  );
}

/*
============================================================
 SUPER ADMIN BO‘LIMLARI
============================================================
*/

async function adminSection(chatId, title, body) {

  await bot.sendMessage(
    chatId,
    [
      title,
      '',
      body,
      '',
      '🔧 Bu modul Super Admin uchun',
      'keyingi bosqichlarda to‘liq funksional qilinadi.'
    ].join('\n'),
    superAdminMenu
  );
}

/*
============================================================
 TEXT HANDLER
============================================================
*/

async function handleText(msg) {

  if (!msg || !msg.text) {
    return;
  }

  const chatId =
    msg.chat.id;

  const text =
    msg.text.trim();

  const user =
    msg.from || {};

  /*
  /start
  */

  if (
    text === '/start'
  ) {
    await showStart(
      chatId,
      user.first_name ||
        'shaxmatchi',
      user
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
      isSuperAdmin(user)
    ) {
      await showSuperAdmin(
        chatId
      );
    } else {
      await bot.sendMessage(
        chatId,
        '❌ Sizda Super Admin huquqi yo‘q.',
        backMenu
      );
    }

    return;
  }

  /*
  /rol
  */

  if (
    text === '/rol' ||
    text === '🔄 Rolni o‘zgartirish'
  ) {

    if (
      isSuperAdmin(user)
    ) {

      await bot.sendMessage(
        chatId,
        [
          '👑 SUPER ADMIN',
          '',
          'Siz tizimning barcha qismlarini',
          'boshqarishingiz mumkin.',
          '',
          'Oddiy rol tanlash kerak bo‘lsa:'
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

  /*
  SUPER ADMIN MENYU
  */

  if (
    isSuperAdmin(user)
  ) {

    if (
      text === '👑 Super Admin'
    ) {
      await showSuperAdmin(chatId);
      return;
    }

    if (
      text === '👥 Foydalanuvchilar'
    ) {
      await adminSection(
        chatId,
        '👥 FOYDALANUVCHILAR',
        'Barcha foydalanuvchilarni boshqarish paneli.'
      );
      return;
    }

    if (
      text === '🏢 Markazlar'
    ) {
      await adminSection(
        chatId,
        '🏢 MARKAZLAR',
        'O‘quv markazlarini yaratish, tasdiqlash va boshqarish.'
      );
      return;
    }

    if (
      text === '📚 Kurslar'
    ) {
      await adminSection(
        chatId,
        '📚 KURSLAR',
        'Kurslar va metodikalarni boshqarish.'
      );
      return;
    }

    if (
      text === '📋 Guruhlar'
    ) {
      await adminSection(
        chatId,
        '📋 GURUHLAR',
        'Guruhlar va ularning ustoz/o‘quvchilarini boshqarish.'
      );
      return;
    }

    if (
      text === '🧩 Menyular'
    ) {
      await adminSection(
        chatId,
        '🧩 MENYULAR',
        'Telegram va sayt menyularini boshqarish.'
      );
      return;
    }

    if (
      text === '✏️ Matnlar'
    ) {
      await adminSection(
        chatId,
        '✏️ MATNLAR',
        'Barcha menyu va tugmalardagi matnlarni boshqarish.'
      );
      return;
    }

    if (
      text === '📢 Kanal / Obuna'
    ) {
      await adminSection(
        chatId,
        '📢 KANAL / OBUNA',
        'Kanal, guruh va obuna talablarini boshqarish.'
      );
      return;
    }

    if (
      text === '⚙️ Tizim sozlamalari'
    ) {
      await adminSection(
        chatId,
        '⚙️ TIZIM SOZLAMALARI',
        'CHESARA tizimining barcha umumiy sozlamalari.'
      );
      return;
    }
  }

  /*
  ODDIY MENYU
  */

  if (
    text === '🏠 Bosh menyu'
  ) {

    await showStart(
      chatId,
      user.first_name ||
        'shaxmatchi',
      user
    );

    return;
  }

  if (
    text === '👨‍🏫 Ustoz kabineti'
  ) {
    await sendTeacherCabinet(
      chatId
    );
    return;
  }

  if (
    text === '👨‍🎓 O‘quvchi kabineti'
  ) {
    await sendStudentCabinet(
      chatId
    );
    return;
  }

  if (
    text === '📅 Davomat'
  ) {
    await sendAttendance(
      chatId
    );
    return;
  }

  if (
    text === '📊 Hisobotlar'
  ) {
    await sendReports(
      chatId
    );
    return;
  }

  if (
    text === '🧠 O‘yin tahlili'
  ) {
    await sendAnalysis(
      chatId
    );
    return;
  }

  if (
    text === '🏆 Turnirlar'
  ) {
    await sendTournaments(
      chatId
    );
    return;
  }

  if (
    text === '📰 Yangiliklar'
  ) {
    await sendNews(
      chatId
    );
    return;
  }

  if (
    text === '🔔 Ogohlantirishlar'
  ) {
    await sendNotifications(
      chatId
    );
    return;
  }

  /*
  USTOZ
  */

  if (
    text === '👨‍🎓 O‘quvchilar'
  ) {
    await bot.sendMessage(
      chatId,
      [
        '👨‍🎓 O‘QUVCHILAR',
        '',
        'Ustozning o‘quvchilari shu yerda ko‘rsatiladi.',
        '',
        '🔧 To‘liq CRM moduli keyingi bosqichda ulanadi.'
      ].join('\n'),
      teacherMenu
    );

    return;
  }

  if (
    text === '📚 Darslar'
  ) {
    await bot.sendMessage(
      chatId,
      [
        '📚 DARSLAR',
        '',
        'Ustozning dars jadvali shu yerda boshqariladi.'
      ].join('\n'),
      teacherMenu
    );

    return;
  }

  if (
    text === '🏢 Markaz / Shaxsiy kurs'
  ) {

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

  if (
    text === '🧩 Tizim qurish'
  ) {

    await bot.sendMessage(
      chatId,
      [
        '🧩 TIZIM QURISH',
        '',
        'Ustoz quyidagilarni yaratishi mumkin:',
        '',
        '🏢 Markaz',
        '📚 Kurs',
        '📋 Guruh',
        '👨‍🎓 O‘quvchi',
        '📅 Dars',
        '',
        'Bu modul keyingi bosqichlarda kengaytiriladi.'
      ].join('\n'),
      teacherMenu
    );

    return;
  }

  if (
    text === '📈 Rivojlanishim'
  ) {

    await bot.sendMessage(
      chatId,
      [
        '📈 RIVOJLANISHIM',
        '',
        'O‘quvchining:',
        '',
        '♟️ Reytingi',
        '🧠 Tahlillari',
        '🎯 Kuchli tomonlari',
        '⚠️ Zaif tomonlari',
        '📚 O‘qilgan mavzular',
        '',
        'shu yerda ko‘rsatiladi.'
      ].join('\n'),
      studentMenu
    );

    return;
  }

  /*
  PROFIL
  */

  if (
    text === '⚙️ Profil'
  ) {

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
        `Ism: ${
          user.first_name || '-'
        }`
      ].join('\n'),
      backMenu
    );

    return;
  }

  /*
  FALLBACK
  */

  await bot.sendMessage(
    chatId,
    [
      '♟️ CHESARA',
      '',
      'Iltimos, menyudan kerakli bo‘limni tanlang.',
      '',
      'Rolni almashtirish:',
      '/rol'
    ].join('\n'),
    isSuperAdmin(user)
      ? superAdminMenu
      : mainMenu
  );
}

/*
============================================================
 CALLBACK HANDLER
============================================================
*/

async function handleCallback(query) {

  const chatId =
    query.message?.chat?.id;

  const action =
    query.data;

  const user =
    query.from || {};

  if (!chatId) {
    return;
  }

  await bot
    .answerCallbackQuery(
      query.id
    )
    .catch(() => {});

  /*
  SUPER ADMIN
  */

  if (
    action === 'home'
  ) {
    await showStart(
      chatId,
      user.first_name ||
        'shaxmatchi',
      user
    );

    return;
  }

  /*
  ROL
  */

  if (
    action === 'role_teacher'
  ) {

    await showRole(
      chatId,
      'teacher'
    );

    return;
  }

  if (
    action === 'role_student'
  ) {

    await showRole(
      chatId,
      'student'
    );

    return;
  }

  if (
    action === 'role_parent'
  ) {

    await showRole(
      chatId,
      'parent'
    );

    return;
  }

  /*
  USTOZ TURI
  */

  if (
    action === 'teacher_independent'
  ) {

    await bot.sendMessage(
      chatId,
      [
        '🌐 MUSTAQIL / SHAXSIY KURS',
        '',
        'Siz markazsiz, mustaqil ustoz',
        'sifatida ishlashingiz mumkin.',
        '',
        'Sizning shaxsiy:',
        '📚 Kursingiz',
        '📋 Guruhlaringiz',
        '👨‍🎓 O‘quvchilaringiz',
        '📅 Darslaringiz',
        '📊 Hisobotlaringiz',
        '',
        'CHESARA orqali boshqariladi.'
      ].join('\n'),
      teacherMenu
    );

    return;
  }

  if (
    action === 'teacher_join_center'
  ) {

    await bot.sendMessage(
      chatId,
      [
        '🏢 MARKAZGA QO‘SHILISH',
        '',
        'Mavjud CHESARA markazlari shu yerda chiqadi.',
        '',
        '🔧 Markazlar bazasi keyingi modulda ulanadi.'
      ].join('\n'),
      teacherMenu
    );

    return;
  }
}

/*
============================================================
 TELEGRAM MESSAGE LISTENER
============================================================
*/

bot.on(
  'message',
  async msg => {

    try {

      /*
      Callback emas, oddiy xabar.
      */

      if (
        msg.text
      ) {
        await handleText(
          msg
        );
      }

    } catch (error) {

      console.error(
        '❌ Telegram message xatosi:',
        error.message
      );

    }
  }
);

/*
============================================================
 CALLBACK LISTENER
============================================================
*/

bot.on(
  'callback_query',
  async query => {

    try {

      await handleCallback(
        query
      );

    } catch (error) {

      console.error(
        '❌ Telegram callback xatosi:',
        error.message
      );

    }
  }
);

/*
============================================================
 POLLING ERROR
============================================================
*/

bot.on(
  'polling_error',
  error => {

    console.error(
      '❌ Telegram polling xatosi:',
      error.message
    );

  }
);

/*
============================================================
 EXPORT
============================================================
*/

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
  isSuperAdmin,
  showStart,
  showSuperAdmin,
  showRole,
  handleText,
  handleCallback
};

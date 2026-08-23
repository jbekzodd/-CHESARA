```javascript
'use strict';

const express = require('express');
const path = require('path');
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

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// ======================================================
// TELEGRAM
// ======================================================

const botToken =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.BOT_TOKEN;

const publicUrl =
  process.env.PUBLIC_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  'https://chesara.onrender.com';

let bot = null;

if (botToken) {
  try {
    bot = new TelegramBot(botToken);

    console.log('🤖 Telegram token topildi.');
    console.log('⏸️ Telegram polling o‘chirilgan. Webhook ishlatiladi.');

    // --------------------------------------------------
    // ASOSIY MENYU
    // --------------------------------------------------

    function getMainMenu() {
      return {
        reply_markup: {
          keyboard: [
            [
              { text: '👨‍🏫 Ustoz' },
              { text: '♟️ O‘quvchi' }
            ],
            [
              { text: '👨‍👩‍👦 Ota-ona' },
              { text: '🏢 Markaz' }
            ],
            [
              { text: '🏆 Turnirlar' },
              { text: '📚 Darslar' }
            ],
            [
              { text: '📊 Hisobotlar' },
              { text: '⚙️ Profil' }
            ]
          ],
          resize_keyboard: true,
          is_persistent: true
        }
      };
    }

    // --------------------------------------------------
    // TELEGRAM WEBHOOK
    // --------------------------------------------------

    const webhookUrl = `${publicUrl}/telegram/webhook`;

    bot.setWebHook(webhookUrl)
      .then(() => {
        console.log(`🔗 Telegram webhook ulandi: ${webhookUrl}`);
      })
      .catch((error) => {
        console.error(
          '⚠️ Webhook ulanish xatosi:',
          error.message
        );
      });

    // --------------------------------------------------
    // START / YANGI KIRISH
    // --------------------------------------------------

    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const firstName =
        msg.from?.first_name || 'Foydalanuvchi';

      await bot.sendMessage(
        chatId,
        `Assalomu alaykum, ${firstName}! ♟️\n\n` +
        `CHESARA platformasiga xush kelibsiz.\n\n` +
        `Kerakli bo‘limni pastdagi menyudan tanlang.`,
        getMainMenu()
      );
    });

    // --------------------------------------------------
    // MENYU TUGMALARI
    // --------------------------------------------------

    bot.on('message', async (msg) => {
      if (!msg.text) return;

      const chatId = msg.chat.id;
      const text = msg.text;

      // /start alohida ishlaydi
      if (text === '/start') return;

      if (text === '👨‍🏫 Ustoz') {
        return bot.sendMessage(
          chatId,
          `👨‍🏫 USTOZ BO‘LIMI\n\n` +
          `Bu bo‘lim orqali:\n` +
          `• O‘quvchilar\n` +
          `• Davomat\n` +
          `• Darslar\n` +
          `• Vazifalar\n` +
          `• Tahlillar\n` +
          `• Hisobotlar\n` +
          `• O‘quvchi rivojlanishi\n` +
          `• Dars materiallari\n` +
          `boshqariladi.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '👥 O‘quvchilar', callback_data: 'teacher_students' }
                ],
                [
                  { text: '📚 Darslar', callback_data: 'teacher_lessons' },
                  { text: '✅ Davomat', callback_data: 'teacher_attendance' }
                ],
                [
                  { text: '📝 Vazifalar', callback_data: 'teacher_tasks' },
                  { text: '📊 Tahlil', callback_data: 'teacher_analysis' }
                ],
                [
                  { text: '📈 Hisobotlar', callback_data: 'teacher_reports' }
                ],
                [
                  { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
                ]
              ]
            }
          }
        );
      }

      if (text === '♟️ O‘quvchi') {
        return bot.sendMessage(
          chatId,
          `♟️ O‘QUVCHI BO‘LIMI\n\n` +
          `Bu yerda siz:\n` +
          `• Vazifalar\n` +
          `• Shaxsiy tahlil\n` +
          `• Chessara bilan mashg‘ulot\n` +
          `• Darslar\n` +
          `• Turnirlar\n` +
          `• Sportchi pasporti\n` +
          `• Rivojlanish natijalarini\n` +
          `ko‘rishingiz mumkin.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📝 Vazifalar', callback_data: 'student_tasks' },
                  { text: '📊 Tahlil', callback_data: 'student_analysis' }
                ],
                [
                  { text: '♟️ Chessara bilan o‘ynash', callback_data: 'play_chessara' }
                ],
                [
                  { text: '🏆 Turnirlar', callback_data: 'student_tournaments' },
                  { text: '🪪 Sportchi pasporti', callback_data: 'sport_passport' }
                ],
                [
                  { text: '📚 Darslar', callback_data: 'student_lessons' }
                ],
                [
                  { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
                ]
              ]
            }
          }
        );
      }

      if (text === '👨‍👩‍👦 Ota-ona') {
        return bot.sendMessage(
          chatId,
          `👨‍👩‍👦 OTA-ONA BO‘LIMI\n\n` +
          `Farzandingizning:\n` +
          `• Davomati\n` +
          `• Vazifalari\n` +
          `• Rivojlanishi\n` +
          `• Oylik hisoboti\n` +
          `• Turnirlar\n` +
          `• Tavsiya va ogohlantirishlarini\n` +
          `kuzatishingiz mumkin.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '👦 Farzandim', callback_data: 'parent_student' }
                ],
                [
                  { text: '📊 Rivojlanish', callback_data: 'parent_progress' },
                  { text: '📋 Hisobot', callback_data: 'parent_report' }
                ],
                [
                  { text: '🏆 Turnirlar', callback_data: 'parent_tournaments' }
                ],
                [
                  { text: '🔔 Xabarlar', callback_data: 'parent_notifications' }
                ],
                [
                  { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
                ]
              ]
            }
          }
        );
      }

      if (text === '🏢 Markaz') {
        return bot.sendMessage(
          chatId,
          `🏢 MARKAZ BO‘LIMI\n\n` +
          `Markaz rahbari bu yerdan:\n` +
          `• Ustozlarni\n` +
          `• O‘quvchilarni\n` +
          `• Guruhlarni\n` +
          `• Darslarni\n` +
          `• To‘lovlarni\n` +
          `• Markaz hisobotlarini\n` +
          `• Ota-onalarga xabarlarni\n` +
          `• O‘z metodikasini\n` +
          `boshqarishi mumkin.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '👨‍🏫 Ustozlar', callback_data: 'center_teachers' },
                  { text: '👥 O‘quvchilar', callback_data: 'center_students' }
                ],
                [
                  { text: '👨‍👩‍👦 Ota-onalar', callback_data: 'center_parents' }
                ],
                [
                  { text: '📊 Markaz hisoboti', callback_data: 'center_reports' }
                ],
                [
                  { text: '💰 To‘lovlar', callback_data: 'center_payments' }
                ],
                [
                  { text: '📢 Xabar yuborish', callback_data: 'center_message' }
                ],
                [
                  { text: '📚 Tizim / Metodika', callback_data: 'center_methodology' }
                ],
                [
                  { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
                ]
              ]
            }
          }
        );
      }

      if (text === '🏆 Turnirlar') {
        return bot.sendMessage(
          chatId,
          `🏆 TURNIRLAR\n\n` +
          `Yaqin turnirlarni ko‘rish, ` +
          `musobaqa ma’lumotlarini kuzatish va ` +
          `o‘quvchi uchun mos turnirlarni tanlash mumkin.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📍 Yaqin turnirlar', callback_data: 'near_tournaments' }
                ],
                [
                  { text: '🏆 Barcha turnirlar', callback_data: 'all_tournaments' }
                ],
                [
                  { text: '🧠 Turnirga tayyorgarlik', callback_data: 'tournament_prep' }
                ],
                [
                  { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
                ]
              ]
            }
          }
        );
      }

      if (text === '📚 Darslar') {
        const lessons = getLessons();

        if (!lessons || lessons.length === 0) {
          return bot.sendMessage(
            chatId,
            '📭 Hozircha rejalashtirilgan darslar mavjud emas.'
          );
        }

        let message = '📚 REJALASHTIRILGAN DARSLAR\n\n';

        lessons.forEach((lesson, index) => {
          message +=
            `${index + 1}. ${lesson.title || 'Shaxmat darsi'}\n` +
            `👥 Guruh: ${lesson.groupName || '-'}\n` +
            `👨‍🏫 Ustoz: ${lesson.coachName || '-'}\n` +
            `🕒 Vaqt: ${lesson.startTime || lesson.date || '-'}\n` +
            `📊 Holat: ${lesson.status || '-'}\n\n`;
        });

        return bot.sendMessage(chatId, message);
      }

      if (text === '📊 Hisobotlar') {
        return bot.sendMessage(
          chatId,
          `📊 HISOBOTLAR\n\n` +
          `Bu bo‘limda foydalanuvchi roliga qarab ` +
          `oylik va rivojlanish hisobotlari ko‘rsatiladi.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📅 Oylik hisobot', callback_data: 'monthly_report' }
                ],
                [
                  { text: '📈 Rivojlanish', callback_data: 'progress_report' }
                ],
                [
                  { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
                ]
              ]
            }
          }
        );
      }

      if (text === '⚙️ Profil') {
        return bot.sendMessage(
          chatId,
          `⚙️ PROFIL\n\n` +
          `Bu yerda foydalanuvchining roli, ` +
          `markazi, ustoz/shogird bog‘lanishi va ` +
          `sportchi ma’lumotlari boshqariladi.`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🪪 Sportchi pasporti', callback_data: 'sport_passport' }
                ],
                [
                  { text: '🔐 Rolim', callback_data: 'my_role' }
                ],
                [
                  { text: '🔗 Bog‘lanishlar', callback_data: 'my_connections' }
                ],
                [
                  { text: '⬅️ Asosiy menyu', callback_data: 'main_menu' }
                ]
              ]
            }
          }
        );
      }
    });

    // --------------------------------------------------
    // INLINE TUGMALAR
    // --------------------------------------------------

    bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat?.id;
      const data = query.data;

      if (!chatId) return;

      await bot.answerCallbackQuery(query.id);

      if (data === 'main_menu') {
        return bot.sendMessage(
          chatId,
          '🏠 Asosiy menyu',
          getMainMenu()
        );
      }

      const messages = {
        teacher_students: '👥 Bu yerda ustozning shogirdlari va ularning rivojlanishi ko‘rsatiladi.',
        teacher_lessons: '📚 Ustozning darslari shu bo‘limda boshqariladi.',
        teacher_attendance: '✅ Davomat shu yerda belgilanadi.',
        teacher_tasks: '📝 Vazifalar shu yerda beriladi va tekshiriladi.',
        teacher_analysis: '📊 O‘quvchilarning shaxmat tahlillari shu yerda ko‘rsatiladi.',
        teacher_reports: '📈 Ustoz uchun oylik va o‘quvchi rivojlanish hisobotlari.',
        student_tasks: '📝 Bugungi va rejalashtirilgan vazifalar.',
        student_analysis: '📊 Shaxsiy shaxmat rivojlanish tahlili.',
        play_chessara: '♟️ Chessara bilan o‘ynash moduli tayyorlanmoqda.',
        student_tournaments: '🏆 Sizga mos turnirlar.',
        sport_passport: '🪪 Sportchi pasporti FIDE ID orqali bog‘lanadi.',
        student_lessons: '📚 Sizning darslaringiz.',
        parent_student: '👦 Farzandingiz profili.',
        parent_progress: '📈 Farzandingizning rivojlanish ko‘rsatkichlari.',
        parent_report: '📋 Ota-ona uchun oylik hisobot.',
        parent_tournaments: '🏆 Farzandingizga mos turnirlar.',
        parent_notifications: '🔔 Farzandingiz haqidagi muhim xabarlar.',
        center_teachers: '👨‍🏫 Markaz ustozlari.',
        center_students: '👥 Markaz o‘quvchilari.',
        center_parents: '👨‍👩‍👦 Ota-onalar.',
        center_reports: '📊 Markazning oylik hisoboti.',
        center_payments: '💰 Markaz to‘lovlari.',
        center_message: '📢 Markaz admini o‘quvchi yoki ota-onalarga xabar yuborishi mumkin.',
        center_methodology: '📚 Markazning o‘z tizimi va metodikasi.',
        near_tournaments: '📍 Joylashuvingizga yaqin turnirlar.',
        all_tournaments: '🏆 Barcha mavjud turnirlar.',
        tournament_prep: '🧠 Raqib va turnirga tayyorgarlik.',
        monthly_report: '📅 Oylik hisobot.',
        progress_report: '📈 Rivojlanish hisoboti.',
        my_role: '🔐 Profilingizdagi rol.',
        my_connections: '🔗 Ustoz, o‘quvchi, ota-ona yoki markaz bilan bog‘lanishlar.'
      };

      if (messages[data]) {
        return bot.sendMessage(chatId, messages[data]);
      }

      return bot.sendMessage(
        chatId,
        'Bu bo‘lim keyingi bosqichda ulanadi.'
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
// TELEGRAM WEBHOOK ENDPOINT
// ======================================================

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
    telegramMode: 'webhook',
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
      telegramMode: 'webhook',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard xatosi:', error);

    res.status(500).json({
      success: false,
      message: 'Dashboard ma’lumotlarini olishda xatolik.'
    });
  }
});

// ======================================================
// DARSLAR
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
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Darslarni olishda xatolik.'
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
    console.error(error);

    res.status(500).json({
      success: false,
      message: 'Darsni olishda xatolik.'
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
      message: 'Dars muvaffaqiyatli yaratildi.',
      lesson
    });
  } catch (error) {
    console.error(
      'Dars yaratish xatosi:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Dars yaratishda xatolik.'
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
      message: 'Davomat muvaffaqiyatli qayd qilindi.',
      result
    });
  } catch (error) {
    console.error(
      'Davomat xatosi:',
      error
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
        message: 'Dars yakunlandi.',
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
      "CHESARA: so‘ralgan manzil topilmadi."
  });
});

// ======================================================
// SERVER
// ======================================================

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
      startScheduler((lesson) => {
        if (
          bot &&
          lesson.directorTelegramId
        ) {
          bot.sendMessage(
            lesson.directorTelegramId,
            `⏰ Eslatma: "${
              lesson.title || 'Shaxmat'
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
// TOZA YOPILISH
// ======================================================

function shutdown(signal) {
  console.log(
    `🛑 ${signal} qabul qilindi. Server yopilmoqda...`
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
```

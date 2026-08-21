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

// ================================
// MIDDLEWARE & STATIK FAYLLAR
// ================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik fayllarni (__dirname va agar mavjud bo'lsa public papkasidan) yuklash
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// TELEGRAM BOT SOZLAMALARI
// ================================

let bot = null;
const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;

if (botToken) {
  try {
    const TelegramBot = require('node-telegram-bot-api');
    bot = new TelegramBot(botToken, { polling: true });

    console.log('🤖 CHESARA Telegram Bot ulandi va tinglashni boshladi.');

    // /start buyrug'i
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const firstName = msg.from.first_name || 'Foydalanuvchi';

      const welcomeText = 
        `Assalomu alaykum, ${firstName}! ♟️\n\n` +
        `CHESARA — Shaxmat klubi boshqaruv tizimi botiga xush kelibsiz.\n\n` +
        `Mavjud buyruqlar:\n` +
        `📌 /lessons — Bugungi darslar ro'yxati\n` +
        `📌 /status — Server va tizim holati\n` +
        `📌 /help — Yordam olish`;

      bot.sendMessage(chatId, welcomeText);
    });

    // /lessons buyrug'i
    bot.onText(/\/lessons/, (msg) => {
      const chatId = msg.chat.id;
      const lessons = getLessons();

      if (!lessons || lessons.length === 0) {
        return bot.sendMessage(chatId, "Hozircha rejalashtirilgan darslar mavjud emas. 📭");
      }

      let text = "📋 **Rejalashtirilgan darslar:**\n\n";
      lessons.forEach((l, index) => {
        text += `${index + 1}. **${l.title || 'Dars'}**\n`;
        text += `   👤 O'quvchi/Guruh: ${l.studentName || l.groupName || '-'}\n`;
        text += `   👨‍🏫 Murabbiy: ${l.teacherName || l.coachName || '-'}\n`;
        text += `   🕒 Vaqt: ${l.startTime || l.date || '-'}\n`;
        text += `   📊 Holat: ${l.status}\n\n`;
      });

      bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });

    // /status buyrug'i
    bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;
      const lessons = getLessons();
      bot.sendMessage(chatId, `✅ CHESARA server faol ishlamoqda.\nJami darslar soni: ${lessons.length} ta.`);
    });

    // /help buyrug'i
    bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, "Savollar yoki yordam uchun platforma administratoriga murojaat qiling.");
    });

    // Polling xatoliklarini ushlash
    bot.on('polling_error', (error) => {
      console.error('⚠️ Telegram Polling xatosi:', error.code || error.message);
    });

  } catch (error) {
    console.error('⚠️ Telegram botni ishga tushirishda xato:', error.message);
  }
} else {
  console.log("⚠️ TELEGRAM_BOT_TOKEN yoki BOT_TOKEN Environment Variables'da topilmadi.");
}

// ================================
// ASOSIY SAYT
// ================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ================================
// HEALTH
// ================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    project: 'CHESARA',
    status: 'online',
    telegramBot: Boolean(bot),
    message: 'CHESARA server ishlayapti ♟️',
    time: new Date().toISOString()
  });
});

// ================================
// API — DASHBOARD
// ================================

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
    console.error('Dashboard xatosi:', error);
    res.status(500).json({
      success: false,
      message: "Dashboard ma'lumotlarini olishda xatolik."
    });
  }
});

// ================================
// API — DARSLAR
// ================================

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

// ================================
// API — BITTA DARS
// ================================

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

// ================================
// API — YANGI DARS
// ================================

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
        message: 'groupName, coachName va startTime kerak.'
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
    console.error('Dars yaratish xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Dars yaratishda xatolik.'
    });
  }
});

// ================================
// API — DAVOMAT
// ================================

app.post('/api/attendance', (req, res) => {
  try {
    const { lessonId, status, note } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'lessonId kerak.'
      });
    }

    const result = markAttendance(lessonId, { status, note });

    res.json({
      success: true,
      message: 'Davomat muvaffaqiyatli qayd qilindi.',
      result
    });
  } catch (error) {
    console.error('Davomat xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Davomatni qayd qilishda xatolik.'
    });
  }
});

// ================================
// API — DARSNI YAKUNLASH
// ================================

app.post('/api/lessons/:id/finish', (req, res) => {
  try {
    const result = finishLesson(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Dars yakunlandi.',
      result
    });
  } catch (error) {
    console.error('Dars yakunlash xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Darsni yakunlashda xatolik.'
    });
  }
});

// ================================
// 404 QAYTA ISHLASH
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "CHESARA: so'ralgan manzil topilmadi."
  });
});

// ================================
// SERVERNI ISHGA TUSHIRISH
// ================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 CHESARA server ${PORT}-portda ishlayapti.`);
  console.log('♟️ CHESARA AI Chess Platform ishga tushdi.');

  try {
    startScheduler((lesson) => {
      // Dars boshlanishidan oldin bot orqali xabar yuborish
      if (bot && lesson.directorTelegramId) {
        bot.sendMessage(
          lesson.directorTelegramId,
          `⏰ Eslatma: "${lesson.title || 'Shaxmat'}" darsi 15 daqiqadan so'ng boshlanadi!`
        ).catch(() => {});
      }
    });
    console.log('⏰ CHESARA dars nazorati ishga tushdi.');
  } catch (error) {
    console.error('⚠️ Scheduler ishga tushmadi:', error.message);
  }
});

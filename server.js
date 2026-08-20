const express = require("express");
const path = require("path");
const cors = require("cors");

const {
  startScheduler,
  getLessons,
  getLesson,
  addLesson,
  markAttendance,
  finishLesson
} = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 10000;

// ================================
// TELEGRAM BOT
// ================================

let bot = null;

try {
  const TelegramBot = require("node-telegram-bot-api");

  if (process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(
      process.env.TELEGRAM_BOT_TOKEN,
      {
        polling: true
      }
    );

    console.log("🤖 CHESARA Telegram Bot ulandi.");
  } else {
    console.log(
      "⚠️ TELEGRAM_BOT_TOKEN Render Environment Variables'da yo'q."
    );
  }
} catch (error) {
  console.log("⚠️ Telegram bot moduli yuklanmadi.");
}

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MUHIM:
// index.html, app.js, style.css va boshqa
// frontend fayllar shu yerdan ishlaydi.
app.use(express.static(__dirname));

// ================================
// ASOSIY SAYT
// ================================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ================================
// HEALTH
// ================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    status: "online",
    telegramBot: Boolean(bot),
    message: "CHESARA server ishlayapti ♟️",
    time: new Date().toISOString()
  });
});

// ================================
// API — DASHBOARD
// ================================

app.get("/api/dashboard", (req, res) => {
  try {
    const lessons = getLessons();

    res.json({
      success: true,
      project: "CHESARA",
      lessonsCount: lessons.length,
      telegramBot: Boolean(bot),
      serverTime: new Date().toISOString()
    });

  } catch (error) {
    console.error("Dashboard xatosi:", error);

    res.status(500).json({
      success: false,
      message: "Dashboard ma'lumotlarini olishda xatolik."
    });
  }
});

// ================================
// API — DARSLAR
// ================================

app.get("/api/lessons", (req, res) => {
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
      message: "Darslarni olishda xatolik."
    });
  }
});

// ================================
// API — BITTA DARS
// ================================

app.get("/api/lessons/:id", (req, res) => {
  try {
    const lesson = getLesson(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Dars topilmadi."
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
      message: "Darsni olishda xatolik."
    });
  }
});

// ================================
// API — YANGI DARS
// ================================

app.post("/api/lessons", (req, res) => {
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
          "groupName, coachName va startTime kerak."
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
      message: "Dars muvaffaqiyatli yaratildi.",
      lesson
    });

  } catch (error) {
    console.error("Dars yaratish xatosi:", error);

    res.status(500).json({
      success: false,
      message: "Dars yaratishda xatolik."
    });
  }
});

// ================================
// API — DAVOMAT
// ================================

app.post("/api/attendance", (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId kerak."
      });
    }

    const result = markAttendance(lessonId);

    res.json({
      success: true,
      message: "Davomat muvaffaqiyatli qayd qilindi.",
      result
    });

  } catch (error) {
    console.error("Davomat xatosi:", error);

    res.status(500).json({
      success: false,
      message: "Davomatni qayd qilishda xatolik."
    });
  }
});

// ================================
// API — DARSNI YAKUNLASH
// ================================

app.post("/api/lessons/:id/finish", (req, res) => {
  try {
    const result = finishLesson(req.params.id);

    res.json({
      success: true,
      message: "Dars yakunlandi.",
      result
    });

  } catch (error) {
    console.error("Dars yakunlash xatosi:", error);

    res.status(500).json({
      success: false,
      message: "Darsni yakunlashda xatolik."
    });
  }
});

// ================================
// 404
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "CHESARA: so'ralgan manzil topilmadi."
  });
});

// ================================
// SERVER
// ================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 CHESARA server ${PORT}-portda ishlayapti.`
  );

  console.log(
    "♟️ CHESARA AI Chess Platform ishga tushdi."
  );

  try {
    startScheduler();
    console.log(
      "⏰ CHESARA dars nazorati ishga tushdi."
    );
  } catch (error) {
    console.error(
      "⚠️ Scheduler ishga tushmadi:",
      error.message
    );
  }
});

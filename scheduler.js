```js
const cron = require("node-cron");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const lessons = new Map();

/*
  Darslar:
  {
    id,
    groupId,
    groupName,
    coachId,
    coachName,
    directorTelegramId,
    startTime,
    durationMinutes,
    attendanceDone,
    warningSent,
    finished,
    createdAt
  }
*/

// ================================
// TELEGRAM XABAR
// ================================

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.log("⚠️ Telegram sozlamalari to‘liq emas.");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML"
        })
      }
    );

    const result = await response.json();

    if (!result.ok) {
      console.error("❌ Telegram xatosi:", result);
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Telegramga xabar yuborishda xato:",
      error.message
    );

    return false;
  }
}

// ================================
// DARS QO‘SHISH
// ================================

function addLesson(data) {
  const id =
    data.id ||
    `lesson_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  const lesson = {
    id,
    groupId: data.groupId || null,
    groupName: data.groupName || "Noma'lum",
    coachId: data.coachId || null,
    coachName: data.coachName || "Noma'lum",
    directorTelegramId: data.directorTelegramId || null,
    startTime: data.startTime || new Date().toISOString(),
    durationMinutes: Number(data.durationMinutes) || 60,

    attendanceDone: false,
    warningSent: false,
    finished: false,

    createdAt: Date.now()
  };

  lessons.set(id, lesson);

  console.log(`📚 Dars yaratildi: ${id}`);

  return lesson;
}

// Eski nom bilan ishlayotgan kodlar uchun
function createLesson(lessonId, data) {
  return addLesson({
    ...data,
    id: lessonId
  });
}

// ================================
// BARCHA DARSLAR
// ================================

function getLessons() {
  return Array.from(lessons.values());
}

// ================================
// BITTA DARS
// ================================

function getLesson(id) {
  return lessons.get(id) || null;
}

// ================================
// DAVOMAT
// ================================

function markAttendance(lessonId) {
  const lesson = lessons.get(lessonId);

  if (!lesson) {
    console.log(`⚠️ Dars topilmadi: ${lessonId}`);
    return false;
  }

  if (lesson.finished) {
    console.log(`⚠️ Dars allaqachon yakunlangan: ${lessonId}`);
    return false;
  }

  lesson.attendanceDone = true;

  console.log(`✅ Davomat qilindi: ${lessonId}`);

  return true;
}

// ================================
// DARSNI YAKUNLASH
// ================================

function finishLesson(lessonId) {
  const lesson = lessons.get(lessonId);

  if (!lesson) {
    console.log(`⚠️ Dars topilmadi: ${lessonId}`);
    return false;
  }

  lesson.finished = true;

  console.log(`🏁 Dars yakunlandi: ${lessonId}`);

  return true;
}

// ================================
// SCHEDULER
// ================================

let schedulerStarted = false;

function startScheduler() {
  if (schedulerStarted) {
    console.log("⏰ Scheduler allaqachon ishga tushgan.");
    return;
  }

  schedulerStarted = true;

  cron.schedule("* * * * *", async () => {
    const now = Date.now();

    for (const [lessonId, lesson] of lessons.entries()) {

      // Yakunlangan darsga tegmaymiz
      if (lesson.finished) continue;

      // Davomat qilingan bo‘lsa ogohlantirmaymiz
      if (lesson.attendanceDone) continue;

      // Oldin ogohlantirilgan bo‘lsa qaytarmaymiz
      if (lesson.warningSent) continue;

      const startTime = new Date(lesson.startTime).getTime();

      if (Number.isNaN(startTime)) continue;

      const elapsedMinutes =
        (now - startTime) / 1000 / 60;

      // Dars boshlanishidan oldin ogohlantirmaymiz
      if (elapsedMinutes < 15) continue;

      lesson.warningSent = true;

      const message =
        `🚨 <b>CHESARA — Davomat ogohlantirishi</b>\n\n` +
        `📚 Guruh: <b>${lesson.groupName}</b>\n` +
        `👨‍🏫 Ustoz: <b>${lesson.coachName}</b>\n\n` +
        `⏰ Dars boshlanganiga 15 daqiqa bo‘ldi.\n` +
        `❌ Davomat hali qayd qilinmagan.\n\n` +
        `🔔 Iltimos, holatni tekshiring.`;

      const chatId =
        lesson.directorTelegramId ||
        process.env.DIRECTOR_CHAT_ID;

      await sendTelegramMessage(
        chatId,
        message
      );

      console.log(
        `🚨 Direktor ogohlantirildi: ${lessonId}`
      );
    }
  });

  console.log(
    "⏰ CHESARA scheduler ishga tushdi."
  );
}

// ================================
// EXPORT
// ================================

module.exports = {
  startScheduler,
  getLessons,
  getLesson,
  addLesson,
  createLesson,
  markAttendance,
  finishLesson,
  sendTelegramMessage,
  lessons
};
```

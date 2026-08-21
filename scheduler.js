```js
const cron = require("node-cron");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const lessons = new Map();

// ========================================
// TELEGRAM XABAR YUBORISH
// ========================================

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN topilmadi.");
    return false;
  }

  if (!chatId) {
    console.log("⚠️ Telegram chat ID topilmadi.");
    return false;
  }

  try {
    const url =
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML"
      })
    });

    const result = await response.json();

    if (!result.ok) {
      console.error("❌ Telegram API xatosi:", result);
      return false;
    }

    console.log("✅ Telegram xabar yuborildi.");

    return true;

  } catch (error) {
    console.error(
      "❌ Telegram xabar xatosi:",
      error.message
    );

    return false;
  }
}

// ========================================
// DARS QO‘SHISH
// ========================================

function addLesson(data = {}) {
  const id =
    data.id ||
    `lesson_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

  const lesson = {
    id,

    groupId: data.groupId || null,
    groupName: data.groupName || "Noma'lum guruh",

    coachId: data.coachId || null,
    coachName: data.coachName || "Noma'lum ustoz",

    directorTelegramId:
      data.directorTelegramId || null,

    startTime:
      data.startTime || new Date().toISOString(),

    durationMinutes:
      Number(data.durationMinutes) || 60,

    attendanceDone: false,
    warningSent: false,
    finished: false,

    createdAt: Date.now()
  };

  lessons.set(id, lesson);

  console.log(`📚 Yangi dars yaratildi: ${id}`);

  return lesson;
}

// ========================================
// ESKI CREATE LESSON FUNKSIYASI
// ========================================

function createLesson(lessonId, data = {}) {
  return addLesson({
    ...data,
    id: lessonId
  });
}

// ========================================
// BARCHA DARSLARNI OLISH
// ========================================

function getLessons() {
  return Array.from(lessons.values());
}

// ========================================
// BITTA DARSNI OLISH
// ========================================

function getLesson(id) {
  return lessons.get(id) || null;
}

// ========================================
// DAVOMATNI BELGILASH
// ========================================

function markAttendance(lessonId) {
  const lesson = lessons.get(lessonId);

  if (!lesson) {
    console.log(`⚠️ Dars topilmadi: ${lessonId}`);
    return false;
  }

  if (lesson.finished) {
    console.log(
      `⚠️ Dars allaqachon yakunlangan: ${lessonId}`
    );

    return false;
  }

  lesson.attendanceDone = true;

  console.log(
    `✅ Davomat belgilandi: ${lessonId}`
  );

  return true;
}

// ========================================
// DARSNI YAKUNLASH
// ========================================

function finishLesson(lessonId) {
  const lesson = lessons.get(lessonId);

  if (!lesson) {
    console.log(`⚠️ Dars topilmadi: ${lessonId}`);
    return false;
  }

  lesson.finished = true;

  console.log(
    `🏁 Dars yakunlandi: ${lessonId}`
  );

  return true;
}

// ========================================
// SCHEDULER
// ========================================

let schedulerStarted = false;

function startScheduler() {
  if (schedulerStarted) {
    console.log(
      "⏰ Scheduler allaqachon ishga tushgan."
    );

    return;
  }

  schedulerStarted = true;

  cron.schedule("* * * * *", async () => {
    const now = Date.now();

    for (const [lessonId, lesson] of lessons.entries()) {

      if (lesson.finished) {
        continue;
      }

      if (lesson.attendanceDone) {
        continue;
      }

      if (lesson.warningSent) {
        continue;
      }

      const startTime =
        new Date(lesson.startTime).getTime();

      if (Number.isNaN(startTime)) {
        continue;
      }

      const elapsedMinutes =
        (now - startTime) / 1000 / 60;

      if (elapsedMinutes < 15) {
        continue;
      }

      lesson.warningSent = true;

      const message =
        `🚨 <b>CHESARA — Davomat ogohlantirishi</b>\n\n` +
        `📚 Guruh: <b>${lesson.groupName}</b>\n` +
        `👨‍🏫 Ustoz: <b>${lesson.coachName}</b>\n\n` +
        `⏰ Dars boshlanganiga 15 daqiqa bo‘ldi.\n` +
        `❌ Davomat hali belgilanmagan.\n\n` +
        `Iltimos, CHESARA tizimini tekshiring.`;

      const chatId =
        lesson.directorTelegramId ||
        process.env.DIRECTOR_CHAT_ID;

      if (chatId) {
        await sendTelegramMessage(
          chatId,
          message
        );
      }
    }
  });

  console.log(
    "⏰ CHESARA Scheduler ishga tushdi."
  );
}

// ========================================
// EXPORT
// ========================================

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

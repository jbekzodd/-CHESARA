const cron = require("node-cron");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Direktor va ustozlar uchun keyinchalik DB orqali almashtiramiz
const DIRECTOR_CHAT_ID = process.env.DIRECTOR_CHAT_ID;

const lessons = new Map();

/*
  Darsni ro‘yxatga olish
  lessonId:
  {
    teacherId,
    groupName,
    startTime,
    attendanceDone
  }
*/
function createLesson(lessonId, data) {
  lessons.set(lessonId, {
    ...data,
    attendanceDone: false,
    warningSent: false,
    createdAt: Date.now()
  });

  console.log(`📚 Dars yaratildi: ${lessonId}`);
}

/*
  Davomat bajarildi
*/
function markAttendance(lessonId) {
  const lesson = lessons.get(lessonId);

  if (!lesson) {
    console.log(`⚠️ Dars topilmadi: ${lessonId}`);
    return false;
  }

  lesson.attendanceDone = true;

  console.log(`✅ Davomat qilindi: ${lessonId}`);

  return true;
}

/*
  Telegram xabar yuborish
*/
async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.log("⚠️ Telegram sozlamalari to‘liq emas.");
    return;
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
    }
  } catch (error) {
    console.error("❌ Telegramga xabar yuborishda xato:", error.message);
  }
}

/*
  Har daqiqada darslarni tekshiramiz.

  Agar dars boshlanganidan 15 daqiqa o'tib,
  davomat qilinmagan bo‘lsa,
  direktorga xabar yuboriladi.
*/
cron.schedule("* * * * *", async () => {
  const now = Date.now();

  for (const [lessonId, lesson] of lessons.entries()) {
    if (lesson.attendanceDone) continue;
    if (lesson.warningSent) continue;

    const elapsedMinutes =
      (now - lesson.createdAt) / 1000 / 60;

    if (elapsedMinutes >= 15) {
      lesson.warningSent = true;

      const message =
        `🚨 <b>CHESARA — Davomat ogohlantirishi</b>\n\n` +
        `📚 Guruh: <b>${lesson.groupName || "Noma'lum"}</b>\n` +
        `👨‍🏫 Ustoz: <b>${lesson.teacherName || "Noma'lum"}</b>\n\n` +
        `⏰ Dars boshlanganiga 15 daqiqa bo‘ldi.\n` +
        `❌ Davomat hali qayd qilinmagan.\n\n` +
        `🔔 Iltimos, holatni tekshiring.`;

      await sendTelegramMessage(
        DIRECTOR_CHAT_ID,
        message
      );

      console.log(
        `🚨 Direktor ogohlantirildi: ${lessonId}`
      );
    }
  }
});

console.log("⏰ CHESARA dars nazorati ishga tushdi.");

module.exports = {
  createLesson,
  markAttendance,
  sendTelegramMessage,
  lessons
};

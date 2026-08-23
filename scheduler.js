// ============================================================
// CHESARA — Attendance Scheduler
// Toza va xavfsiz versiya
// ============================================================

const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------
// DATA
// ------------------------------------------------------------

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "lessons.json");

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]", "utf8");
    }
  } catch (error) {
    console.error(
      "❌ Scheduler data faylini yaratishda xatolik:",
      error.message
    );
  }
}

ensureDataFile();

// ------------------------------------------------------------
// READ
// ------------------------------------------------------------

function readLessons() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");

    if (!raw || !raw.trim()) {
      return [];
    }

    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      console.error("❌ lessons.json array emas.");
      return [];
    }

    return data;
  } catch (error) {
    console.error(
      "❌ lessons.json o'qishda xatolik:",
      error.message
    );

    return [];
  }
}

// ------------------------------------------------------------
// SAVE
// ------------------------------------------------------------

function saveLessons(lessons) {
  ensureDataFile();

  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(lessons, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error(
      "❌ lessons.json saqlashda xatolik:",
      error.message
    );

    return false;
  }
}

// ------------------------------------------------------------
// TIME
// ------------------------------------------------------------

function parseLessonTime(value) {
  if (!value) {
    return null;
  }

  // Date / ISO format
  const dateValue = new Date(value);

  if (!Number.isNaN(dateValue.getTime())) {
    return dateValue.getTime();
  }

  // HH:mm yoki HH:mm:ss
  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  const now = new Date();

  const lessonDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    seconds,
    0
  );

  return lessonDate.getTime();
}

// ------------------------------------------------------------
// GET ALL
// ------------------------------------------------------------

function getLessons() {
  return readLessons();
}

// ------------------------------------------------------------
// GET ONE
// ------------------------------------------------------------

function getLesson(id) {
  const lessons = readLessons();

  return (
    lessons.find(
      lesson => String(lesson.id) === String(id)
    ) || null
  );
}

// ------------------------------------------------------------
// ADD
// ------------------------------------------------------------

function addLesson(data = {}) {
  const lessons = readLessons();

  const lesson = {
    id:
      data.id ||
      `lesson_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    groupId: data.groupId || null,

    groupName: data.groupName || "",

    coachId: data.coachId || null,

    coachName: data.coachName || "",

    coachTelegramId:
      data.coachTelegramId || null,

    directorTelegramId:
      data.directorTelegramId || null,

    startTime: data.startTime || "",

    durationMinutes:
      Number(data.durationMinutes) > 0
        ? Number(data.durationMinutes)
        : 90,

    attendanceTaken: false,

    attendanceAt: null,

    warningSent: false,

    finished: false,

    finishedAt: null,

    createdAt: new Date().toISOString()
  };

  lessons.push(lesson);

  saveLessons(lessons);

  return lesson;
}

// ------------------------------------------------------------
// MARK ATTENDANCE
// ------------------------------------------------------------

function markAttendance(id) {
  const lessons = readLessons();

  const index = lessons.findIndex(
    lesson => String(lesson.id) === String(id)
  );

  if (index === -1) {
    return {
      success: false,
      message: "Dars topilmadi."
    };
  }

  lessons[index].attendanceTaken = true;

  lessons[index].attendanceAt =
    new Date().toISOString();

  lessons[index].warningSent = true;

  saveLessons(lessons);

  return {
    success: true,
    lesson: lessons[index]
  };
}

// ------------------------------------------------------------
// FINISH
// ------------------------------------------------------------

function finishLesson(id) {
  const lessons = readLessons();

  const index = lessons.findIndex(
    lesson => String(lesson.id) === String(id)
  );

  if (index === -1) {
    return null;
  }

  lessons[index].finished = true;

  lessons[index].finishedAt =
    new Date().toISOString();

  saveLessons(lessons);

  return lessons[index];
}

// ------------------------------------------------------------
// CHECK ATTENDANCE
// ------------------------------------------------------------

function checkAttendance(sendWarning) {
  const lessons = readLessons();

  const now = Date.now();

  let changed = false;

  for (const lesson of lessons) {
    if (!lesson) {
      continue;
    }

    if (!lesson.startTime) {
      continue;
    }

    if (lesson.attendanceTaken) {
      continue;
    }

    if (lesson.finished) {
      continue;
    }

    if (lesson.warningSent) {
      continue;
    }

    const startTime = parseLessonTime(
      lesson.startTime
    );

    if (!startTime) {
      continue;
    }

    const elapsedMinutes =
      (now - startTime) / 60000;

    const duration =
      Number(lesson.durationMinutes) > 0
        ? Number(lesson.durationMinutes)
        : 90;

    // Dars boshlanganidan 15 daqiqa o'tgach
    // davomat olinmagan bo'lsa ogohlantiramiz.

    if (
      elapsedMinutes >= 15 &&
      elapsedMinutes <= duration
    ) {
      const warning = {
        lessonId: lesson.id,

        groupName:
          lesson.groupName || "Noma'lum",

        coachName:
          lesson.coachName || "Noma'lum",

        directorTelegramId:
          lesson.directorTelegramId || null,

        coachTelegramId:
          lesson.coachTelegramId || null,

        startTime: lesson.startTime,

        message:
          "⚠️ CHESARA DAVOMAT OGOHLANTIRISH\n\n" +
          `📚 Guruh: ${
            lesson.groupName || "Noma'lum"
          }\n` +
          `👨‍🏫 Ustoz: ${
            lesson.coachName || "Noma'lum"
          }\n` +
          `⏰ Dars: ${
            lesson.startTime
          }\n\n` +
          "Dars boshlanganiga 15 daqiqadan oshdi, " +
          "ammo davomat hali qilinmagan."
      };

      // Avval warningSent ni belgilaymiz,
      // shuning uchun har daqiqada qayta yuborilmaydi.

      lesson.warningSent = true;

      changed = true;

      if (typeof sendWarning === "function") {
        try {
          const result = sendWarning(warning);

          // Promise bo'lsa xatoni ushlaymiz
          if (
            result &&
            typeof result.catch === "function"
          ) {
            result.catch(error => {
              console.error(
                "❌ Ogohlantirish yuborishda xatolik:",
                error.message
              );
            });
          }
        } catch (error) {
          console.error(
            "❌ Ogohlantirish yuborishda xatolik:",
            error.message
          );
        }
      }
    }
  }

  if (changed) {
    saveLessons(lessons);
  }
}

// ------------------------------------------------------------
// SCHEDULER
// ------------------------------------------------------------

let schedulerStarted = false;

let schedulerInterval = null;

function startScheduler(sendWarning) {
  if (schedulerStarted) {
    console.log(
      "ℹ️ CHESARA Scheduler allaqachon ishlayapti."
    );

    return;
  }

  schedulerStarted = true;

  console.log(
    "⏰ CHESARA Attendance Scheduler ishga tushdi."
  );

  // Birinchi tekshiruv darhol
  try {
    checkAttendance(sendWarning);
  } catch (error) {
    console.error(
      "❌ Boshlang'ich scheduler xatosi:",
      error.message
    );
  }

  // Keyingi tekshiruvlar har 60 soniyada
  schedulerInterval = setInterval(() => {
    try {
      checkAttendance(sendWarning);
    } catch (error) {
      console.error(
        "❌ Scheduler xatosi:",
        error.message
      );
    }
  }, 60 * 1000);
}

// ------------------------------------------------------------
// STOP SCHEDULER
// ------------------------------------------------------------

function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);

    schedulerInterval = null;
  }

  schedulerStarted = false;

  console.log(
    "🛑 CHESARA Scheduler to'xtatildi."
  );
}

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

module.exports = {
  startScheduler,
  stopScheduler,
  getLessons,
  getLesson,
  addLesson,
  markAttendance,
  finishLesson,
  checkAttendance
};

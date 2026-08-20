// CHESARA — Dars nazorati va avtomatik ogohlantirish tizimi

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const SCHEDULE_FILE = path.join(DATA_DIR, "schedule.json");

function ensureDataFolder() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(SCHEDULE_FILE)) {
    fs.writeFileSync(
      SCHEDULE_FILE,
      JSON.stringify({ lessons: [] }, null, 2)
    );
  }
}

function loadSchedule() {
  ensureDataFolder();

  try {
    return JSON.parse(
      fs.readFileSync(SCHEDULE_FILE, "utf8")
    );
  } catch (error) {
    console.error("Jadvalni o'qishda xato:", error.message);
    return { lessons: [] };
  }
}

function saveSchedule(data) {
  ensureDataFolder();

  fs.writeFileSync(
    SCHEDULE_FILE,
    JSON.stringify(data, null, 2)
  );
}

/*
  Dars namunasi:

  {
    id: "lesson_001",
    groupId: "group_001",
    groupName: "Boshlang'ich A",
    coachId: "coach_001",
    coachName: "Aliyev Ali",
    directorTelegramId: "123456789",
    startTime: "2026-08-20T15:00:00+05:00",
    durationMinutes: 90,
    attendanceTaken: false,
    warningSent: false,
    finished: false
  }
*/

function addLesson(lesson) {
  const data = loadSchedule();

  data.lessons.push({
    ...lesson,
    attendanceTaken: false,
    warningSent: false,
    finished: false,
    createdAt: new Date().toISOString()
  });

  saveSchedule(data);

  return lesson;
}

function markAttendance(lessonId) {
  const data = loadSchedule();

  const lesson = data.lessons.find(
    item => item.id === lessonId
  );

  if (!lesson) {
    return {
      success: false,
      message: "Dars topilmadi."
    };
  }

  lesson.attendanceTaken = true;
  lesson.attendanceTakenAt = new Date().toISOString();

  saveSchedule(data);

  return {
    success: true,
    lesson
  };
}

function getLessons() {
  return loadSchedule().lessons;
}

function getLesson(lessonId) {
  return getLessons().find(
    lesson => lesson.id === lessonId
  );
}

/*
  Eng muhim qism:

  Dars boshlanganidan 15 daqiqa o'tib,
  ustoz davomat qilmagan bo'lsa,
  shu dars "warning" holatiga o'tadi.

  Telegramga yuborish funksiyasini bot.js bilan
  keyingi bosqichda bog'laymiz.
*/

function checkAttendanceWarnings() {
  const data = loadSchedule();

  const now = Date.now();
  const warnings = [];

  data.lessons.forEach(lesson => {
    if (
      lesson.finished ||
      lesson.attendanceTaken ||
      lesson.warningSent
    ) {
      return;
    }

    const startTime = new Date(lesson.startTime).getTime();

    if (Number.isNaN(startTime)) {
      return;
    }

    const minutesPassed =
      (now - startTime) / (1000 * 60);

    if (minutesPassed >= 15) {
      lesson.warningSent = true;
      lesson.warningCreatedAt =
        new Date().toISOString();

      warnings.push({
        lessonId: lesson.id,
        coachId: lesson.coachId,
        coachName: lesson.coachName,
        directorTelegramId:
          lesson.directorTelegramId,
        groupName: lesson.groupName,
        message:
          `🚨 CHESARA ogohlantirishi\n\n` +
          `Guruh: ${lesson.groupName}\n` +
          `Ustoz: ${lesson.coachName}\n\n` +
          `Dars boshlanganiga 15 daqiqadan oshdi, ` +
          `ammo davomat hali qilinmagan.`
      });
    }
  });

  saveSchedule(data);

  return warnings;
}

function finishLesson(lessonId) {
  const data = loadSchedule();

  const lesson = data.lessons.find(
    item => item.id === lessonId
  );

  if (!lesson) {
    return false;
  }

  lesson.finished = true;
  lesson.finishedAt = new Date().toISOString();

  saveSchedule(data);

  return true;
}

function startScheduler(onWarning) {
  console.log(
    "⏰ CHESARA dars nazorati ishga tushdi."
  );

  // Har 1 daqiqada tekshiradi.
  setInterval(() => {
    const warnings = checkAttendanceWarnings();

    if (warnings.length === 0) {
      return;
    }

    warnings.forEach(warning => {
      console.log(
        "🚨 DAVOMAT OGOHLANTIRISHI:",
        warning.message
      );

      if (typeof onWarning === "function") {
        onWarning(warning);
      }
    });
  }, 60 * 1000);
}

module.exports = {
  addLesson,
  getLessons,
  getLesson,
  markAttendance,
  finishLesson,
  checkAttendanceWarnings,
  startScheduler
};

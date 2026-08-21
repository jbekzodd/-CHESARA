```javascript
// ============================================================
// CHESARA — Lesson & Attendance Scheduler
// ============================================================

const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------
// DATA FILE
// ------------------------------------------------------------

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "lessons.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify([], null, 2),
    "utf8"
  );
}

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function readLessons() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");

    if (!data.trim()) {
      return [];
    }

    const lessons = JSON.parse(data);

    return Array.isArray(lessons) ? lessons : [];
  } catch (error) {
    console.error(
      "❌ lessons.json o'qishda xatolik:",
      error.message
    );

    return [];
  }
}

function saveLessons(lessons) {
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
// GET ALL LESSONS
// ------------------------------------------------------------

function getLessons() {
  return readLessons();
}

// ------------------------------------------------------------
// GET ONE LESSON
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
// ADD LESSON
// ------------------------------------------------------------

function addLesson(data) {
  const lessons = readLessons();

  const lesson = {
    id:
      data.id ||
      "lesson_" +
        Date.now(),

    groupId:
      data.groupId || null,

    groupName:
      data.groupName || "",

    coachId:
      data.coachId || null,

    coachName:
      data.coachName || "",

    coachTelegramId:
      data.coachTelegramId || null,

    directorTelegramId:
      data.directorTelegramId || null,

    startTime:
      data.startTime || "",

    durationMinutes:
      Number(data.durationMinutes) || 90,

    attendanceTaken:
      false,

    attendanceAt:
      null,

    finished:
      false,

    createdAt:
      new Date().toISOString()
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
    lesson =>
      String(lesson.id) === String(id)
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

  saveLessons(lessons);

  return {
    success: true,
    lesson: lessons[index]
  };
}

// ------------------------------------------------------------
// FINISH LESSON
// ------------------------------------------------------------

function finishLesson(id) {
  const lessons = readLessons();

  const index = lessons.findIndex(
    lesson =>
      String(lesson.id) === String(id)
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
// SCHEDULER
// ------------------------------------------------------------

let schedulerStarted = false;

function startScheduler(sendWarning) {
  if (schedulerStarted) {
    console.log(
      "ℹ️ Scheduler allaqachon ishlayapti."
    );

    return;
  }

  schedulerStarted = true;

  console.log(
    "⏰ CHESARA Attendance Scheduler ishga tushdi."
  );

  // Har 1 daqiqada tekshiradi
  setInterval(() => {
    try {
      checkAttendance(sendWarning);
    } catch (error) {
      console.error(
        "❌ Scheduler xatosi:",
        error.message
      );
    }
  }, 60 * 1000);

  // Server ishga tushganda darhol bir marta tekshiradi
  try {
    checkAttendance(sendWarning);
  } catch (error) {
    console.error(
      "❌ Scheduler boshlang'ich tekshiruv xatosi:",
      error.message
    );
  }
}

// ------------------------------------------------------------
// CHECK ATTENDANCE
// ------------------------------------------------------------

function checkAttendance(sendWarning) {
  const lessons = readLessons();

  const now = Date.now();

  lessons.forEach(lesson => {
    if (!lesson.startTime) {
      return;
    }

    if (lesson.attendanceTaken) {
      return;
    }

    if (lesson.finished) {
      return;
    }

    const start = new Date(
      lesson.startTime
    ).getTime();

    if (Number.isNaN(start)) {
      return;
    }

    const elapsedMinutes =
      (now - start) / 60000;

    // Dars boshlanganidan 15 daqiqa o'tgan bo'lsa
    if (
      elapsedMinutes >= 15 &&
      elapsedMinutes < 30
    ) {
      // Bir darsga qayta-qayta xabar yubormaslik
      if (lesson.warningSent) {
        return;
      }

      lesson.warningSent = true;

      saveLessons(lessons);

      const warning = {
        lessonId: lesson.id,

        groupName:
          lesson.groupName,

        coachName:
          lesson.coachName,

        directorTelegramId:
          lesson.directorTelegramId,

        message:
          `⚠️ CHESARA DAVOMAT OGOHLANTIRISH\n\n` +
          `📚 Guruh: ${lesson.groupName || "Noma'lum"}\n` +
          `👨‍🏫 Ustoz: ${lesson.coachName || "Noma'lum"}\n` +
          `⏰ Dars: ${lesson.startTime}\n\n` +
          `Dars boshlanganiga 15 daqiqa bo'ldi, ` +
          `ammo davomat hali qilinmagan.`
      };

      if (
        typeof sendWarning === "function"
      ) {
        try {
          sendWarning(warning);
        } catch (error) {
          console.error(
            "❌ Ogohlantirish yuborishda xatolik:",
            error.message
          );
        }
      }
    }
  });
}

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------

module.exports = {
  startScheduler,
  getLessons,
  getLesson,
  addLesson,
  markAttendance,
  finishLesson
};
```

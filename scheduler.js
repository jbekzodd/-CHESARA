```js
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'lessons.json');

let lessons = [];
let schedulerInterval = null;
let warningCallback = null;

// ============================================================
// FILESYSTEM
// ============================================================

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
}

function loadLessons() {
    ensureDataFile();

    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');

        if (!data.trim()) {
            lessons = [];
            return;
        }

        const parsed = JSON.parse(data);

        lessons = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('❌ lessons.json o‘qishda xato:', error.message);
        lessons = [];
    }
}

function saveLessons() {
    ensureDataFile();

    try {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(lessons, null, 2),
            'utf8'
        );

        return true;
    } catch (error) {
        console.error('❌ lessons.json saqlashda xato:', error.message);
        return false;
    }
}

// ============================================================
// ID
// ============================================================

function generateLessonId() {
    if (lessons.length === 0) {
        return 1;
    }

    const ids = lessons
        .map(lesson => Number(lesson.id))
        .filter(id => Number.isFinite(id));

    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

// ============================================================
// DATE / TIME
// ============================================================

function parseLessonTime(lesson) {
    if (!lesson) {
        return null;
    }

    const value =
        lesson.startTime ||
        lesson.datetime ||
        lesson.dateTime ||
        lesson.start ||
        lesson.date;

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

// ============================================================
// GET LESSONS
// ============================================================

function getLessons(filters = {}) {
    loadLessons();

    let result = [...lessons];

    if (filters.teacherId !== undefined) {
        result = result.filter(
            lesson => String(lesson.teacherId) === String(filters.teacherId)
        );
    }

    if (filters.studentId !== undefined) {
        result = result.filter(
            lesson =>
                String(lesson.studentId) === String(filters.studentId)
        );
    }

    if (filters.status !== undefined) {
        result = result.filter(
            lesson => lesson.status === filters.status
        );
    }

    if (filters.date !== undefined) {
        result = result.filter(lesson => {
            const date = parseLessonTime(lesson);

            if (!date) {
                return false;
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}` === filters.date;
        });
    }

    result.sort((a, b) => {
        const dateA = parseLessonTime(a);
        const dateB = parseLessonTime(b);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA.getTime() - dateB.getTime();
    });

    return result;
}

// ============================================================
// GET ONE LESSON
// ============================================================

function getLesson(id) {
    loadLessons();

    return (
        lessons.find(
            lesson => String(lesson.id) === String(id)
        ) || null
    );
}

// ============================================================
// ADD LESSON
// ============================================================

function addLesson(data = {}) {
    loadLessons();

    if (!data || typeof data !== 'object') {
        throw new Error('Dars ma’lumotlari noto‘g‘ri.');
    }

    const lesson = {
        id: generateLessonId(),

        studentId:
            data.studentId !== undefined
                ? data.studentId
                : null,

        studentName:
            data.studentName !== undefined
                ? data.studentName
                : '',

        teacherId:
            data.teacherId !== undefined
                ? data.teacherId
                : null,

        teacherName:
            data.teacherName !== undefined
                ? data.teacherName
                : '',

        courseId:
            data.courseId !== undefined
                ? data.courseId
                : null,

        courseName:
            data.courseName !== undefined
                ? data.courseName
                : '',

        title:
            data.title !== undefined
                ? data.title
                : 'Shaxmat darsi',

        description:
            data.description !== undefined
                ? data.description
                : '',

        date:
            data.date !== undefined
                ? data.date
                : null,

        startTime:
            data.startTime !== undefined
                ? data.startTime
                : data.datetime || null,

        endTime:
            data.endTime !== undefined
                ? data.endTime
                : null,

        duration:
            data.duration !== undefined
                ? data.duration
                : 60,

        status:
            data.status !== undefined
                ? data.status
                : 'scheduled',

        attendance: {
            status: 'not_marked',
            markedAt: null,
            note: ''
        },

        finishedAt: null,

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };

    lessons.push(lesson);

    if (!saveLessons()) {
        throw new Error('Darsni saqlab bo‘lmadi.');
    }

    return lesson;
}

// ============================================================
// MARK ATTENDANCE
// ============================================================

function markAttendance(id, attendanceData = {}) {
    loadLessons();

    const lesson = lessons.find(
        item => String(item.id) === String(id)
    );

    if (!lesson) {
        return null;
    }

    let status = attendanceData;

    if (
        attendanceData &&
        typeof attendanceData === 'object'
    ) {
        status =
            attendanceData.status ||
            attendanceData.attendance ||
            attendanceData.value ||
            'present';
    }

    if (typeof status !== 'string') {
        status = 'present';
    }

    status = status.toLowerCase();

    const allowedStatuses = [
        'present',
        'absent',
        'late',
        'excused',
        'not_marked'
    ];

    if (!allowedStatuses.includes(status)) {
        status = 'present';
    }

    let note = '';

    if (
        attendanceData &&
        typeof attendanceData === 'object' &&
        attendanceData.note !== undefined
    ) {
        note = String(attendanceData.note);
    }

    lesson.attendance = {
        status,
        markedAt: new Date().toISOString(),
        note
    };

    lesson.updatedAt = new Date().toISOString();

    if (status === 'present' || status === 'late') {
        lesson.attendanceStatus = status;
    } else {
        lesson.attendanceStatus = status;
    }

    saveLessons();

    return lesson;
}

// ============================================================
// FINISH LESSON
// ============================================================

function finishLesson(id, data = {}) {
    loadLessons();

    const lesson = lessons.find(
        item => String(item.id) === String(id)
    );

    if (!lesson) {
        return null;
    }

    lesson.status = 'finished';

    lesson.finishedAt = new Date().toISOString();

    lesson.updatedAt = new Date().toISOString();

    if (
        data &&
        typeof data === 'object'
    ) {
        if (data.note !== undefined) {
            lesson.finishNote = String(data.note);
        }

        if (data.homework !== undefined) {
            lesson.homework = String(data.homework);
        }

        if (data.result !== undefined) {
            lesson.result = data.result;
        }

        if (data.topic !== undefined) {
            lesson.topic = String(data.topic);
        }
    }

    saveLessons();

    return lesson;
}

// ============================================================
// ATTENDANCE CHECK
// ============================================================

function checkAttendance() {
    loadLessons();

    const now = new Date();

    for (const lesson of lessons) {
        if (
            lesson.status === 'finished' ||
            lesson.status === 'cancelled'
        ) {
            continue;
        }

        const lessonTime = parseLessonTime(lesson);

        if (!lessonTime) {
            continue;
        }

        const difference =
            lessonTime.getTime() - now.getTime();

        // Dars boshlanishidan 15 daqiqa oldin
        const fifteenMinutes = 15 * 60 * 1000;

        if (
            difference <= fifteenMinutes &&
            difference > 0 &&
            lesson.warningSent !== true
        ) {
            lesson.warningSent = true;
            lesson.warningSentAt = new Date().toISOString();
            lesson.updatedAt = new Date().toISOString();

            if (typeof warningCallback === 'function') {
                try {
                    warningCallback(lesson);
                } catch (error) {
                    console.error(
                        '⚠️ warningCallback xatosi:',
                        error.message
                    );
                }
            }
        }

        // Dars vaqti o‘tib ketgan bo‘lsa
        if (
            difference <= 0 &&
            lesson.status === 'scheduled'
        ) {
            const duration =
                Number(lesson.duration) > 0
                    ? Number(lesson.duration)
                    : 60;

            const endTime =
                lessonTime.getTime() +
                duration * 60 * 1000;

            if (now.getTime() >= endTime) {
                lesson.status = 'missed';

                if (
                    lesson.attendance &&
                    lesson.attendance.status === 'not_marked'
                ) {
                    lesson.attendance.status = 'absent';
                    lesson.attendance.markedAt =
                        new Date().toISOString();
                }

                lesson.updatedAt =
                    new Date().toISOString();
            }
        }
    }

    saveLessons();
}

// ============================================================
// START SCHEDULER
// ============================================================

function startScheduler(callback) {
    loadLessons();

    if (typeof callback === 'function') {
        warningCallback = callback;
    }

    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }

    // Birinchi tekshiruv
    try {
        checkAttendance();
    } catch (error) {
        console.error(
            '❌ Scheduler tekshiruvida xato:',
            error.message
        );
    }

    // Har 1 daqiqada tekshiradi
    schedulerInterval = setInterval(() => {
        try {
            checkAttendance();
        } catch (error) {
            console.error(
                '❌ Scheduler xatosi:',
                error.message
            );
        }
    }, 60 * 1000);

    console.log('✅ Lesson scheduler ishga tushdi.');

    return true;
}

// ============================================================
// STOP SCHEDULER
// ============================================================

function stopScheduler() {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }

    console.log('🛑 Lesson scheduler to‘xtatildi.');

    return true;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    startScheduler,
    getLessons,
    getLesson,
    addLesson,
    markAttendance,
    finishLesson
};
```

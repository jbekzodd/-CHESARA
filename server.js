const express = require("express");
const path = require("path");

const {
  createLesson,
  markAttendance,
  lessons
} = require("./scheduler");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sayt fayllari
app.use(express.static(__dirname));

/*
  Asosiy sahifa
*/
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/*
  Server holatini tekshirish
*/
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    status: "online",
    message: "CHESARA server ishlayapti ♟️",
    time: new Date().toISOString()
  });
});

/*
  Dars boshlash
*/
app.post("/api/lessons", (req, res) => {
  try {
    const {
      lessonId,
      teacherId,
      teacherName,
      groupName
    } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId kiritilishi kerak."
      });
    }

    createLesson(lessonId, {
      teacherId: teacherId || null,
      teacherName: teacherName || "Noma'lum ustoz",
      groupName: groupName || "Noma'lum guruh",
      startTime: Date.now()
    });

    res.json({
      success: true,
      message: "Dars muvaffaqiyatli boshlandi.",
      lessonId
    });

  } catch (error) {
    console.error("Dars boshlash xatosi:", error);

    res.status(500).json({
      success: false,
      message: "Darsni boshlashda xatolik yuz berdi."
    });
  }
});

/*
  Davomatni tasdiqlash
*/
app.post("/api/attendance", (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId kiritilishi kerak."
      });
    }

    const success = markAttendance(lessonId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Dars topilmadi."
      });
    }

    res.json({
      success: true,
      message: "Davomat muvaffaqiyatli qayd qilindi."
    });

  } catch (error) {
    console.error("Davomat xatosi:", error);

    res.status(500).json({
      success: false,
      message: "Davomatni qayd qilishda xatolik yuz berdi."
    });
  }
});

/*
  Hozirgi darslar
*/
app.get("/api/lessons", (req, res) => {
  const data = Array.from(lessons.entries()).map(
    ([id, lesson]) => ({
      id,
      ...lesson
    })
  );

  res.json({
    success: true,
    lessons: data
  });
});

/*
  404
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "CHESARA: sahifa yoki API manzili topilmadi."
  });
});

/*
  Server
*/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 CHESARA server ${PORT}-portda ishlayapti.`);
  console.log("♟️ CHESARA AI Chess Platform ishga tushdi.");
});

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ===============================
// CHESARA SERVER
// ===============================

const startTime = new Date();

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "CHESARA",
    message: "CHESARA AI Chess Platform server ishlayapti.",
    status: "online",
    version: "1.0.0",
    startedAt: startTime.toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    service: "CHESARA API",
    timestamp: new Date().toISOString()
  });
});

// ===============================
// DASHBOARD
// ===============================

app.get("/api/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      students: 0,
      groups: 0,
      todayLessons: 0,
      attendance: 0,
      activeLessons: 0,
      pendingWarnings: 0
    }
  });
});

// ===============================
// STUDENTS
// ===============================

app.get("/api/students", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post("/api/students", (req, res) => {
  const { name, phone, groupId } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "O‘quvchi ismi kiritilishi kerak."
    });
  }

  res.status(201).json({
    success: true,
    message: "O‘quvchi qabul qilindi.",
    data: {
      id: "student_" + Date.now(),
      name,
      phone: phone || "",
      groupId: groupId || null
    }
  });
});

// ===============================
// GROUPS
// ===============================

app.get("/api/groups", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post("/api/groups", (req, res) => {
  const { name, coachId, days, time, price } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Guruh nomi kiritilishi kerak."
    });
  }

  res.status(201).json({
    success: true,
    message: "Guruh qabul qilindi.",
    data: {
      id: "group_" + Date.now(),
      name,
      coachId: coachId || null,
      days: days || "",
      time: time || "",
      price: Number(price) || 0
    }
  });
});

// ===============================
// LESSONS
// ===============================

app.get("/api/lessons", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post("/api/lessons/start", (req, res) => {
  const { groupId, coachId } = req.body;

  res.status(201).json({
    success: true,
    message: "Dars boshlandi.",
    data: {
      id: "lesson_" + Date.now(),
      groupId: groupId || null,
      coachId: coachId || null,
      startedAt: new Date().toISOString(),
      attendanceDeadline: new Date(
        Date.now() + 15 * 60 * 1000
      ).toISOString(),
      status: "active"
    }
  });
});

// ===============================
// ATTENDANCE
// ===============================

app.get("/api/attendance", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post("/api/attendance", (req, res) => {
  const { lessonId, studentId, status } = req.body;

  res.status(201).json({
    success: true,
    message: "Davomat saqlandi.",
    data: {
      lessonId,
      studentId,
      status: status || "present",
      createdAt: new Date().toISOString()
    }
  });
});

// ===============================
// 15 DАQIQA DAVOMAT NAZORATI
// ===============================

app.get("/api/attendance/warnings", (req, res) => {
  res.json({
    success: true,
    data: [],
    rule: {
      attendanceDeadlineMinutes: 15,
      action: "director_notification"
    }
  });
});

// ===============================
// CHESS GAMES
// ===============================

app.get("/api/games", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.post("/api/games/import", (req, res) => {
  const {
    source,
    player,
    opponent,
    moves,
    pgn
  } = req.body;

  res.status(201).json({
    success: true,
    message: "O‘yin tahlil uchun qabul qilindi.",
    data: {
      id: "game_" + Date.now(),
      source: source || "unknown",
      player: player || "",
      opponent: opponent || "",
      moves: moves || [],
      pgn: pgn || "",
      status: "pending_analysis",
      createdAt: new Date().toISOString()
    }
  });
});

// ===============================
// AI ANALYSIS
// ===============================

app.post("/api/analysis/game", (req, res) => {
  const { gameId, pgn } = req.body;

  res.status(202).json({
    success: true,
    message: "O‘yin AI tahlil navbatiga qo‘yildi.",
    data: {
      analysisId: "analysis_" + Date.now(),
      gameId: gameId || null,
      pgnReceived: Boolean(pgn),
      status: "queued"
    }
  });
});

// ===============================
// PLAYER STYLE
// ===============================

app.get("/api/players/:playerId/style", (req, res) => {
  res.json({
    success: true,
    data: {
      playerId: req.params.playerId,
      style: null,
      categories: [
        "aggressive",
        "defensive",
        "positional",
        "tactical",
        "endgame",
        "opening"
      ],
      message: "Yetarli o‘yinlar yig‘ilgandan keyin AI uslubni aniqlaydi."
    }
  });
});

// ===============================
// TOURNAMENTS
// ===============================

app.get("/api/tournaments", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// ===============================
// NEWS
// ===============================

app.get("/api/news", (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// ===============================
// MONTHLY REPORT
// ===============================

app.get("/api/reports/monthly", (req, res) => {
  const month = req.query.month || "current";

  res.json({
    success: true,
    data: {
      month,
      students: 0,
      lessons: 0,
      attendance: 0,
      payments: 0,
      missedLessons: 0,
      chessGames: 0,
      aiAnalyses: 0
    }
  });
});

// ===============================
// TELEGRAM BOT READY ENDPOINT
// ===============================

app.post("/api/telegram/webhook", (req, res) => {
  console.log("Telegram update:", req.body);

  res.json({
    success: true
  });
});

// ===============================
// 404
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "CHESARA API endpoint topilmadi."
  });
});

// ===============================
// START
// ===============================

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("CHESARA SERVER IS RUNNING");
  console.log("PORT:", PORT);
  console.log("=================================");
});

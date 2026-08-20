const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend fayllari
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Server holati
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    message: "CHESARA server ishlayapti ♟️",
    status: "online",
    time: new Date().toISOString()
  });
});

// CHESARA API
app.get("/api", (req, res) => {
  res.json({
    success: true,
    project: "CHESARA",
    version: "1.0.0",
    status: "online"
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "CHESARA: sahifa topilmadi"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 CHESARA server ${PORT}-portda ishlayapti.`);
  console.log("⏰ CHESARA dars nazorati ishga tushdi.");

  if (process.env.TELEGRAM_BOT_TOKEN) {
    console.log("🤖 CHESARA Telegram Bot token mavjud.");
  } else {
    console.log("⚠️ TELEGRAM_BOT_TOKEN Render Environment Variables'da yo'q.");
  }
});

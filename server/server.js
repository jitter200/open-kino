const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

// Загрузка переменных окружения
require("dotenv").config();

// Устанавливаем фиксированный JWT_SECRET, если он не определен в .env
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your_jwt_secret_key";
}

// Создаем необходимые директории для видео
const videosDir = path.join(__dirname, "videos");
const localVideosDir = path.join(__dirname, "videos/local");
const convertedVideosDir = path.join(__dirname, "videos/converted");

// Создаем директории, если они не существуют
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
  console.log("Создана директория для видео:", videosDir);
}
if (!fs.existsSync(localVideosDir)) {
  fs.mkdirSync(localVideosDir, { recursive: true });
  console.log("Создана директория для локальных видео:", localVideosDir);
}
if (!fs.existsSync(convertedVideosDir)) {
  fs.mkdirSync(convertedVideosDir, { recursive: true });
  console.log(
    "Создана директория для конвертированных видео:",
    convertedVideosDir
  );
}

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/netflix";

// Подключение к MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB successfully connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Middleware
app.use(cors()); // Упрощенная настройка CORS для разрешения всех запросов
app.use(express.json());
app.use(morgan("dev"));

// Добавляем детальное логирование запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }

  // Добавим проверку на неверные пути
  if (req.url.includes("/api/api/")) {
    console.log('ОШИБКА: ДУБЛИРОВАНИЕ "/api" В ПУТИ');
    // Исправляем путь, заменяя /api/api/ на /api/
    req.url = req.url.replace("/api/api/", "/api/");
    console.log("Исправленный путь:", req.url);
  }

  next();
});

// Импорт роутов
const movieRoutes = require("./routes/movieRoutes");
const { router: authRoutes } = require("./routes/authRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");

// Подключение роутов
app.use("/api/movies", movieRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/watchlist", watchlistRoutes);

// Настройка для обслуживания статических файлов React
// В production режиме сервер будет обслуживать статические файлы из папки build
if (process.env.NODE_ENV === "production") {
  // Обслуживание статических файлов
  app.use(express.static(path.join(__dirname, "../build")));

  // Все GET запросы, не обработанные ранее, будут отправлять index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../build", "index.html"));
  });
} else {
  // Простой маршрут для проверки сервера в режиме разработки
  app.get("/", (req, res) => {
    res.json({ message: "Сервер Netflix Clone API работает" });
  });
}

// Простой маршрут для проверки API
app.get("/api", (req, res) => {
  res.json({ message: "API Netflix Clone работает" });
});

// Обработка ошибок 404 для остальных маршрутов
app.use((req, res) => {
  console.log(`[404] Неизвестный маршрут: ${req.method} ${req.url}`);
  res.status(404).json({ message: "Маршрут не найден" });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Ошибка сервера", error: err.message });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});

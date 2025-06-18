const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

// Генерация JWT токена
const generateToken = (id) => {
  const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "90d",
  });
};

// Middleware для проверки аутентификации
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Получаем токен из заголовка
      token = req.headers.authorization.split(" ")[1];

      // Верифицируем токен
      const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
      const decoded = jwt.verify(token, JWT_SECRET);

      // Находим пользователя и добавляем в запрос
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      next();
    } catch (error) {
      console.error("Ошибка аутентификации:", error);
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Срок действия токена истек", expired: true });
      }
      return res
        .status(401)
        .json({ message: "Не авторизован, токен недействителен" });
    }
  } else if (!token) {
    return res.status(401).json({ message: "Не авторизован, нет токена" });
  }
};

// Middleware для проверки роли администратора
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Доступ запрещен. Требуются права администратора" });
  }
};

// @route   POST /api/auth/register
// @desc    Регистрация нового пользователя
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Проверка, существует ли пользователь с таким email
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }

    // Создаем пользователя
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Создаем токен
      const token = generateToken(user._id);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      });
    } else {
      res.status(400).json({ message: "Некорректные данные пользователя" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Аутентификация пользователя и получение токена
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    // Проверяем пароль
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Неверный email или пароль" });
    }

    // Создаем токен
    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Получение данных текущего пользователя
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
});

// @route   GET /api/auth/users
// @desc    Получение списка всех пользователей (только для админов)
// @access  Private/Admin
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера", error: error.message });
  }
});

// Экспортируем middleware для использования в других маршрутах
module.exports = {
  router,
  protect,
  adminOnly,
};

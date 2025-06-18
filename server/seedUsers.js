const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Импортируем модель пользователя
const User = require("./models/User");

// Данные для администратора по умолчанию
const adminUser = {
  name: "Admin",
  email: "admin@netflix-clone.com",
  password: "admin123",
  role: "admin",
};

// Данные для тестового пользователя
const testUser = {
  name: "Тестовый пользователь",
  email: "user@netflix-clone.com",
  password: "user123",
  role: "user",
};

// URL подключения к MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/netflix";

// Функция для подключения к базе данных
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB успешно подключена");
  } catch (error) {
    console.error("Ошибка подключения к MongoDB:", error.message);
    process.exit(1);
  }
};

// Функция для создания пользователей
const seedUsers = async () => {
  try {
    // Подключаемся к базе данных
    await connectDB();

    // Очищаем коллекцию Users, если она существует
    await User.deleteMany({});
    console.log("База данных пользователей очищена");

    // Хэшируем пароль администратора
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash(
      adminUser.password,
      adminSalt
    );

    // Создаем администратора
    const admin = await User.create({
      name: adminUser.name,
      email: adminUser.email,
      password: adminHashedPassword,
      role: adminUser.role,
    });

    console.log(`Администратор создан: ${admin.email} (${admin.role})`);

    // Хэшируем пароль тестового пользователя
    const userSalt = await bcrypt.genSalt(10);
    const userHashedPassword = await bcrypt.hash(testUser.password, userSalt);

    // Создаем тестового пользователя
    const user = await User.create({
      name: testUser.name,
      email: testUser.email,
      password: userHashedPassword,
      role: testUser.role,
    });

    console.log(`Тестовый пользователь создан: ${user.email} (${user.role})`);

    console.log("Инициализация базы данных пользователей завершена успешно!");

    // Выводим информацию о доступе
    console.log("\nДанные для входа:");
    console.log(`Администратор: ${adminUser.email} / ${adminUser.password}`);
    console.log(`Пользователь: ${testUser.email} / ${testUser.password}`);

    // Закрываем соединение с базой данных
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(
      "Ошибка при инициализации базы данных пользователей:",
      error.message
    );
    process.exit(1);
  }
};

// Запускаем инициализацию
seedUsers();

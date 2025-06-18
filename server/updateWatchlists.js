const mongoose = require("mongoose");
require("dotenv").config();

// Импортируем нужные модели
const User = require("./models/User");
const Watchlist = require("./models/Watchlist");

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

// Функция для обновления списков просмотра
const updateWatchlists = async () => {
  try {
    // Подключаемся к базе данных
    await connectDB();

    // Находим все существующие списки просмотра со старым userId
    const oldWatchlists = await Watchlist.find({ userId: "default-user" });
    console.log(
      `Найдено ${oldWatchlists.length} списков просмотра со старым userId`
    );

    // Находим пользователей из недавно созданной базы
    const users = await User.find();
    if (users.length === 0) {
      console.log(
        "Пользователи не найдены. Пожалуйста, сначала запустите seedUsers.js"
      );
      mongoose.connection.close();
      process.exit(0);
      return;
    }

    // Если у нас есть старые списки просмотра, обновляем их
    if (oldWatchlists.length > 0) {
      // Берем первый список просмотра и его фильмы
      const oldWatchlist = oldWatchlists[0];

      // Удаляем все старые списки просмотра
      await Watchlist.deleteMany({ userId: "default-user" });

      // Создаем новые списки просмотра для каждого пользователя с фильмами из старого списка
      for (const user of users) {
        const newWatchlist = new Watchlist({
          userId: user._id,
          movies: oldWatchlist.movies,
        });

        await newWatchlist.save();
        console.log(
          `Создан новый список просмотра для пользователя ${user.email}`
        );
      }

      console.log("Обновление списков просмотра завершено успешно!");
    } else {
      // Если старых списков нет, создаем пустые списки для новых пользователей
      for (const user of users) {
        const newWatchlist = new Watchlist({
          userId: user._id,
          movies: [],
        });

        await newWatchlist.save();
        console.log(
          `Создан пустой список просмотра для пользователя ${user.email}`
        );
      }

      console.log("Созданы пустые списки просмотра для всех пользователей!");
    }

    // Закрываем соединение с базой данных
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Ошибка при обновлении списков просмотра:", error.message);
    process.exit(1);
  }
};

// Запускаем обновление
updateWatchlists();

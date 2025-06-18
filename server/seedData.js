const mongoose = require("mongoose");
require("dotenv").config();

// Импорт модели фильма
const Movie = require("./models/Movie");

// Подключение к MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/netflix", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Данные фильмов для добавления в базу данных
// Здесь можно добавить новые фильмы
const movieData = [
  {
    title: "Брат",
    poster:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1900788/4478a9f5-5f89-4773-9c3d-9dfe9ed4e057/1920x",
    description:
      "Демобилизовавшись, Данила Багров возвращается в родной городок. Но скучная жизнь провинциального городка не устраивает его, и он решает поехать к брату в Петербург. Приехав, он обнаруживает, что брат работает наёмным убийцей.",
    genres: "Боевик, Драма, Криминал",
    cast: "Сергей Бодров мл., Виктор Сухоруков, Светлана Письмиченко, Мария Жукова",
    director: "Алексей Балабанов",
    rating: "16+",
    year: "1997",
    duration: "1ч 40м",
    quality: "HD",
    type: "popular",
    videos: {
      fhd: "videos/BRAT_1080.avi",
      hd: null,
      sd: null,
    },
  },
  {
    title: "Ирония судьбы, или С лёгким паром!",
    poster:
      "https://avatars.mds.yandex.net/get-kinopoisk-image/1599028/637271d5-61b4-4e46-ac83-6d07494c7645/1920x",
    description:
      "31 декабря пошли друзья в баню попариться, по традиции. Но неожиданно их традиция приводит к тому, что в самолет, вместо одного из них, попадает другой, непьющий. И летит этот непьющий в Ленинград, на улицу имени такой же, как в Москве, в дом номер такой же, в квартиру такую же.",
    genres: "Мелодрама, Комедия",
    cast: "Андрей Мягков, Барбара Брыльска, Юрий Яковлев, Александр Ширвиндт",
    director: "Эльдар Рязанов",
    rating: "0+",
    year: "1975",
    duration: "3ч 10м",
    quality: "HD",
    type: "popular",
    videos: {
      fhd: "videos/irony_of_fate_1080.mp4",
      hd: null,
      sd: null,
    },
  },
  // Пример структуры фильма для добавления:
  /*
  {
    title: "Название фильма",
    poster: "/assets/poster.jpg",
    description: "Описание фильма",
    genres: "Жанр1, Жанр2",
    cast: "Актер1, Актер2",
    director: "Режиссер",
    rating: "18+",
    year: "2023",
    duration: "2ч 10м",
    quality: "4K",
    type: "trending", // или "popular", "newReleases"
    videos: {
      fhd: "videos/path_to_video_1080p.mp4",
      hd: null,
      sd: null,
    },
  },
  */
];

// Функция для добавления фильмов в базу данных без удаления существующих
const seedDB = async () => {
  try {
    console.log("Начинаем добавление новых фильмов...");

    // Проверяем, есть ли фильмы для добавления
    if (movieData.length === 0) {
      console.log(
        "Нет новых фильмов для добавления. Добавьте фильмы в массив movieData."
      );
      return;
    }

    // Счетчики для статистики
    let addedCount = 0;
    let skippedCount = 0;

    // Для каждого фильма в массиве данных
    for (const movie of movieData) {
      // Проверяем, существует ли уже фильм с таким названием
      const existingMovie = await Movie.findOne({ title: movie.title });

      if (existingMovie) {
        console.log(`Фильм "${movie.title}" уже существует, пропускаем...`);
        skippedCount++;
      } else {
        // Добавляем новый фильм
        await Movie.create(movie);
        console.log(`Добавлен новый фильм: "${movie.title}"`);
        addedCount++;
      }
    }

    console.log("\n--- Результаты добавления фильмов ---");
    console.log(`Добавлено новых фильмов: ${addedCount}`);
    console.log(`Пропущено (уже существуют): ${skippedCount}`);
    console.log("-------------------------------------");
  } catch (err) {
    console.error("Ошибка при добавлении фильмов:", err);
  } finally {
    mongoose.connection.close();
    console.log("Соединение с MongoDB закрыто");
  }
};

// Запуск функции заполнения базы данных
seedDB();

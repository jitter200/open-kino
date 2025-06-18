const express = require("express");
const router = express.Router();
const Watchlist = require("../models/Watchlist");
const Movie = require("../models/Movie");
const { protect } = require("./authRoutes");

// Получить список просмотра пользователя
router.get("/", protect, async (req, res) => {
  try {
    console.log(
      "GET /watchlist - Получение списка для пользователя:",
      req.user._id
    );

    let watchlist = await Watchlist.findOne({
      userId: req.user._id,
    }).populate("movies");

    // Если списка нет, создаем пустой
    if (!watchlist) {
      console.log("Список не найден, создаем новый");
      watchlist = new Watchlist({ userId: req.user._id, movies: [] });
      await watchlist.save();
    } else {
      console.log("Найден список с фильмами:", watchlist.movies.length);
      console.log(
        "IDs фильмов в списке:",
        watchlist.movies.map((movie) => movie._id).join(", ")
      );
    }

    res.json(watchlist.movies);
  } catch (err) {
    console.error("Ошибка при получении списка:", err);
    res.status(500).json({ message: err.message });
  }
});

// Добавить фильм в список просмотра
router.post("/add/:movieId", protect, async (req, res) => {
  try {
    console.log("POST /watchlist/add/:movieId - Добавление фильма в список");
    console.log("Ищем фильм с ID:", req.params.movieId);
    console.log("Пользователь:", req.user._id);

    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      console.log("Фильм не найден в базе данных");
      return res.status(404).json({ message: "Фильм не найден" });
    }

    console.log("Фильм найден:", movie.title);

    let watchlist = await Watchlist.findOne({ userId: req.user._id });

    // Если списка нет, создаем новый
    if (!watchlist) {
      console.log("Список не найден, создаем новый");
      watchlist = new Watchlist({ userId: req.user._id, movies: [] });
    } else {
      console.log(
        "Найден существующий список с",
        watchlist.movies.length,
        "фильмами"
      );
    }

    // Проверяем, есть ли уже фильм в списке
    const movieExists = watchlist.movies.some(
      (id) => id.toString() === movie._id.toString()
    );
    console.log("Фильм уже в списке?", movieExists);

    if (!movieExists) {
      console.log("Добавляем фильм в список:", movie._id);
      watchlist.movies.push(movie._id);
      await watchlist.save();
      console.log(
        "Список обновлен, теперь в нем",
        watchlist.movies.length,
        "фильмов"
      );
    } else {
      console.log("Фильм уже был в списке, пропускаем");
    }

    res.json({
      message: "Фильм добавлен в список просмотра",
      success: true,
      movieId: movie._id,
      movieTitle: movie.title,
      watchlistSize: watchlist.movies.length,
    });
  } catch (err) {
    console.error("Ошибка при добавлении фильма:", err);
    res.status(500).json({ message: err.message, success: false });
  }
});

// Удалить фильм из списка просмотра
router.delete("/remove/:movieId", protect, async (req, res) => {
  try {
    console.log(
      "DELETE /watchlist/remove/:movieId - Удаление фильма из списка"
    );
    console.log("ID фильма для удаления:", req.params.movieId);
    console.log("Пользователь:", req.user._id);

    let watchlist = await Watchlist.findOne({ userId: req.user._id });

    if (!watchlist) {
      console.log("Список просмотра не найден");
      return res.status(404).json({ message: "Список просмотра не найден" });
    }

    console.log("Найден список с", watchlist.movies.length, "фильмами");
    console.log(
      "Текущие IDs фильмов:",
      watchlist.movies.map((id) => id.toString()).join(", ")
    );

    const sizeBefore = watchlist.movies.length;
    watchlist.movies = watchlist.movies.filter(
      (id) => id.toString() !== req.params.movieId
    );
    const sizeAfter = watchlist.movies.length;

    console.log("Фильм удален?", sizeBefore > sizeAfter);
    console.log("Количество фильмов до:", sizeBefore, "после:", sizeAfter);

    await watchlist.save();
    res.json({
      message: "Фильм удален из списка просмотра",
      success: true,
      movieId: req.params.movieId,
      removed: sizeBefore > sizeAfter,
      watchlistSize: watchlist.movies.length,
    });
  } catch (err) {
    console.error("Ошибка при удалении фильма:", err);
    res.status(500).json({ message: err.message, success: false });
  }
});

// Очистить весь список просмотра
router.delete("/clear", protect, async (req, res) => {
  try {
    console.log("DELETE /watchlist/clear - Очистка списка");
    console.log("Пользователь:", req.user._id);

    let watchlist = await Watchlist.findOne({ userId: req.user._id });

    if (!watchlist) {
      console.log("Список просмотра не найден");
      return res.status(404).json({ message: "Список просмотра не найден" });
    }

    console.log("Найден список с", watchlist.movies.length, "фильмами");

    watchlist.movies = [];
    await watchlist.save();

    console.log("Список успешно очищен");

    res.json({
      message: "Список просмотра очищен",
      success: true,
    });
  } catch (err) {
    console.error("Ошибка при очистке списка:", err);
    res.status(500).json({ message: err.message, success: false });
  }
});

module.exports = router;

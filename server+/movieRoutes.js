const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");
const { protect, adminOnly } = require("./authRoutes");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const multer = require("multer");

// Устанавливаем путь к ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Хранилище для отслеживания конвертаций
const conversionJobs = new Map();

// Настройка хранилища multer для загрузки видео
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../videos");

    // Создаем директорию, если она не существует
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Используем ID фильма и оригинальное расширение файла
    const movieId = req.params.id;
    const fileExt = path.extname(file.originalname);
    cb(null, `${movieId}_original${fileExt}`);
  },
});

// Фильтр файлов для multer (разрешаем только видеофайлы)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "video/mp4",
    "video/avi",
    "video/x-msvideo",
    "video/quicktime",
    "video/x-matroska",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Недопустимый тип файла. Поддерживаются только MP4, AVI, MOV и MKV."
      ),
      false
    );
  }
};

// Инициализация multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 500, // 500 МБ максимум
  },
});

// Получить все фильмы
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Маршрут для получения списка локальных видеофайлов (открытый для тестирования)
router.get("/local-videos", async (req, res) => {
  try {
    const localPath = path.join(__dirname, "../videos/local");

    // Создаем директорию, если она не существует
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }

    // Получаем список всех файлов в директории
    const files = fs.readdirSync(localPath);

    // Фильтруем только видеофайлы по расширению
    const videoExtensions = [
      ".mp4",
      ".avi",
      ".mov",
      ".mkv",
      ".wmv",
      ".flv",
      ".webm",
    ];
    const videoFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return videoExtensions.includes(ext);
    });

    // Формируем полные пути к файлам
    const videoPaths = videoFiles.map((file) => {
      return `videos/local/${file}`;
    });

    res.json({ videos: videoPaths });
  } catch (err) {
    console.error("Ошибка при получении списка локальных видео:", err);
    res.status(500).json({ message: err.message });
  }
});

// Маршрут для конвертации локального видео (открытый для тестирования)
router.post("/convert-local-video", async (req, res) => {
  try {
    const { movieId, videoPath } = req.body;

    if (!movieId || !videoPath) {
      return res
        .status(400)
        .json({ message: "Необходимо указать ID фильма и путь к видео" });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Фильм не найден" });
    }

    // Полный путь к исходному видеофайлу
    const inputPath = path.join(__dirname, "../", videoPath);

    // Проверяем существование файла
    if (!fs.existsSync(inputPath)) {
      return res
        .status(404)
        .json({ message: "Видеофайл не найден на сервере" });
    }

    // Создаем директорию для конвертированных файлов
    const outputDir = path.join(__dirname, "../videos/converted");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Генерируем уникальный ID для задачи конвертации
    const conversionId = `${movieId}_${Date.now()}`;

    // Инициализируем состояние задачи
    conversionJobs.set(conversionId, {
      status: "processing",
      progress: 0,
      message: "Начинаем конвертацию...",
      movieId,
      startTime: Date.now(),
    });

    // Отправляем статус 202 (Accepted), чтобы клиент не ждал завершения конвертации
    res.status(202).json({
      message: "Процесс конвертации начат",
      status: "processing",
      conversionId,
      movieId,
    });

    // Создаем имена файлов на основе ID фильма
    const hdFilename = `${movieId}_hd.mp4`;
    const hdOutputPath = path.join(outputDir, hdFilename);
    const sdFilename = `${movieId}_sd.mp4`;
    const sdOutputPath = path.join(outputDir, sdFilename);

    // Обновляем прогресс
    conversionJobs.set(conversionId, {
      ...conversionJobs.get(conversionId),
      progress: 5,
      message: "Начинаем конвертацию в HD (720p)...",
    });

    // Конвертация в HD (720p)
    ffmpeg(inputPath)
      .output(hdOutputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size("1280x?") // 720p с сохранением пропорций
      .outputOptions([
        "-movflags frag_keyframe+empty_moov",
        "-crf 22",
        "-preset medium",
      ])
      .on("progress", (progress) => {
        conversionJobs.set(conversionId, {
          ...conversionJobs.get(conversionId),
          progress: 5 + Math.round(progress.percent * 0.45), // 5% + 45% = 50%
          message: `Конвертация в HD (${Math.round(progress.percent)}%)...`,
        });
      })
      .on("error", (err) => {
        console.error("Ошибка при конвертации HD:", err);
        // Не прерываем, продолжаем конвертацию SD
        conversionJobs.set(conversionId, {
          ...conversionJobs.get(conversionId),
          message: `Ошибка при конвертации HD: ${err.message}, продолжаем конвертацию SD...`,
        });

        // Продолжаем конвертацию SD
        convertToSD();
      })
      .on("end", () => {
        // Обновляем прогресс
        conversionJobs.set(conversionId, {
          ...conversionJobs.get(conversionId),
          progress: 50,
          message: "Начинаем конвертацию в SD (480p)...",
        });

        // Конвертируем в SD (480p)
        convertToSD();
      })
      .run();

    // Функция для конвертации SD
    const convertToSD = () => {
      ffmpeg(inputPath)
        .output(sdOutputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .size("854x?") // 480p с сохранением пропорций
        .outputOptions([
          "-movflags frag_keyframe+empty_moov",
          "-crf 23",
          "-preset medium",
        ])
        .on("progress", (progress) => {
          conversionJobs.set(conversionId, {
            ...conversionJobs.get(conversionId),
            progress: 50 + Math.round(progress.percent * 0.49), // 50% + 49% = 99%
            message: `Конвертация в SD (${Math.round(progress.percent)}%)...`,
          });
        })
        .on("error", (err) => {
          console.error("Ошибка при конвертации SD:", err);
          // Даже если SD конвертация не удалась, обновляем в БД то, что уже сделано
          updateMovieInDatabase();
        })
        .on("end", () => {
          // Обновляем прогресс
          conversionJobs.set(conversionId, {
            ...conversionJobs.get(conversionId),
            progress: 99,
            message: "Обновление данных в базе данных...",
          });

          // Обновляем пути к видео в базе данных
          updateMovieInDatabase();
        })
        .run();
    };

    // Функция для обновления данных в базе данных
    const updateMovieInDatabase = async () => {
      try {
        // Проверяем, какие файлы успешно созданы
        const hdExists = fs.existsSync(hdOutputPath);
        const sdExists = fs.existsSync(sdOutputPath);

        // Формируем относительные пути к файлам
        // Используем исходный файл для FHD
        const fhdRelativePath = videoPath;
        const hdRelativePath = hdExists
          ? `videos/converted/${hdFilename}`
          : null;
        const sdRelativePath = sdExists
          ? `videos/converted/${sdFilename}`
          : null;

        // Обновляем фильм в базе данных
        movie.videos = {
          fhd: fhdRelativePath,
          hd: hdRelativePath,
          sd: sdRelativePath,
        };

        await movie.save();

        // Обновляем статус задачи
        conversionJobs.set(conversionId, {
          ...conversionJobs.get(conversionId),
          status: "completed",
          progress: 100,
          message: "Конвертация завершена успешно",
          completedTime: Date.now(),
        });

        console.log(`Конвертация для фильма ${movieId} завершена успешно.`);
      } catch (err) {
        console.error("Ошибка при обновлении фильма в БД:", err);
        conversionJobs.set(conversionId, {
          ...conversionJobs.get(conversionId),
          status: "error",
          message: `Ошибка при обновлении базы данных: ${err.message}`,
        });
      }
    };
  } catch (err) {
    console.error("Ошибка при запуске конвертации:", err);
    res.status(500).json({ message: err.message });
  }
});

// Маршрут для получения статуса конвертации (открытый для тестирования)
router.get("/conversion-status/:conversionId", async (req, res) => {
  try {
    const { conversionId } = req.params;

    // Проверяем существование задачи конвертации
    if (!conversionJobs.has(conversionId)) {
      return res.status(404).json({ message: "Задача конвертации не найдена" });
    }

    // Возвращаем текущий статус
    const jobStatus = conversionJobs.get(conversionId);

    // Если задача завершена и прошло больше 10 минут, то удаляем информацию о ней
    if (
      (jobStatus.status === "completed" || jobStatus.status === "error") &&
      jobStatus.completedTime &&
      Date.now() - jobStatus.completedTime > 10 * 60 * 1000
    ) {
      conversionJobs.delete(conversionId);
    }

    res.json(jobStatus);
  } catch (err) {
    console.error("Ошибка при получении статуса конвертации:", err);
    res.status(500).json({ message: err.message });
  }
});

// Получить фильмы категории trending
router.get("/category/trending", async (req, res) => {
  try {
    const movies = await Movie.find({ type: "trending" });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получить фильмы категории popular
router.get("/category/popular", async (req, res) => {
  try {
    const movies = await Movie.find({ type: "popular" });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получить фильмы категории newReleases
router.get("/category/newReleases", async (req, res) => {
  try {
    const movies = await Movie.find({ type: "newReleases" });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Общий маршрут для получения фильмов по категории
router.get("/category/:type", async (req, res) => {
  try {
    const movies = await Movie.find({ type: req.params.type });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получить фильм по ID
router.get("/:id", getMovie, (req, res) => {
  res.json(res.movie);
});

// Маршрут для конвертации видео (только для админов)
router.post("/:id/convert", protect, adminOnly, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: "Фильм не найден" });
    }

    if (!movie.videos || !movie.videos.fhd) {
      return res.status(404).json({ message: "Видео для фильма не найдено" });
    }

    // Полный путь к исходному видеофайлу (1080p)
    const inputPath = path.join(__dirname, "../", movie.videos.fhd);

    // Создаем директорию для конвертированных файлов
    const outputDir = path.join(__dirname, "../videos/converted");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Отправляем статус 202 (Accepted), чтобы клиент не ждал завершения конвертации
    res.status(202).json({
      message: "Процесс конвертации начат",
      status: "processing",
      videoSource: movie.videos.fhd,
    });

    // Конвертация в HD (720p)
    const hdFilename = `${movie._id}_hd.mp4`;
    const hdOutputPath = path.join(outputDir, hdFilename);
    const sdFilename = `${movie._id}_sd.mp4`;
    const sdOutputPath = path.join(outputDir, sdFilename);

    // Функция для последовательного выполнения конвертации
    const convertToHD = () => {
      return new Promise((resolve, reject) => {
        console.log("Начало конвертации в HD (720p)...");
        ffmpeg(inputPath)
          .output(hdOutputPath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size("1280x720") // HD размер
          .format("mp4")
          .outputOptions([
            "-movflags frag_keyframe+empty_moov",
            "-crf 22",
            "-preset medium",
          ])
          .on("progress", function (progress) {
            console.log(`Прогресс HD: ${progress.percent}% выполнено`);
          })
          .on("error", function (err) {
            console.error("Ошибка при конвертации в HD:", err);
            reject(err);
          })
          .on("end", function () {
            console.log("Конвертация в HD завершена");
            movie.videos.hd = `videos/converted/${hdFilename}`;
            resolve();
          })
          .run();
      });
    };

    // Конвертация в SD (480p)
    const convertToSD = () => {
      return new Promise((resolve, reject) => {
        console.log("Начало конвертации в SD (480p)...");
        ffmpeg(inputPath)
          .output(sdOutputPath)
          .videoCodec("libx264")
          .audioCodec("aac")
          .size("854x480") // SD размер
          .format("mp4")
          .outputOptions([
            "-movflags frag_keyframe+empty_moov",
            "-crf 23",
            "-preset medium",
          ])
          .on("progress", function (progress) {
            console.log(`Прогресс SD: ${progress.percent}% выполнено`);
          })
          .on("error", function (err) {
            console.error("Ошибка при конвертации в SD:", err);
            reject(err);
          })
          .on("end", function () {
            console.log("Конвертация в SD завершена");
            movie.videos.sd = `videos/converted/${sdFilename}`;
            resolve();
          })
          .run();
      });
    };

    // Последовательно конвертируем видео и обновляем базу данных
    (async () => {
      try {
        await convertToHD();
        await convertToSD();

        // Сохраняем исходный FHD файл как есть
        // Исходный FHD файл остается неизменным, используется загруженный файл

        // Обновляем информацию о фильме в базе данных
        await movie.save();

        console.log(
          "Все конвертации завершены и информация о фильме обновлена"
        );
      } catch (err) {
        console.error("Ошибка при конвертации видео:", err);
      }
    })();
  } catch (err) {
    console.error("Ошибка:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  }
});

// Маршрут для стриминга видео по ID фильма
router.get("/:id/stream", async (req, res) => {
  try {
    // Добавляем логирование для отладки
    console.log(
      `Запрос на стриминг фильма ${req.params.id}, качество: ${
        req.query.quality || "не указано"
      }`
    );

    // Устанавливаем заголовки для предотвращения кэширования
    res.set({
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });

    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      console.error(`Фильм с ID ${req.params.id} не найден в базе данных`);
      return res.status(404).json({ 
        message: "Фильм не найден",
        error: "MOVIE_NOT_FOUND",
        movieId: req.params.id
      });
    }

    // Получаем запрошенное качество из query параметра
    const quality = req.query.quality || "hd"; // По умолчанию HD

    console.log(`Доступные версии: ${JSON.stringify(movie.videos)}`);

    // Определяем путь к видео нужного качества
    let videoPath;
    let selectedQuality = quality;

    if (movie.videos && movie.videos[quality]) {
      // Если есть видео запрошенного качества
      videoPath = movie.videos[quality];
      console.log(`Выбрано запрошенное качество ${quality}: ${videoPath}`);
    } else if (movie.videos && movie.videos.fhd) {
      // Если нет запрошенного качества, но есть полное качество 1080p
      videoPath = movie.videos.fhd;
      selectedQuality = "fhd";
      console.log(
        `Качество ${quality} недоступно, используется FHD: ${videoPath}`
      );
    } else {
      console.log(
        `Видео для фильма не найдено: ${JSON.stringify(movie.videos)}`
      );
      return res.status(404).json({ 
        message: "Видео для фильма не найдено",
        error: "VIDEO_NOT_FOUND",
        movieId: req.params.id,
        requestedQuality: quality,
        availableQualities: movie.videos ? Object.keys(movie.videos).filter(k => movie.videos[k]) : []
      });
    }

    // Полный путь к видеофайлу
    const fullVideoPath = path.join(__dirname, "../", videoPath);
    console.log(`Полный путь к файлу: ${fullVideoPath}`);

    // Проверяем существование файла
    if (!fs.existsSync(fullVideoPath)) {
      console.error(`Файл не найден на сервере: ${fullVideoPath}`);
      return res
        .status(404)
        .json({ 
          message: "Видеофайл не найден на сервере",
          error: "FILE_NOT_FOUND",
          movieId: req.params.id,
          videoPath: videoPath,
          fullPath: fullVideoPath
        });
    }

    const stat = fs.statSync(fullVideoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    console.log(
      `Размер файла: ${fileSize} байт, заголовок Range: ${
        range || "отсутствует"
      }`
    );

    // Определяем MIME-тип на основе расширения файла
    const ext = path.extname(fullVideoPath).toLowerCase();
    let contentType = "video/mp4"; // По умолчанию

    if (ext === ".avi") contentType = "video/x-msvideo";
    else if (ext === ".mkv") contentType = "video/x-matroska";
    else if (ext === ".webm") contentType = "video/webm";
    else if (ext === ".mov") contentType = "video/quicktime";
    else if (ext === ".wmv") contentType = "video/x-ms-wmv";

    // Добавляем информацию о выбранном качестве в заголовки ответа
    const customHeaders = {
      "X-Video-Quality": selectedQuality,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    };

    if (range) {
      // Парсим параметр Range в запросе
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(fullVideoPath, { start, end });
      const head = {
        ...customHeaders,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunksize,
      };

      console.log(
        `Отправка частичного контента, диапазон: ${start}-${end}/${fileSize}`
      );
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Если клиент не запрашивает диапазон, отправляем весь файл
      const head = {
        ...customHeaders,
        "Content-Length": fileSize,
      };

      console.log(`Отправка полного файла, размер: ${fileSize}`);
      res.writeHead(200, head);
      fs.createReadStream(fullVideoPath).pipe(res);
    }
  } catch (err) {
    console.error("Ошибка при стриминге видео:", err);
    res.status(500).json({ message: err.message });
  }
});

// Добавить новый фильм (только для админов)
router.post("/", protect, adminOnly, async (req, res) => {
  const movie = new Movie(req.body);

  try {
    const newMovie = await movie.save();
    res.status(201).json(newMovie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Обновить фильм (только для админов)
router.patch("/:id", protect, adminOnly, getMovie, async (req, res) => {
  Object.keys(req.body).forEach((key) => {
    res.movie[key] = req.body[key];
  });

  try {
    const updatedMovie = await res.movie.save();
    res.json(updatedMovie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Удалить фильм (только для админов)
router.delete("/:id", protect, adminOnly, getMovie, async (req, res) => {
  try {
    await res.movie.deleteOne();
    res.json({ message: "Фильм удален" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Маршрут для загрузки видео (только для админов)
router.post(
  "/:id/upload",
  protect,
  adminOnly,
  upload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не был загружен" });
      }

      const movie = await Movie.findById(req.params.id);
      if (!movie) {
        // Удаляем загруженный файл, если фильм не найден
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "Фильм не найден" });
      }

      // Генерируем относительный путь к файлу
      const relativePath = path
        .relative(path.join(__dirname, ".."), req.file.path)
        .replace(/\\/g, "/");

      // Инициализируем структуру videos, если она не существует
      if (!movie.videos) {
        movie.videos = {
          fhd: null,
          hd: null,
          sd: null,
        };
      }

      // Устанавливаем путь к видео полного качества (1080p)
      movie.videos.fhd = relativePath;

      const updatedMovie = await movie.save();

      res.status(200).json(updatedMovie);
    } catch (err) {
      console.error("Ошибка при загрузке видео:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Middleware для получения фильма по ID
async function getMovie(req, res, next) {
  let movie;
  try {
    movie = await Movie.findById(req.params.id);
    if (movie == null) {
      console.error(`Фильм с ID ${req.params.id} не найден в базе данных`);
      return res.status(404).json({ 
        message: "Фильм не найден",
        error: "MOVIE_NOT_FOUND",
        movieId: req.params.id
      });
    }
  } catch (err) {
    console.error(`Ошибка при поиске фильма с ID ${req.params.id}:`, err);
    return res.status(500).json({ 
      message: "Ошибка сервера при поиске фильма",
      error: "DATABASE_ERROR",
      movieId: req.params.id
    });
  }

  res.movie = movie;
  next();
}

module.exports = router;

const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

// Устанавливаем путь к ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Путь к тестовому видео
const inputPath = path.join(__dirname, "videos/local", "BRAT_1080.avi");

// Проверяем существование файла
if (!fs.existsSync(inputPath)) {
  console.error(`Ошибка: Файл ${inputPath} не найден`);
  process.exit(1);
}

// Директория для конвертированных файлов
const outputDir = path.join(__dirname, "videos", "converted");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Тестовое ID фильма
const testMovieId = "test123";

// Тестовый объект фильма для вывода результатов
const testMovie = {
  _id: testMovieId,
  videos: {
    fhd: `videos/${path.basename(inputPath)}`,
    hd: null,
    sd: null,
  },
};

// Качества для конвертации
const qualities = [
  {
    name: "hd",
    size: "1280x720",
    filename: `${testMovieId}_hd.mp4`,
    crf: 22,
  },
  {
    name: "sd",
    size: "854x480",
    filename: `${testMovieId}_sd.mp4`,
    crf: 23,
  },
];

// Функция для конвертации видео
function convertVideo(quality) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, quality.filename);

    console.log(
      `Начало конвертации в ${quality.name.toUpperCase()} (${quality.size})...`
    );

    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .size(quality.size)
      .format("mp4")
      .outputOptions([
        "-movflags frag_keyframe+empty_moov",
        `-crf ${quality.crf}`,
        "-preset medium",
      ])
      .on("progress", function (progress) {
        console.log(
          `Прогресс ${quality.name.toUpperCase()}: ${Math.round(
            progress.percent || 0
          )}% выполнено`
        );
      })
      .on("error", function (err) {
        console.error(
          `Ошибка при конвертации в ${quality.name.toUpperCase()}:`,
          err
        );
        reject(err);
      })
      .on("end", function () {
        console.log(
          `Конвертация в ${quality.name.toUpperCase()} завершена. Файл: ${outputPath}`
        );

        // Получить информацию о размере файла
        const stats = fs.statSync(outputPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`Размер файла: ${fileSizeMB} МБ`);

        // Обновляем тестовый объект фильма
        testMovie.videos[quality.name] = `videos/converted/${quality.filename}`;

        resolve({
          quality: quality.name,
          path: outputPath,
          size: fileSizeMB,
        });
      })
      .run();
  });
}

// Последовательно конвертируем видео во все качества
async function runConversions() {
  console.log("Начинаем последовательную конвертацию видео во все качества...");
  console.log("Исходное видео 1080p:", testMovie.videos.fhd);

  try {
    for (const quality of qualities) {
      await convertVideo(quality);
    }
    console.log("Все конвертации завершены успешно!");
    console.log("Результат:", JSON.stringify(testMovie.videos, null, 2));
  } catch (err) {
    console.error("Ошибка при выполнении конвертаций:", err);
  }
}

// Запуск процесса конвертации
runConversions();

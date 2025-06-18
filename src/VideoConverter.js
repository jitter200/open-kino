import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUpload,
  FaVideo,
  FaExclamationTriangle,
  FaSync,
  FaFolderOpen,
  FaPlus,
  FaDatabase,
} from "react-icons/fa";
import { useAuth } from "../auth";

const VideoConverter = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localVideos, setLocalVideos] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({ status: "idle" });
  const { token } = useAuth();

  useEffect(() => {
    // Загрузка фильмов при монтировании компонента
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/movies");
      setMovies(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Ошибка при загрузке фильмов:", err);
      setError("Не удалось загрузить список фильмов");
      setLoading(false);
    }
  };

  const fetchLocalVideos = async () => {
    try {
      setLoading(true);
      // Временно убираем заголовки авторизации для тестирования
      const response = await axios.get("/api/movies/local-videos");
      setLocalVideos(response.data.videos);
      setLoading(false);
    } catch (err) {
      console.error("Ошибка при загрузке локальных видео:", err);
      setError("Не удалось загрузить список локальных видео");
      setLoading(false);
    }
  };

  const handleConvertVideo = async () => {
    if (!selectedMovie || !selectedVideo) {
      alert("Пожалуйста, выберите фильм и видео для конвертации");
      return;
    }

    try {
      setProcessingStatus({
        status: "processing",
        progress: 0,
        message: "Начинаем обработку видео...",
      });

      // Временно убираем заголовки авторизации для тестирования
      const response = await axios.post(`/api/movies/convert-local-video`, {
        movieId: selectedMovie._id,
        videoPath: selectedVideo,
      });

      // Начинаем опрос статуса конвертации
      const statusCheckInterval = setInterval(async () => {
        try {
          // Временно убираем заголовки авторизации для тестирования
          const statusResponse = await axios.get(
            `/api/movies/conversion-status/${response.data.conversionId}`
          );

          const status = statusResponse.data;

          // Обновляем статус процесса
          setProcessingStatus(status);

          // Если процесс завершен или произошла ошибка, останавливаем опрос
          if (status.status === "completed" || status.status === "error") {
            clearInterval(statusCheckInterval);

            if (status.status === "completed") {
              // Обновляем список фильмов после успешной конвертации
              fetchMovies();
            }
          }
        } catch (err) {
          console.error("Ошибка при проверке статуса конвертации:", err);
          clearInterval(statusCheckInterval);
          setProcessingStatus({
            status: "error",
            message: "Ошибка при проверке статуса конвертации",
          });
        }
      }, 3000); // Проверяем каждые 3 секунды
    } catch (err) {
      console.error("Ошибка при запуске конвертации:", err);
      setProcessingStatus({
        status: "error",
        message: `Ошибка при запуске конвертации: ${err.message}`,
      });
    }
  };

  const addNewMovie = async () => {
    try {
      const movieDetails = {
        title: "Новый фильм",
        description: "Добавьте описание фильма",
        poster: "/assets/default_poster.jpg",
        genres: "Добавьте жанры",
        year: new Date().getFullYear().toString(),
        duration: "0ч 0м",
      };

      // Временно убираем заголовки авторизации для тестирования
      const response = await axios.post("/api/movies", movieDetails);

      alert(
        "Новый фильм создан! Теперь вы можете выбрать его для конвертации."
      );
      fetchMovies();
      setSelectedMovie(response.data);
    } catch (err) {
      console.error("Ошибка при создании нового фильма:", err);
      alert(`Ошибка при создании фильма: ${err.message}`);
    }
  };

  // Рендеринг статуса обработки
  const renderProcessingStatus = () => {
    switch (processingStatus.status) {
      case "idle":
        return null;
      case "processing":
        return (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <FaSync className="animate-spin mr-2" />
              <span>Обработка видео: {processingStatus.message}</span>
            </div>
            {processingStatus.progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${processingStatus.progress}%` }}
                  ></div>
                </div>
                <div className="text-xs mt-1 text-gray-400">
                  {processingStatus.progress}% завершено
                </div>
              </div>
            )}
          </div>
        );
      case "completed":
        return (
          <div className="mt-4 p-4 bg-green-900 rounded-lg">
            <p>Конвертация успешно завершена!</p>
            <p className="text-sm text-gray-300 mt-1">
              {processingStatus.message}
            </p>
          </div>
        );
      case "error":
        return (
          <div className="mt-4 p-4 bg-red-900 rounded-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <span>Ошибка при обработке видео</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              {processingStatus.message}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-dark p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-netflix-dark p-8 flex flex-col items-center justify-center text-white">
        <FaExclamationTriangle size={48} className="text-red-600 mb-4" />
        <h1 className="text-2xl mb-4">Ошибка</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-dark p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Конвертация видеофайлов</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Левая колонка: выбор фильма */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Шаг 1: Выберите фильм</h2>

          <div className="mb-4">
            <button
              onClick={addNewMovie}
              className="px-4 py-2 bg-green-700 hover:bg-green-600 rounded-md flex items-center"
            >
              <FaPlus className="mr-2" />
              Создать новый фильм
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {movies.length === 0 ? (
              <p className="text-gray-400">
                Фильмы не найдены. Создайте новый фильм.
              </p>
            ) : (
              <ul className="space-y-2">
                {movies.map((movie) => (
                  <li
                    key={movie._id}
                    className={`p-3 rounded cursor-pointer flex items-center ${
                      selectedMovie && selectedMovie._id === movie._id
                        ? "bg-red-900"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedMovie(movie)}
                  >
                    {movie.poster && (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-12 h-16 object-cover mr-3 rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-medium">{movie.title}</h3>
                      <p className="text-sm text-gray-400">{movie.year}</p>
                      {movie.videos && movie.videos.fhd ? (
                        <p className="text-xs text-green-500 mt-1">
                          Видео загружено
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Видео отсутствует
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Правая колонка: выбор локального видео */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            Шаг 2: Выберите локальное видео
          </h2>

          <div className="mb-4">
            <button
              onClick={fetchLocalVideos}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-md flex items-center"
            >
              <FaFolderOpen className="mr-2" />
              Показать локальные видео
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {localVideos.length === 0 ? (
              <p className="text-gray-400">
                Нет доступных видеофайлов. Загрузите файлы в папку
                'videos/local' на сервере.
              </p>
            ) : (
              <ul className="space-y-2">
                {localVideos.map((video, index) => (
                  <li
                    key={index}
                    className={`p-3 rounded cursor-pointer flex items-center ${
                      selectedVideo === video
                        ? "bg-blue-900"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <FaVideo className="mr-3 text-gray-400" />
                    <div>
                      <p className="text-sm">{video.split("/").pop()}</p>
                      <p className="text-xs text-gray-500">Путь: {video}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Выбранные элементы и кнопка конвертации */}
      <div className="mt-8 bg-gray-900 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Шаг 3: Запустите конвертацию</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-sm text-gray-400 mb-2">Выбранный фильм:</h3>
            {selectedMovie ? (
              <div className="p-3 bg-gray-800 rounded flex items-center">
                {selectedMovie.poster && (
                  <img
                    src={selectedMovie.poster}
                    alt={selectedMovie.title}
                    className="w-10 h-14 object-cover mr-3 rounded"
                  />
                )}
                <div>
                  <p className="font-medium">{selectedMovie.title}</p>
                  <p className="text-xs text-gray-400">{selectedMovie.year}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Фильм не выбран</p>
            )}
          </div>

          <div>
            <h3 className="text-sm text-gray-400 mb-2">Выбранное видео:</h3>
            {selectedVideo ? (
              <div className="p-3 bg-gray-800 rounded flex items-center">
                <FaVideo className="mr-3 text-gray-400" />
                <p className="text-sm overflow-hidden overflow-ellipsis">
                  {selectedVideo.split("/").pop()}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">Видео не выбрано</p>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleConvertVideo}
            disabled={
              !selectedMovie ||
              !selectedVideo ||
              processingStatus.status === "processing"
            }
            className={`px-6 py-3 rounded-md flex items-center text-lg font-bold ${
              !selectedMovie ||
              !selectedVideo ||
              processingStatus.status === "processing"
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {processingStatus.status === "processing" ? (
              <>
                <FaSync className="mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <FaDatabase className="mr-2" />
                Конвертировать и добавить в базу данных
              </>
            )}
          </button>
        </div>

        {renderProcessingStatus()}
      </div>
    </div>
  );
};

export default VideoConverter;

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaExclamationTriangle,
  FaSync,
  FaCheck,
  FaPlay,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const ManageVideos = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [converting, setConverting] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const navigate = useNavigate();
  const { token } = useAuth();

  // Загрузка всех фильмов
  useEffect(() => {
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

    fetchMovies();
  }, []);

  // Функция для запуска конвертации видео
  const handleConvertVideo = async (movieId) => {
    try {
      setConverting((prev) => ({ ...prev, [movieId]: true }));

      const response = await axios.post(
        `/api/movies/${movieId}/convert`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Обновляем состояние, чтобы показать, что конвертация запущена
      console.log("Начата конвертация:", response.data);

      // Периодически проверяем статус конвертации (можно реализовать через вебсокеты или другим методом)
      const checkInterval = setInterval(async () => {
        try {
          const movieResponse = await axios.get(`/api/movies/${movieId}`);
          const updatedMovie = movieResponse.data;

          // Проверяем, обновился ли путь к видео
          if (
            updatedMovie.videoPath &&
            updatedMovie.videoPath.includes("converted")
          ) {
            clearInterval(checkInterval);
            setConverting((prev) => ({ ...prev, [movieId]: false }));

            // Обновляем фильм в локальном состоянии
            setMovies((prevMovies) =>
              prevMovies.map((movie) =>
                movie._id === movieId ? updatedMovie : movie
              )
            );
          }
        } catch (err) {
          console.error("Ошибка при проверке статуса конвертации:", err);
        }
      }, 10000); // Проверяем каждые 10 секунд

      // Очищаем интервал при размонтировании компонента
      return () => clearInterval(checkInterval);
    } catch (err) {
      console.error("Ошибка при запуске конвертации:", err);
      setConverting((prev) => ({ ...prev, [movieId]: false }));
      alert(`Ошибка при запуске конвертации: ${err.message}`);
    }
  };

  // Функция для загрузки нового видеофайла
  const handleFileUpload = async (movieId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверка размера файла
    if (file.size > 1024 * 1024 * 500) {
      // 500 МБ
      alert("Файл слишком большой. Максимальный размер 500 МБ.");
      return;
    }

    // Проверка типа файла
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/x-msvideo",
      "video/quicktime",
      "video/x-matroska",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert(
        "Недопустимый тип файла. Поддерживаются только MP4, AVI, MOV и MKV."
      );
      return;
    }

    try {
      setUploadStatus((prev) => ({
        ...prev,
        [movieId]: { progress: 0, uploading: true },
      }));

      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append("video", file);

      // Отправляем файл на сервер с отслеживанием прогресса
      const response = await axios.post(
        `/api/movies/${movieId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadStatus((prev) => ({
              ...prev,
              [movieId]: { progress, uploading: true },
            }));
          },
        }
      );

      // Обновляем состояние после успешной загрузки
      setUploadStatus((prev) => ({
        ...prev,
        [movieId]: { progress: 100, uploading: false },
      }));

      // Обновляем фильм в локальном состоянии
      const updatedMovie = response.data;
      setMovies((prevMovies) =>
        prevMovies.map((movie) =>
          movie._id === movieId ? updatedMovie : movie
        )
      );

      alert("Видео успешно загружено!");
    } catch (err) {
      console.error("Ошибка при загрузке видео:", err);
      setUploadStatus((prev) => ({
        ...prev,
        [movieId]: { progress: 0, uploading: false },
      }));
      alert(`Ошибка при загрузке видео: ${err.message}`);
    }
  };

  // Функция для проверки и отображения видео
  const handlePreviewVideo = (movieId) => {
    navigate(`/watch/${movieId}`);
  };

  // Проверка наличия видео у фильма
  const hasVideo = (movie) => {
    return movie.videos && movie.videos.fhd;
  };

  // Проверка, есть ли хотя бы одно конвертированное видео
  const hasConvertedVideos = (movie) => {
    return movie.videos && (movie.videos.hd || movie.videos.sd);
  };

  // Проверка, нужна ли конвертация (есть 1080p, но нет всех качеств)
  const needsConversion = (movie) => {
    return hasVideo(movie) && 
           (!movie.videos.hd || !movie.videos.sd);
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
    <div className="min-h-screen bg-netflix-dark p-8">
      <h1 className="text-white text-3xl font-bold mb-8">
        Управление видеофайлами
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-white">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4">Постер</th>
              <th className="p-4">Название</th>
              <th className="p-4">Статус видео</th>
              <th className="p-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie._id} className="border-b border-gray-700">
                <td className="p-4">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-20 h-28 object-cover"
                  />
                </td>
                <td className="p-4">
                  <div className="font-semibold">{movie.title}</div>
                  <div className="text-sm text-gray-400">{movie.year}</div>
                </td>
                <td className="p-4">
                  {hasVideo(movie) ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <FaCheck className="text-green-500 mr-2" />
                        <span>
                          {hasConvertedVideos(movie)
                            ? "Видео в нескольких качествах"
                            : "Видео 1080p загружено"}
                        </span>
                      </div>

                      {/* Статус разных качеств */}
                      {movie.videos && (
                        <div className="text-xs mt-1 ml-6 text-gray-400">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <div className="flex items-center">
                              <span className="w-16">1080p:</span>
                              {movie.videos.fhd ? (
                                <span className="text-green-500 ml-1">✓</span>
                              ) : (
                                <span className="text-red-500 ml-1">✗</span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className="w-16">HD (720p):</span>
                              {movie.videos.hd ? (
                                <span className="text-green-500 ml-1">✓</span>
                              ) : (
                                <span className="text-red-500 ml-1">✗</span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className="w-16">SD (480p):</span>
                              {movie.videos.sd ? (
                                <span className="text-green-500 ml-1">✓</span>
                              ) : (
                                <span className="text-red-500 ml-1">✗</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <FaTimes className="text-red-500 mr-2" />
                      <span>Видео не загружено</span>
                    </div>
                  )}

                  {uploadStatus[movie._id]?.uploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${uploadStatus[movie._id].progress}%`,
                          }}
                        ></div>
                      </div>
                      <div className="text-xs mt-1">
                        {uploadStatus[movie._id].progress}% загружено
                      </div>
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {hasVideo(movie) && (
                      <button
                        onClick={() => handlePreviewVideo(movie._id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
                      >
                        <FaPlay className="mr-1" size={12} />
                        <span>Просмотр</span>
                      </button>
                    )}

                    {/* Показываем кнопку конвертации, если есть 1080p, но нет хотя бы одного из конвертированных качеств */}
                    {needsConversion(movie) && (
                      <button
                        onClick={() => handleConvertVideo(movie._id)}
                        disabled={converting[movie._id]}
                        className={`px-3 py-1 ${
                          converting[movie._id]
                            ? "bg-gray-600"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        } rounded-md flex items-center`}
                      >
                        {converting[movie._id] ? (
                          <>
                            <FaSync className="mr-1 animate-spin" size={12} />
                            <span>Конвертация...</span>
                          </>
                        ) : (
                          <>
                            <FaSync className="mr-1" size={12} />
                            <span>Конвертировать</span>
                          </>
                        )}
                      </button>
                    )}

                    <label className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md flex items-center cursor-pointer">
                      <FaUpload className="mr-1" size={12} />
                      <span>
                        {hasVideo(movie) ? "Заменить видео" : "Загрузить видео"}
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleFileUpload(movie._id, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageVideos;

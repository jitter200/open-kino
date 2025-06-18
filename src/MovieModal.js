import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlay,
  FaPlus,
  FaThumbsUp,
  FaThumbsDown,
  FaTimes,
  FaVolumeMute,
  FaVolumeUp,
  FaCheck,
  FaStar,
  FaShare,
  FaDownload,
} from "react-icons/fa";
import { useWatchlist } from "../contexts/WatchlistContext";
import VideoPlayer from "./VideoPlayer";

const MovieModal = ({ movie, onClose }) => {
  const modalRef = useRef();
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  // Генерируем процент match один раз при открытии модального окна
  const matchPercent = useMemo(
    () => Math.floor(Math.random() * 31) + 70,
    [movie._id]
  );

  // Запускаем анимацию после монтирования
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    // Запретить прокрутку на основной странице
    document.body.style.overflow = "hidden";
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Восстановить прокрутку
      document.body.style.overflow = "unset";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleAddToList = async () => {
    console.log("---КЛИК ПО КНОПКЕ В МОДАЛЬНОМ ОКНЕ---");
    console.log(
      'Кнопка "Добавить в список" нажата в модальном окне для фильма:',
      movie.title,
      movie._id
    );

    if (!movie || !movie._id) {
      console.error("ОШИБКА: Фильм не содержит _id:", movie);
      alert("Ошибка: фильм не содержит идентификатор");
      return;
    }

    try {
      // Преобразуем ID в строку для корректного сравнения
      const movieIdStr = String(movie._id);
      console.log("ID фильма (строка):", movieIdStr);
      const inWatchlist = isInWatchlist(movieIdStr);
      console.log("Фильм уже в списке?", inWatchlist);

      if (inWatchlist) {
        console.log(
          "УДАЛЕНИЕ: Выполняем удаление фильма из списка:",
          movieIdStr
        );
        await removeFromWatchlist(movieIdStr);
        console.log("УДАЛЕНИЕ: Фильм удален из списка");
        // Вызываем ререндер компонента
        setIsMuted((prev) => prev); // Используем любой setState для обновления UI
      } else {
        console.log(
          "ДОБАВЛЕНИЕ: Выполняем добавление фильма в список:",
          movieIdStr
        );
        await addToWatchlist(movie);
        console.log("ДОБАВЛЕНИЕ: Фильм добавлен в список");
        // Вызываем ререндер компонента
        setIsMuted((prev) => prev); // Используем любой setState для обновления UI
      }
    } catch (error) {
      console.error("ОШИБКА при работе со списком:", error);
      alert("Произошла ошибка при добавлении/удалении фильма из списка");
    }
  };

  const handlePlayInFullscreen = () => {
    onClose(); // Закрываем модальное окно
    navigate(`/watch/${movie._id}`); // Перенаправляем на страницу просмотра
  };

  const handleCloseVideo = () => {
    setIsPlayingVideo(false);
  };

  if (!movie) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 transition-opacity duration-200 ${
        animate ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        ref={modalRef}
        className={`relative bg-netflix-dark mx-auto w-full max-w-5xl max-h-[90vh] rounded-md overflow-auto scrollbar-hide shadow-2xl transition-transform duration-300 ${
          animate ? "scale-100" : "scale-95"
        }`}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 rounded-full hover:bg-black/60 transition"
          onClick={handleClose}
        >
          <FaTimes className="text-white" size={22} />
        </button>

        {/* Video/Trailer section */}
        <div className="relative h-[50vh]">
          {isPlayingVideo ? (
            <VideoPlayer
              movieId={movie._id}
              poster={movie.poster}
              onClose={handleCloseVideo}
            />
          ) : (
            <>
              {/* Preview Image until video loads */}
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />

              {/* Overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-netflix-dark"></div>

              {/* Video Controls */}
              <div className="absolute bottom-6 right-6 flex items-center space-x-3">
                <button
                  className="p-3 bg-black/50 rounded-full hover:bg-black/70 transition"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <FaVolumeMute className="text-white" size={18} />
                  ) : (
                    <FaVolumeUp className="text-white" size={18} />
                  )}
                </button>
              </div>

              {/* Content overlay */}
              <div className="absolute bottom-20 left-6 lg:left-10 z-10 max-w-3xl">
                <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-3 text-shadow-lg tracking-tight">
                  {movie.title}
                </h1>
                <div className="flex items-center gap-3 mb-5 text-base">
                  <span className="text-green-500 font-bold">
                    {matchPercent}% match
                  </span>
                  <span className="text-netflix-light-gray">{movie.year}</span>
                  <span className="border border-netflix-light-gray px-1.5 py-0.5 text-sm text-netflix-light-gray">
                    {movie.rating}
                  </span>
                  <span className="text-netflix-light-gray">
                    {movie.duration}
                  </span>
                  <span className="text-netflix-light-gray border border-netflix-light-gray px-1.5 py-0.5 text-sm">
                    {movie.quality}
                  </span>
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-wrap gap-3 lg:gap-5 mb-6">
                  <button
                    className="btn-primary text-base font-medium"
                    onClick={handlePlayInFullscreen}
                  >
                    <FaPlay className="mr-2" size={18} />
                    <span>Смотреть</span>
                  </button>
                  <button
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition transform hover:scale-105"
                    onClick={handleAddToList}
                    title={
                      isInWatchlist(String(movie._id))
                        ? "Удалить из 'Моего списка'"
                        : "Добавить в 'Мой список'"
                    }
                  >
                    {isInWatchlist(String(movie._id)) ? (
                      <FaCheck size={22} className="text-white" />
                    ) : (
                      <FaPlus size={22} className="text-white" />
                    )}
                  </button>
                  <button className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition">
                    <FaThumbsUp size={22} className="text-white" />
                  </button>
                  <button className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition">
                    <FaThumbsDown size={22} className="text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content Section - только если не воспроизводится видео */}
        {!isPlayingVideo && (
          <div className="p-7 lg:p-12 bg-netflix-dark text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column - Description */}
              <div className="md:col-span-2">
                <p className="text-xl text-white leading-relaxed mb-6 font-light tracking-wide">
                  {movie.description}
                </p>

                {/* Tags/Genres */}
                <div className="flex flex-wrap gap-2.5 mt-5 mb-6">
                  {movie.genres.split(", ").map((genre, index) => (
                    <span
                      key={index}
                      className="px-4 py-1.5 bg-netflix-dark-gray rounded-full text-base text-netflix-light-gray font-medium tracking-wide"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4 text-base">
                <div className="mb-3">
                  <span className="text-netflix-light-gray font-semibold tracking-wide">
                    В ролях:
                  </span>{" "}
                  <span className="text-white font-light tracking-wide">
                    {movie.cast}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-netflix-light-gray font-semibold tracking-wide">
                    Режиссер:
                  </span>{" "}
                  <span className="text-white font-light tracking-wide">
                    {movie.director}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-netflix-light-gray font-semibold tracking-wide">
                    Год выпуска:
                  </span>{" "}
                  <span className="text-white font-light tracking-wide">
                    {movie.year}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-netflix-light-gray font-semibold tracking-wide">
                    Качество:
                  </span>{" "}
                  <span className="text-white font-light tracking-wide">
                    {movie.quality}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-netflix-light-gray font-semibold tracking-wide">
                    Возрастной рейтинг:
                  </span>{" "}
                  <span className="text-white font-light tracking-wide">
                    {movie.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="flex mt-10 pt-7 border-t border-gray-800 gap-8 text-netflix-light-gray">
              <div className="flex flex-col items-center gap-2">
                <button className="hover:text-white transition p-1">
                  <FaStar size={24} />
                </button>
                <span className="text-sm font-medium">Оценить</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button className="hover:text-white transition p-1">
                  <FaShare size={24} />
                </button>
                <span className="text-sm font-medium">Поделиться</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button className="hover:text-white transition p-1">
                  <FaDownload size={24} />
                </button>
                <span className="text-sm font-medium">Скачать</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieModal;

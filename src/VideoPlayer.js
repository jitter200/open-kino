import React, { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaForward,
  FaBackward,
  FaCog,
} from "react-icons/fa";

const VideoPlayer = ({ movieId, poster, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState("fhd"); // FHD (1080p) по умолчанию
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [videoKey, setVideoKey] = useState(Date.now()); // Уникальный ключ для видео, который будет меняться при смене качества
  const controlsTimeoutRef = useRef(null);

  // URL для стриминга видео с параметром качества и случайным числом для предотвращения кэширования
  const videoUrl = `/api/movies/${movieId}/stream?quality=${selectedQuality}&nocache=${videoKey}`;

  // Доступные качества видео
  const availableQualities = [
    { value: "sd", label: "480p" },
    { value: "hd", label: "720p" },
    { value: "fhd", label: "1080p" },
  ];

  // Показать элементы управления при движении мыши и скрыть через 3 секунды
  const showControls = () => {
    setControlsVisible(true);

    // Очистить предыдущий таймаут, если он существует
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Установить новый таймаут
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showQualityOptions) {
        setControlsVisible(false);
      }
    }, 3000);
  };

  // Функция для изменения качества видео
  const changeQuality = (quality) => {
    console.log(`Изменение качества с ${selectedQuality} на ${quality}`);

    // Если выбрано то же самое качество - ничего не делаем
    if (quality === selectedQuality) {
      setShowQualityOptions(false);
      return;
    }

    // Запоминаем текущую позицию видео
    const currentPosition = videoRef.current.currentTime;
    const wasPlaying = isPlaying;

    // Приостанавливаем воспроизведение
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    // Обновляем качество и генерируем новый ключ для принудительной перезагрузки видео
    setSelectedQuality(quality);
    setVideoKey(Date.now());

    // Закрываем меню качества
    setShowQualityOptions(false);

    // Устанавливаем флаг загрузки, пока видео не перезагрузится
    setLoading(true);

    // Выводим в консоль новый URL для отладки
    console.log(`Новый URL видео: ${videoUrl}`);

    // После изменения источника видео и перезагрузки,
    // восстанавливаем позицию и воспроизведение
    const handleLoaded = () => {
      console.log(
        `Видео загружено в новом качестве ${quality}, восстанавливаем позицию ${currentPosition}`
      );

      // Восстанавливаем позицию
      videoRef.current.currentTime = currentPosition;
      setLoading(false);

      // Если видео играло до смены качества, продолжаем воспроизведение
      if (wasPlaying) {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            console.log("Воспроизведение возобновлено");
          })
          .catch((error) => {
            console.error("Ошибка при возобновлении воспроизведения:", error);
            setIsPlaying(false);
          });
      }
    };

    // Удаляем предыдущий обработчик, если он существует
    videoRef.current.removeEventListener("loadeddata", handleLoaded);

    // Добавляем обработчик события loadeddata, который сработает после загрузки видео
    videoRef.current.addEventListener("loadeddata", handleLoaded);
  };

  // Обработчики событий видео
  const handleLoadedMetadata = () => {
    const videoDuration = videoRef.current.duration;
    console.log(`Метаданные видео загружены: длительность ${videoDuration}с`);

    // Дождемся, пока длительность станет доступна
    if (
      isNaN(videoDuration) ||
      !isFinite(videoDuration) ||
      videoDuration <= 0
    ) {
      console.warn("Длительность видео еще не доступна, ждем...");

      // Создаем функцию проверки длительности
      const checkDuration = () => {
        const newDuration = videoRef.current.duration;
        if (!isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
          console.log(`Длительность получена: ${newDuration}с`);
          setDuration(newDuration);
          videoRef.current.removeEventListener("durationchange", checkDuration);
        }
      };

      // Добавляем слушатель события изменения длительности
      videoRef.current.addEventListener("durationchange", checkDuration);
    } else {
      setDuration(videoDuration);
    }

    setLoading(false);
  };

  const handleTimeUpdate = () => {
    const currentVideoTime = videoRef.current.currentTime;

    // Проверяем, что текущее время - корректное конечное число
    if (
      !isNaN(currentVideoTime) &&
      isFinite(currentVideoTime) &&
      currentVideoTime >= 0
    ) {
      setCurrentTime(currentVideoTime);

      // Если длительность все еще не установлена, но текущее время известно,
      // и мы можем получить длительность видео, обновляем ее
      if ((duration <= 0 || isNaN(duration)) && videoRef.current.duration > 0) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handlePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          console.log("Воспроизведение начато");
        })
        .catch((err) => {
          console.error("Ошибка при запуске воспроизведения:", err);
          setIsPlaying(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      console.log("Воспроизведение приостановлено");
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const handleMuteToggle = () => {
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);

    if (isMuted) {
      // Если снимаем мут, возвращаем предыдущую громкость
      videoRef.current.volume = volume;
    } else {
      // Если включаем мут, запоминаем текущую громкость
      setVolume(videoRef.current.volume);
      videoRef.current.volume = 0;
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch((err) => {
        console.error(
          `Ошибка переключения в полноэкранный режим: ${err.message}`
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeekForward = () => {
    videoRef.current.currentTime += 10; // Перемотка на 10 секунд вперед
  };

  const handleSeekBackward = () => {
    videoRef.current.currentTime -= 10; // Перемотка на 10 секунд назад
  };

  const formatTime = (timeInSeconds) => {
    // Проверка на NaN, Infinity или отрицательные значения
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds) || timeInSeconds < 0) {
      return "--:--"; // Используем более понятный формат для неизвестного времени
    }

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Обработчик ошибок видео
  const handleVideoError = (e) => {
    console.error("Ошибка воспроизведения видео:", e);
    
    // Получаем информацию об ошибке
    const video = e.target;
    const error = video.error;
    
    let errorMessage = "Не удалось загрузить видео. Попробуйте другое качество или повторите позже.";
    
    // Определяем тип ошибки
    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = "Воспроизведение было прервано.";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = "Ошибка сети. Проверьте подключение к интернету.";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = "Ошибка декодирования видео. Попробуйте другое качество.";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = "Формат видео не поддерживается. Попробуйте другое качество.";
          break;
        default:
          // Проверяем HTTP статус, если доступен
          if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
            errorMessage = "Фильм не найден или недоступен.";
          } else {
            errorMessage = "Произошла ошибка при загрузке видео.";
          }
      }
    }
    
    setError({
      message: errorMessage,
      code: error ? error.code : null,
      networkState: video.networkState
    });
    setLoading(false);
  };

  // Функция для повторной попытки загрузки с другим качеством
  const retryWithDifferentQuality = () => {
    const qualities = ["fhd", "hd", "sd"];
    const currentIndex = qualities.indexOf(selectedQuality);
    const nextQuality = qualities[(currentIndex + 1) % qualities.length];
    
    console.log(`Повторная попытка с качеством: ${nextQuality}`);
    setError(null);
    setLoading(true);
    changeQuality(nextQuality);
  };

  // Функция для повторной попытки с тем же качеством
  const retryWithSameQuality = () => {
    console.log("Повторная попытка с тем же качеством");
    setError(null);
    setLoading(true);
    setVideoKey(Date.now()); // Генерируем новый ключ для принудительной перезагрузки
  };

  // Эффект для обнаружения изменения полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Очистка таймаута при размонтировании
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Автоматическое воспроизведение при монтировании
  useEffect(() => {
    const playVideo = async () => {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
        console.log("Автовоспроизведение успешно запущено");
      } catch (error) {
        console.error("Автовоспроизведение не удалось:", error);
        setIsPlaying(false);
        // Большинство браузеров требуют взаимодействия с пользователем перед автовоспроизведением
      }
    };

    if (videoRef.current && !loading && !error) {
      playVideo();
    }
  }, [loading, error]);

  return (
    <div className="relative w-full h-full bg-black" onMouseMove={showControls}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80 text-white">
          <p className="text-xl mb-4">Ошибка воспроизведения видео</p>
          <p className="text-center mb-6 max-w-md">{error.message}</p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              onClick={retryWithSameQuality}
            >
              Повторить попытку
            </button>
            
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              onClick={retryWithDifferentQuality}
            >
              Попробовать другое качество
            </button>
            
            <button
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
              onClick={onClose}
            >
              Вернуться
            </button>
          </div>
        </div>
      )}

      <video
        key={videoKey} // Важно! Это заставит React пересоздать элемент video при изменении ключа
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={() => {
          const newDuration = videoRef.current.duration;
          if (!isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
            console.log(`Длительность обновлена: ${newDuration}с`);
            setDuration(newDuration);
          }
        }}
        onError={handleVideoError}
        onClick={handlePlay}
        preload="auto"
        crossOrigin="anonymous"
      >
        <source src={videoUrl} type="video/mp4" />
        Ваш браузер не поддерживает видео.
      </video>

      {/* Элементы управления видео */}
      {controlsVisible && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300">
          {/* Полоса прогресса */}
          <div className="mb-4 flex items-center">
            <input
              type="range"
              min="0"
              max={duration > 0 ? duration : 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              style={{
                background:
                  duration > 0
                    ? `linear-gradient(to right, #0066CC ${
                        (currentTime / duration) * 100
                      }%, #4B5563 ${(currentTime / duration) * 100}%)`
                    : "linear-gradient(to right, #0066CC 0%, #4B5563 0%)",
              }}
            />
          </div>

          {/* Кнопки управления */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSeekBackward}
                className="text-white hover:text-gray-300 transition"
              >
                <FaBackward />
              </button>

              <button
                onClick={handlePlay}
                className="text-white hover:text-gray-300 transition"
              >
                {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
              </button>

              <button
                onClick={handleSeekForward}
                className="text-white hover:text-gray-300 transition"
              >
                <FaForward />
              </button>

              <div className="flex items-center ml-4 space-x-2">
                <button
                  onClick={handleMuteToggle}
                  className="text-white hover:text-gray-300 transition"
                >
                  {isMuted ? (
                    <FaVolumeMute size={20} />
                  ) : (
                    <FaVolumeUp size={20} />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <span className="text-white text-sm ml-4">
                {formatTime(currentTime)} /{" "}
                {duration > 0 ? formatTime(duration) : "--:--"}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Выбор качества видео */}
              <div className="relative">
                <button
                  onClick={() => setShowQualityOptions(!showQualityOptions)}
                  className="text-white hover:text-gray-300 transition flex items-center"
                >
                  <FaCog size={18} className="mr-1" />
                  <span className="text-xs font-medium">
                    {
                      availableQualities.find(
                        (q) => q.value === selectedQuality
                      )?.label
                    }
                  </span>
                </button>

                {showQualityOptions && (
                  <div className="absolute right-0 bottom-10 bg-black/90 rounded p-2 w-32">
                    <h4 className="text-white text-xs mb-2 border-b border-gray-700 pb-1 font-medium">
                      Качество видео
                    </h4>
                    <ul>
                      {availableQualities.map((quality) => (
                        <li key={quality.value} className="mb-1 last:mb-0">
                          <button
                            onClick={() => changeQuality(quality.value)}
                            className={`text-xs w-full text-left py-1 px-2 rounded ${
                              selectedQuality === quality.value
                                ? "bg-blue-600 text-white"
                                : "text-gray-300 hover:bg-gray-800"
                            }`}
                          >
                            {quality.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={handleFullscreenToggle}
                className="text-white hover:text-gray-300 transition"
              >
                {isFullscreen ? (
                  <FaCompress size={20} />
                ) : (
                  <FaExpand size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
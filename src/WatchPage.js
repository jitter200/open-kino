import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import VideoPlayer from "../components/VideoPlayer";
import { FaArrowLeft } from "react-icons/fa";

const WatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/movies/${id}`);
        setMovie(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Ошибка при загрузке фильма:", err);
        
        let errorMessage = "Не удалось загрузить фильм";
        
        if (err.response) {
          // Сервер ответил с ошибкой
          switch (err.response.status) {
            case 404:
              errorMessage = "Фильм не найден";
              break;
            case 500:
              errorMessage = "Ошибка сервера при загрузке фильма";
              break;
            default:
              errorMessage = err.response.data?.message || errorMessage;
          }
        } else if (err.request) {
          // Запрос был сделан, но ответ не получен
          errorMessage = "Не удалось подключиться к серверу";
        } else {
          // Что-то другое произошло
          errorMessage = err.message || errorMessage;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Ошибка при загрузке фильма</p>
        <p className="mb-6">{error || "Фильм не найден"}</p>
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md flex items-center"
          onClick={handleGoBack}
        >
          <FaArrowLeft className="mr-2" />
          Вернуться
        </button>
      </div>
    );
  }

  if (!movie.videos || (!movie.videos.fhd && !movie.videos.hd && !movie.videos.sd)) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Видео недоступно</p>
        <p className="mb-6">Для этого фильма не найдено видео</p>
        <button
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md flex items-center"
          onClick={handleGoBack}
        >
          <FaArrowLeft className="mr-2" />
          Вернуться
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black relative">
      {/* Кнопка возврата */}
      <button
        className="absolute top-6 left-6 z-20 p-3 bg-black/40 rounded-full hover:bg-black/60 transition text-white"
        onClick={handleGoBack}
      >
        <FaArrowLeft size={20} />
      </button>

      {/* Видеоплеер */}
      <VideoPlayer
        movieId={movie._id}
        poster={movie.poster}
        onClose={handleGoBack}
      />
    </div>
  );
};

export default WatchPage;

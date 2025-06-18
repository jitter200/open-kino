import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import MovieRow from "../components/MovieRow";
import { useWatchlist } from "../contexts/WatchlistContext";
import { useAuth } from "../auth";
import { FaTrash } from "react-icons/fa";

export function Browse() {
  const location = useLocation();
  const path = location.pathname.slice(1); // Remove leading slash
  const { isAuthenticated } = useAuth();
  const {
    watchlist,
    clearWatchlist,
    isLoading: isWatchlistLoading,
    fetchWatchlist,
  } = useWatchlist();

  const [movies, setMovies] = useState({
    trending: [],
    popular: [],
    newReleases: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      // Если страница "мой список", не нужно загружать другие категории фильмов
      if (path === "mylist") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Получаем нужные категории фильмов в зависимости от пути
        let categoryEndpoints = [];

        if (path === "series" || path === "movies" || path === "new") {
          // Для специальных категорий можно сделать дополнительные запросы
          // Но для простоты демо мы загружаем все категории
          categoryEndpoints = [
            axios.get("/api/movies/category/trending"),
            axios.get("/api/movies/category/popular"),
            axios.get("/api/movies/category/newReleases"),
          ];
        } else {
          // Для просмотра загружаем все категории
          categoryEndpoints = [
            axios.get("/api/movies/category/trending"),
            axios.get("/api/movies/category/popular"),
            axios.get("/api/movies/category/newReleases"),
          ];
        }

        const responses = await Promise.all(categoryEndpoints);

        setMovies({
          trending: responses[0].data,
          popular: responses[1].data,
          newReleases: responses[2].data,
        });
      } catch (err) {
        console.error("Ошибка загрузки фильмов:", err);
        setError("Не удалось загрузить фильмы. Пожалуйста, попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [path]);

  // Логгируем watchlist для отладки
  useEffect(() => {
    if (path === "mylist") {
      console.log("Browse: Компонент загружен, path =", path);
      console.log("Browse: watchlist содержит", watchlist.length, "фильмов");
      if (watchlist.length > 0) {
        console.log(
          "Browse: IDs фильмов в списке:",
          watchlist.map((movie) => movie._id).join(", ")
        );
      }
    }
  }, [path, watchlist.length]);

  // Обновляем список при заходе на страницу "Мой список"
  useEffect(() => {
    if (path === "mylist" && isAuthenticated) {
      console.log("Browse: Обновляем список при заходе на страницу Мой список");
      // Используем debounce для предотвращения частых вызовов
      const timer = setTimeout(() => {
        fetchWatchlist().catch((err) => {
          console.error("Ошибка при обновлении списка в Browse:", err);
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [path, fetchWatchlist, isAuthenticated]);

  // Определяем заголовок на основе пути
  const getTitle = () => {
    switch (path) {
      case "series":
        return "Сериалы";
      case "movies":
        return "Фильмы";
      case "new":
        return "Новинки";
      case "mylist":
        return "Мой список";
      default:
        return "Рекомендуемое";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black flex justify-center items-center">
        <Navbar />
        <div className="text-white text-2xl pt-20">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-netflix-black flex justify-center items-center">
        <Navbar />
        <div className="text-red-500 text-xl pt-20">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black">
      <Navbar />

      {/* Отступ для Navbar */}
      <div className="pt-20">
        <div className="px-4 lg:px-16">
          {path !== "mylist" && (
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">{getTitle()}</h1>
            </div>
          )}

          {path === "mylist" && watchlist.length > 0 && (
            <div className="flex justify-end mb-8">
              <button
                className="bg-netflix-red hover:bg-netflix-red/80 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200"
                onClick={clearWatchlist}
              >
                <FaTrash size={14} />
                <span>Очистить</span>
              </button>
            </div>
          )}
        </div>

        {path === "mylist" ? (
          <>
            {isWatchlistLoading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <div className="text-white text-xl">Загрузка...</div>
              </div>
            ) : watchlist.length > 0 ? (
              <>
                <div className="px-4 lg:px-16 mb-2">
                  <h2 className="text-3xl font-bold text-white">
                    {getTitle()}
                  </h2>
                </div>
                <MovieRow title="" movies={watchlist} />
              </>
            ) : (
              <div className="flex flex-col justify-center items-center min-h-[300px] text-white">
                <p className="text-2xl mb-4">Ваш список пуст</p>
                <p className="text-netflix-light-gray text-center max-w-md">
                  Добавляйте фильмы и сериалы в свой список, нажимая на иконку
                  "+" на карточке фильма или при наведении на неё
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <MovieRow title="Популярные сейчас" movies={movies.trending} />
            <MovieRow title="Продолжить просмотр" movies={movies.popular} />
            <MovieRow title="Новые релизы" movies={movies.newReleases} />
          </>
        )}
      </div>
    </div>
  );
}

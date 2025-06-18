import React, { useRef, useState, useMemo } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlay,
  FaPlus,
  FaThumbsUp,
  FaInfoCircle,
  FaChevronRight as FaArrowRight,
  FaCheck,
} from "react-icons/fa";
import MovieModal from "./MovieModal";
import { useWatchlist } from "../contexts/WatchlistContext";

const MovieRow = ({ title, movies }) => {
  const rowRef = useRef(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [showControls, setShowControls] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  // Генерируем проценты match для фильмов один раз при монтировании компонента
  const movieMatches = useMemo(() => {
    return movies.map(() => Math.floor(Math.random() * 31) + 70);
  }, [movies.length]); // Перегенерируем только если количество фильмов изменилось

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth * 0.75
          : scrollLeft + clientWidth * 0.75;

      rowRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handleMouseEnter = () => {
    setShowControls(true);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
    setIsHovering(false);
  };

  const handleAddToWatchlist = async (e, movie) => {
    e.preventDefault(); // Предотвращаем стандартное поведение
    e.stopPropagation(); // Предотвращаем всплытие события, чтобы не открывалось модальное окно

    console.log("---КЛИК ПО КНОПКЕ---");
    console.log(
      'Кнопка "Добавить в список" нажата для фильма:',
      movie.title,
      movie._id
    );

    if (!movie || !movie._id) {
      console.error("ОШИБКА: Фильм не содержит _id:", movie);
      alert("Ошибка: фильм не содержит идентификатор");
      return;
    }

    try {
      // Сначала проверяем, есть ли фильм в списке
      const movieIdStr = String(movie._id);
      console.log("ID фильма (строка):", movieIdStr);
      const isInList = isInWatchlist(movieIdStr);
      console.log("Фильм уже в списке?", isInList);

      if (isInList) {
        console.log(
          "УДАЛЕНИЕ: Выполняем удаление фильма из списка:",
          movieIdStr
        );
        await removeFromWatchlist(movieIdStr);
        console.log("УДАЛЕНИЕ: Фильм удален из списка");
        // Используем setState для обновления UI
        setHoverIndex((prev) => prev); // Вызываем ререндер
      } else {
        console.log(
          "ДОБАВЛЕНИЕ: Выполняем добавление фильма в список:",
          movieIdStr
        );
        await addToWatchlist(movie);
        console.log("ДОБАВЛЕНИЕ: Фильм добавлен в список");
        // Используем setState для обновления UI
        setHoverIndex((prev) => prev); // Вызываем ререндер
      }
    } catch (error) {
      console.error("ОШИБКА при работе со списком:", error);
      alert("Произошла ошибка при добавлении/удалении фильма из списка");
    }
  };

  return (
    <>
      <div
        className="py-10 relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex justify-between items-center px-4 lg:px-16 mb-4">
          <h2
            className={`text-xl md:text-2xl font-netflix-sans font-bold transition-transform duration-300 ${
              isHovering ? "text-netflix-red" : "text-white"
            }`}
          >
            {title}
          </h2>

          {isHovering && (
            <button className="flex items-center text-netflix-light-gray hover:text-white transition-colors duration-200 group">
              <span className="text-sm font-medium">Показать все</span>
              <FaArrowRight
                className="ml-2 group-hover:translate-x-1 transition-transform duration-200"
                size={14}
              />
            </button>
          )}
        </div>

        <div className="group relative">
          <div
            className={`absolute top-0 bottom-0 left-0 z-40 flex items-center justify-center ${
              showControls ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300 lg:group-hover:opacity-100`}
            onClick={() => handleScroll("left")}
          >
            <button className="bg-black/50 p-4 rounded-full hover:bg-black/70 backdrop-blur-sm ml-1 transform transition-transform duration-200 hover:scale-110">
              <FaChevronLeft className="h-6 w-6 text-white" />
            </button>
          </div>

          <div
            ref={rowRef}
            className="flex space-x-1 lg:space-x-2 overflow-x-scroll scrollbar-hide px-4 lg:px-16 py-4"
          >
            {movies.map((movie, index) => (
              <div
                key={index}
                className="flex-none group/item relative"
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(-1)}
                onClick={() => handleMovieClick(movie)}
              >
                <div
                  className={`w-[180px] md:w-[200px] lg:w-[240px] aspect-[2/3] transition-all duration-300 ${
                    hoverIndex === index
                      ? "scale-110 z-10 shadow-xl delay-300"
                      : ""
                  }`}
                >
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="rounded-md object-cover w-full h-full"
                    loading="lazy"
                  />

                  {/* Hover overlay with info */}
                  {hoverIndex === index && (
                    <div className="absolute inset-0 rounded-md overflow-hidden animate-fade-in">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                      <div className="absolute bottom-0 p-4 w-full">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex space-x-2">
                            <button className="bg-white text-black p-2 rounded-full hover:bg-gray-200 transition transform hover:scale-105">
                              <FaPlay size={16} />
                            </button>
                            <button
                              className="border-2 border-gray-300 text-white p-2 rounded-full hover:bg-black/30 transition transform hover:scale-105"
                              onClick={(e) => handleAddToWatchlist(e, movie)}
                              title={
                                isInWatchlist(String(movie._id))
                                  ? "Удалить из 'Моего списка'"
                                  : "Добавить в 'Мой список'"
                              }
                            >
                              {isInWatchlist(String(movie._id)) ? (
                                <FaCheck size={16} />
                              ) : (
                                <FaPlus size={16} />
                              )}
                            </button>
                            <button className="border-2 border-gray-300 text-white p-2 rounded-full hover:bg-black/30 transition transform hover:scale-105">
                              <FaThumbsUp size={16} />
                            </button>
                          </div>
                          <button className="border-2 border-gray-300 text-white p-2 rounded-full hover:bg-black/30 transition transform hover:scale-105">
                            <FaInfoCircle size={16} />
                          </button>
                        </div>
                        <p className="text-white text-sm font-bold line-clamp-1">
                          {movie.title}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-green-500 font-bold mr-2">
                            {movieMatches[index]}% match
                          </span>
                          <span className="border text-xs text-white px-1.5">
                            {movie.rating}
                          </span>
                        </div>
                        <div className="text-xs text-white mt-2 line-clamp-1">
                          {movie.genres}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            className={`absolute top-0 bottom-0 right-0 z-40 flex items-center justify-center ${
              showControls ? "opacity-100" : "opacity-0"
            } transition-opacity duration-300 lg:group-hover:opacity-100`}
            onClick={() => handleScroll("right")}
          >
            <button className="bg-black/50 p-4 rounded-full hover:bg-black/70 backdrop-blur-sm mr-1 transform transition-transform duration-200 hover:scale-110">
              <FaChevronRight className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно с информацией о фильме */}
      {selectedMovie && (
        <MovieModal movie={selectedMovie} onClose={handleCloseModal} />
      )}
    </>
  );
};

export default MovieRow;

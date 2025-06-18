import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../auth";

export function AddMovie() {
  const navigate = useNavigate();
  const { authAxios } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [formData, setFormData] = useState({
    title: "",
    poster: "",
    description: "",
    genres: "",
    cast: "",
    director: "",
    rating: "16+",
    year: new Date().getFullYear().toString(),
    duration: "1ч 30м",
    quality: "HD",
    type: "trending",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await authAxios.post("/movies", formData);
      setMessage({
        text: `Фильм "${response.data.title}" успешно добавлен!`,
        type: "success",
      });

      // Сбросить форму
      setFormData({
        title: "",
        poster: "",
        description: "",
        genres: "",
        cast: "",
        director: "",
        rating: "16+",
        year: new Date().getFullYear().toString(),
        duration: "1ч 30м",
        quality: "HD",
        type: "trending",
      });

      // Через 2 секунды перенаправить на страницу просмотра
      setTimeout(() => {
        navigate("/browse");
      }, 2000);
    } catch (error) {
      setMessage({
        text: `Ошибка: ${error.response?.data?.message || error.message}`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black">
      <Navbar />

      <div className="pt-24 px-4 lg:px-16 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Добавить новый фильм
        </h1>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success" ? "bg-green-600" : "bg-red-600"
            } text-white`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="title"
                className="block text-netflix-light-gray mb-2"
              >
                Название фильма *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label
                htmlFor="poster"
                className="block text-netflix-light-gray mb-2"
              >
                URL постера *
              </label>
              <input
                type="url"
                id="poster"
                name="poster"
                value={formData.poster}
                onChange={handleChange}
                required
                placeholder="https://example.com/poster.jpg"
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-netflix-light-gray mb-2"
              >
                Описание *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              ></textarea>
            </div>

            <div>
              <label
                htmlFor="genres"
                className="block text-netflix-light-gray mb-2"
              >
                Жанры *
              </label>
              <input
                type="text"
                id="genres"
                name="genres"
                value={formData.genres}
                onChange={handleChange}
                required
                placeholder="Драма, Комедия, Боевик"
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label
                htmlFor="cast"
                className="block text-netflix-light-gray mb-2"
              >
                В ролях
              </label>
              <input
                type="text"
                id="cast"
                name="cast"
                value={formData.cast}
                onChange={handleChange}
                placeholder="Имена актеров через запятую"
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label
                htmlFor="director"
                className="block text-netflix-light-gray mb-2"
              >
                Режиссер
              </label>
              <input
                type="text"
                id="director"
                name="director"
                value={formData.director}
                onChange={handleChange}
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label
                htmlFor="rating"
                className="block text-netflix-light-gray mb-2"
              >
                Рейтинг
              </label>
              <select
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              >
                <option value="0+">0+</option>
                <option value="6+">6+</option>
                <option value="12+">12+</option>
                <option value="16+">16+</option>
                <option value="18+">18+</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="year"
                className="block text-netflix-light-gray mb-2"
              >
                Год выпуска
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-netflix-light-gray mb-2"
              >
                Продолжительность
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="1ч 30м"
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label
                htmlFor="quality"
                className="block text-netflix-light-gray mb-2"
              >
                Качество
              </label>
              <select
                id="quality"
                name="quality"
                value={formData.quality}
                onChange={handleChange}
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              >
                <option value="SD">SD</option>
                <option value="HD">HD</option>
                <option value="Full HD">Full HD</option>
                <option value="4K">4K</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-netflix-light-gray mb-2"
              >
                Категория
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-netflix-dark-lighter p-3 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              >
                <option value="trending">В тренде</option>
                <option value="popular">Популярное</option>
                <option value="newReleases">Новинки</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-netflix-dark-lighter text-white rounded-md hover:bg-netflix-dark transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Добавление..." : "Добавить фильм"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

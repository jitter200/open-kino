import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import HeroBanner from "../components/HeroBanner";
import MovieRow from "../components/MovieRow";
import { useAuth } from "../auth";
import "../styles/Home.css";

export function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState({
    trending: [],
    popular: [],
    newReleases: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Получаем все категории фильмов
        const [trendingRes, popularRes, newReleasesRes] = await Promise.all([
          axios.get("/api/movies/category/trending"),
          axios.get("/api/movies/category/popular"),
          axios.get("/api/movies/category/newReleases"),
        ]);

        setMovies({
          trending: trendingRes.data,
          popular: popularRes.data,
          newReleases: newReleasesRes.data,
        });
      } catch (err) {
        console.error("Ошибка загрузки фильмов:", err);
        setError("Не удалось загрузить фильмы. Пожалуйста, попробуйте позже.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-netflix-black flex justify-center items-center">
        <Navbar />
        <div className="text-white text-2xl">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-netflix-black flex justify-center items-center">
        <Navbar />
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-netflix-black">
      <Navbar />
      <HeroBanner />

      <div className="relative z-20">
        <MovieRow title="Популярное" movies={movies.popular} />
        <MovieRow title="В тренде" movies={movies.trending} />
        <MovieRow title="Новые релизы" movies={movies.newReleases} />
      </div>
    </div>
  );
}

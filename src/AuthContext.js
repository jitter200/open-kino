import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_URL = "/api/auth";

// Функция для создания экземпляра axios с заголовками авторизации
const createAuthAxios = (token) => {
  const instance = axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  // Добавляем интерсептор для обработки ошибок авторизации
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Если ошибка 401 (неавторизован) и это не повторный запрос
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Если токен истек, выполняем выход
        if (error.response?.data?.expired) {
          // Удаляем токен
          localStorage.removeItem("netflix_token");
          // Перенаправляем на страницу входа
          window.location.href = "/login";
          return Promise.reject(error);
        }

        try {
          // Пробуем обновить токен (можно реализовать, если есть endpoint для обновления токена)
          // Для текущей реализации просто перенаправляем на login
          window.location.href = "/login";
          return Promise.reject(error);
        } catch (refreshError) {
          // Если не удалось обновить токен, выполняем выход
          localStorage.removeItem("netflix_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authAxios, setAuthAxios] = useState(createAuthAxios(null));

  // Проверка авторизации при загрузке приложения
  useEffect(() => {
    checkAuthStatus();

    // Устанавливаем обработчик события хранилища, чтобы синхронизировать состояние между вкладками
    const handleStorageChange = (e) => {
      if (e.key === "netflix_token") {
        if (!e.newValue) {
          // Если токен удален в другой вкладке
          setCurrentUser(null);
        } else if (e.newValue !== localStorage.getItem("netflix_token")) {
          // Если токен изменился в другой вкладке
          checkAuthStatus();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Периодическая проверка токена (каждые 5 минут)
    const intervalId = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // Обновление axios instance при изменении токена
  useEffect(() => {
    const token = currentUser?.token || localStorage.getItem("netflix_token");
    setAuthAxios(createAuthAxios(token));
  }, [currentUser]);

  // Проверка статуса авторизации пользователя
  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("netflix_token");

      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        // Создаем instance axios с токеном
        const authAxiosInstance = createAuthAxios(token);

        // Проверяем токен, запрашивая данные пользователя
        const response = await authAxiosInstance.get("/auth/me");

        if (response.data) {
          // Если запрос успешен, устанавливаем пользователя
          setCurrentUser({
            ...response.data,
            token,
          });

          // Обновляем токен в localStorage для продления сессии
          localStorage.setItem("netflix_token", token);
        } else {
          // Если данные не получены, сбрасываем пользователя
          localStorage.removeItem("netflix_token");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Ошибка проверки авторизации:", error);

        // Если сервер недоступен (404, 500, network error), но у нас есть токен в localStorage,
        // Попробуем восстановить пользователя из localStorage
        if (
          error.response?.status === 404 ||
          error.response?.status === 500 ||
          error.code === "ECONNABORTED" ||
          error.message.includes("Network Error")
        ) {
          console.log("Сервер недоступен, используем закешированные данные");

          // Попробуем восстановить базовые данные пользователя из localStorage
          const userDataString = localStorage.getItem("netflix_user_data");
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString);
              setCurrentUser({
                ...userData,
                token,
              });
            } catch (err) {
              console.error("Ошибка парсинга данных пользователя:", err);
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
        } else {
          // Для других ошибок (401, 403), удаляем токен
          localStorage.removeItem("netflix_token");
          setCurrentUser(null);
        }
      }
    } catch (error) {
      console.error("Критическая ошибка при проверке авторизации:", error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Функция для регистрации пользователя
  const register = async (name, email, password) => {
    try {
      setError(null);

      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
      });

      const { token, ...userData } = response.data;

      // Сохраняем токен в localStorage
      localStorage.setItem("netflix_token", token);

      // Устанавливаем данные пользователя
      setCurrentUser({ ...userData, token });

      return true;
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Ошибка при регистрации"
      );
      return false;
    }
  };

  // Функция для входа пользователя
  const login = async (email, password) => {
    try {
      setError(null);

      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { token, ...userData } = response.data;

      // Сохраняем токен в localStorage
      localStorage.setItem("netflix_token", token);

      // Сохраняем базовые данные пользователя для работы в offline режиме
      localStorage.setItem("netflix_user_data", JSON.stringify(userData));

      // Устанавливаем данные пользователя
      setCurrentUser({ ...userData, token });

      return true;
    } catch (error) {
      setError(
        error.response?.data?.message || error.message || "Ошибка при входе"
      );
      return false;
    }
  };

  // Функция для выхода из аккаунта
  const logout = async () => {
    try {
      // Удаляем данные из локального хранилища
      localStorage.removeItem("netflix_token");
      localStorage.removeItem("netflix_user_data");
      setCurrentUser(null);
      return true;
    } catch (error) {
      setError(error.message || "Ошибка при выходе");
      return false;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "admin",
    authAxios, // Экспортируем axios с авторизацией для использования в компонентах
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "../auth";
import axios from "axios"; // Добавляем импорт axios

const WatchlistContext = createContext();

export const useWatchlist = () => useContext(WatchlistContext);

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState(null); // Хранить последнюю ошибку
  const { isAuthenticated, authAxios } = useAuth();
  // Используем useRef для отслеживания последнего обновления, чтобы избежать лишних запросов
  const lastUpdateRef = useRef(null);
  const isUpdatingRef = useRef(false);
  const lastAuthStatusRef = useRef(isAuthenticated);
  const lastFetchTimeRef = useRef(0);

  // Создаем резервный экземпляр axios на случай, если authAxios недоступен
  const fallbackAxios = axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Функция для получения рабочего экземпляра axios
  const getAxiosInstance = () => {
    // Проверяем, есть ли доступный authAxios
    if (authAxios && typeof authAxios.get === "function") {
      // Проверяем заголовок Authorization
      const hasAuthHeader =
        authAxios.defaults?.headers?.common?.Authorization ||
        authAxios.defaults?.headers?.Authorization;
      if (hasAuthHeader) {
        return authAxios;
      }
    }

    // Если authAxios не определен или в нем нет заголовка авторизации,
    // создаем новый экземпляр с токеном из localStorage
    console.warn(
      "WatchlistContext: authAxios не определен, создаем новый с токеном из localStorage"
    );
    const token = localStorage.getItem("netflix_token");

    if (token) {
      return axios.create({
        baseURL: "/api",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Если токена нет, возвращаем fallbackAxios
    console.warn(
      "WatchlistContext: токен не найден, запросы будут выполняться без авторизации"
    );
    return fallbackAxios;
  };

  // Отладочная информация при обновлениях - удаляем слежение за watchlist.length, чтобы избежать цикла
  useEffect(() => {
    const token = localStorage.getItem("netflix_token");
    console.log(
      "WatchlistProvider: состояние isAuthenticated изменилось:",
      isAuthenticated,
      "Токен в localStorage:",
      token ? "присутствует" : "отсутствует"
    );

    // Проверка токена при загрузке компонента
    if (isAuthenticated && !token) {
      console.warn(
        "WatchlistProvider: несоответствие - isAuthenticated=true, но токен отсутствует"
      );
    } else if (!isAuthenticated && token) {
      console.warn(
        "WatchlistProvider: несоответствие - isAuthenticated=false, но токен присутствует"
      );
    }
  }, [isAuthenticated]);

  // Дополнительный эффект для логирования изменений watchlist без вызова дополнительных обновлений
  useEffect(() => {
    console.log("WatchlistProvider: текущий размер списка:", watchlist.length);
  }, [watchlist]);

  // Fetch watchlist from backend when component mounts or authentication state changes
  useEffect(() => {
    // Проверяем, действительно ли изменился статус аутентификации
    if (lastAuthStatusRef.current !== isAuthenticated) {
      console.log(
        "WatchlistProvider: статус аутентификации изменился:",
        isAuthenticated ? "авторизован" : "не авторизован"
      );

      lastAuthStatusRef.current = isAuthenticated;

      if (isAuthenticated) {
        console.log(
          "WatchlistProvider: запрос списка просмотра для авторизованного пользователя"
        );
        fetchWatchlist();
      } else {
        console.log(
          "WatchlistProvider: очистка списка просмотра для неавторизованного пользователя"
        );
        setWatchlist([]);
        setIsLoading(false);
        lastUpdateRef.current = null; // Сбрасываем кеш данных
      }
    }
  }, [isAuthenticated]);

  // Функция для ручной синхронизации состояния аутентификации с токеном
  const syncAuthState = useCallback(() => {
    const token = localStorage.getItem("netflix_token");

    if (token && !isAuthenticated) {
      console.log(
        "syncAuthState: обнаружен токен, но пользователь не авторизован - ожидаем автоматической авторизации"
      );
      // Возможно, AuthContext еще не успел обработать токен
      // В идеале, мы должны ждать обновления isAuthenticated
      return false;
    }

    if (!token && isAuthenticated) {
      console.warn(
        "syncAuthState: токен отсутствует, но isAuthenticated=true - возможно, состояние рассинхронизировано"
      );
      return false;
    }

    return isAuthenticated && token;
  }, [isAuthenticated]);

  // Проверяем состояние аутентификации при монтировании
  useEffect(() => {
    syncAuthState();
  }, [syncAuthState]);

  // Get watchlist from the backend
  const fetchWatchlist = async () => {
    // Проверка синхронизации состояния аутентификации
    const isAuthSynced = syncAuthState();

    // Избегаем параллельных запросов
    if (isUpdatingRef.current) {
      console.log("fetchWatchlist: уже выполняется запрос, пропускаем");
      return;
    }

    if (!isAuthSynced) {
      console.log(
        "fetchWatchlist: состояние аутентификации не синхронизировано, пропускаем запрос"
      );
      setWatchlist([]);
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated) {
      console.log("fetchWatchlist: пользователь не авторизован");
      setWatchlist([]);
      setIsLoading(false);
      return;
    }

    // Предотвращаем слишком частые запросы (не чаще чем раз в 10 секунд)
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < 10000) {
      // 10 seconds
      console.log(
        `fetchWatchlist: слишком частый запрос (${timeSinceLastFetch}ms), пропускаем`
      );
      return;
    }

    // Отмечаем время последнего запроса
    lastFetchTimeRef.current = now;

    // Отмечаем, что запрос начался
    isUpdatingRef.current = true;
    setIsLoading(true);
    setLastError(null);

    try {
      const axiosInstance = getAxiosInstance();
      // Логируем baseURL объекта axiosInstance
      console.log(
        "fetchWatchlist: baseURL =",
        axiosInstance.defaults?.baseURL || "не задан"
      );
      console.log("fetchWatchlist: отправка запроса на получение списка");

      // Проверяем, какой URL будет использоваться
      const watchlistUrl = "/watchlist";
      console.log(
        "fetchWatchlist: полный URL =",
        (axiosInstance.defaults?.baseURL || "") + watchlistUrl
      );

      const response = await axiosInstance.get(watchlistUrl);
      console.log("fetchWatchlist: ответ получен", response.data);

      if (Array.isArray(response.data)) {
        // Проверяем, изменились ли данные с последнего обновления
        const dataJson = JSON.stringify(response.data);
        if (dataJson === lastUpdateRef.current) {
          console.log(
            "fetchWatchlist: данные не изменились, пропускаем обновление"
          );
          return;
        }

        // Вместо простого присваивания используем метод чтобы убедиться, что React заметит изменения
        const moviesData = response.data.map((movie) => ({
          ...movie,
          _id: String(movie._id), // Преобразуем ID в строку для единообразия
        }));

        setWatchlist(moviesData);
        // Сохраняем последние полученные данные
        lastUpdateRef.current = dataJson;

        console.log(
          "fetchWatchlist: список обновлен, элементов:",
          moviesData.length
        );
        console.log(
          "fetchWatchlist: IDs в списке:",
          moviesData.map((movie) => movie._id).join(", ")
        );
      } else {
        console.error("fetchWatchlist: неверный формат данных", response.data);
        setWatchlist([]);
      }
    } catch (error) {
      console.error(
        "fetchWatchlist: ошибка при получении списка:",
        error.message
      );
      setLastError(error.message);

      if (error.response) {
        console.error("fetchWatchlist: статус ответа:", error.response.status);
        console.error("fetchWatchlist: данные ответа:", error.response.data);
        // Логируем URL, на который был сделан запрос
        console.error("fetchWatchlist: URL запроса:", error.config.url);
        console.error(
          "fetchWatchlist: полный URL:",
          error.config.baseURL + error.config.url
        );
      }

      // Если у нас нет данных по API, используем пустой список
      setWatchlist([]);
    } finally {
      setIsLoading(false);
      // Отмечаем, что запрос завершен
      isUpdatingRef.current = false;
    }
  };

  // Check if a movie is in the watchlist
  const isInWatchlist = (movieId) => {
    if (!movieId || !watchlist || !Array.isArray(watchlist)) {
      return false;
    }

    // Преобразуем movieId в строку для корректного сравнения
    const movieIdStr = String(movieId);

    // Проверяем, есть ли фильм в списке
    return watchlist.some((movie) => {
      if (!movie || !movie._id) return false;
      return String(movie._id) === movieIdStr;
    });
  };

  // Add movie to watchlist
  const addToWatchlist = async (movie) => {
    // Проверка синхронизации состояния аутентификации
    const isAuthSynced = syncAuthState();

    if (!isAuthSynced) {
      const token = localStorage.getItem("netflix_token");
      console.error(
        "Невозможно добавить в список - состояние аутентификации не синхронизировано. " +
          "isAuthenticated:",
        isAuthenticated,
        "Токен:",
        token ? "присутствует" : "отсутствует"
      );
      return false;
    }

    if (!isAuthenticated) {
      console.error(
        "Невозможно добавить в список - пользователь не авторизован"
      );
      return false;
    }

    if (!movie || !movie._id) {
      console.error("Ошибка: передан неверный объект фильма:", movie);
      return false;
    }

    try {
      console.log("НАЧАЛО ДОБАВЛЕНИЯ ФИЛЬМА В СПИСОК:", movie._id);
      const axiosInstance = getAxiosInstance();
      console.log(
        "axiosInstance baseURL =",
        axiosInstance.defaults?.baseURL || "не задан"
      );

      // Преобразуем ID в строку для корректного сравнения
      const movieId = String(movie._id);

      // Проверим, есть ли фильм уже в списке
      if (isInWatchlist(movieId)) {
        console.log("Фильм уже в списке, пропускаем запрос:", movie.title);
        return true;
      }

      // Сначала добавим фильм в UI без ожидания ответа от сервера
      console.log("Добавляем фильм в UI");
      setWatchlist((prevWatchlist) => [...prevWatchlist, movie]);

      // Формируем URL для запроса
      const addUrl = `/watchlist/add/${movieId}`;
      console.log("ОТПРАВЛЯЕМ запрос на добавление фильма:", movieId);
      console.log("URL запроса:", addUrl);
      console.log(
        "Полный URL:",
        (axiosInstance.defaults?.baseURL || "") + addUrl
      );

      // Отправляем запрос на сервер
      const response = await axiosInstance.post(addUrl, {
        movieId: movieId,
      });

      console.log("ПОЛУЧЕН ОТВЕТ от сервера:", response.data);

      // Если запрос был успешным, но хотим убедиться, что UI и сервер синхронизированы
      if (response.data.success) {
        console.log(
          "Успешно добавлено на сервере. Локальное обновление UI выполнено."
        );
        // Отключаем принудительное обновление списка, так как мы уже добавили фильм в UI
        // и это предотвратит ненужные запросы к серверу
        // fetchWatchlist().catch((err) => {
        //   console.error("Ошибка при обновлении списка после добавления:", err);
        // });
      }

      console.log("ЗАВЕРШЕНО ДОБАВЛЕНИЕ в список:", movie.title);
      return true;
    } catch (error) {
      console.error("ОШИБКА при добавлении фильма в список:", error.message);
      if (error.response) {
        console.error("Статус ответа:", error.response.status);
        console.error("Данные ответа:", error.response.data);
        console.error("URL запроса:", error.config.url);
        if (error.config.baseURL) {
          console.error("baseURL:", error.config.baseURL);
          console.error("Полный URL:", error.config.baseURL + error.config.url);
        }
      }
      // Откатываем оптимистичное обновление при ошибке
      console.log("Отмена временного добавления фильма в UI");
      setWatchlist((prev) =>
        prev.filter((m) => String(m._id) !== String(movie._id))
      );
      return false;
    }
  };

  // Remove movie from watchlist
  const removeFromWatchlist = async (movieId) => {
    if (!isAuthenticated) {
      console.error(
        "Невозможно удалить из списка - пользователь не авторизован"
      );
      return false;
    }

    try {
      // Преобразуем ID в строку для корректного сравнения
      const movieIdStr = String(movieId);
      const axiosInstance = getAxiosInstance();

      // Сначала обновим UI, не дожидаясь ответа от сервера
      console.log("Удаляем фильм из UI:", movieIdStr);
      // Создаем временную копию списка для быстрого UI-отклика
      const updatedWatchlist = watchlist.filter(
        (movie) => String(movie._id) !== movieIdStr
      );
      setWatchlist(updatedWatchlist);

      // Формируем URL для запроса
      const removeUrl = `/watchlist/remove/${movieIdStr}`;
      console.log("Отправка запроса на удаление фильма:", movieIdStr);
      console.log("URL запроса:", removeUrl);
      console.log(
        "Полный URL:",
        (axiosInstance.defaults?.baseURL || "") + removeUrl
      );

      // Отправляем запрос на сервер
      const response = await axiosInstance.delete(removeUrl);
      console.log("Ответ сервера:", response.data);

      // Если запрос был успешным, синхронизируем с сервером
      if (response.data.success) {
        console.log(
          "Успешно удалено на сервере. Локальное обновление UI выполнено."
        );
        // Отключаем принудительное обновление списка, так как мы уже удалили фильм из UI
        // await fetchWatchlist();
      }

      return true;
    } catch (error) {
      console.error("Ошибка при удалении из списка:", error.message);
      if (error.response) {
        console.error("Статус ответа:", error.response.status);
        console.error("Данные ответа:", error.response.data);
        console.error("URL запроса:", error.config.url);
        if (error.config.baseURL) {
          console.error("baseURL:", error.config.baseURL);
          console.error("Полный URL:", error.config.baseURL + error.config.url);
        }
      }

      // Восстанавливаем список из сервера при ошибке
      fetchWatchlist().catch((err) => {
        console.error(
          "Ошибка при восстановлении списка после ошибки удаления:",
          err
        );
      });

      return false;
    }
  };

  // Clear entire watchlist
  const clearWatchlist = async () => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      await getAxiosInstance().delete(`/watchlist/clear`);

      // Обновим список после очистки
      setWatchlist([]);
      return true;
    } catch (error) {
      console.error("Error clearing watchlist:", error);
      return false;
    }
  };

  const value = {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    clearWatchlist,
    isInWatchlist,
    fetchWatchlist,
    lastError,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

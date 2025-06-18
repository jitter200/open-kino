import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, currentUser } = useAuth();
  const navigate = useNavigate();

  // Эффект для проверки роли при монтировании компонента
  useEffect(() => {
    // Дополнительная проверка после загрузки данных
    if (!loading && !isAdmin && isAuthenticated) {
      console.log("Доступ запрещен: пользователь не является администратором");
      navigate("/browse", { replace: true });
    }
  }, [isAdmin, isAuthenticated, loading, navigate]);

  // Если проверка авторизации все еще идет, ничего не рендерим
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    console.log("Пользователь не авторизован, перенаправление на /login");
    return <Navigate to="/login" replace />;
  }

  // Если пользователь авторизован, но не является администратором
  if (!isAdmin) {
    console.log(
      "Пользователь не является администратором, перенаправление на /browse"
    );
    return <Navigate to="/browse" replace />;
  }

  console.log(
    "Доступ разрешен: пользователь является администратором",
    currentUser
  );
  // Если пользователь авторизован и является администратором, показываем защищенный контент
  return children;
};

export default AdminRoute;

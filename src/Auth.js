import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

export const Auth = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, register, error: authError, isAuthenticated } = useAuth();

  useEffect(() => {
    // Если пользователь уже авторизован, перенаправляем на главную
    if (isAuthenticated) {
      navigate("/browse");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Отображаем ошибки аутентификации, если они есть
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const toggleForm = () => {
    setIsSignIn(!isSignIn);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password || (!isSignIn && !name)) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    try {
      let success;

      if (isSignIn) {
        success = await login(email, password);
      } else {
        success = await register(name, email, password);
      }

      if (success) {
        navigate("/browse");
      }
    } catch (err) {
      setError(err.message || "Произошла ошибка при авторизации");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-backdrop">
        <div className="auth-navbar">
          <img
            className="auth-logo"
            src="/assets/netflix-logo.png"
            alt="Netflix"
            onClick={() => navigate("/")}
          />
        </div>
        <div className="auth-content">
          <div className="auth-form-container">
            <h1>{isSignIn ? "Вход" : "Регистрация"}</h1>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isSignIn && (
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input"
                  />
                </div>
              )}

              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                />
              </div>

              <button type="submit" className="auth-button">
                {isSignIn ? "Войти" : "Зарегистрироваться"}
              </button>
            </form>

            <div className="auth-help">
              <label>
                <input type="checkbox" /> Запомнить меня
              </label>
              <a href="#">Нужна помощь?</a>
            </div>

            <div className="auth-switch">
              <p>
                {isSignIn ? "Впервые на Openkino?" : "Уже есть аккаунт?"}
                <span onClick={toggleForm}>
                  {isSignIn ? " Зарегистрируйтесь." : " Войдите."}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaBell,
  FaCaretDown,
  FaGift,
  FaBars,
  FaPlusCircle,
  FaSignInAlt,
  FaUserPlus,
  FaVideo,
} from "react-icons/fa";
import { useAuth } from "../auth";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Обработчик для закрытия меню профиля при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate("/");
    }
  };

  const isHomePage = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled || !isHomePage
          ? "bg-netflix-black shadow-lg"
          : "bg-gradient-to-b from-black/90 via-black/60 to-transparent"
      }`}
    >
      <div className="px-4 py-3 lg:px-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <div className="lg:hidden mr-4 text-white">
            <button onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <FaBars size={24} />
            </button>
          </div>

          <Link to="/" className="mr-8">
            <img
              src="/assets/netflix-logo.png"
              alt="Netflix"
              className="h-12 lg:h-14"
            />
          </Link>

          <div className="hidden lg:flex space-x-8">
            <Link
              to="/series"
              className={`text-base font-medium transition-colors ${
                isActive("/series")
                  ? "text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Сериалы
            </Link>
            <Link
              to="/movies"
              className={`text-base font-medium transition-colors ${
                isActive("/movies")
                  ? "text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Фильмы
            </Link>
            <Link
              to="/new"
              className={`text-base font-medium transition-colors ${
                isActive("/new")
                  ? "text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              Новинки
            </Link>
            {isAuthenticated && (
              <Link
                to="/mylist"
                className={`text-base font-medium transition-colors ${
                  isActive("/mylist")
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Мой список
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <>
                {" "}
                <Link
                  to="/add-movie"
                  className={`text-base font-medium transition-colors flex items-center ${
                    isActive("/add-movie")
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {" "}
                  <FaPlusCircle className="mr-1" /> Добавить фильм{" "}
                </Link>{" "}
                <Link
                  to="/admin/convert-videos"
                  className={`text-base font-medium transition-colors flex items-center ${
                    isActive("/admin/convert-videos")
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {" "}
                  <FaVideo className="mr-1" /> Конвертация{" "}
                </Link>{" "}
              </>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-5">
          {isAuthenticated ? (
            <>
              <FaSearch className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors" />
              <FaGift className="hidden md:block w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors" />
              <FaBell className="w-6 h-6 text-white cursor-pointer hover:text-gray-300 transition-colors" />

              <div className="relative" ref={profileMenuRef}>
                <div
                  className="flex items-center space-x-2 cursor-pointer"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <img
                    src="/assets/avatar.png"
                    alt="Profile"
                    className="w-10 h-10 rounded"
                  />
                  <FaCaretDown
                    className={`text-white transition-transform duration-200 ${
                      showProfileMenu ? "rotate-180" : ""
                    }`}
                    size={16}
                  />
                </div>

                {/* Dropdown menu with explicit visibility control */}
                {showProfileMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-netflix-black border border-gray-700 rounded shadow-xl z-50">
                    <div className="py-2 w-48">
                      {currentUser && (
                        <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                          {currentUser.name || currentUser.email}
                        </div>
                      )}
                      <div className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                        Профиль
                      </div>
                      <div className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer">
                        Настройки
                      </div>
                      <div className="border-t border-gray-700 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
                      >
                        Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {!isActive("/login") && (
                <button
                  onClick={() => navigate("/login")}
                  className="flex items-center text-base text-white bg-transparent hover:bg-white/10 py-2 px-4 rounded transition-colors"
                >
                  <FaSignInAlt className="mr-2" /> Войти
                </button>
              )}
              {!isActive("/signup") && !isHomePage && (
                <button
                  onClick={() => navigate("/signup")}
                  className="flex items-center text-base text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded transition-colors"
                >
                  <FaUserPlus className="mr-2" /> Регистрация
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-netflix-black border-t border-gray-800 px-4 py-2">
          <div className="flex flex-col space-y-3 py-3">
            <Link
              to="/series"
              className="text-base text-gray-300 hover:text-white"
            >
              Сериалы
            </Link>
            <Link
              to="/movies"
              className="text-base text-gray-300 hover:text-white"
            >
              Фильмы
            </Link>
            <Link
              to="/new"
              className="text-base text-gray-300 hover:text-white"
            >
              Новинки
            </Link>
            {isAuthenticated && (
              <Link
                to="/mylist"
                className="text-base text-gray-300 hover:text-white"
              >
                Мой список
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link
                to="/add-movie"
                className="text-base text-gray-300 hover:text-white"
              >
                Добавить фильм
              </Link>
            )}
            {isAuthenticated && isAdmin && (
              <Link
                to="/admin/convert-videos"
                className="text-base text-gray-300 hover:text-white"
              >
                Конвертация видео
              </Link>
            )}
            {isAuthenticated ? (
              <button
                className="text-left text-base text-gray-300 hover:text-white"
                onClick={handleLogout}
              >
                Выйти
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Войти
                </Link>
                <Link
                  to="/signup"
                  className="text-base text-gray-300 hover:text-white"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

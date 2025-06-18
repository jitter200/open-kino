  import React, { useState, useEffect } from "react";
  import { FaPlay, FaInfoCircle, FaAngleDown } from "react-icons/fa";

  const HeroBanner = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    // Имитация автовоспроизведения через некоторое время
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 2000);

      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="relative h-[95vh] w-full overflow-hidden">
        {/* Background Image/Video */}
        <div className="absolute top-0 left-0 h-full w-full">
          <img
            src="/assets/you_tv_show_home.jpg"
            alt="Featured Show"
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              isPlaying ? "opacity-0" : "opacity-100"
            }`}
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black">
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/assets/you_tv_show_home.jpg"
                  alt="Featured Show"
                  className="w-full h-full object-cover opacity-80"
                />
                {/* Здесь можно было бы вставить видео */}
              </div>
            </div>
          )}

          {/* Градиент оверлея */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Контент */}
        <div className="relative h-full flex items-center">
          <div className="px-4 lg:px-16 max-w-4xl space-y-6 animate-slide-up">
            {/* Логотип сериала - удален */}

            <h1 className="netflix-title text-white">YOU</h1>

            <p className="text-xl md:text-2xl text-white text-shadow leading-relaxed font-light max-w-3xl">
              Одержимый книжный менеджер использует современные технологии, чтобы
              внедриться в жизнь тех, кто его заинтересовал. Что может пойти не
              так, когда ради любви готов на всё?
            </p>

            <div className="flex flex-wrap gap-4 pt-6">
              <button className="btn-primary glow-effect group">
                <FaPlay className="mr-3 group-hover:animate-pulse-subtle" />
                <span className="text-lg">Смотреть</span>
              </button>
              <button className="btn-secondary group">
                <FaInfoCircle className="mr-3" />
                <span className="text-lg">Подробнее</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
          <FaAngleDown size={24} className="text-white/70" />
        </div>
      </div>
    );
  };

  export default HeroBanner;

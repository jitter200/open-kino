const axios = require('axios');

// Базовый URL API
const API_BASE_URL = 'http://localhost:5000/api';

// Тестовые функции
async function testMovieNotFound() {
  console.log('\n=== Тест: Фильм не найден ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/nonexistentid`);
    console.log('❌ Ожидалась ошибка 404, но получен ответ:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Правильно получена ошибка 404');
      console.log('Сообщение:', error.response.data.message);
      console.log('Тип ошибки:', error.response.data.error);
    } else {
      console.log('❌ Неожиданная ошибка:', error.message);
    }
  }
}

async function testStreamNotFound() {
  console.log('\n=== Тест: Стрим несуществующего фильма ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/nonexistentid/stream`);
    console.log('❌ Ожидалась ошибка 404, но получен ответ:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Правильно получена ошибка 404 для стрима');
      console.log('Сообщение:', error.response.data.message);
      console.log('Тип ошибки:', error.response.data.error);
    } else {
      console.log('❌ Неожиданная ошибка:', error.message);
    }
  }
}

async function testValidMovie() {
  console.log('\n=== Тест: Валидный фильм ===');
  try {
    // Сначала получим список всех фильмов
    const moviesResponse = await axios.get(`${API_BASE_URL}/movies`);
    if (moviesResponse.data && moviesResponse.data.length > 0) {
      const firstMovie = moviesResponse.data[0];
      console.log('✅ Найден фильм:', firstMovie.title);
      console.log('ID фильма:', firstMovie._id);
      console.log('Доступные видео:', firstMovie.videos);
    } else {
      console.log('⚠️ Нет фильмов в базе данных');
    }
  } catch (error) {
    console.log('❌ Ошибка при получении фильмов:', error.message);
  }
}

// Запуск тестов
async function runTests() {
  console.log('🚀 Запуск тестов обработки ошибок...');
  
  await testMovieNotFound();
  await testStreamNotFound();
  await testValidMovie();
  
  console.log('\n✅ Тесты завершены');
}

// Запускаем тесты только если файл запущен напрямую
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testMovieNotFound, testStreamNotFound, testValidMovie }; 
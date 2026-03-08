// Ждём загрузки DOM перед выполнением кода
document.addEventListener('DOMContentLoaded', function() {
  const video = document.getElementById('webcam');
  const playerMarker = document.getElementById('player-marker');
  const weatherContainer = document.getElementById('weather-data');

  // 1. Включение камеры
  async function startCamera() {
    if (!video) return;

    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 480;
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: isMobile ? 640 : 1280 },
        height: { ideal: isMobile ? 360 : 720 }
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
    } catch (err) {
      if (video) video.style.display = 'none';
    }
  }

  // 2. Новости с ваших RSS‑каналов
  async function updateNews() {
    const rssSources = [
      'https://tass.ru/rss/v2.xml',
      'http://lgz.ru/rss.xml',
      'http://asn24.ru/news/rss.php',
      'http://www.dvizhok.su/rss/',
      'https://www.sports.ru/rss/all_news'
    ];

    for (const rssUrl of rssSources) {
      try {
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) continue;

        const data = await response.json();
        if (data.status === 'ok' && data.items.length > 0) {
          displayNews(data);
          return;
        }
      } catch (e) {
        continue;
      }
    }

    const newsContainer = document.getElementById('rss-news');
    if (newsContainer) {
      newsContainer.innerHTML = '<li>СИНХРОНИЗАЦИЯ ПРЕРВАНА</li>';
    }
  }

  function displayNews(data) {
    const container = document.getElementById('rss-news');
    if (!container) return;

    container.innerHTML = '';
    data.items.slice(0, 6).forEach((item, i) => {
      const li = document.createElement('li');
      li.className = i === 0 ? 'active' : '';
      li.textContent = item.title.substring(0, 100) + (item.title.length > 100 ? '...' : '');
      container.appendChild(li);
    });
  }

  // 3. Погода через Open‑Meteo с автоматическим определением города
  async function updateWeather() {
    try {
      // Получаем координаты пользователя
      const position = await getUserLocation();
      const { latitude, longitude } = position;

      // Получаем название города по координатам
      const cityName = await getCityName(latitude, longitude);

      // Запрос погоды
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        displayWeather(data, cityName); // Передаём название города в функцию отображения
      } else {
        weatherContainer.innerHTML = 'ДАННЫЕ О ПОГОДЕ НЕДОСТУПНЫ';
      }
    } catch (error) {
      console.error('Ошибка получения погоды:', error);
      weatherContainer.innerHTML = 'ОШИБКА ОПРЕДЕЛЕНИЯ МЕСТОПОЛОЖЕНИЯ ИЛИ ЗАГРУЗКИ ПОГОДЫ';
    }
  }

  // Получение координат пользователя (работает и на ПК, и на телефоне)
  function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается'));
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        error => reject(error),
        {
          enableHighAccuracy: true, // Максимальная точность
          timeout: 15000,     // Таймаут 15 секунд
          maximumAge: 60000   // Кэшированные данные до 1 минуты
        }
      );
    });
  }

  // Получение названия города по координатам через Open‑Meteo Reverse Geocoding
  async function getCityName(lat, lon) {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/reverse_geocoding?latitude=${lat}&longitude=${lon}&format=json`);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const city = data.results[0];
        return `${city.name}, ${city.admin1 || ''}`.trim();
      }
      return 'Неизвестный город';
    } catch (error) {
      console.error('Ошибка определения города:', error);
      return 'Неизвестный город';
    }
  }

  function displayWeather(data, cityName) {
    const temp = data.current.temperature_2m.toFixed(1);
    const humidity = data.current.relative_humidity_2m;
    const windSpeed = (data.current.wind_speed_10m * 3.6).toFixed(1); // м/с в км/ч

    weatherContainer.innerHTML = `
      <div class="weather-info">
        <div class="weather-city">${cityName}</div>
        <div class="weather-temp">${temp}°C</div>
        <div class="weather-details">
          <span>Влажность: ${humidity}%</span>
          <span>Ветер: ${windSpeed} км/ч</span>
        </div>
      </div>
    `;
  }

  // 4. Мини‑карта
  function updatePlayerPosition(x, y) {
    const mapWidth = 250, mapHeight = 250;
    const centerX = mapWidth / 2, centerY = mapHeight / 2;
    playerMarker.style.left = `${centerX + (x * 10)}px`;
    playerMarker.style.top = `${centerY - (y * 10)}px`;
  }

  // Запуск систем
  startCamera();
  updateNews();
  updateWeather();
  updatePlayerPosition(0, 0);

  // Периодическое обновление
  setInterval(updateNews, 1800000);  // Каждые 3 минуты
  setInterval(updateWeather, 600000); // Каждые 10 минут
});

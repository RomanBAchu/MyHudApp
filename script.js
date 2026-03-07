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

  // 3. Погода через Open‑Meteo (без API‑ключа)
  async function updateWeather() {
    try {
      const latitude = 55.7558; // Москва
      const longitude = 37.6176;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=Europe/Moscow`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        displayWeather(data);
      } else {
        weatherContainer.innerHTML = 'ДАННЫЕ О ПОГОДЕ НЕДОСТУПНЫ';
      }
    } catch (error) {
      weatherContainer.innerHTML = 'ОШИБКА ЗАГРУЗКИ ПОГОДЫ';
    }
  }

  function displayWeather(data) {
    const temp = data.current.temperature_2m.toFixed(1);
    const humidity = data.current.relative_humidity_2m;
    const windSpeed = (data.current.wind_speed_10m * 3.6).toFixed(1); // м/с в км/ч

    weatherContainer.innerHTML = `
      <div class="weather-info">
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

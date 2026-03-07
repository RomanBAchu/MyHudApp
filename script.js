// Ждём загрузки DOM перед выполнением кода
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('webcam');

    // 1. Включение камеры
    async function startCamera() {
        if (!video) {
            console.error("Элемент #webcam не найден в DOM");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Камера не найдена:", err);
            if (video) {
                video.style.display = 'none';
            }
        }
    }

    // 2. Новости (RSS через прокси) с несколькими источниками
    async function updateNews() {
        // Список бесплатных RSS‑лент
        const rssSources = [
            'https://www.vesti.ru/rss.xml',
            'https://ria.ru/export/rss2/index.xml',
            'https://www.rbc.ru/rss',
            'https://tass.ru/rss/v2.xml',
            'https://lenta.ru/rss',
            'https://www.kommersant.ru/RSS/news.xml'
        ];

        for (const rssUrl of rssSources) {
            try {
                // Используем прокси для преобразования RSS в JSON
                const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
                const response = await fetch(proxyUrl);

                if (!response.ok) {
                    console.warn(`Источник ${rssUrl} недоступен, пробуем следующий...`);
                    continue;
                }

                const data = await response.json();

                if (data.status === 'ok' && data.items.length > 0) {
                    displayNews(data);
                    return; // Успех — выходим из цикла
                }
            } catch (e) {
                console.warn(`Ошибка при загрузке ${rssUrl}:`, e);
                continue;
            }
        }

        // Если все источники не сработали
        const newsContainer = document.getElementById('rss-news');
        if (newsContainer) {
            newsContainer.innerHTML = '<li>СИНХРОНИЗАЦИЯ ПРЕРВАНА</li>';
        }
    }

    function displayNews(data) {
        const container = document.getElementById('rss-news');
        if (!container) return;

        container.innerHTML = ''; // Очистка

        // Берём первые 6 новостей
        data.items.slice(0, 6).forEach((item, i) => {
            const li = document.createElement('li');
            li.className = i === 0 ? 'active' : ''; // Первая новость — активная
            li.textContent = item.title.substring(0, 100) + (item.title.length > 100 ? '...' : '');
            container.appendChild(li);
        });
    }

    // 3. Погода по координатам
   async function updateNews() {
    const rssSources = [
        'https://www.vesti.ru/rss.xml',
        'https://ria.ru/export/rss2/index.xml',
        // ... остальные источники
    ];

    let success = false;

    for (const rssUrl of rssSources) {
        try {
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                console.warn(`Источник ${rssUrl} вернул статус ${response.status}`);
                continue;
            }

            const data = await response.json();

            if (data.status === 'ok' && data.items.length > 0) {
                displayNews(data);
                success = true;
                break; // Успех — выходим из цикла
            } else {
                console.warn(`Данные из ${rssUrl} некорректны:`, data);
            }
        } catch (e) {
            console.error(`Критическая ошибка при загрузке ${rssUrl}:`, e);
        }
    }

    if (!success) {
        const newsContainer = document.getElementById('rss-news');
        if (newsContainer) {
            newsContainer.innerHTML = '<li>СИНХРОНИЗАЦИЯ ПРЕРВАНА</li>';
        }
    }
}


    // Запуск всех систем
    startCamera();
    updateNews();
    updateWeather();

    // Обновление раз в 5 минут (300 000 мс)
    setInterval(() => {
        updateNews();
        updateWeather();
    }, 300000);
});

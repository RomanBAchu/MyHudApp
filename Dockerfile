# Базовый образ: лёгкий Nginx на Alpine Linux
FROM nginx:alpine

# Метаданные образа
LABEL org.opencontainers.image.source="https://github.com/RomanBAchu/MyHudApp"

# Копируем все файлы проекта в директорию Nginx для обслуживания статических файлов
COPY . /usr/share/nginx/html

# Открываем порт 80 для веб‑доступа
EXPOSE 80

# Запуск Nginx в режиме foreground (обязательно для Docker)
CMD ["nginx", "-g", "daemon off;"]

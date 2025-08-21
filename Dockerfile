FROM node:18-bullseye

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
  chromium \
  chromium-sandbox \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libdrm-dev \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libnss3 \
  fonts-liberation \
  libappindicator3-1 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Path Chromium biar Puppeteer bisa jalan
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["npm", "start"]

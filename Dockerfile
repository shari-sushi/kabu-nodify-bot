FROM node:22-slim

# canvas (chartjs-node-canvas) のネイティブ依存
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# データ永続化用のディレクトリを作成
RUN mkdir -p /app/data

# ボリュームマウントポイントを定義
VOLUME /app/data

# 起動時にコマンド登録してから本体を起動
CMD ["sh", "-c", "npm run deploy-commands && node dist/index.js"]

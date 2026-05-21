# ---- Stage 1: build ----
FROM mcr.microsoft.com/playwright:v1.47.0-jammy AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: runtime ----
FROM mcr.microsoft.com/playwright:v1.47.0-jammy
WORKDIR /app
ENV NODE_ENV=production
ENV HEADLESS=true
ENV CI=true

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./
COPY playwright.config.ts ./
COPY tsconfig.json ./
COPY config ./config
COPY pages ./pages
COPY fixtures ./fixtures
COPY setup ./setup
COPY tests ./tests
COPY utils ./utils
COPY src ./src

RUN mkdir -p storage reports

EXPOSE 3000
# CMD ["node", "dist/src/api/index.js"]
CMD ["npx", "playwright", "test", "--project=customer"]

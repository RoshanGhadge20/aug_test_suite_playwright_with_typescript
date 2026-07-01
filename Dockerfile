FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV CI=true
ENV HEADLESS=true

RUN mkdir -p playwright-report test-results storage

CMD ["bash"]
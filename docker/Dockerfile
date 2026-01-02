FROM node:20-alpine

WORKDIR /app

# 개발용 도구 설치
RUN apk add --no-cache git libc6-compat

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스코드 복사
COPY . .

# Next.js 개발 서버 포트
EXPOSE 3000

# 개발 모드 실행
CMD ["npm", "run", "dev"]

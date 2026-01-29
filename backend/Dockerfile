FROM oven/bun:1 As base

WORKDIR /app
COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY . .

RUN bunx prisma generate

EXPOSE 3001

CMD ["bun", "run", "start"]
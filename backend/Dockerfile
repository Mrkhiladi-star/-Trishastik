# Stage 1: Build dependencies
FROM node:20.18.1-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Final minimal production image
FROM node:20.18.1-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "index.js"]

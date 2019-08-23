FROM node:carbon AS builder
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
COPY prod.env .env
RUN npm run build

FROM uninode/puppeteer
WORKDIR /usr/src/app
COPY package*.json ./
COPY yarn.lock ./
COPY prod.env .env
RUN yarn --production
COPY --from=builder /app/.next .next
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]
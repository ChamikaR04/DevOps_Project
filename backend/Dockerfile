FROM node:14-alpine

WORKDIR /app

RUN npm config set strict-ssl false

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
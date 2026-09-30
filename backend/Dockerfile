FROM node:14-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --production

# Rebuild bcrypt specifically for the Linux container
RUN npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
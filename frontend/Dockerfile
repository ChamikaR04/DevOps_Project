FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY . .

ARG REACT_APP_API_URL=http://localhost:5000/
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]
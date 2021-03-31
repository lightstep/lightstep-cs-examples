FROM node:alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . . 

# Expose the port the app runs on
EXPOSE 8080

CMD ["node", "src/server.js"]
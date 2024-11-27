FROM node:22-alpine

COPY package.json /app/package.json
COPY dist /app/dist
COPY bin /app/bin
WORKDIR /app
RUN yarn

CMD ["node", "bin/denon-mqtt-cli.js", "-f", "receivers.json", "-m", "mosquitto"]
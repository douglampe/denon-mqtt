# HACK: Use 18 because newer versions hang in QEMU during npm install
FROM node:18-alpine AS build

COPY . /app
WORKDIR /app
RUN npm i
RUN npm run build

FROM node:22-alpine
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY package.json /app/package.json
COPY bin /app/bin
WORKDIR /app

CMD ["node", "bin/denon-mqtt-cli.js", "-f", "receivers.json", "-m", "mosquitto"]
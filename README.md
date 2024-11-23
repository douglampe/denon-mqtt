# denon-mqtt

## Getting Started

### Clone the repository
```bash
git clone https://github.com/douglampe/denon-state-manager.git
```

### Install dependencies
```bash
yarn
# OR
npm i
```

### Start eclipse mosquito MQTT via docker
```bash
docker compose up -d
```

### Configure .env file
```bash
# MQTT Host address (default is localhost):
MATT_HOST=localhost
# MQTT Port (default is 1883)
MQTT_PORT=1883
# AVR Host address
AVR_HOST=192.168.0.123
```

### Start the interface in dev mode
```bash
yarn dev
# OR
npm run dev
```

## What is This?

This project provides MQTT support Denon and Marantz Audio Video Receivers (AVRs). While it does not provide 100% 
compatibility with the protocol, it has been developed in line with documentation for version ("Application model")
AVR-3312CI/AVR-3312 and version 0.06 of the specification for AVR-S700, S900, X1100, X3100, X4100, X5200, and X7200. It
has been tested with the following receiver models:

- S950H
- X4500H

## Why Does This Exist?

Denon AVRs support both RS-232C and Ethernet interfaces. The Ethernet interface is a TCP interface which does not 
require any authentication or authorization. The interface is bi-directional meaning that changes made to the reciever
by other sources (ex: using the remote control) are broadcasted to the interface. This makes the interface ideal for
integrating with systems which operate best while maitaining accurate state such as the Home Automation platform 
Home Assistant. Unfortunately, Home Assistant supports only Python, but it does support MQTT. Therefore, it is possible 
to build an MQTT interface using Node.js.

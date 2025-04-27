# denon-mqtt

## Getting Started

### AVR Configuration

While it is possible to get the interface up and running with only command-line options, accessing all features requires
a configuration file to configure each AVR controlled by the interface. The interface will look for a file named
`receivers.json` using the following format(see `receivers.json.sample` for an example). In the example below, "Home
Theater" is the configuration for a Denon X4500H and "Office" is the configuration for a Denon S950H.

```JSON
[
  {
    "name": "Home Theater",
    "ip": "192.168.0.1234",
    "id": "home_theater",
    "sources": [
      {"code": "SAT/CBL", "display": "Fire TV"},
      {"code": "DVD", "display": "AppleTV"},
      {"code": "BD", "display": "Blu-ray"},
      {"code": "GAME", "display": "XBox"},
      {"code": "MPLAY", "display": "Karaoke"},
      {"code": "TV", "display": "TV Audio"},
      {"code": "AUX1", "display": "pi"},
      {"code": "AUX2", "display": "AUX2"},
      {"code": "CD", "display": "Alexa"},
      {"code": "PHONO", "display": "Phono"},
      {"code": "TUNER", "display": "Tuner"},
      {"code": "NET", "display": "HEOS Music"}
    ],
    "zones": [
      {
        "index": "1",
        "name": "Living Room",
        "sources": ["SAT/CBL","DVD","BD","GAME","MPLAY","TV","AUX1","AUX2","CD","PHONO","TUNER","NET"]
      },
      {
        "index": "2",
        "name": "Rumpus Room",
        "sources": ["SAT/CBL","DVD","BD","GAME","MPLAY","TV","AUX1","AUX2","CD","PHONO","TUNER","NET"]
      },
      {
        "index": "3",
        "name": "Back Porch",
        "sources": ["SAT/CBL","DVD","BD","GAME","MPLAY","TV","AUX1","AUX2","CD","PHONO","TUNER","NET"]
      }
    ]
  },
  {
    "name": "Office",
    "ip": "192.168.0.5678",
    "id": "office_avr",
    "sources": [
      {"code": "SAT/CBL", "display": "Xbox One"},
      {"code": "DVD", "display": "DVD"},
      {"code": "BD", "display": "Blu-ray"},
      {"code": "GAME", "display": "Xbox One"},
      {"code": "MPLAY", "display": "Media Player"},
      {"code": "TV", "display": "TV Audio"},
      {"code": "AUX1", "display": "AUX1"},
      {"code": "AUX2", "display": "AUX2"},
      {"code": "CD", "display": "Alexa"},
      {"code": "PHONO", "display": "Phono"},
      {"code": "TUNER", "display": "Tuner"},
      {"code": "NET", "display": "HEOS Music"}
    ],
    "zones": [
      {
        "index": "1",
        "name": "Living Room",
        "sources": ["SAT/CBL","DVD","BD","GAME","MPLAY","TV","AUX1","AUX2","CD","PHONO","TUNER","NET"]
      },
      {
        "index": "2",
        "name": "Rumpus Room",
        "sources": ["SAT/CBL","DVD","BD","GAME","MPLAY","TV","AUX1","AUX2","CD","PHONO","TUNER","NET"]
      },
      {
        "index": "3",
        "name": "Back Porch",
        "sources": ["SAT/CBL","DVD","BD","GAME","MPLAY","TV","AUX1","AUX2","CD","PHONO","TUNER","NET"]
      }
    ]
  }
]
```

### Install with yarn orn npm

This method requires [installing Node.js first](https://nodejs.org/en/download).

```bash
# Install:
yarn global add denon-mqtt
# OR
npm i -g denon-mqtt

# Run:
denon-mqtt
```

### Command Line Options

Options:

```
  -i, --info                 Display current version number
  -f, --file <file>          Get configuration from JSON file
  -m, --mqtt <url>           MQTT URL (default: "localhost")
  -u, --username <username>  MQTT Username (default: "user")
  -p, --password <password>  MQTT Password (default: "password")
  --port                     MQTT Port <port>
  --prefix                   MQTT Topic Prefix <prefix>
  -a, --avr <list>           Comma-separated list of AVR IP addresses
  --name <list>              Comma-separated list of AVR friendly names (default: "Home Theater")
  --id <list>                Comma-separated list of AVR unique IDs (default: "denon")
  --zones <list>             Comma-separated list of | separated AVR zone names (default: "Main|Zone 2")
  -h, --help                 display help for command
```

### Run with Docker

Docker run:

```bash
docker run douglampe/denon-mqtt:latest -v ./receivers.json:/app/receivers.json
```

Docker compose:

```yaml
services:
  denon-mqtt:
    container_name: denon-mqtt
    image: douglampe/denon-mqtt:latest
    volumes:
      - ./receivers.json:/app/receivers.json
```

Environment variables supported for setting parameters in Docker container:

- `DMQTT_FILE`: config JSON file
- `DMQTT_HOST`: MQTT URL (default: "localhost")
- `DMQTT_USER`: MQTT Username (default: "user")
- `DMQTT_PASSWORD`: MQTT Password (default: "password")
- `DMQTT_PORT`: MQTT Port <port>
- `DMQTT_PREFIX`: MQTT Topic Prefix <prefix>
- `DMQTT_IP`: Comma-separated list of AVR IP addresses
- `DMQTT_NAME`: Comma-separated list of AVR friendly names (default: "Home Theater")
- `DMQTT_ID`: Comma-separated list of AVR unique IDs (default: "denon")
- `DMQTT_ZONES`: Comma-separated list of | separated AVR zone names (default: "Main|Zone 2")

### Running MQTT

You can use the below Docker compose configuration to run MQTT. Reference the mosquitto documentation for more details.

```yaml
services:
  eclipse-mosquitto:
    container_name: mosquitto
    image: eclipse-mosquitto:latest
    restart: always
    ports:
      - 9001:9001
      - 1883:1883
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - ./mosquitto-users.txt:/mosquitto/config/mosquitto-users.txt
```

## Contributing

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

### Start eclipse mosquito MQTT and Home Assistant via docker

```bash
docker compose up -d
```

### Start the interface in dev mode

```bash
yarn dev
# OR
npm run dev
```

### Start the interface in dev mode using `receivers.json` to configure AVRs

```bash
yarn dev:file
# OR
npm run dev:file
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
Home Assistant. While integrating directly with Home Assistant has advantages such as reduced latency, there are
disadvantages such as platform lock-in. Existing Denon integrations also have limitations. By creating an MQTT
interface, multiple Denon AVRs can be integrated with Home Assistant using the supported MQTT integration while
also providing direct support for any platform that supports MQTT such as Node Red. I also get to write this in
Node.js instead of python which is a win for me IMHO.

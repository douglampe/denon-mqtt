# denon-mqtt

> [!NOTE]
> Note: you must have access to an MQTT server for this interface to work (See below for information on running MQTT 
> via Docker).

This project provides MQTT support for Denon and Marantz Audio Video Receivers (AVRs). While it does not provide 100%
compatibility with the protocol, it has been developed in line with documentation for version ("Application model")
AVR-3312CI/AVR-3312 and version 0.06 of the specification for AVR-S700, S900, X1100, X3100, X4100, X5200, and X7200. It
has been tested with the following receiver models:

- S950H
- X4500H

## Quick Start

```bash
# Create folder to store configuration:
mkdir denon-mqtt
cd denon-mqtt
# Install globally
yarn global add denon-mqtt # OR npm i -g denon-mqtt
# Discover receiver configuration (EXPERIMENTAL):
denon-mqtt -d -a your.avr.ip.address
# Run with discovered configuration
denon-mqtt -f receivers-discovered.json -m mqtt_host_or_ip -u mqtt_username -p mqtt_password
```

If discovery fails, most features are supported by simply providing the AVR IP address via the command line:

```bash
denon-mqtt -a your.avr.ip.address -m mqtt_host_or_ip -u mqtt_username -p mqtt_password
```

If your AVR supports more than 2 zones, you will need to specify names for each zone separated with `|`:

```bash
denon-mqtt -a your.avr.ip.address -z Main Zone|Zone 2|Zone 3  -m mqtt_host_or_ip -u mqtt_username -p mqtt_password
```

See below for the full list of command line options.

## Getting Started

### Install with yarn or npm

This method requires [installing Node.js first](https://nodejs.org/en/download).

```bash
# Install:
yarn global add denon-mqtt
# OR
npm i -g denon-mqtt

# Run:
denon-mqtt
```

### Run with Docker

Run using environment variables:

```bash
docker run douglampe/denon-mqtt:latest -e DMQTT_IP="your.avr.ip.address" \
  -e DMQTT_ZONES="Main|Zone 2|Zone 3" \
  -e DMQTT_HOST="mqtt_host_or_ip" \
  -e DMQTT_USER="mqtt_username" \
  -e DMQTT_PASSWORD="mqtt_password"
```

Run using a configuration file:

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
- `DMQTT_PORT`: MQTT Port (default: 1883)<port>
- `DMQTT_PREFIX`: MQTT Topic Prefix (default: "denon")<prefix>
- `DMQTT_IP`: Comma-separated list of AVR IP addresses
- `DMQTT_NAME`: Comma-separated list of AVR friendly names (default: "Home Theater")
- `DMQTT_ID`: Comma-separated list of AVR unique IDs (default: "denon")
- `DMQTT_ZONES`: Comma-separated list of | separated AVR zone names (default: "Main|Zone 2")

### Run MQTT

You can use the below Docker compose configuration to run MQTT. Reference the 
[mosquitto docker documentation](https://hub.docker.com/_/eclipse-mosquitto) for more details.

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

## Usage

### Command Line Options

Options:

```
  -i, --info                 Display current version number
  -a, --avr <list>           Comma-separated list of AVR IP addresses
  -d, --discover             Discover configuration and write to JSON file (default is receivers-discovered.json)'
  -f, --file <file>          Name of configuration JSON file
  -m, --mqtt <url>           MQTT URL (default: "localhost")
  -u, --username <username>  MQTT Username (default: "user")
  -p, --password <password>  MQTT Password (default: "password")
  --port                     MQTT Port (default: 1883)<port>
  --prefix                   MQTT Topic Prefix (default: "denon")<prefix>
  --name <list>              Comma-separated list of AVR friendly names (default: "Home Theater")
  --id <list>                Comma-separated list of AVR unique IDs (default: "denon")
  -z --zones <list>             Comma-separated list of | separated AVR zone names (default: "Main|Zone 2")
  -h, --help                 display help for command
```

### AVR Discovery (EXPERIMENTAL)

Automated discovery is supported using the AVR native web interface. This process will discover every aspect of the
supported configuration including the AVR name, zone names, and full data for each source (display name, internal 
index, and code used by the Telnet interface). It also maps source to zones where they are supported.

If discovery fails, you will need to manually configure your AVR. See below for the full configuration syntax.

Use the `-d` or `--discover` option run the discovery process. The only other required variable is `-a` or `--avr` 
to specify AVR IP address(es).

```bash
denon-mqtt -d -a your.avr.ip.address
```

The configuration file will be saved in the current path as `receivers-discovered.json`. Any existing files with this
name will be overwritten. To specify a different filename, use the `-f` or `--file` options:

```bash
denon-mqtt -d -a your.avr.ip.address -f your-very-special-file-name.json
```

### AVR Configuration

While it is possible to get the interface up and running with only command-line options, accessing all features requires
a configuration file to configure each AVR controlled by the interface. The interface will look for a file named
`receivers.json` using the following format(see `receivers.json.sample` for an example). In the example below, "Home
Theater" is the configuration for a Denon X4500H and "Office" is the configuration for a Denon S950H.

Note that the `code` value of each source must match the code expected by the control protocol. For the list of sources
for each zone, the value must match a `code` value in the receiver source list.

The `id` value for the AVR is used in the names of MQTT topics and must be unique within the configuraiton.

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

## MQTT Syntax

In addition to the below topics and payloads, you can request updated status data from the receiver by posting a text
payload of `REFRESH` to topic `{prefix}/device/command`. Note that this command will requery all configured receivers.

### Command Topics

The following topics are supported. In each topic name below, `{prefix}` is the global prefix (default: `denon`) and 
`{zone}` is the zone identifier (`main_zone`, `zone1`, `zone2`).

- `{prefix}/switch/{zone}_power/command`
- `{prefix}/switch/{zone}_mute/command`
- `{prefix}/volume/{zone}_volume/command`
- `{prefix}/select/{zone}_source/command`

### Command Payloads

The following payloads formats are required for each command topics:

- power: `{ text: "value" }` where `value` is `ON` or `OFF`
- mute: `{ text: "value" }` where `value` is `ON` or `OFF`
- volume: `{ numeric: value }` where `value` is between 1 and the max volume set for the AVR
- source: `{ text: "value" }` where `value` is a valid source identifier (ex: `BD`, `CD`, `DVD`, `AUX1`, `AUX2`)

### State Topics

NOTE: While the interface maintains state based on the latest messages received from the AVR, it is possible that not
all states will always be available.

The messages are published to the following topics each time a related command is received from the receiver:

- `{prefix}/switch/{zone}_power/state`
- `{prefix}/switch/{zone}_mute/state`
- `{prefix}/volume/{zone}_volume/state`
- `{prefix}/select/{zone}_source/state`
- `{prefix}/select/{zone}_state/state`

### State Payloads

The following text (**NOT** JSON) payloads are published when the interface receives a related command from the receiver:

- power: `ON`|`OFF`
- mute: `ON`|`OFF`
- volume: 2-digit number (ex: `01`)
- source: valid source identifier (ex: `BD`, `CD`, `DVD`, `AUX1`, `AUX2`)

The state topic publishes the full comprehensive state of the AVR in JSON format as an object of key/value pairs. The
following keys are supported:

- ChannelSetting
- ChannelVolume
- DigitalInput
- ECOMode
- MainPower
- MaxVolume
- Mute
- Parameters
- Power
- SD
- Sleep
- Source
- SSLevels
- SSSpeakers
- Standby
- SurroundMode
- VideoSelect
- VideoSelectSource
- HPF
- QuickSelect
- Volume

For settings that support multiple parameters (`ChannelVolume`, `Parameters`, `SSLevels`, etc.), the value will be a 
JSON object with multiple key/value pairs with text format for all values. `Volume` and `MaxVolume` values are numeric
(integer). All other values are text.

For example, the following is a valid main zone status payload:

```json
{
  "ChannelVolume": { "FL":"50", "FR":"50", "C":"50", "SL":"50", "SR":"50" },
  "DigitalInput": "AUTO",
  "MainPower": "ON",
  "MaxVolume": 98,
  "Mute": "OFF",
  "Parameters": { "DRC": "OFF", "LFE": "00", "BAS": "50", "TRE": "50", "TONE CTRL": "OFF", "CLV": "50", "SWL": "50" },
  "Power": "ON",
  "SD": "AUTO",
  "Sleep": "OFF",
  "Source": "SAT/CBL",
  "SSLevels": { "C": "50", "FL": "50", "FR": "50", "SL": "50", "SR": "50", "SBL": "50", "SBR": "50" },
  "SSSpeakers": { "FRO": "LAR", "CEN": "SMA", "SUA": "SMA", "SBK": "2SP", "FRH": "NON", "TFR": "NON", "TPM": "NON",
    "FRD": "NON", "SUD": "NON", "TPR": "NON", "RHE": "NON", "BKD": "NON", "SHE": "NON", "TPS": "NON", "SWF": "NON" },
  "SurroundMode": "DOLBY AUDIO-DD+ +DSUR",
  "VideoSelect": "OFF",
  "Volume": 51
}
```

## Contributing

### Clone the repository

```bash
git clone https://github.com/douglampe/denon-mqtt.git
```

### Install dependencies

```bash
yarn
# OR
npm i
```

### Start eclipse mosquito MQTT and Home Assistant via Docker

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

### Run discovery (must set IP address as DMQTT_IP in .env file first)

```bash
yarn dev:discover
# OR
npm run dev:discover
```

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

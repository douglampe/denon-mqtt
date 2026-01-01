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

> [!NOTE]
> Note: Verion 0.0.5 introduced a **BREAKING CHANGE** to the MQTT schema.

In addition to the below topics and payloads, you can request updated status data from the receiver by posting a text
payload of `REFRESH` to topic `{prefix}/{id}/device/command`.

### Command Topic and Payload

The topic for all commands is `{prefix}/{id}/{zone}/command` where `{prefix}` is the global prefix (default: `denon`), 
`{id}` is the unique identifier of the AVR, and `{zone}` is the zone identifier (`main_zone`, `zone1`, `zone2`).

The following payloads formats are required for each listed setting:

#### Text

```json
{ "[setting]": { "text": "[text]" } }
```

- digital_input
- eco_mode
- main_power
- mute
- power
- sd
- sleep
- source
- standby
- surround_mode
- video_select
- video_select_source
- hpf
- quick_select

#### Numeric

```json
{ "[setting]": { "numeric": [number] } }
```
- max_volume
- volume

#### Key/Value Pairs

```json
{ "[setting]": { "key": "[key]", "value": "[value]" } }
```

- channel_setting
- channel_volume
- ss_levels
- ss_speakers
- parameters

### State Topic and Payload

All state changes are published to `{prefix}/{id}/{zone}/state` where `{prefix}` is the global prefix (default:
`denon`), `{id}` is the unique identifier of the AVR, and `{zone}` is the zone identifier (`main_zone`, `zone1`, 
`zone2`).

The payload syntax varies based on the setting updated as follows:

#### Text

```json
{ "[setting]": "[text]" }
```

- digital_input
- eco_mode
- main_power
- mute
- power
- sd
- sleep
- source
- standby
- surround_mode
- video_select
- video_select_source
- hpf
- quick_select

#### Numeric

```json
{ "[setting]": [number] }
```
- max_volume
- volume

#### Key/Value Pairs

```json
{ "[setting]": { "key": "[key]", "value": "[value]" } }
```

- channel_setting
- channel_volume
- ss_levels
- ss_speakers
- parameters

#### Full State

In addition to individual messages for each setting, the full state is sent every time a value is changed with the
following payload:

```json
{
  "state": [state]
}
```

Where `[state]` is a JSON object with a key for each setting for the zone.

> [!NOTE]
> Note: While the interface maintains state whenever a command is received by the interface, not every value may be
> available at all times.

Each value follows the same syntax as above. For Key/Value pairs, the value is a JSON object containing all values.

For example, below is a valid state from a Denon X4500H:

```json
{
  "state": {
    "channel_volume": {
      "FL": "50",
      "FR": "50",
      "C": "50",
      "SL": "50",
      "SR": "50"
    },
    "digital_input": "AUTO",
    "main_power": "ON",
    "max_volume": 98,
    "mute": "OFF",
    "parameters": {
      "DRC": "OFF",
      "LFE": "00",
      "BAS": "50",
      "TRE": "50",
      "TONE CTRL": "OFF",
      "CLV": "50",
      "SWL": "50"
    },
    "power": "ON",
    "sd": "AUTO",
    "sleep": "OFF",
    "source": "SAT/CBL",
    "ss_levels": {
      "C": "50",
      "FL": "50",
      "FR": "50",
      "SL": "50",
      "SR": "50",
      "SBL": "50",
      "SBR": "50",
      "SB": "50",
      "FHL": "50",
      "FHR": "50",
      "TFL": "50",
      "TFR": "50",
      "TML": "50",
      "TMR": "50",
      "FDL": "50",
      "FDR": "50",
      "SDL": "50",
      "SDR": "50",
      "FWL": "50",
      "FWR": "50",
      "TRL": "50",
      "TRR": "50",
      "RHL": "50",
      "RHR": "50",
      "BDL": "50",
      "BDR": "50",
      "SHL": "50",
      "SHR": "50",
      "TS": "50",
      "SW": "50",
      "SW2": "50"
    },
    "ss_speakers": {
      "FRO": "LAR",
      "CEN": "SMA",
      "SUA": "SMA",
      "SBK": "2SP",
      "FRH": "NON",
      "TFR": "NON",
      "TPM": "NON",
      "FRD": "NON",
      "SUD": "NON",
      "TPR": "NON",
      "RHE": "NON",
      "BKD": "NON",
      "SHE": "NON",
      "TPS": "NON",
      "SWF": "NON"
    },
    "standby": "OFF",
    "surround_mode": "DOLBY AUDIO-DSUR",
    "video_select": "OFF",
    "volume": 56
  }
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

### Run discovery (must set IP address as DMQTT_IP in .env file first)

```bash
yarn dev:discover
# OR
npm run dev:discover
```

### Start the interface in dev mode using `receivers.json` to configure AVRs

```bash
yarn dev:file
# OR
npm run dev:file
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

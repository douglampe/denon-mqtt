# Home Assistant Configuration

This folder contains configuration YAML files for Home Assistant to create all of the entities required to configure
the Universal Media Player integration for two Denon AVRS - an X4500H ("Home Theater" in `receivers.config`) and an
S950H ("Office" in `receivers.config`). A separate media player is configured for each supported zone for each AVR.

The following YAML is the configuration used to configure the Home Theater main zone (`media_player/living.yaml`):

```YAML
  - platform: universal
    name: Living Room Audio
    object_id: denon_avr
    commands:
      turn_on:
        action: switch.turn_on
        target:
          entity_id: switch.denon_main_zone_power
      turn_off:
        action: switch.turn_off
        target:
          entity_id: switch.denon_main_zone_power
      volume_up:
        action: switch.turn_on
        target:
          entity_id: switch.denon_main_zone_volume_up_down
      volume_down:
        action: switch.turn_off
        target:
          entity_id: switch.denon_main_zone_volume_up_down
      volume_mute:
        action: switch.turn_on
        target:
          entity_id: switch.denon_main_zone_mute_toggle
      volume_set:
        action: fan.set_percentage
        target:
          entity_id: fan.denon_main_zone_volume
        data:
          percentage: "{{ (volume_level | float)*100 }}"
    attributes:
      state: switch.denon_main_zone_power
      is_volume_muted: switch.denon_main_zone_mute
      volume_level: sensor.denon_main_zone_volume_percent
      source_list: select.denon_main_zone_source|options
      source: state.select.denon_main_zone_source.state
```

The configuration for each entity used in the media player can be found in the following coinciding YAML files:

```
fan/living.yaml
select/living.yaml
sensor/living.yaml
switch/living.yaml
```

The following entities are used by the media player:

- `fan.denon_main_zone_volume`: Fan used to set the volume based on the "percentage" attribute.
- `select.denon_main_zone_source`: Select used to select the source.
- `switch.denon_main_zone_power`: Switch used to turn the main zone power on and off.
- `switch.denon_main_zone_mute`: Switch used to turn the main zone mute on and off.
- `switch.denon_main_zone_mute_toggle`: Switch used to toggle the main zone mute every time it is pressed (required by Universal Media Player).
- `switch.denon_main_zone_volume_up_down`: Switch used to send volume up and down commands when the switch is turned on and off respectively.
- `switch.denon_main_zone_volume_percent`: Sensor which converts the volume to a decimal value between 0 and 1 (required by Universal Media Player).

The following entity is not used by Universal Media Player:

- `sensor.denon_main_zone_state`: Used to capture all state attributes from the AVR as attributes of the sensor.
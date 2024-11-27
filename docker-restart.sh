#!/bin/bash
docker compose down
docker compose up -d
docker logs denon-mqtt
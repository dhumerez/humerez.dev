#!/bin/bash
# Runs on the server (webhook listener) from /opt/apps/humerez-landing.
# Syncs the repo's site/ into the nginx-served directory.
set -e
cd /opt/apps/humerez-landing
git fetch origin master
git reset --hard origin/master
rsync -a --delete site/ /opt/traefik/landing/site/
echo "Landing page deployed ($(git rev-parse --short HEAD))"

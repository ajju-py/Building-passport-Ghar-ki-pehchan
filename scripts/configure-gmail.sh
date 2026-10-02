#!/bin/bash
set -e
echo "Starting Building Passport Gmail SMTP configuration..."
if [ -n "$GMAIL_TEST_RECIPIENT" ]; then
    sudo GMAIL_TEST_RECIPIENT="$GMAIL_TEST_RECIPIENT" python3 /opt/building-passport/scripts/configure-gmail.py
else
    sudo python3 /opt/building-passport/scripts/configure-gmail.py
fi

#!/bin/bash
# Skript zum Aufrufen des Reminder-Cron-Jobs
# Kann via crontab oder Docker-Scheduler aufgerufen werden
#
# Beispiel für crontab (alle 5 Minuten):
# */5 * * * * /path/to/familily/scripts/send-reminders.sh
#
# Bei Verwendung von CRON_SECRET:
# CRON_SECRET=your-secret-here /path/to/familily/scripts/send-reminders.sh

BASE_URL="${NEXTAUTH_URL:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/cron/reminders"

if [ -n "$CRON_SECRET" ]; then
    curl -s -H "Authorization: Bearer ${CRON_SECRET}" "${ENDPOINT}"
else
    curl -s "${ENDPOINT}"
fi

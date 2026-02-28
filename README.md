# Kaseya Center Calendar

Automatically scrapes upcoming events from [kaseyacenter.com/calendar](https://www.kaseyacenter.com/calendar) and publishes them as a subscribable `.ics` calendar file.

## Subscribe

Add this URL to your calendar app:

```
https://raw.githubusercontent.com/ihorbond/kaseya-center-calendar/master/events.ics
```

| App | Steps |
|---|---|
| **Google Calendar** | Settings → Other calendars → "From URL" → paste URL |
| **Apple Calendar** | File → New Calendar Subscription → paste URL |
| **Outlook** | Add calendar → Subscribe from web → paste URL |

Your calendar app will automatically pick up the latest events when it refreshes.

## How it works

1. A GitHub Actions workflow runs on the **1st and 15th of every month**
2. It scrapes the Kaseya Center website using [axios](https://axios-http.com/) + [cheerio](https://cheerio.js.org/)
3. It generates a fresh `events.ics` using [ical-generator](https://github.com/sebbo2002/ical-generator)
4. The updated file is committed back to this repo, making it instantly available via the raw URL above

Each event in the calendar includes the event name, date, start time, venue address, and a link back to the Kaseya Center event page.

## Run locally

```bash
npm install
npm start
```

This regenerates `events.ics` from the current live calendar page.

## Manual refresh

You can trigger a sync at any time from the [Actions tab](../../actions/workflows/sync.yml) → "Run workflow".

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

1. A GitHub Actions workflow runs on the **15th and 28th of every month**
2. It launches a headless Chromium browser via [Playwright](https://playwright.dev/) and navigates the Kaseya Center website, clicking through **6 months** of the calendar
3. Events are parsed with [cheerio](https://cheerio.js.org/) and written to `events.ics` using [ical-generator](https://github.com/sebbo2002/ical-generator)
4. The updated file is committed back to this repo, making it instantly available via the raw URL above

Each event includes the name, date, start time, venue address, and a direct link to the Kaseya Center event page.

### Refresh schedule

| Run | When | What it does |
|---|---|---|
| Mid-month | 15th at 9:00 AM UTC | Resyncs the current 6-month window to catch new or changed events |
| End-of-month | 28th at 9:00 AM UTC | Same — ensures the calendar stays current as the venue publishes upcoming events |

> Events without a confirmed date (e.g. recurring tours, TBA shows) are omitted until the venue posts a specific date.

## Run locally

```bash
npm install
npx playwright install chromium
npm start
```

This regenerates `events.ics` from the current live calendar.

## Manual refresh

Trigger a sync at any time from the [Actions tab](../../actions/workflows/sync.yml) → "Run workflow".

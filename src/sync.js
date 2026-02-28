'use strict';

const fs = require('fs');
const path = require('path');
const { scrapeMonth } = require('./scraper');
const { buildCalendar } = require('./ical');

const ICS_PATH = path.join(__dirname, '..', 'events.ics');

// If we're in the last week of the month, get ahead and scrape next month.
// Otherwise resync the current month to catch any changes.
function getTargetMonth() {
  const today = new Date();
  const day = today.getDate();

  if (day >= 25) {
    const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { year: next.getFullYear(), month: next.getMonth() + 1 };
  }
  return { year: today.getFullYear(), month: today.getMonth() + 1 };
}

async function run() {
  const { year, month } = getTargetMonth();
  const label = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  console.log(`[${new Date().toISOString()}] Scraping Kaseya Center — target: ${label}`);

  let events;
  try {
    events = await scrapeMonth(year, month);
  } catch (err) {
    console.error('Scrape failed:', err.message);
    process.exit(1);
  }

  console.log(`Found ${events.length} events`);
  events.forEach(e =>
    console.log(`  - ${e.name} | ${e.dateText || 'no date'} ${e.timeText || ''}`.trim())
  );

  const calendar = buildCalendar(events);
  fs.writeFileSync(ICS_PATH, calendar.toString(), 'utf8');
  console.log(`\nWrote ${ICS_PATH}`);
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

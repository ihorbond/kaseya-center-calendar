'use strict';

const fs = require('fs');
const path = require('path');
const { scrapeEvents } = require('./scraper');
const { buildCalendar } = require('./ical');

const ICS_PATH = path.join(__dirname, '..', 'events.ics');

async function run() {
  console.log(`[${new Date().toISOString()}] Scraping Kaseya Center events...`);

  let events;
  try {
    events = await scrapeEvents();
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

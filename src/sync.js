'use strict';

const fs = require('fs');
const path = require('path');
const { scrapeMonths } = require('./scraper');
const { buildCalendar } = require('./ical');

const ICS_PATH = path.join(__dirname, '..', 'events.ics');
const MONTHS_AHEAD = 6;

function getTargetMonths() {
  const today = new Date();
  const months = [];
  for (let i = 0; i < MONTHS_AHEAD; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

async function run() {
  const months = getTargetMonths();
  const range = `${fmt(months[0])} – ${fmt(months[months.length - 1])}`;
  console.log(`[${new Date().toISOString()}] Scraping Kaseya Center: ${range}`);

  let events;
  try {
    events = await scrapeMonths(months);
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

function fmt({ year, month }) {
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

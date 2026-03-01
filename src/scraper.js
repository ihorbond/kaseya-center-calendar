'use strict';

const { chromium } = require('playwright');
const cheerio = require('cheerio');

const CALENDAR_URL = 'https://www.kaseyacenter.com/calendar';
const API_URL = (year, month) =>
  `https://www.kaseyacenter.com/events/calendar/${year}/${month}` +
  `?v=2&detail_partial=modules%2Fevents%2Fpartials%2Ffull_page_calendar_event_item`;

// "8:00pm  20:00" → "8:00 PM"
function normalizeTime(raw) {
  const match = raw.match(/\b(\d{1,2}:\d{2})(am|pm)\b/i);
  if (!match) return '';
  return `${match[1]} ${match[2].toUpperCase()}`;
}

// dateKey "MM-DD-YYYY" + time "8:00 PM" → ISO string
function toISO(dateKey, timeStr) {
  const [mm, dd, yyyy] = dateKey.split('-');
  const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  if (isNaN(dt.getTime())) return null;
  if (timeStr) {
    const t = new Date(`${yyyy}-${mm}-${dd} ${timeStr}`);
    if (!isNaN(t.getTime())) return t.toISOString();
  }
  return dt.toISOString();
}

// "MM-DD-YYYY" → "May 2, 2026"
function toDateText(dateKey) {
  const [mm, dd, yyyy] = dateKey.split('-');
  return new Date(`${yyyy}-${mm}-${dd}`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function parseMonthData(dateKeyedJson) {
  const events = [];

  for (const [dateKey, html] of Object.entries(dateKeyedJson)) {
    const $ = cheerio.load(html);

    $('.event_item').each((_, el) => {
      const $el = $(el);
      const $link = $el.find('h3 a').first();
      const name = $link.text().trim();
      const href = $link.attr('href') || '';
      if (!name || !href) return;

      const slug = href.replace(/^.*\/events\/detail\//, '').replace(/\/$/, '');
      const timeText = normalizeTime($el.find('.showings.time').text());
      const dateText = toDateText(dateKey);

      events.push({
        slug,
        name,
        dateText,
        timeText,
        startISO: toISO(dateKey, timeText),
        url: href,
      });
    });
  }

  return events;
}

async function scrapeMonths(months) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    // Load the main page once to establish session cookies
    await page.goto(CALENDAR_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const allEvents = [];
    const seenSlugs = new Set();

    for (const { year, month } of months) {
      const res = await page.request.get(API_URL(year, month), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (!res.ok()) {
        console.warn(`  Warning: ${year}/${month} returned HTTP ${res.status()}`);
        continue;
      }

      const data = await res.json();
      const monthLabel = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      console.log(`  ${monthLabel}: ${Object.keys(data).length} event days`);

      for (const event of parseMonthData(data)) {
        if (!seenSlugs.has(event.slug)) {
          seenSlugs.add(event.slug);
          allEvents.push(event);
        }
      }
    }

    return allEvents;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeMonths };

'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.kaseyacenter.com';
const CALENDAR_URL = `${BASE_URL}/calendar`;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// "Saturday | Feb 28, 2026" → "Feb 28, 2026"
function normalizeDateText(raw) {
  return raw.replace(/^[^|]+\|\s*/, '').trim();
}

// "Feb 28, 2026" + " 3:30 PM" → ISO string in ET
function parseStartISO(dateText, timeText) {
  if (!dateText) return null;
  const clean = `${dateText} ${timeText || ''}`.trim();
  const dt = new Date(clean);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

async function scrapeEvents() {
  const { data: html } = await axios.get(CALENDAR_URL, {
    headers: HEADERS,
    timeout: 15000,
  });

  const $ = cheerio.load(html);
  const events = [];

  $('.m-venueframework-eventslist__item').each((_, el) => {
    const $el = $(el);

    const $titleLink = $el.find('.m-eventItem__title a').first();
    const name = $titleLink.text().trim();
    const href = $titleLink.attr('href') || '';
    if (!name || !href) return;

    const slug = href.replace(/^.*\/events\/detail\//, '').replace(/\/$/, '');

    const rawDate = $el.find('.m-date__singleDate').text().trim();
    const dateText = normalizeDateText(rawDate); // "Feb 28, 2026"

    const timeText = $el.find('.m-eventItem__start').text().trim(); // "3:30 PM"

    events.push({
      slug,
      name,
      dateText,
      timeText,
      startISO: parseStartISO(dateText, timeText),
      url: href,
    });
  });

  return events;
}

module.exports = { scrapeEvents };

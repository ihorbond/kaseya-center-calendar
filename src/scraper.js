'use strict';

const { chromium } = require('playwright');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.kaseyacenter.com';

const NEXT_BUTTON = '.cal-next';
const MONTH_LABEL = '.month_name';

const MONTH_NAMES = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

// Reads the month/year label → { month: 1-12, year }
async function getDisplayedMonth(page) {
  const text = await page.locator(MONTH_LABEL).textContent({ timeout: 5000 });
  const match = text.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
  );
  if (!match) return null;
  return {
    month: MONTH_NAMES.indexOf(match[1].toLowerCase()) + 1,
    year: parseInt(match[2], 10),
  };
}

function parseEvents($) {
  const events = [];

  $('.m-venueframework-eventslist__item').each((_, el) => {
    const $el = $(el);
    const $titleLink = $el.find('.m-eventItem__title a').first();
    const name = $titleLink.text().trim();
    const href = $titleLink.attr('href') || '';
    if (!name || !href) return;

    const slug = href.replace(/^.*\/events\/detail\//, '').replace(/\/$/, '');
    const rawDate = $el.find('.m-date__singleDate').text().trim();
    const dateText = rawDate.replace(/^[^|]+\|\s*/, '').trim(); // strip "Saturday | "
    const timeText = $el.find('.m-eventItem__start').text().trim();

    let startISO = null;
    if (dateText) {
      const dt = new Date(`${dateText} ${timeText}`.trim());
      if (!isNaN(dt.getTime())) startISO = dt.toISOString();
    }

    events.push({ slug, name, dateText, timeText, startISO, url: href });
  });

  return events;
}

async function scrapeMonth(targetYear, targetMonth) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/calendar`, { waitUntil: 'networkidle', timeout: 30000 });

    // Navigate forward until we reach the target month (never go back)
    for (let i = 0; i < 12; i++) {
      const current = await getDisplayedMonth(page);
      if (!current) break;
      if (current.year === targetYear && current.month === targetMonth) break;
      // Stop if we've overshot
      if (current.year > targetYear || (current.year === targetYear && current.month > targetMonth)) break;

      await page.locator(NEXT_BUTTON).click();
      await page.waitForTimeout(800); // allow calendar to re-render
    }

    const html = await page.content();
    return parseEvents(cheerio.load(html));
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeMonth };

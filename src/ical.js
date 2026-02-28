'use strict';

const ical = require('ical-generator');

const TIMEZONE = 'America/New_York';
const LOCATION = 'Kaseya Center, 601 Biscayne Blvd, Miami, FL 33132';
const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

function buildCalendar(events) {
  const calendar = ical.default({
    name: 'Kaseya Center Events',
    description: 'Events scraped from kaseyacenter.com/calendar',
    timezone: TIMEZONE,
    url: 'https://www.kaseyacenter.com/calendar',
    ttl: 60 * 60 * 12, // suggest clients refresh every 12 hours
  });

  for (const event of events) {
    let start, end, allDay;

    if (event.startISO) {
      start = new Date(event.startISO);
      end = new Date(start.getTime() + DEFAULT_DURATION_MS);
      allDay = false;
    } else if (event.dateText) {
      // No time available — make it an all-day event
      start = new Date(event.dateText);
      end = new Date(start);
      allDay = true;
    } else {
      // No date at all — skip rather than create a broken event
      continue;
    }

    calendar.createEvent({
      id: `${event.slug}@kaseyacenter.com`,
      summary: event.name,
      start,
      end,
      allDay,
      timezone: TIMEZONE,
      location: LOCATION,
      description: `More info: ${event.url}`,
      url: event.url,
    });
  }

  return calendar;
}

module.exports = { buildCalendar };

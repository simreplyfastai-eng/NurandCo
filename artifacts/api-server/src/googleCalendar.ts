import { google } from 'googleapis';
import { supabaseAdmin as supabase } from './lib/supabase';

interface BookingData {
  date: string;
  time: string;
  treatment_name: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

async function getClientForLocation(locationId: string) {
  const { data: tokenRow, error } = await supabase
    .from('google_calendar_tokens')
    .select('*')
    .eq('location_id', locationId)
    .single();

  if (error || !tokenRow) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    expiry_date: Number(tokenRow.expiry_date),
  });

  if (Date.now() >= Number(tokenRow.expiry_date) - 60000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: credentials.access_token,
          expiry_date: credentials.expiry_date,
          updated_at: new Date().toISOString(),
        })
        .eq('location_id', locationId);
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error('Token refresh failed for location', locationId, err);
      return null;
    }
  }

  return { oauth2Client, calendarId: tokenRow.calendar_id };
}

export async function createCalendarEvent(
  locationId: string,
  booking: BookingData
): Promise<string | null> {
  const conn = await getClientForLocation(locationId);
  if (!conn) return null;

  const calendar = google.calendar({ version: 'v3', auth: conn.oauth2Client });
  const time = booking.time.length === 5 ? `${booking.time}:00` : booking.time;
  const startISO = new Date(`${booking.date}T${time}`).toISOString();
  const endISO = new Date(new Date(startISO).getTime() + 2 * 60 * 60 * 1000).toISOString();

  // ── Build rich event title + description from location row ──────────────────
  let summary: string;
  let description: string;

  try {
    const { data: loc, error: locErr } = await supabase
      .from('locations')
      .select('name, address')
      .eq('id', locationId)
      .single();

    if (locErr || !loc) throw new Error(locErr?.message ?? 'No location row');

    const locNameUpper = loc.name.toUpperCase();
    const treatUpper   = booking.treatment_name.toUpperCase();
    const displayTime  = booking.time.slice(0, 5); // HH:MM

    // "April 26, 2026" — parse date parts explicitly to stay UTC-safe
    const [y, mo, d] = booking.date.split('-').map(Number);
    const dateLabel = new Intl.DateTimeFormat('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    }).format(new Date(Date.UTC(y, mo - 1, d)));

    summary = `${booking.customer_name}: ${treatUpper} (${locNameUpper} CLINIC)`;
    description = [
      `${dateLabel} ${displayTime} BST`,
      `Calendar: ${locNameUpper} CLINIC`,
      `Name: ${booking.customer_name}`,
      `Phone: ${booking.customer_phone ?? ''}`,
      `Email: ${booking.customer_email ?? ''}`,
      ``,
      `Location`,
      `============`,
      `${loc.address}`,
      ``,
      `Booked via: StarrBeauty website`,
    ].join('\n');

  } catch (err) {
    console.warn('Google Calendar: could not fetch location, using minimal format:', err);
    summary     = `${booking.treatment_name} — ${booking.customer_name}`;
    description = `Phone: ${booking.customer_phone ?? ''}\nEmail: ${booking.customer_email ?? ''}`;
  }

  const event = await calendar.events.insert({
    calendarId: conn.calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startISO, timeZone: 'Europe/London' },
      end:   { dateTime: endISO,   timeZone: 'Europe/London' },
    },
  });

  return event.data.id || null;
}

export async function deleteCalendarEvent(
  locationId: string,
  googleEventId: string
): Promise<void> {
  if (!googleEventId) return;
  const conn = await getClientForLocation(locationId);
  if (!conn) return;

  const calendar = google.calendar({ version: 'v3', auth: conn.oauth2Client });
  try {
    await calendar.events.delete({
      calendarId: conn.calendarId,
      eventId: googleEventId,
    });
  } catch (err: any) {
    if (err.code !== 404 && err.code !== 410) throw err;
  }
}

/** Convert a Google Calendar dateTime string to minutes-since-midnight in Europe/London */
function dateTimeToLondonMinutes(dateTimeStr: string): number {
  const d = new Date(dateTimeStr);
  const londonStr = d.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  // Format: "14:30" (en-GB hour12:false guarantees HH:MM)
  const [h, m] = londonStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Fetch all timed events from the location's primary Google Calendar for a given date.
 * Returns busy ranges as { start, end } minutes-since-midnight in Europe/London.
 * All-day events (no dateTime) are skipped.
 * Falls back to [] on any error so booking pages always load.
 */
export async function getGoogleCalendarBusyRanges(
  locationId: string,
  date: string,
): Promise<Array<{ start: number; end: number }>> {
  try {
    const conn = await getClientForLocation(locationId);
    if (!conn) return [];

    const calendar = google.calendar({ version: 'v3', auth: conn.oauth2Client });

    // TZ=Europe/London is set at server startup, so new Date('YYYY-MM-DDT00:00:00')
    // is correctly interpreted as London midnight (handles BST/GMT automatically).
    const timeMin = new Date(`${date}T00:00:00`).toISOString();
    const timeMax = new Date(`${date}T23:59:59`).toISOString();

    const result = await calendar.events.list({
      calendarId: conn.calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = result.data.items ?? [];
    const ranges: Array<{ start: number; end: number }> = [];

    for (const event of events) {
      // Skip all-day events — they have only start.date, not start.dateTime
      if (!event.start?.dateTime || !event.end?.dateTime) continue;

      const start = dateTimeToLondonMinutes(event.start.dateTime);
      const end   = dateTimeToLondonMinutes(event.end.dateTime);
      ranges.push({ start, end });
    }

    console.log('Google Calendar busy ranges', { locationId, date, ranges });
    return ranges;
  } catch (err) {
    console.error('Google Calendar read failed', { locationId, date, error: err });
    return [];
  }
}

export async function getBusyTimesForDate(
  locationId: string,
  dateStr: string
): Promise<Array<{ start: string; end: string }>> {
  const conn = await getClientForLocation(locationId);
  if (!conn) return [];

  const calendar = google.calendar({ version: 'v3', auth: conn.oauth2Client });
  const timeMin = new Date(`${dateStr}T00:00:00`).toISOString();
  const timeMax = new Date(`${dateStr}T23:59:59`).toISOString();

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: 'Europe/London',
      items: [{ id: conn.calendarId }],
    },
  });

  const busy = res.data.calendars?.[conn.calendarId]?.busy || [];
  return busy
    .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
    .map((b) => ({ start: b.start, end: b.end }));
}

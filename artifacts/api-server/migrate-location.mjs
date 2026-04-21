// One-time data fix: move Sim's client + April 22 booking to Marylebone
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nkbzwkdtpvmmrqtyutzq.supabase.co';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY;
if (!SERVICE_KEY) { console.error('SUPABASE_SERVICE_KEY not set'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// 1. Get location UUIDs from slugs
const { data: locs, error: locErr } = await sb.from('locations').select('id,slug,name');
if (locErr) { console.error('locations error:', locErr); process.exit(1); }
console.log('Locations:', JSON.stringify(locs));

const marylebone = locs?.find(l => l.slug === 'marylebone');
const hornchurch = locs?.find(l => l.slug === 'hornchurch');
if (!marylebone) { console.error('Marylebone location not found'); process.exit(1); }
console.log(`Hornchurch: ${hornchurch?.id}`);
console.log(`Marylebone: ${marylebone.id}`);

// 2. Read client
const { data: clientRows } = await sb.from('clients').select('id,name,email,location_id').eq('email', 'sim6ix@icloud.com');
console.log('Client rows:', JSON.stringify(clientRows));

// 3. Update client location_id if it is NOT already Marylebone
if (clientRows?.length) {
  for (const c of clientRows) {
    if (c.location_id !== marylebone.id) {
      const { error } = await sb.from('clients').update({ location_id: marylebone.id }).eq('id', c.id);
      if (error) console.error('client update error:', error);
      else console.log(`Updated client ${c.name} (${c.id}) → Marylebone`);
    } else {
      console.log(`Client ${c.name} already on Marylebone`);
    }
  }
}

// 4. Read April 22 bookings
const { data: bkRows } = await sb.from('bookings').select('id,booking_date,location_id,status,client_id').eq('booking_date', '2026-04-22');
console.log('April 22 bookings:', JSON.stringify(bkRows));

// 5. Update any April 22 bookings not already on Marylebone
if (bkRows?.length) {
  for (const bk of bkRows) {
    if (bk.location_id !== marylebone.id) {
      const { error } = await sb.from('bookings').update({ location_id: marylebone.id }).eq('id', bk.id);
      if (error) console.error('booking update error:', error);
      else console.log(`Updated booking ${bk.id} (${bk.booking_date}) → Marylebone`);
    } else {
      console.log(`Booking ${bk.id} already on Marylebone`);
    }
  }
}

console.log('Migration complete.');

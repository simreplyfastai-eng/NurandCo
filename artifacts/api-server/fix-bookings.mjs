import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://nkbzwkdtpvmmrqtyutzq.supabase.co', process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const MARYLEBONE = '5b3d890a-bf6f-4e87-af43-5db0726a46ce';

// Check April 22 bookings
const { data: bkRows } = await sb.from('bookings').select('id,booking_date,location_id,status,client_id').eq('booking_date', '2026-04-22');
console.log('April 22 bookings:', JSON.stringify(bkRows));

if (bkRows?.length) {
  for (const bk of bkRows) {
    if (bk.location_id !== MARYLEBONE) {
      const { error } = await sb.from('bookings').update({ location_id: MARYLEBONE }).eq('id', bk.id);
      if (error) console.error('booking update error:', JSON.stringify(error));
      else console.log('Updated booking', bk.id, '→ Marylebone');
    } else {
      console.log('Already Marylebone:', bk.id);
    }
  }
} else {
  console.log('No April 22 bookings found at all.');
}

// Verify client update
const { data: c } = await sb.from('clients').select('id,name,location_id').eq('email', 'sim6ix@icloud.com');
console.log('Client now:', JSON.stringify(c));

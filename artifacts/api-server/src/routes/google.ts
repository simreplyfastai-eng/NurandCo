import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getOAuthClient } from '../googleCalendar';
import { requireAuth } from '../lib/auth';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

router.get('/auth', async (req: Request, res: Response) => {
  const { location_id } = req.query;
  if (!location_id) {
    return res.status(400).send('Missing location_id');
  }

  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: String(location_id),
  });
  res.redirect(url);
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code, state: locationId, error } = req.query;

  if (error) {
    console.error('Google OAuth denied:', error);
    return res.redirect('/admin/settings?google=denied');
  }

  if (!code || !locationId) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(String(code));

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Missing tokens from Google response');
    }

    const { error: upsertError } = await supabase
      .from('google_calendar_tokens')
      .upsert(
        {
          location_id: locationId,
          calendar_id: 'primary',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'location_id' }
      );

    if (upsertError) throw upsertError;

    res.redirect('/admin/settings?google=connected');
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect('/admin/settings?google=error');
  }
});

router.get('/status', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { location_id } = req.query;
  if (!location_id) return res.status(400).json({ error: 'location_id required' });

  const { data } = await supabase
    .from('google_calendar_tokens')
    .select('location_id, updated_at')
    .eq('location_id', location_id)
    .single();

  res.json({
    connected: !!data,
    connected_at: data?.updated_at || null,
  });
});

router.post('/disconnect', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const { location_id } = req.body;
  if (!location_id) return res.status(400).json({ error: 'location_id required' });

  await supabase
    .from('google_calendar_tokens')
    .delete()
    .eq('location_id', location_id);

  res.json({ success: true });
});

export default router;

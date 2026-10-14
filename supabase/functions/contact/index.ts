/** Public contact endpoint, deployed as a Supabase Edge Function.
 * Required Supabase secrets:
 *   RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, CONTACT_RATE_SALT, SITE_ORIGIN
 * The sending domain on CONTACT_FROM_EMAIL must be verified with Resend.
 * Deploy using: supabase functions deploy contact --no-verify-jwt
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN') || '';
const allowed = (origin: string) => origin === SITE_ORIGIN || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
const headers = (origin: string) => ({
  'Access-Control-Allow-Origin': allowed(origin) ? origin : SITE_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
});
const reply = (body: unknown, status: number, origin: string) =>
  new Response(JSON.stringify(body), { status, headers: headers(origin) });
const toHex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, { status: allowed(origin) ? 204 : 403, headers: headers(origin) });
  if (request.method !== 'POST') return reply({ ok:false, error:'Method not allowed' }, 405, origin);
  if (!allowed(origin)) return reply({ ok:false, error:'Origin not allowed' }, 403, origin);
  if (Number(request.headers.get('content-length') || 0) > 15_000) return reply({ ok:false, error:'Payload too large' }, 413, origin);

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    const to = Deno.env.get('CONTACT_TO_EMAIL');
    const from = Deno.env.get('CONTACT_FROM_EMAIL');
    const salt = Deno.env.get('CONTACT_RATE_SALT');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!apiKey || !to || !from || !salt || !supabaseUrl || !secret)
      return reply({ ok:false, error:'Email backend is not configured' }, 503, origin);

    const input = await request.json();
    const name = String(input?.name || '').trim();
    const email = String(input?.email || '').trim();
    const topic = String(input?.topic || 'General note').trim();
    const message = String(input?.message || '').trim();
    const honey = String(input?.company_website || '');
    if (honey) return reply({ ok:false, error:'Could not process request' }, 400, origin);
    if (name.length < 2 || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        || topic.length > 100 || message.length < 10 || message.length > 5000)
      return reply({ ok:false, error:'Please check all form fields' }, 400, origin);

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unavailable';
    const hash = toHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt + ip))));
    const db = createClient(supabaseUrl, secret, { auth:{ persistSession:false } });
    const { data: allowedRate, error: rateError } = await db.rpc('reserve_contact_rate',{p_hash:hash});
    if (rateError) {console.error('Rate limiter error:',rateError.message);return reply({ok:false,error:'Service unavailable'},503,origin)}
    if (!allowedRate) return reply({ok:false,error:'Too many messages. Try again later.'},429,origin);

    const response = await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({from,to:[to],reply_to:email,subject:`[Moreshwar / Lab] ${topic.replace(/[\r\n]/g,' ').slice(0,80)}`,
        text:`New website message\n\nName: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`})
    });
    if(!response.ok){console.error('Email service error:', response.status);return reply({ok:false,error:'Message delivery failed'},502,origin)}
    const {error:saveError}=await db.from('contact_messages').insert({sender_name:name,sender_email:email,topic,message,delivered:true});
    if(saveError)console.error('Message audit save failed:',saveError.message);
    return reply({ok:true},200,origin);
  } catch(err) {console.error('Contact error:',err);return reply({ok:false,error:'Unexpected server error'},500,origin)}
});
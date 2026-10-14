/** Public, non-secret configuration. Fill these after creating a Supabase project.
 * NEVER paste service_role, Resend or Gmail credentials into this file.
 */
window.MORESHWAR_CONFIG = {
  supabaseUrl: '',
  supabasePublishableKey: '',
  // Edge Function named contact, deployed in the same Supabase project.
  // Emails are sent server-side to CONTACT_TO_EMAIL (a Supabase secret).
  siteTitle: 'Moreshwar — Research in Progress'
};
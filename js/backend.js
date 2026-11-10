(function () {
  'use strict';

  window.naviaBackendReady = (async function () {
    const configResponse = await fetch('/api/config');
    if (!configResponse.ok) {
      let details = {};
      try {
        details = await configResponse.json();
      } catch (error) {
        console.error('The Supabase configuration endpoint did not return JSON.', error);
      }
      throw new Error(details.error || 'No se pudo cargar la configuración de Supabase.');
    }

    const config = await configResponse.json();
    if (!window.supabase?.createClient) {
      throw new Error('No se pudo cargar el cliente de Supabase.');
    }

    window.naviaSupabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return window.naviaSupabase;
  })();
})();

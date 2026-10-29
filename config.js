/* Configuración del Monitor de Ciberseguridad.
   fuente: 'local'    -> lee datos/datos.js; las decisiones de revisión se guardan en el navegador.
   fuente: 'supabase' -> lee y escribe en una base de datos Supabase (completar url y anonKey). */
window.MX_CONFIG = {
  fuente: 'supabase',
  // Cotización en pesos para calcular "Valorizado ARS" de montos en otra moneda (dejá null si no querés convertir)
  cotizaciones: { USD: null, EUR: null },
  supabase: {
    url: 'https://hhwfhearafhmougtfssu.supabase.co',
    // Clave pública (publishable). Es segura en el navegador: los datos están protegidos por usuario y contraseña (RLS).
    // NUNCA pongas acá la clave service_role / secret.
    anonKey: 'sb_publishable_UlhKyAUIXPFxrKkEb0lJxw_66kgPg9o',
    tablas: { noticias: 'monitor_noticias', candidatos: 'monitor_candidatos', estado: 'monitor_estado', perfiles: 'monitor_perfiles', fuentes: 'monitor_fuentes' }
  }
};

/* Configuración del Monitor de Ciberseguridad.
   fuente: 'local'    -> lee datos/datos.js; las decisiones de revisión se guardan en el navegador.
   fuente: 'supabase' -> lee y escribe en una base de datos Supabase (completar url y anonKey). */
window.MX_CONFIG = {
  fuente: 'local',
  // Cotización en pesos para calcular "Valorizado ARS" de montos en otra moneda (dejá null si no querés convertir)
  cotizaciones: { USD: null, EUR: null },
  supabase: {
    url: '',        // p. ej. https://xxxxxxxx.supabase.co
    anonKey: '',    // clave pública (anon) del proyecto
    tablas: { noticias: 'noticias', candidatos: 'candidatos', estado: 'estado' }
  }
};

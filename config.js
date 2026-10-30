/* Configuración del Monitor de Ciberseguridad.
   fuente: 'local'    -> lee datos/datos.js; las decisiones de revisión se guardan en el navegador.
   fuente: 'supabase' -> lee y escribe en una base de datos Supabase (completar url y anonKey). */
window.MX_CONFIG = {
  fuente: 'supabase',
  // Cotización en pesos para calcular "Valorizado ARS" de montos en otra moneda (dejá null si no querés convertir)
  cotizaciones: { USD: null, EUR: null },
  // Disponibilidad de servicios (Panorama del día y página Servicios). El estado sale de los hechos del monitor; "Reportes"
  // abre las quejas de usuarios en Downdetector. Para un enlace directo agregá dd: 'https://downdetector.com.ar/...' al servicio;
  // sin dd, el botón busca la página de esa entidad. claves: palabras que identifican a la entidad en los hechos.
  servicios: [
    // grupo: título con el que se agrupan · destacado: se muestra siempre en el Panorama del día (los demás, solo si tienen incidentes)
    // excluir: frases que no deben contar como esa entidad (ej.: "banco provincia del neuquén" no es Banco Provincia)
    { nombre: 'Red Link', grupo: 'Redes y procesadores', claves: ['red link', 'redlink'], destacado: true },
    { nombre: 'Banelco', grupo: 'Redes y procesadores', claves: ['banelco'], destacado: true },
    { nombre: 'Prisma / Payway', grupo: 'Redes y procesadores', claves: ['prisma medios de pago', 'payway', 'prisma'] },
    { nombre: 'Coelsa', grupo: 'Redes y procesadores', claves: ['coelsa', 'transferencias 3.0'], destacado: true },
    { nombre: 'Interbanking', grupo: 'Redes y procesadores', claves: ['interbanking'] },
    { nombre: 'MODO', grupo: 'Billeteras', claves: ['billetera modo', 'app modo', 'app de modo', 'plataforma modo'], destacado: true },
    { nombre: 'Mercado Pago', grupo: 'Billeteras', claves: ['mercado pago', 'mercadopago'], destacado: true },
    { nombre: 'Ualá', grupo: 'Billeteras', claves: ['ualá', 'uala'], destacado: true },
    { nombre: 'Naranja X', grupo: 'Billeteras', claves: ['naranja x'], destacado: true },
    { nombre: 'Cuenta DNI', grupo: 'Billeteras', claves: ['cuenta dni'] },
    { nombre: 'Personal Pay', grupo: 'Billeteras', claves: ['personal pay'] },
    { nombre: 'Banco Provincia del Neuquén', grupo: 'Bancos de la Patagonia', claves: ['banco provincia del neuquén', 'banco provincia del neuquen', 'bpn'], destacado: true },
    { nombre: 'Banco Patagonia', grupo: 'Bancos de la Patagonia', claves: ['banco patagonia'], destacado: true },
    { nombre: 'Banco del Chubut', grupo: 'Bancos de la Patagonia', claves: ['banco del chubut', 'banco chubut'] },
    { nombre: 'Banco Santa Cruz', grupo: 'Bancos de la Patagonia', claves: ['banco santa cruz', 'banco de santa cruz'] },
    { nombre: 'Banco Tierra del Fuego', grupo: 'Bancos de la Patagonia', claves: ['banco tierra del fuego', 'banco de tierra del fuego'] },
    { nombre: 'Banco Nación', grupo: 'Bancos públicos', claves: ['banco nación', 'banco nacion', 'banco de la nación', 'bna'], destacado: true },
    { nombre: 'Banco Provincia', grupo: 'Bancos públicos', claves: ['banco provincia', 'bapro', 'banco de la provincia de buenos aires'],
      excluir: ['banco provincia del neuquén', 'banco provincia del neuquen', 'banco provincia de córdoba', 'banco provincia de cordoba', 'banco provincia de tierra del fuego', 'banco provincia de santiago'], destacado: true },
    { nombre: 'Banco Ciudad', grupo: 'Bancos públicos', claves: ['banco ciudad'] },
    { nombre: 'Bancor', grupo: 'Bancos públicos', claves: ['bancor', 'banco de córdoba', 'banco de cordoba'] },
    { nombre: 'Banco Credicoop', grupo: 'Bancos públicos', claves: ['credicoop'] },
    { nombre: 'Galicia', grupo: 'Bancos privados', claves: ['banco galicia', 'galicia'] },
    { nombre: 'Santander', grupo: 'Bancos privados', claves: ['banco santander', 'santander'] },
    { nombre: 'BBVA', grupo: 'Bancos privados', claves: ['bbva'] },
    { nombre: 'Macro', grupo: 'Bancos privados', claves: ['banco macro', 'macro'] },
    { nombre: 'ICBC', grupo: 'Bancos privados', claves: ['icbc'] },
    { nombre: 'Supervielle', grupo: 'Bancos privados', claves: ['supervielle'] },
    { nombre: 'Banco Hipotecario', grupo: 'Bancos privados', claves: ['banco hipotecario'] },
    { nombre: 'Comafi', grupo: 'Bancos privados', claves: ['comafi'] },
    { nombre: 'Brubank', grupo: 'Bancos digitales', claves: ['brubank'] },
    { nombre: 'Openbank', grupo: 'Bancos digitales', claves: ['openbank'] }
  ],
  supabase: {
    url: 'https://hhwfhearafhmougtfssu.supabase.co',
    // Clave pública (publishable). Es segura en el navegador: los datos están protegidos por usuario y contraseña (RLS).
    // NUNCA pongas acá la clave service_role / secret.
    anonKey: 'sb_publishable_UlhKyAUIXPFxrKkEb0lJxw_66kgPg9o',
    tablas: { noticias: 'monitor_noticias', candidatos: 'monitor_candidatos', estado: 'monitor_estado', perfiles: 'monitor_perfiles', fuentes: 'monitor_fuentes' }
  }
};

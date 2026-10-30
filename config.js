/* Configuración del Monitor de Ciberseguridad.
   fuente: 'local'    -> lee datos/datos.js; las decisiones de revisión se guardan en el navegador.
   fuente: 'supabase' -> lee y escribe en una base de datos Supabase (completar url y anonKey). */
window.MX_CONFIG = {
  fuente: 'supabase',
  // Cotización en pesos para calcular "Valorizado ARS" de montos en otra moneda (dejá null si no querés convertir)
  cotizaciones: { USD: null, EUR: null },
  // Disponibilidad de servicios. La lista se administra desde la página Servicios (tabla monitor_servicios, compartida);
  // la lista de abajo se usa solo si esa tabla no existe todavía. El estado sale de los hechos del monitor; "Reportes"
  // abre las quejas de usuarios en Downdetector. Para un enlace directo agregá dd: 'https://downdetector.com.ar/...' al servicio;
  // sin dd, el botón busca la página de esa entidad. claves: palabras que identifican a la entidad en los hechos.
  servicios: [
    // web: sitio que se verifica en vivo (verde = responde, rojo = no responde)
    // grupo: título con el que se agrupan · destacado: se muestra siempre en el Panorama del día (los demás, solo si tienen incidentes)
    // excluir: frases que no deben contar como esa entidad (ej.: "banco provincia del neuquén" no es Banco Provincia)
    { nombre: 'Red Link', web: 'https://www.redlink.com.ar', grupo: 'Redes y procesadores', claves: ['red link', 'redlink'], destacado: true },
    { nombre: 'Banelco', web: 'https://www.banelco.com.ar', grupo: 'Redes y procesadores', claves: ['banelco'], destacado: true },
    { nombre: 'Prisma / Payway', web: 'https://www.prismamediosdepago.com', grupo: 'Redes y procesadores', claves: ['prisma medios de pago', 'payway', 'prisma'] },
    { nombre: 'Coelsa', web: 'https://www.coelsa.com.ar', grupo: 'Redes y procesadores', claves: ['coelsa', 'transferencias 3.0'], destacado: true },
    { nombre: 'Interbanking', web: 'https://www.interbanking.com.ar', grupo: 'Redes y procesadores', claves: ['interbanking'] },
    { nombre: 'MODO', web: 'https://www.modo.com.ar', grupo: 'Billeteras', claves: ['billetera modo', 'app modo', 'app de modo', 'plataforma modo'], destacado: true },
    { nombre: 'Mercado Pago', web: 'https://www.mercadopago.com.ar', grupo: 'Billeteras', claves: ['mercado pago', 'mercadopago'], destacado: true },
    { nombre: 'Ualá', web: 'https://www.uala.com.ar', grupo: 'Billeteras', claves: ['ualá', 'uala'], destacado: true },
    { nombre: 'Naranja X', web: 'https://www.naranjax.com', grupo: 'Billeteras', claves: ['naranja x'], destacado: true },
    { nombre: 'Cuenta DNI', web: 'https://www.bancoprovincia.com.ar/cuentadni', grupo: 'Billeteras', claves: ['cuenta dni'] },
    { nombre: 'Personal Pay', web: 'https://www.personalpay.com.ar', grupo: 'Billeteras', claves: ['personal pay'] },
    { nombre: 'Banco Provincia del Neuquén', web: 'https://www.bpn.com.ar', grupo: 'Bancos de la Patagonia', claves: ['banco provincia del neuquén', 'banco provincia del neuquen', 'bpn'], destacado: true },
    { nombre: 'Banco Patagonia', web: 'https://www.bancopatagonia.com.ar', grupo: 'Bancos de la Patagonia', claves: ['banco patagonia'], destacado: true },
    { nombre: 'Banco del Chubut', web: 'https://www.bancochubut.com.ar', grupo: 'Bancos de la Patagonia', claves: ['banco del chubut', 'banco chubut'] },
    { nombre: 'Banco Santa Cruz', web: 'https://www.bancosantacruz.com', grupo: 'Bancos de la Patagonia', claves: ['banco santa cruz', 'banco de santa cruz'] },
    { nombre: 'Banco Tierra del Fuego', web: 'https://www.bancotdf.com.ar', grupo: 'Bancos de la Patagonia', claves: ['banco tierra del fuego', 'banco de tierra del fuego'] },
    { nombre: 'Banco Nación', web: 'https://www.bna.com.ar', grupo: 'Bancos públicos', claves: ['banco nación', 'banco nacion', 'banco de la nación', 'bna'], destacado: true },
    { nombre: 'Banco Provincia', web: 'https://www.bancoprovincia.com.ar', grupo: 'Bancos públicos', claves: ['banco provincia', 'bapro', 'banco de la provincia de buenos aires'],
      excluir: ['banco provincia del neuquén', 'banco provincia del neuquen', 'banco provincia de córdoba', 'banco provincia de cordoba', 'banco provincia de tierra del fuego', 'banco provincia de santiago'], destacado: true },
    { nombre: 'Banco Ciudad', web: 'https://www.bancociudad.com.ar', grupo: 'Bancos públicos', claves: ['banco ciudad'] },
    { nombre: 'Bancor', web: 'https://www.bancor.com.ar', grupo: 'Bancos públicos', claves: ['bancor', 'banco de córdoba', 'banco de cordoba'] },
    { nombre: 'Banco Credicoop', web: 'https://www.bancocredicoop.coop', grupo: 'Bancos públicos', claves: ['credicoop'] },
    { nombre: 'Galicia', web: 'https://www.galicia.ar', grupo: 'Bancos privados', claves: ['banco galicia', 'galicia'] },
    { nombre: 'Santander', web: 'https://www.santander.com.ar', grupo: 'Bancos privados', claves: ['banco santander', 'santander'] },
    { nombre: 'BBVA', web: 'https://www.bbva.com.ar', grupo: 'Bancos privados', claves: ['bbva'] },
    { nombre: 'Macro', web: 'https://www.macro.com.ar', grupo: 'Bancos privados', claves: ['banco macro', 'macro'] },
    { nombre: 'ICBC', web: 'https://www.icbc.com.ar', grupo: 'Bancos privados', claves: ['icbc'] },
    { nombre: 'Supervielle', web: 'https://www.supervielle.com.ar', grupo: 'Bancos privados', claves: ['supervielle'] },
    { nombre: 'Banco Hipotecario', web: 'https://www.hipotecario.com.ar', grupo: 'Bancos privados', claves: ['banco hipotecario'] },
    { nombre: 'Comafi', web: 'https://www.comafi.com.ar', grupo: 'Bancos privados', claves: ['comafi'] },
    { nombre: 'Brubank', web: 'https://www.brubank.com', grupo: 'Bancos digitales', claves: ['brubank'] },
    { nombre: 'Openbank', web: 'https://www.openbank.com.ar', grupo: 'Bancos digitales', claves: ['openbank'] }
  ],
  supabase: {
    url: 'https://hhwfhearafhmougtfssu.supabase.co',
    // Clave pública (publishable). Es segura en el navegador: los datos están protegidos por usuario y contraseña (RLS).
    // NUNCA pongas acá la clave service_role / secret.
    anonKey: 'sb_publishable_UlhKyAUIXPFxrKkEb0lJxw_66kgPg9o',
    tablas: { noticias: 'monitor_noticias', candidatos: 'monitor_candidatos', estado: 'monitor_estado', perfiles: 'monitor_perfiles', fuentes: 'monitor_fuentes', servicios: 'monitor_servicios' }
  }
};

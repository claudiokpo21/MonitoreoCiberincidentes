/* =====================================================================
   Monitor de Riesgo · lógica del sitio
   Fuente de datos: window.MX_DATOS (archivo datos/datos.js) o Supabase,
   según config.js. Todas las páginas usan este mismo archivo.
   ===================================================================== */
(function () {
  'use strict';
  const CFG = Object.assign({ fuente: 'local', supabase: {} }, window.MX_CONFIG || {});
  const raizHtml = document.documentElement;

  // ---------- Tema claro / oscuro (se aplica antes de pintar) ----------
  const leerLS = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const grabarLS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };
  const temaIni = leerLS('mx-tema') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  raizHtml.setAttribute('data-theme', temaIni);

  // ---------- Utilidades ----------
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const low = s => String(s == null ? '' : s).trim().toLowerCase();
  const sinTilde = s => low(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fCorta = s => { const p = String(s || '').slice(0, 10).split('-'); return p[2] ? `${+p[2]} ${MESES[+p[1] - 1]}` : (s || ''); };
  const fLarga = s => { const p = String(s || '').slice(0, 10).split('-'); return p[2] ? `${p[2]}/${p[1]}/${p[0]}` : (s || ''); };
  const fHora = s => { const d = new Date(s); return s && !isNaN(d) ? d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (s || ''); };
  const hoyISO = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10); // fecha en Buenos Aires
  const fechaART = iso => { const d = new Date(iso); return isNaN(d) ? String(iso).slice(0, 10) : new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 10); };
  const CAT = { banca: 'Banca y pagos', domotica: 'Domótica e IoT', automatizacion: 'Automatización industrial', ia: 'Inteligencia artificial', redes: 'Redes e infraestructura TI' };
  const CAT_ICO = { banca: 'bank', domotica: 'home', automatizacion: 'factory', ia: 'chip', redes: 'globe' };
  const RK = { alta: 0, media: 1, baja: 2 };
  const TIPOS = ['Fraude interno', 'Fraude externo', 'Relaciones laborales y seguridad en el puesto de trabajo',
    'Prácticas con los clientes, productos y negocios', 'Daños a activos físicos',
    'Alteraciones en la actividad y fallas tecnológicas', 'Ejecución, gestión y cumplimiento del plazo de los procesos'];
  const TIPO_CORTO = ['Fraude interno', 'Fraude externo', 'Relaciones laborales', 'Clientes, productos y negocios', 'Daños a activos físicos',
    'Fallas tecnológicas', 'Ejecución de procesos'];
  const NIVELES = ['bajo', 'moderado', 'elevado', 'critico'];
  const NIVEL_TXT = ['Bajo', 'Moderado', 'Elevado', 'Crítico'];
  const NIVEL_BADGE = ['ok', 'info', 'media', 'solid-alta'];
  const SVG = {
    bank: '<path d="M3 10l9-6 9 6M5 10v8M19 10v8M9 10v8M15 10v8M3 20h18"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    factory: '<path d="M3 20V9l6 4V9l6 4V5h6v15z"/>',
    chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>',
    activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>', alert: '<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17v.5"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12l5 5 9-10"/>', target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
    hour: '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    scale: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>'
  };
  const ico = (n, st) => `<svg class="mx-ico" viewBox="0 0 24 24"${st ? ` style="${st}"` : ''}>${SVG[n] || SVG.info}</svg>`;
  const sevBadge = s => `<span class="mx-badge pill ${esc(s)}"><span class="dot"></span>${esc((s || '—')[0].toUpperCase() + String(s || '').slice(1))}</span>`;
  const plural = (n, s, p) => `${n} ${n === 1 ? s : (p || s + 's')}`;

  function csv(nombre, cols, filas) {
    const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const txt = '﻿' + [cols.map(q).join(';'), ...filas.map(f => f.map(q).join(';'))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' }));
    a.download = `${nombre}-${hoyISO()}.csv`; document.body.appendChild(a); a.click(); a.remove();
  }

  // ---------- Valorización (monto económico mencionado en el hecho) ----------
  const MONEDA_PAL = { pesos: 'ARS', 'dólares': 'USD', dolares: 'USD', euros: 'EUR', yenes: 'JPY', wones: 'KRW', rupias: 'INR', libras: 'GBP' };
  const MULT = s => { s = low(s); return /mil millones/.test(s) ? 1e9 : /millones|millón|millon/.test(s) ? 1e6 : /crore/.test(s) ? 1e7 : /lakh/.test(s) ? 1e5 : /^mil$/.test(s) ? 1e3 : 1; };
  const aNumero = s => {
    s = String(s).trim().replace(/[.,]$/, '');
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return parseFloat(s.replace(/,/g, ''));
    return parseFloat(s.replace(',', '.'));
  };
  function montoDe(texto, ambito, pais) {
    const t = String(texto || '');
    let m = t.match(/(US\$|U\$S|u\$s|USD|€|EUR|£|\$)\s?(\d[\d.,]*)(\s*(?:mil millones|millones|millón|millon|mil)\b)?/i);
    if (m) {
      const sim = m[1].toUpperCase();
      const moneda = sim === '€' || sim === 'EUR' ? 'EUR' : sim === '£' ? 'GBP' : sim === '$' ? (ambito === 'nacional' ? 'ARS' : (/méxico|mexico/i.test(pais) ? 'MXN' : 'USD')) : 'USD';
      const n = aNumero(m[2]) * MULT(m[3] || '');
      if (isFinite(n) && n > 0) return { moneda, monto: n, texto: m[0].trim() };
    }
    m = t.match(/(\d[\d.,]*)\s*(mil millones|millones|millón|millon|crore|lakh|mil)?\s*(?:de\s+)?(pesos|dólares|dolares|euros|yenes|wones|rupias|libras)\b/i);
    if (m) {
      let moneda = MONEDA_PAL[low(m[3])];
      if (moneda === 'ARS' && ambito !== 'nacional') moneda = /méxico|mexico/i.test(pais) ? 'MXN' : 'Pesos';
      const n = aNumero(m[1]) * MULT(m[2] || '');
      if (isFinite(n) && n > 0) return { moneda, monto: n, texto: m[0].trim() };
    }
    return null;
  }
  const COTIZ = CFG.cotizaciones || {};
  const aARS = (monto, moneda) => monto === '' || monto == null || !isFinite(monto) ? '' : moneda === 'ARS' ? monto : (COTIZ[moneda] ? monto * COTIZ[moneda] : '');
  const fmtNum = n => new Intl.NumberFormat('es-AR', { maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);
  const fmtMonto = (n, mon) => n === '' || n == null || !isFinite(n) ? '—' : `${mon === 'ARS' ? '$' : mon === 'USD' ? 'US$' : mon === 'EUR' ? '€' : ''} ${fmtNum(n)}${['ARS', 'USD', 'EUR'].includes(mon) ? '' : ' ' + (mon || '')}`.trim();

  // ---------- Exportación a Excel (.xlsx) o CSV ----------
  let promXLSX;
  const cargarXLSX = () => window.XLSX ? Promise.resolve() : (promXLSX = promXLSX || new Promise((ok, mal) => {
    const s = document.createElement('script'); s.src = 'assets/vendor/xlsx.full.min.js'; s.onload = ok;
    s.onerror = () => { promXLSX = null; mal(new Error('No se pudo cargar el generador de Excel (assets/vendor/xlsx.full.min.js).')); };
    document.head.appendChild(s);
  }));
  const aFecha = s => { const p = String(s || '').slice(0, 10).split('-'); return p[2] ? new Date(+p[0], +p[1] - 1, +p[2], 12) : ''; };
  // cols: [{ t: título, w: ancho, tipo: 's' | 'n' | 'd' | 'm' (monto) }]
  async function exportarTabla(nombre, hoja, cols, filas, formato, info) {
    if (formato === 'csv') {
      const dd = v => `${String(v.getDate()).padStart(2, '0')}/${String(v.getMonth() + 1).padStart(2, '0')}/${v.getFullYear()}`;
      csv(nombre, cols.map(c => c.t), filas.map(f => f.map(v => v instanceof Date ? dd(v) : (typeof v === 'number' ? String(Math.round(v * 100) / 100).replace('.', ',') : v))));
      return;
    }
    await cargarXLSX();
    const X = window.XLSX;
    const ws = X.utils.aoa_to_sheet([cols.map(c => c.t)].concat(filas), { cellDates: true });
    ws['!cols'] = cols.map(c => ({ wch: c.w || 14 }));
    ws['!autofilter'] = { ref: ws['!ref'] };
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    filas.forEach((f, r) => cols.forEach((c, i) => {
      const cel = ws[X.utils.encode_cell({ r: r + 1, c: i })]; if (!cel) return;
      if (c.tipo === 'd' && cel.t === 'd') cel.z = 'dd/mm/yyyy';
      if (c.tipo === 'm' && cel.t === 'n') cel.z = '#,##0';
    }));
    const wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, ws, hoja);
    const wi = X.utils.aoa_to_sheet([['Monitor de Riesgo'], [], ...info, [], ['Elaborado con IA a partir de fuentes públicas. Contenido orientativo; no constituye una evaluación oficial de ninguna entidad.']]);
    wi['!cols'] = [{ wch: 28 }, { wch: 70 }];
    X.utils.book_append_sheet(wb, wi, 'Información');
    X.writeFile(wb, `${nombre}-${hoyISO()}.xlsx`, { compression: true });
  }

  // Ventana de exportación: alcance (todas, nuevas, desde fecha, vista actual…), formato y valorización
  function abrirExportar(op) {
    cerrarFicha();
    const ult = leerLS(op.clave);
    const m = document.createElement('div');
    m.className = 'mx mx-modal'; m.id = 'mx-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    const radios = op.alcances.map((a, i) => `<label class="mx-opt"><input type="radio" name="ex-alc" value="${a.id}" ${a.id === op.porDefecto ? 'checked' : ''}>
      <span><b>${esc(a.etiqueta)}</b><span class="mx-small" data-cnt="${a.id}">${esc(a.detalle || '')}</span></span>
      ${a.id === 'desde' ? `<input type="date" class="mx-input" id="ex-desde" style="width:auto;margin-left:auto" value="${esc((ult || '').slice(0, 10) || hoyISO())}">` : `<span class="mx-mono" style="margin-left:auto;color:var(--ink-2)" data-n="${a.id}">${a.n != null ? a.n : ''}</span>`}</label>`).join('');
    m.innerHTML = `<div class="mx-dialog" style="max-width:620px">
      <div class="mx-dialog-h"><div style="display:flex;gap:8px;align-items:center">${ico('file', 'color:var(--primary)')}<b class="mx-h3">${esc(op.titulo)}</b></div>
        <button type="button" class="mx-x" data-cerrar aria-label="Cerrar">${ico('x')}</button></div>
      <div class="mx-dialog-b">
        <div><div class="mx-eyebrow" style="margin-bottom:8px">Qué exportar</div><div class="mx-opts">${radios}</div>
          <p class="mx-small" style="margin-top:8px">Última exportación desde este navegador: <b>${ult ? esc(fHora(ult)) : 'ninguna'}</b>.</p></div>
        <div><div class="mx-eyebrow" style="margin-bottom:8px">Formato</div>
          <div class="mx-chips" id="ex-fmt"><button type="button" class="mx-chipbtn on" data-f="xlsx">Excel (.xlsx)</button><button type="button" class="mx-chipbtn" data-f="csv">CSV</button></div></div>
        <label class="mx-opt" style="background:var(--soft)"><input type="checkbox" id="ex-val" checked>
          <span><b>Incluir valorización</b><span class="mx-small">Monto mencionado en el hecho, moneda y valor en pesos (ARS). En los candidatos revisados se usa el valor cargado por el analista.</span></span></label>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px solid var(--div);padding-top:14px">
          <span class="mx-msg" id="ex-msg" aria-live="polite"></span>
          <div style="display:flex;gap:8px"><button type="button" class="mx-btn" data-cerrar>Cancelar</button>
            <button type="button" class="mx-btn primary" id="ex-ok">${ico('file', 'width:15px;height:15px')}Exportar</button></div>
        </div>
      </div></div>`;
    m.addEventListener('click', ev => { if (ev.target === m || ev.target.closest('[data-cerrar]')) cerrarFicha(); });
    document.body.appendChild(m); document.body.style.overflow = 'hidden';
    let fmt = 'xlsx';
    const contarDesde = () => { const d = $('ex-desde'); if (d && op.contarDesde) m.querySelector('[data-cnt="desde"]').textContent = `${plural(op.contarDesde(d.value), 'hecho')} cargados desde esa fecha`; };
    if ($('ex-desde')) { $('ex-desde').addEventListener('input', () => { m.querySelector('input[value="desde"]').checked = true; contarDesde(); }); contarDesde(); }
    $('ex-fmt').addEventListener('click', ev => { const b = ev.target.closest('[data-f]'); if (!b) return; fmt = b.dataset.f; $('ex-fmt').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
    $('ex-ok').addEventListener('click', async () => {
      const alc = m.querySelector('input[name="ex-alc"]:checked').value;
      const filas = op.obtener(alc, $('ex-desde') ? $('ex-desde').value : '');
      if (!filas.length) { $('ex-msg').className = 'mx-msg err'; $('ex-msg').textContent = 'No hay hechos para exportar con esa opción.'; return; }
      $('ex-msg').className = 'mx-msg'; $('ex-msg').textContent = 'Generando archivo…'; $('ex-ok').disabled = true;
      try {
        await op.exportar(filas, fmt, $('ex-val').checked, alc);
        if (alc !== 'vista') grabarLS(op.clave, new Date().toISOString());
        cerrarFicha();
      } catch (err) {
        console.error('[Monitor] Exportación', err);
        $('ex-msg').className = 'mx-msg err'; $('ex-msg').textContent = err.message + ' Probá con CSV.'; $('ex-ok').disabled = false;
      }
    });
  }

  // Exportación de noticias (todas, nuevas, desde una fecha, vista actual o últimos 7 días)
  function exportarNoticias(N, opciones) {
    const C = opciones.candidatos || [];
    const porId = Object.fromEntries(C.map(c => [c.id, c]));
    const ult = leerLS('mx-ultexp-noticias');
    const nuevas = () => N.filter(x => !ult || (x.agregado && new Date(x.agregado) > new Date(ult)));
    const alcances = [
      { id: 'todas', etiqueta: 'Todas las noticias', n: N.length, detalle: 'Historial completo del monitor' },
      { id: 'nuevas', etiqueta: 'Solo las actualizadas', n: nuevas().length, detalle: ult ? 'Cargadas después de la última exportación' : 'Todavía no exportaste: incluye todas' },
      { id: 'desde', etiqueta: 'Cargadas desde una fecha', detalle: '' }];
    if (opciones.vista) alcances.push({ id: 'vista', etiqueta: opciones.vistaEtiqueta || 'Lo que estoy viendo', n: opciones.vista().length, detalle: opciones.vistaDetalle || 'Con los filtros aplicados' });
    abrirExportar({
      titulo: 'Exportar noticias', clave: 'mx-ultexp-noticias', porDefecto: opciones.porDefecto || 'todas', alcances,
      contarDesde: d => N.filter(x => (x.agregado || x.fecha).slice(0, 10) >= d).length,
      obtener: (a, d) => a === 'todas' ? N : a === 'nuevas' ? nuevas() : a === 'desde' ? N.filter(x => (x.agregado || x.fecha).slice(0, 10) >= d) : opciones.vista(),
      exportar: (L, fmt, conVal, alc) => {
        const cols = [{ t: 'Código', w: 34 }, { t: 'Fecha', w: 11, tipo: 'd' }, { t: 'Categoría', w: 22 }, { t: 'Ámbito', w: 12 }, { t: 'Severidad', w: 10 },
          { t: 'Título', w: 60 }, { t: 'Resumen', w: 90 }, { t: 'Entidad', w: 30 }, { t: 'País', w: 14 }, { t: 'Tipo', w: 26 }, { t: 'Fuente', w: 20 },
          { t: 'URL', w: 40 }, { t: 'Cargado', w: 17 }, { t: 'Estado de revisión', w: 16 }];
        if (conVal) cols.push({ t: 'Monto mencionado', w: 22 }, { t: 'Moneda', w: 8 }, { t: 'Monto', w: 16, tipo: 'm' }, { t: 'Valorizado ARS', w: 16, tipo: 'm' }, { t: 'Origen de la valorización', w: 18 });
        const filas = L.map(x => {
          const c = porId[x.id];
          const f = [x.id, aFecha(x.fecha), CAT[x.categoria] || x.categoria, x.ambito === 'nacional' ? 'Nacional' : 'Internacional', x.severidad, x.titulo, x.resumen,
            x.entidad, x.pais, x.tipo, x.fuente, x.url, fHora(x.agregado), c ? c.decision : (x.ambito === 'nacional' ? 'Sin candidato' : 'No aplica')];
          if (conVal) {
            const man = c && c.valorizadoManual, mon = man ? c.moneda : x.moneda, monto = man ? c.valorizado : x.monto;
            f.push(x.montoTexto || '', mon || '', monto === '' || monto == null ? '' : monto, aARS(monto, mon), man ? 'Analista' : (x.montoTexto ? 'Detectado en el texto' : ''));
          }
          return f;
        });
        const nombreAlc = { todas: 'todas', nuevas: 'actualizadas', desde: 'desde', vista: 'vista' }[alc] || alc;
        return exportarTabla(`noticias-${nombreAlc}`, 'Noticias', cols, filas, fmt, [['Generado', fHora(new Date().toISOString())], ['Alcance', alcances.find(a => a.id === alc).etiqueta],
          ['Hechos exportados', L.length], ['Valorización', conVal ? 'Incluida. Valorizado ARS solo para montos en pesos o con cotización definida en config.js.' : 'No incluida']]);
      }
    });
  }

  // Tooltip compartido
  let tipEl;
  const verTip = (ev, html) => {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'mx mx-tip'; document.body.appendChild(tipEl); }
    tipEl.innerHTML = html; tipEl.hidden = false;
    tipEl.style.left = Math.max(8, Math.min(ev.clientX + 14, innerWidth - tipEl.offsetWidth - 8)) + 'px';
    tipEl.style.top = Math.max(8, ev.clientY - tipEl.offsetHeight - 12) + 'px';
  };
  const ocultarTip = () => { if (tipEl) tipEl.hidden = true; };

  // ---------- Capa de datos ----------
  const normN = r => {
    const cat = low(r.categoria);
    const catKey = CAT[cat] ? cat : (Object.keys(CAT).find(k => low(CAT[k]) === cat) || cat);
    return { id: r.id || r.codigo || r.url, fecha: String(r.fecha || '').slice(0, 10), categoria: catKey, titulo: r.titulo || '', resumen: r.resumen || '',
      entidad: r.entidad || '', pais: r.pais || '', tipo: r.tipo || '', ambito: low(r.ambito), severidad: low(r.severidad), fuente: r.fuente || '',
      url: r.url || '', agregado: r.agregado || '' };
  };
  const conMonto = n => { const v = montoDe(n.titulo, n.ambito, n.pais) || montoDe(n.resumen, n.ambito, n.pais); n.montoTexto = v ? v.texto : ''; n.moneda = v ? v.moneda : ''; n.monto = v ? v.monto : ''; return n; };
  const normC = r => ({ id: r.id || r.codigo, fecha: String(r.fecha || '').slice(0, 10), agregado: r.agregado || '', titulo: r.titulo || '', resumen: r.resumen || '',
    entidad: r.entidad || '', fuente: r.fuente || '', url: r.url || '', naturaleza: r.naturaleza || '', subtipo: r.subtipo || '',
    tipoEvento: r.tipoEvento || r.tipoevento || '—', origen: r.origen || '—', factor: r.factor || '—', canal: r.canal || '', normativa: r.normativa || '',
    impacto: r.impacto || '—', decision: low(r.decision) || 'pendiente', comentario: leerRND(r.comentario).texto, rnd: leerRND(r.comentario).rnd, revisadoPor: r.revisadoPor || r.revisadopor || '',
    revisadoEn: r.revisadoEn || r.revisadoen || '',
    valorizadoManual: r.valorizado !== undefined && r.valorizado !== null && r.valorizado !== '',
    valorizado: r.valorizado !== undefined && r.valorizado !== null && r.valorizado !== '' ? Number(r.valorizado) : '', moneda: r.moneda || '',
    sugeridoPor: r.sugeridoPor || r.sugeridopor || '' });

  // Clasificación sugerida por la IA (se conserva aunque el analista la corrija)
  const CAMPOS_CLAS = ['tipoEvento', 'origen', 'factor', 'canal', 'impacto', 'normativa'];
  // Riesgo no declarado (Sí / No): se guarda al inicio del fundamento, sin cambiar la base -> "[Riesgo no declarado: Sí] texto"
  const RX_RND = /^\s*\[Riesgo no declarado:\s*(Sí|Si|No)\]\s*/i;
  const leerRND = com => { const m = String(com || '').match(RX_RND); return m ? { rnd: /^s/i.test(m[1]) ? 'Sí' : 'No', texto: String(com).replace(RX_RND, '') } : { rnd: '', texto: String(com || '') }; };
  const armarCom = (rnd, texto) => (rnd ? `[Riesgo no declarado: ${rnd}] ` : '') + String(texto || '').trim();
  const iaDe = r => {
    let g = r.sugerenciaIA || r.sugerenciaia;
    if (typeof g === 'string') { try { g = JSON.parse(g); } catch (e) { g = null; } }
    const b = g || r;
    return { tipoEvento: b.tipoEvento || b.tipoevento || '—', origen: b.origen || '—', factor: b.factor || '—', canal: b.canal || '', impacto: b.impacto || '—', normativa: b.normativa || '' };
  };
  const modificado = c => CAMPOS_CLAS.some(k => String(c[k] || '').trim() !== String((c.ia || {})[k] || '').trim());
  const SB = CFG.supabase || {};
  const usaSupabase = CFG.fuente === 'supabase' && SB.url && SB.anonKey;
  // ---------- Sesión de Supabase (inicio de sesión con correo y contraseña) ----------
  const SESION = 'mx-sb-sesion';
  const leerSesion = () => { try { return JSON.parse(leerLS(SESION) || 'null'); } catch (e) { return null; } };
  const grabarSesion = j => grabarLS(SESION, JSON.stringify({ access_token: j.access_token, refresh_token: j.refresh_token,
    expira: Date.now() + (j.expires_in || 3600) * 1000, uid: j.user && j.user.id, email: j.user && j.user.email }));
  const borrarSesion = () => { try { localStorage.removeItem(SESION); } catch (e) { /* nada */ } };
  async function authPost(tipo, cuerpo) {
    const r = await fetch(`${SB.url}/auth/v1/token?grant_type=${tipo}`, { method: 'POST', headers: { apikey: SB.anonKey, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error_description || j.msg || j.message || `HTTP ${r.status}`);
    grabarSesion(j); return j;
  }
  async function token() {
    let ses = leerSesion();
    if (!ses) throw Object.assign(new Error('Sin sesión'), { sinSesion: true });
    if (Date.now() > ses.expira - 60000) {
      try { await authPost('refresh_token', { refresh_token: ses.refresh_token }); ses = leerSesion(); }
      catch (e) { borrarSesion(); throw Object.assign(new Error('La sesión venció'), { sinSesion: true }); }
    }
    return ses.access_token;
  }
  async function sbFetch(ruta, op = {}) {
    const r = await fetch(`${SB.url}/rest/v1/${ruta}`, Object.assign({}, op, { headers: Object.assign({ apikey: SB.anonKey, Authorization: `Bearer ${await token()}` }, op.headers || {}) }));
    if (r.status === 401) { borrarSesion(); throw Object.assign(new Error('Sesión no válida'), { sinSesion: true }); }
    if (!r.ok) throw new Error(`${ruta.split('?')[0]}: HTTP ${r.status} ${await r.text()}`);
    if (r.status === 204) return null;
    const t = await r.text(); return t ? JSON.parse(t) : null;
  }
  // Funciones de la base (RPC)
  const sbRpc = (fn, args) => sbFetch(`rpc/${fn}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
  const errBase = e => { const m = String(e && e.message || e); const j = m.match(/\{.*\}$/s); let t = m; if (j) { try { t = JSON.parse(j[0]).message || m; } catch (x) { /* nada */ } } return t.replace(/^NO_EXISTE:\s*/, ''); };
  async function sbLeer(tabla) {
    let filas = [], desde = 0;
    for (;;) {
      const lote = await sbFetch(`${tabla}?select=*&order=id&limit=1000&offset=${desde}`);
      filas = filas.concat(lote); if (lote.length < 1000) return filas; desde += 1000;
    }
  }
  let perfilProm;
  const perfil = () => perfilProm || (perfilProm = (async () => {
    const ses = leerSesion(); if (!ses) return null;
    const l = await sbFetch(`${SB.tablas?.perfiles || 'monitor_perfiles'}?select=nombre,rol,activo&user_id=eq.${ses.uid}`);
    return l[0] && l[0].activo !== false ? Object.assign({ email: ses.email }, l[0]) : { nombre: ses.email, rol: 'sin acceso', email: ses.email };
  })());
  function pedirLogin(msj) {
    if ($('mx-login')) return;
    const m = document.createElement('div');
    m.className = 'mx mx-modal'; m.id = 'mx-login'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="mx-dialog" style="max-width:420px;margin-top:8vh">
      <div class="mx-dialog-h"><div style="display:flex;gap:8px;align-items:center">${ico('shield', 'color:var(--primary)')}<b class="mx-h3">Ingresar al monitor</b></div></div>
      <form class="mx-dialog-b" id="lg-form">
        <p class="mx-small">${esc(msj || 'Ingresá con el correo y la contraseña que te asignó el administrador del monitor.')}</p>
        <div><label class="mx-label" for="lg-mail">Correo</label><input class="mx-input" id="lg-mail" type="email" autocomplete="username" required value="${esc((leerSesion() || {}).email || '')}"></div>
        <div><label class="mx-label" for="lg-pass">Contraseña</label><input class="mx-input" id="lg-pass" type="password" autocomplete="current-password" required></div>
        <p class="mx-msg" id="lg-msg" aria-live="polite"></p>
        <button type="submit" class="mx-btn primary" id="lg-ok">Ingresar</button>
      </form></div>`;
    document.body.appendChild(m); document.body.style.overflow = 'hidden';
    (m.querySelector('#lg-mail').value ? m.querySelector('#lg-pass') : m.querySelector('#lg-mail')).focus();
    m.querySelector('#lg-form').addEventListener('submit', async ev => {
      ev.preventDefault();
      $('lg-ok').disabled = true; $('lg-msg').className = 'mx-msg'; $('lg-msg').textContent = 'Verificando…';
      try { await authPost('password', { email: $('lg-mail').value.trim(), password: $('lg-pass').value }); location.reload(); }
      catch (err) { $('lg-msg').className = 'mx-msg err'; $('lg-msg').textContent = /invalid/i.test(err.message) ? 'Correo o contraseña incorrectos.' : err.message; $('lg-ok').disabled = false; }
    });
  }
  async function cerrarSesion() {
    const ses = leerSesion();
    if (ses) { try { await fetch(`${SB.url}/auth/v1/logout`, { method: 'POST', headers: { apikey: SB.anonKey, Authorization: `Bearer ${ses.access_token}` } }); } catch (e) { /* nada */ } }
    borrarSesion(); location.reload();
  }
  const OVERLAY = 'mx-decisiones';
  const leerJSON = (k, d) => { try { return JSON.parse(leerLS(k) || 'null') || d; } catch (e) { return d; } };
  const leerOverlay = () => { try { return JSON.parse(leerLS(OVERLAY) || '{}'); } catch (e) { return {}; } };
  const memo = {};
  const datos = {
    noticias() {
      return memo.n || (memo.n = (usaSupabase ? sbLeer(SB.tablas?.noticias || 'noticias') : Promise.resolve((window.MX_DATOS || {}).noticias || []))
        .then(a => a.map(normN).map(conMonto).filter(x => x.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha) || (RK[a.severidad] ?? 3) - (RK[b.severidad] ?? 3))));
    },
    candidatos() {
      return memo.c || (memo.c = (usaSupabase ? sbLeer(SB.tablas?.candidatos || 'candidatos') : Promise.resolve(((window.MX_DATOS || {}).candidatos || []).concat(leerJSON('mx-manuales', []))))
        .then(a => { const ov = usaSupabase ? {} : leerOverlay(); return a.map(r => { const c = normC(Object.assign({}, r, ov[r.id || r.codigo] || {})); c.ia = iaDe(r); c.iaFija = !!(r.sugerenciaIA || r.sugerenciaia); return c; }).map(c => { const v = montoDe(c.titulo, 'nacional', 'Argentina') || montoDe(c.resumen, 'nacional', 'Argentina'); c.montoTexto = v ? v.texto : ''; if (!c.valorizadoManual && v) { c.valorizado = v.monto; c.moneda = v.moneda; } return c; }); })
        .then(a => a.sort((a, b) => b.fecha.localeCompare(a.fecha) || (a.naturaleza !== 'Evento') - (b.naturaleza !== 'Evento'))));
    },
    estado() {
      return memo.e || (memo.e = (usaSupabase ? sbLeer(SB.tablas?.estado || 'estado').then(a => a[0] || {}) : Promise.resolve((window.MX_DATOS || {}).estado || {})));
    },
    async guardarCandidato(id, cambios) {
      if (usaSupabase) {
        // Solo se envían las columnas que un analista puede modificar; la firma y la fecha las pone la base.
        const PERMITIDOS = ['tipoEvento', 'origen', 'factor', 'canal', 'impacto', 'normativa', 'decision', 'comentario', 'valorizado', 'moneda'];
        const cuerpo = {}; PERMITIDOS.forEach(k => { if (k in cambios) cuerpo[k] = cambios[k] === '' && k === 'valorizado' ? null : cambios[k]; });
        const filas = await sbFetch(`${SB.tablas?.candidatos || 'candidatos'}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(cuerpo) });
        if (!filas || !filas.length) throw new Error('No tenés permiso para clasificar este candidato (se requiere rol de analista).');
        const f = filas[0];
        return { revisadoPor: f.revisadoPor || '', revisadoEn: f.revisadoEn || '' };
      } else {
        const ov = leerOverlay(); ov[id] = Object.assign(ov[id] || {}, cambios); grabarLS(OVERLAY, JSON.stringify(ov));
      }
    },
    // Carga manual de un evento por un analista (queda pendiente de revisión)
    async crearCandidato(fila) {
      if (usaSupabase) {
        const filas = await sbFetch(SB.tablas?.candidatos || 'monitor_candidatos', { method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(fila) });
        if (!filas || !filas.length) throw new Error('No tenés permiso para cargar eventos (se requiere rol de analista).');
        return filas[0];
      }
      const f = Object.assign({}, fila, { agregado: new Date().toISOString(), decision: 'pendiente', sugeridoPor: 'Manual · ' + (analista() || 'analista') });
      const l = leerJSON('mx-manuales', []); l.push(f); grabarLS('mx-manuales', JSON.stringify(l)); return f;
    },
    // Fuentes a monitorear
    async fuentes() {
      if (usaSupabase) return sbFetch(`${SB.tablas?.fuentes || 'monitor_fuentes'}?select=*&order=agregado.desc`);
      return leerJSON('mx-fuentes', []);
    },
    async agregarFuente(url, nombre) {
      if (usaSupabase) {
        const filas = await sbFetch(SB.tablas?.fuentes || 'monitor_fuentes', { method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ url, nombre }) });
        return filas[0];
      }
      const l = leerJSON('mx-fuentes', []), f = { id: Date.now(), url, nombre, agregadoPor: analista(), agregado: new Date().toISOString() };
      l.unshift(f); grabarLS('mx-fuentes', JSON.stringify(l)); return f;
    },
    async borrarFuente(id) {
      if (usaSupabase) { await sbFetch(`${SB.tablas?.fuentes || 'monitor_fuentes'}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }); return; }
      grabarLS('mx-fuentes', JSON.stringify(leerJSON('mx-fuentes', []).filter(f => String(f.id) !== String(id))));
    }
  };

  // Analista (nombre que firma las decisiones)
  let PERFIL = null;
  const analista = () => usaSupabase ? (PERFIL ? PERFIL.nombre : '') : (leerLS('mx-analista') || '');
  const esAnalista = () => !usaSupabase || (PERFIL && (PERFIL.rol === 'analista' || PERFIL.rol === 'admin'));
  const esAdmin = () => usaSupabase && PERFIL && PERFIL.rol === 'admin';
  function pedirAnalista() {
    if (usaSupabase) { if (window.confirm(`Sesión iniciada como ${PERFIL ? PERFIL.email : ''}.\n¿Querés cerrar la sesión?`)) cerrarSesion(); return analista(); }
    const n = (window.prompt('Nombre y apellido del analista (queda registrado en cada decisión):', analista()) || '').trim();
    if (n) { grabarLS('mx-analista', n); pintarUsuario(); }
    return n || analista();
  }
  function pintarUsuario() {
    const n = analista();
    if (!$('mx-user-n')) return;
    $('mx-user-n').textContent = n || 'Analista';
    $('mx-user-r').textContent = usaSupabase ? (PERFIL ? (PERFIL.rol === 'admin' ? 'Administrador' : PERFIL.rol === 'analista' ? 'Analista' : PERFIL.rol === 'lector' ? 'Lector' : 'Sin acceso') : '') : (n ? 'Modo analista' : 'Definir nombre');
    $('mx-avatar').textContent = n ? n.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase() : '·';
  }

  // Ventana de ficha
  function abrirFicha(n) {
    cerrarFicha();
    const m = document.createElement('div');
    m.className = 'mx mx-modal'; m.id = 'mx-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="mx-dialog">
      <div class="mx-dialog-h ${n.severidad === 'alta' ? 'alta' : ''}">
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${sevBadge(n.severidad)}
          <span class="mx-badge neutral">${esc(CAT[n.categoria] || n.categoria || '—')}</span>
          ${n.ambito === 'nacional' ? '<span class="mx-badge info">ARGENTINA</span>' : '<span class="mx-badge neutral">INTERNACIONAL</span>'}
          ${n.id ? `<span class="mx-mono" style="color:var(--mute)">${esc(n.id)}</span>` : ''}</div>
        <button type="button" class="mx-x" data-cerrar aria-label="Cerrar">${ico('x')}</button>
      </div>
      <div class="mx-dialog-b">
        <h2 class="mx-h2" style="font-size:22px;line-height:29px">${esc(n.titulo)}</h2>
        <div class="meta3">
          <div class="mx-tile"><span>Fecha del hecho</span><b>${esc(fLarga(n.fecha))}</b></div>
          <div class="mx-tile"><span>Entidad</span><b>${esc(n.entidad || '—')}</b></div>
          <div class="mx-tile"><span>País</span><b>${esc(n.pais || '—')}</b></div>
          <div class="mx-tile"><span>Tipo</span><b>${esc(n.tipo || '—')}</b></div>
          <div class="mx-tile"><span>Fuente</span><b>${esc(n.fuente || '—')}</b></div>
          <div class="mx-tile"><span>Cargado</span><b>${esc(fHora(n.agregado) || '—')}</b></div>
        </div>
        <div><div class="mx-eyebrow" style="margin-bottom:6px">Resumen</div><p class="mx-body" style="font-size:15px;line-height:24px">${esc(n.resumen)}</p></div>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid var(--div);padding-top:14px">
          <span class="mx-small">Verificá siempre el hecho en su fuente original.</span>
          <div style="display:flex;gap:8px">
            <button type="button" class="mx-btn" data-cerrar>Cerrar</button>
            ${n.url ? `<a class="mx-btn primary" href="${esc(n.url)}" target="_blank" rel="noopener">Abrir nota original ${ico('ext', 'width:15px;height:15px')}</a>` : ''}
          </div>
        </div>
      </div></div>`;
    m.addEventListener('click', ev => { if (ev.target === m || ev.target.closest('[data-cerrar]')) cerrarFicha(); });
    document.body.appendChild(m);
    document.body.style.overflow = 'hidden';
    m.querySelector('[data-cerrar]').focus();
  }
  function cerrarFicha() { const m = $('mx-modal'); if (m) { m.remove(); document.body.style.overflow = ''; } }
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') cerrarFicha(); });

  // ---------- Encabezado común ----------
  async function iniciarEncabezado(vista) {
    const nav = document.querySelector('#mx-cmd .mx-nav .mx-wrap');
    if (nav && esAdmin() && !nav.querySelector('[data-vista="usuarios"]'))
      nav.insertAdjacentHTML('beforeend', '<a href="usuarios.html" data-vista="usuarios">Usuarios</a>');
    document.querySelectorAll('#mx-cmd .mx-nav a').forEach(a => a.classList.toggle('on', a.dataset.vista === vista));
    document.querySelectorAll('#mx-cmd .mx-tema button').forEach(b => {
      b.classList.toggle('on', b.dataset.tema === raizHtml.getAttribute('data-theme'));
      b.addEventListener('click', () => {
        raizHtml.setAttribute('data-theme', b.dataset.tema); grabarLS('mx-tema', b.dataset.tema);
        document.querySelectorAll('#mx-cmd .mx-tema button').forEach(x => x.classList.toggle('on', x === b));
      });
    });
    const q = new URLSearchParams(location.search).get('q');
    const qi = document.querySelector('#mx-cmd .mx-q input'); if (q && qi) qi.value = q;
    if ($('mx-user')) $('mx-user').addEventListener('click', pedirAnalista);
    pintarUsuario();
    document.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));
    try {
      const e = await datos.estado();
      if ($('mx-upd')) $('mx-upd').textContent = e.ultimaActualizacion ? `Datos al ${e.ultimaActualizacion}` : 'Sin datos';
    } catch (err) { if ($('mx-upd')) $('mx-upd').textContent = 'Sin conexión a datos'; }
    try {
      const p = (await datos.candidatos()).filter(c => c.decision === 'pendiente').length;
      if ($('mx-pend') && p) { $('mx-pend').textContent = p; $('mx-pend').hidden = false; }
    } catch (err) { /* sin candidatos */ }
  }

  // ---------- Disponibilidad de servicios ----------
  // Servicios: los de config.js más los agregados desde la página (vista previa: se guardan en este navegador)
  const EXTRA = 'mx-serv-extra';
  const leerExtras = () => leerJSON(EXTRA, []);
  const prepServ = s => {
    const rx = k => new RegExp('(^|[^a-z0-9áéíóúñ])' + low(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9áéíóúñ])');
    return Object.assign({}, s, { _rx: (s.claves && s.claves.length ? s.claves : [s.nombre]).map(rx), _ex: (s.excluir || []).map(low),
      _dd: s.dd || `https://www.google.com/search?q=${encodeURIComponent('site:downdetector.com.ar ' + s.nombre)}` });
  };
  // Origen de la lista: tabla monitor_servicios (compartida por el equipo); si no existe, config.js + este navegador
  let SERVICIOS = [], SERV_TABLA = false;
  const TSERV = (SB.tablas && SB.tablas.servicios) || 'monitor_servicios';
  const ordenar = l => { const g = [...new Set(l.map(x => x.grupo || 'Otros'))]; return l.map(prepServ).sort((a, b) => g.indexOf(a.grupo || 'Otros') - g.indexOf(b.grupo || 'Otros') || (a.orden || 0) - (b.orden || 0)); };
  const armarServicios = () => {
    if (SERV_TABLA) return SERVICIOS;
    const base = Array.isArray(CFG.servicios) ? CFG.servicios : [], ex = leerExtras().map(x => Object.assign({}, x, { propio: true }));
    SERVICIOS = ordenar(base.concat(ex)); return SERVICIOS;
  };
  async function cargarServicios() {
    if (usaSupabase) {
      try {
        const l = await sbFetch(`${TSERV}?select=*&activo=eq.true&order=orden.asc,nombre.asc`);
        SERV_TABLA = true; SERVICIOS = ordenar(l.map(x => Object.assign(x, { propio: true }))); return SERVICIOS;
      } catch (e) { if (e && e.sinSesion) throw e; SERV_TABLA = false; }
    }
    return armarServicios();
  }
  const puedeEditarServ = () => !usaSupabase || !SERV_TABLA || esAnalista();
  // Verificación en vivo: el navegador intenta abrir el sitio de cada servicio (responde = en línea)
  const VIVO = {};
  async function verificarWeb(url) {
    if (!url) return { estado: 'sin' };
    const ctl = new AbortController(), t0 = performance.now(), to = setTimeout(() => ctl.abort(), 8000);
    try { await fetch(url + (url.includes('?') ? '&' : '?') + '_mx=' + Date.now(), { mode: 'no-cors', cache: 'no-store', signal: ctl.signal });
      return { estado: 'ok', ms: Math.round(performance.now() - t0) }; }
    catch (e) { return { estado: 'caido' }; }
    finally { clearTimeout(to); }
  }
  const pintarVivo = (nombre) => {
    const v = VIVO[nombre] || { estado: 'cargando' };
    const txt = v.estado === 'ok' ? `En línea · ${v.ms} ms` : v.estado === 'lento' ? `Lento · ${v.ms} ms` : v.estado === 'caido' ? 'Sin respuesta' : v.estado === 'sin' ? 'Sin sitio cargado' : 'Verificando…';
    document.querySelectorAll(`[data-vivo="${CSS.escape(nombre)}"]`).forEach(el => { el.className = 'mx-vivo ' + v.estado; el.title = `Sitio web: ${txt}${v.fecha ? ' · verificado ' + fHora(v.fecha) : ''}${v.error ? ' · ' + v.error : ''}`; const s = el.querySelector('span'); if (s) s.textContent = txt;
      const card = el.closest('.mx-srv.vivo'); if (card) { card.classList.remove('s-ok', 's-lento', 's-caido'); if (['ok', 'lento', 'caido'].includes(v.estado)) card.classList.add('s-' + v.estado); } });
  };
  let vivoT = null, vivoUlt = null;
  // Estado guardado por la verificación automática del servidor (cada 5 minutos). Si no existe o está atrasado, se verifica desde el navegador.
  async function vivoServidor() {
    if (!usaSupabase || !SERV_TABLA) return null;
    try {
      const U = await sbFetch('monitor_servicios_ultimo?select=*');
      const rec = (U || []).filter(u => Date.now() - new Date(u.fecha).getTime() < 12 * 60e3);
      if (!rec.length) return null;
      SERVICIOS.forEach(s => { const u = rec.find(x => x.servicio_id === s.id); VIVO[s.nombre] = u ? { estado: u.estado, ms: u.ms, fecha: u.fecha, error: u.error, srv: true } : { estado: s.web ? 'cargando' : 'sin' }; });
      return new Date(Math.max(...rec.map(u => new Date(u.fecha).getTime())));
    } catch (e) { return null; }
  }
  async function verificarTodos(forzar) {
    const S = SERVICIOS.slice();
    const fs = forzar === true ? null : await vivoServidor();
    if (fs) {
      S.forEach(s => pintarVivo(s.nombre));
      document.querySelectorAll('[data-vivo-res]').forEach(el => {
        const n = e => S.filter(s => (VIVO[s.nombre] || {}).estado === e).length, ok = n('ok'), le = n('lento'), ca = n('caido');
        el.innerHTML = `<b style="color:var(--ok)">${ok} en línea</b>${le ? ` · <b style="color:var(--media)">${le} lentos</b>` : ''}${ca ? ` · <b style="color:var(--alta)">${ca} sin respuesta</b>` : ''} · verificado por el servidor ${fs.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
      });
      vivoUlt = fs; clearTimeout(vivoT); vivoT = setTimeout(verificarTodos, 5 * 60e3); return;
    }
    S.forEach(s => { if (!VIVO[s.nombre]) pintarVivo(s.nombre); });
    let i = 0; const trabajar = async () => { while (i < S.length) { const s = S[i++]; VIVO[s.nombre] = await verificarWeb(s.web); pintarVivo(s.nombre); } };
    await Promise.all([1, 2, 3, 4, 5, 6].map(trabajar));
    vivoUlt = new Date();
    document.querySelectorAll('[data-vivo-res]').forEach(el => {
      const ok = S.filter(s => (VIVO[s.nombre] || {}).estado === 'ok').length, ca = S.filter(s => (VIVO[s.nombre] || {}).estado === 'caido').length;
      el.innerHTML = `<b style="color:var(--ok)">${ok} en línea</b>${ca ? ` · <b style="color:var(--alta)">${ca} sin respuesta</b>` : ''} · verificado ${vivoUlt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    });
    clearTimeout(vivoT); vivoT = setTimeout(verificarTodos, 5 * 60e3);
  }
  const vivoHtml = s => `<span class="mx-vivo ${(VIVO[s.nombre] || {}).estado || 'cargando'}" data-vivo="${esc(s.nombre)}"><i></i><span>Verificando…</span></span>`;
  // Alta de servicios desde la página
  function abrirAltaServicio(alGuardar, ed) {
    cerrarFicha();
    const grupos = [...new Set(SERVICIOS.map(s => s.grupo || 'Otros'))];
    const m = document.createElement('div');
    m.className = 'mx mx-modal'; m.id = 'mx-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    m.innerHTML = `<div class="mx-dialog" style="max-width:620px">
      <div class="mx-dialog-h"><div style="display:flex;gap:8px;align-items:center">${ico('bank', 'color:var(--primary)')}<b class="mx-h3">${ed ? 'Editar servicio' : 'Agregar servicio a monitorear'}</b></div>
        <button type="button" class="mx-x" data-cerrar aria-label="Cerrar">${ico('x')}</button></div>
      <form class="mx-dialog-b" id="sa-form" novalidate>
        <div class="mx-form">
          <div><label class="mx-label" for="sa-nom">Nombre <em>*</em></label><input class="mx-input" id="sa-nom" maxlength="60" required placeholder="Ej.: Banco de Corrientes"></div>
          <div><label class="mx-label" for="sa-gru">Grupo <em>*</em></label><input class="mx-input" id="sa-gru" list="sa-grus" required placeholder="Elegí o escribí uno nuevo">
            <datalist id="sa-grus">${grupos.map(g => `<option value="${esc(g)}">`).join('')}</datalist></div>
          <div style="grid-column:1/-1"><label class="mx-label" for="sa-web">Sitio web a verificar</label><input class="mx-input" id="sa-web" inputmode="url" placeholder="www.banco.com.ar o la página de ingreso al homebanking"></div>
          <div style="grid-column:1/-1"><label class="mx-label" for="sa-cla">Palabras que lo identifican en las noticias</label><input class="mx-input" id="sa-cla" placeholder="banco de corrientes, bancorrientes (separadas por coma)"></div>
          <div style="grid-column:1/-1"><label class="mx-label" for="sa-dd">Página de Downdetector (opcional)</label><input class="mx-input" id="sa-dd" inputmode="url" placeholder="Si lo dejás vacío, el botón Reportes la busca"></div>
          <label style="grid-column:1/-1;display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="sa-des"> Mostrarlo siempre en el Panorama del día</label>
        </div>
        <p class="mx-msg" id="sa-msg" aria-live="polite"></p>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="mx-btn" data-cerrar>Cancelar</button><button type="submit" class="mx-btn primary" id="sa-ok">${ed ? 'Guardar cambios' : 'Agregar'}</button></div>
      </form></div>`;
    m.addEventListener('click', ev => { if (ev.target === m || ev.target.closest('[data-cerrar]')) cerrarFicha(); });
    document.body.appendChild(m); document.body.style.overflow = 'hidden'; m.querySelector('#sa-nom').focus();
    if (ed) { $('sa-nom').value = ed.nombre; $('sa-gru').value = ed.grupo || ''; $('sa-web').value = ed.web || ''; $('sa-cla').value = (ed.claves || []).join(', ');
      $('sa-dd').value = ed.dd || ''; $('sa-des').checked = !!ed.destacado; }
    const url = v => { v = String(v || '').trim(); return !v ? '' : /^https?:\/\//i.test(v) ? v : 'https://' + v; };
    m.querySelector('#sa-form').addEventListener('submit', async ev => {
      ev.preventDefault();
      const nombre = $('sa-nom').value.trim(), grupo = $('sa-gru').value.trim();
      if (!nombre || !grupo) { $('sa-msg').className = 'mx-msg err'; $('sa-msg').textContent = 'Completá el nombre y el grupo.'; return; }
      if (SERVICIOS.some(s => low(s.nombre) === low(nombre) && (!ed || s.nombre !== ed.nombre))) { $('sa-msg').className = 'mx-msg err'; $('sa-msg').textContent = 'Ya hay un servicio con ese nombre.'; return; }
      const claves = $('sa-cla').value.split(',').map(x => x.trim()).filter(Boolean);
      const nuevo = { nombre, grupo, web: url($('sa-web').value), claves: claves.length ? claves : [nombre], dd: url($('sa-dd').value), destacado: $('sa-des').checked };
      if (SERV_TABLA) {
        $('sa-ok').disabled = true; $('sa-msg').className = 'mx-msg'; $('sa-msg').textContent = 'Guardando…';
        try {
          const cuerpo = { nombre, grupo, web: nuevo.web || null, claves: nuevo.claves, dd: nuevo.dd || null, destacado: nuevo.destacado };
          if (ed && ed.id) await sbFetch(`${TSERV}?id=eq.${ed.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(cuerpo) });
          else { cuerpo.orden = Math.max(0, ...SERVICIOS.filter(x => (x.grupo || 'Otros') === grupo).map(x => x.orden || 0)) + 5 || 1000;
            await sbFetch(TSERV, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(cuerpo) }); }
        } catch (err) {
          $('sa-ok').disabled = false; $('sa-msg').className = 'mx-msg err';
          $('sa-msg').textContent = /403|42501|row-level/i.test(err.message) ? 'Solo analistas y administradores pueden modificar la lista.' : /23505|duplicate/i.test(err.message) ? 'Ya hay un servicio con ese nombre.' : 'No se pudo guardar: ' + errBase(err);
          return;
        }
        if (ed && ed.nombre !== nombre) delete VIVO[ed.nombre];
        cerrarFicha(); await cargarServicios(); alGuardar && alGuardar(nombre); return;
      }
      let l = leerExtras(); if (ed) l = l.filter(x => x.nombre !== ed.nombre); l.push(nuevo); grabarLS(EXTRA, JSON.stringify(l));
      cerrarFicha(); armarServicios(); alGuardar && alGuardar(nombre);
    });
  }
  async function quitarServicio(nombre, alQuitar) {
    if (!window.confirm(`¿Quitar "${nombre}" de los servicios monitoreados?${SERV_TABLA ? ' Deja de verse para todo el equipo (los hechos registrados no se borran).' : ''}`)) return;
    if (SERV_TABLA) {
      const s = SERVICIOS.find(x => x.nombre === nombre);
      try { await sbFetch(`${TSERV}?id=eq.${s.id}`, { method: 'DELETE' }); } catch (err) { window.alert('No se pudo quitar: ' + errBase(err)); return; }
      delete VIVO[nombre]; await cargarServicios(); alQuitar && alQuitar(); return;
    }
    grabarLS(EXTRA, JSON.stringify(leerExtras().filter(x => x.nombre !== nombre))); delete VIVO[nombre]; armarServicios(); alQuitar && alQuitar();
  }
  armarServicios();
  const RX_CAIDA = /ca[ií]da|se cay[oó]|fuera de servicio|interrupci[oó]n|sin servicio|no funciona|demoras?|intermitencia|falla (t[eé]cnica|masiva|general|nacional)|alteraciones en la actividad/;
  // Incidentes de disponibilidad (caídas, fallas, interrupciones) que mencionan a algún servicio de la lista
  function incidentesServicios(N, C) {
    const out = [], ids = new Set();
    const add = (id, base) => {
      const txt = low([base.titulo, base.resumen, base.entidad, base.clase].join(' '));
      if (!RX_CAIDA.test(low(base.clase)) && !RX_CAIDA.test(txt)) return;
      const serv = SERVICIOS.filter(s => { let t = txt; s._ex.forEach(e => { t = t.split(e).join(' '); }); return s._rx.some(r => r.test(t)); }).map(s => s.nombre);
      if (!serv.length) return;
      const k = id || base.url || base.titulo; if (ids.has(k)) return; ids.add(k);
      out.push(Object.assign(base, { servicios: serv }));
    };
    N.forEach(x => add(x.id, { src: x, fecha: x.fecha, titulo: x.titulo, resumen: x.resumen, entidad: x.entidad, clase: x.tipo, sev: x.severidad, url: x.url, fuente: x.fuente }));
    C.filter(c => c.decision !== 'rechazado').forEach(c => add(c.id, { src: null, fecha: c.fecha, titulo: c.titulo, resumen: c.resumen, entidad: c.entidad,
      clase: [c.subtipo, c.tipoEvento].join(' '), sev: low(c.impacto) === 'alta' ? 'alta' : low(c.impacto) === 'baja' ? 'baja' : 'media', url: c.url, fuente: c.fuente }));
    return out.filter(h => h.fecha).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
  function tarjetaServicio(s, h, idx) {
    const caida = h && h.sev === 'alta';
    return `<div class="mx-srv ${h ? (caida ? 'caida' : 'falla') : ''}">
        <div class="mx-srv-h"><b title="${esc(s.nombre)}">${esc(s.nombre)}</b><a class="dd" href="${esc(s._dd)}" target="_blank" rel="noopener" title="Reportes de usuarios en Downdetector">Reportes ↗</a></div>
        ${vivoHtml(s)}
        <div class="mx-srv-e">${h ? `<i></i>${caida ? 'Caída registrada' : 'Falla registrada'} · ${esc(fCorta(h.fecha))}` : '<span style="color:var(--mute);font-weight:400">Sin incidentes en 7 días</span>'}</div>
        ${h ? `<div class="mx-srv-t" ${idx != null ? `data-srv="${idx}"` : ''} title="${esc(h.titulo)}">${esc(h.titulo.length > 90 ? h.titulo.slice(0, 88) + '…' : h.titulo)}</div>` : ''}
      </div>`;
  }
  function pintarServicios(N, C) {
    const cont = $('mx-serv'); if (!cont) return;
    if (!SERVICIOS.length) { $('mx-serv-card').hidden = true; return; }
    const desde = fechaART(new Date(Date.now() - 7 * 864e5).toISOString());
    const I = incidentesServicios(N, C).filter(h => h.fecha >= desde);
    const fichas = []; let html = '', grupo = '', nInc = 0, ocultos = 0;
    SERVICIOS.forEach(s => {
      const h = I.find(x => x.servicios.includes(s.nombre));
      if (h) nInc++;
      if (!h && !s.destacado) { ocultos++; return; }
      if (s.grupo && s.grupo !== grupo) { grupo = s.grupo; html += `<div class="mx-serv-g">${esc(grupo)}</div>`; }
      let idx = null; if (h && h.src) { fichas.push(h.src); idx = fichas.length - 1; }
      html += tarjetaServicio(s, h, idx);
    });
    if (ocultos) html += `<div class="mx-serv-g" style="text-transform:none;letter-spacing:0;font-weight:500">Otros ${ocultos} servicios sin incidentes registrados · <a href="servicios.html">ver todos e histórico →</a></div>`;
    cont.innerHTML = html;
    $('mx-serv-res').textContent = nInc ? `${plural(nInc, 'servicio')} con incidentes · 7 días` : 'Sin incidentes · 7 días';
    cont.querySelectorAll('[data-srv]').forEach(el => el.addEventListener('click', () => abrirFicha(fichas[+el.dataset.srv])));
    Object.keys(VIVO).forEach(pintarVivo);
    if (!pintarServicios.listo) { pintarServicios.listo = true; verificarTodos();
      const b = $('mx-serv-add'); if (b) b.addEventListener('click', () => abrirAltaServicio(() => pintarServicios(N, C))); }
    else verificarTodos();
  }

  // ---------- Cálculos compartidos ----------
  const ventanas = N => {
    const ref = N.length ? new Date(N[0].fecha + 'T12:00:00Z') : new Date();
    const dia = k => new Date(ref.getTime() - k * 864e5).toISOString().slice(0, 10);
    const dias = []; for (let k = 13; k >= 0; k--) dias.push(dia(k));
    return { dias, sem: N.filter(x => x.fecha >= dia(6)), ant: N.filter(x => x.fecha >= dia(13) && x.fecha < dia(6)) };
  };
  const tiempoMedio = C => {
    const h = C.filter(c => c.decision !== 'pendiente' && c.revisadoEn && c.agregado)
      .map(c => (new Date(c.revisadoEn) - new Date(c.agregado)) / 3600e3).filter(x => x >= 0 && isFinite(x));
    if (!h.length) return '—';
    const m = h.reduce((s, x) => s + x, 0) / h.length;
    return m < 1 ? `${Math.round(m * 60)} min` : m < 48 ? `${m.toFixed(1).replace('.', ',')} h` : `${(m / 24).toFixed(1).replace('.', ',')} días`;
  };
  function spark(serie, color, idg) {
    const W = 100, H = 32, max = Math.max(1, ...serie);
    const pts = serie.map((v, i) => [i * W / (serie.length - 1), H - 3 - (v / max) * (H - 8)]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
    const u = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${idg}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" style="stop-color:${color};stop-opacity:.28"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs>
      <path d="${d} L${W},${H} L0,${H} Z" fill="url(#${idg})"/><path d="${d}" style="fill:none;stroke:${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <circle cx="${u[0]}" cy="${u[1]}" r="2.6" style="fill:${color}"/></svg>`;
  }
  const delta = (a, b) => {
    if (!b && !a) return '<span class="mx-delta igual">sin datos previos</span>';
    const d = a - b, pct = b ? Math.round(d / b * 100) : 100;
    return d > 0 ? `<span class="mx-delta sube">▲ +${pct}% sem.</span>` : d < 0 ? `<span class="mx-delta baja">▼ ${pct}% sem.</span>` : '<span class="mx-delta igual">= sin cambios</span>';
  };
  const filaFeed = (x, btn) => `<div class="mx-fitem ${esc(x.severidad)}">
      <div class="izq"><span class="ib">${ico(CAT_ICO[x.categoria] || 'alert')}</span>
        <div style="min-width:0"><div class="t"><a href="#" data-ficha="${esc(x._i)}">${esc(x.titulo)}</a><span class="mx-badge ${esc(x.severidad)}">${esc(x.tipo || '—')}</span></div>
        <div class="d">${esc(x.resumen)}</div></div></div>
      <div class="der"><span class="mx-mono">${esc(fCorta(x.fecha))} · ${esc(x.pais || '—')}</span>${btn ? `<button type="button" class="mx-btn sm soft" data-ficha="${esc(x._i)}">Ver ficha</button>` : ''}</div>
    </div>`;
  const conectarFichas = (cont, lista) => cont.addEventListener('click', ev => {
    const t = ev.target.closest('[data-ficha]'); if (!t) return; ev.preventDefault(); const x = lista[+t.dataset.ficha]; if (x) abrirFicha(x);
  });
  function paginar(cont, total, porPag, pag, ir) {
    const np = Math.max(1, Math.ceil(total / porPag));
    if (!cont) return;
    if (total <= porPag) { cont.innerHTML = `<span>${plural(total, 'resultado')}</span>`; return; }
    const ini = (pag - 1) * porPag + 1, fin = Math.min(total, pag * porPag);
    let b = `<button type="button" data-p="${pag - 1}" ${pag === 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>`;
    for (let i = 1; i <= np; i++) if (i === 1 || i === np || Math.abs(i - pag) <= 1) b += `<button type="button" data-p="${i}" class="${i === pag ? 'on' : ''}">${i}</button>`;
      else if (Math.abs(i - pag) === 2) b += '<button type="button" disabled>…</button>';
    b += `<button type="button" data-p="${pag + 1}" ${pag === np ? 'disabled' : ''} aria-label="Siguiente">›</button>`;
    cont.innerHTML = `<span>Mostrando ${ini}–${fin} de ${total}</span><div class="bts">${b}</div>`;
    cont.querySelectorAll('button[data-p]').forEach(x => x.addEventListener('click', () => { if (!x.disabled) ir(+x.dataset.p); }));
  }

  // ---------- Panorama: resumen de las últimas 24 horas por módulo ----------
  async function resumen24(N, C) {
    const cont = $('mx-res'); if (!cont) return;
    const ayer = fechaART(new Date(Date.now() - 864e5).toISOString()), hace7 = new Date(Date.now() - 7 * 864e5).toISOString(), h24 = Date.now() - 864e5;
    const li = (c, t) => `<li class="${c}"><i></i><span>${t}</span></li>`, corto = (t, n) => esc(t.length > n ? t.slice(0, n - 1) + '…' : t);
    const mod = (id, k, ic, tit, href, cuerpo) => `<div class="pv-mod" style="--k:${k}" id="${id}"><div class="h"><span class="ki">${ic}</span>${tit}<a href="${href}">Ver →</a></div><ul>${cuerpo}</ul></div>`;
    const sk = '<li><span class="sk" style="width:90%"></span></li><li><span class="sk" style="width:70%"></span></li><li><span class="sk" style="width:80%"></span></li>';
    const IC = { n: '<svg class="mx-ico" viewBox="0 0 24 24"><path d="M4 5h13v14H6a2 2 0 0 1-2-2z"/><path d="M17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/></svg>',
      s: '<svg class="mx-ico" viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>', a: '<svg class="mx-ico" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
      r: '<svg class="mx-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/></svg>' };
    // Noticias (datos ya cargados)
    const rec = N.filter(x => x.fecha >= ayer), alt = rec.filter(x => x.severidad === 'alta'), pend = C.filter(c => c.decision === 'pendiente').length, top = alt[0] || rec[0];
    const nHtml = li(alt.length ? 'ro' : 'gr', `<b>${rec.length}</b> hechos de hoy y ayer${alt.length ? ` · <b>${alt.length}</b> de severidad alta` : ''}`)
      + (top ? li(top.severidad === 'alta' ? 'ro' : top.severidad === 'media' ? 'am' : 'gr', corto(top.titulo, 80)) : '')
      + li(pend ? 'am' : '', pend ? `<b>${pend}</b> candidatos esperan revisión` : 'Sin candidatos pendientes');
    cont.innerHTML = mod('rs-n', 'var(--alta)', IC.n, 'Noticias', 'noticias.html', nHtml) + mod('rs-s', 'var(--ok)', IC.s, 'Servicios', 'servicios.html', sk)
      + mod('rs-a', 'var(--primary)', IC.a, 'Apps', 'apps.html', sk) + mod('rs-r', '#7c5cd6', IC.r, 'Reputación', 'reputacion.html', sk);
    const poner = (id, h) => { const el = $(id); if (el) el.querySelector('ul').innerHTML = h; };
    const nd = t => li('gr', t);
    // Servicios: estado del servidor o incidentes de la semana
    (async () => {
      const inc = incidentesServicios(N, C).filter(h => h.fecha >= ayer);
      let h = '';
      if (usaSupabase && SERV_TABLA) {
        try {
          const U = (await sbFetch('monitor_servicios_ultimo?select=*')).filter(u => Date.now() - new Date(u.fecha).getTime() < 12 * 60e3);
          if (U.length) {
            const nom = id => (SERVICIOS.find(s => s.id === id) || {}).nombre || '—', ca = U.filter(u => u.estado === 'caido'), le = U.filter(u => u.estado === 'lento');
            h += li(ca.length ? 'am' : '', `<b>${U.length - ca.length} de ${U.length}</b> sitios en línea ahora`);
            ca.slice(0, 2).forEach(u => { h += li('ro', `${esc(nom(u.servicio_id))} · sin respuesta`); });
            if (!ca.length && le.length) h += li('am', `${le.length} con respuesta lenta`);
          }
        } catch (e) { /* sin historial */ }
      }
      h += inc.length ? inc.slice(0, 2).map(x => li(x.sev === 'alta' ? 'ro' : 'am', `${esc(x.servicios.join(', '))} · ${x.sev === 'alta' ? 'caída' : 'falla'} en noticias`)).join('') : li('', 'Sin incidentes en noticias (hoy y ayer)');
      poner('rs-s', h);
    })();
    if (!usaSupabase) { poner('rs-a', nd('Requiere la base de Supabase.')); poner('rs-r', nd('Requiere la base de Supabase.')); return; }
    // Apps
    (async () => {
      try {
        const [R, L] = await Promise.all([sbFetch(`monitor_apps_resenas?select=estrellas,tema,fecha&fecha=gte.${hace7}&order=fecha.desc&limit=2000`), sbFetch('monitor_apps_lecturas?select=app_id,tienda,rating,fecha&rating=not.is.null&order=fecha.desc&limit=60')]);
        const neg = R.filter(r => r.estrellas <= 2), r24 = R.filter(r => new Date(r.fecha).getTime() >= h24), tc = {};
        neg.forEach(r => { tc[r.tema || 'General'] = (tc[r.tema || 'General'] || 0) + 1; });
        const tt = Object.entries(tc).sort((a, b) => b[1] - a[1])[0], ult = {}; L.forEach(l => { const k = l.app_id + l.tienda; if (!ult[k]) ult[k] = +l.rating; });
        const rs = Object.values(ult), prom = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null;
        poner('rs-a', li(r24.length ? 'az' : 'gr', `<b>${r24.length}</b> opiniones nuevas en 24 h`)
          + li(neg.length ? 'ro' : '', `<b>${neg.length}</b> de 1–2 ★ en 7 días`) + (tt ? li('am', `Más reclamado: <b>${esc(tt[0])}</b> (${tt[1]})`) : '')
          + (prom != null ? li(prom < 3 ? 'ro' : prom < 4 ? 'am' : '', `Calificación promedio <b>${prom.toFixed(1).replace('.', ',')} ★</b>`) : ''));
      } catch (e) { poner('rs-a', nd('Sin acceso a los datos de las apps.')); }
    })();
    // Reputación
    (async () => {
      try {
        const [A, X] = await Promise.all([sbFetch('monitor_rep_alertas?select=estado,detectado,prioridad,prioridad_analista&order=detectado.desc&limit=5000'), sbFetch('monitor_rep_corridas?select=estado,consulta_id,inicio&order=inicio.desc&limit=100')]);
        const nue = A.filter(a => new Date(a.detectado).getTime() >= h24), pe = A.filter(a => ['nueva', 'en_verificacion'].includes(a.estado)),
          hi = pe.filter(a => ['alta', 'critica'].includes(a.prioridad_analista || a.prioridad)), vis = new Set(), ul = X.filter(r => !vis.has(r.consulta_id) && vis.add(r.consulta_id)),
          mal = ul.filter(r => ['error', 'limitado'].includes(r.estado)).length;
        poner('rs-r', li(nue.length ? 'az' : 'gr', `<b>${nue.length}</b> menciones nuevas en 24 h`) + li(hi.length ? 'ro' : pe.length ? 'am' : '', `<b>${pe.length}</b> pendientes de verificación${hi.length ? ` · <b>${hi.length}</b> alta o crítica` : ''}`)
          + (ul.length ? li(mal ? 'am' : '', `Fuentes: ${ul.length - mal}/${ul.length} respondieron`) : ''));
      } catch (e) { poner('rs-r', nd('Sin acceso a los datos de reputación.')); }
    })();
  }

  // ---------- Vistas ----------
  const vistas = {
    async inicio() {
      const [N, E, C] = await Promise.all([datos.noticias(), datos.estado(), datos.candidatos().catch(() => [])]);
      N.forEach((x, i) => { x._i = i; });
      const tick = () => { const t = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        $('mx-reloj').textContent = t[0].toUpperCase() + t.slice(1) + ' · UTC-3'; };
      tick(); setInterval(tick, 1000);
      $('mx-datos').textContent = `Datos al ${E.ultimaActualizacion || '—'}`;

      // Disponibilidad de servicios: hechos confirmados de los últimos 7 días + enlace a Downdetector
      try { await cargarServicios(); if ($('mx-serv-add') && !puedeEditarServ()) $('mx-serv-add').hidden = true; pintarServicios(N, C); } catch (err) { console.error('[Monitor] Servicios:', err); }
      const pend = C.filter(c => c.decision === 'pendiente').length;
      if (pend) { $('mx-aviso-n').textContent = pend; $('mx-aviso').hidden = false; }

      // Nivel de amenaza
      const iN = NIVELES.indexOf(sinTilde(E.nivelAmenaza));
      const b = $('mx-nivel-badge'); b.textContent = iN >= 0 ? NIVEL_TXT[iN].toUpperCase() : '—'; if (iN >= 0) b.classList.add(NIVEL_BADGE[iN]);
      $('mx-meter').querySelectorAll('.seg').forEach((s, i) => { if (i === iN) s.style.background = `var(--lv-${NIVELES[iN]})`; s.classList.toggle('on', i === iN); });
      $('mx-meter-l').querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', i === iN));
      const { dias, sem, ant } = ventanas(N);
      const dd = sem.length - ant.length, pct = ant.length ? Math.round(dd / ant.length * 100) : 0;
      $('mx-trend').innerHTML = `<span style="color:${dd > 0 ? 'var(--alta)' : dd < 0 ? 'var(--ok)' : 'var(--mute)'}">${dd > 0 ? '▲ +' : dd < 0 ? '▼ ' : '= '}${pct}%</span>
        <span style="color:var(--mute)">vs. 7 días previos · Tendencia: ${esc(E.tendencia || '—')}</span>`;

      // Indicadores
      const K = [
        { t: 'Hechos relevados', f: () => true, i: 'activity', c: 'var(--primary)', hex: '#2f6bd8' },
        { t: 'Severidad alta', f: x => x.severidad === 'alta', i: 'alert', c: 'var(--alta)', hex: '#c0362c', ib: 'rojo', vc: 'var(--alta)' },
        { t: 'Ámbito nacional (AR)', f: x => x.ambito === 'nacional', i: 'flag', hex: '#2f6bd8', ib: 'azul' },
        { t: 'Banca y pagos', f: x => x.categoria === 'banca', i: 'bank', hex: '#5a90ff' }];
      $('mx-kpis').innerHTML = K.map((k, j) => {
        const a = sem.filter(k.f).length, bb = ant.filter(k.f).length;
        const serie = dias.map(d => N.filter(x => x.fecha === d && k.f(x)).length);
        const col = ['var(--primary)', 'var(--alta)', 'var(--primary)', 'var(--ok)'][j];
        return `<div class="mx-kpi"><div class="mx-kpi-h"><span class="mx-eyebrow">${k.t}</span><span class="mx-kpi-ib ${k.ib || ''}">${ico(k.i, 'width:17px;height:17px')}</span></div>
          <div class="mx-kpi-v"><span class="n"><span class="mx-stat" ${k.vc ? `style="color:${k.vc}"` : ''}>${a}</span>${j ? `<span class="pct">${sem.length ? (a / sem.length * 100).toFixed(1).replace('.', ',') : 0}%</span>` : ''}</span>${delta(a, bb)}</div>
          <div class="mx-spark">${spark(serie, col, 'g' + j)}</div>
          <div class="mx-small" style="margin-top:6px">Últimos 7 días · línea: 14 días</div></div>`;
      }).join('');

      resumen24(N, C).catch(err => console.error('[Monitor] Resumen:', err));

      // Lectura del día
      const lec = String(E.lecturaDelDia || '').trim();
      const m = lec.match(/^(.+?[.;])\s+(.+)$/s);
      $('mx-lect-t').textContent = m ? m[1] : (lec || 'Sin lectura cargada.');
      $('mx-lect-b').textContent = m ? m[2] : '';
      $('mx-emitido').textContent = `Actualizado: ${E.ultimaActualizacion || '—'}`;
      const tipos = {}; sem.forEach(x => { if (x.tipo) (tipos[x.tipo] = tipos[x.tipo] || []).push(x); });
      const top = Object.entries(tipos).sort((p, q) => q[1].length - p[1].length).slice(0, 2);
      $('mx-vectores').innerHTML = top.map(([t, l], j) => `<div class="mx-vector">${ico(j ? 'target' : 'alert', j ? '' : 'color:var(--alta)')}
        <div><b>Tipo prevalente #${j + 1}: ${esc(t)}</b><span class="mx-small">${plural(l.length, 'hecho')} en 7 días · el más reciente: ${esc(l[0].titulo)}</span></div></div>`).join('');

      // Argentina
      const nac = sem.filter(x => x.ambito === 'nacional').sort((a, c) => (RK[a.severidad] ?? 3) - (RK[c.severidad] ?? 3) || c.fecha.localeCompare(a.fecha)).slice(0, 8);
      $('mx-nac-n').textContent = plural(sem.filter(x => x.ambito === 'nacional').length, 'hecho') + ' en 7 días';
      $('mx-nac').innerHTML = nac.map(x => `<tr class="pc-${esc(x.severidad)}"><td class="nw">${sevBadge(x.severidad)}</td>
        <td class="tit"><a href="#" data-ficha="${x._i}">${esc(x.titulo)}</a><div style="margin-top:4px"><span class="mx-chip-mono">${esc(x.fuente)}</span></div></td>
        <td style="min-width:110px;max-width:190px">${esc(x.entidad)}</td><td class="nw mx-mono">${esc(fCorta(x.fecha))}</td>
        <td class="r"><button type="button" class="mx-btn sm primary" data-ficha="${x._i}">Ficha</button></td></tr>`).join('')
        || '<tr><td colspan="5" class="mx-empty">Sin hechos nacionales en los últimos 7 días.</td></tr>';
      conectarFichas($('mx-nac'), N);

      // Internacional
      const intl = sem.filter(x => x.ambito !== 'nacional' && x.severidad === 'alta').slice(0, 5);
      $('mx-int').innerHTML = intl.map(x => filaFeed(x, true)).join('') || '<div class="mx-empty">Sin hechos internacionales de severidad alta en los últimos 7 días.</div>';
      conectarFichas($('mx-int'), N);

      // Actividad 14 días
      const D = dias.map(d => { const l = N.filter(x => x.fecha === d); return { d, n: l.length, a: l.filter(x => x.severidad === 'alta').length, nac: l.filter(x => x.ambito === 'nacional').length }; });
      const tot = D.reduce((s, x) => s + x.n, 0);
      $('mx-prom').textContent = `Prom: ${(tot / 14).toFixed(1).replace('.', ',')} h/d`;
      const max = Math.max(4, ...D.map(x => x.n)), paso = max <= 8 ? 2 : max <= 20 ? 5 : 10, tope = Math.ceil(max / paso) * paso, iMax = D.findIndex(x => x.n === Math.max(...D.map(y => y.n)));
      const W = 340, H = 170, ml = 22, mb = 20, mt = 14, cw = (W - ml) / 14, bw = Math.min(14, cw - 5), y = v => mt + (H - mt - mb) * (1 - v / tope);
      let svg = `<svg viewBox="0 0 ${W} ${H}">`;
      for (let v = paso; v <= tope; v += paso) svg += `<line class="grid" x1="${ml}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="eje" x="${ml - 5}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
      svg += `<line class="base" x1="${ml}" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>`;
      D.forEach((x, i) => {
        const cx = ml + i * cw + cw / 2, top2 = y(x.n), base = y(0), r = Math.min(4, (base - top2) / 2), l = cx - bw / 2, rr = cx + bw / 2;
        const cls = i === 13 ? 'b hoy' : i >= 7 ? 'b rec' : 'b';
        svg += `<g data-i="${i}"><rect class="hit" x="${ml + i * cw}" y="0" width="${cw}" height="${H - mb}"/>`
          + (x.n ? `<path class="${cls}" d="M${l},${base} V${top2 + r} Q${l},${top2} ${l + r},${top2} H${rr - r} Q${rr},${top2} ${rr},${top2 + r} V${base} Z"/>` : '')
          + (i === iMax && x.n ? `<text class="lbl" x="${cx}" y="${top2 - 4}" text-anchor="middle">${x.n}</text>` : '') + '</g>'
          + `<text class="eje" x="${cx}" y="${H - 5}" text-anchor="middle"${i === 13 ? ' style="font-weight:700;fill:var(--ink)"' : ''}>${+x.d.slice(8)}</text>`;
      });
      $('mx-bars').innerHTML = svg + '</svg>';
      $('mx-bars').setAttribute('aria-label', 'Hechos por día: ' + D.map(x => `${fCorta(x.d)} ${x.n}`).join(', '));
      $('mx-bars').querySelectorAll('g[data-i]').forEach(g => {
        const x = D[+g.dataset.i];
        g.addEventListener('mousemove', ev => verTip(ev, `<b>${fCorta(x.d)}</b> · ${plural(x.n, 'hecho')}<br>${x.a} de severidad alta · ${x.nac} nacional${x.nac === 1 ? '' : 'es'}`));
        g.addEventListener('mouseleave', ocultarTip);
      });

      // Categorías y severidad
      $('mx-cat-tot').textContent = `Total ${sem.length} · 7 días`;
      const cc = Object.keys(CAT).map(k => [k, sem.filter(x => x.categoria === k).length]).sort((p, q) => q[1] - p[1]);
      const cmax = Math.max(1, ...cc.map(x => x[1]));
      $('mx-cats').innerHTML = cc.map(([k, c]) => `<a class="mx-catrow" href="noticias.html?categoria=${k}&per=7"><div class="l"><span>${CAT[k]}</span>
        <span class="mx-mono">${sem.length ? Math.round(c / sem.length * 100) : 0}% · ${plural(c, 'hecho')}</span></div>
        <div class="mx-track"><div class="mx-fill" style="width:${(c / cmax * 100).toFixed(1)}%"></div></div></a>`).join('');
      const sv = ['alta', 'media', 'baja'].map(s => [s, sem.filter(x => x.severidad === s).length]);
      const st = Math.max(1, sv.reduce((s, x) => s + x[1], 0));
      $('mx-sev-tot').textContent = `${sem.length} total`;
      $('mx-sevbar').innerHTML = sv.filter(x => x[1]).map(([s, c]) => `<span style="width:${(c / st * 100).toFixed(1)}%;background:var(--${s})" title="${s}: ${c}"></span>`).join('');
      $('mx-sevleg').innerHTML = sv.map(([s, c]) => `<div><div class="k"><i style="background:var(--${s})"></i>${s[0].toUpperCase() + s.slice(1)}</div>
        <div class="mx-mono">${c} (${Math.round(c / st * 100)}%)</div></div>`).join('');

      $('mx-exp-xls').addEventListener('click', () => exportarNoticias(N, { candidatos: C, vista: () => sem, vistaEtiqueta: 'Últimos 7 días', vistaDetalle: 'Los hechos de este panorama', porDefecto: 'vista' }));
      $('mx-exp-pdf').addEventListener('click', () => window.print());
    },

    async noticias() {
      const N = await datos.noticias(); N.forEach((x, i) => { x._i = i; });
      const p = new URLSearchParams(location.search);
      Object.entries(CAT).forEach(([k, v]) => $('f-cat').insertAdjacentHTML('beforeend', `<option value="${k}">${v}</option>`));
      if (p.get('q')) $('f-q').value = p.get('q');
      ['categoria:f-cat', 'ambito:f-amb', 'severidad:f-sev', 'per:f-per'].forEach(s => { const [k, id] = s.split(':'); if (p.get(k) != null) $(id).value = p.get(k); });
      const ref = N.length ? new Date(N[0].fecha + 'T12:00:00Z') : new Date();
      let vis = [], pag = 1;
      const pintar = () => {
        const ini = (pag - 1) * 15;
        $('mx-lista').innerHTML = vis.slice(ini, ini + 15).map(x => filaFeed(x, true)).join('') || '<div class="mx-empty">No hay hechos con esos filtros.</div>';
        paginar($('mx-pag'), vis.length, 15, pag, n => { pag = n; pintar(); $('mx-lista').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      };
      const filtrar = () => {
        const q = low($('f-q').value), ca = $('f-cat').value, am = $('f-amb').value, sv = $('f-sev').value, per = $('f-per').value;
        const desde = per ? new Date(ref.getTime() - (+per - 1) * 864e5).toISOString().slice(0, 10) : '';
        vis = N.filter(x => (!ca || x.categoria === ca) && (!am || x.ambito === am) && (!sv || x.severidad === sv) && (!desde || x.fecha >= desde) &&
          (!q || [x.titulo, x.resumen, x.entidad, x.pais, x.tipo, x.fuente].join(' ').toLowerCase().includes(q)));
        $('f-count').textContent = `${vis.length} de ${N.length} hechos`;
        const act = [[ca, CAT[ca], 'f-cat'], [am, am === 'nacional' ? 'Argentina' : 'Internacional', 'f-amb'], [sv, 'Severidad ' + sv, 'f-sev'],
          [per, `Últimos ${per} días`, 'f-per'], [q, `“${q}”`, 'f-q']].filter(a => a[0]);
        $('f-chips').innerHTML = act.map(a => `<button type="button" class="mx-chipbtn on" data-limpiar="${a[2]}">${esc(a[1])} ✕</button>`).join('')
          + (act.length > 1 ? '<button type="button" class="mx-chipbtn" data-limpiar="*">Limpiar filtros</button>' : '');
        pag = 1; pintar();
      };
      $('f-chips').addEventListener('click', ev => {
        const b = ev.target.closest('[data-limpiar]'); if (!b) return;
        (b.dataset.limpiar === '*' ? ['f-q', 'f-cat', 'f-amb', 'f-sev', 'f-per'] : [b.dataset.limpiar]).forEach(id => { $(id).value = ''; });
        filtrar();
      });
      ['f-q', 'f-cat', 'f-amb', 'f-sev', 'f-per'].forEach(id => $(id).addEventListener('input', filtrar));
      conectarFichas($('mx-lista'), N);
      filtrar();
      const Cn = await datos.candidatos().catch(() => []);
      $('mx-exp-xls').addEventListener('click', () => exportarNoticias(N, { candidatos: Cn, vista: () => vis, vistaEtiqueta: 'Lo que estoy viendo', vistaDetalle: 'Con los filtros y la búsqueda aplicados' }));
    },

    async revisar() {
      const C = await datos.candidatos();
      if (usaSupabase && !esAnalista()) $('mx-page').querySelector('.mx-wrap').insertAdjacentHTML('afterbegin',
        `<div class="mx-nota">${ico('info')}<div><b>Solo lectura.</b> Tu usuario tiene rol de lector: podés ver y exportar los candidatos, pero solo los analistas pueden clasificarlos.</div></div>`);
      if (!usaSupabase) $('mx-page').querySelector('.mx-wrap').insertAdjacentHTML('afterbegin',
        `<div class="mx-nota">${ico('info')}<div><b>Modo local.</b> Las decisiones se guardan en este navegador. Para compartirlas, exportalas desde el Registro de eventos o conectá la base de datos en <span class="mx-mono">config.js</span>.</div></div>`);
      let estado = 'pendiente', selId = null;
      const quien = () => analista();
      const actualizarCab = () => {
        const p = C.filter(c => c.decision === 'pendiente'), ev = p.filter(c => c.naturaleza === 'Evento').length;
        $('rv-quien').textContent = quien() ? `Revisión de candidatos · ${quien()}` : 'Revisión de candidatos';
        $('rv-cola').textContent = `${plural(p.length, 'hecho')} (${ev} ev. · ${p.length - ev} not.)`;
        $('rv-pend-b').textContent = `${p.length} PENDIENTES`;
        $('rv-tmr').textContent = tiempoMedio(C);
        const hoy = hoyISO(), mis = C.filter(c => c.decision !== 'pendiente' && c.revisadoEn && fechaART(c.revisadoEn) === hoy && (!quien() || c.revisadoPor === quien()));
        $('rv-hoy-n').textContent = `${mis.filter(c => c.decision === 'aprobado').length} aprobados`;
        $('rv-hoy').innerHTML = mis.map(c => `<div><span>${esc(c.titulo)}</span><span class="${c.decision === 'aprobado' ? 'ap' : 're'}">${c.decision.toUpperCase()}</span></div>`).join('')
          || '<div class="mx-small" style="background:none;padding:0;font-family:var(--font)">Todavía no registraste decisiones hoy.</div>';
        if ($('mx-pend')) { $('mx-pend').textContent = p.length; $('mx-pend').hidden = !p.length; }
      };
      const listaCola = () => {
        const q = low($('rv-q').value);
        return C.filter(c => (!estado || c.decision === estado) && (!q || [c.titulo, c.entidad, c.id, c.subtipo].join(' ').toLowerCase().includes(q)));
      };
      const pintarCola = () => {
        const L = listaCola();
        if (selId && !L.some(c => c.id === selId)) selId = null;
        if (!selId && L.length) selId = L[0].id;
        $('rv-cola-l').innerHTML = L.map(c => `<button type="button" class="mx-qitem ${c.naturaleza === 'Evento' ? 'ev' : ''} ${c.id === selId ? 'sel' : ''}" data-id="${esc(c.id)}">
            <div class="h"><span class="mx-mono" style="color:${c.id === selId ? 'var(--primary)' : 'var(--ink-2)'};font-weight:700">${esc(fCorta(c.fecha))} · ${esc(c.naturaleza || '—').toUpperCase()}</span>
              <span class="mx-badge ${c.impacto === 'Alta' ? 'alta' : c.impacto === 'Media' ? 'media' : 'neutral'}">${c.impacto !== '—' ? 'IMPACTO ' + esc(c.impacto).toUpperCase() : esc(c.subtipo || 'CONTEXTO').toUpperCase()}</span></div>
            <div class="t">${esc(c.entidad ? c.entidad + ' · ' : '')}${esc(c.titulo)}</div>
            <div class="f"><span>${esc(c.tipoEvento !== '—' ? c.tipoEvento : c.subtipo)}</span><span style="color:${c.decision === 'pendiente' ? 'var(--mute)' : c.decision === 'aprobado' ? 'var(--ok)' : 'var(--alta)'}">${esc(c.decision[0].toUpperCase() + c.decision.slice(1))}</span></div>
          </button>`).join('') || '<div class="mx-empty">No hay candidatos en esta vista.</div>';
        pintarDetalle();
      };
      const opts = (lista, v) => {
        const l = lista.slice(); if (v && v !== '—' && !l.includes(v)) l.unshift(v);
        return ['<option value="—">Sin clasificar</option>'].concat(l.map(o => `<option${o === v ? ' selected' : ''}>${esc(o)}</option>`)).join('');
      };
      const pintarDetalle = () => {
        const c = C.find(x => x.id === selId);
        if (!c) { $('rv-detalle').innerHTML = '<div class="mx-card"><div class="mx-empty">Elegí un candidato de la cola para revisarlo.</div></div>'; return; }
        const rev = c.decision !== 'pendiente';
        const L = listaCola(), pos = L.findIndex(x => x.id === c.id);
        $('rv-detalle').innerHTML = `
          <section class="mx-card mx-detail" style="box-shadow:var(--sh-2)">
            <div class="mx-detail-h">
              <div class="ch"><span class="mx-badge dark mx-mono">ID: ${esc(c.id)}</span>
                <span class="mx-badge ${c.naturaleza === 'Evento' ? 'solid-alta' : 'neutral'}">${esc((c.naturaleza || '—').toUpperCase())}</span>
                ${c.impacto !== '—' ? `<span class="mx-badge ${c.impacto === 'Alta' ? 'alta' : c.impacto === 'Media' ? 'media' : 'baja'}">IMPACTO ${esc(c.impacto.toUpperCase())}</span>` : ''}
                ${rev ? `<span class="mx-badge ${c.decision === 'aprobado' ? 'ok' : 'alta'}">${esc(c.decision.toUpperCase())}</span>` : ''}</div>
              <div class="mx-qnav">
                <button type="button" class="mx-btn sm" data-nav="-1" ${pos <= 0 ? 'disabled' : ''} aria-label="Candidato anterior">‹ Anterior</button>
                <span class="mx-mono">${pos + 1} de ${L.length}</span>
                <button type="button" class="mx-btn sm" data-nav="1" ${pos >= L.length - 1 ? 'disabled' : ''} aria-label="Candidato siguiente">Siguiente ›</button>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin:-4px 0 12px">
              <span class="mx-mono" style="color:var(--mute)">Fuente: ${esc(c.fuente || '—')} · ${/^manual/i.test(c.sugeridoPor) ? `Cargado por ${esc(c.sugeridoPor.replace(/^manual\s*·\s*/i, '') || 'analista')}` : 'Sugerido'} ${esc(fHora(c.agregado))}</span>
              ${c.url ? `<a class="mx-btn sm" href="${esc(c.url)}" target="_blank" rel="noopener">Abrir nota original ${ico('ext', 'width:14px;height:14px')}</a>` : ''}</div>
            <h2 class="mx-h1">${esc(c.titulo)}</h2>
            <p class="mx-body" style="margin-top:8px">Entidad: <b style="color:var(--ink)">${esc(c.entidad || '—')}</b>${c.subtipo ? ` · <span class="mx-mono">${esc(c.subtipo)}</span>` : ''}</p>
            <p class="mx-body" style="margin-top:10px">${esc(c.resumen)}</p>
            <div class="mx-g3" style="margin-top:14px">
              <div class="mx-tile"><div class="mx-eyebrow" style="color:var(--mute)">Fecha del hecho</div><div class="mx-stat">${esc(fLarga(c.fecha))}</div></div>
              <div class="mx-tile"><div class="mx-eyebrow" style="color:var(--mute)">Canal</div><div class="mx-h3">${esc(c.canal || '—')}</div></div>
              <div class="mx-tile"><div class="mx-eyebrow" style="color:var(--mute)">Normativa de referencia</div><div class="mx-mono" style="font-size:13px;margin-top:4px">${esc(c.normativa || '—')}</div></div>
            </div>

          </section>
          <section class="mx-card" style="box-shadow:var(--sh-2)">
            <div class="mx-card-h" style="margin-bottom:18px">
              <div class="tit">${ico('scale', 'width:22px;height:22px')}<div><h3 class="mx-h2">Clasificación del evento</h3>
                <div class="mx-eyebrow" style="color:var(--mute)">Com. "A" 4793 · ${/^manual/i.test(c.sugeridoPor) ? 'cargada por un analista' : 'sugerida por IA'}, confirmala o corregila</div></div></div>
              <span class="mx-badge info mx-mono">Revisión del analista</span>
            </div>
            <div class="mx-form">
              <div><label class="mx-label" for="c-tipo">Tipo de evento <em>*</em></label><select class="mx-select" id="c-tipo">${opts(TIPOS, c.tipoEvento)}</select></div>
              <div><label class="mx-label" for="c-orig">Origen</label><select class="mx-select" id="c-orig">${opts(['Externo', 'Interno'], c.origen)}</select></div>
              <div><label class="mx-label" for="c-fact">Factor</label><select class="mx-select" id="c-fact">${opts(['Personas', 'Procesos', 'Sistemas', 'Eventos externos'], c.factor)}</select></div>
              <div><label class="mx-label" for="c-canal">Canal</label><input class="mx-input" id="c-canal" list="c-canales" value="${esc(c.canal)}">
                <datalist id="c-canales">${['Homebanking', 'Billetera virtual', 'Tarjeta', 'Cajero', 'Transferencias', 'Pagos con QR', 'App móvil', 'Telefonía (SIM)'].map(o => `<option value="${o}">`).join('')}</datalist></div>
              <div><label class="mx-label" for="c-imp">Impacto</label><select class="mx-select" id="c-imp">${opts(['Alta', 'Media', 'Baja'], c.impacto)}</select></div>
              <div><label class="mx-label" for="c-norm">Normativa aplicable</label><input class="mx-input mx-mono" id="c-norm" value="${esc(c.normativa)}" placeholder="A 4793 · A 8471"></div>
              <div><label class="mx-label" for="c-val">Valorizado (monto del hecho)</label><input class="mx-input mx-mono" id="c-val" inputmode="decimal" value="${c.valorizado === '' ? '' : esc(String(c.valorizado).replace('.', ','))}" placeholder="Ej.: 920000">
                <div class="mx-small" style="margin-top:4px">${c.montoTexto ? `Detectado en el texto: <b>${esc(c.montoTexto)}</b>${c.valorizadoManual ? ' · valor editado por analista' : ''}` : 'No se detectó un monto en el texto.'}</div></div>
              <div><label class="mx-label" for="c-mon">Moneda</label><select class="mx-select" id="c-mon">${['ARS', 'USD', 'EUR', 'Otra'].map(o => `<option${(c.moneda || 'ARS') === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
              <div><label class="mx-label" for="c-rnd">Riesgo no declarado</label><select class="mx-select" id="c-rnd">${['', 'Sí', 'No'].map(o => `<option value="${o}"${(c.rnd || '') === o ? ' selected' : ''}>${o || '— Sin definir'}</option>`).join('')}</select></div>
            </div>
            <div style="margin-top:18px">
              <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px"><label class="mx-label" for="c-com" style="margin:0">Fundamento del analista</label>
                <span class="mx-mono" style="color:var(--mute)">Obligatorio para rechazar${quien() ? ` · ${esc(quien())}` : ''}</span></div>
              <textarea class="mx-textarea" id="c-com" placeholder="Qué se verificó en la fuente y por qué se aprueba o se rechaza…">${esc(c.comentario)}</textarea>
            </div>
            <div class="mx-checks" style="margin-top:16px">
              <label><input type="checkbox" class="c-chk">Consulté la fuente original</label>
              <label><input type="checkbox" class="c-chk">Confirmé la fecha y la entidad</label>
              <label><input type="checkbox" class="c-chk">Revisé la clasificación sugerida</label>
            </div>
            ${rev ? `<p class="mx-small" style="margin-top:12px">Revisado por ${esc(c.revisadoPor || '—')} el ${esc(fHora(c.revisadoEn))}.</p>` : ''}
            <div class="mx-acciones" style="margin-top:18px">
              <div class="izq">
                <button type="button" class="mx-btn danger" data-dec="rechazado">${ico('x', 'width:16px;height:16px')}Rechazar hecho</button>
                <button type="button" class="mx-btn soft" data-dec="${rev ? 'pendiente' : 'guardar'}">${ico('hour', 'width:16px;height:16px')}${rev ? 'Volver a pendiente' : 'Guardar sin decidir'}</button>
              </div>
              <button type="button" class="mx-btn primary" data-dec="aprobado" id="c-aprobar">${ico('check', 'width:16px;height:16px')}Aprobar e incorporar al registro</button>
            </div>
            <p class="mx-msg" id="c-msg" style="margin-top:10px" aria-live="polite">Para aprobar, marcá las tres verificaciones.</p>
          </section>`;
        const chks = [...document.querySelectorAll('.c-chk')];
        const habil = () => { const ok = chks.every(x => x.checked); $('c-aprobar').disabled = !ok; if (ok) $('c-msg').textContent = ''; };
        chks.forEach(x => x.addEventListener('change', habil)); habil();
        if (!esAnalista()) { document.querySelectorAll('#rv-detalle [data-dec], #rv-detalle .mx-form .mx-input, #rv-detalle .mx-form .mx-select, #rv-detalle textarea, .c-chk').forEach(x => { x.disabled = true; });
          $('c-msg').textContent = 'Solo lectura: tu usuario no tiene rol de analista.'; }
      };
      $('rv-cola-l').addEventListener('click', ev => {
        const b = ev.target.closest('.mx-qitem'); if (!b) return; irA(b.dataset.id);
      });
      $('rv-q').addEventListener('input', () => { selId = null; pintarCola(); });
      $('rv-estado').addEventListener('click', ev => {
        const b = ev.target.closest('[data-v]'); if (!b) return; estado = b.dataset.v; selId = null;
        $('rv-estado').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); pintarCola();
      });
      const irA = id => {
        selId = id; pintarCola();
        const it = $('rv-cola-l').querySelector('.mx-qitem.sel'); if (it) it.scrollIntoView({ block: 'nearest' });
        const det = $('rv-detalle'); if (det.getBoundingClientRect().top < 0 || innerWidth < 1024) det.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      $('rv-detalle').addEventListener('click', ev => {
        const n = ev.target.closest('[data-nav]'); if (!n || n.disabled) return;
        const L = listaCola(), i = L.findIndex(x => x.id === selId), nx = L[i + (+n.dataset.nav)];
        if (nx) irA(nx.id);
      });
      $('rv-detalle').addEventListener('click', async ev => {
        const b = ev.target.closest('[data-dec]'); if (!b || b.disabled) return;
        const c = C.find(x => x.id === selId); if (!c) return;
        const dec = b.dataset.dec, msg = $('c-msg'), com = $('c-com').value.trim();
        if (dec === 'rechazado' && com.length < 10) { msg.className = 'mx-msg err'; msg.textContent = 'Para rechazar, escribí el fundamento (al menos 10 caracteres).'; $('c-com').focus(); return; }
        let firma = quien();
        if (dec === 'aprobado' || dec === 'rechazado') { if (!firma) firma = pedirAnalista(); if (!firma) { msg.className = 'mx-msg err'; msg.textContent = 'Definí tu nombre de analista para firmar la decisión.'; return; } }
        const cambios = usaSupabase && !c.iaFija ? { sugerenciaIA: c.ia } : {};
        const rnd = $('c-rnd').value;
        Object.assign(cambios, { tipoEvento: $('c-tipo').value, origen: $('c-orig').value, factor: $('c-fact').value, canal: $('c-canal').value.trim(),
          impacto: $('c-imp').value, normativa: $('c-norm').value.trim(), comentario: armarCom(rnd, com) });
        const vtxt = $('c-val').value.trim();
        if (vtxt && !isFinite(aNumero(vtxt))) { msg.className = 'mx-msg err'; msg.textContent = 'El valorizado tiene que ser un número (por ejemplo 920000 o 24,5).'; $('c-val').focus(); return; }
        Object.assign(cambios, { valorizado: vtxt ? aNumero(vtxt) : '', moneda: $('c-mon').value });
        if (dec === 'aprobado' || dec === 'rechazado') Object.assign(cambios, { decision: dec, revisadoPor: firma, revisadoEn: new Date().toISOString() });
        if (dec === 'pendiente') Object.assign(cambios, { decision: 'pendiente', revisadoPor: '', revisadoEn: '' });
        document.querySelectorAll('#rv-detalle [data-dec]').forEach(x => { x.disabled = true; });
        msg.className = 'mx-msg'; msg.textContent = 'Guardando…';
        try {
          const firmaBD = await datos.guardarCandidato(c.id, cambios);
          if (firmaBD) Object.assign(cambios, firmaBD);
          Object.assign(c, cambios, { valorizadoManual: cambios.valorizado !== '', comentario: com, rnd }); if (cambios.sugerenciaIA) c.iaFija = true; delete c.sugerenciaIA;
          actualizarCab();
          if (dec === 'guardar') { pintarDetalle(); $('c-msg').className = 'mx-msg ok'; $('c-msg').textContent = 'Cambios guardados.'; }
          else { selId = null; pintarCola(); const det = $('rv-detalle'); if (det.getBoundingClientRect().top < 0) det.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        } catch (err) {
          console.error('[Monitor] No se pudo guardar', err);
          msg.className = 'mx-msg err'; msg.textContent = 'No se pudo guardar. Revisá la conexión con la base de datos (detalle en la consola, F12).';
          document.querySelectorAll('#rv-detalle [data-dec]').forEach(x => { x.disabled = false; });
        }
      });
      // ---------- Carga manual de un evento ----------
      const slug = t => sinTilde(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-') || 'evento';
      const normUrl = u => { u = String(u || '').trim(); return !u ? '' : /^https?:\/\//i.test(u) ? u : 'https://' + u.replace(/^\/+/, ''); };
      const urlValida = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && x.hostname.includes('.'); } catch (e) { return false; } };
      function abrirCarga() {
        cerrarFicha();
        const m = document.createElement('div');
        m.className = 'mx mx-modal'; m.id = 'mx-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'mc-tit');
        const sel = (id, lista, v) => `<select class="mx-select" id="${id}">${opts(lista, v)}</select>`;
        m.innerHTML = `<div class="mx-dialog">
          <div class="mx-dialog-h"><div style="display:flex;gap:8px;align-items:center">${ico('file', 'color:var(--primary)')}<b class="mx-h3" id="mc-tit">Cargar evento manualmente</b></div>
            <button type="button" class="mx-x" data-cerrar aria-label="Cerrar">${ico('x')}</button></div>
          <form class="mx-dialog-b" id="mc-form" novalidate>
            <p class="mx-small" style="margin:0">El hecho entra a la cola como <b>pendiente</b>, firmado con tu nombre. Después se revisa y aprueba como cualquier candidato.</p>
            <div class="mx-form">
              <div><label class="mx-label" for="mc-fecha">Fecha del hecho <em>*</em></label><input class="mx-input" id="mc-fecha" type="date" max="${hoyISO()}" value="${hoyISO()}" required></div>
              <div><label class="mx-label" for="mc-nat">Naturaleza</label><select class="mx-select" id="mc-nat"><option>Evento</option><option>Noticia</option></select></div>
              <div style="grid-column:1/-1"><label class="mx-label" for="mc-titulo">Título <em>*</em></label><input class="mx-input" id="mc-titulo" maxlength="240" required placeholder="Qué pasó, en una línea"></div>
              <div style="grid-column:1/-1"><label class="mx-label" for="mc-res">Resumen</label><textarea class="mx-textarea" id="mc-res" placeholder="Hechos verificados: quién, qué, cuándo, montos…"></textarea></div>
              <div><label class="mx-label" for="mc-ent">Entidad</label><input class="mx-input" id="mc-ent" placeholder="Banco, billetera, organismo…"></div>
              <div><label class="mx-label" for="mc-sub">Subtipo</label><input class="mx-input" id="mc-sub" list="mc-subs" placeholder="Fraude consumado a cliente">
                <datalist id="mc-subs">${['Fraude consumado a cliente', 'Pérdida por fallo judicial', 'Sanción administrativa confirmada', 'Caída de servicio', 'Filtración de datos', 'Alerta del regulador', 'Alerta de modalidad', 'Normativa'].map(o => `<option value="${o}">`).join('')}</datalist></div>
              <div><label class="mx-label" for="mc-fuente">Fuente</label><input class="mx-input" id="mc-fuente" list="mc-fuentes" placeholder="Nombre del medio o de la fuente">
                <datalist id="mc-fuentes">${FU.map(f => `<option value="${esc(f.nombre || f.url)}">`).join('')}</datalist></div>
              <div><label class="mx-label" for="mc-url">Dirección (URL)</label><input class="mx-input" id="mc-url" type="text" inputmode="url" placeholder="www.ejemplo.com.ar/nota"></div>
              <div><label class="mx-label" for="mc-tipo">Tipo de evento</label>${sel('mc-tipo', TIPOS, '—')}</div>
              <div><label class="mx-label" for="mc-orig">Origen</label>${sel('mc-orig', ['Externo', 'Interno'], '—')}</div>
              <div><label class="mx-label" for="mc-fact">Factor</label>${sel('mc-fact', ['Personas', 'Procesos', 'Sistemas', 'Eventos externos'], '—')}</div>
              <div><label class="mx-label" for="mc-canal">Canal</label><input class="mx-input" id="mc-canal" list="c-canales-m">
                <datalist id="c-canales-m">${['Homebanking', 'Billetera virtual', 'Tarjeta', 'Cajero', 'Transferencias', 'Pagos con QR', 'App móvil', 'Telefonía (SIM)'].map(o => `<option value="${o}">`).join('')}</datalist></div>
              <div><label class="mx-label" for="mc-imp">Impacto</label>${sel('mc-imp', ['Alta', 'Media', 'Baja'], '—')}</div>
              <div><label class="mx-label" for="mc-norm">Normativa</label><input class="mx-input mx-mono" id="mc-norm" placeholder="A 4793 · A 8471"></div>
              <div><label class="mx-label" for="mc-val">Valorizado (monto)</label><input class="mx-input mx-mono" id="mc-val" inputmode="decimal" placeholder="Ej.: 1500000"></div>
              <div><label class="mx-label" for="mc-mon">Moneda</label><select class="mx-select" id="mc-mon">${['ARS', 'USD', 'EUR', 'Otra'].map(o => `<option>${o}</option>`).join('')}</select></div>
            </div>
            <p class="mx-msg" id="mc-msg" aria-live="polite"></p>
            <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--div);padding-top:14px">
              <button type="button" class="mx-btn" data-cerrar>Cancelar</button>
              <button type="submit" class="mx-btn primary" id="mc-ok">${ico('check', 'width:16px;height:16px')}Cargar a la cola</button>
            </div>
          </form></div>`;
        m.addEventListener('click', ev => { if (ev.target === m || ev.target.closest('[data-cerrar]')) cerrarFicha(); });
        document.body.appendChild(m); document.body.style.overflow = 'hidden';
        $('mc-titulo').focus();
        $('mc-form').addEventListener('submit', async ev => {
          ev.preventDefault();
          const msg = $('mc-msg'), err = (t, el) => { msg.className = 'mx-msg err'; msg.textContent = t; if (el) $(el).focus(); };
          const fecha = $('mc-fecha').value, titulo = $('mc-titulo').value.trim(), url = normUrl($('mc-url').value), vtxt = $('mc-val').value.trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return err('Indicá la fecha del hecho.', 'mc-fecha');
          if (fecha > hoyISO()) return err('La fecha no puede ser posterior a hoy.', 'mc-fecha');
          if (titulo.length < 10) return err('Escribí un título de al menos 10 caracteres.', 'mc-titulo');
          if (url && !urlValida(url)) return err('La dirección no parece válida (por ejemplo: www.ejemplo.com.ar/nota).', 'mc-url');
          if (vtxt && !isFinite(aNumero(vtxt))) return err('El valorizado tiene que ser un número (por ejemplo 1500000 o 24,5).', 'mc-val');
          const id = `manual-${fecha}-${slug(titulo)}-${Math.random().toString(36).slice(2, 6)}`;
          const nat = $('mc-nat').value;
          const fila = { id, fecha, titulo, resumen: $('mc-res').value.trim(), entidad: $('mc-ent').value.trim(), fuente: $('mc-fuente').value.trim() || (url ? new URL(url).hostname.replace(/^www\./, '') : ''),
            url, naturaleza: nat, subtipo: $('mc-sub').value.trim(), tipoEvento: $('mc-tipo').value, origen: $('mc-orig').value, factor: $('mc-fact').value,
            canal: $('mc-canal').value.trim(), impacto: nat === 'Evento' ? $('mc-imp').value : '—', normativa: $('mc-norm').value.trim(),
            valorizado: vtxt ? aNumero(vtxt) : null, moneda: vtxt ? $('mc-mon').value : '' };
          $('mc-ok').disabled = true; msg.className = 'mx-msg'; msg.textContent = 'Guardando…';
          try {
            const r = await datos.crearCandidato(fila);
            const c = normC(r); c.ia = iaDe(r); c.iaFija = true; c.montoTexto = '';
            C.unshift(c); cerrarFicha();
            estado = 'pendiente'; $('rv-estado').querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.v === 'pendiente'));
            $('rv-q').value = ''; actualizarCab(); irA(c.id);
          } catch (e) {
            console.error('[Monitor] No se pudo cargar el evento', e);
            $('mc-ok').disabled = false;
            err(/permiso|42501|row-level/i.test(e.message) ? 'No tenés permiso para cargar eventos (se requiere rol de analista).' : 'No se pudo guardar. Revisá la conexión (detalle en la consola, F12).');
          }
        });
      }
      if (!esAnalista()) { $('rv-nuevo').disabled = true; $('rv-nuevo').title = 'Solo los analistas pueden cargar eventos'; }
      $('rv-nuevo').addEventListener('click', abrirCarga);

      // ---------- Fuentes a monitorear ----------
      let FU = [];
      const pintarFuentes = () => {
        $('rv-fu-n').textContent = FU.length;
        $('rv-fu-l').innerHTML = FU.map(f => `<div><span title="${esc(f.url)}"><a href="${esc(normUrl(f.url))}" target="_blank" rel="noopener" style="color:inherit">${esc(f.nombre || f.url.replace(/^https?:\/\//i, ''))}</a></span>
            ${esAnalista() ? `<button type="button" class="mx-x" data-fu="${esc(f.id)}" aria-label="Quitar ${esc(f.nombre || f.url)}" style="width:22px;height:22px">${ico('x', 'width:14px;height:14px')}</button>` : ''}</div>`).join('')
          || '<div class="mx-small" style="background:none;padding:0;font-family:var(--font)">Todavía no hay fuentes agregadas.</div>';
      };
      if (!esAnalista()) $('rv-fu-form').hidden = true;
      datos.fuentes().then(l => { FU = l || []; pintarFuentes(); }).catch(e => { console.warn('[Monitor] fuentes', e); $('rv-fu-l').innerHTML = '<div class="mx-small" style="background:none;padding:0">No se pudieron cargar las fuentes.</div>'; });
      $('rv-fu-form').addEventListener('submit', async ev => {
        ev.preventDefault();
        const msg = $('rv-fu-msg'), url = normUrl($('rv-fu-url').value), nombre = $('rv-fu-nom').value.trim();
        if (!urlValida(url)) { msg.className = 'mx-msg err'; msg.textContent = 'Escribí una dirección válida, por ejemplo www.ejemplo.com.ar'; $('rv-fu-url').focus(); return; }
        const corta = u => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/+$/, '').toLowerCase();
        if (FU.some(f => corta(f.url) === corta(url))) { msg.className = 'mx-msg err'; msg.textContent = 'Esa fuente ya está en la lista.'; return; }
        $('rv-fu-ok').disabled = true; msg.className = 'mx-msg'; msg.textContent = 'Guardando…';
        try {
          const f = await datos.agregarFuente(url, nombre); FU.unshift(f); pintarFuentes();
          $('rv-fu-url').value = ''; $('rv-fu-nom').value = ''; msg.className = 'mx-msg ok'; msg.textContent = 'Fuente agregada.';
        } catch (e) { console.error('[Monitor] fuente', e); msg.className = 'mx-msg err'; msg.textContent = /23505|duplicate/i.test(e.message) ? 'Esa fuente ya está en la lista.' : 'No se pudo guardar la fuente.'; }
        $('rv-fu-ok').disabled = false;
      });
      $('rv-fu-l').addEventListener('click', async ev => {
        const b = ev.target.closest('[data-fu]'); if (!b) return;
        const f = FU.find(x => String(x.id) === b.dataset.fu); if (!f || !window.confirm(`¿Quitar la fuente ${f.nombre || f.url}?`)) return;
        try { await datos.borrarFuente(f.id); FU = FU.filter(x => x !== f); pintarFuentes(); }
        catch (e) { console.error('[Monitor] fuente', e); $('rv-fu-msg').className = 'mx-msg err'; $('rv-fu-msg').textContent = 'No se pudo quitar la fuente.'; }
      });

      $('rv-exp').addEventListener('click', () => {
        const clave = 'mx-ultexp-candidatos', ult = leerLS(clave);
        const marca = c => c.decision === 'pendiente' ? c.agregado : (c.revisadoEn || c.agregado);
        const pre = () => C.filter(c => c.decision === 'pendiente'), clas = () => C.filter(c => c.decision !== 'pendiente');
        const nuevas = () => C.filter(c => !ult || (marca(c) && new Date(marca(c)) > new Date(ult)));
        const alcances = [
          { id: 'pre', etiqueta: 'Precalificados por la IA', n: pre().length, detalle: 'Pendientes de revisión, con la clasificación sugerida' },
          { id: 'clas', etiqueta: 'Clasificados por analistas', n: clas().length, detalle: 'Aprobados y rechazados, con la sugerencia y la clasificación final' },
          { id: 'todas', etiqueta: 'Todos los candidatos', n: C.length, detalle: 'Precalificados y clasificados' },
          { id: 'nuevas', etiqueta: 'Solo los actualizados', n: nuevas().length, detalle: ult ? 'Sugeridos o revisados después de la última exportación' : 'Todavía no exportaste: incluye todos' },
          { id: 'desde', etiqueta: 'Sugeridos o revisados desde una fecha', detalle: '' },
          { id: 'vista', etiqueta: 'Lo que estoy viendo en la cola', n: listaCola().length, detalle: 'Con el estado y el filtro de la cola' }];
        abrirExportar({ titulo: 'Exportar candidatos', clave, porDefecto: 'clas', alcances,
          contarDesde: d => C.filter(c => (marca(c) || '').slice(0, 10) >= d).length,
          obtener: (a, d) => a === 'pre' ? pre() : a === 'clas' ? clas() : a === 'todas' ? C : a === 'nuevas' ? nuevas() : a === 'vista' ? listaCola() : C.filter(c => (marca(c) || '').slice(0, 10) >= d),
          exportar: (L, fmt, conVal, alc) => {
            const cols = [{ t: 'Código', w: 34 }, { t: 'Fecha del hecho', w: 12, tipo: 'd' }, { t: 'Sugerido', w: 17 }, { t: 'Estado', w: 22 }, { t: 'Título', w: 60 }, { t: 'Resumen', w: 90 },
              { t: 'Entidad', w: 30 }, { t: 'Fuente', w: 20 }, { t: 'URL', w: 40 }, { t: 'Naturaleza', w: 11 }, { t: 'Subtipo', w: 26 },
              { t: 'IA · Tipo de evento', w: 34 }, { t: 'IA · Origen', w: 10 }, { t: 'IA · Factor', w: 16 }, { t: 'IA · Canal', w: 18 }, { t: 'IA · Impacto', w: 10 }, { t: 'IA · Normativa', w: 22 },
              { t: 'Final · Tipo de evento', w: 34 }, { t: 'Final · Origen', w: 10 }, { t: 'Final · Factor', w: 16 }, { t: 'Final · Canal', w: 18 }, { t: 'Final · Impacto', w: 10 }, { t: 'Final · Normativa', w: 22 },
              { t: 'Clasificación corregida por analista', w: 14 }, { t: 'Riesgo no declarado', w: 12 }, { t: 'Revisado por', w: 20 }, { t: 'Revisado en', w: 17 }, { t: 'Fundamento', w: 50 }];
            if (conVal) cols.push({ t: 'Monto mencionado', w: 22 }, { t: 'Moneda', w: 8 }, { t: 'Valorizado', w: 16, tipo: 'm' }, { t: 'Valorizado ARS', w: 16, tipo: 'm' }, { t: 'Origen de la valorización', w: 18 });
            const est = c => c.decision === 'pendiente' ? 'Precalificado por IA' : c.decision === 'aprobado' ? 'Clasificado · aprobado' : 'Clasificado · rechazado';
            const filas = L.map(c => {
              const rev = c.decision !== 'pendiente', ia = c.ia || {};
              const f = [c.id, aFecha(c.fecha), fHora(c.agregado), est(c), c.titulo, c.resumen, c.entidad, c.fuente, c.url, c.naturaleza, c.subtipo]
                .concat(CAMPOS_CLAS.map(k => ia[k] || ''))
                .concat(CAMPOS_CLAS.map(k => rev ? (c[k] || '') : ''))
                .concat([rev ? (modificado(c) ? 'Sí' : 'No') : '', c.rnd || '', c.revisadoPor, fHora(c.revisadoEn), c.comentario]);
              if (conVal) f.push(c.montoTexto || '', c.moneda || '', c.valorizado, aARS(c.valorizado, c.moneda), c.valorizadoManual ? 'Analista' : (c.montoTexto ? 'Detectado en el texto' : ''));
              return f;
            });
            const n = { pre: 'precalificados', clas: 'clasificados', todas: 'todos', nuevas: 'actualizados', desde: 'desde', vista: 'vista' }[alc];
            return exportarTabla(`candidatos-${n}`, 'Candidatos', cols, filas, fmt, [['Generado', fHora(new Date().toISOString())],
              ['Alcance', alcances.find(a => a.id === alc).etiqueta], ['Candidatos exportados', L.length],
              ['Precalificados por IA', L.filter(c => c.decision === 'pendiente').length], ['Clasificados por analistas', L.filter(c => c.decision !== 'pendiente').length],
              ['Clasificación corregida por analista', L.filter(c => c.decision !== 'pendiente' && modificado(c)).length],
              ['Columnas', 'IA = clasificación sugerida; Final = clasificación confirmada o corregida por el analista (solo en los clasificados).']]);
          } });
      });
      actualizarCab(); pintarCola();
    },

    async registro() {
      const C = await datos.candidatos();
      const A = C.filter(c => c.decision === 'aprobado');
      const anios = [...new Set(A.map(c => c.fecha.slice(0, 4)).filter(Boolean))].sort().reverse();
      $('rg-anio').innerHTML = '<option value="">Todos los años</option>' + anios.map(a => `<option value="${a}">Año ${a}</option>`).join('');
      if (anios.includes(hoyISO().slice(0, 4))) $('rg-anio').value = hoyISO().slice(0, 4);
      const n = { ap: A.length, re: C.filter(c => c.decision === 'rechazado').length, pe: C.filter(c => c.decision === 'pendiente').length };
      $('rg-c-ap').textContent = n.ap; $('rg-c-re').textContent = n.re; $('rg-c-pe').textContent = n.pe;
      $('rg-prog-t').textContent = C.length ? `${Math.round((n.ap + n.re) / C.length * 100)}%` : '—';
      $('rg-prog').style.width = C.length ? `${(n.ap + n.re) / C.length * 100}%` : '0';
      $('rg-tot-b').textContent = plural(C.length, 'candidato');
      let tipoSel = '', vis = [], pag = 1;
      const pintarTabla = () => {
        const ini = (pag - 1) * 15;
        $('rg-tabla').innerHTML = vis.slice(ini, ini + 15).map(c => {
          const iT = TIPOS.indexOf(c.tipoEvento);
          return `<tr><td class="nw mx-mono" style="color:var(--ink-2)">${esc(fLarga(c.fecha))}</td>
            <td class="tit">${esc(c.titulo)}${c.url ? `<div><a class="mx-small" href="${esc(c.url)}" target="_blank" rel="noopener">Ver nota ↗</a></div>` : ''}</td>
            <td style="min-width:130px">${esc(c.entidad)}</td>
            <td class="nw"><span class="mx-badge ${iT === 1 ? 'alta' : iT === 5 ? 'info' : 'neutral'}">${iT >= 0 ? `Tipo 0${iT + 1} · ${esc(TIPO_CORTO[iT])}` : esc(c.tipoEvento)}</span></td>
            <td class="nw" style="color:var(--ink-2)">${esc(c.origen)} / ${esc(c.factor)}</td>
            <td class="nw">${c.canal ? `<span class="mx-chip-mono">${esc(c.canal)}</span>` : '—'}</td>
            <td class="nw">${c.impacto !== '—' ? `<span class="mx-badge ${c.impacto === 'Alta' ? 'alta' : c.impacto === 'Media' ? 'media' : 'baja'}">${esc(c.impacto)}</span>` : '—'}</td>
            <td class="nw mx-mono" style="text-align:right">${esc(fmtMonto(c.valorizado, c.moneda))}</td>
            <td class="nw"><div style="display:flex;gap:6px;align-items:flex-start">${ico('check', 'width:15px;height:15px;color:var(--ok);margin-top:2px')}
              <div><div style="font-weight:600">${esc(c.revisadoPor || '—')}</div><div class="mx-mono" style="color:var(--mute)">${esc(fHora(c.revisadoEn))}</div></div></div></td></tr>`;
        }).join('') || '<tr><td colspan="9" class="mx-empty">Todavía no hay eventos aprobados con estos filtros.</td></tr>';
        paginar($('rg-pag'), vis.length, 15, pag, x => { pag = x; pintarTabla(); });
      };
      const filtrar = () => {
        const an = $('rg-anio').value, q = low($('rg-q').value);
        const base = A.filter(c => !an || c.fecha.startsWith(an));
        const ev = base.filter(c => c.naturaleza === 'Evento');
        vis = base.filter(c => (!tipoSel || c.tipoEvento === tipoSel) && (!q || [c.titulo, c.entidad, c.canal, c.revisadoPor, c.comentario, c.id].join(' ').toLowerCase().includes(q)));
        $('rg-count').textContent = `Mostrando ${vis.length} de ${base.length} registros`;
        $('rg-anchor-t').textContent = `${plural(base.length, 'hecho aprobado')}${an ? ' en ' + an : ''}`;
        const totARS = base.reduce((t, c) => { const v = aARS(c.valorizado, c.moneda); return t + (v === '' ? 0 : v); }, 0);
        $('rg-val').textContent = totARS ? fmtMonto(totARS, 'ARS') : '—';
        // Indicadores
        const porTipo = TIPOS.map(t => ev.filter(c => c.tipoEvento === t).length);
        const iMax = porTipo.indexOf(Math.max(...porTipo));
        const altas = ev.filter(c => c.impacto === 'Alta').length;
        const kp = [
          ['Eventos asentados', `${ev.length}<span class="mx-h3" style="color:var(--mute);font-weight:400"> eventos</span>`, `${plural(base.length - ev.length, 'noticia')} de contexto`, 'check'],
          ['Mayor incidencia', ev.length && porTipo[iMax] ? `${Math.round(porTipo[iMax] / ev.length * 100)}%` : '—', ev.length && porTipo[iMax] ? `Tipo 0${iMax + 1} · ${TIPO_CORTO[iMax]}` : 'Sin eventos', 'alert'],
          ['Impacto alto', `${altas}`, `${ev.length ? Math.round(altas / ev.length * 100) : 0}% de los eventos`, 'target'],
          ['Tiempo medio de revisión', tiempoMedio(C), 'Desde la sugerencia hasta la decisión', 'hour']];
        $('rg-kpis').innerHTML = kp.map((k, j) => `<div class="mx-kpi"><div class="mx-kpi-h"><span class="mx-eyebrow">${k[0]}</span><span class="mx-kpi-ib ${j === 1 ? 'rojo' : ''}">${ico(k[3], 'width:17px;height:17px')}</span></div>
          <div class="mx-stat" style="margin:16px 0 6px">${k[1]}</div><div class="mx-mono" style="color:${j === 1 ? 'var(--alta)' : 'var(--primary)'}">${esc(k[2])}</div></div>`).join('');
        $('rg-cats').innerHTML = TIPOS.map((t, i) => {
          const c = porTipo[i], p = ev.length ? Math.round(c / ev.length * 100) : 0, top = c && i === iMax;
          return `<button type="button" class="mx-cat7 ${top ? 'top' : ''} ${tipoSel === t ? 'sel' : ''}" data-tipo="${esc(t)}" title="${esc(t)}">
            <div class="h"><span class="mx-mono">TIPO 0${i + 1}</span><span class="mx-badge ${top ? 'solid-alta' : 'neutral'}">${p}%</span></div>
            <div class="n">${esc(TIPO_CORTO[i])}</div>
            <div><div class="c"><b>${c}</b><span>${c === 1 ? 'evento' : 'eventos'}</span></div><div class="mx-track"><div class="mx-fill" style="width:${p}%"></div></div></div></button>`;
        }).join('');
        const tops = TIPOS.map((t, i) => [t, porTipo[i], i]).filter(x => x[1]).sort((a, b) => b[1] - a[1]).slice(0, 2);
        $('rg-chips').innerHTML = `<button type="button" class="mx-chipbtn ${tipoSel ? '' : 'on'}" data-tipo="">Todos los tipos</button>`
          + tops.map(x => `<button type="button" class="mx-chipbtn ${tipoSel === x[0] ? 'on' : ''}" data-tipo="${esc(x[0])}">Tipo 0${x[2] + 1} · ${esc(TIPO_CORTO[x[2]])}</button>`).join('');
        pag = 1; pintarTabla();
      };
      const elegirTipo = ev => { const b = ev.target.closest('[data-tipo]'); if (!b) return; tipoSel = tipoSel === b.dataset.tipo ? '' : b.dataset.tipo; filtrar(); };
      $('rg-cats').addEventListener('click', elegirTipo); $('rg-chips').addEventListener('click', elegirTipo);
      $('rg-anio').addEventListener('input', filtrar); $('rg-q').addEventListener('input', filtrar);
      $('rg-exp').addEventListener('click', () => {
        const clave = 'mx-ultexp-registro', ult = leerLS(clave);
        const nuevas = () => A.filter(c => !ult || (c.revisadoEn && new Date(c.revisadoEn) > new Date(ult)));
        const alcances = [{ id: 'vista', etiqueta: 'Lo que estoy viendo', n: vis.length, detalle: 'Con el año, el tipo y la búsqueda aplicados' },
          { id: 'todas', etiqueta: 'Todo el registro', n: A.length, detalle: 'Todos los hechos aprobados' },
          { id: 'nuevas', etiqueta: 'Solo los actualizados', n: nuevas().length, detalle: ult ? 'Aprobados después de la última exportación' : 'Todavía no exportaste: incluye todos' },
          { id: 'desde', etiqueta: 'Aprobados desde una fecha', detalle: '' }];
        abrirExportar({ titulo: 'Exportar registro A 4793', clave, porDefecto: 'vista', alcances,
          contarDesde: d => A.filter(c => (c.revisadoEn || '').slice(0, 10) >= d).length,
          obtener: (a, d) => a === 'vista' ? vis : a === 'todas' ? A : a === 'nuevas' ? nuevas() : A.filter(c => (c.revisadoEn || '').slice(0, 10) >= d),
          exportar: (L, fmt, conVal, alc) => {
            const cols = [{ t: 'Código', w: 34 }, { t: 'Fecha', w: 11, tipo: 'd' }, { t: 'Título', w: 60 }, { t: 'Resumen', w: 90 }, { t: 'Entidad', w: 30 },
              { t: 'Naturaleza', w: 11 }, { t: 'Subtipo', w: 26 }, { t: 'Tipo de evento', w: 34 }, { t: 'Origen', w: 10 }, { t: 'Factor', w: 16 }, { t: 'Canal', w: 18 },
              { t: 'Impacto', w: 9 }, { t: 'Normativa', w: 22 }, { t: 'Riesgo no declarado', w: 12 }, { t: 'Fuente', w: 20 }, { t: 'URL', w: 40 }, { t: 'Revisado por', w: 20 }, { t: 'Revisado en', w: 17 }, { t: 'Fundamento', w: 50 }];
            if (conVal) cols.push({ t: 'Monto mencionado', w: 22 }, { t: 'Moneda', w: 8 }, { t: 'Valorizado', w: 16, tipo: 'm' }, { t: 'Valorizado ARS', w: 16, tipo: 'm' }, { t: 'Origen de la valorización', w: 18 });
            const filas = L.map(c => {
              const f = [c.id, aFecha(c.fecha), c.titulo, c.resumen, c.entidad, c.naturaleza, c.subtipo, c.tipoEvento, c.origen, c.factor, c.canal, c.impacto, c.normativa, c.rnd || '',
                c.fuente, c.url, c.revisadoPor, fHora(c.revisadoEn), c.comentario];
              if (conVal) f.push(c.montoTexto || '', c.moneda || '', c.valorizado, aARS(c.valorizado, c.moneda), c.valorizadoManual ? 'Analista' : (c.montoTexto ? 'Detectado en el texto' : ''));
              return f;
            });
            return exportarTabla(`registro-a4793-${{ vista: 'vista', todas: 'completo', nuevas: 'actualizados', desde: 'desde' }[alc]}`, 'Registro A 4793', cols, filas, fmt,
              [['Generado', fHora(new Date().toISOString())], ['Alcance', alcances.find(a => a.id === alc).etiqueta], ['Eventos exportados', L.length]]);
          } });
      });
      $('rg-print').addEventListener('click', () => window.print());
      filtrar();
    },

    // ---------- Indicadores ----------
    async indicadores() {
      const [N0, C0] = await Promise.all([datos.noticias(), datos.candidatos().catch(() => [])]);
      const SEVS = ['alta', 'media', 'baja'];
      const TEC = /fortinet|forti|palo alto|pan-os|globalprotect|cisco|ivanti|citrix|netscaler|\bf5\b|big-ip|vmware|esx|microsoft|windows|exchange|office|beyondtrust|sonicwall|juniper|connectwise/;
      const hoy = hoyISO();
      const menos = (iso, d) => new Date(new Date(iso + 'T12:00:00Z').getTime() - d * 864e5).toISOString().slice(0, 10);
      const dias = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(String(a).slice(0, 10) + 'T12:00:00Z')) / 864e5);
      const pct = (v, t) => t ? Math.round(v / t * 100) : 0;
      // Barras horizontales con el mismo estilo que el desglose por categoría del Panorama
      const barras = (items, total, color, vacio) => {
        if (!items.length) return `<div class="mx-empty">${vacio || 'Sin datos en el período.'}</div>`;
        const mx = Math.max(1, ...items.map(x => x[1]));
        return items.map(([k, v, extra]) => `<div class="mx-catrow"><div class="l"><span title="${esc(k)}">${esc(k)}</span>
          <span class="mx-mono">${v}${total ? ` · ${pct(v, total)}%` : ''}${extra ? ` · ${extra}` : ''}</span></div>
          <div class="mx-track"><div class="mx-fill" style="width:${(v / mx * 100).toFixed(1)}%;background:${color}"></div></div></div>`).join('');
      };
      // Matriz con intensidad proporcional al valor
      const matriz = (filas, cols, valor, color, total) => {
        const mx = Math.max(1, ...filas.flatMap(f => cols.map(c => valor(f[0], c[0]))));
        return `<thead><tr><th></th>${cols.map(c => `<th>${esc(c[1])}</th>`).join('')}${total ? '<th>Total</th>' : ''}</tr></thead><tbody>`
          + filas.map(([fk, fl]) => `<tr><th>${esc(fl)}</th>${cols.map(([ck, cl]) => { const v = valor(fk, ck), col = typeof color === 'function' ? color(ck) : color;
            return `<td style="--c:${col};--a:${v ? (.12 + .78 * v / mx).toFixed(2) : 0}" title="${esc(fl)} · ${esc(cl)}: ${v}"><span>${v}</span></td>`; }).join('')}
            ${total ? `<td class="tot">${cols.reduce((s, c) => s + valor(fk, c[0]), 0)}</td>` : ''}</tr>`).join('') + '</tbody>';
      };

      const pintar = per => {
        const desde = per ? menos(hoy, per - 1) : '0000';
        const N = N0.filter(x => x.fecha >= desde);
        const C = C0.filter(c => c.fecha >= desde);
        const Ant = per ? N0.filter(x => x.fecha >= menos(hoy, 2 * per - 1) && x.fecha < desde) : [];
        const ev = C.filter(c => c.naturaleza === 'Evento' && c.decision !== 'rechazado');
        const pend = C0.filter(c => c.decision === 'pendiente');
        const viejos = pend.filter(c => dias(c.agregado || c.fecha, hoy) > 7).length;
        const etiq = per ? `Últimos ${per} días` : 'Todo el historial';

        // KPIs
        const alta = N.filter(x => x.severidad === 'alta').length, nac = N.filter(x => x.ambito === 'nacional').length;
        const tec = N.filter(x => /vulnerabilidad explotada/i.test(x.tipo) && TEC.test(low(x.titulo + ' ' + x.entidad))).length;
        const K = [
          { t: 'Hechos relevados', v: N.length, s: `${nac} nacionales · ${etiq.toLowerCase()}`, i: 'activity', d: per && Ant.length ? delta(N.length, Ant.length).replace(/ sem\./, ' vs. período ant.') : '' },
          { t: 'Severidad alta', v: alta, s: `${pct(alta, N.length)}% del total`, i: 'alert', ib: 'rojo', vc: 'var(--alta)' },
          { t: 'Fallas explotadas en tecnología bancaria', v: tec, s: 'Cisco, Fortinet, Ivanti, Palo Alto, VMware, Microsoft…', i: 'shield', ib: 'azul' },
          { t: 'Pendientes de revisión', v: pend.length, s: `${viejos} con más de 7 días · revisión media: ${tiempoMedio(C0)}`, i: 'hour', vc: viejos ? 'var(--media)' : '' }];
        $('in-kpis').innerHTML = K.map(k => `<div class="mx-kpi"><div class="mx-kpi-h"><span class="mx-eyebrow">${k.t}</span><span class="mx-kpi-ib ${k.ib || ''}">${ico(k.i, 'width:17px;height:17px')}</span></div>
          <div class="mx-kpi-v"><span class="n"><span class="mx-stat" ${k.vc ? `style="color:${k.vc}"` : ''}>${k.v}</span></span>${k.d || ''}</div>
          <div class="mx-small">${esc(k.s)}</div></div>`).join('');

        // Hechos por semana (apilado por severidad), hasta 12 semanas
        const lunes = f => { const d = new Date(f + 'T12:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); };
        const S = {}; N.forEach(x => { const w = lunes(x.fecha); (S[w] = S[w] || { alta: 0, media: 0, baja: 0 })[x.severidad] = (S[w][x.severidad] || 0) + 1; });
        const W = Object.keys(S).sort().slice(-12), tw = w => SEVS.reduce((s, k) => s + (S[w][k] || 0), 0);
        $('in-sem-t').textContent = W.length ? `${W.length} semanas` : '—';
        if (!W.length) $('in-sem').innerHTML = '<div class="mx-empty">Sin hechos en el período.</div>';
        else {
          const max = Math.max(4, ...W.map(tw)), paso = max <= 8 ? 2 : max <= 20 ? 5 : max <= 50 ? 10 : 20, tope = Math.ceil(max / paso) * paso;
          const Wd = 460, H = 200, ml = 24, mb = 22, mt = 16, cw = (Wd - ml) / W.length, bw = Math.min(28, cw * .62), y = v => mt + (H - mt - mb) * (1 - v / tope);
          let svg = `<svg viewBox="0 0 ${Wd} ${H}">`;
          for (let v = paso; v <= tope; v += paso) svg += `<line class="grid" x1="${ml}" x2="${Wd}" y1="${y(v)}" y2="${y(v)}"/><text class="eje" x="${ml - 5}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
          svg += `<line class="base" x1="${ml}" x2="${Wd}" y1="${y(0)}" y2="${y(0)}"/>`;
          W.forEach((w, i) => {
            const cx = ml + i * cw + cw / 2; let acc = 0;
            svg += `<g data-i="${i}"><rect class="hit" x="${ml + i * cw}" y="0" width="${cw}" height="${H - mb}"/>`;
            SEVS.forEach(k => { const v = S[w][k] || 0; if (!v) return; const y1 = y(acc + v), y0 = y(acc); acc += v;
              svg += `<rect x="${cx - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(0, y0 - y1 - 1)}" rx="2" style="fill:var(--${k})"/>`; });
            svg += `<text class="lbl" x="${cx}" y="${y(acc) - 4}" text-anchor="middle">${acc}</text></g>`
              + `<text class="eje" x="${cx}" y="${H - 6}" text-anchor="middle">${fCorta(w)}</text>`;
          });
          $('in-sem').innerHTML = svg + '</svg>';
          $('in-sem').setAttribute('aria-label', 'Hechos por semana: ' + W.map(w => `${fCorta(w)} ${tw(w)}`).join(', '));
          $('in-sem').querySelectorAll('g[data-i]').forEach(g => {
            const w = W[+g.dataset.i];
            g.addEventListener('mousemove', e => verTip(e, `<b>Semana del ${fCorta(w)}</b>${lunes(hoy) === w ? ' (en curso)' : ''}<br>${SEVS.map(k => `${k[0].toUpperCase() + k.slice(1)}: ${S[w][k] || 0}`).join(' · ')}`));
            g.addEventListener('mouseleave', ocultarTip);
          });
        }
        $('in-sem-l').innerHTML = SEVS.map(k => { const c = N.filter(x => x.severidad === k).length;
          return `<div><div class="k"><i style="background:var(--${k})"></i>${k[0].toUpperCase() + k.slice(1)}</div><div class="mx-mono">${c} (${pct(c, N.length)}%)</div></div>`; }).join('');

        // Categoría × severidad
        $('in-heat').innerHTML = matriz(Object.entries(CAT), SEVS.map(s => [s, s[0].toUpperCase() + s.slice(1)]),
          (c, s) => N.filter(x => x.categoria === c && x.severidad === s).length, s => `var(--${s})`, true);

        // Tipos más frecuentes
        const tp = {}; N.forEach(x => { if (x.tipo) tp[x.tipo] = (tp[x.tipo] || 0) + 1; });
        $('in-tipos-t').textContent = etiq;
        $('in-tipos').innerHTML = barras(Object.entries(tp).sort((a, b) => b[1] - a[1]).slice(0, 8), N.length, 'var(--primary)');

        // Fallos, condenas y sanciones (candidatos argentinos)
        const jud = C.filter(c => /fallo|judicial|sanci|condena|multa/i.test(c.subtipo + ' ' + c.titulo)).sort((a, b) => b.fecha.localeCompare(a.fecha));
        $('in-jud-t').textContent = plural(jud.length, 'caso');
        $('in-jud').innerHTML = jud.length ? jud.slice(0, 8).map(c => `<div class="it"><span class="mx-mono">${esc(fCorta(c.fecha))}</span>
          <div><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.titulo)}</a><span class="mx-small">${esc(c.subtipo || '—')} · ${esc(c.entidad || '—')}${c.valorizado !== '' && c.valorizado != null ? ` · ${esc(c.moneda || '$')} ${Number(c.valorizado).toLocaleString('es-AR')}` : ''}</span></div></div>`).join('')
          : '<div class="mx-empty">Sin fallos ni sanciones en el período.</div>';

        // Tipos A 4793 (siempre los 7)
        const t7 = TIPOS.map((t, i) => [TIPO_CORTO[i], ev.filter(c => c.tipoEvento === t).length]);
        $('in-t4793-t').textContent = `${plural(ev.length, 'evento')} · ${ev.filter(c => c.decision === 'aprobado').length} aprobados`;
        $('in-t4793').innerHTML = barras(t7, ev.length, 'var(--ok)');

        // Origen × factor
        $('in-of').innerHTML = matriz([['Interno', 'Interno'], ['Externo', 'Externo']],
          [['Personas', 'Personas'], ['Procesos', 'Procesos'], ['Sistemas', 'Sistemas'], ['Eventos externos', 'Ev. externos']],
          (o, f) => ev.filter(c => c.origen === o && c.factor === f).length, 'var(--ok)', false);

        // Canal (un hecho puede tener varios)
        const cn = {};
        ev.forEach(c => String(c.canal || '').split('/').map(p => p.replace(/\(.*?\)/g, '').trim()).filter(Boolean).forEach(p => {
          p = /^tel[eé]fon/i.test(p) ? 'Telefonía / SIM' : p[0].toUpperCase() + p.slice(1); cn[p] = (cn[p] || 0) + 1; }));
        $('in-canal').innerHTML = barras(Object.entries(cn).sort((a, b) => b[1] - a[1]).slice(0, 8), ev.length, 'var(--ok)', 'Sin eventos con canal identificado.');

        // Flujo de revisión
        const ap = C.filter(c => c.decision === 'aprobado'), re = C.filter(c => c.decision === 'rechazado'), dec = ap.concat(re);
        const corr = dec.filter(modificado).length;
        $('in-rev-t').textContent = etiq;
        $('in-rev').innerHTML = barras([['Sugeridos (IA y carga manual)', C.length], ['Aprobados', ap.length], ['Rechazados', re.length],
          ['Pendientes', C.filter(c => c.decision === 'pendiente').length]], C.length, 'var(--navy-2)')
          + `<p class="mx-small" style="margin-top:10px">Clasificación de la IA corregida por un analista: <b>${dec.length ? `${corr} de ${dec.length} (${pct(corr, dec.length)}%)` : 'sin decisiones todavía'}</b> · Tiempo medio de revisión: <b>${tiempoMedio(C)}</b></p>`;
        const E4 = [['0 a 2 días', 0, 2], ['3 a 7 días', 3, 7], ['8 a 14 días', 8, 14], ['Más de 14 días', 15, 1e9]]
          .map(([k, a, b]) => [k, pend.filter(c => { const d = dias(c.agregado || c.fecha, hoy); return d >= a && d <= b; }).length]);
        $('in-edad').innerHTML = barras(E4, pend.length, 'var(--media)', 'No hay pendientes.');
      };

      const chips = $('in-per');
      chips.addEventListener('click', ev => {
        const b = ev.target.closest('button[data-d]'); if (!b) return;
        chips.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        grabarLS('mx-in-per', b.dataset.d); pintar(+b.dataset.d);
      });
      const ini = leerLS('mx-in-per') || '30';
      chips.querySelectorAll('button').forEach(x => x.classList.toggle('on', x.dataset.d === ini));
      pintar(+ini);
    },

    // ---------- Normativa ----------
    async normativa() {
      const B = window.MX_NORMATIVA || { normas: [], comunicados: [], kri: [] };
      const [N0, C0] = await Promise.all([datos.noticias().catch(() => []), datos.candidatos().catch(() => [])]);
      const TEMAS = { operacional: 'Riesgo operacional', tecnologia: 'Tecnología y ciberseguridad', terceros: 'Terceras partes', fraude: 'Fraude', usuarios: 'Protección de usuarios' };
      const TCOL = { operacional: 'info', tecnologia: 'neutral', terceros: 'media', fraude: 'alta', usuarios: 'ok' };
      const hoy = hoyISO(), d30 = new Date(new Date(hoy + 'T12:00:00Z').getTime() - 29 * 864e5).toISOString().slice(0, 10);
      const N = N0.filter(x => x.fecha >= d30), C = C0.filter(c => c.fecha >= d30 && c.decision !== 'rechazado');
      const ev = C.filter(c => c.naturaleza === 'Evento');
      const fecha = n => n.fechaTxt || fLarga(n.fecha);
      $('nm-sub').textContent = `${plural(B.normas.length, 'norma')} y ${plural(B.comunicados.length, 'comunicado')} · biblioteca actualizada al ${fLarga(B.actualizado)}`;

      // Valores actuales de los KRI que el monitor ya puede calcular
      const TEC = /fortinet|forti|palo alto|pan-os|globalprotect|cisco|ivanti|citrix|netscaler|\bf5\b|big-ip|vmware|esx|microsoft|windows|exchange|office|beyondtrust|sonicwall|juniper|connectwise/;
      const pesos = v => '$ ' + Math.round(v).toLocaleString('es-AR');
      const canales = {}; ev.filter(c => /fraude/i.test(c.tipoEvento)).forEach(c => String(c.canal || '').split('/').map(p => p.replace(/\(.*?\)/g, '').trim()).filter(Boolean)
        .forEach(p => { p = /^tel[eé]fon/i.test(p) ? 'Telefonía / SIM' : p; canales[p] = (canales[p] || 0) + 1; }));
      const topCanal = Object.entries(canales).sort((a, b) => b[1] - a[1])[0];
      const valARS = ev.filter(c => c.decision === 'aprobado' && c.valorizado !== '' && c.valorizado != null && (!c.moneda || /ars|\$/i.test(c.moneda)));
      const VAL = {
        eventos: () => { const t = {}; ev.forEach(c => { if (c.tipoEvento && c.tipoEvento !== '—') t[c.tipoEvento] = (t[c.tipoEvento] || 0) + 1; });
          const top = Object.entries(t).sort((a, b) => b[1] - a[1])[0]; return [ev.length, top ? `${top[0]}: ${top[1]}` : '']; },
        perdida: () => [valARS.length ? pesos(valARS.reduce((s, c) => s + Number(c.valorizado), 0)) : '—', valARS.length ? `${plural(valARS.length, 'evento aprobado')} con monto en pesos` : 'Sin eventos aprobados con monto'],
        fraude: () => [ev.filter(c => /fraude/i.test(c.tipoEvento)).length, topCanal ? `Canal principal: ${topCanal[0]}` : ''],
        judicial: () => [C.filter(c => /fallo|judicial|sanci|condena|multa/i.test(c.subtipo + ' ' + c.titulo)).length, 'fallos, condenas o multas'],
        kev: () => [N.filter(x => /vulnerabilidad explotada/i.test(x.tipo) && TEC.test(low(x.titulo + ' ' + x.entidad))).length, 'en productos de uso bancario'],
        terceros: () => [N.filter(x => /cadena de suministro|proveedor|tercerizad/i.test(x.tipo + ' ' + x.titulo)).length, 'hechos que involucran a proveedores']
      };

      let tema = new URLSearchParams(location.search).get('tema') || '', q = '';
      const pintar = () => {
        const txt = n => sinTilde([n.numero, n.titulo, n.resumen, n.texto, n.destinatarios, (n.claves || []).join(' '), n.temas.map(t => TEMAS[t]).join(' ')].join(' '));
        $('nm-temas').innerHTML = `<button type="button" class="mx-chipbtn ${tema ? '' : 'on'}" data-t="">Todas · ${B.normas.length}</button>`
          + Object.entries(TEMAS).filter(([k]) => B.normas.some(n => n.temas.includes(k)))
            .map(([k, v]) => `<button type="button" class="mx-chipbtn ${tema === k ? 'on' : ''}" data-t="${k}">${v} · ${B.normas.filter(n => n.temas.includes(k)).length}</button>`).join('');

        // KRI: una tarjeta por área con sus indicadores
        const K = B.kri.filter(k => !tema || k.tema === tema);
        const areas = Object.keys(TEMAS).filter(t => K.some(k => k.tema === t));
        $('nm-n-kri').textContent = K.length;
        $('nm-kri').innerHTML = areas.length ? areas.map(t => `<section class="mx-card mx-nm-area"><div class="mx-card-h"><span class="mx-badge ${TCOL[t] || 'neutral'}">${esc(TEMAS[t])}</span></div>`
          + K.filter(k => k.tema === t).map(k => { const v = k.monitor && VAL[k.monitor] ? VAL[k.monitor]() : null;
            return `<div class="mx-nm-k"><div class="v">${v ? `<b>${esc(v[0])}</b>` : '<span class="na">—</span>'}</div>
              <div style="min-width:0"><div class="t">${esc(k.indicador)}</div><div class="mx-small">${esc(k.formula)}</div>
              <div class="f"><span class="mx-mono">${esc(k.norma)}</span> · ${v ? esc(v[1] || k.fuente) : 'Requiere datos internos · ' + esc(k.fuente)}</div></div></div>`; }).join('') + '</section>').join('')
          : '<div class="mx-card"><div class="mx-empty">Sin indicadores para este tema.</div></div>';

        // Normas: filas compactas que se expanden
        const L = B.normas.filter(n => (!tema || n.temas.includes(tema)) && (!q || txt(n).includes(q))).sort((a, b) => b.fecha.localeCompare(a.fecha));
        $('nm-n-bib').textContent = L.length;
        $('nm-lista').innerHTML = L.length ? L.map(n => `<details class="mx-nm-row" data-id="${esc(n.id)}">
            <summary><span class="num mx-mono">${esc(n.numero)}</span>
              <span class="tx"><b>${esc(n.titulo)}</b><span class="mx-small">${esc(fecha(n))} · ${n.temas.map(t => esc(TEMAS[t] || t)).join(' · ')}</span></span>
              <span class="est mx-small">${esc(n.estado)}</span><span class="car" aria-hidden="true">›</span></summary>
            <div class="det">
              <p class="mx-body" style="margin:0 0 8px">${esc(n.resumen)}</p>
              <ul>${(n.claves || []).map(c => `<li>${esc(c)}</li>`).join('')}</ul>
              <div class="meta3"><div class="mx-tile"><span>Alcance</span><b>${esc(n.destinatarios)}</b></div><div class="mx-tile"><span>Texto ordenado</span><b>${esc(n.texto)}</b></div>
                <div class="mx-tile"><span>Plazos</span><b>${esc(n.plazos)}</b></div><div class="mx-tile"><span>Estado</span><b>${esc(n.estado)}</b></div></div>
              <div class="mx-nm-links"><span class="mx-eyebrow">Para profundizar</span>
                ${(n.enlaces && n.enlaces.length ? n.enlaces : [{ t: 'Ver texto', url: n.url }]).map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${ico(/pdf|texto ordenado/i.test(l.t) ? 'file' : 'ext', 'width:15px;height:15px')}<span>${esc(l.t)}</span></a>`).join('')}</div>
            </div></details>`).join('') : '<div class="mx-empty">No hay normas que coincidan con la búsqueda.</div>';

        // Comunicados
        const Cm = B.comunicados.filter(c => !tema || c.tema === tema).sort((a, b) => b.fecha.localeCompare(a.fecha));
        $('nm-n-com').textContent = Cm.length;
        $('nm-com').innerHTML = Cm.length ? Cm.map(c => `<div class="it"><span class="mx-mono">${esc(fLarga(c.fecha))}</span><div><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.titulo)} ${ico('ext', 'width:13px;height:13px;vertical-align:-2px')}</a>
          <span class="mx-small">${esc(c.resumen)}</span><span class="mx-small" style="color:var(--mute)">Fuente: ${esc(c.fuente || '—')}</span>
          ${(c.enlaces || []).map(l => `<a class="mx-nm-sub" href="${esc(l.url)}" target="_blank" rel="noopener">→ ${esc(l.t)}</a>`).join('')}</div></div>`).join('') : '<div class="mx-empty">Sin comunicados para este tema.</div>';
      };

      // Uso de cada norma en los candidatos del monitor (todo el historial)
      const NUM = [['A 4793', /4793/], ['A 8471', /8471/], ['A 7724', /7724/], ['Ley 24.240', /24\.?240/]];
      const Cn = C0.filter(c => c.decision !== 'rechazado'), mxu = Math.max(1, ...NUM.map(([, r]) => Cn.filter(c => r.test(c.normativa)).length));
      $('nm-uso').innerHTML = NUM.map(([k, r]) => { const v = Cn.filter(c => r.test(c.normativa)).length;
        return `<div class="mx-catrow"><div class="l"><span>${k}</span><span class="mx-mono">${plural(v, 'hecho')}</span></div><div class="mx-track"><div class="mx-fill" style="width:${(v / mxu * 100).toFixed(1)}%"></div></div></div>`; }).join('');

      $('nm-temas').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (!b) return; tema = b.dataset.t; pintar(); });
      $('nm-q').addEventListener('input', e => { q = sinTilde(e.target.value); pintar(); });
      // Solo una norma abierta a la vez
      $('nm-lista').addEventListener('toggle', e => { if (e.target.open) $('nm-lista').querySelectorAll('details[open]').forEach(d => { if (d !== e.target) d.open = false; }); }, true);
      // Pestañas internas (Biblioteca · KRI · Comunicados), recordadas en la dirección (#kri)
      const verTab = t => {
        if (!['biblioteca', 'kri', 'comunicados'].includes(t)) t = 'biblioteca';
        document.querySelectorAll('#nm-tabs [data-tab]').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
        document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== t; });
      };
      $('nm-tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; history.replaceState(null, '', '#' + b.dataset.tab); verTab(b.dataset.tab); });
      verTab(location.hash.slice(1));
      pintar();
    },

    async servicios() {
      const [N, C] = await Promise.all([datos.noticias(), datos.candidatos().catch(() => []), cargarServicios()]);
      let TODOS = incidentesServicios(N, C);
      const edita = puedeEditarServ(); if (!edita) $('sv-add').hidden = true;
      const hoy = hoyISO(), diaMs = 864e5;
      const menos = (f, d) => new Date(new Date(f + 'T12:00:00Z').getTime() - d * diaMs).toISOString().slice(0, 10);
      const difDias = (a, b) => Math.round((new Date(a + 'T12:00:00Z') - new Date(b + 'T12:00:00Z')) / diaMs);
      const lunes = f => { const d = new Date(f + 'T12:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * diaMs).toISOString().slice(0, 10); };
      const pintarGrupos = () => { const GR = [...new Set(SERVICIOS.map(s => s.grupo || 'Otros'))];
        $('sv-grupo').innerHTML = '<button type="button" class="mx-chipbtn on" data-g="">Todos</button>' + GR.map(g => `<button type="button" class="mx-chipbtn" data-g="${esc(g)}">${esc(g)}</button>`).join(''); };
      const GRUPOS = [...new Set(SERVICIOS.map(s => s.grupo || 'Otros'))];
      $('sv-grupo').innerHTML = '<button type="button" class="mx-chipbtn on" data-g="">Todos</button>' + GRUPOS.map(g => `<button type="button" class="mx-chipbtn" data-g="${esc(g)}">${esc(g)}</button>`).join('');
      const primero = TODOS.length ? TODOS[TODOS.length - 1].fecha : hoy;
      let dias = +(leerLS('mx-sv-per') || 90), grupo = '', fichas = [], verTodos = false;
      const sevB = s => `<span class="mx-badge ${s === 'alta' ? 'alta' : s === 'baja' ? 'baja' : 'media'}">${s === 'alta' ? 'Caída' : 'Falla'}</span>`;
      function pintar() {
        const desde = dias ? menos(hoy, dias - 1) : primero;
        const S = SERVICIOS.filter(s => !grupo || (s.grupo || 'Otros') === grupo), nombres = new Set(S.map(s => s.nombre));
        // Estado en vivo
        let gv = '';
        $('sv-vivo').innerHTML = S.map(s => { const cab = (s.grupo || 'Otros') !== gv ? `<div class="mx-serv-g">${esc(gv = s.grupo || 'Otros')}</div>` : '';
          return cab + `<div class="mx-srv vivo${VIVO[s.nombre] && ['ok', 'lento', 'caido'].includes(VIVO[s.nombre].estado) ? ' s-' + VIVO[s.nombre].estado : ''}"><div class="mx-srv-h"><b title="${esc(s.nombre)}">${esc(s.nombre)}</b>
            ${s.propio && edita ? `<span class="mx-srv-acc"><button type="button" class="mx-x" data-editar="${esc(s.nombre)}" title="Editar servicio" style="width:22px;height:22px;font-size:13px">✎</button><button type="button" class="mx-x" data-quitar="${esc(s.nombre)}" title="Quitar servicio" style="width:22px;height:22px">${ico('x', 'width:13px;height:13px')}</button></span>` : ''}</div>
            ${vivoHtml(s)}<div class="mx-small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.web ? esc(s.web.replace(/^https?:\/\//, '')) : '—'}</div></div>`; }).join('');
        Object.keys(VIVO).forEach(pintarVivo);
        const rehacer = () => { TODOS = incidentesServicios(N, C); pintarGrupos(); grupo = ''; pintar(); verificarTodos(); };
        $('sv-vivo').querySelectorAll('[data-quitar]').forEach(b => b.addEventListener('click', () => quitarServicio(b.dataset.quitar, rehacer)));
        $('sv-vivo').querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => abrirAltaServicio(rehacer, SERVICIOS.find(x => x.nombre === b.dataset.editar))));
        pintarUptime(S);
        const I = TODOS.filter(h => h.fecha >= desde && h.servicios.some(n => nombres.has(n)));
        const ant = dias ? TODOS.filter(h => h.fecha < desde && h.fecha >= menos(desde, dias) && h.servicios.some(n => nombres.has(n))) : [];
        const porServ = n => I.filter(h => h.servicios.includes(n));
        const afectados = S.filter(s => porServ(s.nombre).length);
        const diasCon = new Set(I.map(h => h.fecha)).size, totalDias = Math.max(1, difDias(hoy, desde) + 1);
        const ult = TODOS.find(h => h.servicios.some(n => nombres.has(n)));
        const caidas = I.filter(h => h.sev === 'alta').length;
        const K = [
          { t: 'Incidentes en el período', v: I.length, s: `${plural(caidas, 'caída')} · ${plural(I.length - caidas, 'falla menor', 'fallas menores')}`, i: 'activity', d: !dias ? '' : ant.length ? delta(I.length, ant.length).replace(/ sem\./, ' vs. período ant.') : `<span class="mx-delta igual">${I.length ? 'sin incidentes en el período ant.' : 'sin cambios'}</span>` },
          { t: 'Servicios afectados', v: `${afectados.length}<span class="pct" style="font-size:14px"> / ${S.length}</span>`, s: afectados.length ? 'Más afectado: ' + afectados.map(x => [x.nombre, porServ(x.nombre).length]).sort((a, b) => b[1] - a[1])[0].join(' · ') : 'Ningún servicio con incidentes', i: 'alert', ib: 'rojo', vc: afectados.length ? 'var(--alta)' : '' },
          { t: 'Días con algún incidente', v: diasCon, s: `${pct(diasCon, totalDias)}% de ${plural(totalDias, 'día')} · ${100 - pct(diasCon, totalDias)}% sin incidentes`, i: 'hour', ib: 'azul' },
          { t: 'Días desde el último incidente', v: ult ? difDias(hoy, ult.fecha) : '—', s: ult ? `${ult.servicios.join(', ')} · ${fLarga(ult.fecha)}` : 'Sin incidentes registrados', i: 'check', vc: ult && difDias(hoy, ult.fecha) <= 2 ? 'var(--media)' : 'var(--ok)' }];
        $('sv-kpis').innerHTML = K.map(k => `<div class="mx-kpi"><div class="mx-kpi-h"><span class="mx-eyebrow">${k.t}</span><span class="mx-kpi-ib ${k.ib || ''}">${ico(k.i, 'width:17px;height:17px')}</span></div>
          <div class="mx-kpi-v"><span class="n"><span class="mx-stat" ${k.vc ? `style="color:${k.vc}"` : ''}>${k.v}</span></span>${k.d || ''}</div>
          <div class="mx-small">${esc(k.s)}</div></div>`).join('');

        // Mapa por semana
        const semanas = []; for (let w = lunes(desde); w <= hoy; w = menos(w, -7)) semanas.push(w);
        const sem = semanas.length > 53 ? semanas.slice(-53) : semanas;
        const celda = (n, w) => { const l = porServ(n).filter(h => lunes(h.fecha) === w); return l.length ? (l.some(h => h.sev === 'alta') ? 'alta' : 'media') : ''; };
        $('sv-mapa-t').textContent = `${plural(sem.length, 'semana')} · desde ${fLarga(sem[0])}`;
        let g0 = '';
        $('sv-mapa').innerHTML = `<div class="mx-svmap" style="--cols:${sem.length}">` + S.map(s => {
          const cab = (s.grupo || 'Otros') !== g0 ? `<div class="g">${esc(g0 = s.grupo || 'Otros')}</div>` : '';
          return cab + `<div class="n" title="${esc(s.nombre)}">${esc(s.nombre)}</div><div class="r">${sem.map(w => { const c = celda(s.nombre, w); return `<i class="${c}" title="${esc(s.nombre)} · semana del ${fLarga(w)}${c ? (c === 'alta' ? ' · caída' : ' · falla') : ' · sin incidentes'}"></i>`; }).join('')}</div>`;
        }).join('') + `</div>`;

        // Ranking por servicio
        const filas = S.map(s => { const l = porServ(s.nombre), u = TODOS.find(h => h.servicios.includes(s.nombre)); return { s, n: l.length, a: l.filter(h => h.sev === 'alta').length, dias: new Set(l.map(h => h.fecha)).size, u }; })
          .sort((a, b) => b.n - a.n || b.a - a.a || a.s.nombre.localeCompare(b.s.nombre));
        const conInc = filas.filter(f => f.n), sinInc = filas.length - conInc.length;
        $('sv-todos').hidden = !sinInc; $('sv-todos').textContent = verTodos ? 'Ver solo los afectados' : `Mostrar los ${sinInc} sin incidentes`;
        $('sv-tabla').innerHTML = ((verTodos ? filas : conInc).map(f => `<tr><td class="nw"><b>${esc(f.s.nombre)}</b></td><td class="nw mx-small">${esc(f.s.grupo || '')}</td>
            <td class="nw mx-mono" style="text-align:right">${f.n || '—'}</td><td class="nw mx-mono" style="text-align:right;${f.a ? 'color:var(--alta);font-weight:700' : ''}">${f.a || '—'}</td>
            <td class="nw mx-mono" style="text-align:right">${f.dias || '—'}</td>
            <td class="nw">${f.u ? `${esc(fLarga(f.u.fecha))} <span class="mx-small">(hace ${plural(difDias(hoy, f.u.fecha), 'día')})</span>` : '<span class="mx-small">Sin registros</span>'}</td>
            <td class="nw" style="text-align:right"><a class="mx-btn sm" href="${esc(f.s._dd)}" target="_blank" rel="noopener">Reportes ↗</a></td></tr>`).join(''))
          || '<tr><td colspan="7" class="mx-empty">Ningún servicio tuvo incidentes en el período.</td></tr>';

        // Historial
        fichas = [];
        $('sv-hist-n').textContent = plural(I.length, 'incidente');
        $('sv-hist').innerHTML = I.map(h => { let idx = ''; if (h.src) { fichas.push(h.src); idx = ` data-f="${fichas.length - 1}"`; }
          return `<tr><td class="nw mx-mono" style="color:var(--ink-2)">${esc(fLarga(h.fecha))}</td><td class="nw">${sevB(h.sev)}</td>
            <td style="min-width:140px">${h.servicios.map(n => `<span class="mx-chip-mono" style="margin:0 4px 4px 0;display:inline-block">${esc(n)}</span>`).join('')}</td>
            <td class="tit"><span${idx} style="${idx ? 'cursor:pointer;text-decoration:underline;text-decoration-color:var(--line-2)' : ''}">${esc(h.titulo)}</span>
              ${h.url ? `<div><a class="mx-small" href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.fuente || 'Ver nota')} ↗</a></div>` : ''}</td></tr>`; }).join('')
          || '<tr><td colspan="4" class="mx-empty">No hay incidentes registrados en el período.</td></tr>';
        $('sv-hist').querySelectorAll('[data-f]').forEach(el => el.addEventListener('click', () => abrirFicha(fichas[+el.dataset.f])));
        $('sv-exp').onclick = () => csv('incidentes-servicios', ['Fecha', 'Tipo', 'Servicios', 'Título', 'Fuente', 'URL'],
          I.map(h => [h.fecha, h.sev === 'alta' ? 'Caída' : 'Falla', h.servicios.join(', '), h.titulo, h.fuente || '', h.url || '']));
      }
      const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
      // Disponibilidad de los últimos 30 días (verificación automática del servidor)
      let UP = null;
      try { UP = usaSupabase && SERV_TABLA ? await sbRpc('monitor_servicios_dias', { p_dias: 30 }) : null; } catch (e) { UP = null; }
      function pintarUptime(S) {
        const cont = $('sv-up'); if (!cont) return;
        if (!UP) { cont.innerHTML = '<div class="mx-empty">El historial se activa cuando se ejecuta en Supabase el script sql/2026-10-31_servicios_chequeos.sql. Desde ese momento el servidor verifica cada servicio cada 5 minutos.</div>'; $('sv-up-t').textContent = ''; return; }
        const D = []; for (let k = 29; k >= 0; k--) D.push(menos(hoy, k));
        const conDatos = new Set(UP.map(u => u.dia));
        $('sv-up-t').textContent = conDatos.size ? `registrando desde ${fLarga([...conDatos].sort()[0])} · cada cuadrito es un día` : 'todavía sin verificaciones';
        const filas = S.filter(s => s.web).map(s => {
          const L = UP.filter(u => u.servicio_id === s.id), tot = L.reduce((a, u) => a + u.chequeos, 0), cai = L.reduce((a, u) => a + u.caidos, 0);
          return { s, L, tot, p: tot ? (1 - cai / tot) * 100 : null };
        });
        cont.innerHTML = filas.map(f => `<div class="sv-ur"><b title="${esc(f.s.nombre)}">${esc(f.s.nombre)}</b><div class="sv-bar">${D.map(d => { const u = f.L.find(x => x.dia === d);
            if (!u) return `<i title="${esc(fLarga(d))} · sin verificaciones"></i>`;
            const c = u.caidos / u.chequeos > .1 ? 'r' : u.caidos || u.lentos > u.chequeos * .25 ? 'a' : 'ok';
            return `<i class="${c}" title="${esc(f.s.nombre)} · ${esc(fLarga(d))}\n${u.chequeos} verificaciones · ${u.caidos} sin respuesta · ${u.lentos} lentas${u.ms_prom ? ` · ${u.ms_prom} ms promedio` : ''}"></i>`; }).join('')}</div>
          <span class="sv-pct" style="color:${f.p == null ? 'var(--mute)' : f.p >= 99.5 ? 'var(--ok)' : f.p >= 97 ? 'var(--media)' : 'var(--alta)'}">${f.p == null ? '—' : (f.p >= 99.95 ? '100' : f.p.toFixed(1).replace('.', ',')) + '%'}</span></div>`).join('')
          + `<div class="sv-ejes"><span></span><span><span>${esc(fCorta(D[0]))}</span><span>${esc(fCorta(D[15]))}</span><span>hoy</span></span><span></span></div>`;
      }
      document.querySelectorAll('#sv-per .mx-chipbtn').forEach(b => {
        b.classList.toggle('on', +b.dataset.d === dias);
        b.addEventListener('click', () => { dias = +b.dataset.d; grabarLS('mx-sv-per', String(dias)); document.querySelectorAll('#sv-per .mx-chipbtn').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
      });
      $('sv-todos').addEventListener('click', () => { verTodos = !verTodos; pintar(); });
      $('sv-add').addEventListener('click', () => abrirAltaServicio(() => { TODOS = incidentesServicios(N, C); pintarGrupos(); grupo = ''; pintar(); verificarTodos(); }));
      $('sv-verif').addEventListener('click', () => { Object.keys(VIVO).forEach(k => delete VIVO[k]); SERVICIOS.forEach(s => pintarVivo(s.nombre)); verificarTodos(true); });
      setTimeout(verificarTodos, 50);
      $('sv-grupo').addEventListener('click', ev => { const b = ev.target.closest('[data-g]'); if (!b) return; grupo = b.dataset.g;
        $('sv-grupo').querySelectorAll('.mx-chipbtn').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
      pintar();
    },

    async apps() {
      if (!usaSupabase) { $('ap-cards').innerHTML = '<div class="mx-empty">La sección Apps funciona solo con la base de Supabase.</div>'; return; }
      const TN = { play: 'Android', ios: 'iOS' };
      const so = t => `<span class="so so-${t}" title="${t === 'play' ? 'Android · Google Play' : 'iOS · App Store'}">${TN[t]}</span>`;
      // Color e ícono por app (los íconos son los publicados en App Store; si no cargan, se muestran las iniciales)
      const ESTILO = {
        'hb-personas': { c: '#2563eb', i: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/36/23/dc/3623dcf7-7a2a-9e77-7447-08c5f317b837/AppIcon-0-0-1x_U007ephone-0-1-0-85-220.png/100x100bb.jpg' },
        'mi-bpn': { c: '#0d9488', i: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/53/78/7f/53787fe0-64f3-a7d3-fecf-74974746e76b/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/100x100bb.jpg' },
        'bpn-pagos': { c: '#7c3aed', i: 'https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/48/4d/b3/484db3bc-8c0e-1dad-ae47-c60175655f81/AppIcon-1x_U007emarketing-0-10-0-0-85-220.png/100x100bb.jpg' },
        'bpn-inversiones': { c: '#d97706', i: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/5f/e9/98/5fe998bb-43cc-e7cc-b193-bbd7c4da8273/AppIconIbpn-0-0-1x_U007emarketing-0-6-0-85-220.png/100x100bb.jpg' } };
      const PALETA = ['#2563eb', '#0d9488', '#7c3aed', '#d97706', '#db2777', '#0891b2'];
      let A, L, R;
      try {
        [A, L, R] = await Promise.all([sbFetch('monitor_apps?select=*&activo=eq.true&order=orden.asc'),
          sbFetch(`monitor_apps_lecturas?select=app_id,tienda,fecha,rating,cantidad,version,actualizada,error&fecha=gte.${new Date(Date.now() - 400 * 864e5).toISOString()}&order=fecha.asc&limit=10000`),
          sbFetch('monitor_apps_resenas?select=*&order=fecha.desc.nullslast&limit=5000')]);
      } catch (err) {
        if (err && err.sinSesion) throw err;
        $('ap-cards').innerHTML = '<div class="mx-empty" style="grid-column:1/-1">Todavía no están creadas las tablas de Apps. Ejecutá sql/2026-10-30_apps.sql en Supabase &gt; SQL Editor.</div>';
        ['ap-temas', 'ap-evol', 'ap-meses'].forEach(i => { $(i).innerHTML = ''; }); $('ap-rev').innerHTML = ''; return;
      }
      A.forEach((a, i) => { a.c = (ESTILO[a.id] || {}).c || PALETA[i % PALETA.length]; a.i = (ESTILO[a.id] || {}).i || a.icono || ''; a.ini = a.nombre.replace(/^BPN\s+/i, '').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(); });
      const app = id => A.find(a => a.id === id) || { nombre: id, c: 'var(--mute)', i: '', ini: '?' };
      const icono = (a, sm) => a.i ? `<img class="ap-ico${sm ? ' sm' : ''}" src="${esc(a.i)}" alt="" loading="lazy" style="--ap:${a.c}" onerror="this.outerHTML='<span class=&quot;ap-ico${sm ? ' sm' : ''}&quot; style=&quot;--ap:${a.c}&quot;>${esc(a.ini)}</span>'">`
        : `<span class="ap-ico${sm ? ' sm' : ''}" style="--ap:${a.c}">${esc(a.ini)}</span>`;
      const col = r => r == null ? 'var(--mute)' : r < 3 ? 'var(--alta)' : r < 4 ? 'var(--media)' : 'var(--ok)';
      const est = r => { const f = Math.round(r); return `<span class="estr" style="color:${col(r)}">${'★'.repeat(f)}<span style="color:var(--line-2)">${'★'.repeat(5 - f)}</span></span>`; };
      const num = r => Number(r).toFixed(1).replace('.', ',');
      const ultima = (id, t) => L.filter(x => x.app_id === id && x.tienda === t && x.rating != null).slice(-1)[0];
      const hace = (id, t, dias) => { const lim = new Date(Date.now() - dias * 864e5).toISOString(); return L.filter(x => x.app_id === id && x.tienda === t && x.rating != null && x.fecha <= lim).slice(-1)[0]; };
      const ult = L.slice(-1)[0];
      $('ap-ult').textContent = `Última lectura · ${ult ? fHora(ult.fecha) : 'todavía no hubo'}`;
      $('ap-app').innerHTML = '<option value="">Todas las apps</option>' + A.map(a => `<option value="${esc(a.id)}">${esc(a.nombre)}</option>`).join('');
      // Período: rangos fijos + años y meses que tienen opiniones (se arma solo a medida que llegan reclamos)
      const MES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const ym = r => r.fecha ? fechaART(r.fecha).slice(0, 7) : '';
      const cuenta = {}; R.forEach(r => { const k = ym(r); if (k) { cuenta[k] = (cuenta[k] || 0) + 1; cuenta[k.slice(0, 4)] = (cuenta[k.slice(0, 4)] || 0) + 1; } });
      const anios = [...new Set(Object.keys(cuenta).filter(k => k.length === 4))].sort().reverse();
      $('ap-per').innerHTML = '<optgroup label="Rangos"><option value="d30">Últimos 30 días</option><option value="d90" selected>Últimos 90 días</option><option value="d365">Últimos 12 meses</option><option value="todo">Todo el historial</option></optgroup>'
        + anios.map(y => `<optgroup label="${y}"><option value="${y}">Año ${y} completo (${cuenta[y]})</option>${Object.keys(cuenta).filter(k => k.length === 7 && k.startsWith(y)).sort().reverse()
          .map(k => `<option value="${k}">${MES[+k.slice(5) - 1]} ${y} (${cuenta[k]})</option>`).join('')}</optgroup>`).join('');
      let tienda = '', estr = '', appSel = '', pag = 1, imprimiendo = false, ULT = { vis: [], RP: [], M: [] }, per = leerLS('mx-ap-per') || 'd90';
      if (![...$('ap-per').options].some(o => o.value === per)) per = 'd90';
      $('ap-per').value = per;
      const enPer = r => { if (per === 'todo') return true; if (per[0] === 'd') return r.fecha && r.fecha >= new Date(Date.now() - +per.slice(1) * 864e5).toISOString(); return ym(r).startsWith(per); };
      const perTxt = () => $('ap-per').selectedOptions[0].textContent.replace(/\s*\(\d+\)$/, '').replace(/^Últimos/, 'últimos').replace(/^Último/, 'último').replace(/^Todo el historial/, 'todo el historial');
      const desde7 = new Date(Date.now() - 7 * 864e5).toISOString(), desde1 = new Date(Date.now() - 864e5).toISOString();
      const modo = l => { const c = {}; l.forEach(x => { c[x || 'General'] = (c[x || 'General'] || 0) + 1; }); const o = Object.entries(c).sort((a, b) => (b[0] !== 'General') - (a[0] !== 'General') || b[1] - a[1]); return o.length ? o[0][0] : ''; };
      function pintar() {
        const TS = tienda ? [tienda] : ['play', 'ios'];
        // Alertas (siempre sobre lo reciente)
        const al = [];
        A.forEach(a => TS.forEach(t => {
          const malas = R.filter(r => r.app_id === a.id && r.tienda === t && r.fecha >= desde1 && r.estrellas && r.estrellas <= 2);
          if (malas.length >= 3) al.push([a, t, `${malas.length} opiniones de 1–2 ★ en las últimas 24 horas (tema principal: ${esc(modo(malas.map(m => m.tema)))}).`]);
          const u = ultima(a.id, t), h = hace(a.id, t, 7);
          if (u && h && u.rating - h.rating <= -0.2) al.push([a, t, `la calificación bajó de ${num(h.rating)} a ${num(u.rating)} en 7 días.`]);
          const sens = R.filter(r => r.app_id === a.id && r.tienda === t && r.fecha >= desde7 && /Fraude/.test(r.tema || ''));
          if (sens.length) al.push([a, t, `${plural(sens.length, 'opinión menciona', 'opiniones mencionan')} posible fraude o robo en los últimos 7 días.`]);
        }));
        $('ap-alertas').innerHTML = al.map(([a, t, x]) => `<div class="mx-nota" style="border-left:4px solid var(--alta);align-items:center">${icono(a, true)}<div><b>${esc(a.nombre)}</b> ${so(t)} ${x}</div></div>`).join('');
        // Tarjetas
        const fila = (a, t) => { const u = ultima(a.id, t), h = hace(a.id, t, 30);
          const d = u && h ? Math.round((u.rating - h.rating) * 10) / 10 : null;
          return `<div class="st">${so(t)}${u ? `<span>${est(u.rating)} <b style="color:${col(u.rating)}">${num(u.rating)}</b><small>(${Number(u.cantidad || 0).toLocaleString('es-AR')})</small>${d ? `<small style="color:${d > 0 ? 'var(--ok)' : 'var(--alta)'}">${d > 0 ? '▲' : '▼'} ${num(Math.abs(d))}</small>` : ''}</span>` : '<small>Sin calificaciones suficientes</small>'}</div>`; };
        $('ap-cards').innerHTML = A.map(a => {
          const rs = R.filter(r => r.app_id === a.id && TS.includes(r.tienda) && enPer(r));
          const t = rs.length ? modo(rs.map(r => r.tema)) : '', conE = rs.filter(r => r.estrellas);
          const prom = conE.length ? conE.reduce((s, r) => s + r.estrellas, 0) / conE.length : null;
          const vers = TS.map(x => { const u = L.filter(y => y.app_id === a.id && y.tienda === x && y.version).slice(-1)[0]; return u ? `${TN[x]} ${esc(u.version)}` : ''; }).filter(Boolean).join(' · ');
          return `<div class="ap" style="--ap:${a.c}"><div class="ap-h">${icono(a)}<h3>${esc(a.nombre)}</h3></div>${TS.map(x => fila(a, x)).join('')}
            <div class="mx-small">${vers ? 'Versión: ' + vers + '<br>' : ''}<b>${plural(rs.length, 'opinión', 'opiniones')}</b> en ${esc(perTxt())}${prom != null ? ` · promedio <b style="color:${col(prom)}">${num(prom)} ★</b>` : ''}${rs.length ? ` · 1–2 ★: ${rs.filter(r => r.estrellas && r.estrellas <= 2).length}` : ''}</div>
            ${t ? `<div><span class="mx-badge ${t === 'General' ? 'neutral' : 'media'}">Tema principal: ${esc(t)}</span></div>` : '<div><span class="mx-badge neutral">Sin opiniones en el período</span></div>'}</div>`; }).join('');
        // Opiniones por mes (últimos 18 meses con datos), apiladas por estrellas
        const RB = R.filter(r => TS.includes(r.tienda) && (!appSel || r.app_id === appSel) && ym(r));
        const meses = []; { const hoy = hoyISO(); let y = +hoy.slice(0, 4), m = +hoy.slice(5, 7); for (let k = 0; k < 18; k++) { meses.unshift(`${y}-${String(m).padStart(2, '0')}`); if (--m === 0) { m = 12; y--; } } }
        const M = meses.map(k => { const l = RB.filter(r => ym(r) === k); return { k, n: l.length, b: l.filter(r => r.estrellas && r.estrellas <= 2).length, m: l.filter(r => r.estrellas === 3).length, a: l.filter(r => r.estrellas >= 4).length }; });
        const top = Math.max(1, ...M.map(x => x.n)), H = 110;
        $('ap-meses').innerHTML = `<div class="ap-meses">${M.map(x => `<button type="button" class="ap-mes${per === x.k ? ' on' : ''}" data-mes="${x.k}" title="${MES[+x.k.slice(5) - 1]} ${x.k.slice(0, 4)}: ${x.n} opiniones · ${x.b} de 1–2 ★">
            ${x.n ? `<b>${x.n}</b>` : ''}<span class="pila" style="height:${Math.max(x.n ? 3 : 0, x.n / top * H)}px">${[['b', 'var(--alta)'], ['m', 'var(--media)'], ['a', 'var(--ok)']].map(([k, c]) => x[k] ? `<i style="height:${x[k] / x.n * 100}%;background:${c}"></i>` : '').join('')}${x.n - x.b - x.m - x.a > 0 ? `<i style="height:${(x.n - x.b - x.m - x.a) / x.n * 100}%;background:var(--line-2)"></i>` : ''}</span>
            <span>${MES[+x.k.slice(5) - 1].slice(0, 3)} ${x.k.slice(2, 4)}</span></button>`).join('')}</div>`;
        $('ap-meses').querySelectorAll('[data-mes]').forEach(b => b.addEventListener('click', () => {
          pag = 1; const k = b.dataset.mes; per = per === k ? 'd90' : k;
          if (![...$('ap-per').options].some(o => o.value === per)) $('ap-per').insertAdjacentHTML('beforeend', `<option value="${k}">${MES[+k.slice(5) - 1]} ${k.slice(0, 4)} (0)</option>`);
          $('ap-per').value = per; grabarLS('mx-ap-per', per); pintar(); }));
        // Temas del período
        const RP = R.filter(r => enPer(r) && TS.includes(r.tienda) && (!appSel || r.app_id === appSel));
        const cnt = {}; RP.forEach(r => { cnt[r.tema || 'General'] = (cnt[r.tema || 'General'] || 0) + 1; });
        const T = Object.entries(cnt).sort((a, b) => b[1] - a[1]), mx = Math.max(1, ...T.map(t => t[1]));
        $('ap-temas-n').textContent = `${plural(RP.length, 'opinión', 'opiniones')} · ${perTxt()}`;
        $('ap-temas').innerHTML = T.map(([k, n]) => `<div class="tm"><span>${esc(k)}</span><span class="b"><i style="width:${n / mx * 100}%;background:${k === 'General' ? 'var(--line-2)' : /Fraude|Token|Ingreso/.test(k) ? 'var(--alta)' : 'var(--media)'}"></i></span><b class="mx-mono">${n}</b></div>`).join('') || '<div class="mx-empty">Sin opiniones en el período.</div>';
        // Evolución de la calificación: promedio semanal de estrellas de las opiniones recibidas (escala fija 1 a 5).
        // La calificación de la tienda es un promedio histórico que casi no se mueve; se muestra al costado con su variación.
        const lunesDe = f => { const d = new Date(f + 'T12:00:00Z'); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10); };
        const RS = R.filter(r => r.fecha && r.estrellas && enPer(r) && TS.includes(r.tienda) && (!appSel || r.app_id === appSel));
        let sems = [...new Set(RS.map(r => lunesDe(fechaART(r.fecha))))].sort();
        if (sems.length) { const t = []; for (let w = sems[0]; w <= sems.at(-1); w = new Date(new Date(w + 'T12:00:00Z').getTime() + 7 * 864e5).toISOString().slice(0, 10)) t.push(w); sems = t.slice(-26); }
        const W = 300, Hh = 64, yv = r => 4 + (5 - r) / 4 * (Hh - 8), xw = i => sems.length < 2 ? W / 2 : 6 + i / (sems.length - 1) * (W - 12);
        const filasEv = A.filter(a => !appSel || a.id === appSel).flatMap(a => TS.map(t => {
          const L1 = RS.filter(r => r.app_id === a.id && r.tienda === t);
          const lt = L.filter(x => x.app_id === a.id && x.tienda === t && x.rating != null), ltU = lt.slice(-1)[0], lt30 = hace(a.id, t, 30);
          if (!L1.length && !ltU) return '';
          const pts = sems.map(w => { const l = L1.filter(r => lunesDe(fechaART(r.fecha)) === w); return l.length ? { v: l.reduce((x, r) => x + r.estrellas, 0) / l.length, n: l.length, w } : null; });
          let d = '', ant = false; pts.forEach((q, i) => { if (!q) { ant = false; return; } d += `${ant ? ' L' : ' M'}${xw(i).toFixed(1)},${yv(q.v).toFixed(1)}`; ant = true; });
          const prom = L1.length ? L1.reduce((x, r) => x + r.estrellas, 0) / L1.length : null;
          const dl = ltU && lt30 ? +ltU.rating - +lt30.rating : null;
          const grid = [5, 3, 1].map(v => `<line x1="0" x2="${W}" y1="${yv(v)}" y2="${yv(v)}" stroke="var(--div)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('');
          const dots = pts.map((q, i) => q ? `<circle cx="${xw(i).toFixed(1)}" cy="${yv(q.v).toFixed(1)}" r="${Math.min(5.5, 2.2 + Math.sqrt(q.n))}" fill="${col(q.v)}" stroke="var(--panel)" stroke-width="1.2"><title>Semana del ${fLarga(q.w)}: ${num(q.v)} ★ promedio · ${plural(q.n, 'opinión', 'opiniones')}</title></circle>` : '').join('');
          return `<span class="ap-app">${icono(a, true)}<span>${esc(a.nombre)} ${so(t)}</span></span>
            <svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" style="height:${Hh}px;overflow:visible">${grid}${d ? `<path d="${d}" fill="none" stroke="${a.c}" stroke-width="2" ${t === 'ios' ? 'stroke-dasharray="5 4"' : ''} vector-effect="non-scaling-stroke" opacity=".85"/>` : ''}${dots}
              ${!L1.length ? `<text x="${W / 2}" y="${Hh / 2 + 4}" text-anchor="middle" font-size="11" fill="var(--mute)">sin opiniones en el período</text>` : ''}</svg>
            <span class="ap-ev-v"><b class="mx-mono" style="color:${prom != null ? col(prom) : 'var(--mute)'}">${prom != null ? num(prom) + ' ★' : '—'}</b><small>${plural(L1.length, 'opinión', 'opiniones')}</small>
              ${ltU ? `<small title="Calificación histórica que muestra la tienda">tienda ${num(+ltU.rating)}${dl != null ? ` <span style="color:${dl > 0.04 ? 'var(--ok)' : dl < -0.04 ? 'var(--alta)' : 'var(--mute)'}">${dl > 0.04 ? '▲' : dl < -0.04 ? '▼' : '='}${Math.abs(dl) >= 0.05 ? ' ' + num(Math.abs(dl)) : ''}</span>` : ''}</small>` : ''}</span>`;
        })).join('');
        $('ap-evol').innerHTML = !RS.length && !filasEv ? '<div class="mx-empty" style="padding:30px 10px">Sin opiniones en el período.</div>'
          : `<div class="ap-graf ap-ev">${filasEv}
            <span></span><span class="ap-ev-x">${sems.length ? `<span>${esc(fCorta(sems[0]))}</span><span>semanas</span><span>${esc(fCorta(sems.at(-1)))}</span>` : ''}</span><span></span></div>`;
        // Opiniones del período
        const vis = RP.filter(r => !estr || (estr === 'r' ? !!r.respuesta : estr === '12' ? r.estrellas && r.estrellas <= 2 : estr === '45' ? r.estrellas >= 4 : r.estrellas === 3));
        ULT = { vis, RP, M, TS };
        const ini = (pag - 1) * 20; if (ini >= vis.length && pag > 1) { pag = 1; return pintar(); }
        $('ap-rev').innerHTML = (imprimiendo ? vis : vis.slice(ini, ini + 20)).map(r => { const a = app(r.app_id); return `<tr style="box-shadow:inset 3px 0 0 ${a.c}"><td class="nw mx-mono" style="color:var(--ink-2)">${esc(r.fecha ? fLarga(fechaART(r.fecha)) : '—')}</td>
            <td class="nw"><span class="ap-app">${icono(a, true)}<span><b>${esc(a.nombre)}</b>${r.version ? `<div class="mx-small">v${esc(r.version)}</div>` : ''}</span></span></td><td class="nw">${so(r.tienda)}</td>
            <td class="nw">${r.estrellas ? est(r.estrellas) : '—'}</td><td class="nw"><span class="mx-badge ${r.tema === 'General' ? 'neutral' : /Fraude|Token|Ingreso/.test(r.tema || '') ? 'alta' : 'media'}">${esc(r.tema || 'General')}</span></td>
            <td style="min-width:320px">${r.titulo ? `<b>${esc(r.titulo)}</b> · ` : ''}${esc(r.texto || '')}${r.respuesta ? `<div class="mx-small" style="margin-top:6px;border-left:3px solid var(--primary);padding-left:8px"><b>Respuesta del banco:</b> ${esc(r.respuesta)}</div>` : ''}
            <div class="mx-small" style="margin-top:4px">${esc(r.autor || '')}</div></td></tr>`; }).join('')
          || `<tr><td colspan="6" class="mx-empty">${R.length ? 'No hay opiniones con estos filtros en el período.' : 'Todavía no se leyeron opiniones. Se cargan en la próxima lectura automática o con "Actualizar ahora".'}</td></tr>`;
        if (vis.length > 20 && !imprimiendo) paginar($('ap-pag'), vis.length, 20, pag, n => { pag = n; pintar(); $('ap-rev').closest('section').scrollIntoView({ block: 'start', behavior: 'smooth' }); }); else $('ap-pag').innerHTML = '';
        $('ap-exp').onclick = () => csv('opiniones-apps', ['Fecha', 'App', 'Sistema', 'Estrellas', 'Tema', 'Título', 'Opinión', 'Versión', 'Autor', 'Respuesta del banco'],
          vis.map(r => [r.fecha ? fechaART(r.fecha) : '', app(r.app_id).nombre, r.tienda === 'play' ? 'Android (Google Play)' : 'iOS (App Store)', r.estrellas || '', r.tema || '', r.titulo || '', r.texto || '', r.version || '', r.autor || '', r.respuesta || '']));
      }
      // Exportar a Excel: resumen por app, opiniones del período (con los filtros), opiniones por mes y temas
      const descTxt = () => [`Período: ${perTxt()}`, `Sistema: ${tienda ? TN[tienda] : 'Android e iOS'}`, `App: ${appSel ? app(appSel).nombre : 'todas'}`,
        `Estrellas: ${{ '': 'todas', '12': '1–2', '3': '3', '45': '4–5', r: 'con respuesta del banco' }[estr]}`].join(' · ');
      $('ap-xls').addEventListener('click', async () => {
        const b = $('ap-xls'); b.disabled = true;
        try {
          await cargarXLSX(); const X = window.XLSX, wb = X.utils.book_new();
          const hoja = (nombre, filas, anchos, filtro) => { const ws = X.utils.aoa_to_sheet(filas, { cellDates: true }); ws['!cols'] = anchos.map(w => ({ wch: w }));
            if (filtro) ws['!autofilter'] = { ref: ws['!ref'] }; X.utils.book_append_sheet(wb, ws, nombre); return ws; };
          const res = [['App', 'Sistema', 'Calificación actual', 'Cantidad de calificaciones', 'Variación 30 días', 'Versión', `Opiniones (${perTxt()})`, 'Promedio de estrellas del período', 'Opiniones de 1–2 ★', 'Tema principal']];
          A.forEach(a => ULT.TS.forEach(t => { const u = ultima(a.id, t), h = hace(a.id, t, 30), v = L.filter(y => y.app_id === a.id && y.tienda === t && y.version).slice(-1)[0];
            const rs = R.filter(r => r.app_id === a.id && r.tienda === t && enPer(r)), ce = rs.filter(r => r.estrellas);
            res.push([a.nombre, t === 'play' ? 'Android' : 'iOS', u ? Math.round(u.rating * 100) / 100 : '', u ? u.cantidad || 0 : '', u && h ? Math.round((u.rating - h.rating) * 10) / 10 : '',
              v ? v.version : '', rs.length, ce.length ? Math.round(ce.reduce((s, r) => s + r.estrellas, 0) / ce.length * 10) / 10 : '', rs.filter(r => r.estrellas && r.estrellas <= 2).length, rs.length ? modo(rs.map(r => r.tema)) : '']); }));
          hoja('Resumen', res, [28, 9, 12, 14, 12, 12, 16, 16, 12, 22], true);
          hoja('Opiniones', [['Fecha', 'App', 'Sistema', 'Estrellas', 'Tema', 'Título', 'Opinión', 'Versión', 'Autor', 'Respuesta del banco', 'Fecha de la respuesta']]
            .concat(ULT.vis.map(r => [r.fecha ? new Date(fechaART(r.fecha) + 'T12:00:00') : '', app(r.app_id).nombre, r.tienda === 'play' ? 'Android' : 'iOS', r.estrellas || '', r.tema || '', r.titulo || '', r.texto || '',
              r.version || '', r.autor || '', r.respuesta || '', r.respuesta_fecha ? new Date(fechaART(r.respuesta_fecha) + 'T12:00:00') : ''])), [11, 26, 9, 9, 18, 26, 80, 10, 18, 50, 12], true);
          hoja('Por mes', [['Mes', 'Opiniones', '1–2 ★', '3 ★', '4–5 ★']].concat(ULT.M.filter(x => x.n).map(x => [`${MES[+x.k.slice(5) - 1]} ${x.k.slice(0, 4)}`, x.n, x.b, x.m, x.a])), [16, 10, 8, 8, 8]);
          const ct = {}; ULT.RP.forEach(r => { ct[r.tema || 'General'] = (ct[r.tema || 'General'] || 0) + 1; });
          hoja('Temas', [['Tema', 'Opiniones', '% del período']].concat(Object.entries(ct).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n, Math.round(n / ULT.RP.length * 1000) / 10])), [26, 10, 12]);
          hoja('Información', [['Monitor de Riesgo · Apps del banco'], [], ['Generado', fHora(new Date().toISOString())], ['Filtros', descTxt()], ['Última lectura de las tiendas', ult ? fHora(ult.fecha) : '—'], [],
            ['Fuente: Google Play y App Store (Argentina). Las opiniones se clasifican por tema con palabras clave.']], [30, 80]);
          X.writeFile(wb, `apps-opiniones-${per}-${hoyISO()}.xlsx`, { compression: true });
        } catch (err) { window.alert(err.message); }
        b.disabled = false;
      });
      // Imprimir / PDF: muestra todas las opiniones del período, no solo la página actual
      const prepImp = () => { imprimiendo = true; $('ap-print-t').textContent = `${descTxt()} · Generado ${fHora(new Date().toISOString())}`; pintar(); };
      const finImp = () => { if (!imprimiendo) return; imprimiendo = false; pintar(); };
      window.addEventListener('beforeprint', prepImp); window.addEventListener('afterprint', finImp);
      $('ap-imp').addEventListener('click', () => { prepImp(); setTimeout(() => window.print(), 50); });
      $('ap-per').addEventListener('change', () => { pag = 1; per = $('ap-per').value; grabarLS('mx-ap-per', per); pintar(); });
      $('ap-tienda').addEventListener('click', ev => { const b = ev.target.closest('[data-t]'); if (!b) return; pag = 1; tienda = b.dataset.t; $('ap-tienda').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
      $('ap-est').addEventListener('click', ev => { const b = ev.target.closest('[data-e]'); if (!b) return; pag = 1; estr = b.dataset.e; $('ap-est').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
      $('ap-app').addEventListener('change', () => { pag = 1; appSel = $('ap-app').value; pintar(); });
      $('ap-act').addEventListener('click', async () => {
        const b = $('ap-act'); b.disabled = true; b.textContent = 'Leyendo las tiendas…';
        try {
          const r = await fetch(`${SB.url}/functions/v1/monitor-apps`, { method: 'POST', headers: { apikey: SB.anonKey, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: '{}' });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || j.message || `HTTP ${r.status}`);
          location.reload();
        } catch (err) { b.disabled = false; b.textContent = 'Actualizar ahora'; window.alert('No se pudo leer las tiendas: ' + err.message); }
      });
      pintar();
    },

    async reputacion() {
      if (!usaSupabase) { $('rp-kpis').innerHTML = '<div class="mx-empty">La sección Reputación funciona solo con la base de Supabase.</div>'; return; }
      const PRI = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja' }, PRK = { critica: 0, alta: 1, media: 2, baja: 3 };
      const EST = { nueva: 'Nueva', en_verificacion: 'En verificación', seguimiento: 'En seguimiento', confirmada: 'Confirmada', descartada: 'Descartada' };
      const NAT = { no_verificado: 'Contenido no verificado', publicacion: 'Publicación periodística', denuncia: 'Denuncia', sospecha: 'Sospecha', comunicado_oficial: 'Comunicado oficial', hecho_confirmado: 'Hecho confirmado' };
      const ORG = { gdelt: 'GDELT', gnews: 'Google News', rss: 'RSS de medios', manual: 'Carga manual', importado: 'Importado' };
      const RUN = { ok: 'Correcta', sin_resultados: 'Sin resultados', error: 'Error', limitado: 'Limitada (429)', omitida: 'Omitida' };
      const TIPOF = { oficial: 'Oficial', medio_nacional: 'Medio nacional', medio_regional: 'Medio regional', medio_internacional: 'Medio internacional', especializado: 'Especializado', blog_foro: 'Blog o foro', desconocido: 'Desconocido' };
      let AL, CAT, CON, RUNS, FU, CFG;
      const cargar = async () => {
        [AL, CAT, CON, RUNS, FU, CFG] = await Promise.all([
          sbFetch('monitor_rep_alertas?select=*&order=detectado.desc&limit=5000'), sbFetch('monitor_rep_categorias?select=*&order=orden.asc'),
          sbFetch('monitor_rep_consultas?select=*&order=id.asc'), sbFetch('monitor_rep_corridas?select=*&order=inicio.desc&limit=400'),
          sbFetch('monitor_rep_fuentes?select=*&order=dominio.asc'), sbFetch('monitor_rep_config?select=*')]);
      };
      try { await cargar(); }
      catch (err) {
        if (err && err.sinSesion) throw err;
        $('rp-kpis').innerHTML = '<div class="mx-empty" style="grid-column:1/-1">Todavía no están creadas las tablas de Reputación. Ejecutá sql/2026-10-31_reputacion.sql en Supabase &gt; SQL Editor.</div>'; return;
      }
      const ENT = () => (CFG.find(c => c.id === 'entidad') || {}).valor || {};
      const PRC = () => (CFG.find(c => c.id === 'prioridad') || {}).valor || {};
      $('rp-ent').textContent = ENT().nombre || 'Entidad monitoreada';
      const catN = id => (CAT.find(c => c.id === id) || {}).nombre || id || '—';
      const pri = a => a.prioridad_analista || a.prioridad;
      const prB = a => `<span class="pr ${pri(a)}${a.prioridad_analista ? ' analista' : ''}" title="${a.prioridad_analista ? 'Prioridad fijada por un analista' : `Prioridad preliminar automática · puntaje ${a.puntaje ?? '—'}`}">${PRI[pri(a)]}${a.prioridad_analista ? ' ✓' : ''}</span>`;
      const fpub = a => a.fecha_pub || a.detectado;
      const gid = a => a.grupo || a.id;
      const fuentesGrupo = a => new Set(AL.filter(x => gid(x) === gid(a)).map(x => x.dominio || x.fuente)).size;
      const hue = t => [...String(t)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
      const srcB = a => { const n = a.fuente || a.dominio || '—'; return `<span class="rp-src"><span class="rp-av" style="--h:${hue(n)}">${esc(n.replace(/^(www\.|el |la |diario )/i, '')[0] || '·').toUpperCase()}</span>${esc(n)}</span>`; };
      const editor = esAnalista(), admin = esAdmin();
      if (!editor) { $('rp-run').hidden = true; $('rp-nueva').hidden = true; }
      if (!admin) $('rp-tab-config').hidden = true;
      const ult = RUNS[0]; $('rp-ult').textContent = `Última recopilación · ${ult ? fHora(ult.inicio) : 'todavía no hubo'}`;
      // ---------- pestañas ----------
      const irTab = t => { document.querySelectorAll('#rp-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== t; }); grabarLS('mx-rp-tab', t); };
      $('rp-tabs').addEventListener('click', ev => { const b = ev.target.closest('[data-tab]'); if (b) irTab(b.dataset.tab); });
      // ---------- filtros ----------
      const F = { q: '', cat: '', pri: '', est: '', nat: '', org: '', fte: '', desde: '', hasta: '', det: '', grp: false };
      $('rf-cat').innerHTML = '<option value="">Todas las categorías</option>' + CAT.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('');
      $('rf-nat').innerHTML = '<option value="">Toda naturaleza</option>' + Object.entries(NAT).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
      $('rf-ftes').innerHTML = [...new Set(AL.map(a => a.fuente).filter(Boolean))].sort().map(f => `<option value="${esc(f)}">`).join('');
      const filtrar = () => AL.filter(a => {
        const f = fechaART(fpub(a));
        if (F.q && !low([a.titulo, a.resumen, a.fuente, a.dominio, a.codigo, a.observaciones].join(' ')).includes(low(F.q))) return false;
        if (F.cat && a.categoria !== F.cat) return false;
        if (F.pri && pri(a) !== F.pri) return false;
        if (F.est && (F.est === 'pend' ? !['nueva', 'en_verificacion'].includes(a.estado) : a.estado !== F.est)) return false;
        if (F.nat && a.naturaleza !== F.nat) return false;
        if (F.org && a.origen !== F.org) return false;
        if (F.fte && !low(`${a.fuente} ${a.dominio}`).includes(low(F.fte))) return false;
        if (F.desde && f < F.desde) return false; if (F.hasta && f > F.hasta) return false;
        if (F.det && fechaART(a.detectado) !== F.det) return false;
        return true;
      }).sort((x, y) => (PRK[pri(x)] - PRK[pri(y)]) * 0 || String(fpub(y)).localeCompare(String(fpub(x))));
      let pag = 1;
      function pintarAlertas() {
        let L = filtrar();
        if (F.grp) { const vistos = new Set(); L = L.filter(a => { const g = gid(a); if (vistos.has(g)) return false; vistos.add(g); return true; }); }
        $('rp-al-n').textContent = `${L.length} ${F.grp ? 'acontecimientos' : 'alertas'}`;
        const ini = (pag - 1) * 25; if (ini >= L.length && pag > 1) { pag = 1; return pintarAlertas(); }
        $('rp-al').innerHTML = L.slice(ini, ini + 25).map(a => `<tr data-id="${a.id}" class="pc-${pri(a)}" style="cursor:pointer">
            <td class="nw mx-mono" style="color:var(--ink-2)">${esc(fLarga(fechaART(fpub(a))))}</td><td class="nw">${prB(a)}</td>
            <td class="tit">${esc(a.titulo)}<div class="mx-small" style="margin-top:3px">${srcB(a)} · <span class="mx-mono">${esc(a.codigo)}</span>${a.posible_relacion ? ' · <b style="color:var(--media)">posible relación</b>' : ''}</div></td>
            <td class="nw">${esc(catN(a.categoria))}</td><td class="nw mx-small">${esc(NAT[a.naturaleza] || '')}</td>
            <td class="nw"><span class="rp-st ${a.estado}">${EST[a.estado]}</span></td><td class="nw mx-mono" style="text-align:center">${fuentesGrupo(a)}</td></tr>`).join('')
          || `<tr><td colspan="7" class="mx-empty">${AL.length ? 'No hay alertas con estos filtros.' : 'Todavía no hay alertas. Se registran con la próxima recopilación o con "Ejecutar ahora".'}</td></tr>`;
        if (L.length > 25) paginar($('rp-pag'), L.length, 25, pag, n => { pag = n; pintarAlertas(); }); else $('rp-pag').innerHTML = '';
        $('rp-csv').onclick = () => csv(`reputacion-alertas`, ['Código', 'Entidad', 'Fecha de publicación', 'Fecha de detección', 'Última actualización', 'Título', 'Resumen', 'Fuente', 'Dominio', 'URL', 'Categoría',
          'Palabras coincidentes', 'Idioma', 'País', 'Confiabilidad de la fuente', 'Relevancia', 'Impacto', 'Puntaje', 'Prioridad preliminar', 'Prioridad del analista', 'Motivo', 'Estado', 'Naturaleza',
          'Acontecimiento', 'Fuentes del acontecimiento', 'Evidencias', 'Analista', 'Observaciones', 'Origen'],
          L.map(a => [a.codigo, a.entidad, fechaART(fpub(a)), fHora(a.detectado), fHora(a.actualizado), a.titulo, a.resumen || '', a.fuente || '', a.dominio || '', a.url || '', catN(a.categoria),
            (a.palabras || []).join(', '), a.idioma || '', a.pais || '', a.f_confiabilidad ?? '', a.f_relevancia ?? '', a.f_impacto ?? '', a.puntaje ?? '', PRI[a.prioridad], a.prioridad_analista ? PRI[a.prioridad_analista] : '',
            a.motivo_prioridad || '', EST[a.estado], NAT[a.naturaleza], (AL.find(x => x.id === gid(a)) || a).codigo, fuentesGrupo(a), (a.evidencias || []).map(e => e.url).join(' | '), a.analista || '', a.observaciones || '', ORG[a.origen]]));
      }
      const enlazar = (id, k, ev) => $(id).addEventListener(ev || 'input', () => { F[k] = $(id).type === 'checkbox' ? $(id).checked : $(id).value; pag = 1; pintarAlertas(); });
      [['rf-q', 'q'], ['rf-fte', 'fte']].forEach(([i, k]) => enlazar(i, k));
      [['rf-cat', 'cat'], ['rf-pri', 'pri'], ['rf-est', 'est'], ['rf-nat', 'nat'], ['rf-org', 'org'], ['rf-desde', 'desde'], ['rf-hasta', 'hasta'], ['rf-grp', 'grp']].forEach(([i, k]) => enlazar(i, k, 'change'));
      $('rf-limpiar').addEventListener('click', () => { Object.keys(F).forEach(k => { F[k] = k === 'grp' ? false : ''; }); ['rf-q', 'rf-cat', 'rf-pri', 'rf-est', 'rf-nat', 'rf-org', 'rf-fte', 'rf-desde', 'rf-hasta'].forEach(i => { $(i).value = ''; }); $('rf-grp').checked = false; pintarAlertas(); });
      const filtrarDesdePanel = (k, v) => { Object.keys(F).forEach(x => { F[x] = x === 'grp' ? false : ''; }); F[k] = v; ['rf-q', 'rf-cat', 'rf-pri', 'rf-est', 'rf-nat', 'rf-org', 'rf-fte', 'rf-desde', 'rf-hasta'].forEach(i => { $(i).value = ''; });
        const ids = { cat: 'rf-cat', pri: 'rf-pri', est: 'rf-est', fte: 'rf-fte', desde: 'rf-desde', q: 'rf-q' }; if (ids[k]) $(ids[k]).value = v; pag = 1; pintarAlertas(); irTab('alertas'); };
      // ---------- panel ----------
      function pintarPanel() {
        const hoy = hoyISO(), vivas = AL.filter(a => a.estado !== 'descartada'), pend = AL.filter(a => ['nueva', 'en_verificacion'].includes(a.estado));
        $('rp-n-pend').textContent = pend.length;
        $('rp-n-pend').classList.toggle('cero', !pend.length);
        const KI = { tot: '<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/>', hoy: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', pen: '<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
          con: '<path d="M20 6L9 17l-5-5"/>', des: '<path d="M18 6L6 18M6 6l12 12"/>' };
        const K = [['Total de alertas', AL.length, `${new Set(AL.map(gid)).size} acontecimientos distintos`, 'q', '', 'k-blue', 'tot'],
          ['Nuevas del día', AL.filter(a => fechaART(a.detectado) === hoy).length, 'detectadas hoy', 'det', hoy, 'k-ok', 'hoy'],
          ['Pendientes', pend.length, 'nuevas o en verificación', 'est', 'pend', 'k-amb', 'pen'],
          ['Confirmadas', AL.filter(a => a.estado === 'confirmada').length, 'por un analista', 'est', 'confirmada', 'k-red', 'con'],
          ['Descartadas', AL.filter(a => a.estado === 'descartada').length, 'con historial', 'est', 'descartada', 'k-gray', 'des']];
        $('rp-kpis').innerHTML = K.map(k => `<button type="button" class="rp-kpi ${k[5]}" data-k="${k[3]}" data-v="${k[4]}"><span class="kh"><span>${k[0]}</span><span class="ki"><svg class="mx-ico" viewBox="0 0 24 24">${KI[k[6]]}</svg></span></span><b>${k[1]}</b><small>${esc(k[2])}</small></button>`).join('');
        $('rp-kpis').querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => filtrarDesdePanel(b.dataset.k, b.dataset.v)));
        const barras = (cont, filas, k, col) => { const mx = Math.max(1, ...filas.map(f => f[1]));
          $(cont).innerHTML = filas.map(f => `<div class="rp-bar"><button type="button" data-v="${esc(f[2] ?? f[0])}">${esc(f[0])}</button><span class="b"><i style="width:${Math.max(2, f[1] / mx * 100)}%;--bc:${f[3] || col || 'var(--primary)'}"></i></span><b class="mx-mono">${f[1]}</b></div>`).join('') || '<div class="mx-empty">Sin datos.</div>';
          $(cont).querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => filtrarDesdePanel(k, b.dataset.v))); };
        { const PC = { critica: 'var(--lv-critico)', alta: 'var(--lv-elevado)', media: 'var(--media)', baja: 'var(--baja)' };
          const D = ['critica', 'alta', 'media', 'baja'].map(p => [p, vivas.filter(a => pri(a) === p).length]), tot = D.reduce((s, d) => s + d[1], 0), R = 52, C = 2 * Math.PI * R;
          let acc = 0;
          const segs = tot ? D.filter(d => d[1]).map(([p, n]) => { const l = n / tot * C, g = D.filter(d => d[1]).length > 1 ? 2 : 0;
            const el = `<circle class="seg" data-v="${p}" cx="70" cy="70" r="${R}" fill="none" stroke="${PC[p]}" stroke-width="16" stroke-dasharray="${Math.max(0, l - g)} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 70 70)"><title>${PRI[p]}: ${n}</title></circle>`; acc += l; return el; }).join('') : '';
          $('rp-prio').innerHTML = `<div class="rp-dona"><svg viewBox="0 0 140 140" role="img" aria-label="Alertas por prioridad"><circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--soft-2)" stroke-width="16"/>${segs}
            <text x="70" y="72" text-anchor="middle" class="c-n">${tot}</text><text x="70" y="90" text-anchor="middle" class="c-t">alertas</text></svg>
            <div class="rp-dleg">${D.map(([p, n]) => `<button type="button" data-v="${p}"><i style="background:${PC[p]}"></i><span>${PRI[p]}</span><b>${n}</b></button>`).join('')}</div></div>`;
          $('rp-prio').querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => filtrarDesdePanel('pri', b.dataset.v))); }
        const cc = {}; vivas.forEach(a => { cc[a.categoria] = (cc[a.categoria] || 0) + 1; });
        $('rp-cat-n').textContent = `${vivas.length} alertas sin descartar`;
        barras('rp-cat', Object.entries(cc).sort((a, b) => b[1] - a[1]).map(([k, n]) => [catN(k), n, k]), 'cat');
        const fc = {}; AL.forEach(a => { const f = a.fuente || a.dominio || '—'; fc[f] = (fc[f] || 0) + 1; });
        barras('rp-fte', Object.entries(fc).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => [k, n, k]), 'fte', 'var(--ok)');
        const e = ENT(), mc = {}, rx = t => new RegExp('(^|[^a-z0-9ñ])' + sinTilde(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9ñ])');
        [['Entidad', e.terminos || []], ['Producto o servicio', e.productos || []], ['Proveedor', e.proveedores || []], ['Dominio oficial', e.dominios || []]].forEach(([g, ts]) => ts.forEach(t => {
          const r = rx(t), n = AL.filter(a => r.test(sinTilde(`${a.titulo} ${a.resumen || ''} ${a.url || ''}`))).length; if (n) mc[`${t} · ${g}`] = [n, t]; }));
        barras('rp-marcas', Object.entries(mc).sort((a, b) => b[1][0] - a[1][0]).slice(0, 10).map(([k, v]) => [k, v[0], v[1]]), 'q', 'var(--media)');
        const seg = AL.filter(a => a.estado === 'seguimiento' || (['nueva', 'en_verificacion'].includes(a.estado) && ['alta', 'critica'].includes(pri(a)))).sort((x, y) => PRK[pri(x)] - PRK[pri(y)]).slice(0, 8);
        $('rp-seg').innerHTML = seg.length ? `<div class="rp-items">${seg.map(a => `<div class="rp-item pc-${pri(a)}" data-id="${a.id}"><span class="t">${esc(a.titulo)}</span><span class="rp-st ${a.estado}">${EST[a.estado]}</span>
            <span class="m">${prB(a)}${srcB(a)}<span>· ${esc(fLarga(fechaART(fpub(a))))}</span></span></div>`).join('')}</div>` : '<div class="mx-empty">Nada pendiente de seguimiento.</div>';
        $('rp-seg').querySelectorAll('[data-id]').forEach(x => x.addEventListener('click', () => ficha(x.dataset.id)));
        // evolución 60 días
        const dias = []; for (let i = 59; i >= 0; i--) dias.push(fechaART(new Date(Date.now() - i * 864e5).toISOString()));
        const pub = dias.map(d => AL.filter(a => fechaART(fpub(a)) === d).length), evs = dias.map(d => new Set(AL.filter(a => fechaART(fpub(a)) === d).map(gid)).size);
        const top = Math.max(4, Math.ceil(Math.max(1, ...pub) / 4) * 4), W = 600, H = 190, bw = W / dias.length, y = v => H - 4 - v / top * (H - 14);
        const lin = evs.map((v, i) => [(i + .5) * bw, y(v)]);
        $('rp-evol').className = 'rp-evol';
        $('rp-evol').innerHTML = `<div style="display:grid;grid-template-columns:28px 1fr;gap:6px"><div style="display:flex;flex-direction:column;justify-content:space-between;font-family:var(--mono);font-size:10.5px;color:var(--mute);text-align:right;height:200px;padding:4px 0 0">${[4, 3, 2, 1, 0].map(k => `<span>${top * k / 4}</span>`).join('')}</div>
          <div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Menciones por día">
          <defs><linearGradient id="rp-ar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--alta)" stop-opacity=".22"/><stop offset="1" stop-color="var(--alta)" stop-opacity="0"/></linearGradient></defs>
          ${[0, 1, 2, 3, 4].map(k => `<line class="gl" x1="0" x2="${W}" y1="${y(top * k / 4)}" y2="${y(top * k / 4)}"/>`).join('')}
          ${pub.map((v, i) => v ? `<rect class="bar" x="${i * bw + 1.5}" y="${y(v)}" width="${bw - 3}" height="${H - 4 - y(v)}" rx="2"><title>${fLarga(dias.at(i))}: ${v} publicaciones, ${evs.at(i)} acontecimientos</title></rect>` : '').join('')}
          <path d="M${lin[0][0]},${H - 4} L${lin.map(p => p.join(',')).join(' L')} L${lin.at(-1)[0]},${H - 4}Z" fill="url(#rp-ar)"/>
          <path d="M${lin.map(p => p.join(',')).join(' L')}" fill="none" stroke="var(--alta)" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>
          <div class="rp-ejes"><span>${fCorta(dias.at(0))}</span><span>${fCorta(dias.at(30))}</span><span>hoy</span></div></div></div>`;
      }
      // ---------- ficha de una alerta ----------
      function ficha(id) {
        const a = AL.find(x => x.id === id); if (!a) return;
        cerrarFicha();
        const grp = AL.filter(x => gid(x) === gid(a) && x.id !== a.id), rel = a.posible_relacion ? AL.find(x => x.id === a.posible_relacion) : null;
        const fac = [['Impacto de la categoría', a.f_impacto, (PRC().pesos || {}).impacto ?? .3], ['Relevancia para la entidad', a.f_relevancia, (PRC().pesos || {}).relevancia ?? .2], ['Confiabilidad de la fuente', a.f_confiabilidad, (PRC().pesos || {}).confiabilidad ?? .2],
          ['Alcance', a.f_alcance, (PRC().pesos || {}).alcance ?? .1], ['Actualidad', a.f_actualidad, (PRC().pesos || {}).actualidad ?? .1], ['Corroboración independiente', a.f_corroboracion, (PRC().pesos || {}).corroboracion ?? .1]];
        const m = document.createElement('div');
        m.className = 'mx mx-modal'; m.id = 'mx-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
        const sel = (idc, obj, v) => `<select class="mx-select" id="${idc}" ${editor ? '' : 'disabled'}>${Object.entries(obj).map(([k, t]) => `<option value="${k}"${k === v ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
        m.innerHTML = `<div class="mx-dialog" style="max-width:900px">
          <div class="mx-dialog-h ${pri(a) === 'critica' ? 'alta' : ''}"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${prB(a)}<span class="rp-st ${a.estado}">${EST[a.estado]}</span>
            <span class="mx-badge neutral">${esc(catN(a.categoria))}</span><span class="mx-mono" style="color:var(--mute)">${esc(a.codigo)}</span></div>
            <button type="button" class="mx-x" data-cerrar aria-label="Cerrar">${ico('x')}</button></div>
          <div class="mx-dialog-b">
            <h2 class="mx-h2" style="font-size:20px;line-height:27px">${esc(a.titulo)}</h2>
            ${a.resumen ? `<p class="mx-body">${esc(a.resumen)}</p>` : ''}
            <div class="meta3">
              <div class="mx-tile"><span>Fuente</span><b>${esc(a.fuente || '—')}${a.dominio ? ` · ${esc(a.dominio)}` : ''}</b></div>
              <div class="mx-tile"><span>Publicada</span><b>${esc(a.fecha_pub ? fHora(a.fecha_pub) : 'sin fecha en la fuente')}</b></div>
              <div class="mx-tile"><span>Detectada</span><b>${esc(fHora(a.detectado))} · ${esc(ORG[a.origen])}</b></div>
              <div class="mx-tile"><span>Naturaleza (preliminar)</span><b>${esc(NAT[a.naturaleza])}</b></div>
              <div class="mx-tile"><span>Palabras coincidentes</span><b>${esc((a.palabras || []).join(', ') || '—')}</b></div>
              <div class="mx-tile"><span>Idioma · país</span><b>${esc([a.idioma, a.pais].filter(Boolean).join(' · ') || '—')}</b></div>
            </div>
            ${a.url ? `<div><a class="mx-btn primary" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">Abrir la publicación original ${ico('ext', 'width:15px;height:15px')}</a></div>` : ''}
            <div class="mx-g2">
              <div><div class="mx-eyebrow" style="margin-bottom:6px">Cómo se calculó la prioridad preliminar · ${a.puntaje ?? '—'} / 100</div>
                ${a.puntaje != null ? (() => { const pc = { critica: 'var(--lv-critico)', alta: 'var(--lv-elevado)', media: 'var(--media)', baja: 'var(--baja)' }[a.prioridad], C = 2 * Math.PI * 38;
                  return `<div class="rp-score"><svg viewBox="0 0 92 92"><circle cx="46" cy="46" r="38" fill="none" stroke="var(--soft-2)" stroke-width="8"/><circle cx="46" cy="46" r="38" fill="none" stroke="${pc}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C * a.puntaje / 100} ${C}" transform="rotate(-90 46 46)"/>
                    <text x="46" y="50" text-anchor="middle" style="font:700 22px var(--font);fill:var(--ink)">${a.puntaje}</text><text x="46" y="64" text-anchor="middle" style="font:600 9px var(--font);fill:var(--mute)">de 100</text></svg>
                    <div style="flex:1;min-width:0">${fac.map(f => `<div class="rp-fbar"><span>${f[0]}</span><span class="b"><i style="width:${(f[1] || 0) * 100}%"></i></span><em>${Math.round(f[2] * 100)}%</em></div>`).join('')}</div></div>`; })() : '<p class="mx-small">Alerta cargada a mano o importada: sin puntaje automático.</p>'}
                <p class="mx-small" style="margin-top:6px">Es una ayuda para ordenar la revisión, no una medición del riesgo real.</p></div>
              <div><div class="mx-eyebrow" style="margin-bottom:6px">Mismo acontecimiento · ${grp.length + 1} publicaciones de ${fuentesGrupo(a)} fuentes</div>
                ${grp.length ? grp.map(x => `<div class="mx-small" style="margin-bottom:4px">${esc(fLarga(fechaART(fpub(x))))} · <b>${esc(x.fuente || x.dominio || '')}</b> · ${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.titulo)}</a>` : esc(x.titulo)}</div>`).join('') : '<p class="mx-small">Sin otras publicaciones agrupadas.</p>'}
                ${rel ? `<p class="mx-small" style="margin-top:6px;color:var(--media)"><b>Posible relación (sin agrupar):</b> <a href="#" data-ir="${rel.id}">${esc(rel.codigo)} · ${esc(rel.titulo)}</a></p>` : ''}
                ${(a.evidencias || []).length ? `<div class="mx-eyebrow" style="margin:10px 0 6px">Evidencias complementarias</div>${a.evidencias.map(e => `<div class="mx-small">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.url)}</a>` : ''} ${esc(e.nota || '')} <span style="color:var(--mute)">· ${esc(e.por || '')} ${esc(e.fecha ? fHora(e.fecha) : '')}</span></div>`).join('')}` : ''}</div>
            </div>
            <section style="border-top:1px solid var(--div);padding-top:14px">
              <div class="mx-eyebrow" style="margin-bottom:10px">Revisión del analista${a.analista ? ` · última por ${esc(a.analista)}` : ''}</div>
              <div class="mx-form">
                <div><label class="mx-label" for="rv-est">Estado</label>${sel('rv-est', EST, a.estado)}</div>
                <div><label class="mx-label" for="rv-nat">Naturaleza</label>${sel('rv-nat', NAT, a.naturaleza)}</div>
                <div><label class="mx-label" for="rv-cat">Categoría</label>${sel('rv-cat', Object.fromEntries(CAT.map(c => [c.id, c.nombre])), a.categoria)}</div>
                <div><label class="mx-label" for="rv-pri">Prioridad (analista)</label>${sel('rv-pri', Object.assign({ '': `Usar la preliminar (${PRI[a.prioridad]})` }, PRI), a.prioridad_analista || '')}</div>
                <div style="grid-column:1/-1"><label class="mx-label" for="rv-mot">Motivo del cambio de prioridad <em>*</em></label><input class="mx-input" id="rv-mot" value="${esc(a.motivo_prioridad || '')}" ${editor ? '' : 'disabled'} placeholder="Obligatorio si cambiás la prioridad"></div>
                <div style="grid-column:1/-1"><label class="mx-label" for="rv-obs">Observaciones</label><textarea class="mx-textarea" id="rv-obs" ${editor ? '' : 'disabled'} placeholder="Qué se verificó, con quién, qué falta…">${esc(a.observaciones || '')}</textarea></div>
                <div><label class="mx-label" for="rv-ev-u">Agregar evidencia (URL)</label><input class="mx-input" id="rv-ev-u" ${editor ? '' : 'disabled'} placeholder="https://…"></div>
                <div><label class="mx-label" for="rv-ev-n">Nota de la evidencia</label><input class="mx-input" id="rv-ev-n" ${editor ? '' : 'disabled'} placeholder="Ej.: comunicado oficial del banco"></div>
              </div>
              <p class="mx-msg" id="rv-msg" aria-live="polite" style="margin-top:8px">${editor ? '' : 'Solo lectura: tu usuario no tiene rol de analista.'}</p>
              ${editor ? '<div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="mx-btn" data-cerrar>Cancelar</button><button type="button" class="mx-btn primary" id="rv-ok">Guardar revisión</button></div>' : ''}
            </section>
            <section style="border-top:1px solid var(--div);padding-top:14px"><div class="mx-eyebrow" style="margin-bottom:8px">Historial</div><div class="rp-hist" id="rv-hist"><span class="mx-small">Cargando…</span></div></section>
          </div></div>`;
        m.addEventListener('click', ev => { if (ev.target === m || ev.target.closest('[data-cerrar]')) cerrarFicha(); const ir = ev.target.closest('[data-ir]'); if (ir) { ev.preventDefault(); ficha(ir.dataset.ir); } });
        document.body.appendChild(m); document.body.style.overflow = 'hidden';
        const CAMPO = { estado: 'Estado', naturaleza: 'Naturaleza', categoria: 'Categoría', prioridad_analista: 'Prioridad', motivo_prioridad: 'Motivo', observaciones: 'Observaciones', evidencias: 'Evidencias', grupo: 'Acontecimiento', posible_relacion: 'Posible relación', alta: 'Alta', prioridad: 'Prioridad preliminar', tono: 'Tono' };
        const val = (k, v) => v == null || v === '' ? '—' : k === 'estado' ? EST[v] || v : k === 'naturaleza' ? NAT[v] || v : k === 'categoria' ? catN(v) : k === 'prioridad_analista' || k === 'prioridad' ? PRI[v] || v : k === 'evidencias' ? `${v.length} evidencia(s)` : k === 'alta' ? ORG[v] || v : String(v).slice(0, 120);
        sbFetch(`monitor_rep_historial?select=*&alerta_id=eq.${a.id}&order=fecha.desc`).then(H => {
          $('rv-hist').innerHTML = H.map(h => `<div><b>${esc(fHora(h.fecha))}</b> · ${esc(h.nombre || 'sistema')}<div class="mx-small">${Object.keys(h.despues || {}).map(k => `${esc(CAMPO[k] || k)}: ${h.antes ? `${esc(val(k, (h.antes || {})[k]))} → ` : ''}${esc(val(k, h.despues[k]))}`).join(' · ')}${h.motivo ? ` · <i>Motivo: ${esc(h.motivo)}</i>` : ''}</div></div>`).join('') || '<span class="mx-small">Sin cambios registrados.</span>';
        }).catch(() => { $('rv-hist').innerHTML = '<span class="mx-small">No se pudo leer el historial.</span>'; });
        if (!editor) return;
        $('rv-ok').addEventListener('click', async () => {
          const cambios = { estado: $('rv-est').value, naturaleza: $('rv-nat').value, categoria: $('rv-cat').value, prioridad_analista: $('rv-pri').value || null,
            motivo_prioridad: $('rv-mot').value.trim() || null, observaciones: $('rv-obs').value.trim() };
          const eu = $('rv-ev-u').value.trim(), en = $('rv-ev-n').value.trim(), msg = $('rv-msg');
          if (eu && !/^https?:\/\/[^\s]+\.[^\s]+/.test(eu)) { msg.className = 'mx-msg err'; msg.textContent = 'La evidencia tiene que ser una dirección web (https://…).'; return; }
          if ((cambios.prioridad_analista || null) !== (a.prioridad_analista || null) && !cambios.motivo_prioridad) { msg.className = 'mx-msg err'; msg.textContent = 'Escribí el motivo del cambio de prioridad.'; $('rv-mot').focus(); return; }
          if (eu || en) cambios.evidencias = (a.evidencias || []).concat([{ url: eu, nota: en, por: (PERFIL || {}).nombre || '', fecha: new Date().toISOString() }]);
          msg.className = 'mx-msg'; msg.textContent = 'Guardando…'; $('rv-ok').disabled = true;
          try {
            const r = await sbFetch(`monitor_rep_alertas?id=eq.${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(cambios) });
            if (!r || !r.length) throw new Error('No tenés permiso para revisar alertas (se requiere rol de analista).');
            Object.assign(a, r[0]); cerrarFicha(); pintarTodo(); ficha(a.id);
          } catch (err) { msg.className = 'mx-msg err'; msg.textContent = errBase(err); $('rv-ok').disabled = false; }
        });
      }
      $('rp-al').addEventListener('click', ev => { const tr = ev.target.closest('[data-id]'); if (tr) ficha(tr.dataset.id); });
      // ---------- alta manual ----------
      $('rp-nueva').addEventListener('click', () => {
        cerrarFicha();
        const m = document.createElement('div'); m.className = 'mx mx-modal'; m.id = 'mx-modal'; m.setAttribute('role', 'dialog');
        m.innerHTML = `<div class="mx-dialog" style="max-width:640px"><div class="mx-dialog-h"><b class="mx-h3">Registrar una alerta manualmente</b><button type="button" class="mx-x" data-cerrar aria-label="Cerrar">${ico('x')}</button></div>
          <form class="mx-dialog-b" id="na-f" novalidate><p class="mx-small" style="margin:0">Entra como <b>nueva</b>, sin verificar, firmada con tu nombre. Usala para fuentes que no se leen automáticamente (BCRA, Boletín Oficial, redes, reclamos).</p>
          <div class="mx-form"><div style="grid-column:1/-1"><label class="mx-label">Título <em>*</em></label><input class="mx-input" id="na-t" maxlength="300" required></div>
          <div style="grid-column:1/-1"><label class="mx-label">Dirección de la publicación original</label><input class="mx-input" id="na-u" placeholder="https://…"></div>
          <div><label class="mx-label">Fuente</label><input class="mx-input" id="na-f2" placeholder="Medio u organismo"></div>
          <div><label class="mx-label">Fecha de publicación</label><input class="mx-input" id="na-d" type="date" max="${hoyISO()}" value="${hoyISO()}"></div>
          <div><label class="mx-label">Categoría</label><select class="mx-select" id="na-c">${CAT.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('')}</select></div>
          <div><label class="mx-label">Naturaleza</label><select class="mx-select" id="na-n">${Object.entries(NAT).filter(([k]) => k !== 'hecho_confirmado').map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
          <div><label class="mx-label">Prioridad</label><select class="mx-select" id="na-p">${Object.entries(PRI).map(([k, v]) => `<option value="${k}"${k === 'media' ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
          <div style="grid-column:1/-1"><label class="mx-label">Resumen</label><textarea class="mx-textarea" id="na-r"></textarea></div></div>
          <p class="mx-msg" id="na-m"></p><div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="mx-btn" data-cerrar>Cancelar</button><button type="submit" class="mx-btn primary" id="na-ok">Registrar</button></div></form></div>`;
        m.addEventListener('click', ev => { if (ev.target === m || ev.target.closest('[data-cerrar]')) cerrarFicha(); });
        document.body.appendChild(m); document.body.style.overflow = 'hidden'; $('na-t').focus();
        $('na-f').addEventListener('submit', async ev => {
          ev.preventDefault(); const t = $('na-t').value.trim(), u = $('na-u').value.trim();
          if (t.length < 8) { $('na-m').className = 'mx-msg err'; $('na-m').textContent = 'Escribí un título de al menos 8 caracteres.'; return; }
          if (u && !/^https?:\/\/[^\s]+\.[^\s]+/.test(u)) { $('na-m').className = 'mx-msg err'; $('na-m').textContent = 'La dirección tiene que empezar con https://'; return; }
          let dom = ''; try { dom = u ? new URL(u).hostname.replace(/^www\./, '') : ''; } catch (e) { /* sin dominio */ }
          $('na-ok').disabled = true;
          try {
            const r = await sbFetch('monitor_rep_alertas', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({
              titulo: t, url: u || null, url_norm: u ? `manual:${u}` : null, fuente: $('na-f2').value.trim() || dom || null, dominio: dom || null, fecha_pub: $('na-d').value ? new Date($('na-d').value + 'T12:00:00-03:00').toISOString() : null,
              categoria: $('na-c').value, naturaleza: $('na-n').value, prioridad: $('na-p').value, resumen: $('na-r').value.trim() || null, entidad: ENT().nombre || undefined }) });
            AL.unshift(r[0]); cerrarFicha(); pintarTodo(); ficha(r[0].id);
          } catch (err) { $('na-ok').disabled = false; $('na-m').className = 'mx-msg err'; $('na-m').textContent = /duplicate|unique/i.test(err.message) ? 'Esa dirección ya está registrada.' : errBase(err); }
        });
      });
      // ---------- ejecutar ----------
      const ejecutar = async (cuerpo, b) => {
        const sp = b.querySelector('span') || b, txt = sp.textContent; b.disabled = true; b.classList.add('girando'); sp.textContent = 'Consultando fuentes…';
        try {
          const r = await fetch(`${SB.url}/functions/v1/monitor-reputacion`, { method: 'POST', headers: { apikey: SB.anonKey, Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || j.message || `HTTP ${r.status}`);
          await cargar(); pintarTodo();
          window.alert(j.omitido ? j.omitido : `Listo: ${j.consultas} consultas. ${(j.resultados || []).reduce((s, x) => s + x.nuevos, 0)} alertas nuevas. ${(j.resultados || []).filter(x => x.estado === 'error' || x.estado === 'limitado').length} con error o límite (ver "Fuentes y ejecuciones").`);
        } catch (err) { window.alert('No se pudo ejecutar: ' + err.message); }
        b.disabled = false; b.classList.remove('girando'); sp.textContent = txt;
      };
      $('rp-run').addEventListener('click', () => ejecutar({ todas: true }, $('rp-run')));
      // ---------- fuentes y ejecuciones ----------
      function pintarFuentes() {
        const act = CON.filter(c => c.activa), ult = c => RUNS.find(x => x.consulta_id === c.id), cuenta = e => act.filter(c => (ult(c) || {}).estado === e).length;
        const nOk = cuenta('ok') + cuenta('sin_resultados'), nLim = cuenta('limitado') + cuenta('omitida'), nErr = cuenta('error');
        $('rp-salud').innerHTML = `<i class="${nErr ? 'ro' : nLim ? 'am' : ''}"></i>Fuentes · ${nOk}/${act.length} respondieron${nLim ? ` · ${nLim} limitada${nLim > 1 ? 's' : ''}` : ''}${nErr ? ` · ${nErr} con error` : ''}`;
        $('rp-salud-g').innerHTML = CON.map(c => { const r = ult(c);
          return `<div class="rp-fc ${r ? 'fc-' + r.estado : ''}${c.activa ? '' : ' off'}"><div class="h"><b>${esc(c.nombre)}</b>${r ? `<span class="rp-run ${r.estado}">${RUN[r.estado]}</span>` : `<span class="rp-run sin_resultados">${c.activa ? 'Nunca' : 'Apagada'}</span>`}</div>
            <div class="mx-small">${esc(ORG[c.fuente])} · cada ${c.cada_horas} h${r ? ` · ${esc(fHora(r.inicio))}` : ''}</div>
            ${r ? `<div class="n"><span><b>${r.recuperados}</b> leídas</span><span><b>${r.relevantes}</b> relevantes</span><span><b>${r.nuevos}</b> nuevas</span></div>` : ''}</div>`; }).join('');
        $('rp-cons').innerHTML = CON.map(c => { const r = RUNS.find(x => x.consulta_id === c.id);
          return `<tr><td><b>${esc(c.nombre)}</b>${c.activa ? '' : ' <span class="mx-badge neutral">apagada</span>'}${c.nota ? `<div class="mx-small">${esc(c.nota)}</div>` : ''}</td><td class="nw">${esc(ORG[c.fuente])}</td><td class="nw">cada ${c.cada_horas} h</td>
            <td class="nw mx-mono">${r ? esc(fHora(r.inicio)) : '—'}</td><td class="nw">${r ? `<span class="rp-run ${r.estado}">${RUN[r.estado]}</span>` : '<span class="mx-small">nunca</span>'}</td>
            <td class="nw mx-mono">${r ? `${r.recuperados} / ${r.relevantes} / ${r.nuevos}` : '—'}</td><td class="nw">${editor && c.activa ? `<button type="button" class="mx-btn sm" data-run="${c.id}">Ejecutar</button>` : ''}</td></tr>`; }).join('');
        $('rp-cons').querySelectorAll('[data-run]').forEach(b => b.addEventListener('click', () => ejecutar({ consulta_id: +b.dataset.run }, b)));
        $('rp-runs').innerHTML = RUNS.slice(0, 50).map(r => `<tr><td class="nw mx-mono">${esc(fHora(r.inicio))}</td><td>${esc(r.nombre || '')}<div class="mx-small">${esc(r.disparada_por)}</div></td><td class="nw"><span class="rp-run ${r.estado}">${RUN[r.estado]}</span></td>
            <td class="nw mx-mono">${r.http ?? '—'}</td><td class="mx-mono">${r.recuperados}</td><td class="mx-mono">${r.relevantes}</td><td class="mx-mono">${r.nuevos}</td><td class="mx-mono">${r.duplicados}</td><td class="mx-small" style="max-width:320px">${esc(r.error || '')}</td></tr>`).join('')
          || '<tr><td colspan="9" class="mx-empty">Todavía no hubo ejecuciones.</td></tr>';
      }
      // ---------- configuración (administradores) ----------
      const guardar = async (tabla, filtro, cuerpo, metodo) => sbFetch(`${tabla}${filtro ? '?' + filtro : ''}`, { method: metodo || 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(cuerpo) });
      const lista = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);
      function pintarConfig() {
        if (!admin) return;
        const e = ENT();
        $('cf-ent').innerHTML = [['nombre', 'Nombre de la entidad', e.nombre || ''], ['terminos', 'Nombres y siglas que la identifican', (e.terminos || []).join(', ')], ['excluir', 'Frases a excluir (falsos positivos)', (e.excluir || []).join(', ')],
          ['productos', 'Productos, marcas y servicios', (e.productos || []).join(', ')], ['dominios', 'Dominios oficiales', (e.dominios || []).join(', ')], ['proveedores', 'Proveedores críticos', (e.proveedores || []).join(', ')]]
          .map(([k, l, v]) => `<div${k === 'nombre' ? '' : ' style="grid-column:1/-1"'}><label class="mx-label" for="cf-e-${k}">${l}</label><input class="mx-input" id="cf-e-${k}" value="${esc(v)}"></div>`).join('');
        $('cf-con').innerHTML = CON.map(c => `<tr data-id="${c.id}"><td><input type="checkbox" class="cf-act" ${c.activa ? 'checked' : ''}></td><td><input class="mx-input rp-in cf-n" value="${esc(c.nombre)}"></td>
            <td><select class="mx-select cf-f">${['gdelt', 'gnews', 'rss'].map(f => `<option value="${f}"${f === c.fuente ? ' selected' : ''}>${ORG[f]}</option>`).join('')}</select></td>
            <td style="min-width:300px"><input class="mx-input rp-in cf-q" value="${esc(c.consulta)}"></td><td><input class="mx-input rp-in cf-h" type="number" min="1" max="168" value="${c.cada_horas}" style="width:80px"></td>
            <td class="nw"><button type="button" class="mx-btn sm cf-ok">Guardar</button> <button type="button" class="mx-btn sm danger cf-del">Quitar</button></td></tr>`).join('');
        $('cf-cat').innerHTML = CAT.map(c => `<tr data-id="${esc(c.id)}"><td><input type="checkbox" class="cf-act" ${c.activa ? 'checked' : ''}></td><td><input class="mx-input rp-in cf-n" value="${esc(c.nombre)}"></td>
            <td><input class="mx-input rp-in cf-i" type="number" min="1" max="5" value="${c.impacto}" style="width:70px"></td><td style="min-width:320px"><input class="mx-input rp-in cf-p" value="${esc((c.palabras || []).join(', '))}"></td>
            <td class="nw"><button type="button" class="mx-btn sm cf-ok">Guardar</button></td></tr>`).join('');
        $('cf-fu').innerHTML = FU.map(f => `<tr data-id="${esc(f.dominio)}"><td class="mx-mono">${esc(f.dominio)}</td><td><input class="mx-input rp-in cf-n" value="${esc(f.nombre)}"></td>
            <td><select class="mx-select cf-t">${Object.entries(TIPOF).map(([k, v]) => `<option value="${k}"${k === f.tipo ? ' selected' : ''}>${v}</option>`).join('')}</select></td>
            <td><input class="mx-input rp-in cf-c" type="number" min="1" max="5" value="${f.confiabilidad}" style="width:70px"></td><td><input type="checkbox" class="cf-r" ${f.rss_permitido ? 'checked' : ''}></td>
            <td class="nw"><button type="button" class="mx-btn sm cf-ok">Guardar</button> <button type="button" class="mx-btn sm danger cf-del">Quitar</button></td></tr>`).join('');
        const p = PRC(), pe = Object.assign({ impacto: .3, relevancia: .2, confiabilidad: .2, alcance: .1, actualidad: .1, corroboracion: .1 }, p.pesos), um = Object.assign({ critica: 80, alta: 60, media: 40 }, p.umbrales);
        $('cf-pr').innerHTML = `<p class="mx-small">Puntaje = 100 × Σ (peso × factor). Los pesos tienen que sumar 100%. Una sola fuente poco confiable nunca llega a "crítica", y una nota sin categoría de riesgo no pasa de "media".</p>
          <div class="mx-form" style="grid-template-columns:repeat(3,minmax(0,1fr))">${Object.keys(pe).map(k => `<div><label class="mx-label">Peso · ${k} (%)</label><input class="mx-input cf-pe" data-k="${k}" type="number" min="0" max="100" value="${Math.round(pe[k] * 100)}"></div>`).join('')}
          ${['critica', 'alta', 'media'].map(k => `<div><label class="mx-label">Umbral · ${PRI[k]} (desde)</label><input class="mx-input cf-um" data-k="${k}" type="number" min="1" max="100" value="${um[k]}"></div>`).join('')}</div>`;
      }
      const msgC = (id, t, ok) => { $(id).className = 'mx-msg ' + (ok ? 'ok' : 'err'); $(id).textContent = t; };
      if (admin) {
        $('cf-ent-ok').addEventListener('click', async () => {
          const v = { nombre: $('cf-e-nombre').value.trim(), terminos: lista($('cf-e-terminos').value).map(low), excluir: lista($('cf-e-excluir').value).map(low), productos: lista($('cf-e-productos').value).map(low), dominios: lista($('cf-e-dominios').value).map(low), proveedores: lista($('cf-e-proveedores').value).map(low) };
          if (!v.nombre || !v.terminos.length) return msgC('cf-ent-msg', 'Falta el nombre o al menos un término.');
          try { await guardar('monitor_rep_config', 'id=eq.entidad', { valor: v, actualizado: new Date().toISOString() }); CFG.find(c => c.id === 'entidad').valor = v; msgC('cf-ent-msg', 'Guardado.', true); $('rp-ent').textContent = v.nombre; } catch (err) { msgC('cf-ent-msg', errBase(err)); }
        });
        $('cf-pr-ok').addEventListener('click', async () => {
          const pesos = {}; document.querySelectorAll('.cf-pe').forEach(i => { pesos[i.dataset.k] = (+i.value || 0) / 100; });
          const umbrales = {}; document.querySelectorAll('.cf-um').forEach(i => { umbrales[i.dataset.k] = +i.value; });
          const tot = Math.round(Object.values(pesos).reduce((s, x) => s + x, 0) * 100);
          if (tot !== 100) return msgC('cf-pr-msg', `Los pesos suman ${tot}%: tienen que sumar 100%.`);
          if (!(umbrales.critica > umbrales.alta && umbrales.alta > umbrales.media)) return msgC('cf-pr-msg', 'Los umbrales tienen que ir de mayor a menor: crítica > alta > media.');
          try { await guardar('monitor_rep_config', 'id=eq.prioridad', { valor: { pesos, umbrales }, actualizado: new Date().toISOString() }); CFG.find(c => c.id === 'prioridad').valor = { pesos, umbrales }; msgC('cf-pr-msg', 'Guardado. Se aplica a las alertas nuevas.', true); } catch (err) { msgC('cf-pr-msg', errBase(err)); }
        });
        const fila = (cont, fn) => $(cont).addEventListener('click', async ev => { const tr = ev.target.closest('tr[data-id]'); if (!tr) return; const b = ev.target.closest('button'); if (!b) return;
          try { await fn(tr, b.classList.contains('cf-del')); await cargar(); pintarTodo(); } catch (err) { window.alert(errBase(err)); } });
        fila('cf-con', async (tr, del) => {
          if (del) { if (!window.confirm('¿Quitar esta consulta? Sus ejecuciones quedan en el registro.')) return; return guardar('monitor_rep_consultas', `id=eq.${tr.dataset.id}`, null, 'DELETE'); }
          const v = { activa: tr.querySelector('.cf-act').checked, nombre: tr.querySelector('.cf-n').value.trim(), fuente: tr.querySelector('.cf-f').value, consulta: tr.querySelector('.cf-q').value.trim(), cada_horas: Math.min(168, Math.max(1, +tr.querySelector('.cf-h').value || 3)) };
          if (v.fuente === 'gnews' && v.activa && !window.confirm('Google News RSS declara que su feed es solo para uso personal y no comercial. ¿Confirmás que Legales o Cumplimiento aprobó su uso?')) return;
          if (v.fuente === 'rss') { let h = ''; try { const u = new URL(v.consulta); if (u.protocol !== 'https:') throw 0; h = u.hostname.replace(/^www\./, ''); } catch (e) { throw new Error('La dirección del feed tiene que ser https://…'); }
            if (!FU.some(f => f.rss_permitido && (h === f.dominio || h.endsWith('.' + f.dominio)))) throw new Error(`El dominio ${h} no está habilitado para leer RSS: agregalo en "Fuentes y confiabilidad" y marcá "Leer su RSS".`); }
          return guardar('monitor_rep_consultas', `id=eq.${tr.dataset.id}`, v);
        });
        fila('cf-cat', async tr => guardar('monitor_rep_categorias', `id=eq.${encodeURIComponent(tr.dataset.id)}`, { activa: tr.querySelector('.cf-act').checked, nombre: tr.querySelector('.cf-n').value.trim(), impacto: Math.min(5, Math.max(1, +tr.querySelector('.cf-i').value || 3)), palabras: lista(tr.querySelector('.cf-p').value).map(low) }));
        fila('cf-fu', async (tr, del) => {
          if (del) { if (!window.confirm('¿Quitar esta fuente de la lista?')) return; return guardar('monitor_rep_fuentes', `dominio=eq.${encodeURIComponent(tr.dataset.id)}`, null, 'DELETE'); }
          return guardar('monitor_rep_fuentes', `dominio=eq.${encodeURIComponent(tr.dataset.id)}`, { nombre: tr.querySelector('.cf-n').value.trim(), tipo: tr.querySelector('.cf-t').value, confiabilidad: Math.min(5, Math.max(1, +tr.querySelector('.cf-c').value || 2)), rss_permitido: tr.querySelector('.cf-r').checked });
        });
        $('cf-con-add').addEventListener('click', async () => { const n = window.prompt('Nombre de la nueva consulta:'); if (!n) return;
          try { await guardar('monitor_rep_consultas', '', { nombre: n.trim(), fuente: 'gdelt', consulta: `"${ENT().nombre || ''}"`, activa: false, cada_horas: 6 }, 'POST'); await cargar(); pintarTodo(); } catch (err) { window.alert(errBase(err)); } });
        $('cf-cat-add').addEventListener('click', async () => { const n = window.prompt('Nombre de la nueva categoría:'); if (!n) return; const id = sinTilde(n).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
          try { await guardar('monitor_rep_categorias', '', { id, nombre: n.trim(), impacto: 3, orden: 500, palabras: [] }, 'POST'); await cargar(); pintarTodo(); } catch (err) { window.alert(errBase(err)); } });
        $('cf-fu-add').addEventListener('click', async () => { const d = low(window.prompt('Dominio (ej.: diario.com.ar):') || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''); if (!d) return;
          if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return window.alert('Dominio no válido.');
          try { await guardar('monitor_rep_fuentes', '', { dominio: d, nombre: d, tipo: 'desconocido', confiabilidad: 2, rss_permitido: false }, 'POST'); await cargar(); pintarTodo(); } catch (err) { window.alert(errBase(err)); } });
      }
      function pintarTodo() { pintarPanel(); pintarAlertas(); pintarFuentes(); pintarConfig(); }
      pintarTodo();
      const t0 = leerLS('mx-rp-tab'); if (t0 && (t0 !== 'config' || admin)) irTab(t0);
    },

    async usuarios() {
      const wrap = $('mx-page').querySelector('.mx-wrap');
      if (!usaSupabase) { wrap.innerHTML = '<div class="mx-empty">La administración de usuarios funciona solo con la base de Supabase (config.js, fuente: \'supabase\').</div>'; return; }
      if (!esAdmin()) { wrap.innerHTML = '<div class="mx-empty">Esta sección es solo para usuarios con rol de administrador.</div>'; return; }
      const ROL = { admin: 'Administrador', analista: 'Analista', lector: 'Lector' };
      const ROLB = { admin: 'dark', analista: 'info', lector: 'neutral' };
      const ACC = { ingreso: 'Ingreso', usuario_alta: 'Alta de usuario', usuario_edicion: 'Cambio de usuario', usuario_baja: 'Baja de usuario',
        fuente_alta: 'Fuente agregada', fuente_edicion: 'Fuente modificada', fuente_baja: 'Fuente quitada', candidato_alta: 'Evento cargado a mano',
        candidato_aprobado: 'Candidato aprobado', candidato_rechazado: 'Candidato rechazado', candidato_pendiente: 'Vuelto a pendiente',
        candidato_clasificacion: 'Clasificación modificada', preferencias_notificacion: 'Preferencias de aviso',
        servicio_alta: 'Servicio agregado', servicio_edicion: 'Servicio modificado', servicio_baja: 'Servicio quitado' };
      const yo = (leerSesion() || {}).uid;
      let U = [];
      const msg = (t, tipo) => { $('us-msg').className = 'mx-msg' + (tipo ? ' ' + tipo : ''); $('us-msg').textContent = t; };
      const limpiar = () => { $('us-form').reset(); $('us-mail').readOnly = false; $('us-ok').textContent = 'Guardar'; $('us-cancel').hidden = true; };
      async function cargarUsuarios() {
        U = await sbRpc('monitor_admin_usuarios') || [];
        $('us-n').textContent = plural(U.length, 'usuario');
        $('us-k-a').textContent = U.filter(u => u.activo && u.rol === 'admin').length;
        $('us-k-n').textContent = U.filter(u => u.activo && u.rol === 'analista').length;
        $('us-k-l').textContent = U.filter(u => u.activo && u.rol === 'lector').length;
        $('us-k-i').textContent = U.filter(u => !u.activo).length;
        $('us-tabla').innerHTML = U.map(u => `<tr>
            <td><b>${esc(u.nombre)}</b>${u.user_id === yo ? ' <span class="mx-small">(vos)</span>' : ''}</td>
            <td class="nw">${esc(u.email)}</td>
            <td class="nw"><span class="mx-badge ${ROLB[u.rol] || 'neutral'}">${esc(ROL[u.rol] || u.rol)}</span></td>
            <td class="nw">${u.activo ? '<span class="mx-badge ok">Activo</span>' : '<span class="mx-badge neutral">Inactivo</span>'}</td>
            <td class="nw mx-mono" style="color:var(--ink-2)">${esc(u.ultimo_ingreso ? fHora(u.ultimo_ingreso) : 'Nunca')}</td>
            <td class="nw" style="text-align:right"><button type="button" class="mx-btn sm" data-ed="${esc(u.user_id)}">Editar</button>
              ${u.user_id === yo ? '' : `<button type="button" class="mx-btn sm danger" data-q="${esc(u.user_id)}">Quitar acceso</button>`}</td></tr>`).join('')
          || '<tr><td colspan="6" class="mx-empty">Todavía no hay usuarios.</td></tr>';
      }
      async function cargarActividad() {
        const dias = +$('us-act-d').value || 30;
        const A = await sbRpc('monitor_admin_actividad', { p_desde: new Date(Date.now() - dias * 864e5).toISOString(), p_limite: 500 }) || [];
        $('us-act-n').textContent = plural(A.length, 'registro');
        $('us-act').innerHTML = A.map(a => `<tr><td class="nw mx-mono" style="color:var(--ink-2)">${esc(fHora(a.fecha))}</td>
            <td class="nw">${esc(a.nombre || '—')}</td><td class="nw">${esc(ACC[a.accion] || a.accion)}</td><td class="tit">${esc(a.objeto || '')}</td></tr>`).join('')
          || '<tr><td colspan="4" class="mx-empty">Sin actividad en el período.</td></tr>';
      }
      $('us-form').addEventListener('submit', async ev => {
        ev.preventDefault();
        const args = { p_email: $('us-mail').value.trim(), p_nombre: $('us-nom').value.trim(), p_rol: $('us-rol').value, p_activo: $('us-act-e').value === 'true' };
        $('us-ok').disabled = true; msg('Guardando…');
        try {
          await sbRpc('monitor_admin_guardar_usuario', args);
          msg(`Listo: ${args.p_nombre} quedó como ${ROL[args.p_rol]}${args.p_activo ? '' : ' (inactivo)'}.`, 'ok'); limpiar();
          await cargarUsuarios(); cargarActividad();
        } catch (err) {
          const t = errBase(err);
          msg(/no hay una cuenta/i.test(t) ? `${t}. Creá primero la cuenta en Supabase > Authentication > Users > Add user (marcá "Auto Confirm User") y volvé a guardar.` : t, 'err');
        }
        $('us-ok').disabled = false;
      });
      $('us-cancel').addEventListener('click', () => { limpiar(); msg(''); });
      $('us-tabla').addEventListener('click', async ev => {
        const be = ev.target.closest('[data-ed]'), bq = ev.target.closest('[data-q]');
        if (be) {
          const u = U.find(x => x.user_id === be.dataset.ed);
          $('us-mail').value = u.email; $('us-mail').readOnly = true; $('us-nom').value = u.nombre; $('us-rol').value = u.rol; $('us-act-e').value = String(u.activo);
          $('us-ok').textContent = 'Guardar cambios'; $('us-cancel').hidden = false; msg(`Editando a ${u.nombre}.`);
          $('us-form').scrollIntoView({ block: 'center', behavior: 'smooth' }); $('us-nom').focus();
        }
        if (bq) {
          const u = U.find(x => x.user_id === bq.dataset.q);
          if (!window.confirm(`¿Quitar el acceso de ${u.nombre} (${u.email})?\nSu cuenta sigue existiendo, pero deja de ver el monitor. Para pausarlo sin borrarlo, editalo y marcalo como Inactivo.`)) return;
          try { await sbRpc('monitor_admin_quitar_usuario', { p_user: u.user_id }); msg(`Se quitó el acceso de ${u.nombre}.`, 'ok'); await cargarUsuarios(); cargarActividad(); }
          catch (err) { msg(errBase(err), 'err'); }
        }
      });
      $('us-act-d').addEventListener('change', () => cargarActividad().catch(err => msg(errBase(err), 'err')));
      await cargarUsuarios();
      await cargarActividad();
    },

    async metodologia() { /* página estática */ }
  };

  async function iniciar() {
    const pagina = $('mx-page'), vista = pagina ? pagina.dataset.vista : '';
    if (usaSupabase) {
      try {
        PERFIL = await perfil();
        if (!PERFIL) { iniciarEncabezado(vista); pedirLogin(); return; }
        if (PERFIL.rol === 'sin acceso') { iniciarEncabezado(vista); pedirLogin(`El usuario ${PERFIL.email} no tiene acceso al monitor. Pedile al administrador que lo habilite.`); borrarSesion(); return; }
      } catch (err) { iniciarEncabezado(vista); pedirLogin(err.sinSesion ? 'Tu sesión venció. Volvé a ingresar.' : 'No se pudo verificar tu acceso.'); return; }
      sbRpc('monitor_registrar_ingreso').catch(() => { /* no bloquea la página */ });
    }
    iniciarEncabezado(vista);
    if (!vistas[vista]) return;
    try { await vistas[vista](); }
    catch (err) {
      if (err && err.sinSesion) { pedirLogin('Tu sesión venció. Volvé a ingresar.'); return; }
      console.error('[Monitor] No se pudieron cargar los datos:', err);
      const m = '<div class="mx-empty">No se pudieron cargar los datos. Revisá el archivo datos/datos.js o la conexión configurada en config.js (detalle en la consola, F12).</div>';
      ['mx-int', 'mx-lista', 'rv-cola-l'].forEach(id => { if ($(id)) $(id).innerHTML = m; });
      ['mx-nac', 'rg-tabla'].forEach(id => { if ($(id)) $(id).innerHTML = `<tr><td colspan="9">${m}</td></tr>`; });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

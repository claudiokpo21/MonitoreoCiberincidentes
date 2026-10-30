// Monitor de Riesgo · lectura de calificaciones y opiniones de las apps (Google Play y App Store)
// Lo llama pg_cron cada 6 horas y el botón "Actualizar ahora" de la página Apps.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const TEMAS: [string, RegExp][] = [
  ["Token / identidad", /token|rostro|facial|selfie|dni|validaci[oó]n|identidad|c[oó]digo de barras|sms/i],
  ["Ingreso / usuario", /usuario|contrase|clave|ingres|login|loguear|no me deja entrar|acceso|bloque/i],
  ["Transferencias", /transferenc|cvu|cbu|alias/i],
  ["Caída / lentitud", /ca[ií]d|no carga|no anda|lent|se cierra|crashea|error de conexi[oó]n|servicio no disponible/i],
  ["Fraude / seguridad", /fraude|estafa|hack|robo|me sacaron|vaciaron|phishing|no reconozco/i],
  ["Tarjetas y pagos", /tarjeta|pago|qr|compra|d[eé]bito|cr[eé]dito/i],
];
const tema = (t: string) => (TEMAS.find(([, r]) => r.test(t)) ?? ["General"])[0];

async function ios(app: { id: string; ios_id: string }) {
  const out: { lectura: Record<string, unknown>; resenas: Record<string, unknown>[] } = { lectura: { app_id: app.id, tienda: "ios" }, resenas: [] };
  try {
    const l = await (await fetch(`https://itunes.apple.com/lookup?id=${app.ios_id}&country=ar`)).json();
    const r = l.results?.[0];
    if (r) Object.assign(out.lectura, { rating: r.averageUserRating ?? null, cantidad: r.userRatingCount ?? null, version: r.version ?? null, actualizada: r.currentVersionReleaseDate ?? null });
    const f = await (await fetch(`https://itunes.apple.com/ar/rss/customerreviews/page=1/id=${app.ios_id}/sortby=mostrecent/json`)).json();
    let e = f.feed?.entry ?? []; if (!Array.isArray(e)) e = [e];
    for (const x of e) {
      if (!x["im:rating"]) continue;
      const texto = x.content?.label ?? "", titulo = x.title?.label ?? "";
      out.resenas.push({ id: `ios:${x.id?.label}`, app_id: app.id, tienda: "ios", fecha: x.updated?.label ?? null, autor: x.author?.name?.label ?? "",
        estrellas: Number(x["im:rating"].label), titulo, texto, version: x["im:version"]?.label ?? null, tema: tema(`${titulo} ${texto}`) });
    }
  } catch (err) { out.lectura.error = String(err).slice(0, 300); }
  return out;
}

async function play(app: { id: string; play_id: string }) {
  const out: { lectura: Record<string, unknown>; resenas: Record<string, unknown>[] } = { lectura: { app_id: app.id, tienda: "play" }, resenas: [] };
  try {
    const html = await (await fetch(`https://play.google.com/store/apps/details?id=${app.play_id}&hl=es_419&gl=AR`, { headers: { "User-Agent": UA, "Accept-Language": "es-AR" } })).text();
    const rv = html.match(/"ratingValue"\s*:\s*"([\d.,]+)"/), rc = html.match(/"ratingCount"\s*:\s*"(\d+)"/);
    Object.assign(out.lectura, { rating: rv ? Number(rv[1].replace(",", ".")) : null, cantidad: rc ? Number(rc[1]) : null });
    const ver = html.match(/\[\[\["(\d+(?:\.\d+)+)"\]\],\[\[\[\d+\]\]/); if (ver) out.lectura.version = ver[1];
  } catch (err) { out.lectura.error = String(err).slice(0, 300); }
  try {
    const req = JSON.stringify([[["UsvDTd", JSON.stringify([null, null, [2, 2, [40, null, null], null, []], [app.play_id, 7]]), null, "generic"]]]);
    const r = await fetch("https://play.google.com/_/PlayStoreUi/data/batchexecute?rpcids=UsvDTd&hl=es-419&gl=AR&authuser&soc-app=121&soc-platform=1&soc-device=1",
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": UA }, body: "f.req=" + encodeURIComponent(req) });
    const txt = await r.text();
    const outer = JSON.parse(txt.slice(txt.indexOf("[")));
    const fila = outer.find((x: unknown[]) => Array.isArray(x) && x[1] === "UsvDTd");
    const data = fila && fila[2] ? JSON.parse(fila[2]) : null;
    for (const v of (data?.[0] ?? [])) {
      const texto = v[4] ?? "";
      out.resenas.push({ id: `play:${v[0]}`, app_id: app.id, tienda: "play", fecha: v[5]?.[0] ? new Date(v[5][0] * 1000).toISOString() : null, autor: v[1]?.[0] ?? "",
        estrellas: v[2] ?? null, titulo: null, texto, version: v[10] ?? null, respuesta: v[7]?.[1] ?? null,
        respuesta_fecha: v[7]?.[2]?.[0] ? new Date(v[7][2][0] * 1000).toISOString() : null, tema: tema(texto) });
    }
  } catch (err) { out.lectura.error = ((out.lectura.error as string) || "") + " reseñas: " + String(err).slice(0, 200); }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // Evita lecturas repetidas: si hubo una en los últimos 10 minutos, no vuelve a leer
  const { data: ult } = await db.from("monitor_apps_lecturas").select("fecha").order("fecha", { ascending: false }).limit(1);
  if (ult?.[0] && Date.now() - new Date(ult[0].fecha).getTime() < 10 * 60e3) return json({ ok: true, omitido: "lectura reciente", fecha: ult[0].fecha });
  const { data: apps, error } = await db.from("monitor_apps").select("*").eq("activo", true).order("orden");
  if (error) return json({ error: error.message }, 500);
  const res = [];
  for (const a of apps ?? []) {
    for (const r of [a.play_id ? await play(a) : null, a.ios_id ? await ios(a) : null]) {
      if (!r) continue;
      await db.from("monitor_apps_lecturas").insert(r.lectura);
      if (r.resenas.length) await db.from("monitor_apps_resenas").upsert(r.resenas, { onConflict: "id" });
      res.push({ app: a.id, tienda: r.lectura.tienda, rating: r.lectura.rating, resenas: r.resenas.length, error: r.lectura.error ?? null });
    }
  }
  return json({ ok: true, resultados: res });
});

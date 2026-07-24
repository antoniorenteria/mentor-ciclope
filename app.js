/* ============================================================
   EL MENTOR CÍCLOPE — app.js
   Sistema de dirección, auditoría y aprendizaje continuo.
   Lee la operación real de El Ojo Maestro; guarda su propio criterio.
============================================================ */

const VERSION = '1.0';
const LLAVE = 'mentor_ciclope_db';
const LLAVE_OJO = 'mentor_ojo_cache';
const LLAVE_CFG = 'mentor_cfg_dispositivo';
const M = window.MENTOR;

/* ---------------- utilidades ---------------- */
const $ = id => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isoLocal = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const hoyISO = () => isoLocal(new Date());
const mesISO = f => (f || hoyISO()).slice(0, 7);
const fmt$ = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-MX');
const fmtPct = n => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString('es-MX') + ' %';
const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const sumar = (f, n) => { const d = new Date(f + 'T12:00'); d.setDate(d.getDate() + n); return isoLocal(d); };
const nDia = f => new Date(f + 'T12:00').getDay();
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const fmtFecha = f => { const d = new Date(f + 'T12:00'); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
const fmtCorta = f => { const d = new Date(f + 'T12:00'); return d.getDate() + '/' + (d.getMonth() + 1); };
/* semana lunes → domingo */
function rangoSemana(f) {
  const d = new Date((f || hoyISO()) + 'T12:00');
  const off = (d.getDay() + 6) % 7;
  const ini = new Date(d); ini.setDate(d.getDate() - off);
  const fin = new Date(ini); fin.setDate(ini.getDate() + 6);
  return { ini: isoLocal(ini), fin: isoLocal(fin) };
}

function toast(t) { const e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2600); }
function modal(html) { $('modal').innerHTML = html; $('modal-bg').classList.add('on'); $('modal').scrollTop = 0; }
function cerrarModal() { $('modal-bg').classList.remove('on'); }

/* ---------------- estado ---------------- */
let db = null;          // base del mentor
let ojo = null;         // copia de lectura de El Ojo Maestro
let rol = null;         // 'director' | 'gerencia'
let pila = [];          // navegación
let pinBuffer = '', pinDestino = null;

/* ============================================================
   BASE DEL MENTOR
============================================================ */
function seedDB() {
  return {
    v: 1, ts: Date.now(), dbRev: 1,
    config: {
      scriptUrl: '', pinDir: '2626', pinGer: '1515',
      nombreDir: 'Toño', nombreGer: 'Steph',
      prioridades: ['finanzas', 'rentabilidad', 'marketing', 'ventas'],
    },
    areas: {}, rituales: [], consejos: [], compromisos: [], misiones: [],
    fijos: {}, numeros: {}, kpis: [], bitacora: [], academia: {},
    steph: { modulos: {}, evals: [] }, fechas: [], ideas: [],
    loyverse: {},          // { 'YYYY-MM': { sucId: {ventas,tickets,costo,...} } }
    retos: [],             // retos de aprendizaje just-in-time
  };
}
function migrar() {
  const s = seedDB();
  Object.keys(s).forEach(k => { if (db[k] === undefined) db[k] = s[k]; });
  Object.keys(s.config).forEach(k => { if (db.config[k] === undefined) db.config[k] = s.config[k]; });
  M.AREAS.forEach(a => { if (!db.areas[a.id]) db.areas[a.id] = { nivel: null, ultima: null, respuestas: {}, nota: '' }; });
  /* costos fijos reales que dio Toño (2026-07-23). Solo en instalación nueva:
     nunca se pisa lo que él haya capturado después. */
  if (!Object.keys(db.fijos).length) {
    // Revolución: freidora eléctrica y letreros luminosos interiores → la luz carga el freído
    db.fijos['suc-revolucion'] = { renta: 5600, luz: 2500, gas: 0, agua: 200, internet: 550, servicios: 0, sueldosFijos: 15500, otros: 0 };
    // Tulipanes: freidora de gas, $500 por semana ≈ $2,167 al mes
    db.fijos['suc-tulipanes'] = { renta: 10000, luz: 500, gas: 2167, agua: 250, internet: 500, servicios: 0, sueldosFijos: 17000, otros: 0 };
  }
  /* instalaciones que quedaron con el campo viejo "servicios" en bloque */
  Object.keys(db.fijos).forEach(k => {
    const f = db.fijos[k];
    if (f.luz === undefined && f.servicios > 0) { f.luz = f.servicios; f.servicios = 0; }
    ['luz', 'gas', 'agua', 'internet', 'servicios'].forEach(c => { if (f[c] === undefined) f[c] = 0; });
  });
  if (db.config.cvObjetivo === undefined) db.config.cvObjetivo = 35;   // meta de costo de ventas
  if (!db.config.mapaLoyverse) db.config.mapaLoyverse = {};            // tiendaLoyverse → sucursal
  /* Arranque formal del Ojo Maestro como fuente de nómina (Toño, 2026-07-23).
     Antes de esta fecha manda el sueldo declarado: si el equipo empieza a
     checar a media semana, los turnos sueltos darían una nómina incompleta
     y ensuciarían la base de julio. */
  if (!db.config.arranqueOjo) db.config.arranqueOjo = '2026-08-01';
  if (!db.arranque) db.arranque = {};
  if (!db.retos) db.retos = [];
}
/* ¿este mes ya toma la nómina de los turnos del Ojo Maestro? */
const mesEnVivo = mes => mes >= mesISO(db.config.arranqueOjo);
function cargarDB() {
  try { db = JSON.parse(localStorage.getItem(LLAVE)); } catch (e) { db = null; }
  if (!db || !db.config) db = seedDB();
  migrar(); recuperarConfig(); guardarDB(true);
  try { ojo = JSON.parse(localStorage.getItem(LLAVE_OJO)); } catch (e) { ojo = null; }
}
function guardarDB(silencioso) {
  db.ts = Date.now(); db.dbRev = (db.dbRev || 0) + 1;
  localStorage.setItem(LLAVE, JSON.stringify(db));
  recordarConfig();
  if (!silencioso) syncPronto();
}
/* la configuración del dispositivo vive aparte: si la base se pierde o se
   abre desde otro contexto (Safari vs app instalada), la conexión vuelve */
function recordarConfig() {
  const c = db.config; if (!c.scriptUrl) return;
  localStorage.setItem(LLAVE_CFG, JSON.stringify({ scriptUrl: c.scriptUrl, pinDir: c.pinDir, pinGer: c.pinGer, ts: Date.now() }));
}
function recuperarConfig() {
  let g = null; try { g = JSON.parse(localStorage.getItem(LLAVE_CFG)); } catch (e) { }
  if (!g || !g.scriptUrl) return;
  const c = db.config;
  if (!c.scriptUrl) c.scriptUrl = g.scriptUrl;
  if (c.pinDir === '2626' && g.pinDir) c.pinDir = g.pinDir;
  if (c.pinGer === '1515' && g.pinGer) c.pinGer = g.pinGer;
}
const enLinea = () => !!(db && db.config.scriptUrl);

/* ============================================================
   SINCRONIZACIÓN
   · el mentor guarda su base con la acción 'mentorSync'
   · lee la operación con 'leer'; si el backend todavía no la tiene,
     cae a un 'sync' de solo lectura (base vacía con ts 0, que el
     servidor nunca deja ganar) para no obligar a redesplegar hoy
============================================================ */
let syncTimer = null, revEnviada = 0;
function syncPronto() { clearTimeout(syncTimer); syncTimer = setTimeout(sync, 1500); }

async function llamar(payload) {
  const r = await fetch(db.config.scriptUrl, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return await r.json();
}
async function sync(mostrar) {
  if (!enLinea()) { if (mostrar) toast('Sin conexión configurada'); return; }
  try {
    revEnviada = db.dbRev;
    const j = await llamar({ action: 'mentorSync', db: db });
    if (j && j.ok && j.db) {
      if (db.dbRev !== revEnviada) { setTimeout(() => sync(), 800); }  // capturaron algo mientras respondía
      else {
        const url = db.config.scriptUrl;
        db = j.db; db.config.scriptUrl = url; migrar();
        localStorage.setItem(LLAVE, JSON.stringify(db));
      }
    } else if (j && !j.ok && /desconocida/i.test(j.error || '')) {
      if (mostrar) toast('El backend aún no tiene el módulo Mentor');
    }
    chipRed(true);
    if (mostrar) { toast('☁️ Sincronizado'); repintar(); }
  } catch (e) { chipRed(false); if (mostrar) toast('No se pudo sincronizar'); }
}
async function traerOjo(mostrar) {
  if (!enLinea()) { if (mostrar) toast('Conecta el backend en Administrar'); return false; }
  try {
    let j = await llamar({ action: 'leer' });
    if (!j || !j.ok || !j.db) {
      // respaldo: sync de solo lectura — base vacía con ts 0 jamás pisa al servidor
      j = await llamar({ action: 'sync', db: { ts: 0, catTs: 0, configTs: {}, config: {}, sucursales: [], personal: [], productos: [], stock: {}, turnos: [], cierres: [], checklists: [], evidencias: [], eventos: [], propinas: [], tareas: [], revisiones: [], preparaciones: [], calendario: [] } });
    }
    if (j && j.ok && j.db) {
      ojo = j.db; ojo._traido = Date.now();
      try { localStorage.setItem(LLAVE_OJO, JSON.stringify(podarOjo(ojo))); } catch (e) { }
      chipRed(true);
      if (mostrar) { toast('👁️ Operación actualizada'); repintar(); }
      return true;
    }
  } catch (e) { chipRed(false); }
  if (mostrar) toast('No se pudo leer la operación');
  return false;
}
/* la caché local no necesita fotos ni evidencias: solo números */
function podarOjo(o) {
  const c = JSON.parse(JSON.stringify(o));
  delete c.evidencias;
  (c.cierres || []).forEach(x => { delete x.foto; });
  return c;
}
function chipRed(ok) {
  const c = $('chip-red'); if (!c) return;
  c.className = 'chip ' + (enLinea() ? (ok ? 'on' : 'off') : '');
  $('chip-red-t').textContent = enLinea() ? (ok ? 'en línea' : 'sin señal') : 'local';
}

/* ============================================================
   LECTURA DE LA OPERACIÓN (El Ojo Maestro)
============================================================ */
const haySuc = () => ojo && ojo.sucursales && ojo.sucursales.length;
const sucursales = () => (ojo && ojo.sucursales ? ojo.sucursales.filter(s => s.activa !== false) : []);
const nomSuc = id => { const s = (ojo && ojo.sucursales || []).find(x => x.id === id); return s ? s.nombre : '—'; };
const perOjo = id => (ojo && ojo.personal || []).find(x => x.id === id);

/* Un día y una sucursal tienen UN cierre. El Ojo Maestro llegó a guardar un
   registro nuevo por cada envío (id aleatorio), así que un mismo día podía
   aparecer 12 veces y multiplicar la venta. Aquí se deduplica siempre:
   gana el más reciente. Nunca sumar cierres sin pasar por esta función. */
function cierresEn(ini, fin, sid) {
  const l = ((ojo && ojo.cierres) || []).filter(c => c.fecha >= ini && c.fecha <= fin && (!sid || c.sucursalId === sid));
  const m = {};
  l.forEach(c => {
    const k = c.fecha + '|' + c.sucursalId;
    if (!m[k] || (c.ts || 0) > (m[k].ts || 0)) m[k] = c;
  });
  return Object.keys(m).map(k => m[k]);
}
/* cuántos cierres sobran en toda la base (señal de que el origen duplica) */
function cierresDuplicados() {
  const todos = ((ojo && ojo.cierres) || []);
  const vistos = {};
  let dup = 0;
  todos.forEach(c => { const k = c.fecha + '|' + c.sucursalId; if (vistos[k]) dup++; else vistos[k] = 1; });
  return dup;
}
function ventasEn(ini, fin, sid) { return cierresEn(ini, fin, sid).reduce((a, c) => a + (Number(c.ventas) || 0), 0); }
function turnosEn(ini, fin, sid) {
  return ((ojo && ojo.turnos) || []).filter(t => {
    if (!t.entrada || !t.salida) return false;
    const f = isoLocal(new Date(t.entrada));
    return f >= ini && f <= fin && (!sid || t.sucursalId === sid);
  });
}
function pagoTurno(t) {
  const p = perOjo(t.personalId); if (!p) return 0;
  const extra = Number(t.ajuste || 0) * ((Number(p.pagoHora) || 0) / 3);   // bloques de 20 min
  return Math.max(0, (Number(p.pagoTurno) || 0) + extra);
}
function nominaEn(ini, fin, sid) { return turnosEn(ini, fin, sid).reduce((a, t) => a + pagoTurno(t), 0); }
function propinasEn(ini, fin, sid) {
  return ((ojo && ojo.propinas) || []).filter(x => x.fecha >= ini && x.fecha <= fin && (!sid || x.sucursalId === sid))
    .reduce((a, x) => a + (Number(x.monto) || 0), 0);
}
function cumplimientoEn(ini, fin, sid) {
  const cs = cierresEn(ini, fin, sid).filter(c => c.total);
  if (!cs.length) return null;
  return cs.reduce((a, c) => a + (c.hechos / c.total), 0) / cs.length * 100;
}
function faltantes(sid) {
  if (!ojo || !ojo.productos || !ojo.stock) return { agotados: [], comprar: [] };
  const st = ojo.stock[sid] || {}; const ag = [], co = [];
  ojo.productos.forEach(p => {
    const c = st[p.id] ? Number(st[p.id].c) || 0 : 0;
    if (c <= 0) ag.push(p.nombre); else if (c < (Number(p.minimo) || 0)) co.push(p.nombre);
  });
  return { agotados: ag, comprar: co };
}
/* días abiertos = días con al menos un cierre en el periodo */
function diasConVenta(ini, fin, sid) {
  const s = new Set(); cierresEn(ini, fin, sid).forEach(c => s.add(c.fecha)); return s.size;
}
/* último día de la semana que ya tiene cierre: comparar la semana en curso
   incluyendo el día de hoy (que aún no cierra) inventa caídas que no existen */
function corteSemana(ini, hasta) {
  let max = null;
  cierresEn(ini, hasta).forEach(c => { if (!max || c.fecha > max) max = c.fecha; });
  return max;
}
function novedadesEn(ini, fin) {
  return cierresEn(ini, fin).filter(c => c.novedades).map(c => ({ f: c.fecha, s: nomSuc(c.sucursalId), t: c.novedades }));
}

/* ============================================================
   NÚMEROS DEL MENTOR (captura manual + cálculo)
============================================================ */
function fijosDe(sid) { return db.fijos[sid] || { renta: 0, luz: 0, gas: 0, agua: 0, internet: 0, sueldosFijos: 0, otros: 0 }; }
/* toda la energía junta: es la comparación que importa entre sucursales,
   no la luz sola (una fríe con electricidad y la otra con gas) */
function energiaDe(sid) { const f = fijosDe(sid); return (+f.luz || 0) + (+f.gas || 0); }
function serviciosDe(sid) { const f = fijosDe(sid); return energiaDe(sid) + (+f.agua || 0) + (+f.internet || 0) + (+f.servicios || 0); }

/* Abren todos los días salvo 25 y 31 de diciembre y 1 de enero (Toño, 2026-07-23) */
const CERRADOS = ['12-25', '12-31', '01-01'];
function diasAbiertos(mes) {
  const [y, m] = mes.split('-').map(Number);
  const total = new Date(y, m, 0).getDate();
  let cerrados = 0;
  CERRADOS.forEach(c => { if (c.slice(0, 2) === String(m).padStart(2, '0') && +c.slice(3) <= total) cerrados++; });
  return total - cerrados;
}
function mesDe(mes, sid) {
  const m = db.numeros[mes] || {};
  return m[sid] || { insumos: 0, tickets: 0, marketing: 0, otros: 0, cvPct: 0 };
}
function guardarMes(mes, sid, datos) {
  if (!db.numeros[mes]) db.numeros[mes] = {};
  db.numeros[mes][sid] = Object.assign(mesDe(mes, sid), datos);
  guardarDB();
}
/* estado de resultados aproximado de un mes y sucursal.
   Si no hay compras capturadas pero sí un % de costo de ventas (el que da
   Loyverse), los insumos se ESTIMAN: mejor un número honesto y marcado como
   estimado que ningún número. */
function loyDe(mes, sid) { return (db.loyverse[mes] || {})[sid] || null; }

function resultado(mes, sid) {
  const ini = mes + '-01', fin = mes + '-31';
  const ventas = ventasEn(ini, fin, sid);
  const f = fijosDe(sid), n = mesDe(mes, sid);
  /* NÓMINA — una sola vez. Si el equipo checa en el Ojo Maestro, ese es el
     número real del mes; el sueldo declarado queda solo como comparación.
     Sumar los dos contaría la nómina doble y falsearía toda la utilidad. */
  const nominaOjo = nominaEn(ini, fin, sid) + propinasEn(ini, fin, sid);
  const nominaDecl = +f.sueldosFijos || 0;
  const envivo = mesEnVivo(mes) && nominaOjo > 0;
  const nomina = envivo ? nominaOjo : nominaDecl;
  const fuenteNomina = envivo ? 'turnos' : 'declarada';
  /* los sueldos NO van aquí: viajan en su propio renglón */
  const fijos = (+f.renta || 0) + serviciosDe(sid) + (+f.otros || 0);
  const L = loyDe(mes, sid);
  /* jerarquía del costo: lo que compraste (exacto) > lo que dice el punto de
     venta (bueno) > el % que declaraste (estimado) */
  const cvPct = +n.cvPct || 0;
  let insumos = +n.insumos || 0, estimado = false, fuente = 'capturado';
  if (!insumos && L && L.costo > 0) { insumos = L.costo; fuente = 'Loyverse'; }
  else if (!insumos && cvPct > 0 && ventas > 0) { insumos = ventas * cvPct / 100; estimado = true; fuente = 'estimado'; }
  const mkt = +n.marketing || 0, otros = +n.otros || 0;
  const utilidad = ventas - nomina - fijos - insumos - mkt - otros;
  const pct = v => ventas > 0 ? v / ventas * 100 : null;
  /* En El Anillo la nómina se programa por calendario y se paga por día
     trabajado: se comporta como costo FIJO, no como variable. El único
     costo que sube con cada venta es el insumo. */
  const cvReal = ventas > 0 ? insumos / ventas : (cvPct / 100);
  const fijosTotales = fijos + nomina + mkt + otros;
  const equilibrio = cvReal < 0.98 ? fijosTotales / (1 - cvReal) : null;
  const tickets = (+n.tickets || 0) || (L ? L.tickets : 0) || 0;
  return {
    ventas, nomina, insumos, fijos, mkt, otros, utilidad, equilibrio, estimado, cvPct, fuente,
    nominaOjo, nominaDecl, fuenteNomina, fijosTotales, cvReal: cvReal * 100,
    energia: energiaDe(sid), diasAbiertos: diasAbiertos(mes),
    metaDia: equilibrio == null ? null : equilibrio / diasAbiertos(mes),
    ventasLoy: L ? L.ventas : null, tickets,
    ticketProm: tickets > 0 ? ventas / tickets : null,
    pctNomina: pct(nomina), pctInsumos: pct(insumos), pctRenta: pct((+f.renta || 0) + (+f.servicios || 0)),
    pctUtilidad: pct(utilidad),
    prime: ventas > 0 ? (insumos + nomina) / ventas * 100 : null,
  };
}

/* ============================================================
   ÁREAS Y NIVELES
============================================================ */
const area = id => M.AREAS.find(a => a.id === id);
const estadoArea = id => db.areas[id] || { nivel: null, ultima: null, respuestas: {} };
function nivelDe(id) { const e = estadoArea(id); return e.nivel == null ? null : e.nivel; }
function infoNivel(n) { return M.NIVELES[n] || { t: 'Sin evaluar', d: 'Nunca se ha auditado.', c: '#9CA3AF', n: null }; }
function puntajeArea(a, resp) {
  let max = 0, got = 0;
  a.diagnostico.forEach(d => { max += d.peso * 2; got += d.peso * (resp[d.id] == null ? 0 : resp[d.id]); });
  return max ? got / max : 0;
}
function nivelDesdePuntaje(p) { return p < .15 ? 0 : p < .35 ? 1 : p < .60 ? 2 : p < .85 ? 3 : 4; }
const areasEvaluadas = () => M.AREAS.filter(a => nivelDe(a.id) != null);
function promedioMadurez() {
  const ev = areasEvaluadas(); if (!ev.length) return null;
  return ev.reduce((s, a) => s + nivelDe(a.id), 0) / ev.length;
}

/* ============================================================
   PUNTOS CIEGOS — el corazón del mentor
============================================================ */
function ciegos() {
  const out = [];
  const hoy = hoyISO();
  const push = (clave, datos, extra) => {
    const c = M.CIEGOS[clave]; if (!c) return;
    let d = c.d; Object.keys(datos || {}).forEach(k => { d = d.split('{' + k + '}').join(datos[k]); });
    out.push(Object.assign({ clave, t: c.t, d, s: c.s }, extra || {}));
  };

  /* 1 · áreas nunca auditadas o muy viejas */
  M.AREAS.forEach(a => {
    const e = estadoArea(a.id);
    if (!e.ultima) push('area-sin-revisar', { n: 'todos los', area: a.n }, { ir: () => abrirArea(a.id), et: 'Auditar' });
    else { const d = diasEntre(e.ultima, hoy); if (d >= 45) push('area-sin-revisar', { n: d, area: a.n }, { ir: () => abrirArea(a.id), et: 'Auditar' }); }
    if (e.nivel != null && e.nivel <= 1) push('area-nivel-bajo', { area: a.n, nivel: infoNivel(e.nivel).t.toLowerCase() }, { ir: () => abrirArea(a.id), et: 'Ver' });
  });

  /* 2 · operación real */
  if (ojo && haySuc()) {
    const { ini } = rangoSemana(hoy);
    const prev = rangoSemana(sumar(ini, -7));
    const corte = corteSemana(ini, hoy);                  // último día ya cerrado
    const transcurridos = corte ? diasEntre(ini, corte) : -1;
    sucursales().forEach(s => {
      /* huecos de cierre en los últimos 7 días (sin contar hoy) */
      let huecos = 0;
      for (let i = 1; i <= 7; i++) { const f = sumar(hoy, -i); if (!cierresEn(f, f, s.id).length) huecos++; }
      if (huecos >= 2) push('sin-cierre', { n: huecos, suc: s.nombre }, { s: huecos >= 4 ? 3 : 2 });

      if (corte) {
        /* se comparan los MISMOS días de la semana anterior: medir 2 contra 7
           siempre marcaría una caída falsa */
        const v = ventasEn(ini, corte, s.id), vp = ventasEn(prev.ini, sumar(prev.ini, transcurridos), s.id);
        if (transcurridos >= 1 && vp > 0 && v > 0 && v < vp * .85) push('venta-caida', { v: Math.round((1 - v / vp) * 100), suc: s.nombre });

        const nom = nominaEn(ini, corte, s.id) + propinasEn(ini, corte, s.id);
        if (v > 0 && nom / v > .33) push('nomina-alta', { v: Math.round(nom / v * 100), suc: s.nombre });

        const cum = cumplimientoEn(ini, corte, s.id);
        if (cum != null && cum < 90) push('checklist-bajo', { v: Math.round(cum), suc: s.nombre });
      }

      const fal = faltantes(s.id);
      if (fal.agotados.length >= 3) push('inventario-agotado', { n: fal.agotados.length, suc: s.nombre });
    });
  }

  /* 3 · números que faltan */
  const mes = mesISO(hoy);
  if (haySuc()) {
    const n = s => mesDe(mes, s.id);
    const sinInsumos = sucursales().filter(s => !(n(s).insumos > 0) && !(n(s).cvPct > 0));
    if (sinInsumos.length) push('kpi-sin-dato', { kpi: 'costo de insumos', area: 'Rentabilidad' }, { ir: () => ir('scr-numeros'), et: 'Capturar' });
    const sinFijos = sucursales().filter(s => !(fijosDe(s.id).renta > 0));
    if (sinFijos.length) push('kpi-sin-dato', { kpi: 'costos fijos', area: 'Finanzas' }, { ir: () => ir('scr-numeros'), et: 'Capturar' });

    /* costo de ventas fuera de rango: la fuga más cara y la más silenciosa */
    sucursales().forEach(s => {
      const r = resultado(mes, s.id);
      const cv = r.cvPct || r.pctInsumos;
      if (cv && cv >= 40) push('costo-ventas-alto', { v: Math.round(cv), suc: s.nombre, g: fmt$(r.ventas * (cv - (Number(db.config.cvObjetivo) || 35)) / 100) },
        { ir: () => ir('scr-numeros'), et: 'Ver' });
      if (r.prime != null && r.prime > 65) push('prime-alto', { v: Math.round(r.prime), suc: s.nombre }, { ir: () => ir('scr-numeros'), et: 'Ver' });
    });
  }

  /* 3a · integridad de los datos de origen */
  const dup = cierresDuplicados();
  if (dup) out.push({
    clave: 'cierres-duplicados', t: 'Cierres duplicados en el Ojo Maestro',
    d: 'Hay ' + dup + ' cierre(s) repetidos del mismo día y sucursal. El Mentor ya los ignora para calcular, ' +
      'pero mientras el Ojo Maestro los siga generando, cualquier reporte que salga de ahí (hoja de Sheets, correos) va inflado.',
    s: 3, et: 'Ver', ir: () => ir('scr-numeros')
  });

  /* 3b · puesta en marcha: solo mientras falte para el arranque */
  const faltanDias = diasEntre(hoy, db.config.arranqueOjo);
  if (!arranqueListo()) {
    const pend = arranqueTotal() - arranqueHechos();
    out.push({
      clave: 'arranque', t: 'Puesta en marcha incompleta',
      d: faltanDias > 0
        ? 'Faltan ' + pend + ' punto(s) para el arranque del ' + fmtFecha(db.config.arranqueOjo) + ' y quedan ' + faltanDias + ' día(s). Lo que no quede listo antes, se arrastra todo agosto.'
        : 'El arranque ya pasó y quedan ' + pend + ' punto(s) sin cerrar. Cada uno es un dato que va a salir mal este mes.',
      s: faltanDias <= 3 ? 3 : 2, et: 'Ver', ir: () => ir('scr-arranque')
    });
  }

  /* 4 · disciplina del propio sistema */
  const compVencidos = db.compromisos.filter(c => !c.hecho && c.limite && c.limite < hoy);
  if (compVencidos.length) push('compromiso-vencido', { n: compVencidos.length }, { ir: () => ir('scr-misiones'), et: 'Revisar' });

  const ultConsejo = db.consejos.length ? db.consejos[0].fecha : null;
  if (!ultConsejo) push('sin-consejo', { n: 'varios' }, { ir: () => ir('scr-consejo'), et: 'Hacerlo' });
  else { const d = diasEntre(ultConsejo, hoy); if (d >= 10) push('sin-consejo', { n: d }, { ir: () => ir('scr-consejo'), et: 'Hacerlo' }); }

  const ultRitual = db.rituales.filter(r => r.rol === 'director')[0];
  if (ultRitual) { const d = diasEntre(ultRitual.fecha, hoy); if (d >= 3) push('sin-ritual', { n: d }); }

  db.misiones.filter(m => m.activa).forEach(m => {
    const d = m.ultimoAvance ? diasEntre(m.ultimoAvance, hoy) : 999;
    if (d >= 21) push('meta-sin-avance', { meta: m.objetivo, n: d === 999 ? 'muchos' : d }, { ir: () => ir('scr-misiones'), et: 'Ver' });
  });

  const stephUlt = db.steph.ultimo || null;
  if (stephUlt && diasEntre(stephUlt, hoy) >= 21) push('steph-detenida', { n: diasEntre(stephUlt, hoy) }, { ir: () => ir('scr-steph'), et: 'Ver' });

  /* retos de aprendizaje estancados o vencidos */
  const retoVencido = db.retos.filter(r => r.estado !== 'hecho' && r.estado !== 'archivado' && r.limite && r.limite < hoy);
  if (retoVencido.length) push('reto-estancado', { n: retoVencido.length }, { ir: () => ir('scr-retos'), et: 'Ver' });

  /* 5 · fechas por vencer */
  db.fechas.forEach(f => {
    if (!f.vence) return; const d = diasEntre(hoy, f.vence);
    if (d <= 60 && d >= 0) out.push({ clave: 'fecha', t: 'Vence pronto: ' + f.t, d: 'Vence en ' + d + ' día(s) (' + fmtFecha(f.vence) + ').', s: d <= 15 ? 3 : 2 });
    if (d < 0) out.push({ clave: 'fecha', t: 'VENCIDO: ' + f.t, d: 'Venció hace ' + Math.abs(d) + ' día(s).', s: 3 });
  });

  return out.sort((a, b) => b.s - a.s);
}

/* ============================================================
   BITÁCORA — la memoria del mentor
============================================================ */
function anotar(tipo, t, c, rolQ) {
  db.bitacora.unshift({ id: uid(), ts: Date.now(), fecha: hoyISO(), rol: rolQ || rol, tipo, t, c: c || '' });
  if (db.bitacora.length > 1500) db.bitacora.length = 1500;
}

/* ============================================================
   NAVEGACIÓN
============================================================ */
function ir(id, sinPila) {
  if (!sinPila && $('scr-menu').classList.contains('active')) pila = ['scr-menu'];
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  $('fab').classList.toggle('on', id !== 'scr-menu' && id !== 'scr-portada' && id !== 'scr-pin');
  window.scrollTo(0, 0);
  pintar(id);
}
function volver() { ir('scr-menu'); }
function repintar() { const a = document.querySelector('.screen.active'); if (a) pintar(a.id); }
function pintar(id) {
  /* la barra se arma ANTES de renderizar: la pantalla escribe su título en ella */
  const bar = $(id) && $(id).querySelector('[data-bar]');
  if (bar && !bar.dataset.listo) {
    bar.innerHTML = '<button class="iconbtn" onclick="volver()">←</button><div><div class="tit" style="font-size:1rem" data-tit></div>' +
      '<div class="sub" data-sub></div></div><div class="grow"></div>' +
      '<span class="chip"></span><button class="iconbtn" onclick="toggleTema()">🌓</button>';
    bar.dataset.listo = '1';
  }
  const f = {
    'scr-menu': renderMenu, 'scr-hoy': renderHoy, 'scr-consejo': renderConsejo,
    'scr-auditoria': renderAuditoria, 'scr-ciegos': renderCiegos, 'scr-numeros': renderNumeros,
    'scr-misiones': renderMisiones, 'scr-academia': renderAcademia, 'scr-bitacora': renderBitacora,
    'scr-steph': renderSteph, 'scr-admin': renderAdmin, 'scr-arranque': renderArranque,
    'scr-escandallo': renderEscandallo, 'scr-retos': renderRetos,
  }[id];
  if (f) f();
}
function tituloBarra(id, t, s) {
  const bar = $(id).querySelector('[data-bar]'); if (!bar) return;
  bar.querySelector('[data-tit]').textContent = t;
  bar.querySelector('[data-sub]').textContent = s || '';
  const c = bar.querySelector('.chip');
  if (c) { c.className = 'chip ' + (enLinea() ? 'on' : ''); c.innerHTML = '<span class="dot"></span>' + (enLinea() ? 'en línea' : 'local'); }
}

/* ============================================================
   ACCESO
============================================================ */
function entrar(r) {
  pinDestino = r; pinBuffer = '';
  $('pin-tit').textContent = r === 'director' ? '👁️ Dirección' : '🗝️ Gerencia';
  $('pin-sub').textContent = 'Escribe tu PIN de 4 dígitos';
  renderPinDots(); ir('scr-pin', true);
}
function renderPinDots() {
  $('pin-dots').innerHTML = [0, 1, 2, 3].map(i => '<span class="' + (i < pinBuffer.length ? 'full' : '') + '"></span>').join('');
}
function tecla(n) {
  if (n === 'x') pinBuffer = pinBuffer.slice(0, -1);
  else if (pinBuffer.length < 4) pinBuffer += n;
  renderPinDots();
  if (pinBuffer.length === 4) setTimeout(validarPin, 140);
}
function validarPin() {
  const ok = pinDestino === 'director' ? pinBuffer === db.config.pinDir : (pinBuffer === db.config.pinGer || pinBuffer === db.config.pinDir);
  if (!ok) { toast('PIN incorrecto'); pinBuffer = ''; renderPinDots(); return; }
  rol = pinDestino; pinBuffer = ''; renderPinDots();
  ir('scr-menu', true);
  if (enLinea()) { traerOjo(); sync(); }
}
function salir() { rol = null; ir('scr-portada', true); }

/* ============================================================
   MENÚ
============================================================ */
const MENU_DIR = [
  { id: 'scr-arranque', em: '🚦', t: 'Puesta en marcha', d: 'Lo que falta para el 1 de agosto' },
  { id: 'scr-hoy', em: '🔮', t: 'Hoy', d: 'El ritual de 7 minutos' },
  { id: 'scr-consejo', em: '🏛️', t: 'El Consejo', d: 'Sesión estratégica semanal' },
  { id: 'scr-auditoria', em: '🧭', t: 'Auditoría 360', d: 'Las 10 caras de la Gema' },
  { id: 'scr-ciegos', em: '🕳️', t: 'Puntos ciegos', d: 'Lo que no estás viendo' },
  { id: 'scr-numeros', em: '📈', t: 'Números', d: 'Rentabilidad y equilibrio' },
  { id: 'scr-escandallo', em: '🍔', t: 'Escandallo', d: 'Costo real por platillo' },
  { id: 'scr-misiones', em: '🎯', t: 'Misiones', d: 'Metas y compromisos' },
  { id: 'scr-academia', em: '📚', t: 'Academia', d: 'Formación de dirección' },
  { id: 'scr-retos', em: '🎓', t: 'Retos', d: 'Aprende lo que te frena' },
  { id: 'scr-steph', em: '🗝️', t: 'Gerencia', d: 'Avance de Steph' },
  { id: 'scr-bitacora', em: '📓', t: 'Bitácora', d: 'La memoria del mentor' },
  { id: 'scr-admin', em: '⚙️', t: 'Administrar', d: 'Conexión y ajustes' },
];
const MENU_GER = [
  { id: 'scr-arranque', em: '🚦', t: 'Puesta en marcha', d: 'Lo que falta para el 1 de agosto' },
  { id: 'scr-hoy', em: '🔮', t: 'Hoy', d: 'Ritual de gerencia' },
  { id: 'scr-steph', em: '🗝️', t: 'Mi ruta', d: 'Desarrollo gerencial' },
  { id: 'scr-academia', em: '📚', t: 'Academia', d: 'Lecciones abiertas' },
  { id: 'scr-retos', em: '🎓', t: 'Retos', d: 'Aprende lo que te frena' },
  { id: 'scr-bitacora', em: '📓', t: 'Bitácora', d: 'Lo que he registrado' },
];
function renderMenu() {
  const dir = rol === 'director';
  $('menu-tit').textContent = 'El Mentor Cíclope';
  $('menu-sub').textContent = dir ? 'Dirección · ' + db.config.nombreDir : 'Gerencia · ' + db.config.nombreGer;
  $('menu-grid').innerHTML = (dir ? MENU_DIR : MENU_GER).map(m => {
    let pin = '';
    if (m.id === 'scr-ciegos') { const n = ciegos().filter(c => c.s === 3).length; if (n) pin = '<span class="pin">' + n + ' urgente' + (n > 1 ? 's' : '') + '</span>'; }
    if (m.id === 'scr-hoy' && !ritualDeHoy()) pin = '<span class="pin">pendiente</span>';
    return '<div class="menu-item" onclick="ir(\'' + m.id + '\')"><span class="em">' + m.em + '</span>' +
      '<div class="t">' + m.t + '</div><div class="d">' + m.d + '</div>' + pin + '</div>';
  }).join('');
  $('menu-saludo').innerHTML = tarjetaSaludo();
  chipRed(!!(ojo && ojo._traido));
}
function tarjetaSaludo() {
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombre = rol === 'director' ? db.config.nombreDir : db.config.nombreGer;
  const cg = ciegos();
  const urgentes = cg.filter(c => c.s === 3).length;
  const mad = promedioMadurez();
  const faltanDias = diasEntre(hoyISO(), db.config.arranqueOjo);
  let linea;
  if (!arranqueListo() && faltanDias >= 0)
    linea = 'Faltan <b>' + faltanDias + ' día' + (faltanDias === 1 ? '' : 's') + '</b> para que el sistema arranque en firme, y quedan <b>' +
      (arranqueTotal() - arranqueHechos()) + '</b> puntos de la <b>Puesta en marcha</b>. Ahí es donde hay que estar esta semana.';
  else if (rol !== 'director') linea = 'Tu ritual de gerencia toma 5 minutos. Empieza por ahí.';
  else if (!areasEvaluadas().length) linea = 'Todavía no auditamos ninguna área. Empieza por <b>Auditoría 360</b>: sin diagnóstico no hay mentoría, solo opiniones.';
  else if (urgentes) linea = 'Hay <b>' + urgentes + '</b> punto' + (urgentes > 1 ? 's' : '') + ' ciego' + (urgentes > 1 ? 's' : '') + ' en rojo. Es lo primero que revisaría hoy.';
  else linea = 'Madurez del negocio: <b>' + (Math.round(mad * 10) / 10) + ' / 4</b> · ' + areasEvaluadas().length + ' de ' + M.AREAS.length + ' áreas auditadas.';
  return '<div class="card acento"><h2 style="margin-bottom:6px">' + saludo + ', ' + esc(nombre) + '</h2>' +
    '<div class="peq mut">' + linea + '</div></div>';
}

/* ============================================================
   🔮 HOY — el ritual diario
============================================================ */
function ritualDeHoy() { return db.rituales.find(r => r.fecha === hoyISO() && r.rol === rol); }
/* rotación de áreas con peso extra para las prioridades declaradas */
function rotacion() {
  const p = db.config.prioridades || [];
  const base = M.AREAS.map(a => a.id);
  return base.concat(p.filter(x => base.includes(x)));   // las prioritarias entran dos veces
}
function areaDelDia(fecha) {
  const rot = rotacion();
  const dias = Math.floor(new Date((fecha || hoyISO()) + 'T12:00') / 864e5);
  return rot[dias % rot.length];
}
function preguntaDelDia(fecha) {
  const a = area(areaDelDia(fecha));
  const dias = Math.floor(new Date((fecha || hoyISO()) + 'T12:00') / 864e5);
  return { a, q: a.preguntas[dias % a.preguntas.length] };
}
function leccionPendiente() {
  for (const n of M.ACADEMIA) for (const lid of n.lecciones) if (!db.academia[lid]) return { nivel: n, lec: buscarLeccion(lid) };
  return null;
}
function buscarLeccion(id) { for (const a of M.AREAS) { const l = a.lecciones.find(x => x.id === id); if (l) return Object.assign({ areaId: a.id, areaN: a.n }, l); } return null; }

function renderHoy() {
  tituloBarra('scr-hoy', rol === 'director' ? 'El ritual del día' : 'Ritual de gerencia', fmtFecha(hoyISO()));
  $('hoy-body').innerHTML = rol === 'director' ? hoyDirector() : hoyGerencia();
}

function hoyDirector() {
  const hoy = hoyISO(), ayer = sumar(hoy, -1);
  let h = '';

  /* --- 1 · pulso --- */
  h += '<div class="card"><h2>1 · El pulso</h2>';
  if (!ojo) {
    h += '<p class="peq mut">Todavía no he podido leer la operación. Conecta el backend en <b>Administrar</b> y el pulso se llena solo con los datos reales del Ojo Maestro.</p>' +
      '<button class="btn s chico" onclick="traerOjo(true)">👁️ Intentar ahora</button>';
  } else {
    const { ini, fin } = rangoSemana(hoy), prev = rangoSemana(sumar(ini, -7));
    h += '<div class="grid c4">';
    const vAyer = ventasEn(ayer, ayer);
    const mismos = [1, 2, 3, 4].map(k => ventasEn(sumar(ayer, -7 * k), sumar(ayer, -7 * k))).filter(v => v > 0);
    const prom = mismos.length ? mismos.reduce((a, b) => a + b, 0) / mismos.length : 0;
    h += kpiBox('Ventas de ayer', fmt$(vAyer), prom ? cmp(vAyer, prom, 'vs. promedio de ' + plDia(ayer)) : 'sin histórico');
    /* hasta el último día cerrado, para que la comparación sea de días contra días */
    const corte = corteSemana(ini, hoy) || ini;
    const vSem = ventasEn(ini, corte), vSemPrev = ventasEn(prev.ini, sumar(prev.ini, diasEntre(ini, corte)));
    h += kpiBox('Semana en curso', fmt$(vSem), vSemPrev ? cmp(vSem, vSemPrev, 'vs. mismos días de la semana pasada') : 'sin comparativo');
    const nom = nominaEn(ini, corte) + propinasEn(ini, corte);
    const pn = vSem > 0 ? nom / vSem * 100 : null;
    h += kpiBox('Nómina / ventas', pn == null ? '—' : fmtPct(pn), pn == null ? 'sin datos' : (pn > 33 ? '⚠️ arriba de 33 %' : 'dentro de rango'), pn > 33);
    const cum = cumplimientoEn(ini, corte);
    h += kpiBox('Checklist', cum == null ? '—' : fmtPct(cum), cum == null ? 'sin cierres' : (cum < 90 ? '⚠️ debajo de 90 %' : 'operación sana'), cum != null && cum < 90);
    h += '</div>';

    if (haySuc() && sucursales().length > 1) {
      h += '<div class="tabla-wrap" style="margin-top:12px"><table><tr><th>Sucursal</th><th class="num">Ayer</th><th class="num">Semana</th><th class="num">Faltantes</th></tr>';
      sucursales().forEach(s => {
        const f = faltantes(s.id);
        h += '<tr><td>' + esc(s.nombre) + '</td><td class="num">' + fmt$(ventasEn(ayer, ayer, s.id)) + '</td>' +
          '<td class="num">' + fmt$(ventasEn(ini, hoy, s.id)) + '</td>' +
          '<td class="num">' + (f.agotados.length ? '<b style="color:var(--alerta)">' + f.agotados.length + ' en cero</b>' : f.comprar.length + ' por comprar') + '</td></tr>';
      });
      h += '</table></div>';
    }
    const nov = novedadesEn(sumar(hoy, -2), hoy);
    if (nov.length) h += '<div class="sep"></div><div class="et mini mut">NOVEDADES DEL EQUIPO</div>' +
      nov.slice(0, 4).map(n => '<div class="peq" style="margin-top:6px">· <b>' + esc(n.s) + '</b> (' + fmtCorta(n.f) + '): ' + esc(n.t) + '</div>').join('');
    h += '<div class="mini mut" style="margin-top:10px">Datos leídos de El Ojo Maestro' + (ojo._traido ? ' · actualizado ' + new Date(ojo._traido).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '') +
      ' <a href="#" onclick="traerOjo(true);return false">actualizar</a></div>';
  }
  h += '</div>';

  /* --- 2 · pregunta del día --- */
  const r = ritualDeHoy();
  const pd = preguntaDelDia(hoy);
  h += '<div class="card acento"><h2>2 · La pregunta de hoy</h2>' +
    '<div class="mini mut">' + pd.a.em + ' ' + esc(pd.a.n).toUpperCase() + '</div>' +
    '<p style="font-size:1.05rem;font-weight:600;margin:8px 0 6px">' + esc(pd.q.q) + '</p>' +
    '<p class="peq mut" style="margin-top:0">' + esc(pd.q.porque) + '</p>';
  if (r && r.respuesta) {
    h += '<div class="sep"></div><div class="mini mut">TU RESPUESTA DE HOY</div><div class="peq" style="white-space:pre-wrap;margin-top:5px">' + esc(r.respuesta) + '</div>' +
      '<button class="btn s chico" style="margin-top:10px" onclick="editarRitual()">Editar</button>';
  } else {
    h += '<textarea id="rit-resp" placeholder="Contesta con honestidad. Si la respuesta es «no sé», escríbelo: eso también es un dato."></textarea>' +
      '<label>¿Qué vas a hacer hoy al respecto? (opcional)</label>' +
      '<input id="rit-accion" placeholder="Una acción concreta, no una intención">' +
      '<button class="btn p" style="margin-top:12px" onclick="guardarRitual()">Registrar el día</button>';
  }
  h += '</div>';

  /* --- 3 · micro-lección --- */
  const lp = leccionPendiente();
  h += '<div class="card"><h2>3 · La lección de hoy</h2>';
  if (!lp) h += '<p class="peq mut">Terminaste toda la Academia. Puedes repasar cualquier lección desde <b>Academia</b>.</p>';
  else {
    h += '<div class="mini mut">' + esc(lp.nivel.n) + '</div>' + cardLeccion(lp.lec, true);
  }
  h += '</div>';

  /* --- 4 · aprendizaje activo --- */
  const rAbiertos = retosAbiertos();
  h += '<div class="card"><h2>4 · ¿Algo te frenó hoy?</h2>' +
    '<p class="peq mut">Si hoy chocaste con algo que no sabías, captúralo. Aprender lo que te falta es lo que te mueve al siguiente nivel.</p>' +
    '<button class="btn m chico" onclick="nuevoReto()">🎓 Tengo algo que aprender</button>';
  if (rAbiertos.length) h += '<div class="sep"></div><div class="mini mut">RETOS ABIERTOS</div>' +
    rAbiertos.slice(0, 3).map(r => '<div class="peq" style="margin-top:6px">' + tipoReto(r.tipo).em + ' ' + esc(r.titulo) + '</div>').join('') +
    (rAbiertos.length > 3 ? '<div class="mini mut" style="margin-top:4px">y ' + (rAbiertos.length - 3) + ' más</div>' : '') +
    '<button class="btn s chico" style="margin-top:8px" onclick="ir(\'scr-retos\')">Ver mis retos</button>';
  h += '</div>';

  /* --- 5 · compromisos --- */
  h += cardCompromisos();

  /* --- 5 · ciegos rápidos --- */
  const cg = ciegos().slice(0, 3);
  if (cg.length) {
    h += '<div class="card peligro"><h2>Lo que no estás viendo</h2>' +
      cg.map(c => '<div class="item"><span class="sev s' + c.s + '">' + (c.s === 3 ? 'ALTO' : c.s === 2 ? 'MEDIO' : 'BAJO') + '</span>' +
        '<div class="cuerpo"><div class="t">' + esc(c.t) + '</div><div class="d">' + esc(c.d) + '</div></div></div>').join('') +
      '<button class="btn s chico" style="margin-top:10px" onclick="ir(\'scr-ciegos\')">Ver todos</button></div>';
  }
  return h;
}

function kpiBox(et, v, d, alerta) {
  const cls = /vs\./.test(d || '') ? '' : '';
  return '<div class="kpi' + (alerta ? ' alerta' : '') + '"><div class="et">' + et + '</div><div class="v">' + v + '</div>' +
    '<div class="d ' + cls + '">' + (d || '') + '</div></div>';
}
function cmp(a, b, txt) {
  if (!b) return txt;
  const p = Math.round((a / b - 1) * 100);
  if (!p) return '<span class="mut">sin cambio</span> ' + txt;
  const cls = p > 0 ? 'sube' : 'baja';
  return '<span class="' + cls + '">' + (p > 0 ? '▲' : '▼') + ' ' + Math.abs(p) + ' %</span> ' + txt;
}
/* lunes…viernes ya terminan en s; sábado y domingo sí pluralizan */
const plDia = f => { const d = DIAS[nDia(f)]; return d.endsWith('s') ? d : d + 's'; };

function guardarRitual() {
  const resp = ($('rit-resp').value || '').trim();
  if (!resp) { toast('Escribe tu respuesta'); return; }
  const acc = ($('rit-accion') ? $('rit-accion').value : '').trim();
  const pd = preguntaDelDia(hoyISO());
  db.rituales.unshift({ id: uid(), fecha: hoyISO(), rol, areaId: pd.a.id, pregunta: pd.q.q, respuesta: resp, ts: Date.now() });
  anotar('ritual', pd.a.em + ' ' + pd.q.q, resp);
  if (acc) {
    db.compromisos.unshift({ id: uid(), t: acc, fecha: hoyISO(), limite: hoyISO(), hecho: false, rol, origen: 'ritual' });
    anotar('compromiso', 'Compromiso del día', acc);
  }
  guardarDB(); toast('👁️ Registrado. La constancia es la ventaja.'); repintar();
}
function editarRitual() {
  const r = ritualDeHoy(); if (!r) return;
  modal('<h2>Editar respuesta</h2><textarea id="ed-r">' + esc(r.respuesta) + '</textarea>' +
    '<div class="fila der" style="margin-top:12px"><button class="btn s chico" onclick="cerrarModal()">Cancelar</button>' +
    '<button class="btn p chico" onclick="guardarEdicionRitual(\'' + r.id + '\')">Guardar</button></div>');
}
function guardarEdicionRitual(id) {
  const r = db.rituales.find(x => x.id === id); if (!r) return;
  r.respuesta = $('ed-r').value.trim(); guardarDB(); cerrarModal(); repintar(); toast('Actualizado');
}

/* --- compromisos --- */
function cardCompromisos() {
  const hoy = hoyISO();
  const abiertos = db.compromisos.filter(c => !c.hecho && (rol === 'director' ? true : c.rol === rol));
  let h = '<div class="card"><h2>Compromisos abiertos</h2>';
  if (!abiertos.length) h += '<p class="peq mut">Sin compromisos pendientes. Un compromiso vale más que diez ideas.</p>';
  else h += abiertos.slice(0, 12).map(c => {
    const vencido = c.limite && c.limite < hoy;
    return '<div class="mod"><div class="chk" onclick="cerrarCompromiso(\'' + c.id + '\')"></div>' +
      '<div class="cuerpo"><div class="t">' + esc(c.t) + '</div>' +
      '<div class="d">' + (c.limite ? (vencido ? '<b style="color:var(--alerta)">venció ' + fmtCorta(c.limite) + '</b>' : 'para el ' + fmtCorta(c.limite)) : 'sin fecha') +
      (c.origen ? ' · ' + c.origen : '') + '</div></div></div>';
  }).join('');
  h += '<div class="fila" style="margin-top:12px"><input id="nc-t" placeholder="Nuevo compromiso" style="flex:2">' +
    '<input id="nc-f" type="date" value="' + sumar(hoy, 7) + '" style="flex:1">' +
    '<button class="btn p chico" onclick="nuevoCompromiso()">Agregar</button></div></div>';
  return h;
}
function nuevoCompromiso() {
  const t = ($('nc-t').value || '').trim(); if (!t) { toast('Escribe el compromiso'); return; }
  db.compromisos.unshift({ id: uid(), t, fecha: hoyISO(), limite: $('nc-f').value || '', hecho: false, rol, origen: 'manual' });
  anotar('compromiso', 'Nuevo compromiso', t);
  guardarDB(); repintar(); toast('Anotado');
}
function cerrarCompromiso(id) {
  const c = db.compromisos.find(x => x.id === id); if (!c) return;
  c.hecho = true; c.cerrado = hoyISO();
  anotar('compromiso', 'Compromiso cumplido', c.t);
  guardarDB(); repintar(); toast('✅ Cumplido');
}

/* --- ritual de gerencia --- */
function hoyGerencia() {
  const hoy = hoyISO(), ayer = sumar(hoy, -1);
  let h = '';
  if (ojo) {
    h += '<div class="card"><h2>El pulso de ayer</h2><div class="grid c3">';
    h += kpiBox('Ventas de ayer', fmt$(ventasEn(ayer, ayer)), '');
    const cum = cumplimientoEn(ayer, ayer);
    h += kpiBox('Checklist', cum == null ? '—' : fmtPct(cum), cum != null && cum < 90 ? '⚠️ debajo de 90 %' : '', cum != null && cum < 90);
    let ag = 0; sucursales().forEach(s => ag += faltantes(s.id).agotados.length);
    h += kpiBox('Productos en cero', ag, ag ? '⚠️ revisa inventario' : 'inventario sano', ag > 0);
    h += '</div></div>';
  }
  const dias = Math.floor(new Date(hoy + 'T12:00') / 864e5);
  const q = M.PREGUNTAS_STEPH[dias % M.PREGUNTAS_STEPH.length];
  const r = ritualDeHoy();
  h += '<div class="card acento"><h2>La pregunta de hoy</h2>' +
    '<p style="font-size:1.05rem;font-weight:600;margin:8px 0 6px">' + esc(q.q) + '</p>' +
    '<p class="peq mut" style="margin-top:0">' + esc(q.porque) + '</p>';
  if (r && r.respuesta) h += '<div class="sep"></div><div class="peq" style="white-space:pre-wrap">' + esc(r.respuesta) + '</div>';
  else h += '<textarea id="rit-resp" placeholder="Escribe lo que pasó de verdad, no lo que debería haber pasado."></textarea>' +
    '<label>¿Qué vas a hacer hoy al respecto? (opcional)</label><input id="rit-accion" placeholder="Una acción concreta">' +
    '<button class="btn p" style="margin-top:12px" onclick="guardarRitualGer()">Registrar el día</button>';
  h += '</div>';
  h += cardCompromisos();
  const mod = siguienteModuloSteph();
  if (mod) h += '<div class="card"><h2>Tu siguiente paso</h2><div class="mini mut">' + esc(mod.nivel.n) + '</div>' +
    '<div class="t" style="font-weight:700;margin:6px 0">' + esc(mod.m.t) + '</div>' +
    '<p class="peq mut">' + esc(mod.m.apr) + '</p>' +
    '<button class="btn s chico" onclick="ir(\'scr-steph\')">Ver mi ruta</button></div>';
  return h;
}
function guardarRitualGer() {
  const resp = ($('rit-resp').value || '').trim();
  if (!resp) { toast('Escribe tu respuesta'); return; }
  const acc = ($('rit-accion') ? $('rit-accion').value : '').trim();
  const dias = Math.floor(new Date(hoyISO() + 'T12:00') / 864e5);
  const q = M.PREGUNTAS_STEPH[dias % M.PREGUNTAS_STEPH.length];
  db.rituales.unshift({ id: uid(), fecha: hoyISO(), rol, pregunta: q.q, respuesta: resp, ts: Date.now() });
  anotar('ritual', '🗝️ ' + q.q, resp);
  if (acc) db.compromisos.unshift({ id: uid(), t: acc, fecha: hoyISO(), limite: hoyISO(), hecho: false, rol, origen: 'ritual' });
  guardarDB(); toast('Registrado'); repintar();
}

/* ============================================================
   🏛️ EL CONSEJO — sesión semanal
============================================================ */
let consejoBorrador = null;
function renderConsejo() {
  tituloBarra('scr-consejo', 'El Consejo', 'Sesión estratégica semanal');
  const { ini, fin } = rangoSemana(hoyISO());
  const ya = db.consejos.find(c => c.semana === ini);
  let h = '';
  if (ya && !consejoBorrador) {
    h += '<div class="card ok"><h2>Consejo de esta semana: hecho</h2>' +
      '<p class="peq mut">Realizado el ' + fmtFecha(ya.fecha) + '. Puedes consultarlo abajo o volver a abrirlo para completarlo.</p>' +
      '<button class="btn s chico" onclick="reabrirConsejo(\'' + ya.id + '\')">Abrir de nuevo</button></div>';
    h += actaHTML(ya);
    h += historialConsejos();
    $('consejo-body').innerHTML = h; return;
  }
  if (!consejoBorrador) consejoBorrador = { id: uid(), fecha: hoyISO(), semana: ini, notas: {}, area: areaSemana(), aprendizaje: '' };

  h += '<div class="card acento"><h2>Semana del ' + fmtCorta(ini) + ' al ' + fmtCorta(fin) + '</h2>' +
    '<p class="peq mut">45 minutos, una vez por semana. Es la junta que la mayoría de los dueños nunca tiene consigo mismos. Ve bloque por bloque; se guarda al final.</p></div>';

  M.CONSEJO.forEach(b => {
    h += '<div class="card"><h2>' + b.em + ' ' + esc(b.t) + ' <span class="mini mut">· ' + b.min + ' min</span></h2>' +
      '<p class="peq mut">' + esc(b.g) + '</p>';
    if (b.id === 'cs-1') h += bloqueNumeros();
    if (b.id === 'cs-2') h += bloqueCompromisos();
    if (b.id === 'cs-3') h += bloqueArea();
    if (b.id === 'cs-4') h += bloqueCiegos();
    if (b.id === 'cs-6') h += bloqueDecisiones();
    h += '<textarea id="cs-' + b.id + '" placeholder="Tus notas de este bloque">' + esc(consejoBorrador.notas[b.id] || '') + '</textarea></div>';
  });
  h += '<div class="card"><button class="btn p" onclick="guardarConsejo()">🏛️ Cerrar el Consejo y guardar el acta</button>' +
    '<button class="btn s" style="margin-top:8px" onclick="consejoBorrador=null;repintar()">Descartar</button></div>';
  h += historialConsejos();
  $('consejo-body').innerHTML = h;
}
/* área de la semana: la menos auditada, con preferencia por las prioritarias */
function areaSemana() {
  const hoy = hoyISO();
  const orden = M.AREAS.slice().sort((a, b) => {
    const ea = estadoArea(a.id), eb = estadoArea(b.id);
    const da = ea.ultima ? diasEntre(ea.ultima, hoy) : 9999;
    const dbb = eb.ultima ? diasEntre(eb.ultima, hoy) : 9999;
    const pa = (db.config.prioridades || []).includes(a.id) ? 20 : 0;
    const pb = (db.config.prioridades || []).includes(b.id) ? 20 : 0;
    return (dbb + pb) - (da + pa);
  });
  return orden[0].id;
}
function bloqueNumeros() {
  if (!ojo) return '<p class="peq" style="color:var(--aviso)">Sin conexión a la operación: los números tendrás que traerlos a mano.</p>';
  const { ini } = rangoSemana(hoyISO()), hoy = hoyISO();
  const prev = rangoSemana(sumar(ini, -7));
  /* mismos días contra mismos días: la semana en curso se corta en el
     último día que ya cerró */
  const corte = corteSemana(ini, hoy) || ini;
  const corteP = sumar(prev.ini, diasEntre(ini, corte));
  let h = '<div class="mini mut" style="margin-top:10px">' + fmtCorta(ini) + '–' + fmtCorta(corte) +
    ' contra los mismos días de la semana anterior (' + fmtCorta(prev.ini) + '–' + fmtCorta(corteP) + ')</div>' +
    '<div class="tabla-wrap" style="margin:6px 0 10px"><table><tr><th>Sucursal</th><th class="num">Semana</th><th class="num">Anterior</th><th class="num">Var.</th><th class="num">Nómina %</th><th class="num">Checklist</th></tr>';
  let t1 = 0, t2 = 0;
  sucursales().forEach(s => {
    const v = ventasEn(ini, corte, s.id), vp = ventasEn(prev.ini, corteP, s.id);
    const nom = nominaEn(ini, corte, s.id) + propinasEn(ini, corte, s.id);
    const cum = cumplimientoEn(ini, corte, s.id);
    t1 += v; t2 += vp;
    h += '<tr><td>' + esc(s.nombre) + '</td><td class="num">' + fmt$(v) + '</td><td class="num">' + fmt$(vp) + '</td>' +
      '<td class="num">' + (vp ? (v >= vp ? '<span style="color:var(--ok)">+' : '<span style="color:var(--alerta)">') + Math.round((v / vp - 1) * 100) + ' %</span>' : '—') + '</td>' +
      '<td class="num">' + (v ? fmtPct(nom / v * 100) : '—') + '</td>' +
      '<td class="num">' + (cum == null ? '—' : fmtPct(cum)) + '</td></tr>';
  });
  h += '<tr class="total"><td>TOTAL</td><td class="num">' + fmt$(t1) + '</td><td class="num">' + fmt$(t2) + '</td>' +
    '<td class="num">' + (t2 ? Math.round((t1 / t2 - 1) * 100) + ' %' : '—') + '</td><td></td><td></td></tr></table></div>';
  return h;
}
function bloqueCompromisos() {
  const hoy = hoyISO();
  const abiertos = db.compromisos.filter(c => !c.hecho);
  if (!abiertos.length) return '<p class="peq mut" style="margin:8px 0">Sin compromisos abiertos de la semana pasada.</p>';
  return abiertos.map(c => '<div class="mod"><div class="chk" onclick="cerrarCompromiso(\'' + c.id + '\')"></div>' +
    '<div class="cuerpo"><div class="t">' + esc(c.t) + '</div><div class="d">' +
    (c.limite && c.limite < hoy ? '<b style="color:var(--alerta)">vencido</b> · ' : '') + 'creado ' + fmtCorta(c.fecha) + '</div></div>' +
    '<button class="btn s chico" onclick="borrarCompromiso(\'' + c.id + '\')">Quitar</button></div>').join('');
}
function borrarCompromiso(id) {
  const c = db.compromisos.find(x => x.id === id);
  db.compromisos = db.compromisos.filter(x => x.id !== id);
  if (c) anotar('compromiso', 'Compromiso eliminado', c.t);
  guardarDB(); repintar();
}
function bloqueArea() {
  const a = area(consejoBorrador.area);
  const e = estadoArea(a.id);
  const ni = infoNivel(e.nivel);
  return '<div class="card" style="background:var(--fondo-3);margin:10px 0 0">' +
    '<div class="fila"><span style="font-size:1.6rem">' + a.em + '</span><div style="flex:1"><b>' + esc(a.n) + '</b>' +
    '<div class="mini mut">' + (e.ultima ? 'última auditoría: ' + fmtFecha(e.ultima) : 'nunca auditada') + '</div></div>' +
    '<span class="nivel-chip" style="background:' + ni.c + '">' + esc(ni.t) + '</span></div>' +
    '<p class="peq mut" style="margin:10px 0">' + esc(a.porque) + '</p>' +
    '<button class="btn m" onclick="abrirArea(\'' + a.id + '\')">Hacer el diagnóstico de ' + esc(a.n) + '</button></div>';
}
function bloqueCiegos() {
  const cg = ciegos().slice(0, 6);
  if (!cg.length) return '<p class="peq" style="color:var(--ok);margin:8px 0">Sin puntos ciegos detectados. Disfrútalo: dura poco.</p>';
  return '<div style="margin:8px 0">' + cg.map(c => '<div class="item"><span class="sev s' + c.s + '">' + (c.s === 3 ? 'ALTO' : c.s === 2 ? 'MEDIO' : 'BAJO') + '</span>' +
    '<div class="cuerpo"><div class="t">' + esc(c.t) + '</div><div class="d">' + esc(c.d) + '</div></div></div>').join('') + '</div>';
}
function bloqueDecisiones() {
  return '<div class="fila" style="margin:10px 0"><input id="cs-nc" placeholder="Compromiso de la semana" style="flex:2">' +
    '<input id="cs-nf" type="date" value="' + sumar(hoyISO(), 7) + '" style="flex:1">' +
    '<button class="btn p chico" onclick="compromisoConsejo()">Agregar</button></div>' +
    '<div class="mini mut">Máximo 3. Si son más, no son prioridades.</div>';
}
function compromisoConsejo() {
  const t = ($('cs-nc').value || '').trim(); if (!t) return;
  M.CONSEJO.forEach(b => { consejoBorrador.notas[b.id] = ($('cs-' + b.id) || {}).value || consejoBorrador.notas[b.id] || ''; });
  db.compromisos.unshift({ id: uid(), t, fecha: hoyISO(), limite: $('cs-nf').value || '', hecho: false, rol: 'director', origen: 'consejo' });
  guardarDB(); repintar(); toast('Compromiso agregado');
}
function guardarConsejo() {
  M.CONSEJO.forEach(b => { const e = $('cs-' + b.id); if (e) consejoBorrador.notas[b.id] = e.value.trim(); });
  const c = consejoBorrador;
  c.fecha = hoyISO();
  db.consejos = db.consejos.filter(x => x.semana !== c.semana);
  db.consejos.unshift(c);
  const resumen = M.CONSEJO.filter(b => c.notas[b.id]).map(b => b.t + ': ' + c.notas[b.id]).join('\n\n');
  anotar('consejo', '🏛️ Consejo de la semana del ' + fmtCorta(c.semana), resumen);
  consejoBorrador = null; guardarDB(); toast('🏛️ Acta guardada'); repintar();
}
function reabrirConsejo(id) {
  const c = db.consejos.find(x => x.id === id); if (!c) return;
  consejoBorrador = JSON.parse(JSON.stringify(c));
  renderConsejo();
}
function actaHTML(c) {
  return '<div class="card"><h2>Acta del ' + fmtFecha(c.fecha) + '</h2>' +
    M.CONSEJO.map(b => c.notas[b.id] ? '<div style="margin-bottom:12px"><div class="mini mut">' + b.em + ' ' + esc(b.t).toUpperCase() + '</div>' +
      '<div class="peq" style="white-space:pre-wrap">' + esc(c.notas[b.id]) + '</div></div>' : '').join('') + '</div>';
}
function historialConsejos() {
  if (db.consejos.length < 2) return '';
  return '<div class="card"><h2>Consejos anteriores</h2>' + db.consejos.slice(1, 12).map(c =>
    '<div class="item"><span class="em">🏛️</span><div class="cuerpo"><div class="t">Semana del ' + fmtCorta(c.semana) + '</div>' +
    '<div class="d">' + esc((c.notas['cs-6'] || c.notas['cs-7'] || 'Sin notas').slice(0, 120)) + '</div></div></div>').join('') + '</div>';
}

/* ============================================================
   🧭 AUDITORÍA 360
============================================================ */
function renderAuditoria() {
  tituloBarra('scr-auditoria', 'Auditoría 360', 'Las 10 caras de la Gema');
  const mad = promedioMadurez();
  let h = '<div class="card"><h2>Madurez del negocio</h2>' +
    '<div class="fila"><div style="flex:1"><div style="font-size:2.2rem;font-weight:800;line-height:1">' +
    (mad == null ? '—' : (Math.round(mad * 10) / 10) + ' <span class="mut" style="font-size:1rem">/ 4</span>') + '</div>' +
    '<div class="peq mut">' + areasEvaluadas().length + ' de ' + M.AREAS.length + ' áreas auditadas</div></div>' +
    '<div>' + radarSVG() + '</div></div>' +
    '<p class="peq mut" style="margin-top:12px">Cada área se evalúa con preguntas de sí / a medias / no. El nivel resultante va de <b>Ciego</b> a <b>Maestro</b>. Audita un área por semana: en 10 semanas tienes el mapa completo del negocio.</p></div>';

  h += '<div class="card"><h2>Áreas</h2>' + M.AREAS.map(a => {
    const e = estadoArea(a.id), ni = infoNivel(e.nivel);
    const d = e.ultima ? diasEntre(e.ultima, hoyISO()) : null;
    return '<div class="area-row" onclick="abrirArea(\'' + a.id + '\')"><span class="em">' + a.em + '</span>' +
      '<div class="info"><div class="n">' + esc(a.n) + '</div>' +
      '<div class="sub">' + (e.ultima ? (d === 0 ? 'auditada hoy' : 'hace ' + d + ' día(s)') : 'nunca auditada') +
      ((db.config.prioridades || []).includes(a.id) ? ' · <b style="color:var(--morado)">prioritaria</b>' : '') + '</div></div>' +
      '<span class="nivel-chip" style="background:' + ni.c + '">' + esc(ni.t) + '</span><span class="fl">›</span></div>';
  }).join('') + '</div>';
  $('auditoria-body').innerHTML = h;
}
function radarSVG() {
  const n = M.AREAS.length, R = 62, cx = 78, cy = 78;
  const pt = (i, r) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]; };
  let g = '';
  for (let k = 1; k <= 4; k++) {
    const p = M.AREAS.map((_, i) => pt(i, R * k / 4).map(v => Math.round(v * 10) / 10).join(',')).join(' ');
    g += '<polygon points="' + p + '" fill="none" stroke="var(--borde)" stroke-width="1"/>';
  }
  const pts = M.AREAS.map((a, i) => { const nv = nivelDe(a.id); return pt(i, R * ((nv == null ? 0 : nv) / 4)).map(v => Math.round(v * 10) / 10).join(','); }).join(' ');
  g += '<polygon points="' + pts + '" fill="var(--morado)" fill-opacity=".28" stroke="var(--morado)" stroke-width="2"/>';
  M.AREAS.forEach((a, i) => { const [x, y] = pt(i, R + 9); g += '<text x="' + x + '" y="' + y + '" font-size="8" fill="var(--muted)" text-anchor="middle" dominant-baseline="middle">' + a.em + '</text>'; });
  return '<svg class="radar" viewBox="0 0 156 156" width="156" height="156">' + g + '</svg>';
}

let areaAbierta = null, respBorrador = {};
function abrirArea(id) {
  areaAbierta = id; respBorrador = Object.assign({}, estadoArea(id).respuestas);
  ir('scr-auditoria');
  pintarArea();
}
function pintarArea() {
  const a = area(areaAbierta); if (!a) { renderAuditoria(); return; }
  const e = estadoArea(a.id);
  tituloBarra('scr-auditoria', a.n, 'Diagnóstico');
  const p = puntajeArea(a, respBorrador);
  const nvSug = nivelDesdePuntaje(p);
  const ni = infoNivel(nvSug);

  let h = '<div class="card acento"><div class="fila"><span style="font-size:2rem">' + a.em + '</span>' +
    '<div style="flex:1"><h2 style="margin:0">' + esc(a.n) + '</h2>' +
    '<div class="mini mut">' + (e.ultima ? 'última auditoría: ' + fmtFecha(e.ultima) : 'nunca auditada') + '</div></div></div>' +
    '<p class="peq" style="margin:12px 0 0">' + esc(a.porque) + '</p></div>';

  h += '<div class="card"><h2>Diagnóstico honesto</h2>' +
    '<p class="peq mut">Contesta como si se lo explicaras a un socio que va a poner dinero. Mentirle al diagnóstico solo te cuesta a ti.</p>';
  a.diagnostico.forEach((d, i) => {
    const v = respBorrador[d.id];
    h += '<div style="margin:16px 0 4px"><div style="font-weight:600;font-size:.94rem">' + (i + 1) + '. ' + esc(d.p) + '</div>' +
      '<div class="ops">' +
      [[2, 'Sí, claramente'], [1, 'A medias / a veces'], [0, 'No']].map(([val, txt]) =>
        '<button class="op' + (v === val ? ' sel' : '') + '" onclick="respArea(\'' + d.id + '\',' + val + ')"><span class="mk"></span>' + txt + '</button>').join('') +
      '</div><div class="mini mut" style="margin-top:6px">💡 ' + esc(d.ayuda) + '</div></div>';
  });
  h += '</div>';

  const contestadas = a.diagnostico.filter(d => respBorrador[d.id] != null).length;
  h += '<div class="card ' + (contestadas === a.diagnostico.length ? 'ok' : '') + '"><h2>Resultado</h2>' +
    '<div class="fila"><div style="flex:1"><div class="barra"><i style="width:' + Math.round(p * 100) + '%;background:' + ni.c + '"></i></div>' +
    '<div class="peq mut" style="margin-top:6px">' + contestadas + ' de ' + a.diagnostico.length + ' preguntas contestadas</div></div>' +
    '<span class="nivel-chip" style="background:' + ni.c + '">' + esc(ni.t) + '</span></div>' +
    '<p class="peq" style="margin-top:10px"><b>' + esc(ni.t) + ':</b> ' + esc(ni.d) + '</p>' +
    '<label>Nota para tu yo del futuro (qué encontraste, qué duele)</label>' +
    '<textarea id="ar-nota" placeholder="Lo que quieres recordar la próxima vez que audites esta área">' + esc(e.nota || '') + '</textarea>' +
    '<button class="btn p" style="margin-top:12px" onclick="guardarArea()">Guardar diagnóstico</button>' +
    (contestadas < a.diagnostico.length ? '<div class="mini mut centro" style="margin-top:8px">Puedes guardar incompleto: se calcula con lo contestado.</div>' : '') +
    '</div>';

  /* debilidades detectadas */
  const flojas = a.diagnostico.filter(d => (respBorrador[d.id] || 0) < 2);
  if (flojas.length) h += '<div class="card peligro"><h2>Dónde estás perdiendo</h2>' +
    flojas.map((d, i) => '<div class="item"><span class="em">·</span><div class="cuerpo"><div class="t">' + esc(d.p) + '</div>' +
      '<div class="d">' + esc(d.ayuda) + '</div>' +
      '<div class="fila" style="margin-top:6px"><button class="btn s chico" onclick="compromisoDesde(' + JSON.stringify(esc(d.p)).replace(/"/g, '&quot;') + ')">→ Compromiso</button>' +
      '<button class="btn m chico" onclick="retoDesdeAuditoria(\'' + a.id + '\',' + i + ')">🎓 Aprenderlo</button></div></div></div>').join('') + '</div>';

  h += '<div class="card"><h2>Qué hacen los mejores</h2>' + a.lecciones.map(l => cardLeccion(l, false)).join('') + '</div>';
  h += '<div class="card"><button class="btn s" onclick="areaAbierta=null;renderAuditoria()">← Todas las áreas</button></div>';
  $('auditoria-body').innerHTML = h;
}
function respArea(id, v) { respBorrador[id] = v; guardarNotaArea(); pintarArea(); }
function guardarNotaArea() { const e = $('ar-nota'); if (e && areaAbierta) db.areas[areaAbierta].nota = e.value; }
function guardarArea() {
  const a = area(areaAbierta); if (!a) return;
  guardarNotaArea();
  const p = puntajeArea(a, respBorrador);
  const nv = nivelDesdePuntaje(p);
  const antes = db.areas[a.id].nivel;
  db.areas[a.id].respuestas = respBorrador;
  db.areas[a.id].nivel = nv;
  db.areas[a.id].ultima = hoyISO();
  const flojas = a.diagnostico.filter(d => (respBorrador[d.id] || 0) < 2).map(d => '· ' + d.p).join('\n');
  anotar('auditoria', a.em + ' Auditoría de ' + a.n + ' → ' + infoNivel(nv).t + (antes != null && antes !== nv ? ' (antes ' + infoNivel(antes).t + ')' : ''),
    (db.areas[a.id].nota ? db.areas[a.id].nota + '\n\n' : '') + (flojas ? 'Pendientes:\n' + flojas : ''));
  guardarDB();
  toast('🧭 ' + a.n + ': nivel ' + infoNivel(nv).t);
  areaAbierta = null; renderAuditoria();
}
function compromisoDesde(txt) {
  db.compromisos.unshift({ id: uid(), t: 'Resolver: ' + txt, fecha: hoyISO(), limite: sumar(hoyISO(), 14), hecho: false, rol: 'director', origen: 'auditoría' });
  guardarDB(); toast('Compromiso creado (14 días)');
}
function retoDesdeAuditoria(areaId, i) {
  const a = area(areaId); if (!a) return;
  const flojas = a.diagnostico.filter(d => (respBorrador[d.id] || 0) < 2);
  const d = flojas[i]; if (!d) return;
  const rec = (M.BIBLIOTECA[areaId] || [])[0] || {};
  nuevoReto({ titulo: 'Aprender: ' + d.p.replace(/^¿|\?$/g, ''), porque: d.ayuda, tipo: rec.tipo || 'busqueda', areaId, buscar: rec.buscar || '' });
}
function cardLeccion(l, conBoton) {
  if (!l) return '';
  const hecha = !!db.academia[l.id];
  return '<div class="leccion"><div class="fu">' + esc(l.fuente) + '</div>' +
    '<div class="ti">' + esc(l.t) + '</div>' +
    '<p>' + esc(l.idea) + '</p>' +
    '<div class="et">CÓMO APLICA A EL ANILLO</div><p>' + esc(l.aplica) + '</p>' +
    '<div class="et">TAREA</div><p style="margin-bottom:10px">' + esc(l.tarea) + '</p>' +
    (conBoton || true ? (hecha
      ? '<div class="peq" style="color:var(--ok);font-weight:600">✅ Lección estudiada</div>'
      : '<div class="fila"><button class="btn s chico" onclick="marcarLeccion(\'' + l.id + '\')">Marcar estudiada</button>' +
      '<button class="btn m chico" onclick="tareaLeccion(\'' + l.id + '\')">Convertir tarea en compromiso</button></div>') : '') +
    '</div>';
}
function marcarLeccion(id) {
  db.academia[id] = { hecha: true, ts: Date.now() };
  const l = buscarLeccion(id);
  anotar('academia', '📚 ' + (l ? l.t : id), l ? l.idea : '');
  guardarDB(); repintar(); toast('📚 Lección registrada');
}
function tareaLeccion(id) {
  const l = buscarLeccion(id); if (!l) return;
  db.compromisos.unshift({ id: uid(), t: l.tarea, fecha: hoyISO(), limite: sumar(hoyISO(), 14), hecho: false, rol: 'director', origen: 'academia' });
  db.academia[id] = { hecha: true, ts: Date.now() };
  guardarDB(); repintar(); toast('Compromiso creado (14 días)');
}

/* ============================================================
   🕳️ PUNTOS CIEGOS
============================================================ */
function renderCiegos() {
  tituloBarra('scr-ciegos', 'Puntos ciegos', 'Lo que no estás viendo');
  const cg = ciegos();
  let h = '<div class="card"><h2>' + cg.length + ' señal' + (cg.length === 1 ? '' : 'es') + ' detectada' + (cg.length === 1 ? '' : 's') + '</h2>' +
    '<p class="peq mut">El mentor las calcula solo, cruzando tu operación real con lo que llevas auditado. No todas son problemas: son cosas que nadie está mirando.</p></div>';
  if (!cg.length) h += '<div class="card ok"><p class="peq">Nada en el radar. Ojo: la ausencia de señales también puede significar que faltan datos.</p></div>';
  window._ciegos = cg;
  [3, 2, 1].forEach(s => {
    const l = cg.map((c, i) => ({ c, i })).filter(x => x.c.s === s);
    if (!l.length) return;
    h += '<div class="card"><h2>' + (s === 3 ? '🔴 Atención inmediata' : s === 2 ? '🟠 Revisar esta semana' : '🟡 Tener presente') + '</h2>' +
      l.map(({ c, i }) =>
        '<div class="item"><span class="sev s' + c.s + '">' + (c.s === 3 ? 'ALTO' : c.s === 2 ? 'MEDIO' : 'BAJO') + '</span>' +
        '<div class="cuerpo"><div class="t">' + esc(c.t) + '</div><div class="d">' + esc(c.d) + '</div></div>' +
        (c.et ? '<button class="btn s chico" onclick="accionCiego(' + i + ')">' + esc(c.et) + '</button>' : '') +
        '</div>').join('') + '</div>';
  });
  $('ciegos-body').innerHTML = h;
}
function accionCiego(i) { const c = (window._ciegos || [])[i]; if (c && c.ir) c.ir(); }

/* ============================================================
   📈 NÚMEROS
============================================================ */
let mesNum = mesISO(hoyISO());
function renderNumeros() {
  tituloBarra('scr-numeros', 'Números', 'Rentabilidad y punto de equilibrio');
  let h = '';
  if (!haySuc()) {
    h = '<div class="card"><h2>Falta leer la operación</h2><p class="peq mut">Conecta el backend en Administrar para traer sucursales y ventas del Ojo Maestro.</p>' +
      '<button class="btn p" onclick="traerOjo(true)">👁️ Leer operación</button></div>';
    $('numeros-body').innerHTML = h; return;
  }
  const [y, m] = mesNum.split('-');
  h += '<div class="card"><div class="fila"><button class="btn s chico" onclick="cambiarMes(-1)">←</button>' +
    '<div style="flex:1;text-align:center"><b>' + MESES[+m - 1] + ' ' + y + '</b></div>' +
    '<button class="btn s chico" onclick="cambiarMes(1)">→</button></div>' +
    '<div class="fila" style="margin-top:10px"><button class="btn m chico" onclick="loyTraer()">🧾 Traer de Loyverse</button>' +
    '<button class="btn s chico" onclick="traerOjo(true)">👁️ Releer operación</button></div>' +
    '<div class="mini mut" style="margin-top:8px">Loyverse da las ventas del punto de venta y el número de tickets reales (de ahí sale tu ticket promedio). Usa el mismo conector que ya vive en el Ojo Maestro.</div></div>';

  sucursales().forEach(s => {
    const r = resultado(mesNum, s.id);
    const f = fijosDe(s.id), n = mesDe(mesNum, s.id);
    h += '<div class="card"><h2>' + esc(s.nombre) + '</h2>';
    h += '<div class="grid c4">' +
      kpiBox('Ventas (real)', fmt$(r.ventas), 'del Ojo Maestro') +
      kpiBox('Prime cost', r.prime == null ? '—' : fmtPct(r.prime), r.prime == null ? 'falta insumos' : (r.prime > 65 ? '⚠️ arriba de 65 %' : r.prime > 60 ? 'apretado' : 'sano'), r.prime > 65) +
      kpiBox('Punto de equilibrio', r.equilibrio == null ? '—' : fmt$(r.equilibrio),
        r.metaDia == null ? 'faltan datos' : '<b>' + fmt$(r.metaDia) + ' al día</b> · ' + r.diasAbiertos + ' días abiertos', r.equilibrio && r.ventas < r.equilibrio) +
      kpiBox('Utilidad estimada', fmt$(r.utilidad), r.pctUtilidad == null ? '' : fmtPct(r.pctUtilidad), r.utilidad < 0) +
      '</div>';

    h += '<div class="tabla-wrap" style="margin-top:14px"><table>' +
      fila('Ventas', r.ventas, null, true) +
      fila('− Insumos <span class="mini mut">' + (r.fuente === 'capturado' ? '' : r.fuente) + '</span>', r.insumos, r.pctInsumos) +
      fila('− Nómina <span class="mini mut">' + (r.fuenteNomina === 'turnos' ? 'de los turnos' : 'declarada') + '</span>', r.nomina, r.pctNomina) +
      fila('− Renta', +f.renta || 0, null) +
      fila('− Energía (luz + gas)', energiaDe(s.id), null) +
      fila('− Agua e internet', (+f.agua || 0) + (+f.internet || 0) + (+f.servicios || 0), null) +
      (+f.otros ? fila('− Otros fijos', +f.otros, null) : '') +
      fila('− Marketing', r.mkt, null) +
      fila('− Otros gastos', r.otros, null) +
      '<tr class="total"><td>= Utilidad</td><td class="num">' + fmt$(r.utilidad) + '</td><td class="num">' + (r.pctUtilidad == null ? '' : fmtPct(r.pctUtilidad)) + '</td></tr>' +
      '</table></div>';

    if (r.ticketProm) h += '<div class="peq" style="margin-top:10px">Ticket promedio: <b>' + fmt$(r.ticketProm) + '</b> · ' + r.tickets.toLocaleString('es-MX') + ' tickets</div>';
    h += cuadreLoyverse(r) + cuadreNomina(r);

    h += escenarioCV(s.id, r);

    h += '<div class="sep"></div><div class="mini mut">CAPTURA DEL MES</div><div class="grid c2">' +
      inp('n-cvp-' + s.id, 'Costo de ventas % (el de Loyverse)', n.cvPct) +
      inp('n-ins-' + s.id, 'Compras de insumos $ (si lo tienes exacto, gana este)', n.insumos) +
      inp('n-tic-' + s.id, 'Número de tickets del mes', n.tickets) +
      inp('n-mkt-' + s.id, 'Marketing y pauta', n.marketing) +
      inp('n-otr-' + s.id, 'Otros gastos variables', n.otros) +
      '</div>' +
      '<div class="mini mut" style="margin-top:12px">COSTOS FIJOS (se repiten cada mes)</div><div class="grid c4">' +
      inp('f-ren-' + s.id, 'Renta', f.renta) +
      inp('f-luz-' + s.id, 'Luz', f.luz) +
      inp('f-gas-' + s.id, 'Gas (al mes)', f.gas) +
      inp('f-agu-' + s.id, 'Agua', f.agua) +
      inp('f-int-' + s.id, 'Internet', f.internet) +
      inp('f-sue-' + s.id, 'Sueldos (mientras no arranque el checador)', f.sueldosFijos) +
      inp('f-otr-' + s.id, 'Otros fijos', f.otros) +
      '</div>' +
      '<button class="btn p" style="margin-top:12px" onclick="guardarNumeros(\'' + s.id + '\')">Guardar ' + esc(s.nombre) + '</button>';
    h += '</div>';
  });

  /* consolidado */
  if (sucursales().length > 1) {
    let tv = 0, tu = 0;
    sucursales().forEach(s => { const r = resultado(mesNum, s.id); tv += r.ventas; tu += r.utilidad; });
    h += '<div class="card acento"><h2>Consolidado del mes</h2><div class="grid c2">' +
      kpiBox('Ventas totales', fmt$(tv), '') +
      kpiBox('Utilidad total', fmt$(tu), tv ? fmtPct(tu / tv * 100) : '', tu < 0) + '</div>' +
      '<p class="peq mut" style="margin-top:10px">Recuerda: esta utilidad no incluye impuestos ni tu sueldo de dirección si no lo capturaste en sueldos fijos.</p></div>';
  }

  h += comparativoEnergia();

  /* referencia de KPIs */
  h += '<div class="card"><h2>Cómo se leen estos números</h2>' +
    M.KPIS.filter(k => ['prime', 'foodcost', 'nomina', 'renta', 'utilidad', 'equilibrio', 'ticket', 'plataformas'].includes(k.id))
      .map(k => '<div class="item"><span class="em">📌</span><div class="cuerpo"><div class="t">' + esc(k.n) + ' <span class="mut mini">' + esc(k.f) + '</span></div>' +
        '<div class="d">' + esc(k.ref) + '</div></div></div>').join('') + '</div>';
  $('numeros-body').innerHTML = h;
}
/* ---------- Loyverse ----------
   Reusa el conector que YA vive en el Ojo Maestro (acción 'loyverse',
   un día y una sucursal por llamada). No duplicamos token ni mapeo de
   tiendas: eso ya está resuelto allá y una sola verdad basta. */
async function loyTraer() {
  if (!enLinea()) { toast('Conecta el backend primero'); return; }
  if (!haySuc()) { toast('Primero lee la operación'); return; }
  const sucs = sucursales();
  const total = diasDelMes(mesNum);
  const hoy = hoyISO();
  const acum = {}; sucs.forEach(s => acum[s.id] = { ventas: 0, tickets: 0, efectivo: 0, tarjeta: 0, dias: 0 });
  let fallos = 0;
  modal('<h2>Leyendo Loyverse…</h2><div class="barra"><i id="loy-b" style="width:0%"></i></div>' +
    '<div class="peq mut" style="margin-top:8px" id="loy-t">Preparando…</div>');
  for (let d = 1; d <= total; d++) {
    const f = mesNum + '-' + String(d).padStart(2, '0');
    if (f > hoy) break;
    if ($('loy-t')) { $('loy-t').textContent = 'Día ' + d + ' de ' + total; $('loy-b').style.width = Math.round(d / total * 100) + '%'; }
    try {
      const res = await Promise.all(sucs.map(s => llamar({ action: 'loyverse', fecha: f, sucursalId: s.id })));
      res.forEach((r, i) => {
        if (!r || !r.ok) { fallos++; return; }
        const a = acum[sucs[i].id];
        a.ventas += Number(r.ventas) || 0; a.tickets += Number(r.recibos) || 0;
        a.efectivo += Number(r.efectivo) || 0; a.tarjeta += Number(r.tarjeta) || 0;
        if ((Number(r.ventas) || 0) > 0) a.dias++;
      });
    } catch (e) { fallos++; }
  }
  if (!db.loyverse[mesNum]) db.loyverse[mesNum] = {};
  sucs.forEach(s => { db.loyverse[mesNum][s.id] = Object.assign({ ts: Date.now() }, acum[s.id]); });
  anotar('numeros', '🧾 Loyverse — ' + mesNum, sucs.map(s => {
    const a = acum[s.id];
    return s.nombre + ': ' + fmt$(a.ventas) + ' · ' + a.tickets + ' tickets · ticket prom. ' +
      (a.tickets ? fmt$(a.ventas / a.tickets) : '—') + ' · ' + a.dias + ' días con venta';
  }).join('\n'));
  guardarDB(); cerrarModal(); renderNumeros();
  toast(fallos ? '🧾 Listo, con ' + fallos + ' día(s) sin respuesta' : '🧾 Loyverse actualizado');
}
const diasDelMes = mes => new Date(+mes.slice(0, 4), +mes.slice(5, 7), 0).getDate();
/* La nómina se cuenta UNA vez. Aquí se ve cuál se usó y qué tan lejos está
   el sueldo que traías en la cabeza de lo que de verdad se paga. */
function cuadreNomina(r) {
  if (!r.nominaDecl && !r.nominaOjo) return '';
  if (r.fuenteNomina === 'declarada') {
    const extra = r.nominaOjo > 0
      ? ' Los turnos ya registrados suman ' + fmt$(r.nominaOjo) + ', pero este mes todavía no cuenta para el cálculo.'
      : '';
    return '<div class="peq mut" style="margin-top:8px">📌 Nómina <b>declarada</b> (' + fmt$(r.nominaDecl) + '). ' +
      'Desde el <b>' + fmtFecha(db.config.arranqueOjo) + '</b> se calcula sola con los turnos del Ojo Maestro.' + extra + '</div>';
  }
  if (!r.nominaDecl) return '';
  const dif = r.nominaOjo - r.nominaDecl, pct = Math.abs(dif / r.nominaDecl * 100);
  if (pct < 8) return '<div class="peq" style="margin-top:8px;color:var(--ok)">✅ La nómina real (' + fmt$(r.nominaOjo) + ') coincide con la que traías estimada.</div>';
  return '<div class="peq" style="margin-top:8px;color:var(--' + (pct > 20 ? 'alerta' : 'aviso') + ')">' +
    (dif > 0 ? '🔴 Estás pagando ' + fmt$(dif) + ' más' : '🟠 Estás pagando ' + fmt$(-dif) + ' menos') +
    ' de lo que tenías estimado (' + fmt$(r.nominaDecl) + ' → ' + fmt$(r.nominaOjo) + ', ' + fmtPct(pct) + ').</div>';
}

/* comparación POS contra lo que reporta el equipo */
function cuadreLoyverse(r) {
  if (r.ventasLoy == null || !r.ventasLoy || !r.ventas) return '';
  const dif = r.ventas - r.ventasLoy, pct = Math.abs(dif / r.ventasLoy * 100);
  if (pct < 2) return '<div class="peq" style="margin-top:10px;color:var(--ok)">✅ Cierres del equipo y Loyverse cuadran (diferencia ' + fmtPct(pct) + ').</div>';
  return '<div class="peq" style="margin-top:10px;color:var(--' + (pct > 5 ? 'alerta' : 'aviso') + ')">' +
    (pct > 5 ? '🔴' : '🟠') + ' Loyverse marca ' + fmt$(r.ventasLoy) + ' y los cierres del equipo ' + fmt$(r.ventas) +
    ': ' + (dif > 0 ? 'sobran ' : 'faltan ') + fmt$(Math.abs(dif)) + ' (' + fmtPct(pct) + '). ' +
    'Vale la pena revisar de dónde sale la diferencia.</div>';
}

/* Comparativo de energía entre sucursales.
   Una fríe con electricidad y la otra con gas: comparar solo el recibo de luz
   engaña. Lo que se compara es la energía TOTAL y, mejor aún, la energía por
   cada $100 vendidos — que es lo único que normaliza el volumen. */
function comparativoEnergia() {
  const sucs = sucursales(); if (sucs.length < 2) return '';
  const filas = sucs.map(s => {
    const r = resultado(mesNum, s.id), f = fijosDe(s.id);
    return {
      n: s.nombre, luz: +f.luz || 0, gas: +f.gas || 0, total: energiaDe(s.id),
      ventas: r.ventas, por100: r.ventas > 0 ? energiaDe(s.id) / r.ventas * 100 : null
    };
  });
  const conVentas = filas.filter(x => x.por100 != null);
  let veredicto;
  if (conVentas.length < sucs.length) {
    veredicto = 'Para decidir si conviene cambiar el equipo falta el dato que lo normaliza: <b>las ventas del mes de cada sucursal</b>. ' +
      'Freír más cuesta más energía; sin las ventas al lado, la sucursal que más vende siempre parecerá la más cara.';
  } else {
    const orden = conVentas.slice().sort((a, b) => a.por100 - b.por100);
    const mejor = orden[0], peor = orden[orden.length - 1];
    const brecha = mejor.por100 > 0 ? (peor.por100 / mejor.por100 - 1) * 100 : 0;
    veredicto = brecha < 15
      ? '<b>' + esc(mejor.n) + '</b> y <b>' + esc(peor.n) + '</b> gastan prácticamente lo mismo en energía por peso vendido (' +
      fmtPct(brecha) + ' de diferencia). Con esa brecha, cambiar el equipo no se paga: el dinero está en otro lado.'
      : '<b>' + esc(peor.n) + '</b> gasta <b>' + fmtPct(brecha) + '</b> más energía por peso vendido que <b>' + esc(mejor.n) + '</b>. ' +
      'Ahí sí vale calcular en cuántos meses se paga un cambio de equipo.';
  }
  return '<div class="card"><h2>Energía por sucursal</h2>' +
    '<p class="peq mut">Revolución fríe con electricidad; Tulipanes con gas. Comparar solo el recibo de luz da una conclusión falsa.</p>' +
    '<div class="tabla-wrap" style="margin-top:8px"><table><tr><th>Sucursal</th><th class="num">Luz</th><th class="num">Gas</th>' +
    '<th class="num">Energía total</th><th class="num">Por cada $100 vendidos</th></tr>' +
    filas.map(x => '<tr><td>' + esc(x.n) + '</td><td class="num">' + fmt$(x.luz) + '</td><td class="num">' + fmt$(x.gas) + '</td>' +
      '<td class="num"><b>' + fmt$(x.total) + '</b></td>' +
      '<td class="num">' + (x.por100 == null ? '<span class="mut">falta venta</span>' : '$' + (Math.round(x.por100 * 100) / 100).toFixed(2)) + '</td></tr>').join('') +
    '</table></div><p class="peq" style="margin-top:10px">' + veredicto + '</p></div>';
}

/* Simulador: qué pasa con el punto de equilibrio si baja el costo de ventas.
   Es la palanca de mayor impacto cuando el costo de ventas está alto, y la
   más difícil de ver sin verla en números. */
function escenarioCV(sid, r) {
  const cv = r.cvReal || r.cvPct || 0;
  if (!cv || !r.ventas) return '';
  const objetivo = Number(db.config.cvObjetivo) || 35;
  if (cv <= objetivo + 1) return '';
  const fijosTot = r.fijosTotales;                       // incluye nómina: aquí es costo fijo
  const filas = [cv, (cv + objetivo) / 2, objetivo].map(p => ({
    p,
    pe: (p / 100) < .98 ? fijosTot / (1 - p / 100) : null,
    util: r.ventas - r.ventas * p / 100 - fijosTot
  }));
  return '<div class="card" style="background:var(--amarillo-suave);border-color:var(--amarillo);margin:14px 0 0">' +
    '<h3>Qué pasa si bajas el costo de ventas</h3>' +
    '<div class="peq mut">Con las mismas ventas de este mes (' + fmt$(r.ventas) + ') y la misma nómina.</div>' +
    '<div class="tabla-wrap" style="margin-top:8px"><table><tr><th>Costo de ventas</th><th class="num">Punto de equilibrio</th><th class="num">Utilidad del mes</th></tr>' +
    filas.map((f, i) => '<tr' + (i === 0 ? ' style="opacity:.7"' : '') + '><td>' + fmtPct(f.p) + (i === 0 ? ' <span class="mini mut">hoy</span>' : '') + '</td>' +
      '<td class="num">' + (f.pe == null ? '—' : fmt$(f.pe)) + '</td>' +
      '<td class="num" style="color:' + (f.util >= 0 ? 'var(--ok)' : 'var(--alerta)') + ';font-weight:700">' + fmt$(f.util) + '</td></tr>').join('') +
    '</table></div>' +
    '<div class="peq" style="margin-top:10px">Cada punto porcentual de costo de ventas que recuperas vale <b>' +
    fmt$(r.ventas / 100) + '</b> al mes en esta sucursal, sin vender un peso más.</div></div>';
}

function fila(t, v, pct, fuerte) {
  return '<tr' + (fuerte ? ' style="font-weight:700"' : '') + '><td>' + t + '</td><td class="num">' + fmt$(v) + '</td>' +
    '<td class="num mut">' + (pct == null ? '' : fmtPct(pct)) + '</td></tr>';
}
function inp(id, et, val) {
  return '<div><label>' + et + '</label><input id="' + id + '" type="number" inputmode="decimal" value="' + (Number(val) || '') + '" placeholder="0"></div>';
}
function cambiarMes(d) {
  const [y, m] = mesNum.split('-').map(Number);
  const dd = new Date(y, m - 1 + d, 1);
  mesNum = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0');
  renderNumeros();
}
function guardarNumeros(sid) {
  const g = id => Number(($(id) || {}).value || 0);
  guardarMes(mesNum, sid, {
    insumos: g('n-ins-' + sid), tickets: g('n-tic-' + sid), marketing: g('n-mkt-' + sid),
    otros: g('n-otr-' + sid), cvPct: g('n-cvp-' + sid)
  });
  db.fijos[sid] = {
    renta: g('f-ren-' + sid), luz: g('f-luz-' + sid), gas: g('f-gas-' + sid),
    agua: g('f-agu-' + sid), internet: g('f-int-' + sid), servicios: 0,
    sueldosFijos: g('f-sue-' + sid), otros: g('f-otr-' + sid)
  };
  const r = resultado(mesNum, sid);
  anotar('numeros', '📈 Números de ' + nomSuc(sid) + ' — ' + mesNum,
    'Ventas ' + fmt$(r.ventas) + ' · Prime cost ' + (r.prime == null ? '—' : fmtPct(r.prime)) +
    ' · Utilidad ' + fmt$(r.utilidad) + ' · Equilibrio ' + (r.equilibrio == null ? '—' : fmt$(r.equilibrio)));
  guardarDB(); renderNumeros(); toast('📈 Guardado');
}

/* ============================================================
   🎯 MISIONES (OKR) + fechas
============================================================ */
function renderMisiones() {
  tituloBarra('scr-misiones', 'Misiones', 'Metas trimestrales y compromisos');
  let h = '<div class="card"><h2>Misión del trimestre</h2>' +
    '<p class="peq mut">Un objetivo, máximo 3 resultados clave con número. Lo que no tiene número no es meta.</p>' +
    '<button class="btn m chico" style="margin-top:8px" onclick="nuevaMision()">+ Nueva misión</button></div>';

  const activas = db.misiones.filter(m => m.activa);
  if (!activas.length) h += '<div class="card"><p class="peq mut">Sin misión activa. Trabajar sin meta trimestral es trabajar por inercia.</p></div>';
  activas.forEach(m => {
    const avance = m.krs.length ? m.krs.reduce((a, k) => a + Math.min(1, (Number(k.actual) || 0) / (Number(k.meta) || 1)), 0) / m.krs.length : 0;
    h += '<div class="card acento"><div class="fila"><div style="flex:1"><h2 style="margin:0">' + esc(m.objetivo) + '</h2>' +
      '<div class="mini mut">' + esc(m.trimestre || '') + (m.ultimoAvance ? ' · último avance ' + fmtCorta(m.ultimoAvance) : '') + '</div></div>' +
      '<div style="font-size:1.5rem;font-weight:800">' + Math.round(avance * 100) + '%</div></div>' +
      '<div class="barra" style="margin:10px 0 14px"><i style="width:' + Math.round(avance * 100) + '%"></i></div>';
    m.krs.forEach((k, i) => {
      const p = Math.min(1, (Number(k.actual) || 0) / (Number(k.meta) || 1));
      h += '<div style="margin-bottom:12px"><div class="fila"><div style="flex:1"><b class="peq">' + esc(k.t) + '</b></div>' +
        '<div class="peq mut">' + (Number(k.actual) || 0).toLocaleString('es-MX') + ' / ' + (Number(k.meta) || 0).toLocaleString('es-MX') + ' ' + esc(k.u || '') + '</div></div>' +
        '<div class="barra" style="margin-top:5px"><i style="width:' + Math.round(p * 100) + '%;background:' + (p >= 1 ? 'var(--ok)' : 'var(--morado)') + '"></i></div>' +
        '<div class="fila" style="margin-top:6px"><input type="number" id="kr-' + m.id + '-' + i + '" value="' + (Number(k.actual) || 0) + '" style="max-width:120px">' +
        '<button class="btn s chico" onclick="avanzarKR(\'' + m.id + '\',' + i + ')">Actualizar</button></div></div>';
    });
    h += '<div class="fila der"><button class="btn s chico" onclick="cerrarMision(\'' + m.id + '\')">Cerrar misión</button></div></div>';
  });

  h += cardCompromisos();

  /* fechas críticas */
  h += '<div class="card"><h2>Fechas que no se pueden olvidar</h2>' +
    '<p class="peq mut">Licencias, permisos, seguros, contratos, impuestos. El mentor te avisa 60 días antes.</p>';
  if (db.fechas.length) h += db.fechas.slice().sort((a, b) => (a.vence || '').localeCompare(b.vence || '')).map(f => {
    const d = f.vence ? diasEntre(hoyISO(), f.vence) : null;
    return '<div class="item"><span class="em">' + (d != null && d < 0 ? '🔴' : d != null && d <= 60 ? '🟠' : '🗓️') + '</span>' +
      '<div class="cuerpo"><div class="t">' + esc(f.t) + '</div><div class="d">' + (f.vence ? fmtFecha(f.vence) + (d != null ? ' · ' + (d < 0 ? 'vencido hace ' + Math.abs(d) + ' días' : 'en ' + d + ' días') : '') : 'sin fecha') + '</div></div>' +
      '<button class="btn s chico" onclick="borrarFecha(\'' + f.id + '\')">✕</button></div>';
  }).join('');
  h += '<div class="fila" style="margin-top:12px"><input id="fe-t" placeholder="Licencia, permiso, seguro…" style="flex:2">' +
    '<input id="fe-v" type="date" style="flex:1"><button class="btn p chico" onclick="nuevaFecha()">Agregar</button></div></div>';

  /* cerradas */
  const cerradas = db.misiones.filter(m => !m.activa);
  if (cerradas.length) h += '<div class="card"><h2>Misiones cerradas</h2>' + cerradas.map(m =>
    '<div class="item"><span class="em">🏁</span><div class="cuerpo"><div class="t">' + esc(m.objetivo) + '</div>' +
    '<div class="d">' + esc(m.trimestre || '') + '</div></div></div>').join('') + '</div>';
  $('misiones-body').innerHTML = h;
}
function nuevaMision() {
  const q = Math.floor(new Date().getMonth() / 3) + 1;
  modal('<h2>Nueva misión</h2>' +
    '<label>Objetivo (inspirador, sin número)</label><input id="mi-o" placeholder="Ej. Que cada sucursal se sostenga sola">' +
    '<label>Trimestre</label><input id="mi-t" value="Q' + q + ' ' + new Date().getFullYear() + '">' +
    '<div class="sep"></div><div class="mini mut">RESULTADOS CLAVE (con número)</div>' +
    [1, 2, 3].map(i => '<div class="fila" style="margin-top:8px"><input id="mi-k' + i + '" placeholder="Resultado clave ' + i + '" style="flex:2">' +
      '<input id="mi-m' + i + '" type="number" placeholder="Meta" style="flex:1"><input id="mi-u' + i + '" placeholder="unidad" style="flex:1"></div>').join('') +
    '<div class="fila der" style="margin-top:14px"><button class="btn s chico" onclick="cerrarModal()">Cancelar</button>' +
    '<button class="btn p chico" onclick="guardarMision()">Crear misión</button></div>');
}
function guardarMision() {
  const o = ($('mi-o').value || '').trim(); if (!o) { toast('Escribe el objetivo'); return; }
  const krs = [1, 2, 3].map(i => ({ t: ($('mi-k' + i).value || '').trim(), meta: Number($('mi-m' + i).value || 0), actual: 0, u: ($('mi-u' + i).value || '').trim() }))
    .filter(k => k.t && k.meta);
  if (!krs.length) { toast('Agrega al menos un resultado con número'); return; }
  db.misiones.unshift({ id: uid(), objetivo: o, trimestre: $('mi-t').value.trim(), krs, activa: true, creada: hoyISO(), ultimoAvance: hoyISO() });
  anotar('mision', '🎯 Nueva misión: ' + o, krs.map(k => '· ' + k.t + ' → ' + k.meta + ' ' + k.u).join('\n'));
  guardarDB(); cerrarModal(); repintar(); toast('🎯 Misión creada');
}
function avanzarKR(mid, i) {
  const m = db.misiones.find(x => x.id === mid); if (!m) return;
  m.krs[i].actual = Number($('kr-' + mid + '-' + i).value || 0);
  m.ultimoAvance = hoyISO();
  anotar('mision', '🎯 Avance en ' + m.objetivo, m.krs[i].t + ': ' + m.krs[i].actual + ' / ' + m.krs[i].meta);
  guardarDB(); repintar(); toast('Avance registrado');
}
function cerrarMision(id) {
  const m = db.misiones.find(x => x.id === id); if (!m) return;
  m.activa = false; m.cerrada = hoyISO();
  anotar('mision', '🏁 Misión cerrada: ' + m.objetivo, m.krs.map(k => '· ' + k.t + ': ' + k.actual + ' de ' + k.meta).join('\n'));
  guardarDB(); repintar();
}
function nuevaFecha() {
  const t = ($('fe-t').value || '').trim(); if (!t) return;
  db.fechas.push({ id: uid(), t, vence: $('fe-v').value || '' });
  guardarDB(); repintar(); toast('Fecha agregada');
}
function borrarFecha(id) { db.fechas = db.fechas.filter(f => f.id !== id); guardarDB(); repintar(); }

/* ============================================================
   📚 ACADEMIA
============================================================ */
function renderAcademia() {
  tituloBarra('scr-academia', 'Academia', 'El Archivo de la Casa Amarilla');
  const total = M.ACADEMIA.reduce((a, n) => a + n.lecciones.length, 0);
  const hechas = M.ACADEMIA.reduce((a, n) => a + n.lecciones.filter(l => db.academia[l]).length, 0);
  let h = '<div class="card acento"><h2>Tu formación</h2>' +
    '<div class="barra"><i style="width:' + Math.round(hechas / total * 100) + '%"></i></div>' +
    '<div class="peq mut" style="margin-top:8px">' + hechas + ' de ' + total + ' lecciones · ' +
    'Cada lección trae la idea, cómo aplica a El Anillo del Cíclope y una tarea que puedes convertir en compromiso.</div></div>';

  let desbloqueado = true;
  M.ACADEMIA.forEach(n => {
    const done = n.lecciones.filter(l => db.academia[l]).length;
    const completo = done === n.lecciones.length;
    h += '<div class="card"><div class="fila"><span style="font-size:1.6rem">' + n.em + '</span>' +
      '<div style="flex:1"><h2 style="margin:0;font-size:1.05rem">' + esc(n.n) + '</h2>' +
      '<div class="mini mut">' + esc(n.objetivo) + '</div></div>' +
      '<div class="peq mut">' + done + '/' + n.lecciones.length + '</div></div>';
    if (!desbloqueado) {
      h += '<p class="peq mut" style="margin-top:10px">🔒 Se abre al terminar el nivel anterior.</p>';
    } else {
      h += '<div style="margin-top:12px">' + n.lecciones.map(lid => cardLeccion(buscarLeccion(lid), true)).join('') + '</div>' +
        '<div class="peq" style="margin-top:6px"><b>Prueba de nivel:</b> ' + esc(n.prueba) + '</div>';
    }
    h += '</div>';
    if (!completo) desbloqueado = false;
  });
  $('academia-body').innerHTML = h;
}

/* ============================================================
   📓 BITÁCORA — memoria
============================================================ */
let filtroBit = '', buscaBit = '';
function renderBitacora() {
  tituloBarra('scr-bitacora', 'Bitácora', 'La memoria del mentor');
  const tipos = [['', 'Todo'], ['ritual', 'Rituales'], ['consejo', 'Consejos'], ['auditoria', 'Auditorías'],
  ['numeros', 'Números'], ['mision', 'Misiones'], ['academia', 'Lecciones'], ['reto', 'Retos'], ['compromiso', 'Compromisos'], ['nota', 'Notas']];
  let h = '<div class="card"><div class="tabs">' + tipos.map(([v, t]) =>
    '<button class="' + (filtroBit === v ? 'on' : '') + '" onclick="filtroBit=\'' + v + '\';renderBitacora()">' + t + '</button>').join('') + '</div>' +
    '<input id="bit-q" placeholder="Buscar en toda la memoria…" value="' + esc(buscaBit) + '" oninput="buscaBit=this.value;clearTimeout(window._bt);window._bt=setTimeout(renderBitacora,300)">' +
    '<div class="fila" style="margin-top:10px"><input id="bit-nota" placeholder="Anotar algo (idea, decisión, aprendizaje)" style="flex:2">' +
    '<button class="btn p chico" onclick="notaLibre()">Anotar</button></div></div>';

  const q = buscaBit.toLowerCase();
  const lista = db.bitacora.filter(e =>
    (!filtroBit || e.tipo === filtroBit) &&
    (rol === 'director' || e.rol === rol) &&
    (!q || (e.t + ' ' + e.c).toLowerCase().includes(q))
  );
  h += '<div class="card"><h2>' + lista.length + ' registro' + (lista.length === 1 ? '' : 's') + '</h2>';
  if (!lista.length) h += '<p class="peq mut">Nada aquí todavía. Todo lo que registres en el mentor se guarda para siempre en esta bitácora.</p>';
  else {
    let ultFecha = '';
    h += '<div class="log">' + lista.slice(0, 250).map(e => {
      const cab = e.fecha !== ultFecha ? (ultFecha = e.fecha, '<div class="f">' + fmtFecha(e.fecha) + '</div>') : '';
      return '<div class="e">' + cab + '<div class="t">' + esc(e.t) + '</div>' +
        (e.c ? '<div class="c">' + esc(e.c) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
    if (lista.length > 250) h += '<div class="mini mut centro" style="margin-top:10px">Mostrando los 250 más recientes de ' + lista.length + '</div>';
  }
  h += '</div>';
  $('bitacora-body').innerHTML = h;
}
function notaLibre() {
  const t = ($('bit-nota').value || '').trim(); if (!t) return;
  anotar('nota', t, ''); guardarDB(); renderBitacora(); toast('Anotado en la memoria');
}

/* ============================================================
   🗝️ GERENCIA — ruta de Steph
============================================================ */
function siguienteModuloSteph() {
  for (const n of M.RUTA_STEPH) for (const m of n.modulos) {
    const e = db.steph.modulos[m.id] || {};
    if (!e.apr || !e.prac || !e.dem) return { nivel: n, m };
  }
  return null;
}
function renderSteph() {
  const dir = rol === 'director';
  tituloBarra('scr-steph', dir ? 'Desarrollo de Gerencia' : 'Mi ruta', dir ? db.config.nombreGer : 'Nivel a nivel');
  const total = M.RUTA_STEPH.reduce((a, n) => a + n.modulos.length * 3, 0);
  let done = 0;
  M.RUTA_STEPH.forEach(n => n.modulos.forEach(m => { const e = db.steph.modulos[m.id] || {}; done += (e.apr ? 1 : 0) + (e.prac ? 1 : 0) + (e.dem ? 1 : 0); }));
  const pct = Math.round(done / total * 100);

  let h = '<div class="card acento"><h2>' + (dir ? 'Avance de ' + esc(db.config.nombreGer) : 'Tu avance') + '</h2>' +
    '<div class="barra"><i style="width:' + pct + '%"></i></div>' +
    '<div class="peq mut" style="margin-top:8px">' + pct + '% · ' + done + ' de ' + total + ' pasos' +
    (db.steph.ultimo ? ' · último avance ' + fmtFecha(db.steph.ultimo) : '') + '</div>' +
    '<p class="peq mut" style="margin-top:10px">Cada módulo tiene tres pasos: <b>aprender</b> (entender la idea), <b>practicar</b> (hacerlo un número de veces) y <b>demostrar</b> (probar que ya se domina). Solo Dirección marca el paso de demostrar.</p></div>';

  M.RUTA_STEPH.forEach(n => {
    const dn = n.modulos.reduce((a, m) => { const e = db.steph.modulos[m.id] || {}; return a + (e.apr && e.prac && e.dem ? 1 : 0); }, 0);
    h += '<div class="card"><div class="fila"><span style="font-size:1.6rem">' + n.em + '</span>' +
      '<div style="flex:1"><h2 style="margin:0;font-size:1.05rem">' + esc(n.n) + '</h2><div class="mini mut">' + esc(n.d) + '</div></div>' +
      '<div class="peq mut">' + dn + '/' + n.modulos.length + '</div></div><div style="margin-top:10px">';
    n.modulos.forEach(m => {
      const e = db.steph.modulos[m.id] || {};
      h += '<div style="padding:12px 0;border-bottom:1px solid var(--borde)">' +
        '<div style="font-weight:600;font-size:.94rem">' + esc(m.t) + '</div>' +
        paso(m.id, 'apr', '📖 Aprender', m.apr, e.apr, true) +
        paso(m.id, 'prac', '🔁 Practicar', m.prac, e.prac, true) +
        paso(m.id, 'dem', '🏅 Demostrar', m.dem, e.dem, dir) +
        '</div>';
    });
    h += '</div></div>';
  });

  if (dir) {
    h += '<div class="card"><h2>Evaluación de desempeño</h2>' +
      '<p class="peq mut">Una vez al mes: qué hizo bien, qué debe mejorar y qué sigue. Queda registrado para su crecimiento y su compensación.</p>' +
      '<label>Lo que hizo bien este periodo</label><textarea id="ev-bien"></textarea>' +
      '<label>Lo que debe mejorar</label><textarea id="ev-mal"></textarea>' +
      '<label>Compromiso para el siguiente mes</label><input id="ev-sig">' +
      '<button class="btn p" style="margin-top:12px" onclick="guardarEval()">Guardar evaluación</button>';
    if (db.steph.evals.length) h += '<div class="sep"></div>' + db.steph.evals.slice(0, 6).map(e =>
      '<div class="e" style="padding:10px 0;border-bottom:1px solid var(--borde)"><div class="f mini mut">' + fmtFecha(e.fecha) + '</div>' +
      '<div class="peq"><b>Bien:</b> ' + esc(e.bien) + '</div><div class="peq"><b>Mejorar:</b> ' + esc(e.mal) + '</div>' +
      (e.sig ? '<div class="peq"><b>Siguiente:</b> ' + esc(e.sig) + '</div>' : '') + '</div>').join('');
    h += '</div>';

    /* ritual de Steph visto por Dirección */
    const rits = db.rituales.filter(r => r.rol === 'gerencia').slice(0, 8);
    if (rits.length) h += '<div class="card"><h2>Sus últimos registros</h2>' + rits.map(r =>
      '<div class="e" style="padding:10px 0;border-bottom:1px solid var(--borde)"><div class="mini mut">' + fmtFecha(r.fecha) + '</div>' +
      '<div class="peq" style="font-weight:600">' + esc(r.pregunta) + '</div>' +
      '<div class="peq mut" style="white-space:pre-wrap">' + esc(r.respuesta) + '</div></div>').join('') + '</div>';
  }
  $('steph-body').innerHTML = h;
}
function paso(mid, k, et, txt, on, puede) {
  return '<div class="mod" style="border:none;padding:8px 0 0">' +
    '<div class="chk' + (on ? ' on' : '') + '"' + (puede ? ' onclick="togglePaso(\'' + mid + '\',\'' + k + '\')"' : ' style="opacity:.45;cursor:not-allowed"') + '>' + (on ? '✓' : '') + '</div>' +
    '<div class="cuerpo"><div class="peq"><b>' + et + '</b> · ' + esc(txt) + '</div></div></div>';
}
function togglePaso(mid, k) {
  if (!db.steph.modulos[mid]) db.steph.modulos[mid] = {};
  const e = db.steph.modulos[mid];
  e[k] = !e[k];
  db.steph.ultimo = hoyISO();
  let nom = '';
  M.RUTA_STEPH.forEach(n => n.modulos.forEach(m => { if (m.id === mid) nom = m.t; }));
  anotar('gerencia', '🗝️ ' + nom + ' — ' + ({ apr: 'aprender', prac: 'practicar', dem: 'demostrar' }[k]) + (e[k] ? ' ✅' : ' ↩️'), '', rol);
  guardarDB(); renderSteph();
}
function guardarEval() {
  const bien = ($('ev-bien').value || '').trim(), mal = ($('ev-mal').value || '').trim();
  if (!bien && !mal) { toast('Escribe al menos una parte'); return; }
  const e = { id: uid(), fecha: hoyISO(), bien, mal, sig: ($('ev-sig').value || '').trim() };
  db.steph.evals.unshift(e);
  anotar('gerencia', '🗝️ Evaluación de ' + db.config.nombreGer, 'Bien: ' + bien + '\nMejorar: ' + mal + (e.sig ? '\nSiguiente: ' + e.sig : ''));
  if (e.sig) db.compromisos.unshift({ id: uid(), t: e.sig, fecha: hoyISO(), limite: sumar(hoyISO(), 30), hecho: false, rol: 'gerencia', origen: 'evaluación' });
  guardarDB(); renderSteph(); toast('Evaluación guardada');
}

/* ============================================================
   🍔 ESCANDALLO — costo real por platillo
   Los gramajes vienen del recetario; solo se capturan precios.
============================================================ */
const precioInsumo = id => Number((db.insumos || {})[id] || 0);
function costoReceta(r) {
  let costo = 0, faltan = [];
  r.items.forEach(([iid, c]) => {
    if (!c) return;
    const p = precioInsumo(iid);
    if (!p) { faltan.push(iid); return; }
    costo += p * c;
  });
  return { costo, faltan, completo: !faltan.length };
}
function analisisReceta(r) {
  const { costo, faltan, completo } = costoReceta(r);
  const margen = r.precio - costo;
  return { costo, faltan, completo, margen, cvPct: r.precio > 0 ? costo / r.precio * 100 : null };
}
/* costo de ventas promedio ponderado por lo que se vende */
function cvPonderado() {
  const mix = db.mixVentas || {};
  let ing = 0, cost = 0, n = 0;
  M.RECETAS_COSTO.forEach(r => {
    const q = Number(mix[r.id] || 0); if (!q) return;
    const a = analisisReceta(r); if (!a.completo) return;
    ing += r.precio * q; cost += a.costo * q; n += q;
  });
  return n ? { pct: cost / ing * 100, ingreso: ing, costo: cost, platillos: n } : null;
}

let catEsc = '';
function renderEscandallo() {
  tituloBarra('scr-escandallo', 'Escandallo', 'Cuánto cuesta de verdad cada platillo');
  const total = M.RECETAS_COSTO.length;
  const listas = M.RECETAS_COSTO.filter(r => analisisReceta(r).completo).length;
  const capturados = M.INSUMOS.filter(i => precioInsumo(i.id) > 0).length;

  let h = '<div class="card acento"><h2>El dato que decide todo</h2>' +
    '<div class="barra"><i style="width:' + Math.round(capturados / M.INSUMOS.length * 100) + '%"></i></div>' +
    '<div class="peq mut" style="margin-top:8px">' + capturados + ' de ' + M.INSUMOS.length + ' insumos con precio · ' +
    listas + ' de ' + total + ' platillos costeados</div>' +
    '<p class="peq" style="margin-top:12px">Los gramajes ya vienen del recetario del Ojo Maestro. Solo captura <b>cuánto te cuesta cada insumo</b> ' +
    'en su unidad de compra, con la factura de esta semana. Cada precio que capturas cuesta 20 segundos y te dice si estás ganando o regalando.</p></div>';

  const pond = cvPonderado();
  if (pond) h += '<div class="card ' + (pond.pct > 40 ? 'peligro' : 'ok') + '"><h2>Tu costo de ventas real</h2>' +
    '<div style="font-size:2.2rem;font-weight:800;line-height:1">' + fmtPct(pond.pct) + '</div>' +
    '<div class="peq mut">Ponderado por lo que de verdad vendes (' + pond.platillos.toLocaleString('es-MX') + ' platillos capturados en el mix).</div>' +
    '<button class="btn s chico" style="margin-top:10px" onclick="aplicarCV()">Usar este % en Números</button></div>';

  /* platillos */
  const cats = [''].concat([...new Set(M.RECETAS_COSTO.map(r => r.cat))]);
  h += '<div class="card"><div class="tabs">' + cats.map(c =>
    '<button class="' + (catEsc === c ? 'on' : '') + '" onclick="catEsc=\'' + c + '\';renderEscandallo()">' + (c || 'Todos') + '</button>').join('') + '</div>' +
    '<div class="tabla-wrap"><table><tr><th>Platillo</th><th class="num">Precio</th><th class="num">Costo</th><th class="num">Margen</th><th class="num">Costo %</th></tr>' +
    M.RECETAS_COSTO.filter(r => !catEsc || r.cat === catEsc).map(r => {
      const a = analisisReceta(r);
      const col = !a.completo ? 'var(--muted)' : a.cvPct > 40 ? 'var(--alerta)' : a.cvPct > 33 ? 'var(--aviso)' : 'var(--ok)';
      return '<tr onclick="verReceta(\'' + r.id + '\')" style="cursor:pointer"><td>' + esc(r.n) + '</td>' +
        '<td class="num">' + fmt$(r.precio) + '</td>' +
        '<td class="num">' + (a.completo ? fmt$(a.costo) : '<span class="mut">faltan ' + a.faltan.length + '</span>') + '</td>' +
        '<td class="num">' + (a.completo ? fmt$(a.margen) : '—') + '</td>' +
        '<td class="num" style="color:' + col + ';font-weight:700">' + (a.completo ? fmtPct(a.cvPct) : '—') + '</td></tr>';
    }).join('') + '</table></div>' +
    '<div class="mini mut" style="margin-top:8px">Verde ≤33 % · Ámbar 33-40 % · Rojo &gt;40 %. Toca un platillo para ver su desglose y ajustar gramajes.</div></div>';

  /* insumos por grupo */
  const grupos = [...new Set(M.INSUMOS.map(i => i.g))];
  grupos.forEach(g => {
    h += '<div class="card"><h2>' + esc(g) + '</h2><div class="grid c2">' +
      M.INSUMOS.filter(i => i.g === g).map(i =>
        '<div><label>' + esc(i.n) + ' <span class="mut">($ por ' + i.u + ')</span></label>' +
        '<input id="ins-' + i.id + '" type="number" inputmode="decimal" step="0.01" value="' + (precioInsumo(i.id) || '') + '" placeholder="0">' +
        (i.ayuda ? '<div class="mini mut" style="margin-top:4px">' + esc(i.ayuda) + '</div>' : '') + '</div>').join('') +
      '</div></div>';
  });
  h += '<div class="card"><button class="btn p" onclick="guardarInsumos()">💾 Guardar precios</button></div>';
  $('escandallo-body').innerHTML = h;
}
function guardarInsumos() {
  if (!db.insumos) db.insumos = {};
  let n = 0;
  M.INSUMOS.forEach(i => { const e = $('ins-' + i.id); if (!e) return; const v = Number(e.value || 0); if (v > 0) { db.insumos[i.id] = v; n++; } else delete db.insumos[i.id]; });
  const pond = cvPonderado();
  anotar('numeros', '🍔 Escandallo: ' + n + ' insumos con precio',
    M.RECETAS_COSTO.filter(r => analisisReceta(r).completo)
      .map(r => { const a = analisisReceta(r); return '· ' + r.n + ': cuesta ' + fmt$(a.costo) + ' de ' + fmt$(r.precio) + ' (' + fmtPct(a.cvPct) + ')'; }).join('\n') +
    (pond ? '\nCosto de ventas ponderado: ' + fmtPct(pond.pct) : ''));
  guardarDB(); renderEscandallo(); toast('💾 ' + n + ' precios guardados');
}
function verReceta(id) {
  const r = M.RECETAS_COSTO.find(x => x.id === id); if (!r) return;
  const a = analisisReceta(r);
  modal('<h2>' + esc(r.n) + '</h2>' +
    '<div class="peq mut">Precio de venta ' + fmt$(r.precio) + (a.completo ? ' · cuesta ' + fmt$(a.costo) + ' (' + fmtPct(a.cvPct) + ')' : '') + '</div>' +
    '<div class="tabla-wrap" style="margin-top:12px"><table><tr><th>Insumo</th><th class="num">Cantidad</th><th class="num">Costo</th></tr>' +
    r.items.filter(([, c]) => c).map(([iid, c]) => {
      const i = M.INSUMOS.find(x => x.id === iid) || { n: iid, u: '?' };
      const p = precioInsumo(iid);
      const cant = (i.u === 'kg' || i.u === 'L') ? (c * 1000) + (i.u === 'kg' ? ' g' : ' ml') : c + ' ' + i.u;
      return '<tr><td>' + esc(i.n) + '</td><td class="num">' + cant + '</td>' +
        '<td class="num">' + (p ? fmt$(p * c) : '<span style="color:var(--alerta)">falta precio</span>') + '</td></tr>';
    }).join('') +
    (a.completo ? '<tr class="total"><td>COSTO TOTAL</td><td></td><td class="num">' + fmt$(a.costo) + '</td></tr>' +
      '<tr class="total"><td>MARGEN</td><td></td><td class="num" style="color:' + (a.margen > 0 ? 'var(--ok)' : 'var(--alerta)') + '">' + fmt$(a.margen) + '</td></tr>' : '') +
    '</table></div>' +
    '<label>¿Cuántos vendiste este mes? (para el promedio ponderado)</label>' +
    '<input id="mix-' + r.id + '" type="number" value="' + ((db.mixVentas || {})[r.id] || '') + '" placeholder="0">' +
    '<div class="fila der" style="margin-top:14px"><button class="btn s chico" onclick="cerrarModal()">Cerrar</button>' +
    '<button class="btn p chico" onclick="guardarMix(\'' + r.id + '\')">Guardar</button></div>');
}
function guardarMix(id) {
  if (!db.mixVentas) db.mixVentas = {};
  const v = Number(($('mix-' + id) || {}).value || 0);
  if (v > 0) db.mixVentas[id] = v; else delete db.mixVentas[id];
  guardarDB(); cerrarModal(); renderEscandallo(); toast('Guardado');
}
function aplicarCV() {
  const p = cvPonderado(); if (!p) return;
  sucursales().forEach(s => guardarMes(mesNum, s.id, { cvPct: Math.round(p.pct * 10) / 10 }));
  anotar('numeros', '🍔 Costo de ventas del escandallo aplicado a Números', fmtPct(p.pct));
  guardarDB(); toast('Aplicado a ambas sucursales'); ir('scr-numeros');
}

/* ============================================================
   🎓 RETOS DE APRENDIZAJE — aprendizaje just-in-time
   Cuando chocas con algo que no sabes, se vuelve un reto rastreable.
============================================================ */
const tipoReto = id => M.TIPOS_RETO.find(t => t.id === id) || { em: '📌', n: '—' };
const retosAbiertos = () => db.retos.filter(r => r.estado !== 'hecho' && r.estado !== 'archivado');

let filtroReto = 'abiertos';
function renderRetos() {
  tituloBarra('scr-retos', 'Retos de aprendizaje', 'Lo que necesitas saber para avanzar');
  const abiertos = retosAbiertos();
  const enCurso = abiertos.filter(r => r.estado === 'en-curso').length;

  let h = '<div class="card acento"><h2>Aprende justo lo que te frena</h2>' +
    '<p class="peq mut">Cada vez que choques con algo que no sabes —un número que no entiendes, una decisión que no sabes tomar, una herramienta nueva— captúralo aquí. ' +
    'El mentor lo convierte en un reto con un recurso real y pasos concretos. No se trata de saber todo: se trata de aprender lo siguiente.</p>' +
    '<button class="btn p" style="margin-top:10px" onclick="nuevoReto()">➕ Tengo algo que aprender</button></div>';

  /* sugerencias del mentor a partir de puntos ciegos y áreas flojas */
  const sug = retosSugeridos();
  if (sug.length) {
    h += '<div class="card"><h2>El mentor te sugiere aprender</h2>' +
      '<p class="peq mut">Nacen de tus auditorías y puntos ciegos. Tócalos para convertirlos en reto.</p>' +
      sug.slice(0, 4).map(s => '<div class="item"><span class="em">' + s.em + '</span>' +
        '<div class="cuerpo"><div class="t">' + esc(s.t) + '</div><div class="d">' + esc(s.porque) + '</div></div>' +
        '<button class="btn s chico" onclick="crearRetoSugerido(' + s.i + ')">Adoptar</button></div>').join('') + '</div>';
    window._sug = sug;
  }

  /* filtros */
  h += '<div class="card"><div class="tabs">' +
    [['abiertos', 'Abiertos ' + abiertos.length], ['en-curso', 'En curso ' + enCurso], ['hechos', 'Aprendidos'], ['todos', 'Todos']]
      .map(([v, t]) => '<button class="' + (filtroReto === v ? 'on' : '') + '" onclick="filtroReto=\'' + v + '\';renderRetos()">' + t + '</button>').join('') + '</div>';

  const lista = db.retos.filter(r => {
    if (filtroReto === 'abiertos') return r.estado !== 'hecho' && r.estado !== 'archivado';
    if (filtroReto === 'en-curso') return r.estado === 'en-curso';
    if (filtroReto === 'hechos') return r.estado === 'hecho';
    return true;
  });

  if (!lista.length) h += '<p class="peq mut">Nada aquí todavía. Cuando algo te detenga, captúralo: la mejor inversión de un director es aprender lo que le falta.</p>';
  else h += lista.map(cardReto).join('');
  h += '</div>';

  /* biblioteca por área */
  h += '<div class="card"><h2>📚 Biblioteca del Cíclope</h2>' +
    '<p class="peq mut">Recursos reales por área, listos para cuando los necesites. Cada uno abre su búsqueda.</p>';
  M.AREAS.filter(a => M.BIBLIOTECA[a.id]).forEach(a => {
    h += '<div style="margin-top:14px"><div class="mini mut">' + a.em + ' ' + esc(a.n).toUpperCase() + '</div>' +
      M.BIBLIOTECA[a.id].map((r, i) => '<div class="item"><span class="em">' + tipoReto(r.tipo).em + '</span>' +
        '<div class="cuerpo"><div class="t">' + esc(r.t) + (r.autor ? ' <span class="mut mini">· ' + esc(r.autor) + '</span>' : '') + '</div>' +
        '<div class="d">' + esc(r.que) + '</div></div>' +
        '<button class="btn s chico" onclick="retoDesdeBiblio(\'' + a.id + '\',' + i + ')">+ Reto</button></div>').join('') + '</div>';
  });
  h += '</div>';
  $('retos-body').innerHTML = h;
}

function cardReto(r) {
  const t = tipoReto(r.tipo);
  const area = r.areaId ? M.AREAS.find(a => a.id === r.areaId) : null;
  const mis = r.misionId ? db.misiones.find(m => m.id === r.misionId) : null;
  const pasos = r.pasos || [];
  const hechos = pasos.filter(p => p.done).length;
  const vencido = r.limite && r.limite < hoyISO() && r.estado !== 'hecho';
  return '<div class="card" style="border-left:5px solid ' + (r.estado === 'hecho' ? 'var(--ok)' : vencido ? 'var(--alerta)' : 'var(--morado)') + '">' +
    '<div class="fila"><span style="font-size:1.5rem">' + t.em + '</span>' +
    '<div style="flex:1"><div class="t" style="font-weight:700">' + esc(r.titulo) + '</div>' +
    '<div class="mini mut">' + t.n + (area ? ' · ' + area.em + ' ' + esc(area.n) : '') + (mis ? ' · 🎯 ' + esc(mis.objetivo.slice(0, 30)) : '') +
    (r.limite ? ' · ' + (vencido ? '<b style="color:var(--alerta)">venció ' + fmtCorta(r.limite) + '</b>' : 'para ' + fmtCorta(r.limite)) : '') + '</div></div></div>' +
    (r.porque ? '<p class="peq mut" style="margin:8px 0 0">' + esc(r.porque) + '</p>' : '') +
    (r.buscar ? '<div style="margin-top:8px"><a href="https://www.google.com/search?q=' + encodeURIComponent(r.buscar) + '" target="_blank" rel="noopener" class="peq">🔎 Buscar: ' + esc(r.buscar) + '</a></div>' : '') +
    (r.recurso ? '<div class="peq" style="margin-top:6px">🔗 ' + (r.recurso.startsWith('http') ? '<a href="' + esc(r.recurso) + '" target="_blank" rel="noopener">' + esc(r.recurso) + '</a>' : esc(r.recurso)) + '</div>' : '') +
    (pasos.length ? '<div style="margin-top:10px">' + pasos.map((p, i) =>
      '<div class="mod" style="padding:7px 0"><div class="chk' + (p.done ? ' on' : '') + '" onclick="pasoReto(\'' + r.id + '\',' + i + ')">' + (p.done ? '✓' : '') + '</div>' +
      '<div class="cuerpo"><div class="peq"' + (p.done ? ' style="text-decoration:line-through;opacity:.6"' : '') + '>' + esc(p.t) + '</div></div></div>').join('') +
      '<div class="mini mut">' + hechos + '/' + pasos.length + ' pasos</div></div>' : '') +
    (r.estado === 'hecho'
      ? '<div class="peq" style="margin-top:10px;color:var(--ok)">✅ Aprendido' + (r.aprendizaje ? ': ' + esc(r.aprendizaje) : '') + '</div>'
      : '<div class="fila" style="margin-top:12px">' +
      (r.estado !== 'en-curso' ? '<button class="btn s chico" onclick="arrancarReto(\'' + r.id + '\')">▶ Empezar</button>' : '') +
      '<button class="btn m chico" onclick="completarReto(\'' + r.id + '\')">✓ Ya lo aprendí</button>' +
      '<button class="btn s chico" onclick="editarReto(\'' + r.id + '\')">✏️</button>' +
      '<button class="btn s chico" onclick="borrarReto(\'' + r.id + '\')">🗑️</button></div>') +
    '</div>';
}

function nuevoReto(pre) {
  pre = pre || {};
  const areas = M.AREAS.map(a => '<option value="' + a.id + '"' + (pre.areaId === a.id ? ' selected' : '') + '>' + a.em + ' ' + esc(a.n) + '</option>').join('');
  const mis = db.misiones.filter(m => m.activa).map(m => '<option value="' + m.id + '"' + (pre.misionId === m.id ? ' selected' : '') + '>' + esc(m.objetivo.slice(0, 40)) + '</option>').join('');
  modal('<h2>Tengo algo que aprender</h2>' +
    '<label>¿Qué necesitas aprender o resolver?</label>' +
    '<input id="rt-t" value="' + esc(pre.titulo || '') + '" placeholder="Ej. Cómo bajar el costo del boneless sin bajar la porción">' +
    '<label>¿Por qué lo necesitas ahora? (qué te está frenando)</label>' +
    '<textarea id="rt-p" placeholder="Con qué decisión o problema te topaste">' + esc(pre.porque || '') + '</textarea>' +
    '<label>¿Cómo lo vas a aprender?</label>' +
    '<div class="ops" id="rt-tipos">' + M.TIPOS_RETO.map(t =>
      '<button class="op' + ((pre.tipo || 'busqueda') === t.id ? ' sel' : '') + '" onclick="selTipoReto(\'' + t.id + '\')" data-t="' + t.id + '"><span class="mk"></span>' + t.em + ' ' + t.n + ' <span class="mut mini">— ' + t.d + '</span></button>').join('') + '</div>' +
    '<div class="grid c2"><div><label>Área</label><select id="rt-a"><option value="">— ninguna —</option>' + areas + '</select></div>' +
    '<div><label>Ligar a una misión</label><select id="rt-m"><option value="">— ninguna —</option>' + mis + '</select></div></div>' +
    '<label>Recurso o link (opcional)</label><input id="rt-r" value="' + esc(pre.recurso || '') + '" placeholder="Un libro, un curso, un video, una persona…">' +
    '<label>Fecha límite (opcional)</label><input id="rt-l" type="date" value="' + (pre.limite || '') + '">' +
    '<input type="hidden" id="rt-tipo" value="' + (pre.tipo || 'busqueda') + '"><input type="hidden" id="rt-buscar" value="' + esc(pre.buscar || '') + '">' +
    '<div class="fila der" style="margin-top:16px"><button class="btn s chico" onclick="cerrarModal()">Cancelar</button>' +
    '<button class="btn p chico" onclick="guardarReto()">Crear reto</button></div>');
}
function selTipoReto(id) {
  $('rt-tipo').value = id;
  document.querySelectorAll('#rt-tipos .op').forEach(b => b.classList.toggle('sel', b.dataset.t === id));
}
function guardarReto() {
  const titulo = ($('rt-t').value || '').trim(); if (!titulo) { toast('Escribe qué necesitas aprender'); return; }
  const r = {
    id: uid(), titulo, porque: ($('rt-p').value || '').trim(), tipo: $('rt-tipo').value || 'busqueda',
    areaId: $('rt-a').value || '', misionId: $('rt-m').value || '', recurso: ($('rt-r').value || '').trim(),
    buscar: ($('rt-buscar').value || '').trim(), limite: $('rt-l').value || '',
    estado: 'nuevo', pasos: [], fecha: hoyISO(), ts: Date.now()
  };
  db.retos.unshift(r);
  anotar('reto', '🎓 Nuevo reto: ' + titulo, r.porque);
  guardarDB(); cerrarModal(); renderRetos(); toast('🎓 Reto creado');
}
function arrancarReto(id) { const r = db.retos.find(x => x.id === id); if (!r) return; r.estado = 'en-curso'; r.ts = Date.now(); guardarDB(); renderRetos(); }
function pasoReto(id, i) { const r = db.retos.find(x => x.id === id); if (!r || !r.pasos[i]) return; r.pasos[i].done = !r.pasos[i].done; if (r.estado === 'nuevo') r.estado = 'en-curso'; r.ts = Date.now(); guardarDB(); renderRetos(); }
function borrarReto(id) { const r = db.retos.find(x => x.id === id); db.retos = db.retos.filter(x => x.id !== id); if (r) anotar('reto', '🗑️ Reto eliminado', r.titulo); guardarDB(); renderRetos(); }
function completarReto(id) {
  const r = db.retos.find(x => x.id === id); if (!r) return;
  modal('<h2>Ya lo aprendí</h2><p class="peq mut">Lo más valioso: en una frase, ¿qué te llevas? Queda en la Bitácora para siempre.</p>' +
    '<div class="mini mut" style="margin-top:8px">' + esc(r.titulo) + '</div>' +
    '<textarea id="rt-ap" placeholder="Lo que aprendí y cómo lo voy a aplicar"></textarea>' +
    '<label>¿Nace una acción de esto? (opcional, se vuelve compromiso)</label><input id="rt-ac" placeholder="Una acción concreta">' +
    '<div class="fila der" style="margin-top:14px"><button class="btn s chico" onclick="cerrarModal()">Cancelar</button>' +
    '<button class="btn p chico" onclick="cerrarReto(\'' + id + '\')">Guardar aprendizaje</button></div>');
}
function cerrarReto(id) {
  const r = db.retos.find(x => x.id === id); if (!r) return;
  r.estado = 'hecho'; r.aprendizaje = ($('rt-ap').value || '').trim(); r.cerrado = hoyISO(); r.ts = Date.now();
  anotar('reto', '🎓 Aprendido: ' + r.titulo, r.aprendizaje || '');
  const ac = ($('rt-ac').value || '').trim();
  if (ac) { db.compromisos.unshift({ id: uid(), t: ac, fecha: hoyISO(), limite: sumar(hoyISO(), 14), hecho: false, rol: 'director', origen: 'aprendizaje' }); }
  guardarDB(); cerrarModal(); renderRetos(); toast('🎓 Aprendizaje registrado');
}
function editarReto(id) { const r = db.retos.find(x => x.id === id); if (!r) return; cerrarModal(); nuevoReto(r); db.retos = db.retos.filter(x => x.id !== id); }
function retoDesdeBiblio(areaId, i) {
  const r = M.BIBLIOTECA[areaId][i];
  nuevoReto({ titulo: r.t, porque: r.que, tipo: r.tipo, areaId, recurso: r.autor ? ('Autor: ' + r.autor) : '', buscar: r.buscar });
}
/* sugerencias: áreas flojas + números que faltan → aprendizaje concreto */
function retosSugeridos() {
  const out = [];
  const yaTengo = t => db.retos.some(r => r.titulo === t);
  M.AREAS.forEach(a => {
    const nv = nivelDe(a.id);
    if (nv != null && nv <= 1 && M.BIBLIOTECA[a.id]) {
      const rec = M.BIBLIOTECA[a.id][0];
      const t = 'Subir de nivel en ' + a.n;
      if (!yaTengo(t)) out.push({ em: a.em, t, porque: a.n + ' está en nivel bajo. Empieza por: ' + rec.t + '.', pre: { titulo: t, porque: 'Auditoría marcó ' + a.n + ' en nivel bajo.', tipo: rec.tipo, areaId: a.id, recurso: rec.autor ? 'Autor: ' + rec.autor : '', buscar: rec.buscar } });
    }
  });
  /* si el costo de ventas está alto, sugiere aprender escandallo */
  if (haySuc()) {
    const mes = mesISO(hoyISO());
    sucursales().forEach(s => {
      const r = resultado(mes, s.id); const cv = r.cvReal || r.cvPct;
      const t = 'Bajar el costo de ventas con escandallo';
      if (cv && cv >= 40 && !yaTengo(t) && !out.some(o => o.t === t)) {
        const rec = M.BIBLIOTECA.rentabilidad[1];
        out.push({ em: '🍔', t, porque: 'Tu costo de ventas va en ' + Math.round(cv) + '%. Aprender a costear cada platillo es la palanca #1.', pre: { titulo: t, porque: 'Costo de ventas en ' + Math.round(cv) + '%.', tipo: 'taller', areaId: 'rentabilidad', buscar: rec.buscar } });
      }
    });
  }
  out.forEach((o, i) => o.i = i);
  return out;
}
function crearRetoSugerido(i) { const s = (window._sug || [])[i]; if (s) nuevoReto(s.pre); }

/* ============================================================
   🚦 PUESTA EN MARCHA — los días previos al arranque formal
============================================================ */
function arranqueTotal() { return M.ARRANQUE.reduce((a, f) => a + f.items.length, 0); }
function arranqueHechos() { return M.ARRANQUE.reduce((a, f) => a + f.items.filter(i => db.arranque[i.id]).length, 0); }
function arranqueListo() { return arranqueHechos() === arranqueTotal(); }

function renderArranque() {
  const dia1 = db.config.arranqueOjo;
  const faltan = diasEntre(hoyISO(), dia1);
  tituloBarra('scr-arranque', 'Puesta en marcha', faltan > 0 ? 'Faltan ' + faltan + ' días para el arranque' : 'Ya arrancó');
  const hechos = arranqueHechos(), total = arranqueTotal();
  const pct = Math.round(hechos / total * 100);

  let h = '<div class="card acento"><h2>' + (faltan > 0 ? 'Faltan ' + faltan + ' días' : 'El sistema ya está en vivo') + '</h2>' +
    '<div class="barra"><i style="width:' + pct + '%"></i></div>' +
    '<div class="peq mut" style="margin-top:8px">' + hechos + ' de ' + total + ' puntos listos para el ' + fmtFecha(dia1) + '</div>' +
    '<p class="peq" style="margin-top:12px">Estos días son de aprendizaje: el equipo practica con el sistema real y todo lo que falle se corrige ahora. ' +
    'Los errores de esta semana son gratis; los de agosto cuestan dinero.</p>' +
    '<p class="peq mut">Hasta el ' + fmtFecha(dia1) + ' la nómina que usa el mentor es la que declaraste. ' +
    'A partir de ese día se calcula sola con los turnos del Ojo Maestro, y ahí empieza tu historia real de números.</p></div>';

  h += '<div class="card"><h2>La rutina de estos días</h2>' +
    M.RUTINA_ARRANQUE.map(r => '<div class="item"><span class="em">' + r.em + '</span>' +
      '<div class="cuerpo"><div class="t">' + esc(r.t) + '</div><div class="d">' + esc(r.d) + '</div></div></div>').join('') + '</div>';

  M.ARRANQUE.forEach(f => {
    const d = f.items.filter(i => db.arranque[i.id]).length;
    h += '<div class="card' + (d === f.items.length ? ' ok' : '') + '"><div class="fila"><span style="font-size:1.6rem">' + f.em + '</span>' +
      '<div style="flex:1"><h2 style="margin:0;font-size:1.05rem">' + esc(f.n) + '</h2>' +
      '<div class="mini mut">' + esc(f.d) + '</div></div><div class="peq mut">' + d + '/' + f.items.length + '</div></div>' +
      '<div style="margin-top:12px">' + f.items.map(i => {
        const on = !!db.arranque[i.id];
        return '<div class="mod"><div class="chk' + (on ? ' on' : '') + '" onclick="toggleArranque(\'' + i.id + '\')">' + (on ? '✓' : '') + '</div>' +
          '<div class="cuerpo"><div class="t"' + (on ? ' style="text-decoration:line-through;opacity:.6"' : '') + '>' + esc(i.t) + '</div>' +
          '<div class="d">' + esc(i.q) + '</div>' +
          '<div class="d" style="margin-top:4px"><b>' + esc(i.quien) + '</b> · ' + esc(i.donde) + '</div></div></div>';
      }).join('') + '</div></div>';
  });

  h += '<div class="card"><h2>Fecha de arranque</h2>' +
    '<p class="peq mut">Desde este día el mentor toma la nómina de los turnos del Ojo Maestro en lugar del sueldo declarado.</p>' +
    '<input type="date" id="arr-fecha" value="' + dia1 + '">' +
    '<button class="btn s chico" style="margin-top:10px" onclick="guardarArranqueFecha()">Guardar fecha</button></div>';
  $('arranque-body').innerHTML = h;
}
function toggleArranque(id) {
  db.arranque[id] = !db.arranque[id];
  let nom = '';
  M.ARRANQUE.forEach(f => f.items.forEach(i => { if (i.id === id) nom = i.t; }));
  anotar('arranque', '🚦 ' + nom + (db.arranque[id] ? ' ✅' : ' ↩️'), '');
  guardarDB(); renderArranque();
  if (arranqueListo()) toast('🚦 Todo listo para el arranque');
}
function guardarArranqueFecha() {
  const v = $('arr-fecha').value; if (!v) return;
  db.config.arranqueOjo = v;
  anotar('arranque', '🚦 Fecha de arranque: ' + fmtFecha(v), '');
  guardarDB(); renderArranque(); toast('Fecha guardada');
}

/* ============================================================
   ⚙️ ADMINISTRAR
============================================================ */
function renderAdmin() {
  tituloBarra('scr-admin', 'Administrar', 'Conexión y ajustes');
  const c = db.config;
  let h = '<div class="card"><h2>Conexión con El Ojo Maestro</h2>' +
    '<p class="peq mut">El mentor lee la operación real (ventas, nómina, inventario, checklist) del mismo backend del Ojo Maestro. Pega aquí la misma URL <b>/exec</b>.</p>' +
    '<label>URL del backend (Google Apps Script)</label><input id="cf-url" value="' + esc(c.scriptUrl) + '" placeholder="https://script.google.com/macros/s/…/exec">' +
    '<div class="fila" style="margin-top:12px"><button class="btn p chico" onclick="guardarConfig()">💾 Guardar</button>' +
    '<button class="btn s chico" onclick="probar()">🔌 Probar</button>' +
    '<button class="btn s chico" onclick="traerOjo(true)">👁️ Leer operación</button>' +
    '<button class="btn s chico" onclick="sync(true)">☁️ Sincronizar mentor</button></div>' +
    (ojo ? '<div class="peq" style="margin-top:12px;color:var(--ok)">✅ Operación leída: ' + (ojo.sucursales || []).length + ' sucursales, ' +
      (ojo.cierres || []).length + ' cierres, ' + (ojo.personal || []).length + ' personas.</div>'
      : '<div class="peq" style="margin-top:12px;color:var(--aviso)">⚠️ Todavía sin datos de operación. El mentor funciona igual, pero sin números reales.</div>') +
    '</div>';

  h += '<div class="card"><h2>Accesos</h2><div class="grid c2">' +
    '<div><label>Nombre de Dirección</label><input id="cf-nd" value="' + esc(c.nombreDir) + '"></div>' +
    '<div><label>Nombre de Gerencia</label><input id="cf-ng" value="' + esc(c.nombreGer) + '"></div>' +
    '<div><label>PIN de Dirección</label><input id="cf-pd" value="' + esc(c.pinDir) + '" maxlength="4" inputmode="numeric"></div>' +
    '<div><label>PIN de Gerencia</label><input id="cf-pg" value="' + esc(c.pinGer) + '" maxlength="4" inputmode="numeric"></div>' +
    '</div><button class="btn p" style="margin-top:12px" onclick="guardarConfig()">💾 Guardar</button></div>';

  h += '<div class="card"><h2>Áreas prioritarias</h2>' +
    '<p class="peq mut">Las prioritarias aparecen el doble de seguido en el ritual diario y se auditan primero en el Consejo.</p>' +
    '<div class="fila" style="margin-top:10px">' + M.AREAS.map(a =>
      '<button class="btn ' + ((c.prioridades || []).includes(a.id) ? 'm' : 's') + ' chico" onclick="togglePrioridad(\'' + a.id + '\')">' + a.em + ' ' + esc(a.n) + '</button>').join('') + '</div></div>';

  h += '<div class="card"><h2>Respaldo</h2>' +
    '<div class="fila"><button class="btn s chico" onclick="exportar()">⬇️ Descargar respaldo</button>' +
    '<button class="btn s chico" onclick="$(\'imp\').click()">⬆️ Restaurar</button>' +
    '<input type="file" id="imp" accept="application/json" style="display:none" onchange="importar(this)"></div>' +
    '<div class="mini mut" style="margin-top:10px">Versión ' + VERSION + ' · ' + db.bitacora.length + ' registros en la memoria</div>' +
    '<button class="btn s chico" style="margin-top:10px" onclick="forzarActualizacion()">🔄 Buscar actualización</button></div>';
  $('admin-body').innerHTML = h;
}
function guardarConfig() {
  const c = db.config;
  if ($('cf-url')) c.scriptUrl = $('cf-url').value.trim();
  if ($('cf-nd')) c.nombreDir = $('cf-nd').value.trim() || 'Toño';
  if ($('cf-ng')) c.nombreGer = $('cf-ng').value.trim() || 'Steph';
  if ($('cf-pd')) c.pinDir = ($('cf-pd').value.trim() || '2626').slice(0, 4);
  if ($('cf-pg')) c.pinGer = ($('cf-pg').value.trim() || '1515').slice(0, 4);
  guardarDB(); toast('Guardado'); renderAdmin();
}
function togglePrioridad(id) {
  const p = db.config.prioridades || [];
  db.config.prioridades = p.includes(id) ? p.filter(x => x !== id) : p.concat(id);
  guardarDB(); renderAdmin();
}
async function probar() {
  const u = $('cf-url').value.trim(); if (!u) { toast('Pega la URL'); return; }
  db.config.scriptUrl = u; guardarDB(true);
  try {
    const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'ping' }) });
    const j = await r.json();
    toast(j && j.ok ? '✅ Conexión correcta' : '⚠️ Respondió, pero con error');
    chipRed(!!(j && j.ok));
  } catch (e) { toast('❌ No respondió'); chipRed(false); }
}
function exportar() {
  const b = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'mentor-ciclope-' + hoyISO() + '.json'; a.click();
}
function importar(inp) {
  const f = inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      if (!j.config) throw 0;
      const url = db.config.scriptUrl;
      db = j; migrar(); db.config.scriptUrl = db.config.scriptUrl || url;
      guardarDB(); toast('Respaldo restaurado'); repintar();
    } catch (e) { toast('Archivo no válido'); }
  };
  r.readAsText(f);
}
async function forzarActualizacion() {
  if ('caches' in window) { const k = await caches.keys(); await Promise.all(k.map(x => caches.delete(x))); }
  if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); }
  location.reload(true);
}

/* ============================================================
   TEMA
============================================================ */
function initTema() {
  const t = localStorage.getItem('mentor_tema');
  document.documentElement.setAttribute('data-tema', t === 'oscuro' ? 'oscuro' : 'claro');
  /* la tipografía de la marca viaja en base64 dentro de assets.js */
  if (window.CICLOPE_ASSETS && CICLOPE_ASSETS.font && !$('fuente-css')) {
    const st = document.createElement('style'); st.id = 'fuente-css';
    st.textContent = "@font-face{font-family:'SerifGothic';src:url(data:font/otf;base64," +
      CICLOPE_ASSETS.font + ") format('opentype');font-display:swap}";
    document.head.appendChild(st);
  }
  aplicarLogo();
}
function toggleTema() {
  const o = document.documentElement.getAttribute('data-tema') === 'oscuro';
  document.documentElement.setAttribute('data-tema', o ? 'claro' : 'oscuro');
  localStorage.setItem('mentor_tema', o ? 'claro' : 'oscuro');
  aplicarLogo();
}
function aplicarLogo() {
  const A = window.CICLOPE_ASSETS || {};
  const b64 = A.isotipo || A.logo;
  const src = b64 ? 'data:image/png;base64,' + b64 : 'img/icono.png';
  ['portada-logo', 'menu-logo'].forEach(id => { const e = $(id); if (e) e.src = src; });
}

/* ============================================================
   ARRANQUE
============================================================ */
function initPinPad() {
  $('pinpad').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'x'].map(n =>
    n === '' ? '<div></div>' : '<button onclick="tecla(\'' + n + '\')">' + (n === 'x' ? '⌫' : n) + '</button>').join('');
}
function initAviso() {
  const e = $('portada-aviso'); if (!e) return;
  e.innerHTML = enLinea() ? '' :
    '<div class="card" style="margin-top:16px;text-align:left"><div class="peq"><b>Modo local.</b> El mentor funciona, pero sin los números reales de la operación. ' +
    'Entra a Dirección → Administrar y pega la URL del backend del Ojo Maestro.</div></div>';
  $('portada-version').textContent = 'Versión ' + VERSION;
}
window.addEventListener('DOMContentLoaded', () => {
  cargarDB(); initTema(); initPinPad(); initAviso();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
  setInterval(() => { if (rol && enLinea()) { sync(); } }, 120000);
});

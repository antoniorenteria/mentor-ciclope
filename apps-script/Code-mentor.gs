/* ============================================================
   EL MENTOR CICLOPE - complemento para el backend de El Ojo Maestro

   COMO SE INSTALA (una sola vez, 3 minutos):
   1. Entra a script.google.com con elanillodelciclope@gmail.com
   2. Abre el proyecto "El Ojo Maestro"
   3. Pega TODO este archivo AL FINAL del Code.gs que ya tienes
      (no borres nada de lo que hay: esto se suma)
   4. Busca la funcion doPost y agrega estas dos lineas junto a las
      demas "if (accion === ...)":

        if (accion === 'leer')       return respuesta(accionLeer());
        if (accion === 'mentorSync') return respuesta(accionMentorSync(req.db));
        if (accion === 'loyTiendas') return respuesta(accionLoyverseTiendas());
        if (accion === 'loyResumen') return respuesta(accionLoyverseResumen(req.desde, req.hasta));

   5. Implementar -> Administrar implementaciones -> lapiz -> Nueva version

   ARCHIVO ESCRITO EN ASCII PURO A PROPOSITO: los acentos y emojis se
   corrompen al copiar y Apps Script marca "SyntaxError linea 1".
============================================================ */

var MENTOR_ARCHIVO = 'mentor-db.json';

/* Lectura de solo lectura de la base del Ojo Maestro.
   El Mentor la usa para calcular ventas, nomina, inventario y
   cumplimiento. NO escribe nada. */
function accionLeer() {
  var db = leerDB();
  if (!db) return { ok: false, error: 'sin base todavia' };
  // no mandamos fotos: el Mentor solo necesita numeros
  if (db.evidencias) db.evidencias = [];
  if (db.cierres) {
    for (var i = 0; i < db.cierres.length; i++) { delete db.cierres[i].foto; }
  }
  if (db.config) db.config = { nombreNegocio: db.config.nombreNegocio || '' };
  return { ok: true, db: db };
}

function mentorLeer() {
  var it = carpeta().getFilesByName(MENTOR_ARCHIVO);
  if (!it.hasNext()) return null;
  try { return JSON.parse(it.next().getBlob().getDataAsString()); } catch (e) { return null; }
}
function mentorEscribir(db) {
  var it = carpeta().getFilesByName(MENTOR_ARCHIVO);
  var contenido = JSON.stringify(db);
  if (it.hasNext()) it.next().setContent(contenido);
  else carpeta().createFile(MENTOR_ARCHIVO, contenido, 'application/json');
}

function accionMentorSync(dbCliente) {
  if (!dbCliente) return { ok: false, error: 'sin datos' };
  var servidor = mentorLeer();
  var db = servidor ? mentorMezclar(servidor, dbCliente) : dbCliente;
  if (db.config) db.config.scriptUrl = '';
  mentorEscribir(db);
  return { ok: true, db: db };
}

/* Mezcla: gana el mas reciente para los valores sueltos; las listas
   se unen por id (nunca se pierde un registro de otro dispositivo). */
function mentorMezclar(a, b) {
  var nuevoEsB = (b.ts || 0) >= (a.ts || 0);
  var base = nuevoEsB ? b : a, otro = nuevoEsB ? a : b;
  var db = JSON.parse(JSON.stringify(base));

  var listas = ['rituales', 'consejos', 'compromisos', 'misiones', 'bitacora', 'fechas', 'ideas', 'kpis'];
  for (var i = 0; i < listas.length; i++) {
    var k = listas[i];
    var mapa = {}, orden = [];
    var junta = (base[k] || []).concat(otro[k] || []);
    for (var j = 0; j < junta.length; j++) {
      var x = junta[j]; if (!x || !x.id) continue;
      if (!mapa[x.id]) { orden.push(x.id); mapa[x.id] = x; }
      else if ((x.ts || 0) > (mapa[x.id].ts || 0)) { mapa[x.id] = x; }
    }
    db[k] = [];
    for (var m = 0; m < orden.length; m++) { db[k].push(mapa[orden[m]]); }
    db[k].sort(function (p, q) { return (q.ts || 0) - (p.ts || 0); });
  }

  /* objetos por clave: si la base no trae la clave, se toma del otro */
  var objetos = ['areas', 'fijos', 'numeros', 'academia'];
  for (var o = 0; o < objetos.length; o++) {
    var ko = objetos[o];
    var res = {}, fuente = otro[ko] || {}, princ = base[ko] || {};
    for (var k1 in fuente) { res[k1] = fuente[k1]; }
    for (var k2 in princ) { res[k2] = princ[k2]; }
    db[ko] = res;
  }

  /* ruta de gerencia: union de pasos marcados */
  var sa = (base.steph || {}), sb = (otro.steph || {});
  var mods = {}, k3;
  for (k3 in (sb.modulos || {})) { mods[k3] = sb.modulos[k3]; }
  for (k3 in (sa.modulos || {})) { mods[k3] = sa.modulos[k3]; }
  var evals = {}, ordenE = [];
  var todasE = (sa.evals || []).concat(sb.evals || []);
  for (var e = 0; e < todasE.length; e++) {
    var ev = todasE[e]; if (!ev || !ev.id) continue;
    if (!evals[ev.id]) { ordenE.push(ev.id); evals[ev.id] = ev; }
  }
  var listaE = [];
  for (var e2 = 0; e2 < ordenE.length; e2++) { listaE.push(evals[ordenE[e2]]); }
  db.steph = { modulos: mods, evals: listaE, ultimo: (sa.ultimo > sb.ultimo ? sa.ultimo : sb.ultimo) || '' };

  return db;
}

/* ============================================================
   LOYVERSE - lectura automatica del punto de venta

   POR QUE VA AQUI Y NO EN LA APP: el token de Loyverse nunca debe
   viajar al navegador ni quedar escrito en el codigo. Aqui vive en
   las Propiedades del Script (privadas del proyecto) y el telefono
   solo recibe totales ya calculados.

   COMO SE CONECTA (una sola vez):
   1. En Loyverse Back Office (la version web, no la app del punto de
      venta), entra a Ajustes / Configuracion y busca la seccion de
      Integraciones o "Tokens de acceso". Genera un token nuevo con
      permiso de LECTURA de recibos, articulos y tiendas.
   2. En el editor de Apps Script, menu de la izquierda:
      Configuracion del proyecto (el engrane) -> Propiedades del script
      -> Agregar propiedad:
          Propiedad: LOYVERSE_TOKEN
          Valor:     el token que copiaste
      NO lo pegues en este archivo y no se lo mandes a nadie por chat.
   3. Vuelve a Implementar -> Nueva version.

   Despues, en el Mentor: Numeros -> "Traer de Loyverse".
============================================================ */

var LOYVERSE_API = 'https://api.loyverse.com/v1.0/';

function loyverseToken() {
  return PropertiesService.getScriptProperties().getProperty('LOYVERSE_TOKEN') || '';
}
function loyverseGet(ruta, params) {
  var tok = loyverseToken();
  if (!tok) return { error: 'sin token' };
  var url = LOYVERSE_API + ruta;
  var partes = [];
  for (var k in params) { if (params[k] !== '' && params[k] != null) partes.push(k + '=' + encodeURIComponent(params[k])); }
  if (partes.length) url += '?' + partes.join('&');
  var r = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + tok },
    muteHttpExceptions: true
  });
  var code = r.getResponseCode();
  if (code !== 200) return { error: 'HTTP ' + code, detalle: String(r.getContentText()).slice(0, 300) };
  try { return JSON.parse(r.getContentText()); } catch (e) { return { error: 'respuesta ilegible' }; }
}

/* Lista de tiendas, para poder emparejarlas con las sucursales */
function accionLoyverseTiendas() {
  var j = loyverseGet('stores', {});
  if (j.error) return { ok: false, error: j.error, detalle: j.detalle || '' };
  var out = [];
  var st = j.stores || [];
  for (var i = 0; i < st.length; i++) { out.push({ id: st[i].id, nombre: st[i].name }); }
  return { ok: true, tiendas: out };
}

/* Resumen por dia y por tienda: ventas netas, numero de tickets,
   costo de la mercancia vendida y descuentos.
   desde / hasta en formato YYYY-MM-DD (se convierten a UTC). */
function accionLoyverseResumen(desde, hasta) {
  if (!loyverseToken()) return { ok: false, error: 'sin token' };
  var dias = {}, cursor = '', vueltas = 0;
  var min = desde + 'T00:00:00.000Z';
  var max = hasta + 'T23:59:59.999Z';

  while (vueltas < 40) {
    vueltas++;
    var j = loyverseGet('receipts', {
      created_at_min: min, created_at_max: max, limit: 250, cursor: cursor
    });
    if (j.error) return { ok: false, error: j.error, detalle: j.detalle || '' };
    var recs = j.receipts || [];
    for (var i = 0; i < recs.length; i++) {
      var rc = recs[i];
      var fecha = String(rc.receipt_date || rc.created_at || '').slice(0, 10);
      if (!fecha) continue;
      var tienda = rc.store_id || 'sin-tienda';
      var llave = fecha + '|' + tienda;
      if (!dias[llave]) dias[llave] = { fecha: fecha, tienda: tienda, ventas: 0, tickets: 0, costo: 0, descuentos: 0, devoluciones: 0 };
      var d = dias[llave];
      var esDev = (rc.receipt_type === 'REFUND');
      var signo = esDev ? -1 : 1;

      // total_money ya viene neto de descuentos; los impuestos se restan aparte
      var total = Number(rc.total_money || 0) - Number(rc.total_tax || 0);
      d.ventas += signo * total;
      if (esDev) d.devoluciones += total; else d.tickets += 1;
      d.descuentos += signo * Number(rc.total_discount || 0);

      var lineas = rc.line_items || [];
      for (var L = 0; L < lineas.length; L++) {
        var li = lineas[L];
        var costoU = Number(li.cost || li.cost_total || 0);
        // cost_total ya viene multiplicado; cost es unitario
        var costoLinea = (li.cost_total != null) ? Number(li.cost_total) : costoU * Number(li.quantity || 0);
        d.costo += signo * costoLinea;
      }
    }
    cursor = j.cursor || '';
    if (!cursor) break;
  }

  var lista = [];
  for (var k in dias) { lista.push(dias[k]); }
  lista.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
  return { ok: true, desde: desde, hasta: hasta, dias: lista, paginas: vueltas };
}

/* Respaldo diario del Mentor (opcional).
   Selecciona esta funcion en el editor y pulsa Ejecutar una vez
   para dejarlo programado a las 23:10. */
function mentorRespaldoAutomatico() {
  var trigs = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trigs.length; i++) {
    if (trigs[i].getHandlerFunction() === 'mentorRespaldo') ScriptApp.deleteTrigger(trigs[i]);
  }
  ScriptApp.newTrigger('mentorRespaldo').timeBased().atHour(23).nearMinute(10).everyDays(1).create();
}
function mentorRespaldo() {
  var db = mentorLeer(); if (!db) return;
  var f = subcarpeta('Respaldos');
  var nombre = 'mentor-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.json';
  var it = f.getFilesByName(nombre);
  if (it.hasNext()) it.next().setContent(JSON.stringify(db));
  else f.createFile(nombre, JSON.stringify(db), 'application/json');
}

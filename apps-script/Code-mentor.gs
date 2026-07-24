/* ============================================================
   EL MENTOR CICLOPE - complemento para el backend de El Ojo Maestro

   SOLO SON DOS FUNCIONES. Loyverse NO se toca: el Ojo Maestro ya
   tiene su propio conector (accion 'loyverse') y el Mentor lo reusa.
   Una sola verdad, un solo token, un solo mapeo de tiendas.

   COMO SE INSTALA (3 minutos, una sola vez):
   1. script.google.com con elanillodelciclope@gmail.com
   2. Abre el proyecto "El Ojo Maestro"
   3. Pega TODO este archivo AL FINAL del Code.gs que ya tienes
      (se suma, no borres nada)
   4. Busca la funcion doPost y agrega estas DOS lineas junto a las
      demas "if (accion === ...)":

        if (accion === 'leer')       return respuesta(accionLeer());
        if (accion === 'mentorSync') return respuesta(accionMentorSync(req.db));
        if (accion === 'loyRango')   return respuesta(accionLoyRango(req.desde, req.hasta, req.sucursales));

   5. IMPORTANTE - no basta con guardar:
      Implementar -> Administrar implementaciones -> lapiz (editar)
      -> Version: NUEVA VERSION -> Implementar
      Apps Script sirve la ultima VERSION publicada, no el codigo guardado.

   ARCHIVO EN ASCII PURO A PROPOSITO: los acentos y emojis se corrompen
   al copiar y Apps Script marca "SyntaxError linea 1".
============================================================ */

var MENTOR_ARCHIVO = 'mentor-db.json';

/* Lectura de solo lectura de la base del Ojo Maestro.
   El Mentor la usa para calcular ventas, nomina, inventario y
   cumplimiento. NO escribe nada. */
function accionLeer() {
  var db = leerDB();
  if (!db) return { ok: false, error: 'sin base todavia' };
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

  var listas = ['rituales', 'consejos', 'compromisos', 'misiones', 'bitacora', 'fechas', 'ideas', 'kpis', 'retos'];
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
  var objetos = ['areas', 'fijos', 'numeros', 'academia', 'arranque', 'loyverse', 'insumos', 'mixVentas'];
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
   LOYVERSE POR RANGO - una sola llamada en vez de 48

   NO duplica nada: por dentro usa la MISMA funcion accionLoyverse que
   ya tiene el Ojo Maestro (mismo token, mismo mapeo de tiendas). Solo
   hace el recorrido del lado del servidor, que es donde debe hacerse.

   Requiere agregar tambien esta linea en doPost:

     if (accion === 'loyRango') return respuesta(accionLoyRango(req.desde, req.hasta, req.sucursales));
============================================================ */
function accionLoyRango(desde, hasta, sucursales) {
  if (!desde || !hasta) return { ok: false, error: 'falta rango' };
  if (!sucursales || !sucursales.length) return { ok: false, error: 'faltan sucursales' };
  var acum = {}, dias = {};
  for (var i = 0; i < sucursales.length; i++) {
    acum[sucursales[i]] = { ventas: 0, tickets: 0, efectivo: 0, tarjeta: 0, otros: 0, dias: 0 };
  }
  var d = new Date(desde + 'T12:00:00');
  var fin = new Date(hasta + 'T12:00:00');
  var vueltas = 0;
  while (d <= fin && vueltas < 40) {
    vueltas++;
    var f = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    for (var s = 0; s < sucursales.length; s++) {
      var sid = sucursales[s];
      try {
        var r = accionLoyverse(f, sid);
        if (r && r.ok) {
          var a = acum[sid];
          var v = Number(r.ventas) || 0;
          a.ventas += v;
          a.tickets += Number(r.recibos) || 0;
          a.efectivo += Number(r.efectivo) || 0;
          a.tarjeta += Number(r.tarjeta) || 0;
          a.otros += Number(r.otros) || 0;
          if (v > 0) a.dias++;
          if (!dias[f]) dias[f] = {};
          dias[f][sid] = { ventas: v, tickets: Number(r.recibos) || 0 };
        }
      } catch (e) { /* un dia sin datos no debe tumbar el mes */ }
    }
    d.setDate(d.getDate() + 1);
  }
  return { ok: true, desde: desde, hasta: hasta, suc: acum, dias: dias };
}

/* ============================================================
   LIMPIEZA DE CIERRES DUPLICADOS (ejecutar una sola vez)

   Las versiones viejas del Ojo Maestro guardaban un cierre nuevo por
   cada envio (id aleatorio), asi que un mismo dia podia aparecer 12
   veces y multiplicar la venta en la hoja y en los correos.

   COMO USARLA:
   1. En el editor, selecciona  mentorLimpiarCierresDuplicados
   2. Ejecutar. Revisa el registro (Ver -> Registros).
   3. Deja UN cierre por dia y sucursal: el mas reciente.
   Es segura: no toca turnos, inventario ni nada mas.
============================================================ */
function mentorLimpiarCierresDuplicados() {
  var db = leerDB();
  if (!db || !db.cierres) { Logger.log('Sin base o sin cierres.'); return; }
  var mejor = {}, antes = db.cierres.length;
  for (var i = 0; i < db.cierres.length; i++) {
    var c = db.cierres[i];
    var k = c.fecha + '|' + c.sucursalId;
    if (!mejor[k] || (c.ts || 0) > (mejor[k].ts || 0)) mejor[k] = c;
  }
  var limpio = [];
  for (var k2 in mejor) { limpio.push(mejor[k2]); }
  limpio.sort(function (p, q) { return (q.ts || 0) - (p.ts || 0); });
  db.cierres = limpio;
  escribirDB(db);
  Logger.log('Cierres antes: ' + antes + ' | despues: ' + limpio.length + ' | eliminados: ' + (antes - limpio.length));
}

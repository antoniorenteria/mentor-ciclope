# 🔮 EL MENTOR CÍCLOPE — Guía

### El Archivo de la Casa Amarilla
*Auditoría, criterio y aprendizaje continuo para dirigir El Anillo del Cíclope.*

## 🔗 Tu app está en línea

**https://antoniorenteria.github.io/mentor-ciclope/**

Ábrela en el teléfono → **Compartir → Agregar a pantalla de inicio**. Queda como app con el ojo de Mirano.
El código es público (no tiene secretos); **tus datos viven solo en tu dispositivo y en tu Drive**, nunca en el repositorio.

Si **El Ojo Maestro** es el sistema que hace que el negocio **opere**, El Mentor Cíclope es el que
hace que el negocio **suba de nivel** — y que tú subas con él.

---

## 1. Qué hace, en una frase por módulo

| Módulo | Qué hace |
|---|---|
| 🔮 **Hoy** | El ritual de 7 minutos: el pulso real del negocio, **una** pregunta de auditoría y **una** lección. |
| 🏛️ **El Consejo** | La sesión estratégica semanal de 45 min, en 7 bloques guiados. Genera un acta. |
| 🧭 **Auditoría 360** | Las 10 caras de la Gema: diagnostica cada área y le pone nivel de madurez (Ciego → Maestro). |
| 🕳️ **Puntos ciegos** | Lo que el mentor detecta solo cruzando tu operación real con lo que llevas auditado. |
| 📈 **Números** | Prime cost, punto de equilibrio, utilidad y ticket promedio por sucursal. |
| 🎯 **Misiones** | Metas trimestrales (OKR), compromisos y fechas que no se pueden olvidar. |
| 📚 **Academia** | 6 niveles de formación de dirección, con las prácticas de los mejores restaurantes del mundo. |
| 🎓 **Retos** | Aprendizaje just-in-time: lo que te frena se vuelve un reto con recurso real y pasos. Incluye la Biblioteca del Cíclope. |
| 🍔 **Escandallo** | Costo, margen y % real por platillo. Los gramajes ya vienen del recetario del Ojo Maestro. |
| 🚦 **Puesta en marcha** | Los 16 puntos para dejar todo listo antes del arranque formal (1 de agosto). |
| 🗝️ **Gerencia** | La ruta de desarrollo de Steph y su evaluación de desempeño. |
| 📓 **Bitácora** | La memoria: todo lo que registras queda, buscable, para siempre. |

---

## 2. Instalación (5 minutos)

### 2a. Conectar con El Ojo Maestro ☁️

El mentor **lee** ventas, nómina, inventario y cumplimiento del Ojo Maestro. No los vuelves a capturar.

1. Entra a **script.google.com** con `elanillodelciclope@gmail.com` → proyecto **El Ojo Maestro**.
2. Pega **al final** del `Code.gs` que ya tienes el contenido de `apps-script/Code-mentor.gs`
   *(se suma, no borres nada)*.
3. En la función `doPost`, junto a las demás líneas `if (accion === ...)`, agrega:

   ```
   if (accion === 'leer')       return respuesta(accionLeer());
   if (accion === 'mentorSync') return respuesta(accionMentorSync(req.db));
   ```

4. **Implementar → Administrar implementaciones → ✏️ → Nueva versión**.

> ⚠️ Traes pendiente re-desplegar `Code.gs` desde la versión 1.3 del Ojo Maestro (y otra vez desde
> la 1.5 por el calendario). **Este es el momento de hacerlo todo junto**: copia el `Code.gs`
> completo desde
> `https://raw.githubusercontent.com/antoniorenteria/ojo-maestro/main/apps-script/Code.gs`,
> pégale encima el `Code-mentor.gs`, agrega las dos líneas y publica una sola vez.

### 2b. Conectar la app 🔌

1. Abre el mentor → **👁️ Dirección** → PIN **2626** (cámbialo el primer día).
2. **⚙️ Administrar** → pega la **misma URL `/exec`** del Ojo Maestro → **💾 Guardar** →
   **🔌 Probar** → **👁️ Leer operación**.
3. Debe decir *"✅ Operación leída: 2 sucursales, N cierres…"*.

**Si todavía no redespliegas**, la app igual funciona: intenta primero la acción `leer` y, si el
backend no la tiene, cae a una lectura de solo lectura con el `sync` que ya existe. Funciona, pero
es más lenta y no guarda tu base del mentor en la nube — hazlo bien y redespliega.

### 2c. Conectar Loyverse 🧾 (opcional, muy recomendado)

El Ojo Maestro sabe cuánto reportó el equipo. **Loyverse sabe cuánto cobró el punto de venta**,
cuántos tickets fueron y cuánto costó la mercancía. Conectarlo te da tres cosas que hoy no tienes:
**ticket promedio real**, **costo de ventas real** y un **cuadre automático** entre lo que marca la
caja y lo que reporta el equipo.

1. En el **Back Office de Loyverse** (la versión web, no la app del punto de venta), busca en
   Ajustes la sección de **Integraciones / Tokens de acceso** y genera un token con permiso de
   **lectura** de recibos, artículos y tiendas.
2. En el editor de Apps Script: engrane **⚙️ Configuración del proyecto** → **Propiedades del
   script** → **Agregar propiedad**:
   - Propiedad: `LOYVERSE_TOKEN`
   - Valor: el token
3. **Implementar → Nueva versión**.
4. En el mentor: **📈 Números → 🔗 Emparejar tiendas** (una sola vez) y luego
   **🧾 Traer de Loyverse** cada mes.

> 🔒 El token vive **solo** en las Propiedades del Script, que son privadas de tu proyecto de
> Google. Nunca viaja al teléfono, nunca se escribe en el código y **nunca me lo mandes por chat**.
> Si alguna vez se filtra, lo revocas desde Loyverse y generas otro.

**Jerarquía del costo de insumos**, de más a menos confiable:
compras capturadas a mano → costo de Loyverse → estimado con el % que declares.
El mentor te dice cuál está usando en el renglón de Insumos.

### 2d. PIN

- **Dirección (Toño):** `2626` de fábrica. El PIN de Dirección **también** abre Gerencia.
- **Gerencia (Steph):** `1515` de fábrica. Solo ve sus módulos.
- Ambos se cambian en **Administrar → Accesos**.

---

## 3. El ritmo (lo que hace que esto sirva)

Un sistema de mentoría no falla por falta de contenido: falla por falta de ritmo.

### Diario · 5–10 minutos ☕
Abre **🔮 Hoy**. Lees el pulso, contestas **una** pregunta y ves **una** lección.
La pregunta rota entre las 10 áreas; **Finanzas, Rentabilidad, Marketing y Ventas** aparecen el
doble de seguido porque las marcaste como prioritarias *(se cambia en Administrar)*.

Contesta con honestidad. Si la respuesta es *"no sé"*, escríbelo: eso también es un dato, y el
mentor lo convierte en punto ciego.

### Semanal · 45 minutos 🏛️
Abre **🏛️ El Consejo** (domingo o lunes). Siete bloques con tiempo sugerido:
números → compromisos de la semana pasada → **el área de la semana** → puntos ciegos → gente →
decisiones → aprendizaje.

El mentor elige qué área te toca auditar: la más olvidada, con preferencia por las prioritarias.
En 10 semanas tienes el mapa completo del negocio.

**Máximo 3 compromisos por semana.** Si son más, no son prioridades: son una lista de deseos.

### Mensual · 30 minutos 📈
Captura en **Números** las compras de insumos, el número de tickets y lo que gastaste en marketing.
Con eso el mentor calcula tu **prime cost**, tu **punto de equilibrio** y tu **utilidad real por
sucursal**. Es la media hora más rentable del mes.

Y haz la **evaluación de Steph** en 🗝️ Gerencia.

### Trimestral · 1 hora 🎯
Una **misión** con máximo 3 resultados clave numéricos. Lo que no tiene número no es meta.

---

## 4. Cómo lee los números

El mentor no inventa nada. Todo sale de aquí:

| Dato | De dónde |
|---|---|
| Ventas por día y sucursal | Cierres del Ojo Maestro |
| Nómina | Turnos × pago por día + ajustes en bloques de 20 min (misma fórmula del Ojo Maestro) |
| Propinas | Módulo de propinas digitales |
| Cumplimiento | Acciones hechas ÷ acciones del día en cada cierre |
| Faltantes | Stock contra mínimo, por sucursal |
| Ventas del punto de venta, tickets, costo de mercancía | Loyverse, si lo conectaste |
| Renta, servicios, sueldos fijos, marketing | **Los capturas tú** en 📈 Números |

**Ya cargados** (dato de Toño, 2026-07-23): renta Revolución **$5,600** y Tulipanes **$10,000**.
Faltan servicios y sueldos fijos para que el punto de equilibrio sea exacto.

**Comparación honesta:** la semana en curso siempre se compara contra **los mismos días** de la
semana anterior, cortando en el último día que ya cerró. Comparar 2 días contra 7 marcaría caídas
que no existen.

**Punto de equilibrio** = costos fijos ÷ (1 − % de costo variable).
**Prime cost** = % insumos + % nómina. Debajo de 60 % es sano; arriba de 65 % pierdes dinero
aunque vendas mucho.

---

## 5. Los niveles de madurez

Cada área se evalúa con preguntas de **Sí / A medias / No**, cada una con su peso.

| Nivel | Significa |
|---|---|
| **0 · Ciego** | No se mide, no se sabe. Aquí se decide por corazonada. |
| **1 · Reactivo** | Se atiende cuando duele. Existe, pero nadie lo vigila. |
| **2 · Ordenado** | Hay proceso escrito y responsable. Todavía no se mide. |
| **3 · Medido** | Hay número, meta y revisión. Se corrige con datos. |
| **4 · Maestro** | Funciona sin ti, mejora sola y se puede replicar en otra sucursal. |

El radar de **Auditoría 360** te muestra las 10 áreas de un vistazo. La cara más corta de la Gema
es tu limitante real, no la que más ruido hace.

---

## 6. La sección de Steph 🗝️

**Ruta de 4 niveles**, 20 módulos, cada uno con tres pasos:

- 📖 **Aprender** — entender la idea *(lo marca ella)*
- 🔁 **Practicar** — hacerlo un número concreto de veces *(lo marca ella)*
- 🏅 **Demostrar** — probar que ya lo domina *(**solo lo marca Dirección**)*

| Nivel | De qué se trata |
|---|---|
| 1 · Dominio de la operación | Antes de dirigir hay que dominar lo que se va a exigir |
| 2 · Dirigir personas | Pasar de "hacer bien" a "lograr que otros hagan bien" |
| 3 · Entender el negocio | Un gerente que no entiende los números administra tareas, no resultados |
| 4 · Criterio de gerente | Decidir bien cuando no hay a quién preguntarle |

Ella tiene además su **ritual diario de gerencia** con preguntas propias, y su bitácora.
Tú ves su avance y sus registros desde 🗝️ Gerencia, donde también guardas la **evaluación mensual**
(lo que hizo bien, lo que debe mejorar, el compromiso del siguiente mes).

---

## 7. Publicar en internet (para el teléfono) 📱

Igual que el Ojo Maestro. Dos opciones:

**A · GitHub Pages** — sube la carpeta `mentor-ciclope` a un repo (por ejemplo
`antoniorenteria/mentor-ciclope`) y activa Pages. Queda en
`https://antoniorenteria.github.io/mentor-ciclope/`.

**B · Vercel** — la cuenta del negocio ya existe.

Luego, en el teléfono: abrir la URL en Safari/Chrome → **Compartir → Agregar a pantalla de inicio**.
Queda como app con el ojo de Mirano.

> ⚠️ En iPhone, la app agregada a la pantalla de inicio y Safari **no comparten datos**. Configura
> la conexión **dentro de la app instalada**, no en Safari. Si algún día aparece en "modo local",
> es eso: la conexión se repone desde Administrar.

---

## 8. Respaldo y seguridad 🔒

- **Administrar → ⬇️ Descargar respaldo** baja todo el mentor en un JSON.
- Si redesplegaste el backend, cada cambio se sincroniza solo y hay respaldo diario en Drive
  *(ejecuta una vez la función `mentorRespaldoAutomatico` en el editor de Apps Script)*.
- Cambia los dos PIN el primer día.
- La bitácora contiene tus diagnósticos honestos del negocio: no publiques la URL en redes ni la
  compartas fuera de Dirección y Gerencia.

---

## 9. Preguntas rápidas

**¿Cuánto cuesta?** $0. Usa el mismo Apps Script, Drive y cuenta de Google del negocio.

**¿Funciona sin internet?** Sí. Guarda en el dispositivo y sincroniza cuando vuelve la señal.

**¿Y si no capturo los números?** Funciona igual, pero sin prime cost, punto de equilibrio ni
utilidad. El mentor te lo marcará como punto ciego hasta que lo hagas.

**¿Cómo agrego o quito áreas prioritarias?** Administrar → Áreas prioritarias. Las prioritarias
salen el doble de seguido en el ritual y se auditan primero en el Consejo.

**¿Puedo editar lo que sabe el mentor?** Sí: todo el contenido (áreas, preguntas, lecciones, ruta
de Steph) vive en `contenido.js`. Editar ese archivo es editar al mentor.

**Actualicé y sigo viendo lo viejo.** El service worker guarda en caché para que abra rápido en el
wifi del local; el código nuevo entra al **segundo** ingreso. Para forzarlo:
Administrar → **🔄 Buscar actualización**.

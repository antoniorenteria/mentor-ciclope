/* ============================================================
   EL MENTOR CÍCLOPE — Contenido
   El Archivo de la Casa Amarilla: áreas, diagnósticos, preguntas
   de auditoría, KPIs, academia y ruta de gerencia.

   Editar este archivo es editar al mentor. Todo lo que está aquí
   es lo que el mentor sabe; app.js solo lo administra.
============================================================ */

window.MENTOR = (function () {

  /* ---------- Niveles de madurez (las caras de la Gema) ---------- */
  const NIVELES = [
    { n: 0, t: 'Ciego', d: 'No se mide, no se sabe. Las decisiones aquí son corazonadas.', c: '#B91C1C' },
    { n: 1, t: 'Reactivo', d: 'Se atiende cuando duele. Existe, pero nadie lo vigila.', c: '#EA580C' },
    { n: 2, t: 'Ordenado', d: 'Hay proceso escrito y alguien responsable. Todavía no se mide.', c: '#CA8A04' },
    { n: 3, t: 'Medido', d: 'Hay número, meta y revisión periódica. Se corrige con datos.', c: '#2563EB' },
    { n: 4, t: 'Maestro', d: 'Funciona sin ti, mejora sola y se puede replicar en otra sucursal.', c: '#15803D' },
  ];

  /* ---------- KPIs: definición, fórmula y referencia del sector ---------- */
  const KPIS = [
    { id: 'venta-dia', n: 'Venta del día', u: '$', auto: true, area: 'finanzas', f: 'Suma de cierres del día', ref: 'Compárala contra el mismo día de las 4 semanas anteriores, no contra ayer.' },
    { id: 'venta-mes', n: 'Venta del mes', u: '$', auto: true, area: 'finanzas', f: 'Suma de cierres del mes', ref: 'Lo que importa es la tendencia de 3 meses, no el mes suelto.' },
    { id: 'ticket', n: 'Ticket promedio', u: '$', area: 'ventas', f: 'Venta ÷ número de tickets', ref: 'Con el menú actual, un ticket sano ronda $150–$220. Subirlo $15 vale más que 10 clientes nuevos.' },
    { id: 'clientes', n: 'Tickets del día', u: '#', area: 'ventas', f: 'Comandas cerradas', ref: 'Es la única forma de saber si creciste por más gente o por precio.' },
    { id: 'foodcost', n: 'Costo de insumos', u: '%', area: 'rentabilidad', f: 'Compras de insumos ÷ ventas × 100', ref: 'Sano: 28–33 %. Arriba de 35 % te estás comiendo la utilidad. Mídelo mensual con inventario inicial y final.' },
    { id: 'nomina', n: 'Costo de nómina', u: '%', auto: true, area: 'finanzas', f: 'Nómina + propinas retribuidas ÷ ventas × 100', ref: 'Sano: 22–30 % en comida rápida casual. Arriba de 33 % hay sobre-personal o venta baja.' },
    { id: 'prime', n: 'Prime cost', u: '%', area: 'rentabilidad', f: 'Insumos % + Nómina %', ref: 'La métrica reina del restaurantero. Debajo de 60 % = sano. 60–65 % = apretado. Arriba de 65 % = pierdes dinero aunque vendas mucho.' },
    { id: 'renta', n: 'Renta y ocupación', u: '%', area: 'finanzas', f: 'Renta + servicios ÷ ventas × 100', ref: 'Máximo 10 %. Si pasa de 12 % el local es demasiado caro para lo que vende.' },
    { id: 'equilibrio', n: 'Punto de equilibrio', u: '$', area: 'finanzas', f: 'Costos fijos ÷ (1 − costo variable %)', ref: 'El número más importante del negocio: cuánto tienes que vender para no perder.' },
    { id: 'utilidad', n: 'Utilidad neta', u: '%', area: 'finanzas', f: '(Ventas − todos los costos) ÷ ventas × 100', ref: 'Restaurante sano: 10–15 %. Debajo de 5 % no aguanta un mal mes.' },
    { id: 'merma', n: 'Merma', u: '%', area: 'operacion', f: 'Valor de producto tirado ÷ compras × 100', ref: 'Debajo de 3 %. Lo que no se pesa, no se controla.' },
    { id: 'cumplimiento', n: 'Cumplimiento de checklist', u: '%', auto: true, area: 'operacion', f: 'Acciones hechas ÷ acciones del día', ref: 'Debajo de 90 % constante = el estándar es teatro, no operación.' },
    { id: 'resenas', n: 'Reseñas nuevas', u: '#', area: 'cliente', f: 'Reseñas de Google del mes', ref: 'Meta realista: 15–25 al mes por sucursal pidiéndolas bien. Calificación objetivo ≥ 4.6.' },
    { id: 'recurrencia', n: 'Clientes que regresan', u: '%', area: 'ventas', f: 'Clientes repetidos ÷ clientes totales', ref: 'En temáticos la trampa es vivir de la novedad. Si nadie regresa, vives de pauta para siempre.' },
    { id: 'cac', n: 'Costo por conversación / cliente', u: '$', area: 'marketing', f: 'Inversión en pauta ÷ conversaciones o pedidos', ref: 'Benchmark propio de la campaña Aquelarre: $14–$20 por conversación de WhatsApp.' },
    { id: 'plataformas', n: 'Venta en plataformas', u: '%', area: 'ventas', f: 'Venta DiDi + Uber + Rappi ÷ venta total', ref: 'Cuidado arriba de 30 %: la comisión (25–30 %) se come el margen y el cliente es de ellos, no tuyo.' },
    { id: 'rotacion', n: 'Rotación de personal', u: '%', area: 'equipo', f: 'Bajas del periodo ÷ plantilla promedio', ref: 'El sector normaliza 70–100 % anual. Cada baja cuesta ~1 mes de sueldo en reclutar y entrenar.' },
    { id: 'tiempo', n: 'Tiempo de entrega en piso', u: 'min', area: 'operacion', f: 'De la comanda al plato', ref: 'Meta: ≤ 12 min en piso, ≤ 8 min para llevar. Arriba de 20 min aparecen las malas reseñas.' },
  ];

  /* ============================================================
     LAS 10 CARAS DE LA GEMA — Áreas de auditoría
  ============================================================ */
  const AREAS = [

    /* ---------------------------------------------------------- 1 */
    {
      id: 'finanzas', em: '💰', n: 'Finanzas y flujo de efectivo', color: '#15803D',
      porque: 'Un restaurante no quiebra por falta de clientes: quiebra por falta de efectivo un martes cualquiera. Aquí vive la verdad del negocio.',
      kpis: ['venta-mes', 'nomina', 'renta', 'equilibrio', 'utilidad'],
      diagnostico: [
        { id: 'f1', p: '¿Sabes de memoria cuánto tienes que vender al mes, por sucursal, para no perder dinero?', peso: 3, ayuda: 'El punto de equilibrio. Si no lo tienes en la cabeza, todas las decisiones de gasto son a ciegas.' },
        { id: 'f2', p: '¿Tus finanzas personales están separadas de las del negocio (cuenta y sueldo fijo de director)?', peso: 3, ayuda: 'Mientras la caja del negocio sea tu cartera, nunca sabrás si el negocio es rentable ni podrás venderlo o abrir la tercera.' },
        { id: 'f3', p: '¿Revisas un estado de resultados mensual (ventas, costos, utilidad) dentro de los primeros 10 días del mes siguiente?', peso: 3, ayuda: 'Un P&L que llega a los 3 meses es historia, no administración.' },
        { id: 'f4', p: '¿Tienes un colchón de al menos 1 mes de gastos fijos guardado y separado?', peso: 2, ayuda: 'Es lo que te permite decidir con cabeza fría en enero y en un mes de lluvias.' },
        { id: 'f5', p: '¿Cada sucursal tiene su propio estado de resultados, no solo el total?', peso: 3, ayuda: 'La sucursal buena puede estar cargando a la mala durante un año sin que lo notes.' },
        { id: 'f6', p: '¿Conoces tu prime cost (insumos % + nómina %) del mes pasado?', peso: 3, ayuda: 'Es el termómetro que usan todos los buenos operadores. Debajo de 60 % duermes tranquilo.' },
        { id: 'f7', p: '¿Tienes un calendario de pagos fijos (renta, nómina, impuestos, proveedores) con fechas y montos?', peso: 2, ayuda: 'El flujo se rompe por sorpresas, no por falta de venta.' },
        { id: 'f8', p: '¿Tus decisiones de inversión (equipo, sucursal, campaña) pasan por un cálculo de retorno antes de gastar?', peso: 2, ayuda: '"¿En cuántos meses se paga solo?" es la pregunta que separa invertir de gastar.' },
      ],
      preguntas: [
        { q: '¿Cuánto vendiste ayer contra el mismo día de la semana pasada? ¿Sabes por qué la diferencia?', porque: 'La comparación válida es día contra el mismo día. Lo demás es ruido.' },
        { q: 'Si mañana cayera la venta 30 % durante un mes, ¿qué gasto cortarías primero y cuánto aguantarías?', porque: 'Tener la respuesta antes del golpe es lo que evita decisiones de pánico.' },
        { q: '¿Qué gasto fijo pagaste este mes que no defenderías frente a un socio?', porque: 'Los gastos se acumulan por inercia. Nadie los mata si no se revisan a propósito.' },
        { q: '¿Cuánto dinero tuyo salió de la caja este mes para cosas personales?', porque: 'Es la fuga número uno del restaurantero dueño. Si no se registra, no existe... hasta que falta.' },
        { q: '¿Qué sucursal ganó dinero el mes pasado y cuánto exactamente?', porque: 'Sin número por sucursal no puedes decidir dónde invertir ni qué corregir.' },
        { q: '¿Cuánto pagaste de comisiones a plataformas el mes pasado? ¿Vale lo que dejó?', porque: '25–30 % de comisión puede significar vender más y ganar menos.' },
        { q: '¿Tienes hoy con qué pagar la nómina de las próximas 2 semanas sin depender de la venta de esos días?', porque: 'El estrés de nómina es la señal más temprana de un problema de flujo.' },
      ],
      lecciones: [
        { id: 'l-f1', t: 'El prime cost manda', fuente: 'Estándar de la industria restaurantera (NRA)', idea: 'Los mejores operadores no vigilan 40 números: vigilan uno. Insumos % + nómina % = prime cost. Debajo de 60 % el negocio respira; arriba de 65 % puedes vender récord y aun así perder.', aplica: 'Con las ventas del Ojo Maestro ya tienes el denominador. Solo falta que captures compras de insumos del mes. Con eso el mentor calcula tu prime cost real por sucursal.', tarea: 'Captura las compras de insumos del mes pasado en la sección Números y anota tu prime cost.' },
        { id: 'l-f2', t: 'Págate un sueldo antes que la utilidad', fuente: 'Profit First — Mike Michalowicz', idea: 'La fórmula tradicional (Ventas − Gastos = Utilidad) hace que la utilidad sea lo que sobra, y nunca sobra. Invierte el orden: aparta primero utilidad y tu sueldo, y opera con lo que queda.', aplica: 'Define un sueldo fijo de Dirección y un % de utilidad que se aparta el día 1 de cada mes, aunque sea 3 %. Deja de "tomar de la caja".', tarea: 'Fija tu sueldo mensual de director y el % de utilidad a apartar. Anótalos en Números.' },
        { id: 'l-f3', t: 'El punto de equilibrio como brújula diaria', fuente: 'Contabilidad de gestión aplicada a restaurantes', idea: 'Divide tu punto de equilibrio mensual entre los días que abres: ese es tu número del día. Al equipo no le dices "vendan más", le dices "hoy la meta es $X".', aplica: 'Con dos sucursales necesitas dos números distintos. El equipo debe verlo en la tablet igual que ve el checklist.', tarea: 'Calcula el número del día por sucursal y compártelo con Steph esta semana.' },
        { id: 'l-f4', t: 'Un mal mes no es una emergencia; dos son un patrón', fuente: 'Scaling Up — Verne Harnish', idea: 'Los negocios que sobreviven no reaccionan a cada dato: definen de antemano qué señal dispara qué acción. Un mes malo se observa, dos meses malos activan un plan escrito.', aplica: 'Escribe tus disparadores: "si el prime cost pasa 65 % dos meses seguidos, reviso precios y porciones".', tarea: 'Escribe 3 disparadores con su acción en la Bitácora.' },
      ]
    },

    /* ---------------------------------------------------------- 2 */
    {
      id: 'rentabilidad', em: '🍔', n: 'Rentabilidad por producto', color: '#CA8A04',
      porque: 'Tu menú no vende igual ni deja igual. Casi siempre 20 % de los platillos deja 80 % de la utilidad, y hay platillos que trabajan gratis.',
      kpis: ['foodcost', 'prime', 'merma'],
      diagnostico: [
        { id: 'r1', p: '¿Tienes escandallo (costo por ingrediente y gramaje) de cada platillo del menú?', peso: 3, ayuda: 'Sin escandallo, un precio es una opinión. Ya tienes las Preparaciones 2025 y el recetario en el Ojo Maestro: es el 70 % del trabajo.' },
        { id: 'r2', p: '¿Sabes cuáles son tus 5 platillos más vendidos y cuáles los 5 más rentables?', peso: 3, ayuda: 'Casi nunca son la misma lista. Ahí está el dinero escondido.' },
        { id: 'r3', p: '¿Actualizaste tus costos de insumos en los últimos 3 meses?', peso: 3, ayuda: 'El pollo, el queso y el aceite se mueven. Un menú costeado hace un año miente.' },
        { id: 'r4', p: '¿Tus porciones se sirven con báscula o medida fija, no "al ojo"?', peso: 2, ayuda: '10 g de más en boneless por orden, 40 órdenes al día, son miles de pesos al mes.' },
        { id: 'r5', p: '¿El diseño del menú empuja a propósito hacia los platillos más rentables?', peso: 2, ayuda: 'Posición, foto y descripción mueven la venta más que el precio.' },
        { id: 'r6', p: '¿Registras la merma (lo que se tira, se quema o se regala) con valor en pesos?', peso: 2, ayuda: 'Lo que no se registra se normaliza.' },
        { id: 'r7', p: '¿Comparas precios de al menos 2 proveedores por insumo clave cada trimestre?', peso: 2, ayuda: 'La comodidad con el proveedor cuesta entre 5 y 12 % en insumos.' },
        { id: 'r8', p: '¿Los extras y las bebidas se ofrecen siempre (no "si el cliente pregunta")?', peso: 2, ayuda: 'Bebidas y postres son el margen más alto del menú y el más olvidado.' },
      ],
      preguntas: [
        { q: '¿Cuál de tus platillos crees que deja más dinero por unidad? ¿Lo sabes o lo supones?', porque: 'La intuición del dueño falla justo aquí, porque confunde volumen con margen.' },
        { q: '¿Cuánto cuesta hoy producir un Crepiburger completo con papas?', porque: 'Si el número no sale en 10 segundos, el precio no está bajo control.' },
        { q: '¿Qué platillo del menú venderías menos si pudieras, y por qué sigue ahí?', porque: 'Un menú corto se ejecuta mejor, tiene menos merma y vende más rápido.' },
        { q: '¿Cuándo subiste precios por última vez y cuánto se movió la venta?', porque: 'Los restaurantes suben precios tarde y de golpe. Mejor 5 % anual que 20 % de una.' },
        { q: '¿Cuánto se tiró ayer entre las dos sucursales?', porque: 'La merma es utilidad que ya pagaste y no vendiste.' },
        { q: '¿El equipo sabe cuál es el platillo que más conviene sugerir?', porque: 'La sugerencia del que atiende es la herramienta de margen más barata que existe.' },
      ],
      lecciones: [
        { id: 'l-r1', t: 'Ingeniería de menú: estrellas, caballos, puzzles y perros', fuente: 'Kasavana & Smith, Michigan State University', idea: 'Cruza popularidad con margen y cada platillo cae en un cuadrante. Estrella (vende y deja): protégela. Caballo (vende, no deja): súbele precio o bájale costo. Puzzle (deja, no vende): promuévelo. Perro (ni vende ni deja): quítalo.', aplica: 'Tu Crepiburger es probablemente estrella; los Cerebros de 1 kg y el Aquelarre son puzzles con margen. Las bebidas son la palanca más rápida.', tarea: 'Clasifica 10 platillos en los 4 cuadrantes en la sección Números.' },
        { id: 'l-r2', t: 'Menú corto, ejecución perfecta', fuente: 'In-N-Out Burger', idea: 'In-N-Out lleva 75 años con prácticamente el mismo menú de 4 productos. Menos SKUs = menos inventario, menos merma, entrenamiento más rápido, calidad constante y filas más ágiles.', aplica: 'El universo Cíclope justifica variedad narrativa, pero la cocina no. Se puede tener lore rico con menú corto: mismos insumos, nombres distintos.', tarea: 'Identifica 3 platillos candidatos a salir del menú y qué venta representan.' },
        { id: 'l-r3', t: 'El precio comunica, no solo cobra', fuente: 'Psicología de precios en hostelería', idea: 'Quitar el signo $ y los decimales sube el gasto. El precio al lado de la descripción (no en columna alineada) evita que el cliente compre por precio. El platillo ancla caro hace ver razonable al de en medio.', aplica: 'El Aquelarre a $485 es tu ancla natural: hace que $159 del paquete Cíclope se sienta accesible. Colócalo arriba, no escondido.', tarea: 'Revisa el menú impreso y de plataformas: ¿está el ancla visible?' },
        { id: 'l-r4', t: 'Cuesta lo que cuesta hoy, no lo que costaba', fuente: 'Disciplina de costeo (Restaurant Impossible / Robert Irvine)', idea: 'El error más común del restaurantero independiente es costear una vez, al abrir, y nunca volver. La inflación de insumos se come el margen sin que nadie lo note hasta que no hay dinero.', aplica: 'Pon fecha fija: primer lunes de cada trimestre se actualizan costos de los 15 insumos principales.', tarea: 'Agenda la revisión trimestral de costos como misión recurrente.' },
      ]
    },

    /* ---------------------------------------------------------- 3 */
    {
      id: 'operacion', em: '⚙️', n: 'Operación, calidad y consistencia', color: '#2563EB',
      porque: 'El cliente no perdona la inconsistencia. Un Crepiburger excelente y otro mediocre no promedian: la segunda visita decide la tercera.',
      kpis: ['cumplimiento', 'merma', 'tiempo'],
      diagnostico: [
        { id: 'o1', p: '¿Un platillo sale idéntico en Revolución y en Tulipanes?', peso: 3, ayuda: 'Es la prueba de fuego de la escalabilidad. Si no, la tercera sucursal es un riesgo, no una oportunidad.' },
        { id: 'o2', p: '¿Existe manual de procedimientos escrito y el equipo lo usa (no solo existe)?', peso: 3, ayuda: 'Ya tienes Protocolos 2025 en el Ojo Maestro. La pregunta real es si se consulta.' },
        { id: 'o3', p: '¿Mides el tiempo desde la comanda hasta el plato?', peso: 2, ayuda: 'El tiempo es el factor que más aparece en reseñas negativas de restaurantes casuales.' },
        { id: 'o4', p: '¿Hay una persona responsable por turno con nombre y autoridad clara?', peso: 3, ayuda: 'Sin responsable único, la responsabilidad se diluye entre todos y no la tiene nadie.' },
        { id: 'o5', p: '¿El checklist se cumple arriba del 90 % de forma constante?', peso: 2, ayuda: 'El Ojo Maestro ya lo mide. Si vive en 70 %, el estándar no es real.' },
        { id: 'o6', p: '¿Haces una prueba de producto a ciegas (tú comiendo como cliente) al menos 1 vez al mes por sucursal?', peso: 2, ayuda: 'Es la única forma de ver lo que ve el cliente y no lo que te reportan.' },
        { id: 'o7', p: '¿Tienes plan escrito para el día que falta el cocinero clave o se descompone la freidora?', peso: 2, ayuda: 'La resiliencia se diseña antes, no se improvisa el sábado a las 8 pm.' },
        { id: 'o8', p: '¿La cocina está montada para el pico de venta (mise en place suficiente antes de la hora fuerte)?', peso: 2, ayuda: 'El cuello de botella siempre existe. La pregunta es si lo conoces o te sorprende.' },
      ],
      preguntas: [
        { q: '¿A qué hora exacta se satura tu cocina y qué pasa 10 minutos antes?', porque: 'La preparación previa al pico decide si la noche es buena o caótica.' },
        { q: '¿Cuál fue el último platillo que salió mal y por qué salió mal?', porque: 'Si la respuesta es "se equivocó fulano", el problema es del proceso, no de fulano.' },
        { q: '¿Cuándo probaste por última vez la comida de tu propia sucursal sin avisar?', porque: 'El dueño que no come su producto pierde el paladar del negocio en 6 meses.' },
        { q: '¿Qué tarea del checklist se salta más seguido y qué te dice eso?', porque: 'Una tarea que nadie hace es una tarea mal diseñada o sin sentido claro.' },
        { q: '¿Cuánto tardó el último pedido de plataforma en salir?', porque: 'El delivery castiga la lentitud con menos visibilidad en la app, no solo con una mala reseña.' },
        { q: 'Si hoy no llegas a ninguna de las dos sucursales, ¿todo opera igual?', porque: 'Esa es la definición práctica de un sistema que funciona.' },
      ],
      lecciones: [
        { id: 'l-o1', t: 'Mise en place: el orden es velocidad', fuente: 'Thomas Keller — The French Laundry', idea: 'La excelencia en cocina no es talento en el momento, es preparación antes del momento. Todo listo, en su lugar, en la misma posición siempre, para que la mano sepa dónde está sin mirar.', aplica: 'Tus Acciones del día en el Ojo Maestro ya son mise en place. Lo que falta es cronometrarlas: "a las 12:30 debe estar todo listo".', tarea: 'Define la hora límite de mise en place por sucursal y ponla en el checklist.' },
        { id: 'l-o2', t: 'Estandariza antes de mejorar', fuente: 'Sistema de Producción Toyota (kaizen)', idea: 'No se puede mejorar un proceso que cambia cada día. Primero se congela un estándar (aunque sea imperfecto), luego se mide, luego se mejora, y la mejora se vuelve el nuevo estándar.', aplica: 'Cada cambio de receta o proceso debe quedar escrito en el recetario del Ojo Maestro el mismo día, o la mejora se pierde en el turno siguiente.', tarea: 'Elige un proceso y escribe su versión estándar esta semana.' },
        { id: 'l-o3', t: 'El line-up diario', fuente: 'Ritz-Carlton', idea: 'Ritz-Carlton reúne a cada equipo 10 minutos antes de cada turno, todos los días, en todos sus hoteles del mundo: un estándar, una historia de servicio del día anterior y la meta del día. 10 minutos que alinean a 40 mil personas.', aplica: 'Tu equipo es chico, así que es aún más fácil: 5 minutos al abrir. Meta de venta del día, platillo a sugerir, una cosa a cuidar.', tarea: 'Arranca el line-up de 5 minutos con Steph esta semana y anota cómo salió.' },
        { id: 'l-o4', t: 'Encuentra el cuello de botella', fuente: 'La Meta — Eliyahu Goldratt', idea: 'La capacidad de todo el sistema es la capacidad de su punto más lento. Mejorar cualquier otra estación no aumenta ni un plato la producción; solo genera inventario y estrés.', aplica: 'En tu cocina probablemente es la freidora o la plancha en hora pico. Todo lo demás debe trabajar al ritmo de ese punto, no más rápido.', tarea: 'Observa un sábado en hora pico e identifica el cuello de botella real.' },
      ]
    },

    /* ---------------------------------------------------------- 4 */
    {
      id: 'cliente', em: '✨', n: 'Experiencia del cliente', color: '#9333EA',
      porque: 'Tu producto es comida, pero tu negocio es una experiencia temática. La gente no maneja hasta Tulipanes por unos boneless: viene por el mundo de Mirano.',
      kpis: ['resenas', 'recurrencia'],
      diagnostico: [
        { id: 'c1', p: '¿Sabes qué calificación tienes hoy en Google en cada sucursal?', peso: 3, ayuda: 'Es la vitrina real del negocio. Debajo de 4.5 pierdes clientes que nunca supiste que existieron.' },
        { id: 'c2', p: '¿Respondes el 100 % de las reseñas, buenas y malas, en menos de 48 horas?', peso: 2, ayuda: 'Responder sube la conversión de quien lee y le enseña a Google que el negocio está vivo.' },
        { id: 'c3', p: '¿Tienes una forma sistemática de pedir reseñas (no "cuando me acuerdo")?', peso: 3, ayuda: 'Ya tienes el QR de reseña. La pregunta es si el equipo lo entrega siempre y con guion.' },
        { id: 'c4', p: '¿La experiencia física comunica el universo (música, decoración, empaque, uniforme)?', peso: 2, ayuda: 'La temática que solo vive en el menú y en redes se siente publicidad; la que vive en el local se siente mundo.' },
        { id: 'c5', p: '¿Sabes qué porcentaje de tus clientes es recurrente?', peso: 3, ayuda: 'Es la diferencia entre un negocio y una campaña permanente.' },
        { id: 'c6', p: '¿Hay un momento memorable diseñado a propósito en cada visita?', peso: 2, ayuda: 'Algo que la gente quiera contar o grabar. No sucede solo: se diseña.' },
        { id: 'c7', p: '¿Tienes protocolo escrito para un cliente molesto y el equipo puede resolver sin llamarte?', peso: 2, ayuda: 'Un problema resuelto en el momento crea más lealtad que una visita perfecta.' },
        { id: 'c8', p: '¿Escuchas al cliente de forma estructurada (encuesta, libro, pregunta al cerrar la cuenta)?', peso: 2, ayuda: 'Las reseñas te llegan del 2 % más enojado o más encantado. El otro 98 % se va callado.' },
      ],
      preguntas: [
        { q: '¿Qué dijo la última reseña negativa y qué cambiaste por ella?', porque: 'Una queja sin cambio operativo es una queja que volverá a llegar.' },
        { q: '¿Cuántas reseñas nuevas juntaste esta semana entre las dos sucursales?', porque: 'Es de las pocas métricas de marketing que crece por disciplina diaria, no por presupuesto.' },
        { q: 'Si un cliente viene por primera vez hoy, ¿qué se va a llevar para contar?', porque: 'Sin momento memorable, la recomendación no ocurre.' },
        { q: '¿Qué parte de la visita rompe el universo de Mirano?', porque: 'Un detalle fuera de mundo (una playlist genérica, un empaque sin marca) baja el valor percibido de todo lo demás.' },
        { q: '¿Cuántos clientes de hoy ya habían venido antes? ¿Alguien lo sabe?', porque: 'Si nadie lo sabe, no se puede trabajar la recurrencia.' },
        { q: '¿Qué haces hoy por el cliente que ya te quiere, no por el que aún no llega?', porque: 'Es 5 veces más barato hacer volver a uno que traer uno nuevo.' },
      ],
      lecciones: [
        { id: 'l-c1', t: 'Hospitalidad es 51 %, el producto es 49 %', fuente: 'Danny Meyer — Setting the Table', idea: 'El servicio es la entrega técnica correcta; la hospitalidad es cómo la persona se siente. Meyer construyó Shake Shack y Union Square sobre esta idea: contrata por calidez, entrena la técnica.', aplica: 'En un restaurante temático la hospitalidad es aún más importante: la gente viene por sentirse parte de la Familia Cíclope, y eso lo entrega una persona, no la decoración.', tarea: 'Define las 5 conductas de hospitalidad que sí o sí exiges y enséñalas a Steph.' },
        { id: 'l-c2', t: 'El último 10 %', fuente: 'Danny Meyer', idea: 'La diferencia entre bueno y extraordinario está en el último 10 % del esfuerzo, que casi nadie da: la servilleta acomodada, el "gracias" mirando a los ojos, el empaque cerrado con sticker. Cuesta poco y cambia todo.', aplica: 'Tu empaque con stickers ya está en el checklist. El último 10 % sería que nunca salga un pedido sin él, ni en hora pico.', tarea: 'Elige el "último 10 %" de tu marca y hazlo innegociable.' },
        { id: 'l-c3', t: 'La segunda milla', fuente: 'Chick-fil-A', idea: 'Chick-fil-A entrena "second mile service": hacer una cosa más de lo esperado en cada interacción. Es la cadena con mayor venta por local de EE. UU. y no abre domingos.', aplica: 'En tu caso puede ser algo narrativo: una carta de Mirano en el pedido, un dato del lore, una salsa sorpresa. Barato, memorable y en universo.', tarea: 'Diseña una "segunda milla" que cueste menos de $5 por pedido.' },
        { id: 'l-c4', t: 'Diseña el momento pico y el final', fuente: 'The Power of Moments — Chip & Dan Heath', idea: 'La gente no recuerda una experiencia completa: recuerda su punto más intenso y su final. Si el cierre de la visita es entregar la cuenta y nada más, se olvida toda la experiencia.', aplica: 'Tu pico puede ser la entrega del Volcanino o del Aquelarre; tu final, la despedida en universo o el QR de reseña con un gancho de lore.', tarea: 'Escribe cuál es hoy tu pico y tu final, y rediseña el que esté débil.' },
      ]
    },

    /* ---------------------------------------------------------- 5 */
    {
      id: 'marketing', em: '📣', n: 'Marketing y marca', color: '#DB2777',
      porque: 'Tienes algo que casi ningún restaurante de Pachuca tiene: un universo propio. Eso es un activo, y como todo activo, se administra o se desperdicia.',
      kpis: ['cac', 'resenas'],
      diagnostico: [
        { id: 'm1', p: '¿Tienes un calendario de contenido con al menos 2 semanas de anticipación?', peso: 3, ayuda: 'Publicar por inspiración produce silencios de 9 días que el algoritmo castiga.' },
        { id: 'm2', p: '¿Sabes qué contenido tuyo generó ventas, no solo likes?', peso: 3, ayuda: 'El alcance sin venta es entretenimiento pagado por ti.' },
        { id: 'm3', p: '¿Cada campaña tiene una meta numérica y un presupuesto definido antes de arrancar?', peso: 3, ayuda: 'Sin meta previa, cualquier resultado se justifica después.' },
        { id: 'm4', p: '¿El universo Cíclope avanza (lore nuevo, personajes, capítulos) o se repite?', peso: 2, ayuda: 'Una historia que no avanza deja de ser historia y se vuelve decoración.' },
        { id: 'm5', p: '¿Tienes base de datos propia de clientes (WhatsApp, correo) que no dependa de Meta?', peso: 3, ayuda: 'Instagram te presta la audiencia; tu lista es tuya. Es el activo de marketing más subestimado.' },
        { id: 'm6', p: '¿Tu presencia en Google (perfil, fotos, horarios, publicaciones) está actualizada en ambas sucursales?', peso: 2, ayuda: 'La mayoría de las búsquedas de "dónde comer" terminan en Google Maps, no en Instagram.' },
        { id: 'm7', p: '¿Mides cuánto te cuesta traer un cliente y cuánto deja?', peso: 2, ayuda: 'Si el cliente cuesta $18 y deja $160, escalas sin miedo. Si no lo sabes, cada peso de pauta es apuesta.' },
        { id: 'm8', p: '¿Tienes colaboraciones o alianzas activas con creadores o negocios locales?', peso: 1, ayuda: 'Ya tienes el Script de colaboraciones. La pregunta es la frecuencia.' },
      ],
      preguntas: [
        { q: '¿Qué publicaste ayer y qué querías que hiciera la gente después de verlo?', porque: 'Contenido sin llamada a la acción es contenido que informa pero no vende.' },
        { q: '¿Cuánto llevas gastado en la campaña de este mes y cuántas conversaciones trajo?', porque: 'Tu benchmark propio es $14–$20 por conversación. Arriba de eso hay que ajustar creativo o público.' },
        { q: '¿Qué capítulo nuevo del universo Cíclope contaste este mes?', porque: 'El lore es tu foso competitivo: nadie puede copiarte a Mirano.' },
        { q: '¿A cuántas personas les puedes escribir directo hoy para llenar un martes flojo?', porque: 'Esa es la medida real de tu comunidad, no los seguidores.' },
        { q: '¿Qué temporada viene en 6 semanas y ya está planeada?', porque: 'Halloween y Día de Muertos son tu mina de oro; se preparan en agosto, no en octubre.' },
        { q: 'Si mañana Instagram desapareciera, ¿cómo le avisas a tus clientes de una promoción?', porque: 'La respuesta revela cuánto de tu marketing es tuyo y cuánto es rentado.' },
      ],
      lecciones: [
        { id: 'l-m1', t: 'La marca es un activo, no un gasto', fuente: 'How Brands Grow — Byron Sharp', idea: 'Las marcas crecen por disponibilidad mental (que te recuerden cuando tienen hambre) y disponibilidad física (que te encuentren fácil). Ambas se construyen con consistencia repetida, no con creatividad ocasional.', aplica: 'Tus activos distintivos son el ojo amarillo, el morado, Mirano y los nombres del menú. Deben aparecer siempre, iguales, en todo. La consistencia aburre al que la hace y funciona con el que la ve.', tarea: 'Revisa tus últimas 9 publicaciones: ¿se reconocen como tuyas sin ver el nombre?' },
        { id: 'l-m2', t: 'Construye la lista que sí es tuya', fuente: 'Principio de audiencia propia (1000 True Fans — Kevin Kelly)', idea: 'Las plataformas cambian sus reglas y tu alcance cae de la noche a la mañana. Una lista de WhatsApp o correo llega al 90 % cuando tú decides, gratis.', aplica: 'Tienes tráfico físico diario en dos sucursales: cada cliente es una oportunidad de sumar a la lista, con un gancho en universo ("únete a la Familia Cíclope y recibe la misión del mes").', tarea: 'Define el gancho para captar contactos y ponlo a operar en ambas sucursales.' },
        { id: 'l-m3', t: 'Vende la historia, no el descuento', fuente: 'Building a StoryBrand — Donald Miller', idea: 'El cliente es el héroe; la marca es el guía. La gente no compra el producto: compra en quién se convierte al comprarlo. El descuento compra una visita; la historia compra pertenencia.', aplica: 'La "Familia Cíclope" ya coloca al cliente dentro de la historia. Explótalo: misiones, rangos, colecciones de merch, capítulos que solo se enteran los que van.', tarea: 'Diseña una mecánica donde el cliente avance en el universo entre visitas.' },
        { id: 'l-m4', t: 'Mide la conversión, no el aplauso', fuente: 'Disciplina de performance marketing', idea: 'Impresiones, alcance y likes son métricas de vanidad. Las de verdad: conversaciones iniciadas, pedidos, costo por conversación y venta por peso invertido.', aplica: 'La campaña Aquelarre en WhatsApp ya te da esa cadena completa. Cierra el círculo registrando cuántas conversaciones terminaron en venta.', tarea: 'Pide al equipo registrar cuántas conversaciones de WhatsApp se vuelven pedido.' },
      ]
    },

    /* ---------------------------------------------------------- 6 */
    {
      id: 'ventas', em: '🔁', n: 'Ventas, ticket y recurrencia', color: '#EA580C',
      porque: 'Hay tres formas de crecer: más clientes, que gasten más, o que vengan más seguido. Las tres son distintas y casi todos solo trabajan la primera, que es la más cara.',
      kpis: ['ticket', 'clientes', 'recurrencia', 'plataformas'],
      diagnostico: [
        { id: 'v1', p: '¿Conoces tu ticket promedio por sucursal y por canal (piso vs plataformas)?', peso: 3, ayuda: 'Es la palanca más rápida del negocio: +$15 de ticket con la misma gente es utilidad casi pura.' },
        { id: 'v2', p: '¿El equipo tiene un guion de venta sugerida entrenado?', peso: 3, ayuda: '"¿Le agrego papas del abismo o una poción?" bien entrenado sube el ticket 8–15 %.' },
        { id: 'v3', p: '¿Sabes cuáles son tus días y horas muertas con número?', peso: 2, ayuda: 'La hora muerta es capacidad ya pagada. Llenarla es margen casi puro.' },
        { id: 'v4', p: '¿Tienes una mecánica activa para que un cliente vuelva dentro de 30 días?', peso: 3, ayuda: 'Sin mecánica, la recurrencia es azar.' },
        { id: 'v5', p: '¿Vendes algo que no sea comida (merch, eventos, experiencias, catering)?', peso: 2, ayuda: 'Ya tienes playeras y sudaderas: es margen alto y publicidad caminando.' },
        { id: 'v6', p: '¿Revisas el desempeño de tus fichas en DiDi, Uber y Rappi (fotos, descripciones, promos)?', peso: 2, ayuda: 'En plataformas la foto y la posición valen más que la calidad. Es un canal que se administra, no que se enciende.' },
        { id: 'v7', p: '¿Tienes ventas por evento o grupo (fiestas, cumpleaños, empresas)?', peso: 2, ayuda: 'El paquete Aquelarre es un producto de grupo desaprovechado si no se vende a propósito.' },
        { id: 'v8', p: '¿Sabes qué porcentaje de venta viene de plataformas y cuánto margen real dejan?', peso: 2, ayuda: 'Vender más y ganar menos es un final común cuando el delivery crece sin control.' },
      ],
      preguntas: [
        { q: '¿Cuál fue tu ticket promedio de ayer y qué lo movería $20 hacia arriba?', porque: 'Es la palanca de crecimiento más barata que tienes.' },
        { q: '¿Qué día de la semana es el más flojo y qué haces específicamente ese día?', porque: 'Un martes al 30 % de capacidad cuesta lo mismo en renta que un sábado lleno.' },
        { q: '¿Cuántos clientes de hace 3 meses no han vuelto y qué sabes de ellos?', porque: 'La fuga silenciosa no aparece en ningún reporte hasta que es tarde.' },
        { q: '¿Qué le ofreciste ayer a un cliente que ya estaba comprando?', porque: 'El cliente con la cartera en la mano es la venta más barata del mundo.' },
        { q: '¿Cuánta venta de merch hiciste este mes?', porque: 'Si es cero, tienes inventario dormido y un canal de marca sin usar.' },
        { q: '¿A cuánto está tu venta del mes contra tu punto de equilibrio, hoy?', porque: 'Saberlo a media semana permite reaccionar; saberlo el día 30 solo permite lamentarse.' },
      ],
      lecciones: [
        { id: 'l-v1', t: 'Las tres palancas del crecimiento', fuente: 'Jay Abraham', idea: 'Solo hay tres formas de crecer: más clientes, mayor ticket, mayor frecuencia. Mejorar 10 % cada una no da 10 % de crecimiento: da 33 %, porque se multiplican.', aplica: 'Hoy tu esfuerzo está casi todo en la primera (pauta). El ticket y la frecuencia no cuestan pauta, cuestan disciplina y diseño.', tarea: 'Define una acción concreta para cada palanca este mes.' },
        { id: 'l-v2', t: 'La venta sugerida se entrena, no se pide', fuente: 'Estándar de operación en QSR (McDonald\'s, Starbucks)', idea: 'Decirle al equipo "ofrezcan postre" no funciona. Funciona un guion exacto, practicado en role-play, con la pregunta correcta: no "¿algo más?" sino "¿su Crepiburger con papas del abismo o con enigma?".', aplica: 'Steph puede entrenar esto en 15 minutos por semana con el equipo y medirlo con el ticket promedio.', tarea: 'Escribe el guion de 3 sugerencias y entrégaselo a Steph para practicarlo.' },
        { id: 'l-v3', t: 'Frecuencia: dale una razón para volver antes de irse', fuente: 'Mecánicas de lealtad en hostelería', idea: 'El mejor momento para vender la siguiente visita es cuando el cliente todavía está feliz con la actual. Programas de sellos, misiones y coleccionables convierten una visita en una serie.', aplica: 'Encaja perfecto con tu universo: tarjeta de Fanciclope aventurero, misiones mensuales, coleccionar sellos por platillo probado. Ya lo tienes diseñado; el punto es si está vivo.', tarea: 'Revisa si la tarjeta de Fanciclope está en operación real y qué % de clientes la tiene.' },
        { id: 'l-v4', t: 'El delivery es un canal, no un salvavidas', fuente: 'Análisis de economía de plataformas', idea: 'Con 25–30 % de comisión, un platillo que deja 65 % de margen bruto puede quedar en 35 %. Si el delivery pasa de 30 % de tu venta sin precio diferenciado, tu utilidad cae aunque la venta suba.', aplica: 'Revisa si tus precios en plataforma reflejan la comisión y empuja el pedido directo por WhatsApp, que ya tienes activo.', tarea: 'Calcula el margen real de 3 platillos vendidos por plataforma.' },
      ]
    },

    /* ---------------------------------------------------------- 7 */
    {
      id: 'equipo', em: '👥', n: 'Equipo, liderazgo y cultura', color: '#0891B2',
      porque: 'Tu techo como negocio es tu techo como líder. Un dueño que no forma gente termina siendo el empleado más caro de su propia empresa.',
      kpis: ['rotacion', 'cumplimiento'],
      diagnostico: [
        { id: 'e1', p: '¿Cada persona sabe exactamente qué se espera de ella y cómo se mide?', peso: 3, ayuda: 'La mayoría del bajo desempeño es falta de claridad, no falta de ganas.' },
        { id: 'e2', p: '¿Tienes proceso de inducción para alguien nuevo (no "que le enseñe el que esté")?', peso: 3, ayuda: 'Los primeros 7 días definen si esa persona dura 3 meses o 3 años.' },
        { id: 'e3', p: '¿Das retroalimentación uno a uno de forma periódica y agendada?', peso: 3, ayuda: 'La retroalimentación solo cuando algo sale mal entrena a esconder errores.' },
        { id: 'e4', p: '¿Steph puede tomar decisiones operativas sin consultarte?', peso: 3, ayuda: 'Delegar sin autoridad no es delegar: es transferir trabajo y conservar el cuello de botella.' },
        { id: 'e5', p: '¿La cultura está escrita y se usa para contratar y corregir?', peso: 2, ayuda: 'Ya tienes Filosofía Cíclope y Cultura empresarial. Una cultura que no se usa para decidir es un póster.' },
        { id: 'e6', p: '¿Sabes cuánto te cuesta cada baja de personal?', peso: 2, ayuda: 'Reclutar, entrenar y sufrir la curva cuesta cerca de un mes de sueldo. Se ve en la utilidad, no en la nómina.' },
        { id: 'e7', p: '¿Hay un camino de crecimiento visible para quien entra (de qué a qué puede llegar)?', peso: 2, ayuda: 'La gente buena no se va por dinero: se va porque no ve a dónde va.' },
        { id: 'e8', p: '¿Reconoces el buen desempeño de forma pública y específica?', peso: 2, ayuda: 'El reconocimiento genérico no cambia conducta; el específico sí.' },
      ],
      preguntas: [
        { q: '¿A quién le diste retroalimentación esta semana y qué le dijiste exactamente?', porque: 'Si no recuerdas la frase, probablemente fue una charla, no retroalimentación.' },
        { q: '¿Qué decisión tomaste hoy que Steph pudo haber tomado sola?', porque: 'Cada una de esas es una oportunidad de formarla que se perdió.' },
        { q: '¿Quién de tu equipo está listo para más y todavía no se lo has dicho?', porque: 'La gente crece cuando alguien nombra el potencial en voz alta.' },
        { q: '¿Qué conducta toleraste esta semana que no querías tolerar?', porque: 'El estándar real de la empresa es lo peor que permites, no lo que dices.' },
        { q: '¿Cuánto tiempo trabajaste EN el negocio y cuánto DENTRO del negocio esta semana?', porque: 'Si todo tu tiempo es operación, el negocio no crece, solo se sostiene.' },
        { q: 'Si te enfermas 2 semanas, ¿qué se cae exactamente?', porque: 'Esa lista es tu plan de delegación, ordenada por riesgo.' },
      ],
      lecciones: [
        { id: 'l-e1', t: 'Trabaja EN el negocio, no DENTRO', fuente: 'The E-Myth Revisited — Michael Gerber', idea: 'La mayoría de los negocios pequeños los abre un técnico excelente que termina atrapado haciendo el trabajo en vez de construir el sistema que lo hace. La pregunta que ordena todo: "¿esto lo estoy haciendo o lo estoy sistematizando?".', aplica: 'El Ojo Maestro es exactamente eso: sistema en lugar de supervisión personal. El Mentor es lo mismo para la dirección.', tarea: 'Elige una tarea que hagas cada semana y conviértela en sistema o delegación este mes.' },
        { id: 'l-e2', t: 'Primero quién, después qué', fuente: 'Good to Great — Jim Collins', idea: 'Las empresas que dan el salto primero suben a la gente correcta al camión y luego deciden a dónde va. La estrategia correcta con la gente equivocada no llega a ningún lado.', aplica: 'Con dos sucursales tu limitante ya no es idea ni demanda: es gente formada. Formar a Steph es tu inversión de mayor retorno hoy.', tarea: 'Identifica el puesto que más limita tu crecimiento y define cómo lo vas a cubrir.' },
        { id: 'l-e3', t: 'Contexto, no control', fuente: 'Netflix Culture — Reed Hastings', idea: 'Si tienes que controlar cada decisión, no diste contexto suficiente. Dar contexto (el porqué, los números, el objetivo) permite que la gente decida bien sin ti, y escala; controlar no escala.', aplica: 'Compartir la meta de venta del día y el porqué de cada estándar convierte a tu equipo en operadores, no ejecutores.', tarea: 'Comparte con el equipo un número del negocio que hoy no conocen.' },
        { id: 'l-e4', t: 'Presión suave y constante', fuente: 'Danny Meyer — "constant gentle pressure"', idea: 'El estándar no se sostiene con explosiones ocasionales de exigencia, sino con corrección constante, pequeña y sin drama. Todos los días, el mismo detalle, con el mismo tono.', aplica: 'Es exactamente el rol que debe aprender Steph: corregir a diario en chico para no tener que corregir en grande.', tarea: 'Enséñale a Steph la diferencia entre corregir en el momento y acumular molestias.' },
      ]
    },

    /* ---------------------------------------------------------- 8 */
    {
      id: 'legal', em: '🧾', n: 'Contabilidad, legal y riesgo', color: '#64748B',
      porque: 'Es el área más aburrida y la que puede cerrarte. Un problema fiscal o una licencia vencida no avisa: llega con multa.',
      kpis: [],
      diagnostico: [
        { id: 'g1', p: '¿Estás al corriente con SAT (declaraciones mensuales presentadas)?', peso: 3, ayuda: 'Los recargos y multas crecen en silencio y con intereses.' },
        { id: 'g2', p: '¿Tienes contador y te entrega estados financieros, no solo declaraciones?', peso: 3, ayuda: 'Un contador que solo declara te mantiene legal; uno que informa te ayuda a decidir.' },
        { id: 'g3', p: '¿Las licencias de funcionamiento, uso de suelo y Protección Civil están vigentes en ambas sucursales?', peso: 3, ayuda: 'Ya tienes la carpeta de licencias: lo que falta es la fecha de vencimiento a la vista.' },
        { id: 'g4', p: '¿El personal está dado de alta en IMSS?', peso: 3, ayuda: 'Un accidente en cocina sin IMSS es un riesgo que puede costar el negocio completo.' },
        { id: 'g5', p: '¿Tienes contratos firmados con el personal y con los arrendadores?', peso: 2, ayuda: 'El acuerdo de palabra funciona hasta el día que deja de funcionar.' },
        { id: 'g6', p: '¿Tienes seguro de responsabilidad civil o contra incendio?', peso: 2, ayuda: 'Cocina + freidora + público es la combinación que las aseguradoras conocen bien.' },
        { id: 'g7', p: '¿Cumples con las normas de manejo higiénico de alimentos (NOM-251) y tienes bitácoras?', peso: 2, ayuda: 'Es también tu defensa si alguien alega una intoxicación.' },
        { id: 'g8', p: '¿La marca "El Anillo del Cíclope" y el personaje están registrados en IMPI?', peso: 3, ayuda: 'Construiste un universo entero. Si no está registrado, alguien más puede registrarlo.' },
      ],
      preguntas: [
        { q: '¿Cuándo vence la licencia más próxima a vencer?', porque: 'Si no lo sabes de memoria ni está en calendario, es un riesgo activo.' },
        { q: '¿Tu contador te entregó el estado de resultados del mes pasado?', porque: 'Si la respuesta es no, estás operando a ciegas por comodidad.' },
        { q: '¿Todo tu personal está dado de alta hoy?', porque: 'La pregunta se hace antes del accidente, no después.' },
        { q: '¿Está registrada la marca y el personaje de Mirano?', porque: 'Es el activo más valioso y el más fácil de perder por no hacer un trámite.' },
        { q: '¿Qué pasaría si mañana llega una inspección de Protección Civil?', porque: 'La respuesta honesta te dice qué preparar esta semana.' },
      ],
      lecciones: [
        { id: 'l-g1', t: 'Registra la marca antes de que crezca', fuente: 'Práctica de propiedad industrial (IMPI)', idea: 'El registro de marca en México lo gana quien lo solicita primero, no quien la usó primero. Un universo narrativo con personajes es registrable como marca y como obra de autor.', aplica: 'Mirano, Anodina, los nombres del menú y el ojo son activos separables del restaurante: valen incluso si algún día cambias de giro.', tarea: 'Cotiza el registro de marca en clase 43 (restaurantes) y clase 25 (ropa) por el merch.' },
        { id: 'l-g2', t: 'Riesgo no es lo que puede pasar, es lo que no aguantas', fuente: 'Gestión de riesgo aplicada a PyME', idea: 'No se trata de eliminar todo riesgo, sino de identificar los que te sacan del juego: incendio, demanda laboral, clausura, intoxicación. Esos se cubren; el resto se administra.', aplica: 'Con dos sucursales, un evento grave en una puede arrastrar a la otra si no hay separación ni seguro.', tarea: 'Lista tus 5 riesgos que sí te sacarían del juego y qué los mitiga.' },
        { id: 'l-g3', t: 'Mecanismos, no buenas intenciones', fuente: 'Amazon — "good intentions don\'t work, mechanisms do"', idea: 'Decidir "hay que estar al día con las licencias" no produce nada. Un mecanismo sí: una fecha en calendario con responsable y recordatorio automático 60 días antes.', aplica: 'El mentor puede llevar esas fechas por ti y avisarte con anticipación.', tarea: 'Carga las fechas de vencimiento de licencias y trámites en el mentor.' },
      ]
    },

    /* ---------------------------------------------------------- 9 */
    {
      id: 'creatividad', em: '🎨', n: 'Creatividad, producto y universo', color: '#7C3AED',
      porque: 'Tu ventaja competitiva no es el precio ni la ubicación: es que nadie más tiene a Mirano. La creatividad aquí no es decoración, es estrategia.',
      kpis: [],
      diagnostico: [
        { id: 'k1', p: '¿Tienes un espacio de tiempo reservado para crear (no para operar)?', peso: 3, ayuda: 'La creatividad sin agenda pierde siempre contra la urgencia.' },
        { id: 'k2', p: '¿Lanzas producto nuevo con calendario (temporadas) o cuando se ocurre?', peso: 2, ayuda: 'El lanzamiento de temporada crea urgencia y contenido; el aleatorio confunde.' },
        { id: 'k3', p: '¿Pruebas los productos nuevos con clientes reales antes de meterlos al menú?', peso: 2, ayuda: 'Enamorarse de una idea propia es el error creativo más caro.' },
        { id: 'k4', p: '¿El lore tiene un rumbo escrito (qué pasa con Mirano este año)?', peso: 2, ayuda: 'Una historia con arco genera expectativa; sin arco solo hay chistes sueltos.' },
        { id: 'k5', p: '¿Retiras productos cuando dejan de funcionar?', peso: 2, ayuda: 'Un menú solo crece si nadie tiene el valor de podarlo.' },
        { id: 'k6', p: '¿La creatividad tiene métrica (venta del producto nuevo, alcance del capítulo)?', peso: 2, ayuda: 'Sin métrica, "gustó mucho" es la única evaluación posible.' },
        { id: 'k7', p: '¿Documentas las ideas que no se ejecutaron para retomarlas?', peso: 1, ayuda: 'El banco de ideas es lo que te salva en la semana sin inspiración.' },
      ],
      preguntas: [
        { q: '¿Cuánto tiempo dedicaste esta semana a crear algo nuevo?', porque: 'Si fue cero, el universo se está congelando mientras la operación avanza.' },
        { q: '¿Qué producto nuevo lanzaste este trimestre y cómo le fue en venta?', porque: 'El lanzamiento sin seguimiento de venta es un experimento sin resultado.' },
        { q: '¿Qué parte del universo Cíclope nunca has explotado comercialmente?', porque: 'Anodina, las Tres Casas y el abuelo son campañas completas sin usar.' },
        { q: '¿Qué idea traes rondando hace meses y no aterrizas? ¿Qué te falta para decidir?', porque: 'Las ideas que no avanzan drenan energía en silencio.' },
        { q: '¿Qué está haciendo la competencia que te haya sorprendido?', porque: 'La creatividad también se alimenta de mirar fuera.' },
      ],
      lecciones: [
        { id: 'l-k1', t: 'Cerrar para crear', fuente: 'elBulli — Ferran Adrià', idea: 'elBulli cerraba 6 meses al año solo para investigar. La creatividad no era un momento de inspiración: era un periodo protegido, con método y bitácora.', aplica: 'No puedes cerrar, pero sí puedes blindar 3 horas cada semana donde no operas ni respondes WhatsApp: solo creas.', tarea: 'Agenda tu bloque semanal de creación y protégelo como si fuera una junta con el banco.' },
        { id: 'l-k2', t: 'La restricción alimenta la creatividad', fuente: 'Práctica de I+D gastronómico', idea: 'Crear "algo nuevo" es paralizante. Crear "algo nuevo usando solo los insumos que ya tengo y que se prepare en menos de 4 minutos" produce ideas ejecutables.', aplica: 'Tu mejor territorio creativo es combinar insumos existentes con nombres del universo: costo cero de inventario, novedad total para el cliente.', tarea: 'Diseña un producto de temporada usando solo insumos que ya compras.' },
        { id: 'l-k3', t: 'El arco narrativo vende dos veces', fuente: 'Storytelling de marca (Marvel, Pixar)', idea: 'Una historia con capítulos hace que el público regrese por la historia, no solo por el producto. El capítulo obliga al siguiente y crea calendario natural de contenido.', aplica: 'Define qué le pasa a Mirano este año: ¿encuentra una pista de la Gema? ¿aparece la Casa Verde? Cada capítulo es una temporada de menú y de contenido.', tarea: 'Escribe el arco del universo Cíclope para los próximos 12 meses en 5 renglones.' },
      ]
    },

    /* ---------------------------------------------------------- 10 */
    {
      id: 'crecimiento', em: '🚀', n: 'Crecimiento y expansión', color: '#0D9488',
      porque: 'Abrir la segunda sucursal enseña más que cualquier libro. Abrir la tercera sin haber sistematizado la segunda es el error que quiebra restauranteros buenos.',
      kpis: ['equilibrio', 'utilidad'],
      diagnostico: [
        { id: 'x1', p: '¿Cada sucursal es rentable por sí sola?', peso: 3, ayuda: 'Es el requisito mínimo antes de pensar en una tercera.' },
        { id: 'x2', p: '¿Tienes documentado el "manual de apertura" con lo que aprendiste en Tulipanes?', peso: 2, ayuda: 'La experiencia sin documentar se repite desde cero, con los mismos errores y los mismos costos.' },
        { id: 'x3', p: '¿La operación funciona sin ti presente más de una semana?', peso: 3, ayuda: 'Si no, expandir solo multiplica tu dependencia.' },
        { id: 'x4', p: '¿Tienes metas trimestrales escritas con número y responsable?', peso: 3, ayuda: 'Ya trabajaste OKR antes. La pregunta es si están vivos o quedaron en 2024.' },
        { id: 'x5', p: '¿Sabes cuánto costó realmente abrir Tulipanes y en cuánto se paga?', peso: 3, ayuda: 'Ese número es la base de cualquier decisión de crecimiento futuro.' },
        { id: 'x6', p: '¿Exploraste modelos de crecimiento que no sean otra sucursal (dark kitchen, franquicia, producto empacado, eventos)?', peso: 2, ayuda: 'El local completo es la forma más cara de crecer.' },
        { id: 'x7', p: '¿Tienes visión escrita a 3 años que el equipo conozca?', peso: 2, ayuda: 'La gente se compromete con un destino, no con un turno.' },
      ],
      preguntas: [
        { q: '¿Qué tendría que ser cierto para abrir una tercera sucursal con tranquilidad?', porque: 'Escribir esa lista convierte la expansión de sueño en plan.' },
        { q: '¿Cuál es hoy tu principal cuello de botella para crecer: dinero, gente, sistemas o tú?', porque: 'Casi siempre es gente o el dueño, casi nunca es demanda.' },
        { q: '¿Qué aprendiste en la apertura de la segunda que no quieres repetir?', porque: 'Ese aprendizaje vale dinero real en la siguiente.' },
        { q: '¿Dónde quieres estar en 3 años y qué haces esta semana que apunte hacia allá?', porque: 'La visión sin acción semanal es un deseo.' },
        { q: '¿Qué parte del negocio podría existir sin local?', porque: 'Merch, salsas empacadas, eventos y licencias del universo escalan sin renta.' },
      ],
      lecciones: [
        { id: 'l-x1', t: 'Sistematiza antes de multiplicar', fuente: 'Modelo de franquicia (Ray Kroc / McDonald\'s)', idea: 'McDonald\'s no escaló por hamburguesas: escaló por un sistema tan preciso que cualquier persona podía ejecutarlo igual en cualquier ciudad. Sin sistema, cada sucursal nueva es un negocio nuevo.', aplica: 'El Ojo Maestro es el inicio de ese sistema. Cuando la tercera sucursal pueda operar solo con la app y el manual, estás listo.', tarea: 'Define qué le falta al sistema para que una sucursal nueva arranque sin ti.' },
        { id: 'l-x2', t: 'La disciplina del erizo', fuente: 'Good to Great — Jim Collins', idea: 'Crece en la intersección de tres cosas: en qué puedes ser el mejor, qué te apasiona y qué mueve tu motor económico. Todo lo que quede fuera de esa intersección, por atractivo que parezca, distrae.', aplica: 'Lo tuyo es el universo temático + comida casual. Cualquier crecimiento que no use el universo compite en desventaja.', tarea: 'Escribe tu erizo en una frase y úsalo para filtrar la próxima oportunidad que te ofrezcan.' },
        { id: 'l-x3', t: 'Metas trimestrales con número', fuente: 'Measure What Matters — John Doerr (OKR)', idea: 'Un objetivo inspirador con 3 resultados clave numéricos por trimestre, no más. Menos metas, más foco. Lo que no tiene número no es meta, es intención.', aplica: 'Ya trabajaste OKR en 2024. El mentor los revive con revisión semanal automática.', tarea: 'Define 1 objetivo y 3 resultados clave para este trimestre en Misiones.' },
      ]
    },
  ];

  /* ============================================================
     ACADEMIA — currículum de dirección (Toño)
     Cada módulo se desbloquea al terminar el anterior.
  ============================================================ */
  const ACADEMIA = [
    {
      id: 'ac-1', n: 'Nivel I · El dueño que sabe sus números', em: '🔢',
      objetivo: 'Que ninguna decisión de dinero se tome por corazonada.',
      lecciones: ['l-f1', 'l-f2', 'l-f3', 'l-r1', 'l-r2'],
      prueba: 'Puedes decir de memoria: punto de equilibrio de cada sucursal, prime cost del mes pasado y tu platillo más rentable.'
    },
    {
      id: 'ac-2', n: 'Nivel II · El operador consistente', em: '⚙️',
      objetivo: 'Que las dos sucursales entreguen lo mismo sin ti encima.',
      lecciones: ['l-o1', 'l-o2', 'l-o3', 'l-o4', 'l-c2'],
      prueba: 'Una semana completa sin que tengas que corregir el mismo error dos veces.'
    },
    {
      id: 'ac-3', n: 'Nivel III · El anfitrión que crea clientes de por vida', em: '✨',
      objetivo: 'Que la gente regrese por cómo se siente, no solo por lo que come.',
      lecciones: ['l-c1', 'l-c3', 'l-c4', 'l-v3'],
      prueba: 'Calificación de Google ≥ 4.6 en ambas sucursales y una mecánica de recurrencia funcionando.'
    },
    {
      id: 'ac-4', n: 'Nivel IV · El constructor de marca', em: '📣',
      objetivo: 'Que el universo Cíclope trabaje para el negocio todos los días.',
      lecciones: ['l-m1', 'l-m2', 'l-m3', 'l-m4', 'l-k3'],
      prueba: 'Base propia de contactos creciendo cada mes y costo por cliente conocido.'
    },
    {
      id: 'ac-5', n: 'Nivel V · El líder que forma líderes', em: '👥',
      objetivo: 'Que el negocio no dependa de ti para operar bien.',
      lecciones: ['l-e1', 'l-e2', 'l-e3', 'l-e4'],
      prueba: 'Te vas dos semanas y los números no se mueven.'
    },
    {
      id: 'ac-6', n: 'Nivel VI · El estratega que escala', em: '🚀',
      objetivo: 'Que crecer sea una decisión con evidencia, no un salto de fe.',
      lecciones: ['l-x1', 'l-x2', 'l-x3', 'l-g1', 'l-g3'],
      prueba: 'Tienes escrito qué debe ser cierto para abrir la tercera, y sabes cuánto falta.'
    },
  ];

  /* ============================================================
     RUTA DE GERENCIA — Steph
     4 niveles. Cada uno con módulos: aprender, practicar, demostrar.
  ============================================================ */
  const RUTA_STEPH = [
    {
      id: 'st-1', n: 'Nivel 1 · Dominio de la operación', em: '⚙️',
      d: 'Antes de dirigir a otros hay que dominar lo que se les va a exigir.',
      modulos: [
        { id: 's1a', t: 'El estándar del platillo', apr: 'Conocer el gramaje, montaje y tiempo de cada producto del menú.', prac: 'Preparar y evaluar 5 platillos contra el recetario, sin ayuda.', dem: 'Detectar un platillo fuera de estándar sin verlo en la receta.' },
        { id: 's1b', t: 'El checklist como herramienta, no como trámite', apr: 'Entender por qué existe cada acción del día y qué falla si no se hace.', prac: 'Cerrar 5 turnos con checklist al 100 % y observaciones útiles.', dem: 'Explicarle a alguien nuevo el porqué de 5 tareas del checklist.' },
        { id: 's1c', t: 'Manejo del pico', apr: 'Identificar el cuello de botella de la cocina y cómo preparar el pico.', prac: 'Dirigir 3 horas pico completas.', dem: 'Sacar un sábado sin quiebres de tiempo ni quejas.' },
        { id: 's1d', t: 'Inventario y merma', apr: 'Cómo se cuenta, por qué existen los mínimos y qué causa la merma.', prac: 'Levantar inventario completo 4 veces y explicar las diferencias.', dem: 'Proponer un cambio de mínimo con argumento de consumo real.' },
        { id: 's1e', t: 'Higiene y seguridad', apr: 'NOM-251 en lo que aplica: cadena de frío, desinfección, PEPS.', prac: 'Auditar la cocina con lista de verificación 3 veces.', dem: 'Aprobar una revisión sorpresa de Dirección.' },
      ]
    },
    {
      id: 'st-2', n: 'Nivel 2 · Dirigir personas', em: '👥',
      d: 'Pasar de "hacer bien" a "lograr que otros hagan bien".',
      modulos: [
        { id: 's2a', t: 'Dar instrucciones que se cumplen', apr: 'Instrucción clara: qué, quién, para cuándo y cómo se ve terminado.', prac: 'Asignar 10 tareas con ese formato y verificar el resultado.', dem: '9 de 10 tareas cumplidas sin recordatorio.' },
        { id: 's2b', t: 'Corregir sin romper', apr: 'Corregir la conducta, no a la persona; en privado, en el momento, con ejemplo concreto.', prac: 'Aplicar 5 correcciones y anotar cómo reaccionó cada quien.', dem: 'Una corrección que cambió la conducta de forma permanente.' },
        { id: 's2c', t: 'El line-up de 5 minutos', apr: 'Cómo abrir el turno: meta del día, foco de calidad, reconocimiento.', prac: 'Dirigir 15 line-ups seguidos.', dem: 'El equipo llega esperando el line-up sin que se convoque.' },
        { id: 's2d', t: 'Entrenar a alguien nuevo', apr: 'Enseñar por demostración: yo lo hago, lo hacemos, tú lo haces, tú lo enseñas.', prac: 'Entrenar a una persona nueva de principio a fin.', dem: 'Esa persona opera sola en 2 semanas.' },
        { id: 's2e', t: 'Conversaciones difíciles', apr: 'Retrasos, actitud, conflictos entre compañeros: cómo se abordan sin escalar.', prac: 'Manejar 3 conversaciones difíciles y documentarlas.', dem: 'Resolver un conflicto sin que llegue a Dirección.' },
      ]
    },
    {
      id: 'st-3', n: 'Nivel 3 · Entender el negocio', em: '💰',
      d: 'Un gerente que no entiende los números administra tareas; uno que los entiende administra resultados.',
      modulos: [
        { id: 's3a', t: 'De dónde sale el dinero', apr: 'Ventas, costo de insumos, nómina, renta y qué queda al final.', prac: 'Calcular el resultado de un mes de su sucursal con Dirección.', dem: 'Explicar por qué un mes fue mejor que otro con números.' },
        { id: 's3b', t: 'El número del día', apr: 'Qué es el punto de equilibrio y cuánto hay que vender diario.', prac: 'Seguir la venta diaria contra meta durante un mes.', dem: 'Proponer una acción concreta un día que va por debajo de meta.' },
        { id: 's3c', t: 'Ticket promedio y venta sugerida', apr: 'Cómo se compone el ticket y qué lo sube.', prac: 'Entrenar al equipo en 3 sugerencias y medir el ticket 2 semanas.', dem: 'Subir el ticket promedio de su turno de forma medible.' },
        { id: 's3d', t: 'Costo y merma', apr: 'Cómo cada gramo de más y cada producto tirado sale de la utilidad.', prac: 'Registrar merma valorizada un mes.', dem: 'Bajar la merma con una acción propuesta por ella.' },
        { id: 's3e', t: 'Leer el tablero', apr: 'Interpretar los reportes del Ojo Maestro y del Mentor.', prac: 'Presentar el reporte semanal de su sucursal 4 veces.', dem: 'Detectar sola una desviación antes de que Dirección la señale.' },
      ]
    },
    {
      id: 'st-4', n: 'Nivel 4 · Criterio de gerente', em: '🧭',
      d: 'Decidir bien cuando no hay nadie a quién preguntarle.',
      modulos: [
        { id: 's4a', t: 'Decidir con criterio de marca', apr: 'Filtrar decisiones con la cultura y el universo Cíclope, no solo con costo.', prac: 'Documentar 5 decisiones propias con su razonamiento.', dem: 'Una decisión difícil tomada sola que Dirección habría tomado igual.' },
        { id: 's4b', t: 'Resolver al cliente en el momento', apr: 'Límites de autoridad: qué puede reponer, descontar o regalar sin consultar.', prac: 'Resolver 10 incidencias de cliente en el momento.', dem: 'Convertir una queja pública en una buena reseña.' },
        { id: 's4c', t: 'Planear la semana', apr: 'Horarios, compras, eventos y contingencias con anticipación.', prac: 'Armar el calendario y las compras de 4 semanas.', dem: 'Una semana completa sin faltantes ni huecos de horario.' },
        { id: 's4d', t: 'Mejorar el sistema', apr: 'Detectar procesos que fallan y proponer el estándar nuevo.', prac: 'Proponer 3 mejoras documentadas.', dem: 'Una mejora suya adoptada en ambas sucursales.' },
        { id: 's4e', t: 'Formar al siguiente', apr: 'Identificar y desarrollar a quien pueda cubrirla.', prac: 'Formar a un encargado de turno.', dem: 'Puede irse una semana y su sucursal opera igual.' },
      ]
    },
  ];

  /* Preguntas del ritual diario de gerencia (Steph) */
  const PREGUNTAS_STEPH = [
    { q: '¿Qué salió distinto a lo esperado ayer y qué hiciste al respecto?', porque: 'Un gerente se mide por lo que corrige, no por lo que reporta.' },
    { q: '¿A quién le diste retroalimentación ayer y sobre qué exactamente?', porque: 'La corrección diaria y pequeña evita la conversación grande e incómoda.' },
    { q: '¿Qué tarea del checklist se saltó y por qué?', porque: 'Casi siempre revela una tarea mal ubicada en el tiempo, no flojera.' },
    { q: '¿Qué cliente se fue con una mala experiencia y qué pasó?', porque: 'Lo que no se cuenta hoy aparece en Google mañana.' },
    { q: '¿Cómo va la venta del día contra la meta?', porque: 'Enterarse a las 6 pm permite reaccionar; enterarse al cierre, no.' },
    { q: '¿Qué te faltó para resolver algo sin consultar a Dirección?', porque: 'Esa respuesta es exactamente tu siguiente paso de crecimiento.' },
    { q: '¿Qué aprendiste ayer que no sabías antes?', porque: 'Un gerente que no aprende algo por semana se estanca en 6 meses.' },
    { q: '¿Está el equipo completo y a tiempo para hoy?', porque: 'El 80 % de los días malos empiezan con un hueco de horario.' },
    { q: '¿Qué producto está por faltar y ya lo pediste?', porque: 'Un faltante en sábado cuesta ventas y reseñas.' },
    { q: '¿Qué reconociste públicamente ayer?', porque: 'El reconocimiento específico es la herramienta de liderazgo más barata y menos usada.' },
  ];

  /* ============================================================
     GUION DE LA SESIÓN SEMANAL (El Consejo)
  ============================================================ */
  const CONSEJO = [
    { id: 'cs-1', em: '📊', t: 'Los números de la semana', min: 10, g: 'Revisa venta por sucursal contra la semana anterior y contra la meta. Nómina %, cumplimiento de checklist, faltantes. No interpretes todavía: primero lee los números completos.' },
    { id: 'cs-2', em: '✅', t: 'Compromisos de la semana pasada', min: 5, g: 'Uno por uno: hecho, no hecho o a medias. Sin explicaciones largas. Lo no hecho dos semanas seguidas se elimina o se delega: no se arrastra una tercera.' },
    { id: 'cs-3', em: '🔍', t: 'El área de la semana', min: 15, g: 'El mentor te asigna un área en rotación. Contesta su diagnóstico con honestidad brutal y actualiza su nivel de madurez. Es el corazón de la sesión.' },
    { id: 'cs-4', em: '🕳️', t: 'Puntos ciegos', min: 5, g: 'Revisa lo que el mentor detectó: áreas sin revisar, números sin dato, alertas de operación. Decide cuál atacas esta semana.' },
    { id: 'cs-5', em: '👤', t: 'Gente', min: 5, g: '¿Cómo va Steph? ¿Quién destacó? ¿Quién preocupa? ¿Qué conversación debes tener esta semana y con quién?' },
    { id: 'cs-6', em: '🎯', t: 'Decisiones y compromisos', min: 10, g: 'Máximo 3 compromisos para la semana, cada uno con día límite. Si son más de 3, no son prioridades: son una lista de deseos.' },
    { id: 'cs-7', em: '📖', t: 'Aprendizaje', min: 5, g: 'La lección del mentor de esta semana y una frase de lo que aprendiste tú de la semana que pasó. Esto se queda en la Bitácora para siempre.' },
  ];

  /* ============================================================
     BLIND SPOTS — catálogo de reglas
     La lógica vive en app.js; aquí el texto y la severidad.
  ============================================================ */
  const CIEGOS = {
    'area-sin-revisar': { s: 2, t: 'Área sin auditar', d: 'Llevas {n} días sin evaluar {area}. Lo que no se revisa se degrada en silencio.' },
    'area-nivel-bajo': { s: 3, t: 'Área en nivel crítico', d: '{area} está en nivel {nivel}. Es el eslabón más débil del negocio hoy.' },
    'kpi-sin-dato': { s: 2, t: 'Número que no existe', d: 'No tienes dato de {kpi} este mes. Sin ese número, {area} se dirige a ciegas.' },
    'sin-cierre': { s: 3, t: 'Días sin cierre registrado', d: '{n} día(s) sin cierre en {suc}. Un hueco en ventas es un hueco en todo lo que se calcula con ellas.' },
    'nomina-alta': { s: 3, t: 'Nómina sobre ventas alta', d: 'La nómina va en {v} % de la venta ({suc}). Arriba de 33 % o hay sobre-personal o la venta está baja para el turno armado.' },
    'costo-ventas-alto': { s: 3, t: 'Costo de ventas fuera de rango', d: 'En {suc} el costo de ventas va en {v} %. Un restaurante casual sano opera entre 28 y 35 %. Volver a rango vale ~{g} al mes en esta sucursal, sin vender un peso más.' },
    'prime-alto': { s: 3, t: 'Prime cost en zona de pérdida', d: 'Insumos + nómina = {v} % de la venta en {suc}. Arriba de 65 % el negocio pierde dinero aunque venda mucho: la renta y los servicios ya no caben.' },
    'venta-caida': { s: 2, t: 'Caída de venta', d: '{suc} vendió {v} % menos que la semana pasada. Aún no es tendencia, pero es señal.' },
    'checklist-bajo': { s: 2, t: 'Cumplimiento operativo bajo', d: 'El checklist va en {v} % en {suc}. El estándar deja de ser real debajo de 90 %.' },
    'inventario-agotado': { s: 2, t: 'Producto agotado', d: '{n} producto(s) en cero en {suc}. Un faltante en fin de semana cuesta venta y reseña.' },
    'compromiso-vencido': { s: 3, t: 'Compromiso vencido', d: 'Tienes {n} compromiso(s) fuera de fecha. Los compromisos que no se cierran enseñan al equipo que la fecha no importa.' },
    'sin-consejo': { s: 3, t: 'Sin sesión semanal', d: 'Llevas {n} días sin hacer el Consejo. El ritmo es lo que hace que este sistema sirva.' },
    'sin-ritual': { s: 1, t: 'Ritual diario interrumpido', d: 'Llevas {n} días sin el ritual. La constancia vale más que la intensidad.' },
    'meta-sin-avance': { s: 2, t: 'Misión sin movimiento', d: '"{meta}" lleva {n} días sin avance. Una meta sin acción semanal es un deseo.' },
    'steph-detenida': { s: 2, t: 'Desarrollo de gerencia detenido', d: 'Steph lleva {n} días sin avanzar en su ruta. Formarla es tu inversión de mayor retorno.' },
    'reto-estancado': { s: 2, t: 'Aprendizaje pendiente', d: 'Tienes {n} reto(s) de aprendizaje fuera de fecha. Lo que decidiste aprender y no aprendiste sigue frenándote donde te frenó.' },
  };

  /* ============================================================
     PUESTA EN MARCHA — los días previos al arranque formal
     Objetivo: que el 1 de agosto todo salga solo y sea real.
  ============================================================ */
  const ARRANQUE = [
    {
      id: 'ar-datos', em: '🗃️', n: 'Fase 1 · Datos maestros',
      d: 'Sin esto, la nómina y el inventario de agosto salen mal. Es lo único que no se puede improvisar después.',
      items: [
        { id: 'q1', t: 'Personal completo con sueldos reales', q: 'El pago por turno y por hora extra de cada quien. De aquí sale la nómina sola cada semana: si un dato está mal, todo el mes queda mal.', quien: 'Toño', donde: 'Ojo Maestro → Dirección → Administrar → Personal' },
        { id: 'q2', t: 'Calendario de agosto armado', q: 'Con el llenado rápido son 2 pasos. El calendario es lo que le dice al equipo cuándo entra, y al mentor cuánto vas a pagar.', quien: 'Toño o Steph', donde: 'Ojo Maestro → Calendario → Llenado rápido' },
        { id: 'q3', t: 'Productos y mínimos revisados', q: 'Un mínimo mal puesto genera compras de más o faltantes en sábado. Revisa sobre todo los que cambiaron de unidad.', quien: 'Steph', donde: 'Ojo Maestro → Dirección → Administrar → Productos' },
        { id: 'q4', t: 'Las dos sucursales con sus tablets conectadas', q: 'Que ambas estén en línea y sincronizando antes del día 1, no ese mismo día.', quien: 'Toño', donde: 'Ojo Maestro → Administrar → Probar conexión' },
      ]
    },
    {
      id: 'ar-numeros', em: '💰', n: 'Fase 2 · La verdad de los números',
      d: 'El costo de ventas al 40–50 % es hoy el dato más caro del negocio. Antes de agosto hay que saber si es real o es un dato sucio.',
      items: [
        { id: 'q5', t: 'Costos fijos capturados', q: 'Renta, luz, agua, internet y sueldos de cada sucursal. Ya quedaron cargados con lo que diste: solo verifícalos.', quien: 'Toño', donde: 'Mentor → Números' },
        { id: 'q6', t: 'Escandallo de los 5 platillos más vendidos', q: 'Costear con precios de HOY, gramaje en mano. Es lo que te dice si el 40–50 % es real o si Loyverse trae costos viejos. De aquí salen las decisiones de precio y porción.', quien: 'Toño', donde: 'Recetario del Ojo Maestro + factura de proveedor' },
        { id: 'q7', t: 'Loyverse conectado', q: 'Te da ticket promedio y costo de ventas reales, y cuadra automático contra lo que reporta el equipo.', quien: 'Toño', donde: 'Apps Script → Propiedades del script → LOYVERSE_TOKEN' },
        { id: 'q8', t: 'Punto de equilibrio calculado y comunicado', q: 'El número del día por sucursal. El equipo no puede pegarle a una meta que no conoce.', quien: 'Toño → Steph', donde: 'Mentor → Números' },
      ]
    },
    {
      id: 'ar-oper', em: '⚙️', n: 'Fase 3 · Operación en firme',
      d: 'Estos días el equipo practica con el sistema real. Los errores de ahora son gratis; los de agosto cuestan.',
      items: [
        { id: 'q9', t: 'Todos checan entrada y salida, todos los días', q: 'Aunque julio no cuente para la nómina del sistema, es la única forma de que el día 1 nadie dude.', quien: 'Equipo', donde: 'Ojo Maestro → Asistencia' },
        { id: 'q10', t: 'Cierre diario con ventas reales', q: 'El cierre es la fuente de todo lo que calcula el mentor. Un día sin cierre es un hueco permanente.', quien: 'Quien cierra', donde: 'Ojo Maestro → Checklist → Enviar cierre' },
        { id: 'q11', t: 'Inventario levantado al menos dos veces', q: 'Para calibrar mínimos con consumo real antes de agosto.', quien: 'Steph', donde: 'Ojo Maestro → Inventario' },
        { id: 'q12', t: 'Errores detectados y corregidos', q: 'Todo lo que falle estos días se anota y se arregla. Es el propósito de esta semana.', quien: 'Toño', donde: 'Mentor → Bitácora' },
      ]
    },
    {
      id: 'ar-criterio', em: '🧭', n: 'Fase 4 · Criterio y ritmo',
      d: 'El sistema sin ritmo es una app bonita que nadie abre.',
      items: [
        { id: 'q13', t: 'Auditar las 4 áreas prioritarias', q: 'Finanzas, Rentabilidad, Marketing y Ventas. Es tu línea base: en diciembre vas a querer saber de dónde saliste.', quien: 'Toño', donde: 'Mentor → Auditoría 360' },
        { id: 'q14', t: 'Primer Consejo semanal completo', q: 'Para llegar a agosto con el hábito ya arrancado, no estrenándolo.', quien: 'Toño', donde: 'Mentor → El Consejo' },
        { id: 'q15', t: 'Misión de agosto definida', q: 'Un objetivo con 3 resultados numéricos. Agosto es el primer mes medible de verdad.', quien: 'Toño', donde: 'Mentor → Misiones' },
        { id: 'q16', t: 'Steph arrancó su Nivel 1', q: 'Que llegue a agosto con la ruta empezada y sabiendo cómo se le va a evaluar.', quien: 'Steph', donde: 'Mentor → Mi ruta' },
      ]
    },
  ];

  /* Rutina de estos días de familiarización */
  const RUTINA_ARRANQUE = [
    { em: '🌅', t: 'Al abrir', d: 'El equipo checa entrada. Steph da el line-up de 5 minutos con la meta del día.' },
    { em: '☕', t: 'En algún momento del día', d: 'Toño hace el ritual del Mentor: 7 minutos. Aunque los números todavía estén incompletos, el hábito es lo que se está construyendo.' },
    { em: '🌙', t: 'Al cerrar', d: 'Checklist completo, cierre con las ventas reales y observaciones de lo que falló del sistema.' },
    { em: '📝', t: 'Antes de dormir', d: 'Si algo del sistema falló, anótalo en la Bitácora del Mentor. Esta semana existe para eso.' },
  ];

  /* ============================================================
     ESCANDALLO — costo real por platillo
     Los gramajes salen del recetario del Ojo Maestro (Preparaciones 2025).
     Lo único que falta capturar es el PRECIO de cada insumo.
     u: unidad de compra · c: cantidad que lleva el platillo en esa unidad
  ============================================================ */
  const INSUMOS = [
    // proteínas
    { id: 'i-boneless', n: 'Boneless (pollo)', u: 'kg', g: 'Proteína' },
    { id: 'i-arrachera', n: 'Arrachera', u: 'kg', g: 'Proteína' },
    { id: 'i-pollo', n: 'Pollo para Dragón', u: 'kg', g: 'Proteína' },
    { id: 'i-salchicha', n: 'Salchicha 22 cm', u: 'pieza', g: 'Proteína' },
    { id: 'i-tocino', n: 'Tocino ahumado', u: 'kg', g: 'Proteína' },
    // papas
    { id: 'i-papa-recta', n: 'Papa a la francesa', u: 'kg', g: 'Papas' },
    { id: 'i-papa-curly', n: 'Papa curly', u: 'kg', g: 'Papas' },
    { id: 'i-papa-gajo', n: 'Papa gajo', u: 'kg', g: 'Papas' },
    // base y lácteos
    { id: 'i-masa', n: 'Masa Crepiburger', u: 'pieza', g: 'Base', ayuda: 'Costo de una crepa terminada: harina, huevo, leche y el colorante verde.' },
    { id: 'i-gouda', n: 'Queso gouda', u: 'kg', g: 'Base' },
    { id: 'i-dedos', n: 'Dedo de queso', u: 'pieza', g: 'Base' },
    { id: 'i-lechuga', n: 'Lechuga', u: 'kg', g: 'Base' },
    // salsas y aderezos
    { id: 'i-bbq', n: 'Salsa BBQ / Líquido B', u: 'L', g: 'Salsas' },
    { id: 'i-buffalo', n: 'Salsa Buffalo / Lava', u: 'L', g: 'Salsas' },
    { id: 'i-habanero', n: 'Habanero / Aliento de Dragón', u: 'L', g: 'Salsas' },
    { id: 'i-ranch', n: 'Aderezo ranch', u: 'L', g: 'Salsas' },
    { id: 'i-catsup', n: 'Catsup', u: 'L', g: 'Salsas' },
    { id: 'i-mayo', n: 'Mayonesa', u: 'L', g: 'Salsas' },
    { id: 'i-quesos', n: 'Salsa de quesos', u: 'L', g: 'Salsas' },
    { id: 'i-volcanica', n: 'Salsa volcánica', u: 'L', g: 'Salsas' },
    // cocina
    { id: 'i-aceite', n: 'Aceite', u: 'L', g: 'Cocina', ayuda: 'Divide el costo de la tina entre las órdenes que salen antes de cambiarlo.' },
    // pociones
    { id: 'i-helado', n: 'Helado', u: 'L', g: 'Pociones' },
    { id: 'i-leche-ev', n: 'Leche evaporada', u: 'L', g: 'Pociones' },
    { id: 'i-crema', n: 'Crema batida', u: 'porción', g: 'Pociones' },
    { id: 'i-hershey', n: 'Chocolate Hershey\'s', u: 'porción', g: 'Pociones' },
    { id: 'i-oreo', n: 'Oreo', u: 'porción', g: 'Pociones' },
    // empaque
    { id: 'i-empaque', n: 'Empaque completo del platillo', u: 'pieza', g: 'Empaque', ayuda: 'Caja o charola + bolsa + servilleta + sticker. Súmalos y captúralo como uno solo.' },
    { id: 'i-espada', n: 'Espada', u: 'pieza', g: 'Empaque' },
    { id: 'i-vaso', n: 'Vaso con tapa', u: 'pieza', g: 'Empaque' },
  ];

  /* Cantidades tomadas del recetario. kg y L se expresan en la MISMA unidad
     de compra (0.08 kg = 80 g), para que el costo sea precio × cantidad. */
  const RECETAS_COSTO = [
    {
      id: 'r-zombie', n: 'Crepiburger Zombie', precio: 99, cat: 'Crepiburger', items: [
        ['i-masa', 1], ['i-boneless', .08], ['i-papa-recta', .08], ['i-gouda', .025],
        ['i-lechuga', .02], ['i-ranch', .03], ['i-catsup', .02], ['i-aceite', .02], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-minotauro', n: 'Crepiburger Minotauro', precio: 99, cat: 'Crepiburger', items: [
        ['i-masa', 1], ['i-arrachera', .15], ['i-papa-recta', .08], ['i-gouda', .025],
        ['i-lechuga', .02], ['i-bbq', .02], ['i-catsup', .02], ['i-aceite', .02], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-dragon', n: 'Crepiburger Dragón', precio: 99, cat: 'Crepiburger', items: [
        ['i-masa', 1], ['i-pollo', .1], ['i-papa-recta', .08], ['i-gouda', .025],
        ['i-lechuga', .02], ['i-mayo', .015], ['i-bbq', .02], ['i-catsup', .02], ['i-aceite', .02], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-7cerebros', n: '7 Cerebros (220 g)', precio: 110, cat: 'Cerebros', items: [
        ['i-boneless', .22], ['i-ranch', .05], ['i-bbq', .05], ['i-espada', 1], ['i-aceite', .03], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-14cerebros', n: '14 Cerebros (440 g)', precio: 175, cat: 'Cerebros', items: [
        ['i-boneless', .44], ['i-ranch', .1], ['i-bbq', .1], ['i-espada', 2], ['i-aceite', .05], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-1kg', n: '1 kg Cerebros (900 g)', precio: 344, cat: 'Cerebros', items: [
        ['i-boneless', .9], ['i-ranch', .15], ['i-bbq', .15], ['i-espada', 3], ['i-aceite', .1], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-volcanino', n: 'Volcanino', precio: 99, cat: 'Volcanino', items: [
        ['i-salchicha', 1], ['i-masa', 0], ['i-papa-recta', .08], ['i-volcanica', .04],
        ['i-boneless', .04], ['i-aceite', .02], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-papas-muertas', n: 'Papas Muertas', precio: 70, cat: 'Entradas', items: [
        ['i-papa-recta', .25], ['i-catsup', .02], ['i-quesos', .04], ['i-aceite', .03], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-papas-abismo', n: 'Papas del Abismo', precio: 85, cat: 'Entradas', items: [
        ['i-papa-recta', .25], ['i-quesos', .06], ['i-tocino', .03], ['i-aceite', .03], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-dedos', n: 'Dedos Cíclope (5)', precio: 95, cat: 'Entradas', items: [
        ['i-dedos', 5], ['i-catsup', .02], ['i-aceite', .02], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-aquelarre', n: 'Paquete Aquelarre', precio: 485, cat: 'Paquetes', items: [
        ['i-boneless', .9], ['i-papa-gajo', .125], ['i-papa-curly', .125], ['i-dedos', 3],
        ['i-ranch', .1], ['i-quesos', .05], ['i-catsup', .03], ['i-aceite', .12], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-ciclope', n: 'Paquete Cíclope', precio: 159, cat: 'Paquetes', items: [
        ['i-boneless', .22], ['i-papa-recta', .135], ['i-quesos', .04], ['i-catsup', .02],
        ['i-ranch', .05], ['i-espada', 1], ['i-aceite', .04], ['i-empaque', 1]
      ]
    },
    {
      id: 'r-pocion', n: 'Poción clásica', precio: 75, cat: 'Pociones', items: [
        ['i-helado', .25], ['i-leche-ev', .12], ['i-crema', 1], ['i-hershey', 1], ['i-vaso', 1]
      ]
    },
  ];

  /* ============================================================
     RETOS DE APRENDIZAJE — el aprendizaje just-in-time
     Cuando chocas con algo que no sabes, se vuelve un reto con
     tipo, recurso y pasos. Cierra el ciclo: hueco → aprender → aplicar.
  ============================================================ */
  const TIPOS_RETO = [
    { id: 'busqueda', em: '🔎', n: 'Búsqueda', d: 'Investigar algo puntual ahora mismo (una duda, un dato, un cómo).' },
    { id: 'lectura', em: '📖', n: 'Lectura', d: 'Un libro, artículo o guía que te dé el marco completo.' },
    { id: 'curso', em: '🎓', n: 'Curso', d: 'Formación estructurada, en línea o presencial.' },
    { id: 'taller', em: '🛠️', n: 'Taller / práctica', d: 'Aprender haciendo, con las manos.' },
    { id: 'mentoria', em: '🤝', n: 'Mentoría / consulta', d: 'Preguntarle a alguien que ya lo resolvió (contador, chef, otro dueño).' },
    { id: 'experimento', em: '🧪', n: 'Experimento', d: 'Probar algo en pequeño en el negocio y medir qué pasa.' },
  ];

  /* Biblioteca curada: recursos reales por área. `buscar` es la frase exacta
     para buscar en Google/YouTube (no dependemos de links que se rompen).
     Lo importante es el marco, no el enlace. */
  const BIBLIOTECA = {
    finanzas: [
      { t: 'Profit First', tipo: 'lectura', autor: 'Mike Michalowicz', que: 'Cómo apartar utilidad y tu sueldo ANTES de gastar, no con lo que sobra.', buscar: 'Profit First resumen español restaurante' },
      { t: 'Prime cost para restauranteros', tipo: 'busqueda', que: 'Insumos % + nómina %; el número que vigilan los buenos operadores.', buscar: 'prime cost restaurant explained' },
      { t: 'Flujo de efectivo vs. utilidad', tipo: 'busqueda', que: 'Por qué un negocio rentable puede quebrar por falta de caja.', buscar: 'cash flow vs profit small business' },
    ],
    rentabilidad: [
      { t: 'Ingeniería de menú', tipo: 'lectura', autor: 'Kasavana & Smith', que: 'Estrellas, caballos, puzzles y perros: qué platillo empujar, subir o quitar.', buscar: 'menu engineering matrix stars puzzles' },
      { t: 'Escandallo de platillos', tipo: 'taller', que: 'Costear cada platillo gramo por gramo con precio de proveedor.', buscar: 'cómo hacer escandallo de un platillo' },
      { t: 'Psicología de precios en carta', tipo: 'busqueda', que: 'Quitar el $, el platillo ancla, la posición en la carta.', buscar: 'menu pricing psychology restaurant' },
    ],
    operacion: [
      { t: 'The French Laundry / mise en place', tipo: 'lectura', autor: 'Thomas Keller', que: 'El orden es velocidad: todo listo antes del pico.', buscar: 'mise en place kitchen discipline' },
      { t: 'Toyota / kaizen para PyME', tipo: 'busqueda', que: 'Estandarizar antes de mejorar; la mejora continua en pasos chicos.', buscar: 'kaizen small business standard work' },
      { t: 'La Meta (teoría de restricciones)', tipo: 'lectura', autor: 'Eliyahu Goldratt', que: 'El cuello de botella manda toda la operación.', buscar: 'La Meta Goldratt resumen' },
    ],
    cliente: [
      { t: 'Setting the Table', tipo: 'lectura', autor: 'Danny Meyer', que: 'Hospitalidad como estrategia: contrata calidez, entrena la técnica.', buscar: 'Setting the Table Danny Meyer hospitality' },
      { t: 'The Power of Moments', tipo: 'lectura', autor: 'Chip & Dan Heath', que: 'Diseñar el pico y el final de la visita, que es lo único que se recuerda.', buscar: 'Power of Moments peak end rule' },
      { t: 'Cómo pedir reseñas sin ser molesto', tipo: 'busqueda', que: 'Guion y momento exacto para pedir la reseña de Google.', buscar: 'how to ask customers for google reviews restaurant' },
    ],
    marketing: [
      { t: 'How Brands Grow', tipo: 'lectura', autor: 'Byron Sharp', que: 'Las marcas crecen por consistencia y disponibilidad, no por creatividad ocasional.', buscar: 'How Brands Grow Byron Sharp resumen' },
      { t: 'Building a StoryBrand', tipo: 'lectura', autor: 'Donald Miller', que: 'El cliente es el héroe, tu marca es el guía. Vende la historia.', buscar: 'StoryBrand framework resumen español' },
      { t: 'Meta Ads para restaurantes', tipo: 'curso', que: 'Campañas de WhatsApp y conversión, medir costo por conversación.', buscar: 'meta ads restaurantes whatsapp curso' },
    ],
    ventas: [
      { t: 'Las 3 palancas de Jay Abraham', tipo: 'busqueda', autor: 'Jay Abraham', que: 'Más clientes, mayor ticket, mayor frecuencia: se multiplican.', buscar: 'Jay Abraham three ways to grow business' },
      { t: 'Venta sugerida (upselling) entrenada', tipo: 'taller', que: 'Guion exacto y role-play para subir el ticket 8-15%.', buscar: 'upselling scripts restaurant training' },
      { t: 'Programas de lealtad simples', tipo: 'busqueda', que: 'Sellos, misiones y coleccionables para que vuelvan.', buscar: 'restaurant loyalty program ideas small' },
    ],
    equipo: [
      { t: 'The E-Myth Revisited', tipo: 'lectura', autor: 'Michael Gerber', que: 'Trabaja EN el negocio, no DENTRO: construye el sistema.', buscar: 'E-Myth Revisited resumen español' },
      { t: 'Good to Great', tipo: 'lectura', autor: 'Jim Collins', que: 'Primero quién, después qué: la gente correcta antes que la estrategia.', buscar: 'Good to Great first who then what' },
      { t: 'Onboarding de 7 días', tipo: 'busqueda', que: 'Cómo inducir a alguien nuevo para que dure y rinda.', buscar: 'restaurant employee onboarding checklist' },
    ],
    legal: [
      { t: 'Registro de marca en México (IMPI)', tipo: 'busqueda', que: 'Proteger Mirano y el nombre en clase 43 y 25.', buscar: 'cómo registrar marca IMPI clase 43 restaurante' },
      { t: 'NOM-251 manejo de alimentos', tipo: 'busqueda', que: 'Higiene, cadena de frío y bitácoras; tu defensa legal.', buscar: 'NOM-251 manejo higiénico alimentos resumen' },
      { t: 'Obligaciones fiscales de un restaurante', tipo: 'mentoria', que: 'Qué declarar y cuándo; hazlo con tu contador.', buscar: 'obligaciones fiscales restaurante México SAT' },
    ],
    creatividad: [
      { t: 'elBulli / método creativo de Adrià', tipo: 'busqueda', autor: 'Ferran Adrià', que: 'La creatividad como periodo protegido con método, no inspiración suelta.', buscar: 'Ferran Adria creative process method' },
      { t: 'Storytelling de marca (Pixar/Marvel)', tipo: 'busqueda', que: 'El arco por capítulos que hace volver por la historia.', buscar: 'pixar storytelling rules brand' },
    ],
    crecimiento: [
      { t: 'Scaling Up', tipo: 'lectura', autor: 'Verne Harnish', que: 'Cómo crecer sin que el dueño sea el cuello de botella.', buscar: 'Scaling Up Rockefeller Habits resumen' },
      { t: 'Sistema de franquicia (McDonald\'s)', tipo: 'busqueda', que: 'Sistematizar tanto que cualquiera lo ejecute igual antes de multiplicar.', buscar: 'McDonald\'s system replicable operations' },
      { t: 'Measure What Matters (OKR)', tipo: 'lectura', autor: 'John Doerr', que: 'Metas trimestrales con número, pocas y con foco.', buscar: 'OKR Measure What Matters resumen español' },
    ],
  };

  return {
    NIVELES, KPIS, AREAS, ACADEMIA, RUTA_STEPH, PREGUNTAS_STEPH, CONSEJO, CIEGOS,
    ARRANQUE, RUTINA_ARRANQUE, INSUMOS, RECETAS_COSTO, TIPOS_RETO, BIBLIOTECA
  };
})();

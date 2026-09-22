/* ------------------------------------------------------------------
   Don Chamorro 2.0 — Configuración y menú
   Edita este archivo para cambiar precios, productos o el WhatsApp
   que recibe los pedidos. No hace falta tocar app.js.
------------------------------------------------------------------- */

const CONFIG = {
  // Número que RECIBE los pedidos (formato internacional, sin + ni espacios)
  whatsapp: "524461235742",
  negocio: "Don Chamorro",
  bienvenida: "¡Bienvenidos a Don Chamorro!",
  lema: "Taco que cierra no es taco",
  descripcion: "Los originales Chamorros de Querétaro. Chamorro de cerdo jugoso y doradito, servido en doble tortilla con cebolla, cilantro y pico de gallo.",
  direccionTienda: "Mercado de la Cruz · Garibaldi 73, Centro, Querétaro",
  horario: "Todos los días de 7:30 AM a 2:30 PM",

  /* Horario para el aviso "Abierto / Cerrado" en vivo (hora de Querétaro).
     Un rango por día, formato 24 h. null = cerrado ese día. */
  zonaHoraria: "America/Mexico_City",
  horarios: {
    lunes:     ["07:30", "14:30"],
    martes:    ["07:30", "14:30"],
    miercoles: ["07:30", "14:30"],
    jueves:    ["07:30", "14:30"],
    viernes:   ["07:30", "14:30"],
    sabado:    ["07:30", "14:30"],
    domingo:   ["07:30", "14:30"]
  },
  tiempoEntrega: "25-40 min",
  telefono: "+524461235742",
  moneda: "$",

  /* Fotos: sustituye estos archivos por tus fotos reales (mismo nombre o
     cambia la ruta). Tamaños recomendados: portada 1200x420, logo 300x300,
     productos 600x450. Si una foto falta, se muestra el dibujo de la categoría. */
  portada: "img/portada.svg",
  logo: "favicon.svg",

  // Costo de envío: un número (ej. 35) o null para "se confirma por WhatsApp"
  envio: null,

  // Pedido mínimo a domicilio (0 = sin mínimo)
  minimoDomicilio: 0,

  // Formas de pago (ninguna se cobra en el sitio)
  pagos: {
    delivery: [
      { id: "efectivo", nombre: "Efectivo con el repartidor", desc: "Prepara tu billete, te llevamos cambio.", cash: true },
      { id: "tarjeta",  nombre: "Tarjeta con el repartidor",  desc: "El repartidor lleva terminal bancaria." },
      { id: "transfer", nombre: "Transferencia",              desc: "Te enviamos los datos por WhatsApp." }
    ],
    pickup: [
      { id: "efectivo-tienda", nombre: "Efectivo en la tienda", desc: "Pagas al recoger tu pedido.", cash: true },
      { id: "tarjeta-tienda",  nombre: "Tarjeta en la tienda",  desc: "Aceptamos débito y crédito." }
    ],
    local: [
      { id: "efectivo-local", nombre: "Efectivo en el local", desc: "Pagas en la caja al terminar.", cash: true },
      { id: "tarjeta-local",  nombre: "Tarjeta en el local",  desc: "Aceptamos débito y crédito." }
    ]
  }
};

// Grupos de opciones reutilizables
const OPT_CARNE = {
  id: "carne",
  label: "Elige la carne",
  required: true,
  choices: [
    { id: "chamorro", nombre: "Chamorro", desc: "El clásico, con su piel y su sabor." },
    { id: "maciza",   nombre: "Maciza",   desc: "Pura carne, sin grasa." },
    { id: "surtido",  nombre: "Surtido",  desc: "De todo un poco." }
  ]
};

const OPT_BEBIDA = {
  id: "bebida",
  label: "Elige las bebidas del paquete",
  required: true,
  choices: [
    { id: "coca",      nombre: "Coca-Cola original" },
    { id: "coca-light",nombre: "Coca-Cola light" },
    { id: "horchata",  nombre: "Agua de horchata" },
    { id: "mango",     nombre: "Boing de mango" },
    { id: "guayaba",   nombre: "Boing de guayaba" },
    { id: "mixto",     nombre: "Surtidas (las que haya)" }
  ]
};

const MENU = [
  {
    id: "tacos",
    nombre: "Tacos",
    img: "img/taco.svg",
    desc: "En doble tortilla, con cebolla, cilantro y pico de gallo.",
    items: [
      { id: "taco-1", img: "",  nombre: "Taco de chamorro",  precio: 35,  desc: "Un taco bien servido en doble tortilla.", opciones: [OPT_CARNE] },
      { id: "taco-3", img: "",  nombre: "Orden de 3 tacos",  precio: 96,  desc: "Para el antojo de siempre.", opciones: [OPT_CARNE] },
      { id: "taco-5", img: "",  nombre: "Orden de 5 tacos",  precio: 165, desc: "El hambre en serio.", opciones: [OPT_CARNE] },
      { id: "taco-10", img: "", nombre: "Orden de 10 tacos", precio: 320, desc: "Salsa y verdura aparte.", opciones: [OPT_CARNE] },
      { id: "taco-20", img: "", nombre: "Orden de 20 tacos", precio: 560, desc: "Salsa y verdura aparte.", opciones: [OPT_CARNE] }
    ]
  },
  {
    id: "paquetes",
    nombre: "Paquetes",
    img: "img/paquete.svg",
    desc: "Para compartir, con bebidas incluidas.",
    destacada: true,
    items: [
      { id: "pq-6", img: "",   nombre: "6 tacos + 2 Coca-Colas",  precio: 238, desc: "Para dos con sed.", opciones: [OPT_CARNE, OPT_BEBIDA] },
      { id: "pq-12", img: "",  nombre: "12 tacos + 4 Coca-Colas", precio: 550, desc: "Para cuatro.", opciones: [OPT_CARNE, OPT_BEBIDA] },
      { id: "pq-ch2", img: "", nombre: "1 chamorro + 2 bebidas",  precio: 230, desc: "Chamorro entero para partir.", opciones: [OPT_BEBIDA] },
      { id: "pq-fam", img: "", nombre: "Paquete Familiar",        precio: 440, desc: "2 chamorros + 4 bebidas.", opciones: [OPT_BEBIDA] },
      { id: "pq-fst", img: "", nombre: "Paquete Fiesta",          precio: 898, desc: "4 chamorros + 8 bebidas.", opciones: [OPT_BEBIDA] }
    ]
  },
  {
    id: "grupos",
    nombre: "Chamorro para grupos",
    img: "img/chamorro.svg",
    desc: "Chamorro entero con tortillas, salsas y verdura.",
    items: [
      { id: "gr-2", img: "",  nombre: "Chamorro para 2 personas",  precio: 250,  desc: "1 chamorro." },
      { id: "gr-4", img: "",  nombre: "Chamorro para 4 personas",  precio: 300,  desc: "2 chamorros." },
      { id: "gr-6", img: "",  nombre: "Chamorro para 6 personas",  precio: 450,  desc: "3 chamorros." },
      { id: "gr-8", img: "",  nombre: "Chamorro para 8 personas",  precio: 600,  desc: "4 chamorros." },
      { id: "gr-10", img: "", nombre: "Chamorro para 10 personas", precio: 750,  desc: "5 chamorros." },
      { id: "gr-15", img: "", nombre: "Chamorro para 15 personas", precio: 1200, desc: "8 chamorros." }
    ]
  },
  {
    id: "bebidas",
    nombre: "Bebidas",
    img: "img/bebida.svg",
    desc: "Bien frías.",
    items: [
      { id: "be-hor", img: "",  nombre: "Agua de horchata",    precio: 35 },
      { id: "be-man", img: "",  nombre: "Boing de mango",      precio: 35 },
      { id: "be-gua", img: "",  nombre: "Boing de guayaba",    precio: 35 },
      { id: "be-coca", img: "", nombre: "Coca-Cola original",  precio: 35 },
      { id: "be-lgt", img: "",  nombre: "Coca-Cola light",     precio: 35 }
    ]
  }
];

# Don Chamorro 2.0 — Pedido en línea

Sitio estático (HTML/CSS/JS, sin build ni servidor) con pedido en 3 pasos
al estilo OlaClick. **No se cobra nada en el sitio**: el cliente arma su
pedido y al final se abre WhatsApp con el resumen listo para enviar al
negocio; el pago se hace en la tienda o con el repartidor.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Portada de la tienda + menú con fotos + checkout de 3 pasos |
| `menu-data.js` | **Lo único que se edita normalmente**: textos de bienvenida, fotos, productos, precios, WhatsApp |
| `app.js` | Lógica: portada, catálogo, carrito, pasos, validación, mensaje de WhatsApp |
| `order.css` | Estilos del pedido (portada, catálogo, carrito, modales, pasos) |
| `styles.css` | Estilos base de la marca |
| `img/` | Fotos. Los `.svg` son dibujos provisionales: sustitúyelos por fotos reales |

## Fotos
Los archivos de `img/` son ilustraciones de relleno. Para poner fotos reales:

1. Copia tus fotos en `img/` (`portada.jpg`, `taco-chamorro.jpg`, …).
   Tamaños recomendados: **portada 1200x420**, **logo 300x300**, **productos 600x450**.
2. En `menu-data.js`:
   - `CONFIG.portada` y `CONFIG.logo` → la portada y el logo;
   - `img:` de cada **categoría** → foto por defecto de todos sus productos;
   - `img:` de cada **producto** → su foto propia (si se deja `""` usa la de la categoría).

Si una foto falta o no carga, se muestra el dibujo de la categoría: la página
nunca se ve rota.

## Los 3 pasos
1. **Productos** — se eligen del catálogo con foto; los tacos y paquetes piden la carne
   (chamorro / maciza / surtido) y admiten nota por producto. Carrito editable.
2. **Entrega y contacto** — tres modalidades: **comer aquí**, **para llevar** o
   **a domicilio**. Nombre, teléfono (opcional si come en el local), dirección +
   colonia + referencias (sólo a domicilio) y hora de llegada o de entrega.
3. **Pago** — según la modalidad: efectivo o tarjeta en el local, en la tienda
   al recoger, o con el repartidor (más transferencia a domicilio).
   Si elige efectivo puede indicar con cuánto paga y se calcula el cambio.

Al confirmar se abre `wa.me` con el resumen formateado. El carrito se guarda en
`localStorage`, así que el cliente no pierde su pedido si recarga.

## Personalizar (`menu-data.js`)
- `CONFIG.whatsapp` — número que **recibe** los pedidos (formato `52442...`, sin `+`).
- `CONFIG.envio` — número (ej. `35`), `0` para gratis, o `null` = “se confirma por WhatsApp”.
- `CONFIG.minimoDomicilio` — pedido mínimo a domicilio (`0` = sin mínimo).
- `CONFIG.pagos` — formas de pago por modalidad (`local`, `pickup`, `delivery`);
  `cash: true` activa el campo del cambio.
- `MENU` — categorías y productos (`nombre`, `precio`, `desc`, `opciones`).

## Probar en local
```bash
python -m http.server 8777
# abre http://127.0.0.1:8777/
```
Se puede publicar tal cual en cualquier hosting estático (Netlify, Vercel,
GitHub Pages, Hostinger…).

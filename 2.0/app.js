/* ------------------------------------------------------------------
   Don Chamorro 2.0 — Pedido en línea en 3 pasos + envío por WhatsApp
------------------------------------------------------------------- */
(() => {
  "use strict";

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const money = (n) => CONFIG.moneda + Number(n).toLocaleString("es-MX");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const STORE_KEY = "dc-cart-v2";
  const INFO_KEY  = "dc-info-v2";

  /* ---------------- Estado ---------------- */
  let cart = load(STORE_KEY, []);
  let info = Object.assign(
    { mode: "delivery", name: "", phone: "", address: "", colonia: "", refs: "", when: "Lo antes posible", time: "", pay: "", cash: "", note: "" },
    load(INFO_KEY, {})
  );
  let step = 1;
  let draft = null; // producto abierto en el modal

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(cart));
      localStorage.setItem(INFO_KEY, JSON.stringify(info));
    } catch { /* modo privado: seguimos sin guardar */ }
  }

  const allItems = () => MENU.flatMap((c) => c.items);
  const findItem = (id) => allItems().find((i) => i.id === id);
  // Nombre actual del menú (los carritos guardados pueden tener uno viejo)
  const lineName = (l) => (findItem(l.id) || l).nombre;

  /* ---------------- Portada de la tienda ---------------- */
  function renderStore() {
    const cover = $("#store-cover-img");
    cover.src = CONFIG.portada || "";
    cover.alt = `Foto de ${CONFIG.negocio}`;
    cover.addEventListener("error", () => cover.closest(".store-cover").classList.add("no-photo"));

    const logo = $("#store-logo");
    logo.src = CONFIG.logo || "";
    logo.addEventListener("error", () => { logo.hidden = true; });

    $("#store-welcome").textContent = CONFIG.bienvenida || `¡Bienvenidos a ${CONFIG.negocio}!`;
    $("#store-lema").textContent = CONFIG.lema || "";
    $("#store-desc").textContent = CONFIG.descripcion || "";
    document.title = `${CONFIG.negocio} · Menú y pedidos en línea`;
  }

  /* ---------------- Abierto / Cerrado en vivo ---------------- */
  const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  const DIAS_TXT = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

  // Día y minuto actuales en la zona horaria del restaurante (no la del visitante)
  function nowAtStore() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: CONFIG.zonaHoraria || "America/Mexico_City",
      weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: Number(get("hour")) * 60 + Number(get("minute")) };
  }

  function openState() {
    const { day, min } = nowAtStore();
    const today = CONFIG.horarios[DIAS[day]];
    if (today && min >= toMin(today[0]) && min < toMin(today[1])) {
      return { open: true, soon: toMin(today[1]) - min <= 30, text: `Cierra a las ${today[1]}` };
    }
    if (today && min < toMin(today[0])) {
      return { open: false, text: `Abre hoy a las ${today[0]}` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      const h = CONFIG.horarios[DIAS[d]];
      if (h) return { open: false, text: `Abre ${i === 1 ? "mañana" : "el " + DIAS_TXT[d]} a las ${h[0]}` };
    }
    return { open: false, text: "" };
  }

  function renderOpenStatus() {
    const el = $("#open-status");
    if (!el || !CONFIG.horarios) return;
    const s = openState();
    el.className = "open-status " + (s.open ? (s.soon ? "is-soon" : "is-open") : "is-closed");
    el.innerHTML = `<span class="dot" aria-hidden="true"></span><b>${s.open ? (s.soon ? "Cierra pronto" : "Abierto ahora") : "Cerrado"}</b>${s.text ? ` · ${esc(s.text)}` : ""}`;
    el.hidden = false;
  }

  // Foto del producto, o el dibujo de su categoría si no hay
  function itemImg(item) {
    const cat = MENU.find((c) => c.items.includes(item));
    return item.img || (cat && cat.img) || "";
  }

  /* ---------------- Catálogo ---------------- */
  function renderCatalog() {
    $("#cat-tabs").innerHTML = MENU.map(
      (c, i) => `<button type="button" class="cat-tab${i === 0 ? " active" : ""}" data-cat="${c.id}">${esc(c.nombre)}</button>`
    ).join("");

    $("#catalog").innerHTML = MENU.map((c) => `
      <section class="cat-block" id="cat-${c.id}">
        <header class="cat-head">
          <h3>${esc(c.nombre)}${c.destacada ? '<span class="cat-flag">Para compartir</span>' : ""}</h3>
          ${c.desc ? `<p class="muted">${esc(c.desc)}</p>` : ""}
        </header>
        <div class="prod-grid">
          ${c.items.map((it) => `
            <article class="prod" data-id="${it.id}" tabindex="0" role="button" aria-label="Agregar ${esc(it.nombre)}">
              <div class="prod-txt">
                <h4>${esc(it.nombre)}</h4>
                ${it.desc ? `<p>${esc(it.desc)}</p>` : ""}
                <b class="prod-price">${money(it.precio)}</b>
              </div>
              <div class="prod-media">
                <img src="${esc(itemImg(it))}" alt="${esc(it.nombre)}" loading="lazy">
                <span class="prod-add" aria-hidden="true">+</span>
              </div>
              <span class="prod-badge" data-badge="${it.id}" hidden></span>
            </article>`).join("")}
        </div>
      </section>`).join("");

    $("#cat-tabs").addEventListener("click", (e) => {
      const b = e.target.closest(".cat-tab");
      if (!b) return;
      $$(".cat-tab").forEach((t) => t.classList.toggle("active", t === b));
      $("#cat-" + b.dataset.cat).scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("#catalog").addEventListener("click", (e) => {
      const card = e.target.closest(".prod");
      if (card) openProduct(card.dataset.id);
    });
    $("#catalog").addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".prod");
      if (card) { e.preventDefault(); openProduct(card.dataset.id); }
    });

    // Resalta la pestaña de la categoría visible
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id.replace("cat-", "");
          $$(".cat-tab").forEach((t) => t.classList.toggle("active", t.dataset.cat === id));
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      $$(".cat-block").forEach((b) => io.observe(b));
    }
  }

  /* ---------------- Modal de producto ---------------- */
  function openProduct(id) {
    const item = findItem(id);
    if (!item) return;
    // Si ya está en el pedido, se abre en modo edición con su cantidad real
    const line = cart.filter((l) => l.id === id).pop();
    draft = { item, qty: line ? line.qty : 1, opts: {}, nota: line ? line.nota : "", editKey: line ? line.key : null };
    const lineOpts = line ? (line.opts || parseKeyOpts(line.key)) : {};
    (item.opciones || []).forEach((g) => {
      const saved = lineOpts[g.id];
      draft.opts[g.id] = g.choices.some((c) => c.id === saved) ? saved : g.choices[0].id;
    });
    const others = line ? cart.filter((l) => l.id === id && l !== line).reduce((s, l) => s + l.qty, 0) : 0;

    $("#product-title").textContent = item.nombre;
    $("#product-body").innerHTML = `
      <figure class="prod-hero"><img src="${esc(itemImg(item))}" alt="${esc(item.nombre)}"></figure>
      <p class="prod-hero-price">${money(item.precio)}</p>
      ${item.desc ? `<p class="muted">${esc(item.desc)}</p>` : ""}
      ${(item.opciones || []).map((g) => `
        <fieldset class="opt-group">
          <legend>${esc(g.label)}${g.required ? " *" : ""}</legend>
          ${g.choices.map((ch, i) => `
            <label class="choice choice-row">
              <input type="radio" name="opt-${g.id}" value="${ch.id}" data-group="${g.id}"${draft.opts[g.id] === ch.id ? " checked" : ""}>
              <span class="choice-box">
                <b>${esc(ch.nombre)}</b>
                ${ch.desc ? `<small>${esc(ch.desc)}</small>` : ""}
              </span>
            </label>`).join("")}
        </fieldset>`).join("")}
      <label class="field">
        <span>Nota para este producto <small>(opcional)</small></span>
        <input type="text" id="p-note" value="${esc(draft.nota)}" placeholder="Ej. sin cilantro, salsa aparte">
      </label>
      ${others ? `<p class="muted small">Tienes ${others} más con otras opciones: ajústalas en “Mi pedido”.</p>` : ""}`;

    $("#p-qty").textContent = draft.qty;
    updateAddBtn();
    openModal("#product-modal");
    $("#product-body").addEventListener("change", onOptChange);
  }

  function onOptChange(e) {
    const r = e.target.closest('input[type="radio"][data-group]');
    if (r && draft) draft.opts[r.dataset.group] = r.value;
  }

  function updateAddBtn() {
    if (!draft) return;
    const price = money(draft.item.precio * draft.qty);
    $("#p-add").textContent = !draft.editKey ? `Agregar · ${price}`
      : draft.qty === 0 ? "Quitar del pedido"
      : `Actualizar · ${price}`;
  }

  // Carritos guardados antes de tener `opts` en cada línea: se leen de la clave
  function parseKeyOpts(key) {
    try { return JSON.parse(String(key).split("|")[1]) || {}; }
    catch { return {}; }
  }

  function optLabel(item, opts) {
    return (item.opciones || [])
      .map((g) => {
        const ch = g.choices.find((c) => c.id === opts[g.id]);
        return ch ? ch.nombre : null;
      })
      .filter(Boolean)
      .join(" · ");
  }

  function addDraftToCart() {
    if (!draft) return;
    const nota = ($("#p-note")?.value || "").trim();
    const key = draft.item.id + "|" + JSON.stringify(draft.opts) + "|" + nota;
    const editing = !!draft.editKey;

    // En edición, la línea original se reemplaza (o se quita si la cantidad es 0)
    let pos = cart.length;
    if (editing) {
      pos = cart.findIndex((l) => l.key === draft.editKey);
      if (pos < 0) pos = cart.length;
      cart = cart.filter((l) => l.key !== draft.editKey);
    }

    if (draft.qty > 0) {
      const found = cart.find((l) => l.key === key);
      if (found) {
        found.qty += draft.qty;
      } else {
        cart.splice(pos, 0, {
          key,
          id: draft.item.id,
          nombre: draft.item.nombre,
          precio: draft.item.precio,
          opts: { ...draft.opts },
          opciones: optLabel(draft.item, draft.opts),
          nota,
          qty: draft.qty
        });
      }
    }

    const msg = !editing ? "Agregado a tu pedido" : draft.qty === 0 ? "Quitado de tu pedido" : "Pedido actualizado";
    draft = null;
    save();
    syncCart();
    closeModal("#product-modal");
    toast(msg);
  }

  /* ---------------- Carrito ---------------- */
  const subtotal = () => cart.reduce((s, l) => s + l.precio * l.qty, 0);
  const count = () => cart.reduce((s, l) => s + l.qty, 0);
  const envio = () => (info.mode === "delivery" && typeof CONFIG.envio === "number" ? CONFIG.envio : 0);
  const total = () => subtotal() + envio();

  function syncCart() {
    const n = count();
    $$("[data-cart-count]").forEach((el) => { el.textContent = n; });
    $$("[data-cart-total]").forEach((el) => { el.textContent = money(total()); });
    $("#cart-bar").hidden = n === 0;
    document.body.classList.toggle("has-cart", n > 0);

    // badges en el catálogo
    $$("[data-badge]").forEach((b) => {
      const q = cart.filter((l) => l.id === b.dataset.badge).reduce((s, l) => s + l.qty, 0);
      b.textContent = q;
      b.hidden = q === 0;
    });

    renderCartLines();
    renderTotals();
  }

  function renderCartLines() {
    const box = $("#cart-lines");
    if (!box) return;
    $("#empty-cart").hidden = cart.length > 0;
    box.innerHTML = cart.map((l) => `
      <article class="line" data-key="${esc(l.key)}">
        <div class="line-txt">
          <h4>${esc(lineName(l))}</h4>
          ${l.opciones ? `<p class="line-opts">${esc(l.opciones)}</p>` : ""}
          ${l.nota ? `<p class="line-note">“${esc(l.nota)}”</p>` : ""}
          <b>${money(l.precio * l.qty)}</b>
        </div>
        <div class="qty qty-sm" role="group" aria-label="Cantidad de ${esc(lineName(l))}">
          <button type="button" class="qty-btn" data-act="minus" aria-label="Quitar uno">−</button>
          <span>${l.qty}</span>
          <button type="button" class="qty-btn" data-act="plus" aria-label="Agregar uno">+</button>
        </div>
      </article>`).join("");
  }

  function renderTotals() {
    const env = info.mode === "delivery"
      ? (typeof CONFIG.envio === "number"
          ? (CONFIG.envio === 0 ? "Gratis" : money(CONFIG.envio))
          : "Se confirma por WhatsApp")
      : "—";
    const html = `
      <div class="tot-row"><span>Subtotal</span><b>${money(subtotal())}</b></div>
      ${info.mode === "delivery" ? `<div class="tot-row"><span>Envío</span><b>${env}</b></div>` : ""}
      <div class="tot-row tot-main"><span>Total</span><b>${money(total())}</b></div>`;
    ["#totals-1", "#totals-3"].forEach((sel) => { const el = $(sel); if (el) el.innerHTML = html; });
  }

  /* ---------------- Checkout ---------------- */
  function openCheckout() {
    fillForm();
    renderPayList();
    goStep(1);
    openModal("#checkout");
  }

  function fillForm() {
    $("#f-name").value = info.name;
    $("#f-phone").value = info.phone;
    $("#f-address").value = info.address;
    $("#f-colonia").value = info.colonia;
    $("#f-refs").value = info.refs;
    $("#f-when").value = info.when === "Programado" ? "Programado" : "Lo antes posible";
    $("#f-time").value = info.time;
    $("#order-note").value = info.note;
    $("#f-time-wrap").hidden = $("#f-when").value !== "Programado";
    $$('input[name="mode"]').forEach((r) => { r.checked = r.value === info.mode; });
    applyMode();
  }

  const MODES = {
    local:    { titulo: "Comer aquí",   msg: "Para comer aquí",  pagoEn: "en el local",           cuando: "¿A qué hora llegan?" },
    pickup:   { titulo: "Para llevar",  msg: "Para llevar",       pagoEn: "en la tienda al recoger", cuando: "¿A qué hora pasas por él?" },
    delivery: { titulo: "A domicilio",  msg: "A domicilio",       pagoEn: "con el repartidor",     cuando: "¿Para cuándo?" }
  };
  const modeDef = () => MODES[info.mode] || MODES.delivery;

  function applyMode() {
    const delivery = info.mode === "delivery";
    $$(".delivery-only").forEach((el) => { el.hidden = !delivery; });
    $("#pay-where").textContent = modeDef().pagoEn;
    $("#when-label").textContent = modeDef().cuando;
    $("#phone-label").textContent = info.mode === "local" ? "Teléfono / WhatsApp" : "Teléfono / WhatsApp *";
    renderPayList();
    renderTotals();
  }

  function renderPayList() {
    const list = CONFIG.pagos[info.mode] || [];
    if (!list.some((p) => p.id === info.pay)) info.pay = "";
    $("#pay-list").innerHTML = list.map((p) => `
      <label class="choice choice-row">
        <input type="radio" name="pay" value="${p.id}"${info.pay === p.id ? " checked" : ""}>
        <span class="choice-box">
          <b>${esc(p.nombre)}</b>
          ${p.desc ? `<small>${esc(p.desc)}</small>` : ""}
        </span>
      </label>`).join("");
    updateCashField();
  }

  function payDef() {
    return (CONFIG.pagos[info.mode] || []).find((p) => p.id === info.pay) || null;
  }

  function updateCashField() {
    const p = payDef();
    const wrap = $("#cash-wrap");
    wrap.hidden = !(p && p.cash);
    if (wrap.hidden) { $("#change-hint").textContent = ""; return; }
    $("#f-cash").value = info.cash;
    showChange();
  }

  function showChange() {
    const paid = parseFloat($("#f-cash").value);
    const hint = $("#change-hint");
    if (!paid) { hint.textContent = ""; return; }
    const diff = paid - total();
    hint.textContent = diff >= 0
      ? `Tu cambio: ${money(diff)}`
      : `Faltan ${money(Math.abs(diff))} para cubrir el total.`;
    hint.classList.toggle("hint-bad", diff < 0);
  }

  function goStep(n) {
    step = n;
    $$(".step").forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    $$("#stepper li").forEach((li) => {
      const i = Number(li.dataset.step);
      li.classList.toggle("active", i === n);
      li.classList.toggle("done", i < n);
    });
    $("#checkout-title").textContent = ["Mi pedido", "Entrega y contacto", "Forma de pago"][n - 1];
    $("#co-prev").hidden = n === 1;
    $("#co-back").hidden = n === 1;
    $("#co-next").hidden = n === 3;
    $("#co-send").hidden = n !== 3;
    $("#err-2").hidden = true;
    $("#err-3").hidden = true;
    $(".modal-body", $("#checkout")).scrollTop = 0;
  }

  function readForm() {
    info.name = $("#f-name").value.trim();
    info.phone = $("#f-phone").value.trim();
    info.address = $("#f-address").value.trim();
    info.colonia = $("#f-colonia").value.trim();
    info.refs = $("#f-refs").value.trim();
    info.when = $("#f-when").value;
    info.time = $("#f-time").value;
    info.note = $("#order-note").value.trim();
    info.cash = $("#f-cash").value;
    save();
  }

  function validate(n) {
    if (n === 1) {
      if (!cart.length) { toast("Agrega al menos un producto"); return false; }
      if (info.mode === "delivery" && CONFIG.minimoDomicilio > 0 && subtotal() < CONFIG.minimoDomicilio) {
        toast(`El pedido mínimo a domicilio es ${money(CONFIG.minimoDomicilio)}`);
        return false;
      }
      return true;
    }
    if (n === 2) {
      const miss = [];
      if (!info.name) miss.push("tu nombre");
      const phoneOk = /\d{8,}/.test(info.phone.replace(/\D/g, ""));
      if (info.mode === "local") {
        if (info.phone && !phoneOk) miss.push("un teléfono válido (10 dígitos)");
      } else if (!phoneOk) {
        miss.push("un teléfono válido (10 dígitos)");
      }
      if (info.mode === "delivery") {
        if (!info.address) miss.push("la calle y número");
        if (!info.colonia) miss.push("la colonia");
      }
      if (info.when === "Programado" && !info.time) miss.push("la hora deseada");
      const err = $("#err-2");
      err.hidden = miss.length === 0;
      err.textContent = miss.length ? "Falta " + miss.join(", ") + "." : "";
      return miss.length === 0;
    }
    if (n === 3) {
      const err = $("#err-3");
      err.hidden = !!info.pay;
      err.textContent = info.pay ? "" : "Elige una forma de pago.";
      return !!info.pay;
    }
    return true;
  }

  /* ---------------- Mensaje de WhatsApp ---------------- */
  const fmt = { b: (t) => `*${t}*`, i: (t) => `_${t}_`, esc: (t) => String(t) };

  function buildMessage(folio) {
    const L = [];
    const sep = "———————————————";
    const e = fmt.esc;

    L.push(fmt.b("NUEVO PEDIDO " + folio));
    L.push(fmt.i(`${e(CONFIG.negocio)} · pedido desde la página`));
    L.push(sep);
    L.push(fmt.b("MI PEDIDO"));
    cart.forEach((l) => {
      L.push(`• ${l.qty} x ${e(lineName(l))} — ${money(l.precio * l.qty)}`);
      if (l.opciones) L.push(`   ↳ ${e(l.opciones)}`);
      if (l.nota) L.push(`   ↳ Nota: ${e(l.nota)}`);
    });
    if (info.note) { L.push(""); L.push(`${fmt.b("Notas:")} ${e(info.note)}`); }

    L.push(sep);
    L.push(`Subtotal: ${money(subtotal())}`);
    if (info.mode === "delivery") {
      L.push(`Envío: ${typeof CONFIG.envio === "number" ? (CONFIG.envio === 0 ? "Gratis" : money(CONFIG.envio)) : "por confirmar"}`);
    }
    L.push(fmt.b(`TOTAL: ${money(total())}`));

    L.push(sep);
    L.push(`${fmt.b("ENTREGA:")} ${modeDef().msg}`);
    L.push(`${fmt.b("Nombre:")} ${e(info.name)}`);
    if (info.phone) L.push(`${fmt.b("Teléfono:")} ${e(info.phone)}`);
    if (info.mode === "delivery") {
      L.push(`${fmt.b("Dirección:")} ${e(info.address)}, ${e(info.colonia)}`);
      if (info.refs) L.push(`${fmt.b("Referencias:")} ${e(info.refs)}`);
    } else {
      L.push(`${fmt.b("En:")} ${e(CONFIG.direccionTienda)}`);
    }
    L.push(`${fmt.b(info.mode === "delivery" ? "Hora:" : "Llegada:")} ${info.when === "Programado" ? e(info.time) : "Lo antes posible"}`);

    L.push(sep);
    const p = payDef();
    L.push(`${fmt.b("PAGO:")} ${p ? e(p.nombre) : "-"}`);
    if (p && p.cash && info.cash) {
      const diff = parseFloat(info.cash) - total();
      L.push(`${fmt.b("Paga con:")} ${money(parseFloat(info.cash))}${diff >= 0 ? ` · Cambio: ${money(diff)}` : ""}`);
    }
    L.push(fmt.i("El pago se realiza al recibir el pedido, no en la página."));

    return L.join("\n");
  }

  function waUrl(folio) {
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(buildMessage(folio))}`;
  }

  function sendOrder() {
    readForm();
    if (!validate(1) || !validate(2) || !validate(3)) return;

    const folio = "#" + String(Date.now()).slice(-5);
    const url = waUrl(folio);

    $("#done-link").href = url;
    window.open(url, "_blank", "noopener");
    closeModal("#checkout");
    openModal("#done");
    cart = [];
    save();
    syncCart();
  }

  /* ---------------- Modales / utilidades ---------------- */
  function openModal(sel) {
    $(sel).hidden = false;
    document.body.classList.add("modal-open");
  }
  function closeModal(sel) {
    $(sel).hidden = true;
    if (!$$(".modal:not([hidden])").length) document.body.classList.remove("modal-open");
  }

  let toastTimer;
  function toast(msg) {
    let t = $("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------------- Eventos ---------------- */
  function bind() {
    const nav = $(".nav");
    window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 8), { passive: true });

    // Abrir carrito
    $$("[data-open-cart]").forEach((b) => b.addEventListener("click", openCheckout));

    // Modal producto
    $$("[data-close-product]").forEach((b) => b.addEventListener("click", () => closeModal("#product-modal")));
    $("#p-minus").addEventListener("click", () => { if (draft && draft.qty > (draft.editKey ? 0 : 1)) { draft.qty--; $("#p-qty").textContent = draft.qty; updateAddBtn(); } });
    $("#p-plus").addEventListener("click", () => { if (draft) { draft.qty++; $("#p-qty").textContent = draft.qty; updateAddBtn(); } });
    $("#p-add").addEventListener("click", addDraftToCart);

    // Checkout
    $$("[data-close-checkout]").forEach((b) => b.addEventListener("click", () => { readForm(); closeModal("#checkout"); }));
    $$("[data-close-done]").forEach((b) => b.addEventListener("click", () => closeModal("#done")));
    $("#co-next").addEventListener("click", () => { readForm(); if (validate(step)) goStep(step + 1); });
    $("#co-prev").addEventListener("click", () => { readForm(); goStep(Math.max(1, step - 1)); });
    $("#co-back").addEventListener("click", () => { readForm(); goStep(Math.max(1, step - 1)); });
    $("#co-send").addEventListener("click", sendOrder);

    // Cantidades dentro del carrito
    $("#cart-lines").addEventListener("click", (e) => {
      const btn = e.target.closest(".qty-btn");
      if (!btn) return;
      const key = e.target.closest(".line").dataset.key;
      const line = cart.find((l) => l.key === key);
      if (!line) return;
      if (btn.dataset.act === "plus") line.qty++;
      else line.qty--;
      if (line.qty <= 0) cart = cart.filter((l) => l !== line);
      save();
      syncCart();
      if (!cart.length && step > 1) goStep(1);
    });

    // Formulario
    $$('input[name="mode"]').forEach((r) => r.addEventListener("change", () => {
      info.mode = r.value;
      save();
      applyMode();
    }));
    $("#f-when").addEventListener("change", (e) => { $("#f-time-wrap").hidden = e.target.value !== "Programado"; });
    $("#pay-list").addEventListener("change", (e) => {
      const r = e.target.closest('input[name="pay"]');
      if (!r) return;
      info.pay = r.value;
      save();
      updateCashField();
      $("#err-3").hidden = true;
    });
    $("#f-cash").addEventListener("input", () => { info.cash = $("#f-cash").value; showChange(); });

    // Escape cierra el modal de arriba
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const open = $$(".modal:not([hidden])").pop();
      if (open) closeModal("#" + open.id);
    });

    $("#year").textContent = new Date().getFullYear();
  }

  /* ---------------- Init ---------------- */
  renderStore();
  renderOpenStatus();
  setInterval(renderOpenStatus, 30000);
  renderCatalog();
  bind();
  syncCart();
})();

(() => {
  const $ = (sel, el = document) => el.querySelector(sel);

  // Approximate colours used for the little stone swatches.
  const STONE_COLORS = {
    "Rose Quartz": "#f1c9cc", "Moonstone": "#eef0f2", "Rainbow Moonstone": "#e4e8f0", "Unakite": "#8f7b5a",
    "Clear Quartz": "#f7f7f7", "Howlite": "#f2f1ee", "Amazonite": "#86c7c2", "Labradorite": "#6f7a7f",
    "Amethyst": "#7e5ba0", "Tiger's Eye": "#8a5a24", "Red Jasper": "#a8372a", "Sunstone": "#e99068",
    "Fluorite": "#8a7cae", "Carnelian": "#c9501f", "Lapis Lazuli": "#2f3f8f", "Smoky Quartz": "#6b6058",
    "Black Obsidian": "#1c1c1e", "Black Tourmaline": "#222224", "Turquoise": "#45b0b4", "Citrine": "#e9b544",
    "Selenite": "#f4f3f0", "Hematite": "#5a5b5f", "Pyrite": "#8a8060", "Bloodstone": "#3f5446",
    "Serpentine": "#7a8445", "Sodalite": "#34498f", "Lepidolite": "#a48bb8", "Moss Agate": "#3e6a4e",
    "Green Aventurine": "#5f9e7c", "Kunzite": "#cdb3dc", "Prehnite": "#b9c7a0", "Rudraksha": "#8a4a26",
    "Opal": "#eef0f4",
  };
  const SIZES = ["Small (15 cm)", "Medium (17 cm)", "Large (19 cm)"];
  const CART_KEY = "jagat-cart";

  const money = n => new Intl.NumberFormat(STORE.locale, {
    style: "currency", currency: STORE.currency, maximumFractionDigits: 0,
  }).format(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const swatch = s => `<span class="swatch" style="background:${STONE_COLORS[s] || "#ccc"}" title="${esc(s)}"></span>`;
  const byId = id => PRODUCTS.find(p => p.id === id);

  // ---------- Cart state ----------
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { cart = []; }
  cart = cart.filter(l => byId(l.id));
  const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} };

  function addToCart(id, size = SIZES[1], qty = 1) {
    const line = cart.find(l => l.id === id && l.size === size);
    if (line) line.qty += qty; else cart.push({ id, size, qty });
    save(); renderCart(); bumpCount();
    toast(`Added “${byId(id).name}” to cart`);
  }
  const subtotal = () => cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);
  const shipping = () => (cart.length === 0 || subtotal() >= STORE.freeShippingOver ? 0 : STORE.shippingFee);
  const itemCount = () => cart.reduce((s, l) => s + l.qty, 0);

  // ---------- Product grid ----------
  const tags = ["All", ...new Set(PRODUCTS.map(p => p.tag))];
  let activeTag = "All";

  function renderFilters() {
    $("#filters").innerHTML = tags.map(t =>
      `<button role="tab" aria-selected="${t === activeTag}" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
  }

  function renderGrid() {
    const list = activeTag === "All" ? PRODUCTS : PRODUCTS.filter(p => p.tag === activeTag);
    $("#grid").innerHTML = list.map(p => `
      <article class="card">
        <button class="card-img" data-view="${p.id}" aria-label="View ${esc(p.name)}">
          <img src="${p.image}" alt="${esc(p.name)} bracelet" loading="lazy" width="600" height="600">
          <span class="card-num">${p.id}</span>
        </button>
        <div class="card-body">
          <h3 data-view="${p.id}">${esc(p.name)}</h3>
          <div class="swatches">${p.stones.map(swatch).join("")}</div>
          <p class="stones-line">${p.stones.map(esc).join(" · ")}</p>
          <div class="card-foot">
            <span class="price">${money(p.price)}</span>
            <button class="add-btn" data-add="${p.id}">Add to cart</button>
          </div>
        </div>
      </article>`).join("");
  }

  $("#filters").addEventListener("click", e => {
    const b = e.target.closest("[data-tag]");
    if (!b) return;
    activeTag = b.dataset.tag;
    renderFilters(); renderGrid();
  });
  $("#grid").addEventListener("click", e => {
    const add = e.target.closest("[data-add]");
    if (add) return addToCart(+add.dataset.add);
    const view = e.target.closest("[data-view]");
    if (view) openProduct(+view.dataset.view);
  });

  // ---------- Product dialog ----------
  const dialog = $("#product-dialog");
  function openProduct(id) {
    const p = byId(id);
    $("#product-detail").innerHTML = `
      <div class="detail">
        <img src="${p.image}" alt="${esc(p.name)} bracelet">
        <div class="detail-info">
          <p class="eyebrow">No. ${p.id} · ${esc(p.tag)}</p>
          <h2>${esc(p.name)}</h2>
          <span class="price">${money(p.price)}</span>
          <p class="blurb">${esc(p.blurb)}</p>
          <ul class="stone-list">
            ${p.stones.map(s => `<li>${swatch(s)}<div><b>${esc(s)}</b><small>${esc(STONES[s] || "")}</small></div></li>`).join("")}
          </ul>
          <form id="detail-form">
            <div class="size-row" role="radiogroup" aria-label="Wrist size">
              <p class="size-label">Wrist size</p>
              ${SIZES.map((s, i) => `<label><input type="radio" name="size" value="${s}" ${i === 1 ? "checked" : ""}><span>${s}</span></label>`).join("")}
            </div>
            <button class="btn block" type="submit">Add to cart · ${money(p.price)}</button>
            <p class="size-hint">Not sure? Wrap a string around your wrist and add 1–2 cm. Includes silver lotus charm.</p>
          </form>
        </div>
      </div>`;
    $("#detail-form").addEventListener("submit", e => {
      e.preventDefault();
      addToCart(p.id, new FormData(e.target).get("size"));
      dialog.close();
    });
    dialog.showModal();
  }
  dialog.addEventListener("click", e => {
    if (e.target === dialog || e.target.closest("[data-close]")) dialog.close();
  });

  // ---------- Cart drawer ----------
  const drawer = $("#drawer"), overlay = $("#overlay");
  let step = "cart"; // cart | checkout | done

  function openCart() {
    step = cart.length ? step === "done" ? "cart" : step : "cart";
    renderCart();
    overlay.hidden = false;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeCart() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (step === "done") step = "cart";
  }
  $("#cart-open").addEventListener("click", openCart);
  $("#cart-close").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) closeCart(); });

  function totalsHtml() {
    const sub = subtotal(), ship = shipping();
    const left = STORE.freeShippingOver - sub;
    return `
      ${left > 0 ? `<p class="ship-note">Add ${money(left)} more for free shipping</p>` : `<p class="ship-note">You've unlocked free shipping ✓</p>`}
      <div class="totals">
        <span>Subtotal</span><span>${money(sub)}</span>
        <span>Shipping</span><span>${ship ? money(ship) : "Free"}</span>
        <span class="grand">Total</span><span class="grand">${money(sub + ship)}</span>
      </div>`;
  }

  function renderCart() {
    $("#cart-count").textContent = itemCount();
    const body = $("#drawer-body"), foot = $("#drawer-foot");

    if (step === "done") return;

    if (!cart.length) {
      $("#drawer-title").textContent = "Your cart";
      body.innerHTML = `<div class="empty"><p>Your cart is empty.</p><button class="btn ghost" id="keep-shopping">Browse bracelets</button></div>`;
      foot.innerHTML = "";
      $("#keep-shopping").onclick = () => { closeCart(); location.hash = "shop"; };
      return;
    }

    if (step === "checkout") return renderCheckout();

    $("#drawer-title").textContent = "Your cart";
    body.innerHTML = cart.map((l, i) => {
      const p = byId(l.id);
      return `
        <div class="line">
          <img src="${p.image}" alt="">
          <div>
            <h4>${esc(p.name)}</h4>
            <small>${esc(l.size)}</small><br>
            <div class="qty">
              <button data-dec="${i}" aria-label="Decrease quantity">−</button>
              <span>${l.qty}</span>
              <button data-inc="${i}" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="line-right">
            <span>${money(p.price * l.qty)}</span>
            <button class="remove" data-remove="${i}">Remove</button>
          </div>
        </div>`;
    }).join("");
    foot.innerHTML = `${totalsHtml()}<button class="btn block" id="to-checkout">Checkout</button>`;
    $("#to-checkout").onclick = () => { step = "checkout"; renderCart(); };
  }

  $("#drawer-body").addEventListener("click", e => {
    const t = e.target;
    if (t.dataset.inc) cart[+t.dataset.inc].qty++;
    else if (t.dataset.dec) { const l = cart[+t.dataset.dec]; if (--l.qty < 1) cart.splice(+t.dataset.dec, 1); }
    else if (t.dataset.remove) cart.splice(+t.dataset.remove, 1);
    else return;
    save(); renderCart();
  });

  function renderCheckout() {
    $("#drawer-title").textContent = "Checkout";
    $("#drawer-body").innerHTML = `
      <button class="back-link" id="back-to-cart">← Back to cart</button>
      <form class="checkout-form" id="checkout-form">
        <label>Full name<input name="name" required autocomplete="name"></label>
        <div class="row2">
          <label>Phone<input name="phone" type="tel" required autocomplete="tel"></label>
          <label>Email<input name="email" type="email" autocomplete="email"></label>
        </div>
        <label>Address<textarea name="address" rows="2" required autocomplete="street-address"></textarea></label>
        <div class="row2">
          <label>City<input name="city" required autocomplete="address-level2"></label>
          <label>PIN / Postcode<input name="zip" required autocomplete="postal-code"></label>
        </div>
        <label>Payment
          <select name="payment">
            <option>UPI / Online payment link</option>
            <option>Cash on delivery</option>
          </select>
        </label>
        <label>Gift note (optional)<textarea name="note" rows="2"></textarea></label>
      </form>`;
    $("#drawer-foot").innerHTML = `${totalsHtml()}<button class="btn block" type="submit" form="checkout-form">Place order</button>`;
    $("#back-to-cart").onclick = () => { step = "cart"; renderCart(); };
    $("#checkout-form").addEventListener("submit", placeOrder);
  }

  function placeOrder(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const orderId = "JG" + Date.now().toString(36).toUpperCase().slice(-6);
    const lines = cart.map(l => {
      const p = byId(l.id);
      return `• ${l.qty} × #${p.id} ${p.name} (${l.size}) — ${money(p.price * l.qty)}`;
    });
    const sub = subtotal(), ship = shipping();
    const message = [
      `New order ${orderId}`, "", ...lines, "",
      `Subtotal: ${money(sub)}`, `Shipping: ${ship ? money(ship) : "Free"}`, `Total: ${money(sub + ship)}`, "",
      `Name: ${f.name}`, `Phone: ${f.phone}`, f.email ? `Email: ${f.email}` : "",
      `Address: ${f.address}, ${f.city} ${f.zip}`, `Payment: ${f.payment}`,
      f.note ? `Gift note: ${f.note}` : "",
    ].filter(x => x !== "").join("\n");

    let sentVia = "";
    if (STORE.whatsappNumber) {
      window.open(`https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
      sentVia = "WhatsApp";
    } else if (STORE.orderEmail) {
      location.href = `mailto:${STORE.orderEmail}?subject=${encodeURIComponent("Order " + orderId)}&body=${encodeURIComponent(message)}`;
      sentVia = "email";
    }

    const total = money(sub + ship);
    cart = []; save();
    step = "done";
    $("#cart-count").textContent = 0;
    $("#drawer-title").textContent = "Thank you";
    $("#drawer-body").innerHTML = `
      <div class="done">
        <svg class="lotus" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10c6 8 6 22 0 32-6-10-6-24 0-32zM32 42c-8-2-16-10-18-22 10 2 16 10 18 22zM32 42c8-2 16-10 18-22-10 2-16 10-18 22zM32 44c-10 2-20-2-26-10 10-2 20 2 26 10zM32 44c10 2 20-2 26-10-10-2-20 2-26 10z"/></svg>
        <h2>Order ${orderId} received</h2>
        <p>Thank you, ${esc(f.name.split(" ")[0])}. Your total is <b>${total}</b>.</p>
        <p>${sentVia
          ? `Your order details were opened in ${sentVia} — please send the message to confirm.`
          : `We'll contact you on ${esc(f.phone)} to confirm your order and payment.`}</p>
      </div>`;
    $("#drawer-foot").innerHTML = `<button class="btn ghost block" id="done-close">Continue shopping</button>`;
    $("#done-close").onclick = closeCart;
  }

  // ---------- Misc ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function bumpCount() {
    const c = $("#cart-count");
    c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  }

  $("#free-ship-amount").textContent = money(STORE.freeShippingOver);
  $("#year").textContent = new Date().getFullYear();
  renderFilters(); renderGrid(); renderCart();
})();

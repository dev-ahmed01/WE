/* Workspace by Emlen · One Person Office redesign · behaviour
   Content that is likely to change (photos, solution cards, locations, prices)
   lives in the data objects at the top of this file. */

const IMG = "../../public/assets/img/";
const WHATSAPP = "919814953954";

/* ---------- editable content ---------- */

// Order matters: the gallery grid on the page opens these by index.
const PHOTOS = [
  { cat: "Private office", src: "img-cd77883f.jpg", alt: "Furnished private office with desk, ergonomic chair and natural light" },
  { cat: "Private office", src: "img-652d6d19.jpg", alt: "Private office with wood panelling and a plant on a shelf" },
  { cat: "Private office", src: "img-58b92861.jpg", alt: "Private office desk with laptop, mug and plant" },
  { cat: "Private office", src: "img-2444ee6e.jpg", alt: "Office with framed artwork, desk lamp and glass partition" },
  { cat: "Private office", src: "a-quiet-private-office-workspace-with-desk-and-g-07f0d268.jpg", alt: "Quiet private office with desk and glass partition" },
  { cat: "Private office", src: "a-tidy-serviced-office-interior-with-desk-chair--2d11a7d7.jpg", alt: "Tidy serviced office with desk, chair and plant" },
  { cat: "Private office", src: "one-person-office-dfb5956b.webp", alt: "One person office by a window" },
  { cat: "Common areas", src: "welcome-area-712a74c1.webp", alt: "Reception with warm lighting and indoor plants" },
  { cat: "Common areas", src: "arekere-workspace-f3cbd409.webp", alt: "Glass-walled corridor and lounge seating" },
  { cat: "Common areas", src: "workstations-2d09a12b.jpg", alt: "Open workstations with planters" },
  { cat: "Meeting rooms", src: "meeting-space-dee1cf8a.jpg", alt: "Meeting room with a table for six and glass walls" },
  { cat: "Meeting rooms", src: "private-meeting-room-ca25c712.webp", alt: "Private meeting room with a window" },
  { cat: "Team offices", src: "compact-two-person-furnished-office-behind-glass-e8016693.jpg", alt: "Compact two-person office behind glass partitions" },
  { cat: "Team offices", src: "furnished-small-team-office-with-desk-and-chairs-32edef95.jpg", alt: "Small team office with desks and chairs" },
  { cat: "Community", src: "community-work-17db361c.jpg", alt: "Members chatting in the community area" },
];

// PLACEHOLDER prices: replace "XX,XXX" with real figures before launch.
const HOOK_OFFER = "1 month free on selected plans";
const SOLUTIONS = {
  private: [
    { id: "one", img: "a-quiet-private-office-workspace-with-desk-and-g-07f0d268.jpg", seats: "1 seat", title: "One person office",
      desc: "A quiet, move-in-ready office designed for focused solo work.",
      points: ["Fully furnished private office", "Lockable, with natural light", "Wi-Fi and housekeeping on selected plans"],
      price: "XX,XXX", unit: "/ month", hook: HOOK_OFFER },
    { id: "small", img: "compact-two-person-furnished-office-behind-glass-e8016693.jpg", seats: "2 to 6 seats", title: "Small team office",
      desc: "A practical private office for a growing team that needs room to collaborate.",
      points: ["Space for desks and a small table", "Glass-fronted, bright and private", "Add seats as you grow"],
      price: "XX,XXX", unit: "/ month", hook: HOOK_OFFER },
    { id: "large", img: "img-2444ee6e.jpg", seats: "7 to 20 seats", title: "Large team office",
      desc: "A larger private suite for established teams that want their own space.",
      points: ["Dedicated suite for your team", "Meeting room access", "Layout planned with our team"],
      price: "XX,XXX", unit: "/ month", hook: HOOK_OFFER },
    { id: "floor", img: "arekere-workspace-f3cbd409.webp", seats: "20+ seats", title: "Full floor office",
      desc: "An entire floor, set up around the way your business works.",
      points: ["Whole-floor privacy", "Custom layout and branding", "On-ground support team"],
      price: "On request", unit: "", hook: "Talk to us about move-in offers" },
  ],
  coworking: [
    { id: "dedicated", img: "workstations-2d09a12b.jpg", seats: "1 seat", title: "Dedicated desk",
      desc: "Your own desk in a shared space, kept ready for you every day.",
      points: ["Same desk, every day", "Storage for your things", "Community and meeting room access"],
      price: "X,XXX", unit: "/ seat / month", hook: "Upgrade to a private office anytime" },
    { id: "flexi", img: "community-work-17db361c.jpg", seats: "1 seat", title: "Flexi desk",
      desc: "Pick any open desk on the days you come in.",
      points: ["Sit anywhere in the shared area", "Wi-Fi and pantry included", "Good for part-time and hybrid work"],
      price: "X,XXX", unit: "/ seat / month", hook: "Try a day pass first" },
    { id: "team-desks", img: "welcome-area-712a74c1.webp", seats: "2 to 10 seats", title: "Team desks",
      desc: "A block of desks for a small team that likes an open, social setting.",
      points: ["Desks grouped together", "Shared meeting rooms", "Scale seats up or down"],
      price: "X,XXX", unit: "/ seat / month", hook: "Ask about team pricing" },
  ],
  meeting: [
    { id: "meet", img: "meeting-space-dee1cf8a.jpg", seats: "4 to 6 people", title: "Meeting room",
      desc: "A glass-walled room for client calls, interviews and team catch-ups.",
      points: ["Display and video-call ready", "Wi-Fi and refreshments", "Book by the hour"],
      price: "XXX", unit: "/ hour", hook: "Free hours with a private office" },
    { id: "board", img: "private-meeting-room-ca25c712.webp", seats: "8 to 12 people", title: "Boardroom",
      desc: "A polished room for presentations and decisions that matter.",
      points: ["Seats up to 12", "Presentation display", "Reception support"],
      price: "X,XXX", unit: "/ half day", hook: "Member rates available" },
    { id: "train", img: "illustrative-meeting-room-and-desks-for-bannergh-01ee47c1.jpg", seats: "15+ people", title: "Training room",
      desc: "A flexible room for workshops, training and team days.",
      points: ["Flexible seating layouts", "Presentation display", "Catering on request"],
      price: "X,XXX", unit: "/ half day", hook: "Ask about full-day rates" },
  ],
  additional: [
    { id: "virtual", img: "welcome-area-712a74c1.webp", seats: "No desk needed", title: "Virtual office",
      desc: "A professional business address and support, without a daily desk.",
      points: ["Business address in South Bengaluru", "Mail and call handling", "Meeting room access when needed"],
      price: "X,XXX", unit: "/ month", hook: "Add a desk whenever you need one" },
    { id: "event", img: "community-work-17db361c.jpg", seats: "Events and workshops", title: "Event space",
      desc: "A welcoming space for launches, workshops and community meetups.",
      points: ["Flexible layouts", "Presentation display", "Hosting support from our team"],
      price: "On request", unit: "", hook: "Tell us your date and group size" },
    { id: "daypass", img: "workstations-2d09a12b.jpg", seats: "1 seat", title: "Day pass",
      desc: "Try the space for a day, with a desk, Wi-Fi and the full community feel.",
      points: ["Any open desk for the day", "Wi-Fi and pantry access", "Book on the day you need it"],
      price: "XXX", unit: "/ day", hook: "Day pass credited if you join" },
  ],
};

// Landmarks are indicative: confirm against each building.
const LOCATIONS = [
  { name: "Jayanagar", query: "Workspace by Emlen Jayanagar Bengaluru", note: "Close to the main road, yet quiet inside.", marks: ["Jayanagar 4th Block", "Lalbagh Botanical Garden", "Jayanagar Metro"] },
  { name: "JP Nagar", query: "Workspace by Emlen JP Nagar Bengaluru", note: "Well connected for South Bengaluru teams.", marks: ["JP Nagar Metro", "Sarakki Lake", "Brigade Millennium"] },
  { name: "Bannerghatta Road", query: "Workspace by Emlen Bannerghatta Road Bengaluru", note: "On one of the city's busiest business corridors.", marks: ["Meenakshi Mall", "Jayadeva Hospital", "IIM Bangalore"] },
  { name: "Arekere", query: "Workspace by Emlen Arekere Bengaluru", note: "A calm base with easy access to Bannerghatta Road.", marks: ["Arekere Gate", "IIM Bangalore", "Bannerghatta Road"] },
];

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const icon = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

/* ---------- navigation ---------- */
(() => {
  const toggle = $(".nav__toggle");
  const panel = $("#navPanel");
  const setOpen = (open) => {
    panel.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    toggle.firstElementChild.firstElementChild.setAttribute("href", open ? "#i-close" : "#i-menu");
  };
  toggle.addEventListener("click", () => setOpen(!panel.classList.contains("is-open")));
  panel.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
})();

/* ---------- highlight cards: cursor glow ---------- */
$$(".hl").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* ---------- solutions ---------- */
const solCard = (s) => `
  <article class="sol" id="sol-${s.id}">
    <div class="sol__media">
      <img src="${IMG}${s.img}" alt="" loading="lazy">
      <span class="pill pill--glass">${s.seats}</span>
    </div>
    <div class="sol__body">
      <h3 class="t-card">${s.title}</h3>
      <p class="t-body">${s.desc}</p>
      <ul class="sol__list">${s.points.map((p) => `<li>${icon("i-check")}<span>${p}</span></li>`).join("")}</ul>
      <div class="sol__price">
        <div class="price"><small>${s.unit ? "From" : ""}</small><strong>${s.unit ? "₹" : ""}${s.price}</strong><em>${s.unit}</em></div>
        <span class="hook">${icon("i-gift")}${s.hook}</span>
        <a class="btn btn--icon btn--block" href="#enquiry" data-interest="${s.title}" style="justify-content:space-between">Enquire now <span class="btn__ico">${icon("i-arrow-ur")}</span></a>
      </div>
    </div>
  </article>`;

Object.entries(SOLUTIONS).forEach(([key, list]) => {
  $(`#panel-${key}`).innerHTML = `<div class="solutions__grid" data-count="${list.length}">${list.map(solCard).join("")}</div>`;
});

const tabs = $$(".solutions__menu [role=tab]");
const pills = $$(".cats .pill");
const activateTab = (key, { focusCard, focusTab } = {}) => {
  tabs.forEach((t) => {
    const on = t.dataset.tab === key;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    $(`#panel-${t.dataset.tab}`).hidden = !on;
    if (on && focusTab) t.focus();
  });
  pills.forEach((p) => {
    const on = p.dataset.tab === key && (!p.dataset.focus || p.dataset.focus === focusCard);
    p.classList.toggle("pill--solid", on);
    p.classList.toggle("pill--glass", !on);
    on ? p.setAttribute("aria-current", "page") : p.removeAttribute("aria-current");
  });
  if (focusCard) {
    const card = $(`#sol-${focusCard}`);
    if (card) {
      card.animate([{ boxShadow: "0 0 0 0 rgba(255,185,0,.0)" }, { boxShadow: "0 0 0 6px rgba(255,185,0,.9)" }, { boxShadow: "0 0 0 0 rgba(255,185,0,0)" }], { duration: 1400, delay: 500 });
    }
  }
};
tabs.forEach((t, i) => {
  t.addEventListener("click", () => activateTab(t.dataset.tab));
  t.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    activateTab(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, { focusTab: true });
  });
});
pills.forEach((p) => p.addEventListener("click", () => activateTab(p.dataset.tab, { focusCard: p.dataset.focus })));

/* enquire buttons pre-select the option in the form */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-interest]");
  if (!b) return;
  const sel = $("#f-type");
  const opt = [...sel.options].find((o) => o.text.toLowerCase() === b.dataset.interest.toLowerCase());
  if (opt) sel.value = opt.value || opt.text;
});

/* ---------- locations + map ---------- */
const locList = $("#locList");
locList.innerHTML = LOCATIONS.map((l, i) => `
  <button class="loc" type="button" data-i="${i}" aria-pressed="${i === 0}">
    <span class="loc__top">
      <span class="loc__name"><span class="loc__pin">${icon("i-pin")}</span><span class="t-card">${l.name}</span></span>
      <svg class="loc__arrow" aria-hidden="true"><use href="#i-arrow-r"/></svg>
    </span>
    <ul class="loc__marks" aria-label="Nearby landmarks">${l.marks.map((m) => `<li>${m}</li>`).join("")}</ul>
  </button>`).join("") + `
  <div class="loc-cta">
    <h3 class="t-card">Looking for a different location?</h3>
    <p class="t-body">Tell us your preferred area and we'll help you find the right office space.</p>
    <a class="btn btn--secondary" href="#enquiry">Enquire now</a>
  </div>`;
const setLoc = (i) => {
  const l = LOCATIONS[i];
  $$(".loc").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.i) === i)));
  $("#mapName").textContent = l.name;
  $("#mapNote").textContent = l.note;
  $("#mapLink").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.query)}`;
  const frame = $("#mapFrame");
  if (frame) frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(l.query)}&z=15&output=embed`;
};
locList.addEventListener("click", (e) => { const b = e.target.closest(".loc"); if (b) setLoc(Number(b.dataset.i)); });
setLoc(0);

/* ---------- testimonials carousel ---------- */
(() => {
  const slides = $$(".quote__slide");
  const dots = $("#quoteDots");
  let cur = 0;
  dots.innerHTML = slides.map((_, i) => `<button type="button" aria-label="Show testimonial ${i + 1}"></button>`).join("");
  const go = (n) => {
    cur = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === cur));
    $$("button", dots).forEach((b, i) => b.setAttribute("aria-current", String(i === cur)));
  };
  dots.addEventListener("click", (e) => { const i = $$("button", dots).indexOf(e.target.closest("button")); if (i > -1) go(i); });
  $$("[data-q]").forEach((b) => b.addEventListener("click", () => go(cur + Number(b.dataset.q))));
  go(0);
})();

/* ---------- enquiry form (WhatsApp hand-off, same as the live site) ---------- */
$("#enquiryForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = (f.get("name") || "").trim();
  const phone = (f.get("phone") || "").trim();
  const note = $("#formNote");
  if (!name || phone.replace(/\D/g, "").length < 8) {
    note.textContent = "Please add your name and a valid phone number.";
    note.style.color = "var(--red-deep)";
    note.style.fontWeight = "600";
    return;
  }
  note.style.color = ""; note.style.fontWeight = "";
  note.textContent = "Opening WhatsApp with your enquiry ready to review and send.";
  const lines = [
    "Hi Workspace by Emlen, I'd like a callback.",
    `Name: ${name}`, `Phone: ${phone}`,
    f.get("email") && `Email: ${f.get("email")}`,
    f.get("location") && `Location: ${f.get("location")}`,
    `Interested in: ${f.get("type")}`,
    f.get("timeline") && `Move-in: ${f.get("timeline")}`,
    f.get("message") && `Note: ${f.get("message")}`,
    "Source: One Person Office page",
  ].filter(Boolean);
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
  // Some embedded viewers block pop-ups, so always leave a plain link as well.
  note.innerHTML = `Your enquiry is ready. <a class="link" href="${url}" target="_blank" rel="noopener">Send it on WhatsApp</a>`;
  window.open(url, "_blank", "noopener");
});

/* ---------- dialogs ---------- */
const backdropClose = (dlg) => dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
$$("dialog").forEach((d) => {
  backdropClose(d);
  $$("[data-close]", d).forEach((b) => b.addEventListener("click", () => d.close()));
});

const amDialog = $("#amDialog");
$("[data-open-amenities]").addEventListener("click", () => amDialog.showModal());

/* ---------- lightbox ---------- */
(() => {
  const dlg = $("#lightbox");
  const img = $("#lbImg"), cap = $("#lbCap"), thumbs = $("#lbThumbs"), tabsEl = $("#lbTabs");
  const cats = ["All", ...new Set(PHOTOS.map((p) => p.cat))];
  let cat = "All", list = PHOTOS, cur = 0;

  $$(".shot--more .pill").forEach((p) => (p.textContent = `View all ${PHOTOS.length} photos`));

  tabsEl.innerHTML = cats.map((c) => `<button class="pill pill--glass" role="tab" type="button" data-cat="${c}" aria-selected="${c === "All"}">${c}</button>`).join("");

  const show = (n) => {
    cur = (n + list.length) % list.length;
    const p = list[cur];
    img.src = IMG + p.src; img.alt = p.alt;
    cap.textContent = `${p.cat} · ${cur + 1} / ${list.length}`;
    $$("button", thumbs).forEach((b, i) => b.setAttribute("aria-current", String(i === cur)));
    $$("button", thumbs)[cur]?.scrollIntoView({ inline: "center", block: "nearest" });
  };
  const setCat = (c, start = 0) => {
    cat = c;
    list = c === "All" ? PHOTOS : PHOTOS.filter((p) => p.cat === c);
    $$("button", tabsEl).forEach((b) => b.setAttribute("aria-selected", String(b.dataset.cat === c)));
    thumbs.innerHTML = list.map((p, i) => `<button type="button" aria-label="Photo ${i + 1}: ${p.cat}"><img src="${IMG + p.src}" alt=""></button>`).join("");
    show(start);
  };
  tabsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) setCat(b.dataset.cat); });
  thumbs.addEventListener("click", (e) => { const i = $$("button", thumbs).indexOf(e.target.closest("button")); if (i > -1) show(i); });
  $("#lbPrev").addEventListener("click", () => show(cur - 1));
  $("#lbNext").addEventListener("click", () => show(cur + 1));
  dlg.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  $$("[data-open-lightbox]").forEach((b) => b.addEventListener("click", () => {
    setCat("All", Number(b.dataset.openLightbox));
    dlg.showModal();
  }));
})();

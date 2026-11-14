/* Studio Nove Archi — interazioni del sito */
(function () {
  "use strict";
  // modalità "anteprima" per catture schermo: ?anteprima
  if (/[?&]anteprima/.test(location.search)) {
    document.documentElement.classList.add("na-shot");
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    var qs = new URLSearchParams(location.search);
    var sec = qs.get("sec");
    if (sec) {
      var ab = sec.split("-").map(Number);
      Array.prototype.forEach.call(document.querySelector("main").children, function (c, i) {
        if (i < ab[0] || i > ab[1]) c.style.display = "none";
      });
      if (qs.get("head") !== "1") document.querySelectorAll(".topbar,.header").forEach(function (e) { e.style.display = "none"; });
      if (qs.get("foot") !== "1") document.querySelectorAll(".footer").forEach(function (e) { e.style.display = "none"; });
    }
  }

  /* ---------- Header che cambia allo scroll ---------- */
  var header = document.querySelector(".header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".mobile-menu a").forEach(function (a) {
      a.addEventListener("click", function () { document.body.classList.remove("menu-open"); });
    });
  }

  /* ---------- Animazioni all'ingresso ---------- */
  var reveals = document.querySelectorAll(".reveal");
  function revealVisible() {
    var h = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      if (el.classList.contains("in")) return;
      var r = el.getBoundingClientRect();
      if (r.top < h - 20 && r.bottom > 0) el.classList.add("in");
    });
  }
  revealVisible();
  window.addEventListener("scroll", revealVisible, { passive: true });
  window.addEventListener("resize", revealVisible);
  // rete di sicurezza: nessun contenuto deve restare nascosto
  setTimeout(function () { reveals.forEach(function (el) { el.classList.add("in"); }); }, 4000);
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Contatori numerici ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    if (document.documentElement.classList.contains("na-shot")) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- Aperto ora? (orario di Bologna) ---------- */
  // 0 = domenica ... 6 = sabato ; orari in minuti
  var HOURS = {
    1: [540, 1170], // lunedì 9:00–19:30
    2: [540, 1020], // martedì 9:00–17:00
    3: [540, 1020], // mercoledì 9:00–17:00
    4: [540, 1170], // giovedì 9:00–19:30
    5: [540, 1020]  // venerdì 9:00–17:00
  };
  function romeNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return { day: days[map.weekday], min: parseInt(map.hour, 10) % 24 * 60 + parseInt(map.minute, 10) };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function fmt(m) { return Math.floor(m / 60) + ":" + ("0" + (m % 60)).slice(-2); }
  var now = romeNow();
  var today = HOURS[now.day];
  var isOpen = !!today && now.min >= today[0] && now.min < today[1];
  var label;
  if (isOpen) {
    label = "Aperto ora · chiude alle " + fmt(today[1]);
  } else if (today && now.min < today[0]) {
    label = "Chiuso · apre oggi alle " + fmt(today[0]);
  } else {
    var nd = now.day, i = 0;
    do { nd = (nd + 1) % 7; i++; } while (!HOURS[nd] && i < 7);
    var names = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
    label = "Chiuso · riapre " + (i === 1 ? "domani" : names[nd]) + " alle " + fmt(HOURS[nd][0]);
  }
  window.NA_STATUS = { isOpen: isOpen, label: label };
  document.querySelectorAll("[data-open-status]").forEach(function (el) { el.textContent = label; });
  document.querySelectorAll("[data-open-dot]").forEach(function (el) { el.classList.toggle("on", isOpen); });
  document.querySelectorAll(".hours-table tr[data-day]").forEach(function (tr) {
    if (parseInt(tr.getAttribute("data-day"), 10) === now.day) tr.classList.add("today");
  });

  /* ---------- Selettore "Di cosa hai bisogno?" ---------- */
  document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
    var buttons = wrap.querySelectorAll("[data-filter]");
    var target = document.querySelector(wrap.getAttribute("data-tabs"));
    if (!target) return;
    var cards = target.querySelectorAll("[data-cat]");
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        buttons.forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-pressed", "false"); });
        b.classList.add("active"); b.setAttribute("aria-pressed", "true");
        var f = b.getAttribute("data-filter");
        cards.forEach(function (c) {
          var show = f === "all" || (" " + c.getAttribute("data-cat") + " ").indexOf(" " + f + " ") > -1;
          c.classList.toggle("hidden", !show);
        });
      });
    });
  });

  /* ---------- Modulo contatti: prepara una email per la segreteria ---------- */
  var form = document.querySelector("#contact-form");
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var pre = params.get("servizio");
    var sel = form.querySelector("[name=servizio]");
    if (pre && sel) {
      Array.prototype.forEach.call(sel.options, function (o) { if (o.value === pre) sel.value = pre; });
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var body =
        "Nome: " + d.get("nome") + "\n" +
        "Telefono: " + d.get("telefono") + "\n" +
        "Email: " + d.get("email") + "\n" +
        "Motivo della visita: " + d.get("servizio") + "\n" +
        "Fascia oraria preferita: " + d.get("fascia") + "\n\n" +
        (d.get("messaggio") || "");
      if (document.documentElement.classList.contains("na-preview")) {
        var okp = form.querySelector(".form-ok");
        if (okp) { okp.textContent = "Questa è un'anteprima: il modulo non invia richieste. Nel sito definitivo la richiesta arriverà alla segreteria."; okp.style.display = "block"; }
        return;
      }
      var subject = "Richiesta appuntamento – " + d.get("servizio");
      window.location.href = "mailto:studioassociato@novearchi.it?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var ok = form.querySelector(".form-ok");
      if (ok) ok.style.display = "block";
    });
  }

  /* ---------- Banner cookie ---------- */
  var cookie = document.querySelector(".cookie");
  if (cookie) {
    var seen = false;
    try { seen = localStorage.getItem("na-cookie") === "1"; } catch (e) {}
    if (!seen) cookie.classList.add("show");
    cookie.querySelectorAll("[data-cookie-ok]").forEach(function (b) {
      b.addEventListener("click", function () {
        cookie.classList.remove("show");
        try { localStorage.setItem("na-cookie", "1"); } catch (e) {}
      });
    });
  }

  /* ---------- Barra di avanzamento + header che si nasconde ---------- */
  var bar = document.createElement("div"); bar.className = "progress"; document.body.appendChild(bar);
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    if (header && !document.body.classList.contains("menu-open")) {
      header.classList.toggle("hide", y > lastY && y > 400);
    }
    lastY = y;
  }, { passive: true });

  /* ---------- Leggero parallasse sulla foto della hero ---------- */
  var par = document.querySelector("[data-parallax] img");
  if (par && window.matchMedia("(min-width: 861px)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("scroll", function () {
      var y = Math.min(window.scrollY, 700);
      par.style.transform = "scale(1.08) translateY(" + (y * 0.06) + "px)";
    }, { passive: true });
  }

  /* ---------- Carosello tecnologie (frecce + trascinamento) ---------- */
  document.querySelectorAll("[data-rail]").forEach(function (rail) {
    var wrap = rail.parentElement;
    var step = function () { var c = rail.querySelector(":scope > *"); return c ? c.offsetWidth + 20 : 300; };
    var prev = wrap.querySelector("[data-rail-prev]"), next = wrap.querySelector("[data-rail-next]");
    if (prev) prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
    var down = false, sx = 0, sl = 0;
    rail.addEventListener("mousedown", function (e) { down = true; sx = e.pageX; sl = rail.scrollLeft; rail.classList.add("dragging"); });
    window.addEventListener("mouseup", function () { down = false; rail.classList.remove("dragging"); });
    rail.addEventListener("mousemove", function (e) { if (!down) return; e.preventDefault(); rail.scrollLeft = sl - (e.pageX - sx); });
  });

  /* ---------- Cursore prima/dopo ---------- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var input = ba.querySelector("input[type=range]");
    if (input) input.addEventListener("input", function () { ba.style.setProperty("--pos", input.value + "%"); });
  });

  /* ---------- Anno nel footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

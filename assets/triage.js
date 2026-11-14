/*
 * Orientamento guidato "Hai un problema ai denti?"
 * --------------------------------------------------
 * Strumento informativo: NON fa diagnosi e non dice mai "non serve venire".
 * Funziona interamente nel browser: nessun dato viene salvato o inviato.
 *
 * BOZZA: tutti i testi qui sotto vanno rivisti e approvati dallo studio
 * prima della pubblicazione.
 */
(function () {
  "use strict";

  var PHONE = "+390514212411";
  var PHONE_LABEL = "051 421 2411";

  var LEVELS = {
    urgent:  { label: "Urgente", cls: "lv-urgent" },
    today:   { label: "Oggi stesso", cls: "lv-today" },
    soon:    { label: "Nei prossimi giorni", cls: "lv-soon" },
    routine: { label: "Quando preferisci", cls: "lv-routine" }
  };

  var FLAGS = [
    "Febbre o brividi",
    "Gonfiore che si allarga verso l'occhio, il collo o sotto la mandibola",
    "Difficoltà a deglutire o a respirare",
    "Difficoltà ad aprire la bocca",
    "Sanguinamento abbondante che non si ferma"
  ];

  var N = {
    start: {
      q: "Qual è il problema principale?",
      opts: [
        { l: "Dolore a un dente", i: "⚡", next: "dolore" },
        { l: "Gonfiore della gengiva o del viso", i: "◐", next: "flags", then: "r_gonfiore" },
        { l: "Ho preso un colpo: dente rotto, spostato o caduto", i: "✦", next: "flags_trauma", then: "trauma" },
        { l: "Gengive che sanguinano", i: "◌", next: "gengive" },
        { l: "Si è staccata un'otturazione, una corona o un provvisorio", i: "◇", next: "perso" },
        { l: "Nessun problema: vorrei un controllo o un consiglio estetico", i: "✓", next: "r_controllo" }
      ]
    },

    flags: { check: true, q: "Per sicurezza: noti anche uno di questi segnali?", hint: "Nella grande maggioranza dei casi la risposta è no. Se non ne hai nessuno, premi «Nessuno di questi».", items: FLAGS, ifAny: "r_urgente" },
    flags_trauma: {
      check: true, q: "Per sicurezza: noti anche uno di questi segnali?", hint: "Nella grande maggioranza dei casi la risposta è no. Se non ne hai nessuno, premi «Nessuno di questi».",
      items: ["Colpo alla testa con svenimento, vomito, confusione o forte mal di testa"].concat(FLAGS.slice(2)),
      ifAny: "r_urgente_trauma"
    },

    /* --- Dolore: 4 domande brevi, poi l'indicazione --- */
    dolore: {
      q: "Che tipo di dolore senti?",
      opts: [
        { l: "Forte e pulsante, che non mi dà tregua", set: { tipo: "forte" }, next: "d_quando" },
        { l: "Sordo e continuo, ma sopportabile", set: { tipo: "sordo" }, next: "d_quando" },
        { l: "Una fitta acuta che dura pochi secondi", set: { tipo: "fitta" }, next: "d_quando" },
        { l: "Un fastidio leggero, solo ogni tanto", set: { tipo: "lieve" }, next: "d_quando" }
      ]
    },
    d_quando: {
      q: "Quando lo senti?",
      opts: [
        { l: "Con cibi o bevande fredde, calde o dolci", set: { quando: "termico" }, next: "d_dove" },
        { l: "Quando mastico o premo sul dente", set: { quando: "masticazione" }, next: "d_dove" },
        { l: "Anche da solo, senza fare nulla o di notte", set: { quando: "spontaneo" }, next: "d_dove" }
      ]
    },
    d_dove: {
      q: "Dove si trova?",
      opts: [
        { l: "Su un dente preciso", set: { dove: "dente" }, next: "d_gonfiore" },
        { l: "In fondo alla bocca, dove spunta il dente del giudizio", set: { dove: "giudizio" }, next: "d_gonfiore" },
        { l: "Non riesco a capire quale dente: fa male tutta la zona", set: { dove: "zona" }, next: "d_gonfiore" }
      ]
    },
    d_gonfiore: {
      q: "Noti anche gonfiore della gengiva o della guancia?",
      opts: [
        { l: "No", next: "d_esito" },
        { l: "Sì", next: "flags", then: "r_gonfiore" }
      ]
    },
    d_esito: {
      compute: function (st) {
        if (st.tipo === "forte" || st.quando === "spontaneo") return "r_dolore_forte";
        if (st.dove === "giudizio") return "r_giudizio";
        if (st.quando === "masticazione") return "r_masticazione";
        if (st.quando === "termico" && (st.tipo === "fitta" || st.tipo === "lieve")) return "r_sensibilita";
        return "r_dolore_visita";
      }
    },

    trauma: {
      q: "Cosa è successo al dente?",
      opts: [
        { l: "È uscito completamente dalla bocca", next: "avulso" },
        { l: "Si è rotto o scheggiato", next: "r_rotto" },
        { l: "Si è spostato o si muove", next: "r_spostato" },
        { l: "Nessun danno visibile, ma fa male", next: "r_colpo" }
      ]
    },
    avulso: {
      q: "È un dente da latte o un dente definitivo?",
      opts: [
        { l: "Definitivo (adulto o ragazzo)", next: "r_avulso" },
        { l: "Da latte (bambino piccolo)", next: "r_avulso_latte" },
        { l: "Non lo so", next: "r_avulso" }
      ]
    },

    gengive: {
      q: "Oltre al sanguinamento, noti anche…",
      opts: [
        { l: "Pus, cattivo sapore o gonfiore", next: "r_gonfiore" },
        { l: "Denti che si muovono o gengive che si ritirano", next: "r_paro" },
        { l: "No, sanguinano solo quando lavo i denti", next: "r_gengive" }
      ]
    },

    perso: {
      q: "Cosa si è staccato?",
      opts: [
        { l: "Un'otturazione", next: "r_otturazione" },
        { l: "Una corona, un ponte o una faccetta", next: "r_corona" },
        { l: "Un provvisorio", next: "r_corona" }
      ]
    },

    /* ----------------------- RISULTATI ----------------------- */
    r_urgente: {
      level: "urgent",
      title: "Rivolgiti subito al pronto soccorso o chiama il 118",
      text: "I sintomi che hai indicato possono essere il segno di un'infezione che si sta diffondendo e richiedono una valutazione medica immediata, prima ancora di quella del dentista.",
      todo: ["Non aspettare che la situazione peggiori.", "Quando il quadro è sotto controllo, contattaci per seguire le cure dentali."],
      emergency: true
    },
    r_urgente_trauma: {
      level: "urgent",
      title: "Rivolgiti subito al pronto soccorso o chiama il 118",
      text: "Dopo un colpo, sintomi come svenimento, vomito, confusione o difficoltà a respirare vanno valutati immediatamente in pronto soccorso.",
      todo: ["Se hai recuperato un dente caduto, portalo con te conservato nel latte.", "Appena possibile, contattaci per le cure dentali."],
      emergency: true
    },
    r_gonfiore: {
      level: "today",
      title: "Chiamaci oggi stesso",
      text: "Un gonfiore della gengiva o del viso spesso indica un'infezione (ascesso) e va valutato rapidamente.",
      todo: [
        "Puoi applicare impacchi freddi all'esterno della guancia, a intervalli.",
        "Non applicare caldo e non schiacciare o bucare il gonfiore.",
        "Se il gonfiore aumenta rapidamente o compare febbre alta e lo studio è chiuso, rivolgiti alla guardia medica."
      ],
      call: true, service: "prima-visita"
    },
    r_dolore_forte: {
      level: "today",
      title: "Chiamaci oggi stesso",
      text: "Un dolore forte, continuo o notturno di solito dipende da un'infiammazione del nervo del dente: si cura bene, ma è meglio non aspettare.",
      todo: [
        "Evita cibi molto caldi, freddi o duri sul lato dolente.",
        "Per un antidolorifico, chiedi consiglio al tuo medico o al farmacista.",
        "Non mettere farmaci (ad esempio aspirina) direttamente sulla gengiva.",
        "Se compare gonfiore della guancia o febbre, chiamaci subito."
      ],
      call: true, service: "conservativa-diretta"
    },
    r_masticazione: {
      level: "soon",
      title: "Prenota una visita nei prossimi giorni",
      text: "Il dolore alla masticazione può dipendere da una carie profonda, da una piccola frattura o da un'infiammazione. Meglio non aspettare che peggiori.",
      todo: ["Nel frattempo mastica dal lato opposto.", "Se il dolore diventa continuo o compare gonfiore, chiamaci subito."],
      service: "conservativa-diretta"
    },
    r_dolore_visita: {
      level: "soon",
      title: "Prenota una visita nei prossimi giorni",
      text: "Un dolore sopportabile ma persistente va comunque controllato: individuarne presto la causa rende la cura più semplice.",
      todo: ["Evita di masticare cibi duri dal lato dolente.", "Se il dolore diventa forte o continuo, chiamaci prima."],
      service: "conservativa-diretta"
    },
    r_sensibilita: {
      level: "soon",
      title: "Prenota una visita",
      text: "Una fitta breve al freddo o al dolce può dipendere da una carie iniziale, da colletti scoperti o da smalto consumato. Spesso si risolve con interventi semplici.",
      todo: ["Usa uno spazzolino morbido e non spazzolare con forza.", "Se il dolore dura più a lungo o diventa spontaneo, anticipa la visita."],
      service: "conservativa-diretta"
    },
    r_giudizio: {
      level: "soon",
      title: "Prenota una visita a breve",
      text: "Il dolore nella zona del dente del giudizio è frequente. Con una radiografia valuteremo la posizione del dente e se è il caso di intervenire.",
      todo: ["Mantieni pulita la zona con delicatezza.", "Se compare gonfiore, febbre o fatica ad aprire la bocca, chiamaci subito."],
      service: "chirurgia-orale"
    },
    r_avulso: {
      level: "today",
      title: "Chiamaci subito: ogni minuto conta",
      text: "Un dente definitivo uscito dalla bocca può essere salvato, soprattutto se viene rimesso in sede il prima possibile.",
      todo: [
        "Prendi il dente dalla corona (la parte bianca), senza toccare la radice.",
        "Se è sporco, sciacqualo pochi secondi con acqua fredda, senza strofinarlo.",
        "Se ci riesci, rimettilo delicatamente al suo posto e mordi un fazzoletto pulito.",
        "Altrimenti conservalo nel latte e vieni subito: le possibilità migliori sono entro la prima ora.",
        "Se lo studio è chiuso, vai al pronto soccorso portando il dente."
      ],
      call: true, service: "chirurgia-orale"
    },
    r_avulso_latte: {
      level: "today",
      title: "Chiamaci oggi",
      text: "I denti da latte non vanno rimessi in sede, per non danneggiare il dente definitivo che si sta formando sotto.",
      todo: ["Conserva il dente e portalo con te.", "Controlleremo che il dente definitivo sottostante non abbia subito danni."],
      call: true, service: "prima-visita"
    },
    r_rotto: {
      level: "today",
      title: "Chiamaci oggi o entro 24 ore",
      text: "Un dente rotto o scheggiato va valutato presto: spesso il frammento può essere riattaccato.",
      todo: [
        "Se trovi il frammento, conservalo nel latte o in acqua.",
        "Sciacqua la bocca con acqua.",
        "Se vedi un puntino rosso al centro del dente o il dolore è forte, chiamaci subito."
      ],
      call: true, service: "conservativa-diretta"
    },
    r_spostato: {
      level: "today",
      title: "Chiamaci oggi stesso",
      text: "Un dente spostato o mobile dopo un colpo deve essere riposizionato e stabilizzato il prima possibile.",
      todo: ["Non cercare di muovere il dente.", "Mangia cibi morbidi e mordi con delicatezza."],
      call: true, service: "prima-visita"
    },
    r_colpo: {
      level: "soon",
      title: "Prenota un controllo nei prossimi giorni",
      text: "Anche senza danni visibili, un colpo può interessare il nervo del dente. Un controllo, se necessario con radiografia, permette di verificarlo.",
      todo: ["Se il dente cambia colore o il dolore aumenta, contattaci prima."],
      service: "prima-visita"
    },
    r_paro: {
      level: "soon",
      title: "Prenota una visita nelle prossime settimane",
      text: "Gengive che sanguinano insieme a denti mobili o gengive che si ritirano possono essere segni di malattia parodontale (piorrea). Prima si interviene, migliori sono i risultati.",
      todo: ["Continua a lavare i denti con delicatezza, senza saltare le zone che sanguinano."],
      service: "parodontologia"
    },
    r_gengive: {
      level: "routine",
      title: "Prenota una seduta di igiene e un controllo",
      text: "Il sanguinamento durante lo spazzolamento è spesso un segno di infiammazione delle gengive dovuta alla placca. Una seduta di igiene professionale e le giuste tecniche a casa di solito aiutano molto.",
      todo: ["Non smettere di lavare i denti nelle zone che sanguinano: usa uno spazzolino morbido.", "Se il sanguinamento è abbondante o non si ferma, chiamaci."],
      service: "igiene-orale"
    },
    r_otturazione: {
      level: "soon",
      title: "Prenota una visita nei prossimi giorni",
      text: "Senza otturazione il dente è più esposto a carie e fratture: è bene ripararlo presto.",
      todo: ["Evita di masticare da quel lato e i cibi molto duri o appiccicosi.", "Se compare dolore forte, chiamaci oggi."],
      service: "conservativa-diretta"
    },
    r_corona: {
      level: "soon",
      title: "Prenota una visita nei prossimi giorni",
      text: "Una corona, un ponte, una faccetta o un provvisorio staccati vanno ricementati presto, per proteggere il dente sottostante.",
      todo: [
        "Conserva il pezzo in un contenitore pulito e portalo con te.",
        "Non incollarlo con colle domestiche.",
        "Evita di masticare da quel lato. Se c'è dolore forte, chiamaci oggi."
      ],
      service: "protesi-fissa"
    },
    r_controllo: {
      level: "routine",
      title: "Prenota una visita di controllo",
      text: "Un controllo periodico è il modo migliore per prevenire i problemi o per valutare insieme un trattamento estetico.",
      todo: ["Puoi prenotare per te o per tutta la famiglia.", "Scopri anche i nostri piani di prevenzione."],
      service: "prima-visita",
      links: [["Igiene e prevenzione", "servizi/igiene-orale.html"], ["Estetica del sorriso", "servizi/faccette.html"], ["Piani fedeltà", "piani-fedelta.html"]]
    }
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function init(box) {
    var root = box.getAttribute("data-root") || "";
    var history = [];
    var pending = null; // nodo successivo dopo la domanda sui sintomi
    var state = {};     // risposte date (tipo di dolore, quando, dove)

    var head = el("div", "tr-head");
    var progress = el("div", "tr-progress");
    var back = el("button", "tr-back", "← Indietro");
    back.type = "button";
    head.appendChild(back); head.appendChild(progress);
    var stage = el("div", "tr-stage");
    stage.setAttribute("aria-live", "polite");
    box.appendChild(head); box.appendChild(stage);

    back.addEventListener("click", function () {
      if (!history.length) return;
      var prev = history.pop();
      pending = prev.pending;
      render(prev.id, true);
    });

    function resolve(id) {
      while (N[id] && N[id].compute) id = N[id].compute(state);
      return id;
    }
    function go(id) {
      history.push({ id: current, pending: pending });
      render(resolve(id));
    }

    var current = "start";

    function setProgress(isResult) {
      var steps = isResult ? 5 : Math.min(history.length + 1, 4);
      progress.innerHTML = "";
      for (var i = 0; i < 5; i++) {
        var d = el("span", i < steps ? "on" : "");
        progress.appendChild(d);
      }
      back.style.visibility = history.length ? "visible" : "hidden";
    }

    function render(id, isBack) {
      current = id;
      var n = N[id];
      var view = el("div", "tr-view" + (isBack ? " from-left" : ""));

      if (n.level) {
        renderResult(n, view);
        setProgress(true);
      } else if (n.check) {
        view.appendChild(el("h3", "tr-q", n.q));
        if (n.hint) view.appendChild(el("p", "tr-hint", n.hint));
        var list = el("div", "tr-checks");
        n.items.forEach(function (t, i) {
          var lab = el("label", "tr-check");
          lab.innerHTML = '<input type="checkbox" value="' + i + '"><span>' + t + "</span>";
          list.appendChild(lab);
        });
        view.appendChild(list);
        var row = el("div", "tr-row");
        var none = el("button", "btn btn-ghost", "Nessuno di questi");
        var cont = el("button", "btn btn-primary", "Continua");
        none.type = cont.type = "button";
        none.addEventListener("click", function () { go(pending || "start"); });
        cont.addEventListener("click", function () {
          var any = list.querySelectorAll("input:checked").length > 0;
          go(any ? n.ifAny : (pending || "start"));
        });
        row.appendChild(none); row.appendChild(cont);
        view.appendChild(row);
        setProgress(false);
      } else {
        view.appendChild(el("h3", "tr-q", n.q));
        var opts = el("div", "tr-opts");
        n.opts.forEach(function (o) {
          var b = el("button", "tr-opt" + (o.i ? "" : " no-ic"), (o.i ? '<span class="tr-ic">' + o.i + "</span>" : "") + "<span>" + o.l + '</span><span class="tr-arrow">→</span>');
          b.type = "button";
          b.addEventListener("click", function () {
            if (o.set) for (var k in o.set) state[k] = o.set[k];
            if (o.then) pending = o.then;
            go(o.next);
          });
          opts.appendChild(b);
        });
        view.appendChild(opts);
        setProgress(false);
      }

      stage.innerHTML = "";
      stage.appendChild(view);
      requestAnimationFrame(function () { view.classList.add("in"); });
    }

    function renderResult(n, view) {
      var lv = LEVELS[n.level];
      var status = window.NA_STATUS || { isOpen: true, label: "" };
      var html = '<div class="tr-result ' + lv.cls + '">' +
        '<span class="tr-level"><i></i>' + lv.label + "</span>" +
        "<h3>" + n.title + "</h3><p>" + n.text + "</p>";
      if (n.todo && n.todo.length) {
        html += '<h4>Cosa fare adesso</h4><ul class="tr-todo">' + n.todo.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
      }
      if ((n.call || n.emergency) && !status.isOpen && !n.emergency) {
        html += '<div class="tr-closed"><strong>Lo studio in questo momento è chiuso</strong> (' + status.label.replace(/^Chiuso · /, "") + "). " +
          "Chiamaci appena riapriamo, oppure scrivici ora su " +
          '<a href="https://www.messenger.com/t/novearchi" target="_blank" rel="noopener">Messenger</a>: ti risponderemo alla riapertura. ' +
          '<span class="tr-small">Solo se compaiono gonfiore che si allarga, febbre alta o difficoltà a respirare o deglutire, rivolgiti alla guardia medica o al pronto soccorso.</span></div>';
      }
      html += '<div class="tr-actions">';
      if (n.emergency) {
        html += '<a class="btn tr-btn-urgent" href="tel:118">Chiama il 118</a>' +
          '<a class="btn btn-ghost" href="https://www.google.com/maps/search/pronto+soccorso" target="_blank" rel="noopener">Pronto soccorso più vicino</a>';
      } else if (n.call) {
        html += '<a class="btn btn-primary" href="tel:' + PHONE + '">Chiama lo studio · ' + PHONE_LABEL + "</a>";
      } else {
        html += '<a class="btn btn-primary" href="' + root + "contatti.html?servizio=" + (n.service || "prima-visita") + '#prenota">Prenota una visita</a>' +
          '<a class="btn btn-ghost" href="tel:' + PHONE + '">Chiama · ' + PHONE_LABEL + "</a>";
      }
      html += "</div>";
      if (n.links) {
        html += '<div class="tr-links">' + n.links.map(function (l) { return '<a class="link-arrow" href="' + root + l[1] + '">' + l[0] + "</a>"; }).join("") + "</div>";
      }
      html += '<p class="tr-disclaimer">Questa indicazione è solo orientativa e non sostituisce una visita. In caso di dubbio, contattaci.</p>';
      html += '<button type="button" class="tr-restart">↺ Ricomincia</button></div>';
      view.innerHTML = html;
      view.querySelector(".tr-restart").addEventListener("click", function () {
        history = []; pending = null; state = {}; render("start");
      });
    }

    render("start");
  }

  document.querySelectorAll("[data-triage]").forEach(init);
})();

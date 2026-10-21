'use strict';
/* =========================================================================
   MUSEU DELS AVANTPASSATS · reproductor d'escena
   -------------------------------------------------------------------------
   Un "vídeo" no és un MP4: és una escena 2D viva construïda a partir de les
   dades d'un instrument.

   Rellotge mestre = Tone.Transport. Totes les notes s'hi programen; la
   línia de temps de GSAP està PAUSADA i cada fotograma es col·loca a
   Transport.seconds. Per tant pausa, salt i represa mouen àudio i imatge
   alhora sense deriva. Els efectes efímers (notes que volen, l'alè del
   pavelló) són tl.call que es disparen en creuar-los.

   Estructura d'una parada: entrada (illa cau i rebota, l'instrument aterra
   i fa un giravolt) → melodia d'època, amb la tira de notes encenent-se →
   sortida (l'illa marxa per l'esquerra).
   ========================================================================= */

const ESCENA = (() => {
  const { INSTRUMENTS, TIRA: TIRA_DEFECTE } = window.MUSEU;
  const NS = 'http://www.w3.org/2000/svg';
  const REBOBINAT = 2.8, FINAL = 2.4, ENTRADA = .95;
  const NOTES_TECLAT = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Anys amb punt de milers ("38.000 aC"): es treu el punt abans de llegir el número.
  const anyNum = a => {
    if (a === 'AVUI') return 2026;
    const n = parseInt(a.replace(/\./g, ''), 10);
    return /aC/.test(a) ? -n : n;
  };
  const milers = n => n >= 10000 ? n.toLocaleString('ca-ES') : String(n);
  const formatAny = n => n < 0 ? `${milers(-n)} aC` : n < 1000 ? `${n} dC` : String(n);

  function crea(arrel, idInstrument, { onFi, onParada, onPreguntes } = {}) {
    const inst = INSTRUMENTS[idInstrument];
    const P = inst.parades;
    const TIRA = inst.tira || TIRA_DEFECTE;   // cada instrument mostra el seu registre

    // Només les veus d'aquest instrument viuen al graf d'àudio.
    AUDIO.prepara(P.map(p => p.timbre), P.some(p => p.bordo));

    // ── Temps absoluts ──
    const inici = [];
    let t = 0;
    P.forEach((p, i) => { if (i === 1) t += REBOBINAT; inici.push(t); t += p.dur; });
    const total = t + FINAL;
    const tRebobinat = inici[0] + P[0].dur;

    // ── DOM ──
    arrel.innerHTML = `
      <div class="pantalla">
        <svg class="esc-svg" viewBox="0 0 360 640" aria-hidden="true">
          <g class="capa-fons"></g><g class="capa-illa"></g>
          <g class="capa-motes"></g><g class="capa-notes"></g>
          <rect class="vel" width="360" height="640" fill="#5B4636" opacity="0"/>
          <g class="rellotge" transform="translate(180 330)" opacity="0">${ART.rellotge()}</g>
        </svg>
        <div class="esc-caps"></div>
        <div class="esc-ganxo"><span>Però…</span><b>com hi hem arribat?</b></div>
        <div class="esc-comptador">2026</div>
        <div class="esc-bafarades" aria-live="polite"></div>
        <div class="esc-tira">
          <div class="tira-cel"></div>
          <div class="tira-peu"><span><span class="tira-etiq">Notes que pot tocar</span> <b class="tira-n">0</b></span>
            <span class="digit" aria-live="off"><span class="digit-forats"></span><b class="digit-txt"></b></span></div>
        </div>
        <div class="esc-punts" role="tablist"></div>
        <div class="esc-fi" style="--npc:${DIALEG.PERS[HISTORIA.guia(idInstrument)].color}">
          <b>Fi de la visita</b><span>${inst.anys} en un minut</span>
          <div class="fi-npc"><img src="${DIALEG.retrat(HISTORIA.guia(idInstrument), 'ullet')}" alt="">
            <p><b>${DIALEG.PERS[HISTORIA.guia(idInstrument)].nom}</b>${HISTORIA.avisFinal[HISTORIA.guia(idInstrument)]}</p></div>
          <button class="btn or fi-preguntes">Respon les preguntes ▸</button>
        </div>
        <button class="esc-gran-play" aria-label="Reprodueix">▶</button>
      </div>`;
    const $ = s => arrel.querySelector(s);
    const svg = $('.esc-svg'), capaFons = $('.capa-fons'), capaIlla = $('.capa-illa');
    const capaNotes = $('.capa-notes'), capaMotes = $('.capa-motes');

    // Halo i ombra comuns (filtre únic per a tota l'escena)
    svg.insertAdjacentHTML('afterbegin', `<defs>
      <filter id="desenfoc" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>`);

    const uid = Math.random().toString(36).slice(2, 7);
    const grups = P.map((p, i) => {
      // Fons d'època: il·lustració sencera (cel + illa + pedestal)
      const fons = document.createElementNS(NS, 'g');
      fons.innerHTML = `<g class="fons-kb"><image href="img/ep-${p.escena}.webp" width="360" height="640" preserveAspectRatio="xMidYMid slice"/></g>`;
      fons.style.visibility = 'hidden';
      capaFons.appendChild(fons);

      // Instrument: sprite ancorat pel peu al centre del pedestal
      const sp = ART.SPRITES[p.art];
      const esc = Math.min((sp.ample || 250) / sp.w, (sp.alt || 165) / sp.h);   // flautes: més amples · arpes: més altes
      const w = sp.w * esc, h = sp.h * esc;
      const yPed = ART.yEscena(p.escena, ART.EPOQUES[p.escena].ped);
      const inst = document.createElementNS(NS, 'g');
      // Pistons i claus: la zona de cada botó es retalla del sprite (clipPath)
      // i s'amaga del cos (mask). Així el botó pintat es pot moure sol.
      const mec = MECANICA.peca(p.art);
      const zones = mec.zones || (mec.zona ? [mec.zona] : []);
      const id = `${uid}-${i}`;
      const rectZona = ([x0, y0, x1, y1]) => `x="${-w / 2 + x0 * w}" y="${-h + y0 * h}" width="${(x1 - x0) * w}" height="${(y1 - y0) * h}"`;
      const imatge = extra => `<image href="img/${sp.src}.webp" x="${-w / 2}" y="${-h}" width="${w}" height="${h}" ${extra}/>`;
      const defsMec = zones.length ? `<defs>
          <mask id="m-${id}" maskUnits="userSpaceOnUse" x="${-w}" y="${-2 * h}" width="${2 * w}" height="${3 * h}">
            <rect x="${-w}" y="${-2 * h}" width="${2 * w}" height="${3 * h}" fill="#fff"/>
            ${zones.map(z => `<rect ${rectZona(z)} fill="#000"/>`).join('')}
          </mask>
          ${zones.map((z, k) => `<clipPath id="c-${id}-${k}"><rect ${rectZona(z)}/></clipPath>`).join('')}
        </defs>` : '';
      // Corda fregada: l'arc de l'època creua les cordes pel punt de contacte i
      // es desplaça al llarg del seu eix (arcada avall / amunt) a cada nota.
      let arcSvg = '';
      if (mec.tipus === 'arc') {
        const a = ART.ARCS[mec.arc], L = w * .86, hb = L * a.h / a.w;
        const cx = -w / 2 + mec.boquet[0] * w, cy = -h + mec.boquet[1] * h;
        arcSvg = `<g transform="translate(${cx} ${cy}) rotate(-62)"><g class="arc-mou">
          <image href="img/${mec.arc}.webp" x="${-L / 2}" y="${-hb * .85}" width="${L}" height="${hb}"/></g></g>`;
      }
      const capesMec = zones.map((z, k) => `<g class="boto" data-k="${k + 1}">${imatge(`clip-path="url(#c-${id}-${k})"`)}</g>`).join('');
      inst.innerHTML = `
        <ellipse class="inst-ombra" cx="180" cy="${yPed + 4}" rx="${Math.min(90, w * .38)}" ry="9" fill="#3B2A1E" opacity=".28"/>
        <g transform="translate(180 ${yPed - 6})"><g class="inst-pos"><g class="inst-bob"><g class="inst-gir"><g class="inst-puff">
          <ellipse cx="0" cy="${-h * .5}" rx="${w * .5}" ry="${h * .5}" fill="#FFF6DC" opacity=".55" filter="url(#desenfoc)"/>
          ${defsMec}
          ${imatge(zones.length ? `mask="url(#m-${id})"` : '')}
          ${capesMec}
          ${arcSvg}
          <g class="llavis"></g>
        </g></g></g></g></g>`;
      inst.style.visibility = 'hidden';
      capaIlla.appendChild(inst);

      const cap = document.createElement('div');
      cap.className = 'cap' + (p.ganxo || p.final ? ' cap-avui' : '');
      cap.innerHTML = `<div class="any">${p.any}</div><div class="titol">${p.titol}</div><div class="lloc">${p.lloc}</div>`;
      $('.esc-caps').appendChild(cap);

      const baf = document.createElement('div');
      baf.className = 'bafarada';
      baf.textContent = p.fet;
      $('.esc-bafarades').appendChild(baf);

      // Orígens fixats UNA vegada: si cada tween en posa un de diferent, el
      // smoothOrigin de GSAP compensa amb translacions que s'acumulen en fer scrub.
      const fixa = (el, o) => gsap.set(el, { transformOrigin: o, smoothOrigin: false });
      fixa(fons.querySelector('.fons-kb'), '50% 60%');
      fixa(inst.querySelector('.inst-pos'), '50% 100%');
      fixa(inst.querySelector('.inst-ombra'), '50% 50%');
      ['.inst-bob', '.inst-gir', '.inst-puff'].forEach(c => fixa(inst.querySelector(c), '50% 50%'));

      return { fons, kb: fons.querySelector('.fons-kb'), illa: inst, ombra: inst.querySelector('.inst-ombra'),
        cap, baf, any: cap.querySelector('.any'),
        pos: inst.querySelector('.inst-pos'), bob: inst.querySelector('.inst-bob'),
        gir: inst.querySelector('.inst-gir'), puff: inst.querySelector('.inst-puff'),
        campana: [180 - w / 2 + sp.campana[0] * w, yPed - 6 - h + sp.campana[1] * h],
        w, mec, art: p.art, botons: [...inst.querySelectorAll('.boto')], arc: inst.querySelector('.arc-mou'), arcDir: 1, recArc: w * .2, llavis: inst.querySelector('.llavis'),
        boquet: [-w / 2 + mec.boquet[0] * w, -h + mec.boquet[1] * h], h };
    });

    // Tira de notes
    const cel = $('.tira-cel');
    const celles = [];
    // Percussió sense altura: en lloc de notes, un patró de 16 passos (4 temps).
    const RITME = !!inst.ritme;
    if (RITME) {
      for (let k = 0; k < 16; k++) {
        const c = document.createElement('i');
        if (k % 4 === 0) c.dataset.do = `${k / 4 + 1}`;
        c.classList.toggle('temps', k % 4 === 0);
        cel.appendChild(c);
        celles.push(c);
      }
      $('.tira-etiq').textContent = 'Patró rítmic · sons';
    } else for (let s = TIRA[0]; s <= TIRA[1]; s++) {
      const c = document.createElement('i');
      if (s % 12 === 0) c.dataset.do = `Do${s / 12 + 2}`;
      cel.appendChild(c);
      celles.push(c);
    }
    cel.style.gridTemplateColumns = `repeat(${celles.length}, 1fr)`;
    const cella = (s, n) => RITME ? celles[(n && n.pas || 0) % 16] : celles[Math.round(s) - TIRA[0]];

    // Punts de progrés
    const punts = P.map((p, i) => {
      const b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `${p.any} · ${p.titol}`);
      b.addEventListener('click', () => { AUDIO.clic(); salta(i); });
      $('.esc-punts').appendChild(b);
      return b;
    });

    // ── Línia de temps visual ──
    const tl = gsap.timeline({ paused: true });
    let anyAnterior = 2026;

    P.forEach((p, i) => {
      const g = grups[i], t0 = inici[i], fi = t0 + p.dur;
      const ultima = i === P.length - 1;

      // El fons arriba fent "zoom a través del temps" i respira lentament (Ken Burns)
      tl.set(g.fons, { visibility: 'visible', opacity: 0 }, Math.max(0, t0 - .01))
        .fromTo(g.fons, { opacity: 0 }, { opacity: 1, duration: .55, ease: 'power1.out' }, t0)
        .fromTo(g.kb, { scale: 1.18 }, { scale: 1, duration: .7, ease: 'power3.out' }, t0)
        .to(g.kb, { scale: 1.05, duration: p.dur - .7, ease: 'none' }, t0 + .7);
      if (i > 0) tl.set(grups[i - 1].fons, { visibility: 'hidden' }, t0 + .6);

      // L'instrument cau sobre el pedestal, s'aixafa, rebota i fa un giravolt
      tl.set(g.illa, { visibility: 'visible' }, t0)
        .fromTo(g.pos, { y: -340, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'power2.in' }, t0 + .1)
        .fromTo(g.ombra, { scale: .2, opacity: 0 }, { scale: 1, opacity: .28, duration: .5, ease: 'power2.in' }, t0 + .1)
        .fromTo(g.pos, { scaleX: 1, scaleY: 1 }, { scaleX: 1.12, scaleY: .84, duration: .08, ease: 'power1.out' }, t0 + .6)
        .to(g.pos, { scaleX: 1, scaleY: 1, duration: .55, ease: 'elastic.out(1.1, .35)' }, t0 + .68)
        .to(g.gir, { keyframes: [{ scaleX: -1, duration: .35, ease: 'sine.inOut' }, { scaleX: 1, duration: .35, ease: 'sine.inOut' }] }, t0 + 1.0);

      // Capçalera i bafarada
      tl.fromTo(g.cap, { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: .4, ease: 'back.out(1.8)' }, t0 + .2)
        .fromTo(g.baf, { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'back.out(2)' }, t0 + .75);

      // Comptador d'anys que roda fins a l'any de la parada
      if (i >= 2) {
        const proxy = { v: anyAnterior }, desti = anyNum(p.any);
        tl.fromTo(proxy, { v: anyAnterior }, {
          v: desti, duration: .7, ease: 'power2.out',
          onUpdate() { g.any.textContent = this.progress() >= 1 ? p.any : formatAny(Math.round(proxy.v)); },
        }, t0 + .2);
      }
      anyAnterior = anyNum(p.any);

      // Melodia: efectes visuals sincronitzats amb cada nota
      p.melodia.forEach(n => tl.call(efecteNota, [i, n], t0 + ENTRADA + n.t));

      // Sortida
      if (!ultima) {
        tl.to(g.pos, { y: -260, scale: .5, rotation: -12, opacity: 0, duration: .45, ease: 'back.in(1.6)' }, fi - .45)
          .to(g.ombra, { scale: .2, opacity: 0, duration: .35 }, fi - .45)
          .to([g.cap, g.baf], { autoAlpha: 0, duration: .3 }, fi - .4)
          .set(g.illa, { visibility: 'hidden' }, fi);
      }
    });

    // Rebobinat: "Però… com hi hem arribat?"
    const comptador = $('.esc-comptador'), ganxo = $('.esc-ganxo'), rellotge = $('.rellotge'), vel = $('.vel');
    gsap.set(rellotge, { transformOrigin: '50% 50%', smoothOrigin: false });
    gsap.set(rellotge.querySelector('.busca-m'), { transformOrigin: '50% 93.3%', smoothOrigin: false });
    gsap.set(rellotge.querySelector('.busca-h'), { transformOrigin: '50% 90.5%', smoothOrigin: false });
    const proxyR = { v: 2026 };
    tl.fromTo(ganxo, { autoAlpha: 0, scale: .5 }, { autoAlpha: 1, scale: 1, duration: .4, ease: 'back.out(2.2)' }, tRebobinat)
      .to(vel, { opacity: .35, duration: .3 }, tRebobinat)
      .fromTo(rellotge, { opacity: 0, scale: .3 }, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(2)' }, tRebobinat + .1)
      .fromTo(rellotge.querySelector('.busca-m'), { rotation: 0 }, { rotation: -1800, duration: REBOBINAT - .5, ease: 'power2.in' }, tRebobinat + .2)
      .fromTo(rellotge.querySelector('.busca-h'), { rotation: 0 }, { rotation: -150, duration: REBOBINAT - .5, ease: 'power2.in' }, tRebobinat + .2)
      .fromTo(comptador, { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 }, tRebobinat + .3)
      .fromTo(proxyR, { v: 2026 }, { v: anyNum(P[1].any), duration: REBOBINAT - .7, ease: 'power3.in',
        onUpdate() { comptador.textContent = formatAny(Math.round(proxyR.v)); } }, tRebobinat + .3)
      .to([ganxo, comptador], { autoAlpha: 0, duration: .25 }, inici[1] - .1)
      .to(rellotge, { opacity: 0, scale: 2, duration: .3, ease: 'power2.in' }, inici[1] - .2)
      .to(vel, { opacity: 0, duration: .3 }, inici[1]);

    // Cloenda
    const cartellFi = $('.esc-fi');
    const gFinal = grups[P.length - 1];
    tl.to([gFinal.cap, gFinal.baf], { autoAlpha: 0, duration: .3 }, total - FINAL)
      .fromTo(cartellFi, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: .5, ease: 'back.out(1.6)' }, total - FINAL + .2);
    tl.to({}, { duration: .01 }, total);

    // ── Àudio: tot al Transport ──
    const T = Tone.getTransport();   // Tone.Transport és una constant del context inicial
    function programa() {
      T.cancel(0);
      P.forEach((p, i) => {
        T.schedule(time => AUDIO.aterra(time), inici[i] + .55);
        p.melodia.forEach(n => T.schedule(time => AUDIO.nota(p.timbre, n.s, n.d, n.v, time), inici[i] + ENTRADA + n.t));
        if (p.bordo) {
          const durBordo = p.melodia.reduce((m, n) => Math.max(m, n.t + n.d), 0);
          T.schedule(time => AUDIO.bordo(p.bordo, durBordo, time), inici[i] + ENTRADA);
        }
      });
      T.schedule(time => AUDIO.rebobina(time, REBOBINAT - .4), tRebobinat + .15);
    }

    // ── Efectes efímers ──
    function efecteNota(i, n) {
      const g = grups[i];
      const c = cella(n.s, n);
      if (c) { c.classList.remove('sona'); void c.offsetWidth; c.classList.add('sona'); }
      const dig = MECANICA.digitacio(g.art, n.s);
      marcaDigitacio(g.mec, dig);
      premBotons(g, dig.premuts, n.d);
      if (reduit) return;
      vibraLlavis(g, n);
      gsap.fromTo(g.puff, { scale: 1 }, { scale: 1.06, duration: .08, yoyo: true, repeat: 1, ease: 'power1.out' });
      const [x, y] = g.campana;
      const txt = document.createElementNS(NS, 'text');
      txt.textContent = n.d > .5 ? '♫' : '♪';
      txt.setAttribute('x', x); txt.setAttribute('y', y);
      txt.setAttribute('class', 'nota-vola');
      capaNotes.appendChild(txt);
      gsap.fromTo(txt, { opacity: 0, scale: .4, svgOrigin: `${x} ${y}` },
        { opacity: 1, scale: 1 + n.v * .5, x: 20 + Math.random() * 40, y: -70 - Math.random() * 40, rotation: Math.random() * 40 - 20,
          duration: 1.3, ease: 'power1.out', onComplete: () => txt.remove() });
      gsap.to(txt, { opacity: 0, duration: .5, delay: .8 });
    }

    // Pistons i claus: es mouen per atribut (no per transform de GSAP) perquè
    // el desplaçament sigui exacte en unitats del sprite i no depengui d'orígens.
    function mouBoto(b, desti, dur) {
      const st = b._st || (b._st = { v: 0 });
      gsap.killTweensOf(st);
      gsap.to(st, { v: desti, duration: dur, ease: desti ? 'power2.out' : 'back.out(2.5)',
        onUpdate: () => b.setAttribute('transform', `translate(0 ${st.v.toFixed(2)})`) });
    }
    function premBotons(g, premuts, dur) {
      if (g.arc) {
        // Arcada: cada nota canvia de sentit, i dura el que dura la nota.
        g.arcDir *= -1;
        const st = g.arc._st || (g.arc._st = { v: 0 });
        gsap.killTweensOf(st);
        gsap.to(st, { v: g.arcDir * g.recArc, duration: Math.max(.1, dur), ease: 'sine.inOut',
          onUpdate: () => g.arc.setAttribute('transform', `translate(${st.v.toFixed(2)} 0)`) });
        return;
      }
      if (!g.botons.length) return;
      if (g.mec.tipus === 'vara') {
        // La vara llisca cap a la dreta: cada posició, un tram més llarg.
        const b = g.botons[0], st = b._st || (b._st = { v: 0 });
        const desti = (premuts[0] - 1) * g.mec.pas * g.w;
        gsap.killTweensOf(st);
        gsap.to(st, { v: desti, duration: .12, ease: 'power2.out',
          onUpdate: () => b.setAttribute('transform', `translate(${st.v.toFixed(2)} 0)`) });
        return;
      }
      const rec = g.mec.recorregut * g.h;
      g.botons.forEach((b, k) => {
        const avall = premuts.includes(k + 1);
        if (avall) {
          mouBoto(b, rec, .045);
          gsap.delayedCall(Math.max(.06, dur * .92), () => mouBoto(b, 0, .12));
        } else mouBoto(b, 0, .08);
      });
    }
    function deixaAnar() {
      grups.forEach(g => {
        g.botons.forEach(b => mouBoto(b, 0, .1));
        if (g.arc && g.arc._st) gsap.killTweensOf(g.arc._st);
      });
    }

    // Brunzit de llavis al broquet: anelles que bateguen mentre dura la nota
    function vibraLlavis(g, n) {
      const [x, y] = g.boquet;
      const anelles = Math.max(1, Math.round(n.d / .18));
      for (let k = 0; k < Math.min(anelles, 6); k++) {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 3);
        c.setAttribute('class', 'anella');
        g.llavis.appendChild(c);
        gsap.fromTo(c, { attr: { r: 3 }, opacity: .95 }, { attr: { r: 15 + n.v * 9 }, opacity: 0, duration: .32, delay: k * .16,
          ease: 'power1.out', onComplete: () => c.remove() });
      }
    }

    // Marcador de digitació (sota la tira)
    const forats = $('.digit-forats'), digitTxt = $('.digit-txt');
    function preparaMarcador(mec) {
      $('.digit').className = `digit digit-${mec.tipus}`;
      forats.innerHTML = mec.tipus === 'llavis' ? '<i class="boca"></i>'
        : mec.tipus === 'tecla' ? NOTES_TECLAT.map((n, k) => `<i class="tecla ${n.includes('#') ? 'negra' : 'blanca'}" data-k="${k + 1}"></i>`).join('')
        : mec.tipus === 'arpa' ? (mec.mode === 'pedals' || mec.mode === 'simple'
            ? MECANICA.PEDALS.map((n, k) => `<i class="corda pedal${k === 3 ? ' sep' : ''}" data-k="${k + 1}">${n}</i>`).join('')
            : mec.mode === 'dos' ? '<i class="corda" data-k="1">Diatònica</i><i class="corda" data-k="2">Cromàtica</i>' : '')
        : mec.tipus === 'timbal' ? mec.timbals.map((t, k) => `<i class="corda" data-k="${k + 1}">${t.nom}</i>`).join('')
        : mec.tipus === 'bateria' ? mec.sons.map((c, k) => `<i class="corda" data-k="${k + 1}">${MECANICA.SONS[c]}</i>`).join('')
        : mec.tipus === 'vara' ? Array.from({ length: 7 }, (_, k) => `<i data-k="${k + 1}">${k + 1}</i>`).join('')
        : mec.tipus === 'ma' ? ['Oberta', 'Mig', 'Tapada'].map((n, k) => `<i class="corda" data-k="${k + 1}">${n}</i>`).join('')
        : mec.tipus === 'forats' ? Array.from({ length: mec.n }, (_, k) => `<i class="forat" data-k="${k + 1}"></i>`).join('')
        : mec.tipus === 'arc' || mec.tipus === 'pinca' ? mec.noms.map((n, k) => `<i class="corda" data-k="${k + 1}">${n}</i>`).join('') + (mec.bordo ? '<i class="corda bordo">Bordó</i>' : '')
        : Array.from({ length: mec.n }, (_, k) => `<i data-k="${k + 1}">${k + 1}</i>`).join('');
      digitTxt.textContent = { llavis: 'Només llavis', claus: 'Claus tancades', arc: 'Arc', pistons: 'Pistons',
        pinca: 'Cordes', tecla: 'Teclat', forats: 'Forats', vara: 'Vara', ma: 'Mà al pavelló', timbal: 'Timbals', bateria: 'Cops', arpa: mec.mode === 'diatonica' ? 'Sense pedals' : 'Pedals' }[mec.tipus];
    }
    function marcaDigitacio(mec, dig) {
      forats.querySelectorAll('i[data-k]').forEach(f => {
        f.classList.toggle('premut', dig.premuts.includes(+f.dataset.k));
        f.classList.toggle('mig', dig.mig === +f.dataset.k);
      });
      if (mec.tipus === 'llavis') {
        const b = forats.querySelector('.boca');
        if (b) { b.classList.remove('brunz'); void b.offsetWidth; b.classList.add('brunz'); }
        return;
      }
      digitTxt.textContent = dig.text + (dig.aprox ? ' (aprox.)' : '');
      digitTxt.classList.toggle('aprox', dig.aprox);
    }

    // Partícules ambientals (independents del rellotge: són atmosfera, no contingut)
    const motes = reduit ? [] : Array.from({ length: 14 }, () => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', 1.5 + Math.random() * 2.5);
      c.setAttribute('cx', 180); c.setAttribute('cy', 400); c.setAttribute('opacity', 0);
      capaMotes.appendChild(c);
      const vola = () => gsap.fromTo(c, { attr: { cx: Math.random() * 360, cy: 180 + Math.random() * 360 }, opacity: 0 },
        { attr: { cy: '-=120', cx: `+=${Math.random() * 60 - 30}` }, opacity: .8, duration: 3 + Math.random() * 3, ease: 'sine.inOut', onComplete: vola });
      gsap.delayedCall(Math.random() * 3, vola);
      return c;
    });
    const bobs = reduit ? [] : grups.map(g => gsap.to(g.bob, { y: -7, rotation: 1.5, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

    // ── Estat derivat del temps (robust davant de salts) ──
    let actual = -1;
    const indexA = s => { let k = 0; inici.forEach((t0, i) => { if (s >= t0 - .02) k = i; }); return k; };
    function aplicaEstat(i) {
      if (i === actual) return;
      actual = i;
      const p = P[i];
      const pot = new Set(p.possibles.map(Math.round));
      if (RITME) {
        // El patró de la parada es veu abans de sonar: passos encesos = cops.
        const passos = new Set(p.melodia.map(n => (n.pas || 0) % 16));
        celles.forEach((c, k) => c.classList.toggle('pot', passos.has(k)));
        $('.tira-n').textContent = pot.size;
      } else celles.forEach((c, k) => {
        const s = k + TIRA[0];
        c.classList.toggle('pot', pot.has(s));
        c.classList.toggle('desafinat', p.possibles.some(x => Math.round(x) === s && Math.abs(x - s) > .2));
      });
      if (!RITME) $('.tira-n').textContent = [...pot].filter(s => s >= TIRA[0] && s <= TIRA[1]).length;
      punts.forEach((b, k) => { b.classList.toggle('actiu', k === i); b.classList.toggle('vist', k < i); });
      motes.forEach(m => m.setAttribute('fill', ART.colorMotes(p.escena)));
      preparaMarcador(MECANICA.peca(p.art));
      deixaAnar();
      onParada && onParada(i, p);
    }

    // ── Control ──
    let sonant = false, acabat = false, poster = true;
    const granPlay = $('.esc-gran-play');

    function tick() {
      if (poster) return;
      const s = T.seconds;
      tl.time(Math.min(s, total));
      aplicaEstat(indexA(s));
      if (sonant && s >= total) {
        pausa();
        acabat = true;
        onFi && onFi();
      }
    }
    gsap.ticker.add(tick);

    function play() {
      if (!AUDIO.llest) return;
      if (poster) { poster = false; tl.time(0, true); T.seconds = 0; }
      if (acabat) reinicia();
      if (T.state !== 'started') T.start('+0.03');
      sonant = true;
      granPlay.classList.add('amagat');
      arrel.classList.add('sonant');
    }
    function pausa() {
      T.pause();
      AUDIO.silencia();
      deixaAnar();
      sonant = false;
      granPlay.classList.remove('amagat');
      arrel.classList.remove('sonant');
    }
    const commuta = () => (sonant ? pausa() : play());
    function salta(i) {
      i = Math.max(0, Math.min(P.length - 1, i));
      AUDIO.silencia();
      deixaAnar();
      // Saltar a una parada vol dir veure-la entrar: aterrem just abans de la caiguda.
      const s = Math.max(0, inici[i] - (i === 1 ? .05 : 0));
      tl.time(s, true);
      T.seconds = s;
      acabat = false; poster = false;
      capaNotes.innerHTML = '';
      aplicaEstat(indexA(s));
      if (!sonant) play();
    }
    function reinicia() { acabat = false; tl.time(0, true); T.seconds = 0; actual = -1; capaNotes.innerHTML = ''; }
    const seguent = () => salta(indexA(T.seconds) + 1);
    const anterior = () => salta(indexA(T.seconds) - (T.seconds - inici[indexA(T.seconds)] > 1.5 ? 0 : 1));

    granPlay.addEventListener('click', () => { AUDIO.clic(); play(); });
    $('.fi-preguntes').addEventListener('click', () => { AUDIO.clic(); onPreguntes && onPreguntes(); });
    svg.addEventListener('click', () => commuta());

    function destrueix() {
      gsap.ticker.remove(tick);
      T.stop(); T.cancel(0);
      AUDIO.silencia();
      tl.kill();
      bobs.forEach(b => b.kill());
      motes.forEach(m => gsap.killTweensOf(m));
      arrel.innerHTML = '';
    }

    T.stop(); T.seconds = 0;
    programa();
    tl.time(1.9, true);   // fotograma de pòster
    aplicaEstat(0);

    return { play, pausa, commuta, salta, seguent, anterior, reinicia, destrueix, total,
      get sonant() { return sonant; } };
  }

  return { crea };
})();

window.ESCENA = ESCENA;

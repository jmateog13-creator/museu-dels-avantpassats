'use strict';
/* =========================================================================
   MUSEU DELS AVANTPASSATS · el museu
   -------------------------------------------------------------------------
   Entrada → plànol (4 sales = 4 famílies) → sala → vitrina (vídeo + cartela)
   → prova de la vitrina → segell al passaport.
   L'error no castiga: revela la resposta bona, explica el perquè i continua.
   Metahistòria (historia.js): el doctor Martí i la doctora Carla reconstrueixen
   l'arxiu; ells presenten les sales, fan les preguntes i donen medalles i diploma.

   Les zones clicables es posen en % sobre les il·lustracions de Higgsfield
   (plànol i sala), així escalen amb la imatge a qualsevol mida.
   ========================================================================= */

(() => {
  const { SALES, NOMS, SUBFAMILIES, INSTRUMENTS } = window.MUSEU;
  const COLOR_SUB = {
    'Corda fregada': '#C9544A', 'Corda polsada': '#2F86B8', 'Corda percudida': '#7A5BA8',
    'Membranòfons': '#D9822B', 'Idiòfons': '#23988A',
  };
  const GAME_ID = 'museu-dels-avantpassats';
  const CLAU = 'museu-avantpassats-v1';
  const $ = s => document.querySelector(s);

  // Zones de cada sala sobre img/planol.webp: [esquerra, dalt, amplada, alçada] en %
  const ZONES_PLANOL = {
    corda: [9.5, 7, 36.5, 36], fusta: [54, 7, 36.5, 36],
    metall: [9, 51, 36.5, 37], percussio: [55, 51, 36.5, 37],
  };

  // ── Desament (opcional: sense localStorage el museu funciona igual) ──
  let desat = { segells: {} };
  try { desat = JSON.parse(localStorage.getItem(CLAU)) || desat; } catch (e) { /* mode privat */ }
  desat.vist = desat.vist || {};          // intro i primera visita de cada sala
  desat.medalles = desat.medalles || {};  // sala → data
  const TOTAL = Object.keys(INSTRUMENTS).length;
  const atzar = a => a[Math.floor(Math.random() * a.length)];
  // Un diàleg que només surt la primera vegada (Salta també el dona per vist).
  async function unCop(clau, linies) {
    if (desat.vist[clau] || !linies) return;
    desat.vist[clau] = true;
    desa();
    await DIALEG.seq(linies);
  }
  const desa = () => { try { localStorage.setItem(CLAU, JSON.stringify(desat)); } catch (e) { /* res */ } };

  const barreja = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sprite = (art, cls = '') => `<img class="${cls}" src="img/${ART.SPRITES[art].src}.webp" alt="" draggable="false">`;
  const artFinal = id => INSTRUMENTS[id].parades[INSTRUMENTS[id].parades.length - 1].art;

  // ── Navegació entre pantalles ──
  let reproductor = null;
  function mostra(id) {
    document.querySelectorAll('.pantalla-museu').forEach(s => s.hidden = s.id !== id);
    if (id !== 'vitrina' && reproductor) { reproductor.destrueix(); reproductor = null; }
    $('#btn-passaport').hidden = id === 'entrada';
    window.scrollTo(0, 0);
    const pant = document.getElementById(id);
    gsap.fromTo(pant, { opacity: 0 }, { opacity: 1, duration: .35, ease: 'power1.out' });
  }
  function refrescaComptador() { $('#pf-comptador').textContent = Object.keys(desat.segells).length; }

  // ── Entrada ──
  $('#btn-entra').addEventListener('click', async () => {
    $('#btn-entra').disabled = true;
    $('#btn-entra').textContent = 'Obrint portes…';
    await AUDIO.init();
    AUDIO.clic();
    pintaPlanol();
    mostra('planol');
    refrescaComptador();
    await unCop('intro', HISTORIA.intro);
  });
  gsap.from('.entrada-cartell', { y: -40, opacity: 0, duration: .8, ease: 'back.out(1.6)', delay: .2 });
  gsap.from('.entrada-peu', { y: 40, opacity: 0, duration: .8, ease: 'back.out(1.4)', delay: .4 });

  // ── Plànol ──
  function pintaPlanol() {
    $('#sales').innerHTML = SALES.map(s => {
      const [l, t, w, h] = ZONES_PLANOL[s.id];
      const oberta = s.vitrines.some(v => INSTRUMENTS[v]);
      const fets = s.vitrines.filter(v => desat.segells[v]).length;
      return `<button class="zona zona-${s.color}${oberta ? '' : ' tancada'}" data-sala="${s.id}"
          style="left:${l}%;top:${t}%;width:${w}%;height:${h}%" aria-label="${s.nom}${oberta ? '' : ' (en muntatge)'}">
        ${oberta ? '' : '<img class="zona-cordo" src="img/cordo.webp" alt="">'}
        <span class="zona-rotul"><b>${s.nom}</b><small>${oberta ? `${fets}/${s.vitrines.length} segells` : 'En muntatge'}</small></span>
      </button>`;
    }).join('');
    $('#sales').querySelectorAll('.zona').forEach(b => b.addEventListener('click', () => {
      AUDIO.clic();
      if (b.classList.contains('tancada')) { gsap.fromTo(b.querySelector('.zona-rotul'), { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .3)' }); return; }
      pintaSala(b.dataset.sala);
      mostra('sala');
      unCop('sala-' + b.dataset.sala, HISTORIA.sales[b.dataset.sala]);
    }));
    gsap.from('#sales .zona-rotul', { y: 20, opacity: 0, stagger: .08, duration: .45, ease: 'back.out(2)', delay: .15 });
  }

  // ── Sala ──
  let salaActual = 'metall';
  function pintaSala(idSala) {
    salaActual = idSala;
    const s = SALES.find(x => x.id === idSala);
    $('#sala-titol').textContent = s.nom;
    $('.sala-quadre > img').src = `img/${s.imatge}.webp`;
    $('#vitrines').innerHTML = s.vitrines.map((v, k) => {
      const inst = INSTRUMENTS[v];
      const segell = desat.segells[v];
      const { dalt, alcada, amplada } = s.caixa;
      return `<button class="vitrina-zona${inst ? '' : ' coberta'}${segell ? ' segellada' : ''}" data-v="${v}"
          style="left:${s.vitrinesX[k] - amplada / 2}%;top:${dalt}%;width:${amplada}%;height:${alcada}%"
          aria-label="${NOMS[v]}${inst ? '' : ' (en restauració)'}">
        ${inst ? sprite(artFinal(v), 'vz-objecte') : '<img class="vz-llencol" src="img/llencol.webp" alt="">'}
        <span class="vz-placa">${NOMS[v]}</span>
        <span class="vz-estat">${inst ? (segell ? '✓ Segellada' : 'Obre la vitrina') : 'En restauració'}</span>
      </button>`;
    }).join('');
    // Subfamílies: cada grup de vitrines té el seu color (zona al terra + rètol + botons),
    // amb un petit buit entre grups perquè no es confonguin.
    const { dalt, alcada, amplada } = s.caixa;
    let k = 0;
    while (k < s.vitrines.length) {
      const sub = SUBFAMILIES[s.vitrines[k]];
      let f = k;
      while (f + 1 < s.vitrines.length && SUBFAMILIES[s.vitrines[f + 1]] === sub) f++;
      if (sub) {
        const color = COLOR_SUB[sub] || '#8A715C';
        const esq = s.vitrinesX[k] - amplada / 2 + .5, dre = s.vitrinesX[f] + amplada / 2 - .5;
        $('#vitrines').insertAdjacentHTML('afterbegin',
          `<div class="zona-sub" style="--sub:${color};left:${esq}%;width:${dre - esq}%;top:${dalt - 3}%;height:${alcada + 15}%">
             <span class="rotul-sub">${sub}</span></div>`);
        for (let q = k; q <= f; q++) {
          const z = $(`#vitrines .vitrina-zona[data-v="${s.vitrines[q]}"]`);
          if (z) z.style.setProperty('--sub', color);
        }
      }
      k = f + 1;
    }
    $('#vitrines').querySelectorAll('.vitrina-zona').forEach(b => b.addEventListener('click', () => {
      AUDIO.clic();
      if (b.classList.contains('coberta')) { gsap.fromTo(b.querySelector('.vz-llencol'), { rotation: -4 }, { rotation: 0, transformOrigin: '50% 100%', duration: .6, ease: 'elastic.out(1, .3)' }); return; }
      obreVitrina(b.dataset.v);
    }));
    gsap.from('#vitrines .vz-objecte, #vitrines .vz-llencol', { y: -30, opacity: 0, stagger: .1, duration: .6, ease: 'bounce.out', delay: .2 });
  }

  // ── Vitrina ──
  let instActual = null;
  function obreVitrina(id) {
    instActual = id;
    const inst = INSTRUMENTS[id];
    mostra('vitrina');
    $('.vitrina-fons').style.backgroundImage = `url(img/${SALES.find(s => s.id === inst.sala).imatge}.webp)`;
    $('#vitrina-titol').textContent = inst.nom;
    $('#placa-nom').textContent = inst.nom;
    $('#cartela-nom').textContent = inst.nom;
    const sub = SUBFAMILIES[id];
    $('#cartela-familia').textContent = 'Família de ' + SALES.find(s => s.id === inst.sala).nom.replace('Sala de ', '').toLowerCase()
      + (sub ? ` · ${sub.toLowerCase()}` : '');
    $('#cartela-anys').textContent = `${inst.anys} d'història`;
    $('#cartela-text').textContent = inst.cartela;
    $('#cartela-parada').textContent = '';
    const btnProva = $('#btn-prova');
    btnProva.disabled = !desat.segells[id];
    btnProva.textContent = desat.segells[id] ? 'Torna a fer la prova' : 'Mira el vídeo per obrir la prova';

    reproductor = ESCENA.crea($('#reproductor'), id, {
      onParada: (i, p) => { $('#cartela-parada').innerHTML = `<b>${p.any}</b> · ${p.titol}`; },
      onPreguntes: () => obreProva(),
      onFi: () => {
        btnProva.disabled = false;
        btnProva.textContent = desat.segells[id] ? 'Torna a fer la prova' : 'Fes la prova de la vitrina';
        gsap.fromTo(btnProva, { scale: .85 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' });
      },
    });
  }

  $('#ctl-play').addEventListener('click', () => { AUDIO.clic(); reproductor && reproductor.commuta(); });
  $('#ctl-ant').addEventListener('click', () => { AUDIO.clic(); reproductor && reproductor.anterior(); });
  $('#ctl-seg').addEventListener('click', () => { AUDIO.clic(); reproductor && reproductor.seguent(); });
  $('#ctl-inici').addEventListener('click', () => { AUDIO.clic(); reproductor && reproductor.salta(0); });
  document.addEventListener('keydown', e => {
    if ($('#vitrina').hidden || !reproductor || !$('#prova').hidden || !$('#passaport').hidden || DIALEG.obert()) return;
    if (e.code === 'Space') { e.preventDefault(); reproductor.commuta(); }
    if (e.code === 'ArrowRight') reproductor.seguent();
    if (e.code === 'ArrowLeft') reproductor.anterior();
  });

  // ── Prova de la vitrina ──
  let prova = null;
  $('#btn-prova').addEventListener('click', () => { AUDIO.clic(); obreProva(); });
  function obreProva() {
    reproductor && reproductor.pausa();
    const inst = INSTRUMENTS[instActual];
    prova = { inst, i: 0, encerts: 0 };
    $('#prova').hidden = false;
    $('#prova-punts').innerHTML = inst.preguntes.map(() => '<i></i>').join('');
    pintaPregunta();
  }
  $('#prova-tanca').addEventListener('click', () => { AUDIO.clic(); $('#prova').hidden = true; });

  function pintaPregunta() {
    const { inst, i } = prova;
    const q = inst.preguntes[i];
    $('#prova-punts').querySelectorAll('i').forEach((d, k) => d.className = k < i ? 'fet' : k === i ? 'actiu' : '');
    // Martí pregunta la història; Carla, el so.
    prova.qui = HISTORIA.quiPregunta(q, i);
    const pers = DIALEG.PERS[prova.qui];
    $('#prova-targeta').style.setProperty('--npc', pers.color);
    $('#prova-qui').textContent = pers.nom;
    posaRetrat(({ ordre: 'explica', escolta: 'somriu' })[q.tipus] || 'pensa');
    DIALEG.escriu(prova.qui, q.enunciat, $('#prova-enunciat'));
    $('#prova-fb').hidden = true;
    $('#prova-seguent').hidden = true;
    const cos = $('#prova-cos');
    cos.innerHTML = '';
    ({ opcions: preguntaOpcions, ordre: preguntaOrdre, escolta: preguntaEscolta })[q.tipus](q, cos);
    gsap.from('#prova-targeta', { y: 24, opacity: 0, duration: .4, ease: 'back.out(1.6)' });
  }

  function posaRetrat(expr) {
    const img = $('#prova-retrat');
    img.src = DIALEG.retrat(prova.qui, expr);
    img.alt = DIALEG.PERS[prova.qui].nom;
    gsap.fromTo(img, { scale: .9, y: 6 }, { scale: 1, y: 0, duration: .35, ease: 'back.out(2.4)' });
  }

  function resol(encertat, q) {
    if (encertat) { prova.encerts++; AUDIO.encert(); } else AUDIO.pista();
    posaRetrat(encertat ? atzar(['celebra', 'ullet']) : 'explica');
    const fb = $('#prova-fb');
    fb.className = 'prova-fb ' + (encertat ? 'be' : 'gairebe');
    fb.innerHTML = `<b>${encertat ? atzar(HISTORIA.be) : atzar(HISTORIA.gairebe) + ' Mira-ho així:'}</b> <span></span>`;
    DIALEG.escriu(prova.qui, q.fb, fb.querySelector('span'));
    fb.hidden = false;
    const seg = $('#prova-seguent');
    seg.hidden = false;
    seg.textContent = prova.i < prova.inst.preguntes.length - 1 ? 'Següent' : 'Segella el passaport';
    seg.focus();
  }

  $('#prova-seguent').addEventListener('click', () => {
    AUDIO.clic();
    if (prova.i < prova.inst.preguntes.length - 1) { prova.i++; pintaPregunta(); }
    else acabaProva();
  });

  function preguntaOpcions(q, cos) {
    const ordre = barreja(q.opcions.map((_, k) => k));
    cos.innerHTML = `<div class="opcions">${ordre.map(k => `<button class="opcio" data-k="${k}">${q.opcions[k]}</button>`).join('')}</div>`;
    cos.querySelectorAll('.opcio').forEach(b => b.addEventListener('click', () => {
      const k = +b.dataset.k;
      cos.querySelectorAll('.opcio').forEach(x => { x.disabled = true; if (+x.dataset.k === q.correcta) x.classList.add('bona'); });
      if (k !== q.correcta) b.classList.add('triada');
      resol(k === q.correcta, q);
    }));
  }

  function preguntaOrdre(q, cos) {
    const P = prova.inst.parades;
    const parada = id => P.find(p => p.id === id);
    const triats = [];
    cos.innerHTML = `<div class="ordre">${barreja(q.items).map(id => {
      const p = parada(id);
      return `<button class="carta-ordre" data-id="${id}"><span class="co-num"></span>
        <span class="co-img">${sprite(p.art)}</span><span class="co-nom">${p.titol}</span><span class="co-lloc">${p.lloc}</span></button>`;
    }).join('')}</div><button class="btn or" id="ordre-comprova" disabled>Comprova l'ordre</button>`;
    const cartes = [...cos.querySelectorAll('.carta-ordre')];
    const refresca = () => {
      cartes.forEach(c => {
        const k = triats.indexOf(c.dataset.id);
        c.querySelector('.co-num').textContent = k >= 0 ? k + 1 : '';
        c.classList.toggle('triada', k >= 0);
      });
      $('#ordre-comprova').disabled = triats.length !== q.items.length;
    };
    cartes.forEach(c => c.addEventListener('click', () => {
      AUDIO.clic();
      const k = triats.indexOf(c.dataset.id);
      if (k >= 0) triats.splice(k, 1); else triats.push(c.dataset.id);
      refresca();
      gsap.fromTo(c, { scale: .94 }, { scale: 1, duration: .4, ease: 'elastic.out(1, .4)' });
    }));
    $('#ordre-comprova').addEventListener('click', () => {
      const be = triats.every((id, k) => id === q.items[k]);
      $('#ordre-comprova').hidden = true;
      cartes.forEach(c => {
        c.disabled = true;
        const k = q.items.indexOf(c.dataset.id);
        c.querySelector('.co-num').textContent = k + 1;
        c.classList.add(triats[k] === c.dataset.id ? 'bona' : 'corregida');
        c.style.order = k;
      });
      resol(be, q);
    });
  }

  function preguntaEscolta(q, cos) {
    const P = prova.inst.parades;
    const correcteA = Math.random() < .5;
    const frag = { A: P.find(p => p.id === (correcteA ? q.fragments.correcte : q.fragments.parany)),
                   B: P.find(p => p.id === (correcteA ? q.fragments.parany : q.fragments.correcte)) };
    const escoltat = new Set();
    cos.innerHTML = `
      <div class="escolta">
        ${['A', 'B'].map(l => `<button class="altaveu" data-l="${l}"><span class="ona"></span><b>${l}</b><span>▶ Escolta</span></button>`).join('')}
      </div>
      <div class="opcions duo">
        <button class="opcio" data-l="A" disabled>És l'A</button>
        <button class="opcio" data-l="B" disabled>És la B</button>
      </div>`;
    cos.querySelectorAll('.altaveu').forEach(b => b.addEventListener('click', () => {
      const d = AUDIO.fragment(frag[b.dataset.l]);
      b.classList.add('sona');
      setTimeout(() => b.classList.remove('sona'), d * 1000);
      escoltat.add(b.dataset.l);
      if (escoltat.size === 2) cos.querySelectorAll('.opcio').forEach(o => o.disabled = false);
    }));
    const bona = correcteA ? 'A' : 'B';
    cos.querySelectorAll('.opcio').forEach(b => b.addEventListener('click', () => {
      cos.querySelectorAll('.opcio').forEach(x => { x.disabled = true; if (x.dataset.l === bona) x.classList.add('bona'); });
      if (b.dataset.l !== bona) b.classList.add('triada');
      resol(b.dataset.l === bona, q);
    }));
  }

  async function acabaProva() {
    const { inst, encerts } = prova;
    const n = inst.preguntes.length;
    $('#prova').hidden = true;
    const salaInst = SALES.find(s => s.id === inst.sala);
    const salaAbans = salaInst.vitrines.every(v => desat.segells[v]);
    const totsAbans = Object.keys(desat.segells).length >= TOTAL;
    const previ = desat.segells[instActual];
    desat.segells[instActual] = {
      data: new Date().toISOString().slice(0, 10),
      encerts: Math.max(encerts, previ ? previ.encerts : 0),
    };
    desa();
    refrescaComptador();
    if (window.AulaTechBridge) {
      AulaTechBridge.send(GAME_ID, { completat: true, precisio: encerts / n, errors: n - encerts, perfecte: encerts === n });
    }
    $('#btn-prova').textContent = 'Torna a fer la prova';
    await DIALEG.seq(HISTORIA.segell(inst.nom, encerts, n));
    obrePassaport(instActual, `Fitxa recuperada: ${inst.nom} · encerts a la primera ${encerts}/${n}`);

    // Cerimònies: medalla de sala (la primera vegada que es completa) i diploma (21/21).
    const novaMedalla = !salaAbans && salaInst.vitrines.every(v => desat.segells[v]) && !desat.medalles[salaInst.id];
    const nouDiploma = !totsAbans && Object.keys(desat.segells).length >= TOTAL;
    if (novaMedalla || nouDiploma) await new Promise(r => setTimeout(r, 1500));
    if (novaMedalla) {
      desat.medalles[salaInst.id] = new Date().toISOString().slice(0, 10);
      desa();
      obrePassaport(null, '', salaInst.id);
      await DIALEG.seq(HISTORIA.medalla(HISTORIA.medalles[salaInst.id]));
    }
    if (nouDiploma) {
      await DIALEG.seq(HISTORIA.diploma);
      $('#passaport').hidden = true;
      obreDiploma();
    }
  }

  // ── Passaport ──
  const segellSVG = (id, sala) => `
    <svg viewBox="-60 -60 120 120" class="segell segell-${sala.color}" aria-hidden="true">
      <circle r="55" class="s-fons"/><circle r="55" class="s-anell"/><circle r="45" class="s-anell fi"/>
      <image href="img/${ART.SPRITES[artFinal(id)].src}.webp" x="-36" y="-30" width="72" height="40" preserveAspectRatio="xMidYMid meet"/>
      <text y="28" text-anchor="middle">${NOMS[id].toUpperCase()}</text></svg>`;

  function obrePassaport(nou, missatge, salaMedalla) {
    $('#passaport').hidden = false;
    $('#passaport-msg').textContent = missatge || '';
    const fitxes = Object.keys(desat.segells).length;
    $('#passaport-resum').innerHTML = `
      <span class="xip">Fitxes recuperades: <b>${fitxes}/${TOTAL}</b></span>
      <span class="xip">Medalles: <b>${Object.keys(desat.medalles).length}/${SALES.length}</b></span>
      ${fitxes >= TOTAL ? '<button class="btn or" id="veure-diploma">Diploma</button>' : ''}`;
    const vd = $('#veure-diploma');
    vd && vd.addEventListener('click', () => { AUDIO.clic(); $('#passaport').hidden = true; obreDiploma(); });
    $('#passaport-pagines').innerHTML = SALES.map(s => {
      const fets = s.vitrines.filter(v => desat.segells[v]).length;
      return `
      <section class="pagina pagina-${s.color}">
        <h3>${s.nom}<small>${fets}/${s.vitrines.length}</small></h3>
        <div class="forats">${s.vitrines.map(v => `
          <div class="forat${desat.segells[v] ? ' ple' : ''}" data-v="${v}">
            ${desat.segells[v] ? segellSVG(v, s) : `<span>${NOMS[v]}</span>`}
          </div>`).join('')}</div>
        ${desat.medalles[s.id] || fets === s.vitrines.length ? `<img class="medalla" src="img/medalla.webp" alt="${HISTORIA.medalles[s.id].nom}">
          <span class="medalla-nom">${HISTORIA.medalles[s.id].nom}</span>` : ''}
      </section>`;
    }).join('');
    if (salaMedalla) {
      const pag = $(`#passaport-pagines .pagina-${SALES.find(s => s.id === salaMedalla).color}`);
      pag.scrollIntoView({ block: 'center' });
      gsap.fromTo(pag.querySelector('.medalla'), { scale: 4, rotation: -90, opacity: 0 }, {
        scale: 1, rotation: 10, opacity: 1, duration: .7, ease: 'back.out(1.8)', onComplete: () => AUDIO.segell() });
      AUDIO.encert();
      return;
    }
    gsap.from('.llibreta', { y: 40, rotation: -2, opacity: 0, duration: .5, ease: 'back.out(1.6)' });
    if (nou) {
      const forat = $(`#passaport-pagines .forat[data-v="${nou}"]`);
      forat.scrollIntoView({ block: 'center' });
      const seg = forat.querySelector('.segell');
      gsap.fromTo(seg, { scale: 3, rotation: -30, opacity: 0 }, {
        scale: 1, rotation: -8, opacity: 1, duration: .35, delay: .5, ease: 'power3.in',
        onComplete: () => { AUDIO.segell(); gsap.fromTo(forat, { scale: .9 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .35)' }); },
      });
    }
  }
  $('#btn-passaport').addEventListener('click', () => { AUDIO.clic(); reproductor && reproductor.pausa(); obrePassaport(); });
  $('#passaport-tanca').addEventListener('click', () => {
    AUDIO.clic();
    $('#passaport').hidden = true;
    if (!$('#sala').hidden) pintaSala(salaActual);
    if (!$('#planol').hidden) pintaPlanol();
  });

  // ── Diploma ──
  function obreDiploma() {
    $('#diploma').hidden = false;
    $('#diploma-nom').value = desat.nom || '';
    $('#diploma-data').textContent = new Date().toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    $('#diploma-medalles').innerHTML = SALES.map(s => `
      <figure><img src="img/medalla.webp" alt="">${HISTORIA.medalles[s.id].nom}</figure>`).join('');
    gsap.from('.diploma', { y: 50, scale: .92, opacity: 0, duration: .6, ease: 'back.out(1.5)' });
    AUDIO.segell();
    if (!desat.nom) $('#diploma-nom').focus();
  }
  $('#diploma-nom').addEventListener('input', e => { desat.nom = e.target.value.trim(); desa(); });
  $('#diploma-imprimeix').addEventListener('click', () => { AUDIO.clic(); window.print(); });
  $('#diploma-tanca').addEventListener('click', () => { AUDIO.clic(); $('#diploma').hidden = true; });

  // ── Tornades ──
  $('#torna-planol').addEventListener('click', () => { AUDIO.clic(); pintaPlanol(); mostra('planol'); });
  $('#torna-sala').addEventListener('click', () => { AUDIO.clic(); pintaSala(INSTRUMENTS[instActual].sala); mostra('sala'); });
})();

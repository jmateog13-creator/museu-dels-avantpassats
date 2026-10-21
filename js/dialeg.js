'use strict';
/* =========================================================================
   MUSEU DELS AVANTPASSATS · diàlegs del doctor Martí i la doctora Carla
   -------------------------------------------------------------------------
   Una caixa a baix amb el retrat, el nom i el text que apareix lletra a
   lletra (amb una veueta de "pips"). Clic a Continua: si el text encara
   s'escriu, el completa; si no, avança. Salta: acaba la seqüència.

   API (tot són promeses):
     DIALEG.diu(qui, expr, text)          una frase
     DIALEG.seq([[qui, expr, text], ...]) diverses frases (Salta les talla)
     DIALEG.pregunta(qui, expr, text)     obre la caixa sense Continua i
                                          retorna el contenidor on el joc hi
                                          posa els botons de resposta
     DIALEG.tanca()
   Retrats: img/npc-{qui}-{expr}.webp (tots amb la mateixa tela i el cap al
   centre, perquè canviar d'expressió no faci saltar la figura).
   Animació: dues capes d'imatge (actual / següent) precarregades i
   descodificades; el relleu entre personatges és un baixa-i-puja encavalcat,
   el canvi d'expressió un fos curt, i mentre parlen fan un balanceig suau.
   ========================================================================= */

const DIALEG = (() => {
  const PERS = {
    marti: { nom: 'Doctor Martí', ofici: 'historiador', color: '#9C6A3E', veu: [60, 64, 67] },
    carla: { nom: 'Doctora Carla', ofici: 'especialista en so', color: '#23988A', veu: [67, 71, 74] },
  };
  const EXPR = ['saluda', 'somriu', 'pensa', 'sorpres', 'explica', 'celebra', 'segell', 'preocupat', 'ullet'];
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let el, marc, caixaRetrat, capes, nom, text, extra, segueix, salta;
  let escrivint = null, saltat = false, resolActual = null;
  let quiActual = null, exprActual = null, capa = 0, parlant = null, tancant = null;

  // ── Precàrrega: totes les expressions descodificades abans de fer-les servir ──
  const retrat = (qui, expr) => `img/npc-${qui}-${EXPR.includes(expr) ? expr : 'somriu'}.webp`;
  const cache = new Map();
  function precarrega() {
    Object.keys(PERS).forEach(qui => EXPR.forEach(expr => {
      const src = retrat(qui, expr);
      if (cache.has(src)) return;
      const im = new Image();
      im.src = src;
      cache.set(src, im.decode().catch(() => { /* es mostrarà igualment */ }));
    }));
  }
  const llesta = src => cache.get(src) || Promise.resolve();

  function crea() {
    el = document.createElement('div');
    el.className = 'dialeg';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="dl-marc">
        <div class="dl-retrat"><img class="dl-capa" alt=""><img class="dl-capa" alt=""></div>
        <div class="dl-caixa">
          <div class="dl-nom"></div>
          <p class="dl-text"></p>
          <div class="dl-extra"></div>
          <div class="dl-botons">
            <button class="btn dl-salta">Salta</button>
            <button class="btn or dl-segueix">Continua ▸</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    marc = el.querySelector('.dl-marc');
    caixaRetrat = el.querySelector('.dl-retrat');
    capes = [...el.querySelectorAll('.dl-capa')];
    nom = el.querySelector('.dl-nom');
    text = el.querySelector('.dl-text');
    extra = el.querySelector('.dl-extra');
    segueix = el.querySelector('.dl-segueix');
    salta = el.querySelector('.dl-salta');
    segueix.addEventListener('click', avança);
    salta.addEventListener('click', () => { saltat = true; acabaEscriure(); avança(); });
    // Clic fora de la caixa (al vel) també fa avançar, com a qualsevol joc de diàlegs.
    el.addEventListener('click', e => { if (e.target === el && !segueix.hidden) avança(); });
    document.addEventListener('keydown', e => {
      if (el.hidden || segueix.hidden) return;
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); avança(); }
    });
  }

  function acabaEscriure() {
    if (!escrivint) return;
    clearInterval(escrivint.id);
    escrivint.desti.textContent = escrivint.complet;
    escrivint = null;
    paraParlar();
  }

  function avança() {
    if (escrivint) { acabaEscriure(); return; }
    const r = resolActual;
    resolActual = null;
    r && r();
  }

  function obre() {
    if (!el) crea();
    if (tancant) {
      // Es tornava a obrir mentre es tancava: recupera la caixa tal com estava.
      tancant.kill(); tancant = null;
      gsap.to(marc, { y: 0, autoAlpha: 1, duration: .15 });
      return;
    }
    if (!el.hidden) return;
    el.hidden = false;
    quiActual = exprActual = null;
    capes.forEach(c => { c.removeAttribute('src'); gsap.set(c, { autoAlpha: 0, y: 0, scale: 1 }); });
    if (!reduit) {
      gsap.fromTo(marc, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .32, ease: 'back.out(1.6)' });
    }
  }

  async function posa(qui, expr) {
    obre();
    const p = PERS[qui];
    const src = retrat(qui, expr);
    const canviPersona = qui !== quiActual;
    if (!canviPersona && expr === exprActual) return;
    quiActual = qui; exprActual = expr;

    // Nom i color canvien a l'instant (el text ja ve darrere).
    el.style.setProperty('--npc', p.color);
    nom.innerHTML = `${p.nom} <small>${p.ofici}</small>`;
    if (canviPersona && !reduit) gsap.fromTo(nom, { scale: .8, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .25, ease: 'back.out(2.5)' });

    await llesta(src);
    if (quiActual !== qui || exprActual !== expr) return;   // ja ha canviat una altra vegada
    const vella = capes[capa], nova = capes[capa ^ 1];
    capa ^= 1;
    nova.src = src;
    nova.alt = p.nom;
    gsap.killTweensOf([vella, nova]);
    if (reduit) { gsap.set(vella, { autoAlpha: 0 }); gsap.set(nova, { autoAlpha: 1, y: 0, scale: 1 }); return; }
    if (canviPersona && vella.getAttribute('src')) {
      // Relleu: l'un s'enfonsa mentre l'altre puja (encavalcats, sense forat).
      gsap.to(vella, { y: 40, autoAlpha: 0, duration: .2, ease: 'power2.in' });
      gsap.fromTo(nova, { y: 50, autoAlpha: 0, scale: .96 }, { y: 0, autoAlpha: 1, scale: 1, duration: .38, delay: .08, ease: 'back.out(1.7)' });
    } else if (canviPersona) {
      gsap.fromTo(nova, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .34, ease: 'back.out(1.7)' });
    } else {
      // Mateixa persona, nova expressió: fos ràpid amb un petit rebot.
      gsap.to(vella, { autoAlpha: 0, duration: .14 });
      gsap.fromTo(nova, { autoAlpha: 0, scaleY: .97 }, { autoAlpha: 1, scaleY: 1, y: 0, duration: .22, ease: 'back.out(2.5)' });
    }
  }

  // Balanceig de parlar: només mentre s'escriu el text.
  function comencaParlar() {
    if (reduit || !caixaRetrat || parlant) return;
    parlant = gsap.to(caixaRetrat, { y: -3, rotation: .6, duration: .13, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  }
  function paraParlar() {
    if (!parlant) return;
    parlant.kill(); parlant = null;
    gsap.to(caixaRetrat, { y: 0, rotation: 0, duration: .15, ease: 'sine.out' });
  }

  // També la fa servir la fitxa de la prova, per això el destí és un paràmetre.
  function escriu(qui, frase, desti = text) {
    acabaEscriure();
    desti.textContent = '';
    if (reduit) { desti.textContent = frase; return; }
    if (desti === text) comencaParlar();
    let k = 0;
    const veu = PERS[qui].veu;
    escrivint = { complet: frase, desti, id: setInterval(() => {
      k++;
      desti.textContent = frase.slice(0, k);
      if (k % 3 === 0 && /\S/.test(frase[k - 1])) AUDIO.parla(veu[k % veu.length]);
      if (k >= frase.length) { clearInterval(escrivint.id); escrivint = null; paraParlar(); }
    }, 18) };
  }

  function diu(qui, expr, frase) {
    posa(qui, expr);
    extra.innerHTML = '';
    segueix.hidden = false;
    salta.hidden = false;
    escriu(qui, frase);
    return new Promise(r => { resolActual = r; });
  }

  async function seq(linies) {
    saltat = false;
    for (const [qui, expr, frase] of linies) {
      if (saltat) break;
      await diu(qui, expr, frase);
    }
    saltat = false;
    tanca();
  }

  // Pregunta: sense Continua; el joc hi posa els botons i decideix quan seguir.
  function pregunta(qui, expr, frase) {
    posa(qui, expr);
    extra.innerHTML = '';
    segueix.hidden = true;
    salta.hidden = true;
    escriu(qui, frase);
    return extra;
  }

  function tanca() {
    if (!el || el.hidden) return;
    acabaEscriure();
    const fi = () => { el.hidden = true; extra.innerHTML = ''; tancant = null; quiActual = exprActual = null; };
    if (reduit) { fi(); return; }
    tancant = gsap.to(marc, { y: 30, autoAlpha: 0, duration: .2, ease: 'power2.in', onComplete: fi });
  }

  const obert = () => !!el && !el.hidden && !tancant;

  precarrega();

  return { PERS, precarrega, diu, seq, pregunta, tanca, obert, escriu, retrat, get saltat() { return saltat; } };
})();

window.DIALEG = DIALEG;

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
   Retrats: img/npc-{qui}-{expr}.webp
   ========================================================================= */

const DIALEG = (() => {
  const PERS = {
    marti: { nom: 'Doctor Martí', ofici: 'historiador', color: '#9C6A3E', veu: [60, 64, 67] },
    carla: { nom: 'Doctora Carla', ofici: 'especialista en so', color: '#23988A', veu: [67, 71, 74] },
  };
  const EXPR = ['saluda', 'somriu', 'pensa', 'sorpres', 'explica', 'celebra', 'segell', 'preocupat', 'ullet'];
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let el, img, nom, text, extra, segueix, salta;
  let escrivint = null, saltat = false, resolActual = null;

  function crea() {
    el = document.createElement('div');
    el.className = 'dialeg';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <div class="dl-marc">
        <div class="dl-retrat"><img alt=""></div>
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
    img = el.querySelector('.dl-retrat img');
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
  }

  function avança() {
    if (escrivint) { acabaEscriure(); return; }
    const r = resolActual;
    resolActual = null;
    r && r();
  }

  function posa(qui, expr) {
    if (!el) crea();
    const p = PERS[qui];
    el.hidden = false;
    el.style.setProperty('--npc', p.color);
    img.src = retrat(qui, expr);
    img.alt = p.nom;
    nom.innerHTML = `${p.nom} <small>${p.ofici}</small>`;
    if (!reduit) gsap.fromTo(img, { y: 12, scale: .94 }, { y: 0, scale: 1, duration: .35, ease: 'back.out(2)' });
  }

  // També la fa servir la fitxa de la prova, per això el destí és un paràmetre.
  function escriu(qui, frase, desti = text) {
    acabaEscriure();
    desti.textContent = '';
    if (reduit) { desti.textContent = frase; return; }
    let k = 0;
    const veu = PERS[qui].veu;
    escrivint = { complet: frase, desti, id: setInterval(() => {
      k++;
      desti.textContent = frase.slice(0, k);
      if (k % 3 === 0 && /\S/.test(frase[k - 1])) AUDIO.parla(veu[k % veu.length]);
      if (k >= frase.length) { clearInterval(escrivint.id); escrivint = null; }
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
    if (!el) return;
    acabaEscriure();
    el.hidden = true;
    extra.innerHTML = '';
  }

  const obert = () => !!el && !el.hidden;

  const retrat = (qui, expr) => `img/npc-${qui}-${EXPR.includes(expr) ? expr : 'somriu'}.webp`;

  return { PERS, diu, seq, pregunta, tanca, obert, escriu, retrat, get saltat() { return saltat; } };
})();

window.DIALEG = DIALEG;

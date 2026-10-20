'use strict';
/* =========================================================================
   MUSEU DELS AVANTPASSATS · síntesi d'època (Tone.js)
   -------------------------------------------------------------------------
   Un model de metall per substracció: dent de serra → passabaix amb
   envolupant (el metall s'aclareix quan s'obre l'atac) → formant de pic →
   vibrato. Tres detalls que fan que soni a llavis i no a oscil·lador:
     · "scoop": cada atac neix uns cents per sota i puja (el llavi buscant
       l'harmònic),
     · alè: ràfega curta de soroll rosa filtrat a l'atac,
     · inestabilitat: desafinació aleatòria per nota, més gran com més antic.
   Cada època té el seu timbre; l'egipci passa per distorsió (eren aspres de
   debò), el de claus és apagat (les claus obertes enfosqueixen el so).

   Les notes arriben amb temps d'AudioContext (des del Transport), així el
   so és el rellotge mestre i la imatge el segueix.
   ========================================================================= */

const AUDIO = (() => {
  const FONAMENTAL = window.MUSEU.FONAMENTAL;
  const hz = s => 440 * Math.pow(2, (FONAMENTAL + s - 69) / 12);

  const TIMBRES = {
    egipte:  { base: 520, oct: 3.2, q: 2.6, a: .05, r: .18, dist: .55, vib: [4.2, .07], scoop: -90, jitter: 28, rev: .25, ale: .55, formant: [1100, 7, 1.4], vol: -14 },
    cornu:   { base: 240, oct: 3.5, q: 1.6, a: .09, r: .35, dist: .12, vib: [4.4, .03], scoop: -60, jitter: 10, rev: .6,  ale: .35, formant: [650, 6, 1],    vol: -6 },
    natural: { base: 720, oct: 3.0, q: 1.2, a: .03, r: .22, dist: 0,   vib: [5.0, .035], scoop: -35, jitter: 5, rev: .45, ale: .25, formant: [1450, 5, 1.2], vol: -10 },
    claus:   { base: 360, oct: 2.4, q: .8,  a: .04, r: .22, dist: 0,   vib: [5.2, .04], scoop: -25, jitter: 6,  rev: .4,  ale: .3,  formant: [900, 3, 1],    vol: -7 },
    pistons: { base: 640, oct: 3.1, q: 1.2, a: .025, r: .18, dist: 0,  vib: [5.2, .03], scoop: -30, jitter: 4,  rev: .32, ale: .22, formant: [1300, 5, 1],   vol: -10 },
    moderna: { base: 900, oct: 3.4, q: 1.4, a: .02, r: .2,  dist: 0,   vib: [5.6, .05], scoop: -45, jitter: 2,  rev: .3,  ale: .2,  formant: [1500, 6, 1.3], vol: -11 },

    // Corda fregada: la dent de serra ÉS el moviment de Helmholtz d'una corda fregada.
    // El que canvia d'època a època és la caixa (`cos`: ressonàncies de fusta, pell o
    // "bridge hill" cap als 2,5-3 kHz), el vibrato i el soroll de l'arc.
    rabab:      { base: 900,  oct: 2.4, q: 3,   a: .07, r: .2,  dist: .18, vib: [5.5, .03],  scoop: -15, jitter: 14, rev: .3,  ale: .55, formant: [1500, 8, 2],   cos: [[700, 4, 2]], vol: -15 },
    fidula:     { base: 700,  oct: 2.6, q: 1.5, a: .08, r: .22, dist: 0,   vib: [5, .01],    scoop: -10, jitter: 9,  rev: .45, ale: .4,  formant: [1200, 5, 1.5], cos: [[450, 4, 1.5]], vol: -12 },
    lira:       { base: 650,  oct: 2.8, q: 1.2, a: .1,  r: .3,  dist: 0,   vib: [5, .015],   scoop: -8,  jitter: 6,  rev: .5,  ale: .3,  formant: [1100, 5, 1.2], cos: [[300, 4, 1.5]], vol: -12 },
    amati:      { base: 800,  oct: 3.0, q: 1,   a: .08, r: .25, dist: 0,   vib: [5, .015],   scoop: -8,  jitter: 5,  rev: .45, ale: .3,  formant: [2500, 4, 1.5], cos: [[280, 5, 2], [450, 3, 1.5]], vol: -12 },
    stradivari: { base: 900,  oct: 3.0, q: 1,   a: .05, r: .2,  dist: 0,   vib: [5.2, .01],  scoop: -6,  jitter: 4,  rev: .55, ale: .28, formant: [2600, 5, 1.4], cos: [[280, 5, 2], [480, 3, 1.5]], vol: -12 },
    // ── Corda pinçada: Karplus-Strong (Tone.PluckSynth). La corda és un retard que
    // es va apagant; `ressona` = quant dura, `apaga` = quant de brillant és.
    llaut:     { tipus: 'pinca', soroll: 2,   apaga: 2200, ressona: .93, cos: [[400, 6, 2]], formant: [1800, 4, 2], rev: .3,  ale: .3,  vol: -4 },
    ud:        { tipus: 'pinca', soroll: 3,   apaga: 3500, ressona: .95, cos: [[250, 4, 2]], formant: [1500, 3, 1.5], rev: .4, ale: .35, vol: -4 },
    vihuela:   { tipus: 'pinca', soroll: 1,   apaga: 3000, ressona: .96, cos: [[220, 4, 2], [450, 2, 1.5]], formant: [2500, 2, 1], rev: .5, ale: .15, vol: -5 },
    barroca:   { tipus: 'pinca', soroll: 2,   apaga: 4500, ressona: .94, cos: [[300, 4, 2]], formant: [2600, 3, 1.5], rev: .45, ale: .12, vol: -9 },
    torres:    { tipus: 'pinca', soroll: 1,   apaga: 3200, ressona: .97, cos: [[100, 5, 1.5], [220, 4, 2]], formant: [2500, 2, 1], rev: .45, ale: .12, vol: -4 },
    electrica: { tipus: 'pinca', soroll: 1.5, apaga: 5000, ressona: .98, dist: .25, cos: [[1200, 4, 1]], formant: [3000, 3, 1], rev: .3, ale: .1, vol: -8 },

    // ── Corda percudida: polifònic amb parcials (com més parcials i més llarga la
    // caiguda, més "piano de concert"). El santur, metàl·lic, fa servir FM.
    santur:     { tipus: 'percudida', fm: true, harm: 3.5, index: 5, cau: 1.4, cos: [[900, 3, 1.5]], formant: [3000, 3, 1], rev: .4, ale: .25, vol: -16 },
    clavicordi: { tipus: 'percudida', parcials: [1, .6, .4, .25, .15, .1], cau: 1.0, sost: .15, cos: [[300, 3, 1.5]], formant: [1800, -3, 1], rev: .4, ale: .1, vol: -15 },
    cristofori: { tipus: 'percudida', parcials: [1, .5, .35, .2, .12, .08, .05], cau: 1.6, cos: [[250, 3, 1.5]], formant: [2200, 2, 1], rev: .45, ale: .18, vol: -12 },
    fortepiano: { tipus: 'percudida', parcials: [1, .45, .3, .15, .1, .06], cau: 1.2, cos: [[300, 3, 1.5]], formant: [2500, 3, 1], rev: .4, ale: .15, vol: -12 },
    ferro:      { tipus: 'percudida', parcials: [1, .7, .5, .35, .22, .15, .1, .07], cau: 2.8, cos: [[120, 4, 1.5]], formant: [2600, 2, 1], rev: .55, ale: .12, vol: -14 },
    modern:     { tipus: 'percudida', parcials: [1, .6, .45, .3, .2, .12, .08, .05], cau: 3.2, cos: [[110, 4, 1.5]], formant: [2800, 2, 1], rev: .5, ale: .1, vol: -14 },

    // ── Bisell: oscil·lador suau + alè sostingut (soroll filtrat) durant tota la nota.
    os:          { tipus: 'vent', osc: 'triangle', base: 900,  oct: 1.5, q: .7, a: .09, r: .2,  vib: [4.5, .05],  scoop: -30, jitter: 35, buf: .95, rev: .6,  ale: .2,  formant: [1200, 2, 1],   vol: -12 },
    chi:         { tipus: 'vent', osc: 'triangle', base: 1300, oct: 1.5, q: .8, a: .07, r: .2,  vib: [5, .025],   scoop: -15, jitter: 12, buf: .6,  rev: .45, ale: .15, formant: [2500, 4, 1.5], vol: -12 },
    renaixement: { tipus: 'vent', osc: 'triangle', base: 900,  oct: 1.2, q: .7, a: .06, r: .2,  vib: [5, .01],    scoop: -10, jitter: 8,  buf: .5,  rev: .5,  ale: .15, formant: [1500, 2, 1],   vol: -11 },
    traverso:    { tipus: 'vent', osc: 'triangle', base: 1000, oct: 1.3, q: .7, a: .06, r: .2,  vib: [5, .015],   scoop: -10, jitter: 6,  buf: .45, rev: .5,  ale: .15, formant: [1700, 2, 1],   vol: -11 },
    boehm:       { tipus: 'vent', osc: 'triangle', base: 1600, oct: 1.5, q: .8, a: .04, r: .18, vib: [5.2, .03],  scoop: -8,  jitter: 3,  buf: .32, rev: .45, ale: .12, formant: [2200, 3, 1],   vol: -12 },
    flauta:      { tipus: 'vent', osc: 'triangle', base: 2000, oct: 1.5, q: .8, a: .05, r: .2,  vib: [5.4, .045], scoop: -8,  jitter: 2,  buf: .28, rev: .45, ale: .1,  formant: [2400, 3, 1],   vol: -12 },

    // Viola, violoncel i contrabaix: la mateixa corda fregada amb caixes més grans
    // (ressonàncies més greus) i, al barroc, gairebé sense vibrato.
    braccio:        { base: 700, oct: 2.8, q: 1,   a: .08, r: .25, dist: 0, vib: [5, .012],  scoop: -8, jitter: 6, rev: .45, ale: .3,  formant: [2200, 4, 1.4], cos: [[250, 5, 2], [420, 3, 1.5]], vol: -12 },
    'viola-amati':  { base: 750, oct: 2.9, q: 1,   a: .08, r: .25, dist: 0, vib: [5, .015],  scoop: -8, jitter: 5, rev: .45, ale: .3,  formant: [2300, 4, 1.4], cos: [[230, 5, 2], [420, 3, 1.5]], vol: -12 },
    medici:         { base: 600, oct: 2.8, q: 1,   a: .09, r: .3,  dist: 0, vib: [5, .012],  scoop: -6, jitter: 5, rev: .55, ale: .28, formant: [1800, 4, 1.3], cos: [[180, 5, 2], [350, 4, 1.5]], vol: -11 },
    viola:          { base: 900, oct: 3.1, q: 1,   a: .07, r: .3,  dist: 0, vib: [5.6, .06], scoop: -10, jitter: 3, rev: .45, ale: .2, formant: [2400, 5, 1.3], cos: [[220, 5, 2], [420, 3, 1.5], [1000, -2, 1.5]], vol: -12 },
    basso:          { base: 500, oct: 2.8, q: 1,   a: .1,  r: .3,  dist: 0, vib: [5, .01],   scoop: -6, jitter: 6, rev: .5,  ale: .3,  formant: [1400, 3, 1.2], cos: [[120, 5, 2], [250, 4, 1.5]], vol: -10 },
    'cello-barroc': { base: 600, oct: 2.9, q: 1,   a: .08, r: .3,  dist: 0, vib: [5, .012],  scoop: -6, jitter: 4, rev: .5,  ale: .25, formant: [1600, 4, 1.3], cos: [[110, 5, 2], [230, 4, 1.5]], vol: -10 },
    cello:          { base: 750, oct: 3.0, q: 1,   a: .08, r: .35, dist: 0, vib: [5.5, .06], scoop: -10, jitter: 3, rev: .45, ale: .18, formant: [1800, 5, 1.3], cos: [[100, 6, 2], [220, 4, 1.5]], vol: -10 },
    violone:        { base: 450, oct: 2.6, q: 1.5, a: .1,  r: .3,  dist: 0, vib: [5, .005],  scoop: -5, jitter: 6, rev: .5,  ale: .4,  formant: [1200, 4, 1.5], cos: [[90, 5, 2], [200, 4, 1.5]], vol: -8 },
    cb3:            { base: 400, oct: 2.7, q: 1,   a: .1,  r: .35, dist: 0, vib: [5, .03],   scoop: -8, jitter: 5, rev: .45, ale: .3,  formant: [1000, 4, 1.3], cos: [[70, 6, 2], [160, 4, 1.5]], vol: -7 },
    cb:             { base: 450, oct: 2.8, q: 1,   a: .1,  r: .35, dist: 0, vib: [5.3, .04], scoop: -8, jitter: 3, rev: .45, ale: .22, formant: [1100, 4, 1.3], cos: [[60, 6, 2], [150, 4, 1.5]], vol: -7 },
    // Pinçats greus i arpes (Karplus-Strong): budell apagat, metall brillant i llarg.
    'cb-jazz':      { tipus: 'pinca', soroll: 1, apaga: 900,  ressona: .96,  cos: [[80, 6, 1.5]],  formant: [700, 3, 1],    rev: .25, ale: .2,  vol: 2 },
    'arpa-egipcia': { tipus: 'pinca', soroll: 1, apaga: 2500, ressona: .92,  cos: [[300, 4, 2]],   formant: [1800, 3, 1.5], rev: .45, ale: .1,  vol: -5, veus: 10 },
    'arpa-celta':   { tipus: 'pinca', soroll: 2, apaga: 6500, ressona: .985, cos: [[400, 3, 2]],   formant: [3200, 4, 1.2], rev: .6,  ale: .1,  vol: -8, veus: 10 },
    'arpa-dos':     { tipus: 'pinca', soroll: 1, apaga: 3500, ressona: .95,  cos: [[250, 3, 2]],   formant: [2200, 2, 1.2], rev: .5,  ale: .1,  vol: -6, veus: 10 },
    'arpa-1770':    { tipus: 'pinca', soroll: 1, apaga: 3800, ressona: .96,  cos: [[220, 3, 2]],   formant: [2400, 2, 1.2], rev: .5,  ale: .1,  vol: -7, veus: 12 },
    'arpa-erard':   { tipus: 'pinca', soroll: 1, apaga: 4000, ressona: .965, cos: [[200, 4, 1.5]], formant: [2500, 2, 1],   rev: .55, ale: .1,  vol: -7, veus: 12 },
    arpa:           { tipus: 'pinca', soroll: 1, apaga: 4200, ressona: .97,  cos: [[180, 4, 1.5]], formant: [2600, 2, 1],   rev: .55, ale: .08, vol: -7, veus: 14 },

    // ── Canya doble (dent de serra nasal amb formants alts) i simple (quadrada: el tub
    // cilíndric del clarinet només fa harmònics senars, i l'ona quadrada també).
    oboe:              { tipus: 'vent', osc: 'sawtooth', base: 1400, oct: 1.2, q: 2,   a: .03, r: .12, vib: [5.2, .035], scoop: -10, jitter: 2,  buf: .12, rev: .4,  ale: .15, formant: [1100, 8, 2],   cos: [[2900, 6, 2]], vol: -16 },
    'oboe-barroc':     { tipus: 'vent', osc: 'sawtooth', base: 1100, oct: 1.2, q: 1.6, a: .04, r: .14, vib: [5, .015],   scoop: -10, jitter: 4,  buf: .12, rev: .45, ale: .15, formant: [1000, 6, 1.8], cos: [[2600, 4, 2]], vol: -15 },
    xirimia:           { tipus: 'vent', osc: 'sawtooth', base: 1800, oct: 1.2, q: 2,   a: .03, r: .12, dist: .15, vib: [5, .01], scoop: -15, jitter: 8, buf: .1, rev: .3, ale: .2, formant: [1300, 9, 2], cos: [[3000, 6, 2]], vol: -17 },
    aulos:             { tipus: 'vent', osc: 'sawtooth', base: 1300, oct: 1.2, q: 2,   a: .04, r: .14, dist: .1,  vib: [5, .02], scoop: -20, jitter: 10, buf: .15, rev: .45, ale: .2, formant: [1200, 7, 2], cos: [[2500, 5, 2]], vol: -16 },
    tenora:            { tipus: 'vent', osc: 'sawtooth', base: 1900, oct: 1.2, q: 1.8, a: .03, r: .14, vib: [5.5, .07], scoop: -15, jitter: 3,  buf: .1,  rev: .4,  ale: .15, formant: [1400, 8, 1.8], cos: [[3200, 6, 2]], vol: -17 },
    clarinet:          { tipus: 'vent', osc: 'square',   base: 1300, oct: 1.5, q: 1,   a: .04, r: .15, vib: [5, .01],    scoop: -6,  jitter: 2,  buf: .12, rev: .45, ale: .12, formant: [1500, 4, 1.5], cos: [[3000, 3, 2]], vol: -15 },
    memet:             { tipus: 'vent', osc: 'square',   base: 1000, oct: 1.4, q: 1.2, a: .05, r: .15, dist: .1, vib: [5, .03], scoop: -20, jitter: 15, buf: .2, rev: .5, ale: .2, formant: [1200, 5, 1.5], vol: -15 },
    chalumeau:         { tipus: 'vent', osc: 'square',   base: 800,  oct: 1.2, q: 1,   a: .05, r: .15, vib: [5, .01],    scoop: -8,  jitter: 5,  buf: .15, rev: .45, ale: .12, formant: [900, 4, 1.5],  vol: -14 },
    'clarinet-barroc': { tipus: 'vent', osc: 'square',   base: 1100, oct: 1.4, q: 1,   a: .05, r: .15, vib: [5, .01],    scoop: -8,  jitter: 5,  buf: .13, rev: .45, ale: .12, formant: [1300, 4, 1.5], vol: -15 },
    'clarinet-classic':{ tipus: 'vent', osc: 'square',   base: 1200, oct: 1.4, q: 1,   a: .05, r: .15, vib: [5, .012],   scoop: -6,  jitter: 3,  buf: .12, rev: .5,  ale: .12, formant: [1400, 3, 1.5], vol: -15 },
    dulcia:            { tipus: 'vent', osc: 'sawtooth', base: 700,  oct: 1.4, q: 1.4, a: .05, r: .16, vib: [5, .008],   scoop: -8,  jitter: 6,  buf: .1,  rev: .55, ale: .15, formant: [500, 6, 1.5],  cos: [[1200, 4, 1.5]], vol: -12 },
    'fagot-barroc':    { tipus: 'vent', osc: 'sawtooth', base: 800,  oct: 1.4, q: 1.4, a: .05, r: .16, vib: [5, .01],    scoop: -8,  jitter: 4,  buf: .1,  rev: .5,  ale: .15, formant: [500, 6, 1.5],  cos: [[1150, 5, 1.5]], vol: -12 },
    fagot:             { tipus: 'vent', osc: 'sawtooth', base: 950,  oct: 1.4, q: 1.4, a: .04, r: .16, vib: [5.2, .03],  scoop: -8,  jitter: 2,  buf: .1,  rev: .45, ale: .12, formant: [480, 6, 1.5],  cos: [[1150, 5, 1.5], [2800, 3, 2]], vol: -12 },
    // ── Metall greu: el mateix model de llavis que la trompeta, amb filtres més baixos.
    // La trompa sona fosca perquè el pavelló mira enrere (formant agut atenuat).
    olifant:          { base: 380, oct: 3,   q: 2,   a: .06, r: .25, dist: .3, vib: [4.5, .03], scoop: -80, jitter: 25, rev: .45, ale: .5,  formant: [800, 6, 1.5], vol: -11 },
    'trompa-natural': { base: 300, oct: 3,   q: 1.2, a: .07, r: .3,  dist: 0,  vib: [4.8, .02], scoop: -40, jitter: 8,  rev: .55, ale: .3,  formant: [450, 5, 1.2], cos: [[1200, -3, 1.5]], vol: -8 },
    trompa:           { base: 350, oct: 3.2, q: 1.2, a: .06, r: .3,  dist: 0,  vib: [5, .025],  scoop: -30, jitter: 3,  rev: .5,  ale: .2,  formant: [500, 5, 1.2], cos: [[1300, -3, 1.5]], vol: -8 },
    sacabutx:         { base: 400, oct: 3,   q: 1,   a: .05, r: .2,  dist: 0,  vib: [5, .01],   scoop: -20, jitter: 5,  rev: .55, ale: .25, formant: [700, 4, 1.2], vol: -9 },
    trombo:           { base: 500, oct: 3.4, q: 1.3, a: .04, r: .2,  dist: 0,  vib: [5, .02],   scoop: -30, jitter: 3,  rev: .45, ale: .25, formant: [900, 6, 1.3], vol: -9 },
    serpent:          { base: 250, oct: 2.5, q: 1.5, a: .08, r: .25, dist: 0,  vib: [4.5, .03], scoop: -40, jitter: 20, rev: .55, ale: .4,  formant: [400, 5, 1.5], vol: -6 },
    figle:            { base: 350, oct: 2.8, q: 1.2, a: .06, r: .22, dist: 0,  vib: [5, .02],   scoop: -30, jitter: 10, rev: .5,  ale: .3,  formant: [600, 5, 1.3], vol: -7 },
    tuba:             { base: 280, oct: 3.2, q: 1.2, a: .06, r: .25, dist: 0,  vib: [5, .02],   scoop: -25, jitter: 3,  rev: .45, ale: .25, formant: [400, 6, 1.2], cos: [[120, 4, 1.5]], vol: -5 },

    // ── Membranes afinades: MembraneSynth (la pell cau de to just després del cop).
    timbal:  { tipus: 'membrana', decau: 1.8, octaves: 1.2, caiguda: .03, cos: [[200, 4, 1.5]], formant: [800, 3, 1],   rev: .5, ale: .35, vol: -4 },
    naqqara: { tipus: 'membrana', decau: .4,  octaves: 1.5, caiguda: .02, cos: [[500, 4, 1.5]], formant: [1500, 4, 1.5], rev: .3, ale: .5,  vol: -6 },
    // ── Percussió sense altura: un banc de sons (bombo, caixa, plats...).
    bateria: { tipus: 'bateria', rev: .25, vol: -4, formant: [3000, 0, 1] },
    // ── Làmines i campanes (FM): la relació entre portadora i moduladora decideix si sona a
    // fusta (≈4, parcials gairebé harmònics) o a bronze (relacions estranyes, llargues).
    xilofon:         { tipus: 'percudida', fm: true, harm: 3.93, index: 1.2, cau: .5,  cos: [[900, 3, 1.5]],  formant: [3000, 3, 1], rev: .35, ale: .2,  vol: -12 },
    'xilofon-palla': { tipus: 'percudida', fm: true, harm: 4,    index: 1,   cau: .28, cos: [[700, 3, 1.5]],  formant: [2500, 2, 1], rev: .3,  ale: .25, vol: -12 },
    marimba:         { tipus: 'percudida', fm: true, harm: 4,    index: .7,  cau: 1.1, cos: [[220, 4, 1.5]],  formant: [1500, 2, 1], rev: .45, ale: .1,  vol: -10 },
    gamelan:         { tipus: 'percudida', fm: true, harm: 2.76, index: 3,   cau: 2.6, cos: [[600, 3, 1.5]],  formant: [2500, 3, 1], rev: .55, ale: .15, vol: -15 },
    balafon:         { tipus: 'percudida', fm: true, harm: 3.9,  index: 1.5, cau: .5,  dist: .25, cos: [[400, 5, 1.5]], formant: [1800, 4, 1.2], rev: .35, ale: .2, vol: -13 },
    timbila:         { tipus: 'percudida', fm: true, harm: 3.9,  index: 1.4, cau: .6,  dist: .2, cos: [[300, 5, 1.5]], formant: [1600, 4, 1.2], rev: .35, ale: .2, vol: -12 },
    // Marimba de carbasses: les membranes de les carbasses fan un brunzit («charleo»).
    'marimba-antiga':{ tipus: 'percudida', fm: true, harm: 4,    index: .9,  cau: .9,  dist: .15, cos: [[250, 4, 1.5]], formant: [1400, 4, 1.2], rev: .4, ale: .15, vol: -11 },
    'campanes-tub':  { tipus: 'percudida', fm: true, harm: 2.76, index: 4,   cau: 3.5, cos: [[700, 3, 1.5]],  formant: [2500, 2, 1], rev: .6,  ale: .1,  vol: -16 },
    kebyar:          { tipus: 'percudida', fm: true, harm: 3.0,  index: 3,   cau: 1.2, cos: [[900, 3, 1.5]],  formant: [3000, 4, 1], rev: .45, ale: .2,  vol: -15 },
    // Vibràfon: el motor obre i tanca els tubs → trèmolo d'amplitud.
    vibrafon:        { tipus: 'percudida', fm: true, harm: 4,    index: .8,  cau: 3,   tremolo: [5.5, .55], cos: [[600, 3, 1.5]], formant: [2500, 2, 1], rev: .45, ale: .05, vol: -14 },
    orff:            { tipus: 'percudida', fm: true, harm: 4,    index: .6,  cau: 1.8, cos: [[700, 3, 1.5]],  formant: [2200, 2, 1], rev: .4,  ale: .08, vol: -14 },
    campana:         { tipus: 'percudida', fm: true, harm: 1.4,  index: 6,   cau: 3.5, cos: [[500, 3, 1.5]],  formant: [2000, 2, 1], rev: .6,  ale: .1,  vol: -17 },
    glockenspiel:    { tipus: 'percudida', fm: true, harm: 5.4,  index: 1.5, cau: 1.4, cos: [[2000, 3, 1.5]], formant: [4000, 2, 1], rev: .45, ale: .08, vol: -19 },
    celesta:         { tipus: 'percudida', fm: true, harm: 4.01, index: 1.2, cau: 1.6, cos: [[1200, 3, 1.5]], formant: [3500, 2, 1], rev: .5,  ale: .05, vol: -15 },

    violi:      { base: 1100, oct: 3.2, q: 1,   a: .07, r: .3,  dist: 0,   vib: [5.8, .07],  scoop: -10, jitter: 3,  rev: .45, ale: .2,  formant: [2800, 6, 1.3], cos: [[280, 5, 2], [480, 3, 1.5], [1100, -3, 1.5]], vol: -12 },
  };

  let llest = false, master, reverb, veus = {}, ale, aleFiltre, sfx = {}, bordoSynth, buf;

  async function init() {
    if (llest) return;
    await Tone.start();
    Tone.getContext().lookAhead = 0.08;

    const limit = new Tone.Limiter(-1).toDestination();
    master = new Tone.Compressor({ threshold: -18, ratio: 3, attack: .01, release: .2 }).connect(limit);
    reverb = new Tone.Reverb({ decay: 2.6, preDelay: .02, wet: 1 }).connect(master);
    await reverb.generate();

    const sortida = (t, cadena) => {
      const nivell = new Tone.Gain(Tone.dbToGain(t.vol));
      const envio = new Tone.Gain(t.rev);
      (t.cos || []).forEach(([f, g, q]) => cadena.push(new Tone.Filter({ type: 'peaking', frequency: f, gain: g, Q: q })));
      cadena.push(new Tone.Filter({ type: 'peaking', frequency: t.formant[0], gain: t.formant[1], Q: t.formant[2] }), nivell);
      nivell.connect(master); nivell.connect(envio); envio.connect(reverb);
      return cadena;
    };
    for (const [id, t] of Object.entries(TIMBRES)) {
      if (t.tipus === 'pinca') {
        // Sis cordes que poden sonar alhora: un PluckSynth per corda, en roda.
        const roda = Array.from({ length: t.veus || 6 }, () => new Tone.PluckSynth({ attackNoise: t.soroll, dampening: t.apaga, resonance: t.ressona, release: 1.2 }));
        const entrada = new Tone.Gain(1);
        roda.forEach(p => p.connect(entrada));
        const cadena = t.dist ? [new Tone.Distortion({ distortion: t.dist, oversample: '2x' })] : [];
        entrada.chain(...sortida(t, cadena));
        veus[id] = { roda, k: 0, t };
        continue;
      }
      if (t.tipus === 'membrana') {
        const roda = Array.from({ length: 4 }, () => new Tone.MembraneSynth({ pitchDecay: t.caiguda, octaves: t.octaves,
          envelope: { attack: .002, decay: t.decau, sustain: 0, release: .6 } }));
        const entrada = new Tone.Gain(1);
        roda.forEach(m => m.connect(entrada));
        entrada.chain(...sortida(t, []));
        veus[id] = { roda, k: 0, t };
        continue;
      }
      if (t.tipus === 'bateria') {
        const entrada = new Tone.Gain(1);
        entrada.chain(...sortida(t, []));
        const memb = (nota, decay, oct = 4, vol = 0) => ({ s: new Tone.MembraneSynth({ pitchDecay: .04, octaves: oct, envelope: { attack: .001, decay, sustain: 0, release: .1 }, volume: vol }).connect(entrada), nota });
        const soroll = (tipus, decay, f, q, vol) => {
          const fl = new Tone.Filter({ type: 'bandpass', frequency: f, Q: q }).connect(entrada);
          return { n: new Tone.NoiseSynth({ noise: { type: tipus }, envelope: { attack: .001, decay, sustain: 0, release: .05 }, volume: vol }).connect(fl) };
        };
        const metall = (freq, decay, harm, mod, ress, vol) => ({ m: new Tone.MetalSynth({ envelope: { attack: .001, decay, release: .2 }, harmonicity: harm, modulationIndex: mod, resonance: ress, octaves: 1.5, volume: vol }).connect(entrada), freq });
        // Cada so: una o dues capes (pell + soroll, o metall).
        const banc = [
          [memb('C1', .45, 6, 2)],                                          // 0 bombo
          [memb('E3', .12, 2, -6), soroll('white', .18, 3000, .8, -6)],     // 1 caixa
          [metall(300, 1.4, 5.1, 32, 4000, -10)],                           // 2 plats
          [metall(400, .06, 5.1, 32, 6000, -14)],                           // 3 charles
          [memb('G2', .3, 3, -2)],                                          // 4 tom
          [memb('A1', .35, 3, 0), soroll('brown', .12, 300, 1, -12)],       // 5 djembé greu
          [memb('D3', .18, 2, -4)],                                         // 6 djembé to
          [memb('F3', .05, 2, -8), soroll('white', .08, 3500, 1.2, -6)],    // 7 djembé cop
          [memb('F1', .6, 5, 2), soroll('pink', .2, 200, 1, -10)],          // 8 davul
          [metall(500, .8, 5.1, 20, 5000, -12)],                            // 9 zil
          [metall(1200, 1.6, 5.1, 6, 8000, -16)],                           // 10 triangle
        ];
        veus[id] = { banc, t };
        continue;
      }
      if (t.tipus === 'percudida') {
        const poly = t.fm
          ? new Tone.PolySynth(Tone.FMSynth, { harmonicity: t.harm, modulationIndex: t.index,
              envelope: { attack: .002, decay: t.cau, sustain: 0, release: 1 }, modulationEnvelope: { attack: .002, decay: .4, sustain: 0, release: .3 } })
          : new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'custom', partials: t.parcials },
              envelope: { attack: .003, decay: t.cau, sustain: t.sost || 0, release: Math.min(1.2, t.cau / 2) } });
        poly.maxPolyphony = 24;
        const efectes = [];
        if (t.dist) efectes.push(new Tone.Distortion({ distortion: t.dist, oversample: '2x' }));
        if (t.tremolo) efectes.push(new Tone.Tremolo({ frequency: t.tremolo[0], depth: t.tremolo[1], spread: 0 }).start());
        poly.chain(...sortida(t, efectes));
        veus[id] = { poly, t };
        continue;
      }
      const synth = new Tone.MonoSynth({
        oscillator: { type: t.osc || 'sawtooth' },
        envelope: { attack: t.a, decay: .2, sustain: .82, release: t.r },
        filter: { type: 'lowpass', Q: t.q, rolloff: -24 },
        filterEnvelope: { attack: t.a * 1.6, decay: .3, sustain: .55, release: t.r, baseFrequency: t.base, octaves: t.oct },
      });
      const vib = new Tone.Vibrato({ frequency: t.vib[0], depth: t.vib[1] });
      const cadena = [vib];
      if (t.dist) cadena.push(new Tone.Distortion({ distortion: t.dist, oversample: '2x' }));
      synth.chain(...sortida(t, cadena));
      veus[id] = { synth, t };
    }

    // Bordó (lira da braccio): dues cordes que sonen alhora sota la melodia → polifònic.
    const lira = TIMBRES.lira;
    bordoSynth = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: .25, decay: .3, sustain: .9, release: .6 },
      filter: { type: 'lowpass', Q: lira.q, rolloff: -24 },
      filterEnvelope: { attack: .3, decay: .4, sustain: .6, release: .6, baseFrequency: 420, octaves: 2.2 },
    });
    const bordoNivell = new Tone.Gain(Tone.dbToGain(-19));
    bordoSynth.chain(new Tone.Filter({ type: 'peaking', frequency: 300, gain: 4, Q: 1.5 }), bordoNivell);
    bordoNivell.connect(master);
    bordoNivell.connect(new Tone.Gain(.5).connect(reverb));

    aleFiltre = new Tone.Filter({ type: 'bandpass', frequency: 1900, Q: .9 }).connect(master);
    const bufFiltre = new Tone.Filter({ type: 'bandpass', frequency: 2600, Q: .8 }).connect(master);
    buf = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: .03, decay: .1, sustain: .35, release: .12 }, volume: -22 }).connect(bufFiltre);
    ale = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: .004, decay: .09, sustain: 0, release: .02 }, volume: -16 }).connect(aleFiltre);

    // ── Efectes d'interfície i de muntatge ──
    const filtreRebobina = new Tone.Filter({ type: 'bandpass', frequency: 2400, Q: 1.4 }).connect(master);
    sfx.vent = { synth: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: .25, decay: .1, sustain: 1, release: .35 }, volume: -20 }).connect(filtreRebobina), filtre: filtreRebobina };
    sfx.tic = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: .001, decay: .04, sustain: 0, release: .02 }, volume: -18 }).connect(master);
    sfx.pop = new Tone.MembraneSynth({ pitchDecay: .04, octaves: 3, envelope: { attack: .001, decay: .22, sustain: 0, release: .05 }, volume: -12 }).connect(master);
    sfx.cop = new Tone.MembraneSynth({ pitchDecay: .02, octaves: 5, envelope: { attack: .001, decay: .35, sustain: 0, release: .05 }, volume: -6 }).connect(master);
    sfx.veu = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: .002, decay: .05, sustain: 0, release: .02 }, volume: -24 }).connect(master);
    sfx.clic = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: .001, decay: .06, sustain: 0, release: .03 }, volume: -16 }).connect(master);
    sfx.campana = new Tone.FMSynth({ harmonicity: 3.01, modulationIndex: 6, envelope: { attack: .002, decay: .8, sustain: 0, release: .4 }, modulationEnvelope: { attack: .002, decay: .3, sustain: 0, release: .2 }, volume: -16 }).connect(master);

    llest = true;
  }

  const ara = () => Tone.now();

  // Nota d'època. `temps` és temps d'AudioContext.
  function nota(timbre, s, dur, vel = .8, temps = ara()) {
    if (!llest) return;
    const v = veus[timbre], t = v.t;
    if (t.tipus === 'pinca') {
      try {
        const corda = v.roda[v.k++ % v.roda.length];
        corda.triggerAttackRelease(hz(s), Math.max(dur, .4), temps, vel);
        ale.triggerAttackRelease(.03, temps, vel * t.ale);
      } catch (e) { /* salt */ }
      return;
    }
    if (t.tipus === 'membrana') {
      try {
        const m = v.roda[v.k++ % v.roda.length];
        m.triggerAttackRelease(hz(s), Math.max(dur, .3), temps, vel);
        ale.triggerAttackRelease(.02, temps, vel * t.ale);
      } catch (e) { /* salt */ }
      return;
    }
    if (t.tipus === 'bateria') {
      (v.banc[s] || []).forEach(capa => {
        try {
          if (capa.s) capa.s.triggerAttackRelease(capa.nota, .2, temps, vel);
          else if (capa.n) capa.n.triggerAttackRelease(.2, temps, vel);
          else if (capa.m) { capa.m.frequency.setValueAtTime(capa.freq, temps); capa.m.triggerAttackRelease(.2, temps, vel); }
        } catch (e) { /* salt */ }
      });
      return;
    }
    if (t.tipus === 'percudida') {
      try {
        v.poly.triggerAttackRelease(hz(s), Math.max(dur, .3), temps, vel);
        ale.triggerAttackRelease(.02, temps, vel * t.ale);
      } catch (e) { /* salt */ }
      return;
    }
    const synth = v.synth;
    const jitter = (Math.random() * 2 - 1) * t.jitter;
    // Després d'un salt enrere el Transport pot demanar una nota anterior a
    // l'última ja programada (lookahead): Tone ho rebutja. Perdre aquesta nota
    // és millor que trencar el callback del Transport.
    try {
      synth.detune.cancelScheduledValues(temps);
      synth.detune.setValueAtTime(t.scoop + jitter, temps);
      synth.detune.linearRampToValueAtTime(jitter, temps + .06);
      synth.triggerAttackRelease(hz(s), dur, temps, vel);
      ale.triggerAttackRelease(.05, temps, vel * t.ale);
      if (t.buf) buf.triggerAttackRelease(dur, temps, vel * t.buf);
    } catch (e) { /* nota perduda en un salt */ }
  }

  function silencia() {
    if (!llest) return;
    const t = ara();
    Object.values(veus).forEach(v => {
      try {
        if (v.synth) v.synth.triggerRelease(t);
        if (v.poly) v.poly.releaseAll(t);
      } catch (e) { /* ja programada més enllà */ }
    });
    try { buf.triggerRelease(t); } catch (e) { /* res */ }
    try { bordoSynth.releaseAll(t); } catch (e) { /* res */ }
  }

  // Fragment fora del Transport (preguntes d'escolta). Retorna la durada.
  function fragment(parada, offset = .05) {
    const t0 = ara() + offset;
    parada.melodia.forEach(n => nota(parada.timbre, n.s, n.d, n.v, t0 + n.t));
    if (parada.bordo) bordo(parada.bordo, parada.melodia.reduce((m, n) => Math.max(m, n.t + n.d), 0), t0);
    const fi = parada.melodia.reduce((m, n) => Math.max(m, n.t + n.d), 0);
    return fi + .4;
  }

  // Mateix risc que a nota(): un salt enrere pot demanar temps ja superats.
  const segur = fn => { try { fn(); } catch (e) { /* efecte perdut en un salt */ } };

  function rebobina(temps, dur) {
    if (!llest) return;
    segur(() => rebobinaAra(temps, dur));
  }
  function rebobinaAra(temps, dur) {
    const f = sfx.vent.filtre.frequency;
    f.cancelScheduledValues(temps);
    f.setValueAtTime(3200, temps);
    f.exponentialRampToValueAtTime(380, temps + dur);
    sfx.vent.synth.triggerAttackRelease(dur, temps, .6);
    const n = Math.floor(dur / .11);
    for (let i = 0; i < n; i++) sfx.tic.triggerAttackRelease(hz(48 - i * 1.4), .03, temps + i * .11, .5);
  }

  const aterra = (temps = ara()) => llest && segur(() => sfx.pop.triggerAttackRelease('C3', .2, temps, .7));
  const segell = () => llest && segur(() => sfx.cop.triggerAttackRelease('G1', .3, ara(), 1));
  // Veueta dels investigadors mentre parlen: un pip curt amb una mica de variació.
  const parla = midi => llest && segur(() => sfx.veu.triggerAttackRelease(Tone.Frequency(midi + (Math.random() * 2 - 1), 'midi').toFrequency(), .04, ara(), .5));
  const clic = () => llest && segur(() => sfx.clic.triggerAttackRelease('E6', .05, ara(), .6));
  function encert() {
    if (!llest) return;
    const t = ara();
    segur(() => {
      sfx.campana.triggerAttackRelease('C6', .3, t, .7);
      sfx.campana.triggerAttackRelease('G6', .4, t + .12, .6);
    });
  }
  // L'error no castiga: dues notes suaus que conviden a mirar l'explicació.
  function pista() {
    if (!llest) return;
    const t = ara();
    segur(() => {
      sfx.clic.triggerAttackRelease('A4', .1, t, .5);
      sfx.clic.triggerAttackRelease('E5', .14, t + .12, .5);
    });
  }

  function bordo(notes, dur, temps = ara()) {
    if (!llest) return;
    try { bordoSynth.triggerAttackRelease(notes.map(hz), dur, temps, .7); } catch (e) { /* salt */ }
  }

  return { init, nota, bordo, parla, silencia, fragment, rebobina, aterra, segell, clic, encert, pista, get llest() { return llest; } };
})();

window.AUDIO = AUDIO;

'use strict';
/* =========================================================================
   MUSEU DELS AVANTPASSATS · mecànica dels instruments
   -------------------------------------------------------------------------
   Digitacions REALS calculades a partir de la melodia, no escrites a mà:

   · Pistons: es busca l'harmònic obert més proper per sobre de la nota i
     es baixa la diferència amb la regla de la trompeta
       1 semitò = 2 · 2 = 1 · 3 = 1+2 · 4 = 2+3 · 5 = 1+3 · 6 = 1+2+3
     El Re surt amb l'1, el Do# amb 1+2, el La♭ amb 2+3, com a l'atril.
     L'harmònic 9 (Re) no es fa servir obert, com a la trompeta real.
   · 1818, dos pistons: només arriben a 3 semitons. Si una nota en necessita
     més, es marca "aprox." (aquelles trompetes la feien forçant el llavi).
   · 1796, claus: cada clau oberta escurça el tub i puja la nota. Es parteix
     de l'harmònic de sota i s'obre la clau que salva la diferència
     (clau 1 = la més propera al pavelló = 1 semitò).
   · Sense mecanisme (Egipte, Roma, Barroc): només llavis.
   · Corda pinçada: igual, però el número és el trast (guitarres, ud, vihuela).
   · Corda percudida: nota i octava, i què colpeja la corda (maça, tangent, martell).
   · Bisell: forats tapats d'una flauta de 6 forats en Re, amb ½ per als mig forats
     i forquilles, i l'octava que es treu bufant més fort.
   · Corda fregada: corda més aguda que no passi per sobre de la nota i dit
     de primera posició; si cal anar més amunt, "posició alta".

   Les zones (fraccions del sprite) són on hi ha pintat cada botó/clau a
   img/tr-*.webp; el motor talla aquestes zones del sprite i les mou.
   ========================================================================= */

const MECANICA = (() => {
  const OBERTES = [12, 19, 24, 28, 31, 36, 40, 43, 48];
  const NOTES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  // Codis dels sons de percussió sense altura (el camp `s` de les notes).
  const SONS = ['Bombo', 'Caixa', 'Plats', 'Charles', 'Tom', 'Djembé greu', 'Djembé to', 'Djembé cop', 'Davul', 'Zil', 'Triangle'];
  const BEMOLLS = ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
  const CELLO = [0, 1, 1, 2, 3, 4, 4];   // semitons des de l'aire → dit (1a posició)
  const BAIX = [0, 1, 2, 4, 4];           // mètode Simandl: 1-2-4
  // Pedals de l'arpa, en l'ordre en què l'arpista els té als peus: Re Do Si | Mi Fa Sol La
  const PEDALS = ['Re', 'Do', 'Si', 'Mi', 'Fa', 'Sol', 'La'];
  const rang1 = n => Array.from({ length: n }, (_, i) => i + 1);
  const textTapats = (t, paraula = 'forats') => {
    const u = paraula === 'claus' ? ['clau tancada', 'claus tancades', 'Totes obertes'] : ['forat tapat', 'forats tapats', 'Tot obert'];
    return t === 0 ? u[2] : t < 1 ? `½ ${u[0]}` : `${Math.floor(t)}${t % 1 ? '½' : ''} ${t === 1 ? u[0] : u[1]}`;
  };
  // Amb un 4t pistó (una quarta, 5 semitons) la tuba baixa fins a 11 semitons.
  const BAIXA4 = { 0: [], 1: [2], 2: [1], 3: [1, 2], 4: [2, 3], 5: [4], 6: [2, 4], 7: [1, 4], 8: [1, 2, 4], 9: [2, 3, 4], 10: [1, 3, 4], 11: [1, 2, 3, 4] };
  const BAIXA = { 0: [], 1: [2], 2: [1], 3: [1, 2], 4: [2, 3], 5: [1, 3], 6: [1, 2, 3] };

  const PECES = {
    moderna: { tipus: 'pistons', n: 3, boquet: [.008, .366], recorregut: .1,
      zones: [[.355, .13, .405, .31], [.405, .13, .455, .31], [.455, .13, .505, .31]] },
    pistons: { tipus: 'pistons', n: 2, boquet: [.009, .38], recorregut: .1,
      zones: [[.365, .0, .435, .235], [.46, .0, .535, .235]] },
    // Claus ordenades del pavelló cap enrere: clau 1 = la de més a la dreta.
    claus: { tipus: 'claus', n: 4, boquet: [.008, .394], recorregut: .06,
      zones: [[.697, .55, .761, .79], [.621, .55, .685, .79], [.549, .55, .613, .79], [.475, .55, .539, .79]] },
    // Corda fregada: cordes a l'aire (semitons) i on frega l'arc (`boquet` = punt de contacte).
    rabab: { tipus: 'arc', cordes: [26, 33], noms: ['Re', 'La'], arc: 'arc-medieval', boquet: [.78, .45] },
    fidula: { tipus: 'arc', cordes: [19, 26, 31, 38], noms: ['Sol', 'Re', 'Sol', 'Re'], arc: 'arc-medieval', boquet: [.735, .48] },
    lira: { tipus: 'arc', cordes: [19, 26, 33, 40], noms: ['Sol', 'Re', 'La', 'Mi'], arc: 'arc-medieval', boquet: [.73, .5], bordo: true },
    amati: { tipus: 'arc', cordes: [19, 26, 33, 40], noms: ['Sol', 'Re', 'La', 'Mi'], arc: 'arc-barroc', boquet: [.665, .48] },
    stradivari: { tipus: 'arc', cordes: [19, 26, 33, 40], noms: ['Sol', 'Re', 'La', 'Mi'], arc: 'arc-barroc', boquet: [.66, .5] },
    violi: { tipus: 'arc', cordes: [19, 26, 33, 40], noms: ['Sol', 'Re', 'La', 'Mi'], arc: 'arc-tourte', boquet: [.66, .5] },
    // Corda pinçada: cordes a l'aire (ordenades de greu a agut) i on es pinça.
    llaut: { tipus: 'pinca', cordes: [19, 26], noms: ['Sol', 'Re'], boquet: [.8, .45] },
    ud: { tipus: 'pinca', cordes: [9, 14, 19, 24, 29], noms: ['La', 'Re', 'Sol', 'Do', 'Fa'], boquet: [.72, .45] },
    vihuela: { tipus: 'pinca', cordes: [7, 12, 17, 21, 26, 31], noms: ['Sol', 'Do', 'Fa', 'La', 'Re', 'Sol'], boquet: [.68, .5] },
    // Guitarra barroca: afinació reentrant (la 5a sona aguda), aquí ordenada per altura.
    barroca: { tipus: 'pinca', cordes: [19, 21, 23, 26, 28], noms: ['Sol', 'La', 'Si', 'Re', 'Mi'], boquet: [.8, .48] },
    torres: { tipus: 'pinca', cordes: [4, 9, 14, 19, 23, 28], noms: ['Mi', 'La', 'Re', 'Sol', 'Si', 'Mi'], boquet: [.63, .5] },
    electrica: { tipus: 'pinca', cordes: [4, 9, 14, 19, 23, 28], noms: ['Mi', 'La', 'Re', 'Sol', 'Si', 'Mi'], boquet: [.8, .5] },
    // Corda percudida: què colpeja la corda en cada època.
    santur: { tipus: 'tecla', colpeja: 'maça', boquet: [.5, .45] },
    clavicordi: { tipus: 'tecla', colpeja: 'tangent', boquet: [.55, .5] },
    cristofori: { tipus: 'tecla', colpeja: 'martell de pell', boquet: [.55, .45] },
    fortepiano: { tipus: 'tecla', colpeja: 'martell de pell', boquet: [.55, .4] },
    ferro: { tipus: 'tecla', colpeja: 'martell de feltre', boquet: [.55, .4] },
    modern: { tipus: 'tecla', colpeja: 'martell de feltre', boquet: [.55, .4] },
    // Bisell: forats tapats. La flauta d'os té 5 forats i poques notes.
    os: { tipus: 'forats', n: 5, notes: [40, 38, 36, 33, 31], boquet: [.02, .45] },
    chi: { tipus: 'forats', n: 6, boquet: [.05, .45] },
    renaixement: { tipus: 'forats', n: 6, boquet: [.04, .45] },
    traverso: { tipus: 'forats', n: 6, boquet: [.04, .45] },
    boehm: { tipus: 'forats', n: 6, boquet: [.05, .45] },
    flauta: { tipus: 'forats', n: 6, boquet: [.05, .45] },
    // Viola (Do-Sol-Re-La), violoncel i contrabaix. `dits`: dit segons els semitons des de
    // la corda a l'aire, quan no és el del violí (al violoncel la mà abasta una 3a menor;
    // al contrabaix, un to, amb els dits 1-2-4).
    'fidula-tenor': { tipus: 'arc', cordes: [12, 19, 26], noms: ['Do', 'Sol', 'Re'], arc: 'arc-medieval', boquet: [.735, .48] },
    braccio: { tipus: 'arc', cordes: [12, 19, 26, 33], noms: ['Do', 'Sol', 'Re', 'La'], arc: 'arc-barroc', boquet: [.64, .5] },
    'viola-amati': { tipus: 'arc', cordes: [12, 19, 26, 33], noms: ['Do', 'Sol', 'Re', 'La'], arc: 'arc-barroc', boquet: [.67, .5] },
    medici: { tipus: 'arc', cordes: [12, 19, 26, 33], noms: ['Do', 'Sol', 'Re', 'La'], arc: 'arc-barroc', boquet: [.7, .5] },
    'viola-rom': { tipus: 'arc', cordes: [12, 19, 26, 33], noms: ['Do', 'Sol', 'Re', 'La'], arc: 'arc-tourte', boquet: [.66, .5] },
    viola: { tipus: 'arc', cordes: [12, 19, 26, 33], noms: ['Do', 'Sol', 'Re', 'La'], arc: 'arc-tourte', boquet: [.66, .5] },
    basso: { tipus: 'arc', cordes: [-2, 5, 12, 19], noms: ['Si♭', 'Fa', 'Do', 'Sol'], dits: CELLO, arc: 'arc-barroc', boquet: [.55, .5] },
    'cello-bolonya': { tipus: 'arc', cordes: [0, 7, 14, 21], noms: ['Do', 'Sol', 'Re', 'La'], dits: CELLO, arc: 'arc-barroc', boquet: [.63, .5] },
    'cello-barroc': { tipus: 'arc', cordes: [0, 7, 14, 21], noms: ['Do', 'Sol', 'Re', 'La'], dits: CELLO, arc: 'arc-barroc', boquet: [.63, .5] },
    'cello-pica': { tipus: 'arc', cordes: [0, 7, 14, 21], noms: ['Do', 'Sol', 'Re', 'La'], dits: CELLO, arc: 'arc-tourte', boquet: [.45, .5] },
    'cello-casals': { tipus: 'arc', cordes: [0, 7, 14, 21], noms: ['Do', 'Sol', 'Re', 'La'], dits: CELLO, arc: 'arc-tourte', boquet: [.47, .5] },
    cello: { tipus: 'arc', cordes: [0, 7, 14, 21], noms: ['Do', 'Sol', 'Re', 'La'], dits: CELLO, arc: 'arc-tourte', boquet: [.47, .5] },
    violone: { tipus: 'arc', cordes: [-5, 0, 5, 9, 14, 19], noms: ['Sol', 'Do', 'Fa', 'La', 'Re', 'Sol'], dits: BAIX, arc: 'arc-barroc', boquet: [.72, .5] },
    'violone-barroc': { tipus: 'arc', cordes: [-5, 0, 5, 9, 14, 19], noms: ['Sol', 'Do', 'Fa', 'La', 'Re', 'Sol'], dits: BAIX, arc: 'arc-barroc', boquet: [.72, .5] },
    cb3: { tipus: 'arc', cordes: [-3, 2, 7], noms: ['La', 'Re', 'Sol'], dits: BAIX, arc: 'arc-contrabaix', boquet: [.68, .5] },
    'cb3-bottesini': { tipus: 'arc', cordes: [-3, 2, 7], noms: ['La', 'Re', 'Sol'], dits: BAIX, arc: 'arc-contrabaix', boquet: [.68, .5] },
    'cb-jazz': { tipus: 'pinca', cordes: [-8, -3, 2, 7], noms: ['Mi', 'La', 'Re', 'Sol'], boquet: [.6, .5] },
    cb: { tipus: 'arc', cordes: [-8, -3, 2, 7], noms: ['Mi', 'La', 'Re', 'Sol'], dits: BAIX, arc: 'arc-contrabaix', boquet: [.66, .5] },
    // Arpa: sense pedals (diatònica), dues files creuades, o 7 pedals (simple / doble moviment).
    'arpa-egipcia': { tipus: 'arpa', mode: 'diatonica', boquet: [.55, .35] },
    'arpa-celta': { tipus: 'arpa', mode: 'diatonica', boquet: [.5, .4] },
    'arpa-dos': { tipus: 'arpa', mode: 'dos', boquet: [.55, .4] },
    'arpa-1770': { tipus: 'arpa', mode: 'simple', boquet: [.55, .4] },   // afinada en Mi♭: pedals que només pugen
    'arpa-erard': { tipus: 'arpa', mode: 'pedals', boquet: [.55, .4] },
    arpa: { tipus: 'arpa', mode: 'pedals', boquet: [.55, .4] },
    // Canya doble i simple: mateixa lògica de forats, amb el salt de registre de cada tub
    // (cònic: octava · cilíndric, el clarinet: dotzena).
    aulos: { tipus: 'forats', n: 6, notes: [40, 38, 36, 35, 33, 31, 29, 28], boquet: [.008, .53] },
    xirimia: { tipus: 'forats', n: 6, inici: 26, salt: 12, llindars: [38, 50], registres: ['registre greu', 'bufant més fort', 'registre agut'], boquet: [.0, .51] },
    'oboe-barroc': { tipus: 'forats', n: 6, inici: 26, salt: 12, llindars: [38, 50], registres: ['registre greu', 'bufant més fort', 'registre agut'], boquet: [.004, .49] },
    tenora: { tipus: 'forats', n: 6, inici: 26, salt: 12, llindars: [38, 50], registres: ['registre greu', "clau d'octava", 'registre agut'], boquet: [.008, .135] },
    triebert: { tipus: 'forats', n: 6, inici: 26, salt: 12, llindars: [38, 50], registres: ['registre greu', "clau d'octava", 'registre agut'], boquet: [.007, .48] },
    oboe: { tipus: 'forats', n: 6, inici: 26, salt: 12, llindars: [38, 50], registres: ['registre greu', "clau d'octava", 'registre agut'], boquet: [.008, .47] },
    memet: { tipus: 'forats', n: 5, notes: [35, 33, 31, 30, 28], boquet: [.009, .46] },
    chalumeau: { tipus: 'forats', n: 6, inici: 19, salt: 19, llindars: [31, 44], registres: ['chalumeau', 'clau de registre', 'altíssim'], boquet: [.009, .46] }, denner: { tipus: 'forats', n: 6, inici: 19, salt: 19, llindars: [31, 44], registres: ['chalumeau', 'clau de registre', 'altíssim'], boquet: [.008, .43] },
    basset: { tipus: 'forats', n: 6, inici: 19, salt: 19, llindars: [31, 44], registres: ['chalumeau', 'clau de registre', 'altíssim'], boquet: [.008, .14] }, 'clarinet-boehm': { tipus: 'forats', n: 6, inici: 19, salt: 19, llindars: [31, 44], registres: ['chalumeau', 'clau de registre', 'altíssim'], boquet: [.008, .38] }, clarinet: { tipus: 'forats', n: 6, inici: 19, salt: 19, llindars: [31, 44], registres: ['chalumeau', 'clau de registre', 'altíssim'], boquet: [.008, .37] },
    dulcia: { tipus: 'forats', n: 6, inici: 7, salt: 12, llindars: [19, 31], registres: ['registre greu', 'registre mitjà', 'registre agut'], boquet: [.008, .31] }, 'fagot-barroc': { tipus: 'forats', n: 6, inici: 7, salt: 12, llindars: [19, 31], registres: ['registre greu', 'registre mitjà', 'registre agut'], boquet: [.008, .15] }, 'fagot-classic': { tipus: 'forats', n: 6, inici: 7, salt: 12, llindars: [19, 31], registres: ['registre greu', 'registre mitjà', 'registre agut'], boquet: [.008, .15] },
    heckel: { tipus: 'forats', n: 6, inici: 7, salt: 12, llindars: [19, 31], registres: ['registre greu', 'registre mitjà', 'registre agut'], boquet: [.008, .15] }, 'fagot-1913': { tipus: 'forats', n: 6, inici: 7, salt: 12, llindars: [19, 31], registres: ['registre greu', 'registre mitjà', 'registre agut'], boquet: [.007, .28] }, fagot: { tipus: 'forats', n: 6, inici: 7, salt: 12, llindars: [19, 31], registres: ['registre greu', 'registre mitjà', 'registre agut'], boquet: [.007, .28] },
    serpent: { tipus: 'forats', n: 6, inici: 0, salt: 12, llindars: [12, 24], registres: ['greu', 'mitjà', 'agut'], boquet: [.1, .05] },
    figle: { tipus: 'forats', n: 6, inici: 0, salt: 12, llindars: [12, 24], registres: ['greu', 'mitjà', 'agut'], paraula: 'claus', boquet: [.05, .3] },
    // Trompa: natural (llavis), amb la mà al pavelló, i amb pistons/rotors (en Fa).
    olifant: { tipus: 'llavis', boquet: [.009, .02] },
    'trompa-caca': { tipus: 'llavis', boquet: [.008, .26] },
    'trompa-natural': { tipus: 'ma', obertes: [5, 12, 17, 21, 24, 26.69, 29, 31, 33, 34.51, 36, 37.41, 38.69, 41], boquet: [.008, .26] },
    'trompa-1818': { tipus: 'pistons', n: 2, obertes: [5, 12, 17, 21, 24, 29, 33, 36, 41], boquet: [.02, .24] },
    'trompa-doble': { tipus: 'pistons', n: 3, obertes: [5, 12, 17, 21, 24, 29, 33, 36, 41], boquet: [.01, .2] },
    trompa: { tipus: 'pistons', n: 3, obertes: [5, 12, 17, 21, 24, 29, 33, 36, 41], boquet: [.01, .2] },
    // Trombó: la vara. Posició = 1 + semitons per sota de l'harmònic obert (Si♭).
    sacabutx: { tipus: 'vara', obertes: [10, 17, 22, 26, 29, 34, 38, 41], pas: .06, zona: [.33, .58, 1, .97], boquet: [.008, .37] },
    'sacabutx-cat': { tipus: 'vara', obertes: [10, 17, 22, 26, 29, 34, 38, 41], pas: .06, zona: [.33, .58, 1, .97], boquet: [.008, .37] },
    'trombo-1808': { tipus: 'vara', obertes: [10, 17, 22, 26, 29, 34, 38, 41], pas: .06, zona: [.41, .62, 1, .97], boquet: [.008, .57] },
    'trombo-banda': { tipus: 'vara', obertes: [10, 17, 22, 26, 29, 34, 38, 41], pas: .06, zona: [.41, .62, 1, .97], boquet: [.008, .57] },
    'trombo-jazz': { tipus: 'vara', obertes: [10, 17, 22, 26, 29, 34, 38, 41], pas: .06, zona: [.41, .62, 1, .97], boquet: [.008, .57] },
    trombo: { tipus: 'vara', obertes: [10, 17, 22, 26, 29, 34, 38, 41], pas: .06, zona: [.41, .62, 1, .97], boquet: [.008, .57] },
    // Tuba en Fa, quatre pistons (el 4t baixa una quarta).
    'tuba-1835': { tipus: 'pistons', n: 4, obertes: [5, 12, 17, 21, 24, 29], pedal: -7, boquet: [.05, .37] }, sousafon: { tipus: 'pistons', n: 4, obertes: [5, 12, 17, 21, 24, 29], pedal: -7, boquet: [.55, .55] },
    'tuba-jazz': { tipus: 'pistons', n: 4, obertes: [5, 12, 17, 21, 24, 29], pedal: -7, boquet: [.55, .55] }, tuba: { tipus: 'pistons', n: 4, obertes: [5, 12, 17, 21, 24, 29], pedal: -7, boquet: [.95, .35] },
    // Timbales: quin timbal sona (afinació fixa) o fins on tensa el pedal.
    timbal: { tipus: 'timbal', pedal: true, boquet: [.5, .1], timbals: [{ nom: '32"', min: 0, max: 7 }, { nom: '29"', min: 5, max: 12 }, { nom: '26"', min: 10, max: 17 }, { nom: '23"', min: 14, max: 24 }] },
    naqqara: { tipus: 'timbal', boquet: [.5, .15], timbals: [{ nom: 'Greu', nota: 17 }, { nom: 'Agut', nota: 24 }] },
    cavalleria: { tipus: 'timbal', boquet: [.5, .08], timbals: [{ nom: 'Sol', nota: 7 }, { nom: 'Do', nota: 12 }] },
    'timbal-barroc': { tipus: 'timbal', boquet: [.5, .15], timbals: [{ nom: 'Re', nota: 2 }, { nom: 'La', nota: 9 }] },
    'timbal-barroc-2': { tipus: 'timbal', boquet: [.5, .15], timbals: [{ nom: 'Fa greu', nota: 5 }, { nom: 'Fa agut', nota: 17 }] },
    'timbal-pedal': { tipus: 'timbal', pedal: true, boquet: [.5, .08], timbals: [{ nom: 'Timbal', min: 0, max: 24 }] },
    // Percussió sense altura: quin so (codi de SONS) colpeja cada nota.
    bateria: { tipus: 'bateria', sons: [0, 1, 2, 3, 4], boquet: [.45, .3] },
    djembe: { tipus: 'bateria', sons: [5, 6, 7], boquet: [.5, .05] },
    mehter: { tipus: 'bateria', sons: [8, 9], boquet: [.35, .3] },
    turca: { tipus: 'bateria', sons: [0, 2, 10], boquet: [.35, .2] },
    caixa: { tipus: 'bateria', sons: [0, 1], boquet: [.5, .15] },
    'bateria-jazz': { tipus: 'bateria', sons: [0, 1, 3], boquet: [.45, .3] },
    // Làmines i campanes: com el teclat, nota i què les colpeja.
    gamelan: { tipus: 'tecla', colpeja: 'mall de fusta', boquet: [.5, .3] },
    balafon: { tipus: 'tecla', colpeja: 'baquetes amb goma', boquet: [.5, .2] },
    palla: { tipus: 'tecla', colpeja: 'baquetes de fusta', boquet: [.5, .3] },
    'xilofon-1874': { tipus: 'tecla', colpeja: 'baquetes dures', boquet: [.5, .15] },
    marimba: { tipus: 'tecla', colpeja: 'baquetes de llana', boquet: [.5, .1] },
    xilofon: { tipus: 'tecla', colpeja: 'baquetes dures', boquet: [.5, .1] },
    deagan: { tipus: 'tecla', colpeja: 'baquetes dures', boquet: [.5, .1] },
    ragtime: { tipus: 'tecla', colpeja: 'baquetes dures', boquet: [.5, .12] },
    timbila: { tipus: 'tecla', colpeja: 'baquetes de goma', boquet: [.5, .15] },
    tecomates: { tipus: 'tecla', colpeja: 'baquetes de goma', boquet: [.5, .1] },
    'marimba-doble': { tipus: 'tecla', colpeja: 'baquetes de goma', boquet: [.5, .1] },
    musser: { tipus: 'tecla', colpeja: 'baquetes de llana', boquet: [.5, .1] },
    'marimba-abe': { tipus: 'tecla', colpeja: '4 baquetes de llana', boquet: [.5, .1] },
    metalofon: { tipus: 'tecla', colpeja: 'baquetes de llana · motor', boquet: [.5, .1] },
    campanes: { tipus: 'tecla', colpeja: 'martell de cuir', boquet: [.5, .15] },
    kebyar: { tipus: 'tecla', colpeja: 'mall de fusta', boquet: [.5, .2] },
    vibrafon: { tipus: 'tecla', colpeja: 'baquetes de llana · motor', boquet: [.5, .1] },
    orff: { tipus: 'tecla', colpeja: 'baquetes de feltre', boquet: [.5, .2] },
    bianzhong: { tipus: 'tecla', colpeja: 'mall de fusta', boquet: [.5, .3] },
    carillo: { tipus: 'tecla', colpeja: 'teclat de punys', boquet: [.5, .2] },
    glockenspiel: { tipus: 'tecla', colpeja: 'martellets', boquet: [.5, .3] },
    'celesta-mustel': { tipus: 'tecla', colpeja: 'martellets de feltre', boquet: [.5, .3] },
    'celesta-mustel-2': { tipus: 'tecla', colpeja: 'martellets de feltre', boquet: [.5, .3] },
    celesta: { tipus: 'tecla', colpeja: 'martellets de feltre', boquet: [.5, .3] },
    tut: { tipus: 'llavis', boquet: [.008, .533] },
    cornu: { tipus: 'llavis', boquet: [.014, .894] },
    natural: { tipus: 'llavis', boquet: [.008, .276] },
  };

  function digitacio(art, s) {
    const p = PECES[art];
    const sReal = s;   // abans d'arrodonir: les escales no temperades en depenen
    s = Math.round(s);
    if (p.tipus === 'pistons') {
      if (p.pedal !== undefined && s === p.pedal) return { premuts: [], aprox: false, text: 'Nota pedal' };
      const obertes = p.obertes || OBERTES;
      const max = p.n === 4 ? 11 : p.n === 3 ? 6 : 3;
      let h = obertes.find(o => o >= s && o - s <= max);
      let aprox = false;
      if (h === undefined) { h = obertes.find(o => o >= s) ?? obertes[0]; aprox = true; }
      const dif = Math.max(0, Math.min(h - s, max));
      const premuts = (p.n === 4 ? BAIXA4 : BAIXA)[dif];
      return { premuts, aprox, text: premuts.length ? premuts.join('·') : 'Oberta' };
    }
    if (p.tipus === 'claus') {
      const h = [...OBERTES].reverse().find(o => o <= s);
      const dif = Math.min(s - h, p.n);
      return { premuts: dif ? [dif] : [], aprox: false, text: dif ? `Clau ${dif}` : 'Oberta' };
    }
    if (p.tipus === 'pinca') {
      // Corda més aguda que no passi per sobre de la nota; el trast és la diferència.
      let k = p.cordes.length - 1;
      while (k > 0 && p.cordes[k] > s) k--;
      const dif = s - p.cordes[k];
      return { premuts: [k + 1], aprox: false, text: dif <= 0 ? `${p.noms[k]} a l'aire` : `${p.noms[k]} · trast ${dif}` };
    }
    if (p.tipus === 'vara') {
      const h = p.obertes.find(o => o >= s && o - s <= 6);
      if (h === undefined) return { premuts: [7], aprox: true, text: 'Posició 7' };
      const pos = 1 + h - s;
      return { premuts: [pos], aprox: false, text: `Posició ${pos}` };
    }
    if (p.tipus === 'ma') {
      const h = p.obertes.find(o => o >= s - .3);
      const dif = h === undefined ? 0 : Math.round(h - s);
      const k = dif <= 0 ? 1 : dif === 1 ? 2 : 3;
      return { premuts: [k], aprox: false, text: ['Mà oberta', 'Mig tapada', 'Tapada'][k - 1] };
    }
    if (p.tipus === 'arpa') {
      const midi = 36 + s, pc = midi % 12, nom = NOTES[pc], oct = Math.floor(midi / 12) - 1;
      const alterada = nom.includes('#'), lletra = nom.replace('#', '');
      if (p.mode === 'simple') {
        const nomB = BEMOLLS[pc], lletraB = nomB.replace('♭', '');
        return { premuts: [PEDALS.indexOf(lletraB) + 1], aprox: false, text: `${nomB}${oct} · pedal ${lletraB}` };
      }
      if (p.mode === 'pedals') {
        return { premuts: [PEDALS.indexOf(lletra) + 1], aprox: false, text: `${nom}${oct} · pedal ${lletra} ${alterada ? '♯' : '♮'}` };
      }
      if (p.mode === 'dos') {
        return { premuts: [alterada ? 2 : 1], aprox: false, text: `${nom}${oct} · fila ${alterada ? 'cromàtica' : 'diatònica'}` };
      }
      return { premuts: [], aprox: false, text: `Corda ${nom}${oct}` };
    }
    if (p.tipus === 'tecla') {
      // Escales no temperades (gamelan, balafon): la nota més propera, marcada amb ≈.
      const midi = 36 + s, pc = midi % 12, aprox = Math.abs(sReal - s) > .15;
      return { premuts: [pc + 1], aprox: false, text: `${aprox ? '≈' : ''}${NOTES[pc]}${Math.floor(midi / 12) - 1} · ${p.colpeja}` };
    }
    if (p.tipus === 'timbal') {
      const midi = 36 + s, nota = `${NOTES[midi % 12]}${Math.floor(midi / 12) - 1}`;
      if (p.pedal) {
        const k = Math.max(0, p.timbals.findIndex(t => s >= t.min && s <= t.max));
        return { premuts: [k + 1], aprox: false, text: `${p.timbals[k].nom} · pedal → ${nota}` };
      }
      const k = Math.max(0, p.timbals.findIndex(t => t.nota === s));
      return { premuts: [k + 1], aprox: false, text: `Timbal ${p.timbals[k].nom} · ${nota}` };
    }
    if (p.tipus === 'bateria') {
      const k = p.sons.indexOf(s);
      return { premuts: [k + 1], aprox: false, text: SONS[s] };
    }
    if (p.tipus === 'forats') {
      if (p.notes) {
        const k = p.notes.indexOf(s);
        const tapats = Math.min(p.n, k < 0 ? p.n : k);
        return { premuts: rang1(tapats), aprox: false, text: textTapats(tapats, p.paraula) };
      }
      // Posició de 6 forats sobre la nota base (tots tapats) i registre segons el salt del tub:
      // octava als tubs cònics i a la flauta, dotzena al clarinet (cilíndric).
      const inici = p.inici ?? 26, salt = p.salt ?? 12, llindars = p.llindars || [38, 50];
      const etiquetes = p.registres || ['1a octava', '2a octava', '3a octava'];
      const r = s >= llindars[1] ? 2 : s >= llindars[0] ? 1 : 0;
      const s0 = s - r * salt;
      const TAPATS = [6, 5.5, 5, 4.5, 4, 3, 2.5, 2, 1.5, 1, .5, 0];
      const peu = s0 < inici;
      const t = peu ? 6 : TAPATS[(s0 - inici) % 12];
      const sencers = Math.floor(t);
      return { premuts: rang1(sencers), mig: t % 1 ? sencers + 1 : null, aprox: false,
        text: `${textTapats(t, p.paraula)}${peu ? ' + clau' : ''} · ${etiquetes[r]}` };
    }
    if (p.tipus === 'arc') {
      // Primera posició: es toca a la corda més aguda que no passi per sobre de la nota.
      // 1-2 semitons = dit 1 · 3-4 = dit 2 · 5-6 = dit 3 · 7 = dit 4. Més amunt, cal desplaçar la mà.
      let k = p.cordes.length - 1;
      while (k > 0 && p.cordes[k] > s) k--;
      const dif = s - p.cordes[k], nom = p.noms[k];
      const maxPos = p.dits ? p.dits.length - 1 : 7;
      const dit = p.dits ? p.dits[dif] : Math.ceil(dif / 2);
      const text = dif <= 0 ? `${nom} a l'aire` : dif <= maxPos ? `${nom} · dit ${dit}` : `${nom} · posició alta`;
      return { premuts: [k + 1], aprox: false, text };
    }
    return { premuts: [], aprox: false, text: 'Només llavis' };
  }

  return { PECES, PEDALS, SONS, digitacio, peca: art => PECES[art] };
})();

window.MECANICA = MECANICA;

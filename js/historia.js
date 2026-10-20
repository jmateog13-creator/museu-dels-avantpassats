'use strict';
/* =========================================================================
   MUSEU DELS AVANTPASSATS · metahistòria: l'arxiu desordenat
   -------------------------------------------------------------------------
   Una tempesta ha barrejat les fitxes de l'arxiu. El doctor Martí
   (historiador) i la doctora Carla (especialista en so) necessiten un/a
   aprenent: cada vitrina superada recupera una fitxa i un segell; cada sala
   completa, una medalla; les 21 fitxes, el diploma de conservador/a.

   Repartiment: Martí fa les preguntes d'història (ordenar, per què va
   canviar); Carla, les de so (escoltar, família). Així els dos surten a
   cada prova i cada veu queda associada a una manera de pensar la música.
   ========================================================================= */

const HISTORIA = {
  intro: [
    ['marti', 'saluda', 'Benvingut, benvinguda al museu! Sóc el doctor Martí, l’historiador.'],
    ['carla', 'saluda', 'I jo sóc la doctora Carla: m’ocupo de com sona cada instrument.'],
    ['marti', 'preocupat', 'Ahir a la nit una tempesta va entrar per la claraboia i va barrejar totes les fitxes de l’arxiu.'],
    ['carla', 'preocupat', 'Ara no sabem d’on ve cada instrument ni qui són els seus avantpassats. Un desastre!'],
    ['marti', 'explica', 'Mira el vídeo de cada vitrina: hi veuràs tota la família de l’instrument, de l’avi fins avui.'],
    ['carla', 'ullet', 'Després et farem unes preguntes. Si les respons, recuperem la fitxa i te la segellem al passaport.'],
    ['marti', 'somriu', 'Comença per la sala que vulguis. Som-hi!'],
  ],

  sales: {
    corda: [['marti', 'explica', 'La Sala de Corda! Aquí totes les cordes vibren, però no totes igual. Fixa’t en els colors: fregada, polsada i percudida.']],
    fusta: [['carla', 'explica', 'Vent fusta! Compte: n’hi ha de metall, com la flauta. El que compta és com neix el so: un bisell o una canya.']],
    metall: [['marti', 'explica', 'Vent metall: aquí el so neix dels llavis vibrant dins d’un broquet. Tres mil anys de bronze i llautó!']],
    percussio: [['carla', 'explica', 'Percussió: membranòfons, amb pell, i idiòfons, on vibra tot l’instrument. Escolta bé cada cop!']],
  },

  // Guia de cada vitrina (targeta final del vídeo): s'alternen per ordre del catàleg.
  guia: id => Object.keys(window.MUSEU.INSTRUMENTS).indexOf(id) % 2 ? 'carla' : 'marti',

  // Qui fa cada pregunta: història → Martí; so (escoltar, família) → Carla.
  quiPregunta(q, i) {
    if (q.tipus === 'ordre') return 'marti';
    if (q.tipus === 'escolta') return 'carla';
    return i === 1 ? 'marti' : 'carla';
  },

  be: ['Exacte!', 'Molt bé!', 'Perfecte!', 'Això mateix!'],
  gairebe: ['Gairebé!', 'Quasi!', 'No ben bé…'],

  avisFinal: { marti: 'Ho has vist tot? Recuperem la fitxa!', carla: 'Ja ho has escoltat tot? Recuperem la fitxa!' },

  segell: (nom, encerts, n) => [
    ['marti', 'segell', `Fitxa recuperada! L’arxiu ja sap d’on ve: ${nom}.`],
    ['carla', 'celebra', `Encerts a la primera: ${encerts} de ${n}. Va, que te la segellem!`],
  ],

  medalles: {
    corda: { nom: 'Medalla de l’Arc', qui: 'marti', text: 'Has recuperat les set fitxes de corda: fregada, polsada i percudida.' },
    fusta: { nom: 'Medalla del Bisell i la Canya', qui: 'carla', text: 'Has recuperat totes les fitxes del vent fusta.' },
    metall: { nom: 'Medalla dels Llavis', qui: 'marti', text: 'Has recuperat totes les fitxes del vent metall.' },
    percussio: { nom: 'Medalla del Cop', qui: 'carla', text: 'Has recuperat totes les fitxes de percussió: membranòfons i idiòfons.' },
  },

  medalla: m => [
    [m.qui, 'celebra', `Increïble! ${m.text}`],
    [m.qui === 'marti' ? 'carla' : 'marti', 'somriu', `Et donem la ${m.nom}. Ja la tens al passaport!`],
  ],

  diploma: [
    ['carla', 'sorpres', 'Espera… Ja hi són totes? Vint-i-una fitxes!'],
    ['marti', 'celebra', 'L’arxiu torna a estar complet. Has salvat el museu!'],
    ['carla', 'segell', 'Això es mereix un diploma de conservador o conservadora del museu.'],
  ],
};

window.HISTORIA = HISTORIA;

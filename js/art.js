'use strict';
/* =========================================================================
   MUSEU DELS AVANTPASSATS · art provisional (SVG generat)
   -------------------------------------------------------------------------
   Art bible de L'Estudi: proporcions de joguina, formes arrodonides, pastel
   càlid, ombrejat pla, SENSE contorns. Tot es dibuixa en codi perquè és
   provisional: quan arribin els sprites definitius, cada funció es
   substitueix per un <image> i el motor no se n'assabenta.

   Escena: viewBox 0 0 360 640. Illa a y≈430, instrument centrat a (180,330).
   ========================================================================= */

const ART = (() => {
  const PAL = {
    llauto: { base: '#E9B949', ombra: '#C48A2C', llum: '#FFE7A0', dins: '#9C6A1E' },
    plata:  { base: '#D7DDE6', ombra: '#A5AFBE', llum: '#FFFFFF', dins: '#7E899A' },
    bronze: { base: '#CF925A', ombra: '#A2683A', llum: '#F2BE8A', dins: '#7A4A26' },
  };

  // Tub amb ombrejat pla: ombra desplaçada + cos + reflex fi.
  const tub = (d, w, p) => `
    <path d="${d}" fill="none" stroke="${p.ombra}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 ${w * .28})"/>
    <path d="${d}" fill="none" stroke="${p.base}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${p.llum}" stroke-width="${Math.max(1.5, w * .25)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 ${-w * .22})" opacity=".85"/>`;

  // Pavelló que s'obre cap a +x des de (x,y).
  const pavello = (x, y, len, r0, r1, p) => `
    <path d="M${x},${y - r0} C${x + len * .55},${y - r0} ${x + len * .78},${y - r1} ${x + len},${y - r1}
             L${x + len},${y + r1} C${x + len * .78},${y + r1} ${x + len * .55},${y + r0} ${x},${y + r0} Z" fill="${p.base}"/>
    <path d="M${x},${y + r0 * .2} C${x + len * .55},${y + r0 * .4} ${x + len * .78},${y + r1 * .55} ${x + len},${y + r1 * .7}
             L${x + len},${y + r1} C${x + len * .78},${y + r1} ${x + len * .55},${y + r0} ${x},${y + r0} Z" fill="${p.ombra}" opacity=".7"/>
    <path d="M${x + len * .2},${y - r0 * .5} C${x + len * .6},${y - r0 * .6} ${x + len * .8},${y - r1 * .8} ${x + len - 3},${y - r1 * .82}" fill="none" stroke="${p.llum}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
    <ellipse cx="${x + len}" cy="${y}" rx="${r1 * .3}" ry="${r1}" fill="${p.dins}"/>
    <ellipse cx="${x + len + 1}" cy="${y}" rx="${r1 * .3}" ry="${r1}" fill="none" stroke="${p.llum}" stroke-width="3"/>`;

  const broquet = (x, y, p) => `
    <rect x="${x - 10}" y="${y - 3}" width="16" height="6" rx="3" fill="${p.ombra}"/>
    <ellipse cx="${x - 11}" cy="${y}" rx="3.5" ry="7" fill="${p.base}"/>`;

  // ── Instruments ─────────────────────────────────────────────────────────
  // Cada un retorna { svg, campana:[x,y] } amb coordenades locals (0,0 = centre).
  const INST = {
    tut() {
      const p = PAL.plata;
      const lotus = [-30, -10, 10].map(x => `
        <path d="M${x},-7 q4,-9 8,0 q-4,6 -8,0z" fill="#7FB7E0"/>
        <path d="M${x + 4},-7 q2,-6 4,-7" fill="none" stroke="#5E9BC9" stroke-width="1.5" stroke-linecap="round"/>`).join('');
      return { campana: [140, 0], svg: `
        ${tub('M-118,0 L62,0', 9, p)}
        <rect x="-44" y="-7" width="66" height="14" rx="7" fill="#E8C268"/>
        ${lotus}
        ${pavello(60, 0, 78, 4.5, 28, p)}
        ${broquet(-118, 0, p)}` };
    },

    cornu() {
      // G oberta per dalt a la dreta: el tub gira en sentit antihorari i el pavelló surt cap amunt.
      const p = PAL.bronze, r = 62, cy = -8;
      const a0 = 250 * Math.PI / 180, a1 = 0;
      const pt = a => [r * Math.cos(a), cy + r * Math.sin(a)];
      const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
      const d = `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 1 0 ${x1.toFixed(1)},${y1.toFixed(1)}`;
      const angBroquet = Math.atan2(-Math.cos(a0), Math.sin(a0)) * 180 / Math.PI;
      return { campana: [x1, y1 - 64], svg: `
        <path d="M-50,${cy + 50} L50,${cy - 50}" stroke="#8A5A33" stroke-width="10" stroke-linecap="round"/>
        <path d="M-50,${cy + 50} L50,${cy - 50}" stroke="#B07A4C" stroke-width="4" stroke-linecap="round" transform="translate(-1 -2)"/>
        ${tub(d, 9, p)}
        <g transform="translate(${x1.toFixed(1)} ${y1.toFixed(1)}) rotate(-90)">${pavello(0, 0, 64, 4.5, 28, p)}</g>
        <g transform="translate(${x0.toFixed(1)} ${y0.toFixed(1)}) rotate(${angBroquet.toFixed(1)})">${broquet(0, 0, p)}</g>` };
    },

    natural() {
      const p = PAL.llauto;
      const cos = 'M-112,22 L38,22 A11,11 0 0 0 38,0 L-88,0 A11,11 0 0 1 -88,-22 L46,-22';
      return { campana: [130, -22], svg: `
        <path d="M-66,24 L18,24 L18,66 q-10,8 -21,0 q-10,8 -21,0 q-10,8 -21,0 q-10,8 -21,0 Z" fill="#D9675C"/>
        <path d="M-66,24 L18,24 L18,36 L-66,36 Z" fill="#C2524A"/>
        <circle cx="-24" cy="48" r="8" fill="#FFE29A"/>
        ${tub(cos, 8, p)}
        <circle cx="-6" cy="-22" r="7.5" fill="${p.base}"/><circle cx="-8" cy="-24.5" r="2.5" fill="${p.llum}"/>
        ${pavello(44, -22, 86, 4, 30, p)}
        ${broquet(-112, 22, p)}` };
    },

    claus() {
      const p = PAL.llauto;
      const cos = 'M-112,22 L38,22 A11,11 0 0 0 38,0 L-88,0 A11,11 0 0 1 -88,-22 L46,-22';
      const claus = [6, 22, 38, 56].map((x, i) => `
        <path d="M${x - 14},${-4 - i}  L${x},-22" stroke="${PAL.plata.ombra}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="${x}" cy="-22" r="6" fill="${PAL.plata.base}"/><circle cx="${x - 1.5}" cy="-23.5" r="2" fill="#fff"/>
        <circle cx="${x - 14}" cy="${-4 - i}" r="3.2" fill="${PAL.plata.base}"/>`).join('');
      return { campana: [130, -22], svg: `
        ${tub(cos, 8, p)}
        ${pavello(44, -22, 86, 4, 30, p)}
        ${claus}
        ${broquet(-112, 22, p)}` };
    },

    pistons() {
      const p = PAL.llauto;
      const cos = 'M-112,22 L38,22 A11,11 0 0 0 38,0 L-88,0 A11,11 0 0 1 -88,-22 L46,-22';
      const valv = [-30, -6].map(x => `
        <rect x="${x - 8}" y="-38" width="16" height="72" rx="6" fill="${p.ombra}"/>
        <rect x="${x - 8}" y="-38" width="12" height="72" rx="6" fill="${p.base}"/>
        <rect x="${x - 5}" y="-34" width="3" height="62" rx="1.5" fill="${p.llum}" opacity=".8"/>
        <rect x="${x - 2}" y="-50" width="4" height="12" fill="${PAL.plata.ombra}"/>
        <ellipse cx="${x}" cy="-51" rx="8" ry="4" fill="#F5EFE3"/>`).join('');
      return { campana: [130, -22], svg: `
        ${tub(cos, 8, p)}
        ${valv}
        ${pavello(44, -22, 86, 4, 30, p)}
        ${broquet(-112, 22, p)}` };
    },

    moderna() {
      const p = PAL.llauto;
      const valv = [-14, 8, 30].map(x => `
        <rect x="${x - 8}" y="-30" width="16" height="64" rx="7" fill="${p.ombra}"/>
        <rect x="${x - 8}" y="-30" width="12" height="64" rx="7" fill="${p.base}"/>
        <rect x="${x - 5}" y="-26" width="3" height="54" rx="1.5" fill="${p.llum}" opacity=".85"/>
        <rect x="${x - 2}" y="-44" width="4" height="14" fill="${PAL.plata.ombra}"/>
        <ellipse cx="${x}" cy="-46" rx="8" ry="4.5" fill="#FFF8EC"/>`).join('');
      return { campana: [150, -18], svg: `
        ${tub('M-58,14 L-92,14 A12,12 0 0 0 -92,38 L-22,38', 7, p)}
        ${tub('M-128,-2 L-22,-2', 7, p)}
        ${tub('M38,26 A12,12 0 0 0 38,2 L-22,2', 6, p)}
        ${valv}
        ${tub('M-22,-18 L60,-18', 7.5, p)}
        ${pavello(58, -18, 92, 4, 34, p)}
        ${broquet(-128, -2, PAL.plata)}` };
    },
  };

  // ── Fons per època ──────────────────────────────────────────────────────
  const cel = (id, a, b) => `
    <defs><linearGradient id="cel-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="360" height="640" fill="url(#cel-${id})"/>`;

  const FONS = {
    escenari: () => `${cel('escenari', '#8D7BC0', '#F6B8B0')}
      <circle cx="292" cy="96" r="22" fill="#FFF1C9" opacity=".9"/>
      ${[[20, 300, 46, 140], [70, 270, 38, 170], [112, 316, 52, 124], [200, 290, 44, 150], [248, 262, 40, 178], [292, 306, 54, 134]]
        .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#7A6AA8"/>` +
          Array.from({ length: 6 }, (_, i) => `<rect x="${x + 9 + (i % 2) * 16}" y="${y + 14 + Math.floor(i / 2) * 24}" width="9" height="11" rx="3" fill="#FFE29A" opacity="${i % 3 ? .9 : .45}"/>`).join('')).join('')}
      <path d="M40,0 L-10,640 L110,640 Z" fill="#FFFFFF" opacity=".10"/>
      <path d="M320,0 L250,640 L370,640 Z" fill="#FFFFFF" opacity=".10"/>`,

    egipte: () => `${cel('egipte', '#FFC99A', '#FFF0D2')}
      <circle cx="96" cy="140" r="34" fill="#FFB067"/>
      <path d="M150,380 L232,236 L314,380 Z" fill="#E8B87A" stroke="#E8B87A" stroke-width="14" stroke-linejoin="round"/>
      <path d="M232,236 L314,380 L250,380 Z" fill="#D29A5E" stroke="#D29A5E" stroke-width="14" stroke-linejoin="round"/>
      <path d="M28,380 L88,276 L148,380 Z" fill="#EFC48A" stroke="#EFC48A" stroke-width="12" stroke-linejoin="round"/>
      <path d="M88,276 L148,380 L102,380 Z" fill="#D9A56A" stroke="#D9A56A" stroke-width="12" stroke-linejoin="round"/>
      <path d="M0,370 Q90,340 180,372 T360,362 L360,640 L0,640 Z" fill="#F4CF96"/>
      <g transform="translate(316 300)"><path d="M0,80 Q4,40 0,0" stroke="#B0804E" stroke-width="7" fill="none" stroke-linecap="round"/>
        ${[-50, -10, 30, 150, 190].map(a => `<ellipse cx="0" cy="0" rx="26" ry="8" fill="#7FC491" transform="rotate(${a}) translate(20 0)"/>`).join('')}</g>`,

    roma: () => `${cel('roma', '#AEDCF0', '#EAF6FB')}
      <ellipse cx="80" cy="120" rx="34" ry="14" fill="#fff" opacity=".9"/><ellipse cx="104" cy="112" rx="24" ry="12" fill="#fff" opacity=".9"/>
      <ellipse cx="270" cy="170" rx="30" ry="12" fill="#fff" opacity=".8"/>
      <path d="M-20,360 Q80,270 190,340 T380,320 L380,640 L-20,640 Z" fill="#A9DBA8"/>
      <path d="M-20,390 Q120,330 230,380 T380,370 L380,640 L-20,640 Z" fill="#8CCB8C"/>
      ${[[34, 352], [96, 340], [262, 344]].map(([x, y]) => `
        <path d="M${x - 26},${y + 30} L${x},${y} L${x + 26},${y + 30} Z" fill="#EADBBE" stroke="#EADBBE" stroke-width="8" stroke-linejoin="round"/>
        <path d="M${x},${y} L${x + 26},${y + 30} L${x + 8},${y + 30} Z" fill="#D8C29C" stroke="#D8C29C" stroke-width="8" stroke-linejoin="round"/>
        <rect x="${x - 3}" y="${y + 14}" width="6" height="16" rx="3" fill="#C2524A"/>`).join('')}
      <g transform="translate(318 236)"><rect x="-2" y="0" width="4" height="120" rx="2" fill="#8A5A33"/>
        <rect x="-18" y="8" width="36" height="34" rx="6" fill="#D9675C"/><circle cx="0" cy="25" r="8" fill="#FFE29A"/>
        <circle cx="0" cy="-4" r="7" fill="#E9B949"/></g>`,

    barroc: () => `${cel('barroc', '#F7E6C8', '#F2D9B4')}
      <rect y="420" width="360" height="220" fill="#E7C99E"/>
      ${[70, 290].map(x => `
        <path d="M${x - 40},350 L${x - 40},190 A40,40 0 0 1 ${x + 40},190 L${x + 40},350 Z" fill="#EEDFC6"/>
        <path d="M${x - 32},344 L${x - 32},194 A32,32 0 0 1 ${x + 32},194 L${x + 32},344 Z" fill="#BFE3F2"/>
        <path d="M${x - 32},230 L${x + 32},230 M${x},164 L${x},344" stroke="#EEDFC6" stroke-width="5"/>`).join('')}
      <path d="M0,0 L120,0 Q90,90 22,128 Q4,120 0,96 Z" fill="#D9675C"/>
      <path d="M360,0 L240,0 Q270,90 338,128 Q356,120 360,96 Z" fill="#D9675C"/>
      <g transform="translate(180 0)"><rect x="-2" y="0" width="4" height="70" fill="#C48A2C"/>
        <path d="M-56,96 Q0,124 56,96" stroke="#E9B949" stroke-width="7" fill="none" stroke-linecap="round"/>
        ${[-56, -20, 20, 56].map(x => `<rect x="${x - 3}" y="${x * x / 100 + 70}" width="6" height="16" rx="3" fill="#FFF8EC"/>
          <ellipse cx="${x}" cy="${x * x / 100 + 64}" rx="4" ry="7" fill="#FFB067"/>`).join('')}
        <circle cx="0" cy="88" r="10" fill="#E9B949"/></g>`,

    viena: () => `${cel('viena', '#6F80BC', '#F7C2A6')}
      <circle cx="70" cy="100" r="18" fill="#FFF4D6"/>
      <path d="M40,420 L40,250 L180,190 L320,250 L320,420 Z" fill="#F4E6CF"/>
      <path d="M40,250 L180,190 L320,250 Z" fill="#E4CFAE"/>
      ${[80, 140, 220, 280].flatMap(x => [290, 350].map(y => `<path d="M${x - 14},${y + 30} L${x - 14},${y + 8} A14,14 0 0 1 ${x + 14},${y + 8} L${x + 14},${y + 30} Z" fill="#FFD27A"/>`)).join('')}
      <path d="M156,420 L156,350 A24,24 0 0 1 204,350 L204,420 Z" fill="#9C6A4A"/>
      <g transform="translate(44 446)"><rect x="-2" y="0" width="4" height="70" fill="#5B4636"/>
        <path d="M-26,-6 L26,-6 L22,22 L-22,22 Z" fill="#5B4636"/>
        <rect x="-20" y="-2" width="40" height="22" rx="2" fill="#FFF8EC"/>
        ${[2, 7, 12, 17].map(y => `<path d="M-16,${y} L16,${y}" stroke="#C9BFAE" stroke-width="1"/>`).join('')}</g>`,

    taller: () => `${cel('taller', '#C9986A', '#B98B5E')}
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 40}" y="0" width="38" height="640" fill="${i % 2 ? '#C49364' : '#CB9C6C'}"/>`).join('')}
      <rect x="30" y="250" width="120" height="10" rx="4" fill="#8E6440"/>
      <rect x="44" y="214" width="16" height="36" rx="4" fill="#7FB7E0"/><rect x="66" y="222" width="22" height="28" rx="5" fill="#E9B949"/>
      <rect x="96" y="208" width="12" height="42" rx="4" fill="#D9675C"/>
      <g transform="translate(286 196)"><circle r="38" fill="#9EA7B4"/>
        ${Array.from({ length: 10 }, (_, i) => `<rect x="-7" y="-50" width="14" height="16" rx="3" fill="#9EA7B4" transform="rotate(${i * 36})"/>`).join('')}
        <circle r="14" fill="#C2C9D3"/></g>
      <g transform="translate(232 300) rotate(4)"><rect x="-34" y="-44" width="68" height="88" rx="4" fill="#FFF8EC"/>
        <text x="0" y="-22" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#5B4636">PATENT</text>
        <text x="0" y="-8" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="11" font-weight="600" fill="#C2524A">1818</text>
        <rect x="-18" y="4" width="10" height="28" rx="3" fill="#E9B949"/><rect x="-2" y="4" width="10" height="28" rx="3" fill="#E9B949"/>
        <circle cx="0" cy="-40" r="4" fill="#C2524A"/></g>
      <circle cx="80" cy="120" r="70" fill="#FFE29A" opacity=".25"/>
      <path d="M80,0 L80,96" stroke="#5B4636" stroke-width="3"/><path d="M62,96 L98,96 L90,112 L70,112 Z" fill="#5B4636"/>
      <circle cx="80" cy="116" r="7" fill="#FFE7A0"/>`,
  };

  // Illa-diorama: tros de terra arrodonit amb el pedestal a sobre.
  const ILLA = {
    escenari: ['#B8865B', '#8E6440', '#7A6AA8'], egipte: ['#F2C98B', '#D9A866', '#E0B57E'],
    roma: ['#8CCB8C', '#B58A62', '#E9E2D2'], barroc: ['#D8A877', '#B07F52', '#F2E6D0'],
    viena: ['#C9C3D6', '#A39BB5', '#E8E1F0'], taller: ['#B98B5E', '#93683F', '#D7C3A4'],
  };
  const illa = esc => {
    const [dalt, costat, ped] = ILLA[esc];
    return `
      <ellipse cx="180" cy="478" rx="120" ry="16" fill="#000" opacity=".12"/>
      <path d="M50,430 Q50,474 180,474 Q310,474 310,430 Z" fill="${costat}"/>
      <ellipse cx="180" cy="430" rx="130" ry="30" fill="${dalt}"/>
      <ellipse cx="180" cy="424" rx="112" ry="20" fill="#fff" opacity=".12"/>
      <rect x="140" y="384" width="80" height="44" rx="12" fill="${ped}"/>
      <rect x="140" y="406" width="80" height="22" rx="10" fill="#000" opacity=".08"/>
      <rect x="130" y="376" width="100" height="16" rx="8" fill="${ped}"/>
      <rect x="136" y="378" width="70" height="4" rx="2" fill="#fff" opacity=".5"/>`;
  };

  const rellotge = () => `
    <circle r="70" fill="#FFF8EC"/><circle r="70" fill="none" stroke="#E9B949" stroke-width="10"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="-3" y="-60" width="6" height="${i % 3 ? 8 : 14}" rx="3" fill="#C9BFAE" transform="rotate(${i * 30})"/>`).join('')}
    <rect class="busca-h" x="-4" y="-38" width="8" height="42" rx="4" fill="#5B4636"/>
    <rect class="busca-m" x="-3" y="-56" width="6" height="60" rx="3" fill="#D9675C"/>
    <circle r="7" fill="#5B4636"/>`;

  const COLOR_MOTES = { escenari: '#FFF1C9', egipte: '#FFFFFF', roma: '#FFFFFF', barroc: '#FFE29A', viena: '#FFFFFF', taller: '#FFE7A0' };

  // ── Art definitiu (Higgsfield, fulles 3x3 tallades amb assets/talla.py) ──
  // Fons d'època: il·lustració vertical amb illa i pedestal buit. `ped` és
  // l'alçada (fracció de la imatge) on hi ha la cara de dalt del pedestal.
  const EPOQUES = {
    escenari: { w: 720, h: 1303, ped: .655 }, egipte: { w: 720, h: 1331, ped: .65 },
    grecia: { w: 720, h: 1325, ped: .66 }, roma: { w: 720, h: 1313, ped: .655 },
    medieval: { w: 720, h: 1342, ped: .65 }, renaixement: { w: 720, h: 1335, ped: .65 },
    barroc: { w: 720, h: 1335, ped: .665 }, viena: { w: 720, h: 1364, ped: .665 },
    taller: { w: 720, h: 1358, ped: .66 },
    auditori: { w: 720, h: 1305, ped: .615 }, andalus: { w: 720, h: 1334, ped: .615 },
    cremona: { w: 720, h: 1313, ped: .615 },
    mesopotamia: { w: 720, h: 1307, ped: .6 }, 'cort-espanyola': { w: 720, h: 1315, ped: .6 },
    'pati-andalus': { w: 720, h: 1336, ped: .57 }, saleta: { w: 720, h: 1344, ped: .57 },
    cova: { w: 720, h: 1233, ped: .625 }, xina: { w: 720, h: 1254, ped: .625 },
    versalles: { w: 720, h: 1314, ped: .62 }, assaig: { w: 720, h: 1411, ped: .58 },
    'taller-vent': { w: 720, h: 1337, ped: .59 }, mercat: { w: 720, h: 1235, ped: .61 }, desfilada: { w: 720, h: 1326, ped: .635 },
    africa: { w: 720, h: 1344, ped: .63 }, otoma: { w: 720, h: 1319, ped: .63 }, gamelan: { w: 720, h: 1312, ped: .645 },
    havana: { w: 720, h: 1356, ped: .645 }, andes: { w: 720, h: 1409, ped: .625 }, japo: { w: 720, h: 1433, ped: .625 }, 'estudi-perc': { w: 720, h: 1345, ped: .62 },
    celta: { w: 720, h: 1336, ped: .62 }, jazz: { w: 720, h: 1365, ped: .58 }, barcelona: { w: 720, h: 1301, ped: .62 },
  };
  // Sprites: mida en px i punt del pavelló (fracció) d'on surten les notes.
  const SPRITES = {
    tut: { src: 'tr-tut', w: 900, h: 258, campana: [.98, .5] }, cornu: { src: 'tr-cornu', w: 647, h: 686, campana: [.9, .06] },
    natural: { src: 'tr-natural', w: 900, h: 441, campana: [.98, .2] }, claus: { src: 'tr-claus', w: 900, h: 278, campana: [.98, .3] },
    pistons: { src: 'tr-pistons', w: 900, h: 343, campana: [.98, .3] }, moderna: { src: 'tr-moderna', w: 900, h: 335, campana: [.98, .35] },
    // Corda fregada: les notes surten del punt on l'arc frega la corda.
    rabab: { src: 'vi-rabab', w: 900, h: 241, campana: [.78, .45] }, fidula: { src: 'vi-fidula', w: 900, h: 376, campana: [.735, .48] },
    lira: { src: 'vi-lira', w: 900, h: 317, campana: [.73, .5] }, amati: { src: 'vi-amati', w: 900, h: 335, campana: [.665, .48] },
    stradivari: { src: 'vi-stradivari', w: 900, h: 346, campana: [.66, .5] }, violi: { src: 'vi-violi', w: 900, h: 341, campana: [.66, .5] },
    // Corda pinçada: les notes surten d'on es pinça (boca o pastilles).
    llaut: { src: 'gu-llaut', w: 900, h: 236, campana: [.8, .45] }, ud: { src: 'gu-ud', w: 900, h: 398, campana: [.72, .45] },
    vihuela: { src: 'gu-vihuela', w: 900, h: 349, campana: [.68, .5] }, barroca: { src: 'gu-barroca', w: 900, h: 306, campana: [.8, .48] },
    torres: { src: 'gu-torres', w: 900, h: 367, campana: [.63, .5] }, electrica: { src: 'gu-electrica', w: 900, h: 339, campana: [.8, .5] },
    // Corda percudida: les notes surten de l'arpa de cordes, a dins de la caixa.
    santur: { src: 'pi-santur', w: 900, h: 459, campana: [.5, .45] }, clavicordi: { src: 'pi-clavicordi', w: 863, h: 672, campana: [.55, .5] },
    cristofori: { src: 'pi-cristofori', w: 900, h: 734, campana: [.55, .45] }, fortepiano: { src: 'pi-fortepiano', w: 900, h: 860, campana: [.55, .4] },
    ferro: { src: 'pi-ferro', w: 900, h: 864, campana: [.55, .4] }, modern: { src: 'pi-modern', w: 900, h: 874, campana: [.55, .4] },
    // Flautes: primes i llargues, s'hi permet més amplada. Les notes surten de l'embocadura.
    os: { src: 'fl-os', w: 900, h: 149, campana: [.04, .3], ample: 320 }, chi: { src: 'fl-chi', w: 900, h: 75, campana: [.06, .3], ample: 320 },
    renaixement: { src: 'fl-renaixement', w: 900, h: 73, campana: [.05, .3], ample: 320 },
    traverso: { src: 'fl-traverso', w: 900, h: 74, campana: [.05, .3], ample: 320 },
    boehm: { src: 'fl-boehm', w: 900, h: 75, campana: [.06, .3], ample: 320 }, flauta: { src: 'fl-flauta', w: 900, h: 75, campana: [.06, .3], ample: 320 },
    // Viola, violoncel i contrabaix: on frega l'arc (entre el diapasó i el pont).
    'fidula-tenor': { src: 'vi-fidula', w: 900, h: 376, campana: [.735, .48] },
    braccio: { src: 'va-braccio', w: 900, h: 292, campana: [.64, .5] }, 'viola-amati': { src: 'va-amati', w: 900, h: 336, campana: [.67, .5] },
    medici: { src: 'va-medici', w: 900, h: 314, campana: [.7, .5] }, 'viola-rom': { src: 'va-moderna', w: 900, h: 388, campana: [.66, .5] },
    viola: { src: 'va-moderna', w: 900, h: 388, campana: [.66, .5] },
    basso: { src: 'vc-basso', w: 900, h: 423, campana: [.55, .5] }, 'cello-bolonya': { src: 'vc-barroc', w: 900, h: 375, campana: [.63, .5] },
    'cello-barroc': { src: 'vc-barroc', w: 900, h: 375, campana: [.63, .5] }, 'cello-pica': { src: 'vc-pica', w: 900, h: 346, campana: [.45, .5] },
    'cello-casals': { src: 'vc-modern', w: 900, h: 308, campana: [.47, .5] }, cello: { src: 'vc-modern', w: 900, h: 308, campana: [.47, .5] },
    violone: { src: 'cb-violone', w: 900, h: 368, campana: [.72, .5] }, 'violone-barroc': { src: 'cb-violone', w: 900, h: 368, campana: [.72, .5] },
    cb3: { src: 'cb-3cordes', w: 900, h: 301, campana: [.68, .5] }, 'cb3-bottesini': { src: 'cb-3cordes', w: 900, h: 301, campana: [.68, .5] },
    'cb-jazz': { src: 'cb-modern', w: 900, h: 356, campana: [.6, .5] }, cb: { src: 'cb-modern', w: 900, h: 356, campana: [.66, .5] },
    // Arpes (verticals): les notes surten del mig de les cordes.
    'arpa-egipcia': { src: 'ar-egipcia', w: 296, h: 680, campana: [.55, .35], alt: 235 }, 'arpa-celta': { src: 'ar-celta', w: 382, h: 671, campana: [.5, .4], alt: 235 },
    'arpa-dos': { src: 'ar-dos', w: 387, h: 685, campana: [.55, .4], alt: 235 }, 'arpa-1770': { src: 'ar-1770', w: 399, h: 700, campana: [.55, .4], alt: 235 },
    'arpa-erard': { src: 'ar-erard', w: 415, h: 691, campana: [.55, .4], alt: 235 }, arpa: { src: 'ar-moderna', w: 427, h: 691, campana: [.55, .4], alt: 235 },
    // Fusta de canya: les notes surten del pavelló (dreta).
    aulos: { src: 'ob-aulos', w: 900, h: 220, campana: [.97, .5], ample: 300 }, xirimia: { src: 'ob-xirimia', w: 900, h: 210, campana: [.97, .5], ample: 300 },
    'oboe-barroc': { src: 'ob-barroc', w: 900, h: 184, campana: [.97, .49], ample: 300 }, tenora: { src: 'ob-tenora', w: 900, h: 230, campana: [.97, .6], ample: 300 },
    triebert: { src: 'ob-triebert', w: 900, h: 135, campana: [.97, .5], ample: 300 }, oboe: { src: 'ob-modern', w: 900, h: 159, campana: [.97, .49], ample: 300 },
    memet: { src: 'cl-memet', w: 900, h: 161, campana: [.97, .5], ample: 300 }, chalumeau: { src: 'cl-chalumeau', w: 900, h: 127, campana: [.97, .47], ample: 300 },
    denner: { src: 'cl-denner', w: 900, h: 128, campana: [.97, .5], ample: 300 }, basset: { src: 'cl-basset', w: 900, h: 242, campana: [.97, .73], ample: 300 },
    'clarinet-boehm': { src: 'cl-boehm', w: 900, h: 142, campana: [.97, .5], ample: 300 }, clarinet: { src: 'cl-modern', w: 900, h: 145, campana: [.97, .5], ample: 300 },
    dulcia: { src: 'fg-dulcia', w: 900, h: 231, campana: [.97, .64], ample: 300 }, 'fagot-barroc': { src: 'fg-barroc', w: 900, h: 198, campana: [.97, .7], ample: 300 },
    'fagot-classic': { src: 'fg-barroc', w: 900, h: 198, campana: [.97, .7], ample: 300 }, heckel: { src: 'fg-heckel', w: 900, h: 204, campana: [.97, .68], ample: 300 },
    'fagot-1913': { src: 'fg-modern', w: 900, h: 167, campana: [.97, .73], ample: 300 }, fagot: { src: 'fg-modern', w: 900, h: 167, campana: [.97, .73], ample: 300 },
    // Metall greu.
    olifant: { src: 'tp-olifant', w: 900, h: 429, campana: [.95, .6] }, 'trompa-caca': { src: 'tp-caca', w: 900, h: 400, campana: [.95, .5] },
    'trompa-natural': { src: 'tp-caca', w: 900, h: 400, campana: [.95, .5] }, 'trompa-1818': { src: 'tp-1818', w: 852, h: 485, campana: [.9, .45] },
    'trompa-doble': { src: 'tp-moderna', w: 825, h: 523, campana: [.85, .35] }, trompa: { src: 'tp-moderna', w: 825, h: 523, campana: [.85, .35] },
    sacabutx: { src: 'tb-sacabutx', w: 900, h: 253, campana: [.79, .25], ample: 290 }, 'sacabutx-cat': { src: 'tb-sacabutx', w: 900, h: 253, campana: [.79, .25], ample: 290 },
    'trombo-1808': { src: 'tb-modern', w: 900, h: 281, campana: [.78, .35], ample: 290 }, 'trombo-banda': { src: 'tb-modern', w: 900, h: 281, campana: [.78, .35], ample: 290 },
    'trombo-jazz': { src: 'tb-modern', w: 900, h: 281, campana: [.78, .35], ample: 290 }, trombo: { src: 'tb-modern', w: 900, h: 281, campana: [.78, .35], ample: 290 },
    serpent: { src: 'tu-serpent', w: 356, h: 617, campana: [.4, .95], alt: 220 }, figle: { src: 'tu-figle', w: 244, h: 623, campana: [.5, .03], alt: 220 },
    'tuba-1835': { src: 'tu-1835', w: 446, h: 685, campana: [.5, .03], alt: 220 }, sousafon: { src: 'tu-sousafon', w: 677, h: 672, campana: [.75, .25], alt: 210 },
    'tuba-jazz': { src: 'tu-sousafon', w: 677, h: 672, campana: [.75, .25], alt: 210 }, tuba: { src: 'tu-moderna', w: 421, h: 701, campana: [.45, .04], alt: 220 },
    // Percussió: les notes surten de la pell, de les làmines o de les campanes.
    timbal: { src: 'pc-timbal-modern', w: 625, h: 686, campana: [.5, .1], alt: 190 }, naqqara: { src: 'pc-naqqara', w: 868, h: 510, campana: [.5, .15] },
    cavalleria: { src: 'pc-cavalleria', w: 900, h: 603, campana: [.5, .08] }, 'timbal-barroc': { src: 'pc-timbal-barroc', w: 900, h: 581, campana: [.5, .15] },
    'timbal-barroc-2': { src: 'pc-timbal-barroc', w: 900, h: 581, campana: [.5, .15] }, 'timbal-pedal': { src: 'pc-timbal-1881', w: 582, h: 663, campana: [.5, .08], alt: 190 },
    bateria: { src: 'pc-bateria', w: 900, h: 655, campana: [.45, .3], alt: 180 }, djembe: { src: 'pc-djembe', w: 440, h: 665, campana: [.5, .05], alt: 190 },
    mehter: { src: 'pc-mehter', w: 841, h: 624, campana: [.35, .3] }, turca: { src: 'pc-turca', w: 900, h: 555, campana: [.35, .2] },
    caixa: { src: 'pc-caixa', w: 538, h: 495, campana: [.5, .15] }, 'bateria-jazz': { src: 'pc-bateria-jazz', w: 899, h: 701, campana: [.45, .3], alt: 180 },
    gamelan: { src: 'pc-gamelan', w: 900, h: 503, campana: [.5, .3] }, balafon: { src: 'pc-balafon', w: 900, h: 514, campana: [.5, .2] },
    palla: { src: 'pc-palla', w: 900, h: 451, campana: [.5, .3] }, 'xilofon-1874': { src: 'pc-xilofon-1874', w: 900, h: 558, campana: [.5, .15] },
    marimba: { src: 'pc-marimba', w: 900, h: 548, campana: [.5, .1] }, xilofon: { src: 'lm-xilofon', w: 900, h: 576, campana: [.5, .1] },
    metalofon: { src: 'pc-xilofon', w: 900, h: 593, campana: [.5, .1] }, deagan: { src: 'lm-deagan', w: 900, h: 575, campana: [.5, .1] },
    ragtime: { src: 'lm-ragtime', w: 887, h: 615, campana: [.5, .12] }, timbila: { src: 'lm-timbila', w: 900, h: 510, campana: [.5, .15] },
    tecomates: { src: 'lm-tecomates', w: 900, h: 573, campana: [.5, .1] }, 'marimba-doble': { src: 'lm-doble', w: 900, h: 567, campana: [.5, .1] },
    musser: { src: 'lm-musser', w: 900, h: 560, campana: [.5, .1] }, 'marimba-abe': { src: 'pc-marimba', w: 900, h: 548, campana: [.5, .1] },
    campanes: { src: 'lm-tubulars', w: 900, h: 661, campana: [.5, .15], alt: 185 }, kebyar: { src: 'lm-gangsa', w: 900, h: 539, campana: [.5, .2] },
    vibrafon: { src: 'lm-vibrafon', w: 900, h: 602, campana: [.5, .1] }, orff: { src: 'lm-orff-metall', w: 900, h: 557, campana: [.5, .2] },
    bianzhong: { src: 'pc-bianzhong', w: 900, h: 599, campana: [.5, .3] }, carillo: { src: 'pc-carillo', w: 899, h: 704, campana: [.5, .2], alt: 185 },
    glockenspiel: { src: 'pc-glockenspiel', w: 819, h: 727, campana: [.5, .3], alt: 180 },
    'celesta-mustel': { src: 'pc-celesta-mustel', w: 723, h: 729, campana: [.5, .3], alt: 185 },
    'celesta-mustel-2': { src: 'pc-celesta-mustel', w: 723, h: 729, campana: [.5, .3], alt: 185 },
    celesta: { src: 'pc-celesta', w: 756, h: 717, campana: [.5, .3], alt: 185 },
  };
  const ARCS = { 'arc-contrabaix': { w: 900, h: 95 }, 'arc-medieval': { w: 900, h: 172 }, 'arc-barroc': { w: 900, h: 134 }, 'arc-tourte': { w: 900, h: 96 } };
  // Encaix d'una imatge "slice" al viewBox 360x640: on cau la fracció y.
  const yEscena = (e, frac) => {
    const { w, h } = EPOQUES[e], esc = Math.max(360 / w, 640 / h);
    return frac * h * esc - (h * esc - 640) / 2;
  };

  return {
    EPOQUES, SPRITES, ARCS, yEscena,
    fons: e => FONS[e](),
    illa,
    instrument: a => INST[a](),
    rellotge,
    colorMotes: e => COLOR_MOTES[e] || '#FFF1C9',
  };
})();

window.ART = ART;

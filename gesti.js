// ============================================================================
//  GESTI.JS  ·  I disegnini animati che fanno vedere il gesto (0.41)
//  Non sono video veri: sono disegni che si muovono, come i cartoni delle app
//  per imparare le lingue. Servono a far capire alla signora COME si fa una
//  cosa, senza leggere. Ogni gesto gira in tondo, due o tre secondi.
// ============================================================================
const SF = "#D8D2C6", LEG = "#C8A273", LEGS = "#A8824F", LEGO = "#8C6A3E";
const PEL = "#F6C6A0", PELS = "#E0A77F", BLU = "#4F7BE8", BIA = "#FFFFFF";
const freccia = (d) => `<path class="g-freccia" d="${d}" stroke="${BLU}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const pavimento = `<rect x="6" y="74" width="108" height="5" rx="2.5" fill="${SF}"/>`;
const S = (c) => `<svg viewBox="0 0 120 90" class="gesto ${c}" aria-hidden="true">`;

export const GESTI = {
  scatole: {
    nome: "spostare scatole o roba",
    svg: S("g-scatole") + pavimento +
      `<g fill="${LEG}" stroke="${LEGS}" stroke-width="1.4"><rect x="80" y="60" width="30" height="14" rx="2"/><rect x="80" y="46" width="30" height="14" rx="2"/></g>
       <path d="M80 53h30M80 67h30" stroke="${LEGO}" stroke-width="1.1"/>
       <g class="g-porta"><rect x="16" y="58" width="30" height="16" rx="2" fill="#E8C99C" stroke="${LEGS}" stroke-width="1.4"/><path d="M16 66h30M31 58v16" stroke="${LEGO}" stroke-width="1.1"/>
         <ellipse cx="13" cy="66" rx="5.4" ry="4.2" fill="${PEL}" stroke="${PELS}" stroke-width="1"/><ellipse cx="49" cy="66" rx="5.4" ry="4.2" fill="${PEL}" stroke="${PELS}" stroke-width="1"/></g>` +
      freccia("M54 34 H78 l-6-5 M78 34 l-6 5") + `</svg>`,
  },
  letto: {
    nome: "rifare il letto o cambiare le lenzuola",
    svg: S("g-letto") + pavimento +
      `<path d="M14 74V48a4 4 0 0 1 4-4h84a4 4 0 0 1 4 4v26" fill="#A98C6B"/>
       <rect x="14" y="56" width="92" height="18" rx="3" fill="#EFEAE0"/>
       <rect x="20" y="46" width="26" height="12" rx="4" fill="${BIA}" stroke="#DDD6C9" stroke-width="1.2"/>
       <g class="g-lenzuolo"><path d="M50 58 Q72 50 104 58 L104 72 Q72 66 50 72Z" fill="${BIA}" stroke="#D9D3C6" stroke-width="1.2"/></g>` +
      freccia("M62 32 H92 l-6-5 M92 32 l-6 5") + `</svg>`,
  },
  asciugamani: {
    nome: "piegare asciugamani o biancheria",
    svg: S("g-asciug") + pavimento +
      `<rect x="10" y="68" width="100" height="6" rx="3" fill="#C9C2B4"/>
       <rect x="24" y="36" width="72" height="32" rx="3" fill="#EAF2FB" stroke="#B9CEE6" stroke-width="1.4"/>
       <path d="M24 46h72M24 58h72" stroke="#CBDCEE" stroke-width="1.2"/>
       <g class="g-piega"><rect x="24" y="36" width="36" height="32" rx="3" fill="#DCE9F7" stroke="#A9C3DF" stroke-width="1.4"/><path d="M30 44h24M30 54h24" stroke="#BCD2E8" stroke-width="1.2"/></g>` +
      freccia("M64 24 H88 l-6-5 M88 24 l-6 5") + `</svg>`,
  },
  spray: {
    nome: "spruzzare e passare il panno",
    svg: S("g-spray") + pavimento +
      `<rect x="8" y="58" width="104" height="16" rx="3" fill="#E4DED2"/>
       <g class="g-panno"><rect x="18" y="48" width="26" height="12" rx="3" fill="#8FD0C2" stroke="#5FAE9D" stroke-width="1.3"/><ellipse cx="31" cy="44" rx="6" ry="4.4" fill="${PEL}" stroke="${PELS}" stroke-width="1"/></g>
       <g><rect x="80" y="40" width="16" height="24" rx="3" fill="#7FB0F2" stroke="#4F7BE8" stroke-width="1.3"/><rect x="84" y="32" width="8" height="9" rx="2" fill="#4F7BE8"/><path d="M80 36h-8l4-5" stroke="#4F7BE8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
       <g class="g-goccia" fill="#9FD3FF"><circle cx="66" cy="34" r="2.4"/><circle cx="59" cy="38" r="1.8"/><circle cx="62" cy="29" r="1.6"/></g></svg>`,
  },
  finestra: {
    nome: "aprire la finestra e cambiare aria",
    svg: S("g-finestra") +
      `<rect x="26" y="16" width="68" height="58" rx="3" fill="#CFE6FF" stroke="#8FA8C4" stroke-width="2"/>
       <path d="M60 16v58M26 45h68" stroke="#8FA8C4" stroke-width="1.6"/>
       <g class="g-anta-sx"><rect x="26" y="16" width="34" height="58" rx="3" fill="#E7F2FF" stroke="#8FA8C4" stroke-width="2"/><circle cx="55" cy="45" r="2" fill="#8FA8C4"/></g>
       <g class="g-aria" stroke="${BLU}" stroke-width="2.2" fill="none" stroke-linecap="round">
         <path d="M8 34 q10 -5 20 0"/><path d="M6 46 q12 -6 24 0"/><path d="M10 58 q9 -5 18 0"/></g></svg>`,
  },
  pavimento: {
    nome: "lavare o scopare per terra",
    svg: S("g-pav") + pavimento +
      `<g class="g-mop"><path d="M74 18 L62 60" stroke="#B57A33" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M52 58 h22 l4 14 h-30Z" fill="#8FD0C2" stroke="#5FAE9D" stroke-width="1.3"/>
        <ellipse cx="76" cy="20" rx="5.6" ry="4.4" fill="${PEL}" stroke="${PELS}" stroke-width="1"/></g>
       <g class="g-lucido" fill="#9FD3FF" opacity=".75"><ellipse cx="30" cy="70" rx="9" ry="3"/><ellipse cx="94" cy="70" rx="9" ry="3"/></g></svg>`,
  },
  armadio: {
    nome: "mettere via o prendere dall'armadio",
    svg: S("g-armadio") + pavimento +
      `<rect x="26" y="14" width="68" height="60" rx="3" fill="#C8A273" stroke="${LEGS}" stroke-width="2"/>
       <rect x="32" y="20" width="56" height="48" rx="2" fill="#E8DCC6"/>
       <rect x="38" y="26" width="44" height="8" rx="2" fill="#CFE6FF"/><rect x="38" y="38" width="44" height="8" rx="2" fill="#F7D3D6"/>
       <g class="g-anta"><rect x="60" y="14" width="34" height="60" rx="3" fill="#D2AE7E" stroke="${LEGS}" stroke-width="2"/><circle cx="65" cy="45" r="2.2" fill="${LEGO}"/></g></svg>`,
  },
  bidone: {
    nome: "svuotare il cestino o la spazzatura",
    svg: S("g-bidone") + pavimento +
      `<path d="M28 34 h34 l-4 40 h-26Z" fill="#9AA3B2" stroke="#6F7888" stroke-width="1.5"/>
       <rect x="24" y="29" width="42" height="7" rx="3" fill="#7C8696"/>
       <g class="g-sacco"><path d="M70 34 q12 4 12 18 t-12 20 q-12 -4 -12 -20 t12 -18Z" fill="#4C535F"/><path d="M64 33 q6 -6 12 0" stroke="#4C535F" stroke-width="3" fill="none" stroke-linecap="round"/></g>` +
      freccia("M60 18 H86 l-6-5 M86 18 l-6 5") + `</svg>`,
  },
};
export const ELENCO_GESTI = Object.entries(GESTI).map(([k, g]) => `${k} = ${g.nome}`).join(" · ");
export function disegnoGesto(id) { return GESTI[id] ? GESTI[id].svg : ""; }
export function gestoValido(id) { return GESTI[id] ? id : ""; }

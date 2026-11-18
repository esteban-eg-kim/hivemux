// The bees of the 2D office (building.js, when there is no WebGL 2 or Settings → View is 2D): flat cartoon bees in
// SVG. BEE.pose.<name>(persona) gives an SVG of 110 × 100 with the feet at the bottom, the bee facing right and
// what it holds on the right; persona = { tone, hair: 0-3, hairColor, hat: '' | 'beanie' | 'cap', hatColor,
// glasses, shirt }. BEE.bee(persona, parts) draws one for poses of its own. The page reads it as BEE2D (below).
// 2D 사무실의 벌 (WebGL 2 가 없거나 설정 → 보기가 2D 일 때 building.js 가 쓴다): SVG 로 그린 평면 카툰 벌.
// BEE.pose.<이름>(persona) 은 110 × 100 SVG 를 준다. 발이 아래, 오른쪽을 보고, 든 것은 오른쪽에.
// BEE.bee(persona, parts) 로 다른 자세를 그린다.
const BEE = (() => {
  const O = '#2a241d', BLUSH = '#f4a09a', WING = '#ffffff';
  let uid = 0;
  const st = (w = 2.4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const arm = (d, p, hand) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${p.shirt}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    (hand ? `<circle cx="${hand[0]}" cy="${hand[1]}" r="3.8" fill="${p.tone}" ${st(2)}/>` : '');
  const LEGS = {
    stand: `<path d="M37 85 L36 94 M48 86 L49 95" ${st(4.6)}/><path d="M33 95 h5 M47 96 h5" ${st(4.6)}/>`,
    sit: `<path d="M40 86 L54 89 M48 84 L62 86" ${st(4.6)}/><path d="M55 87 v3 M63 84 v3" ${st(4.6)}/>`,
    // two steps that take turns (the page animates .lg1 / .lg2) / 번갈아 보이는 두 걸음 (페이지가 .lg1 / .lg2 를 움직인다)
    walk: `<g class="lg1"><path d="M38 85 L31 93 M48 86 L55 93" ${st(4.6)}/><path d="M28 93 h5 M54 94 h5" ${st(4.6)}/></g>` +
      `<g class="lg2"><path d="M38 85 L43 94 M48 86 L44 94" ${st(4.6)}/><path d="M42 94 h5 M43 95 h5" ${st(4.6)}/></g>`,
    none: '',
  };
  function eyes(kind, dx = 0, dy = 0) {
    const L = [47 + dx, 36 + dy], R = [60 + dx, 35.5 + dy];
    if (kind === 'closed') return `<path d="M${L[0] - 4} ${L[1]} q4 3 8 0 M${R[0] - 4} ${R[1]} q4 3 8 0" fill="none" ${st(2.2)}/>`;
    if (kind === 'happy') return `<path d="M${L[0] - 4} ${L[1] + 1} q4 -5 8 0 M${R[0] - 4} ${R[1] + 1} q4 -5 8 0" fill="none" ${st(2.2)}/>`;
    return [L, R].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="5.4" fill="${O}"/><circle cx="${x + 1.4}" cy="${y - 2}" r="1.5" fill="#fff"/>`).join('');
  }
  const MOUTH = {
    smile: `<path d="M51 45 q3.5 3.5 7 0" fill="none" ${st(2)}/>`,
    grin: `<path d="M50 44 h9 q-1 6 -4.5 6 q-3.5 0 -4.5 -6z" fill="#7a2e2a" ${st(2)}/>`,
    o: `<ellipse cx="55" cy="46" rx="2.2" ry="2.8" fill="#7a2e2a" ${st(1.8)}/>`,
    flat: `<path d="M52 46 h5" ${st(2)}/>`,
  };
  function hairHat(p) {
    const hc = p.hairColor || '#5a3b22', tc = p.hatColor || '#4a7bd0';
    let s = '';
    if (p.hat === 'beanie') s += `<path d="M29 31 Q30 10 50 10 Q70 10 71 31 Z" fill="${tc}" ${st()}/>` +
      `<path d="M28 30 Q50 25 72 30 L72 35 Q50 30 28 35 Z" fill="${tc}" ${st()}/><path d="M28 32.5 Q50 27.5 72 32.5" fill="none" stroke="${O}" stroke-width="1.2" opacity=".35"/>` +
      `<circle cx="50" cy="9" r="4.5" fill="#fff" ${st(2)}/>`;
    else if (p.hat === 'cap') s += `<path d="M30 29 Q31 12 50 12 Q67 12 69 27 Z" fill="${tc}" ${st()}/>` +
      `<path d="M63 26 Q80 25 84 31 Q73 33 62 30 Z" fill="${tc}" ${st()}/><circle cx="50" cy="12" r="2" fill="${O}"/>`;
    else if (p.hair === 1) s += `<path d="M49 16 q-3 -9 6 -10 q-5 5 -1 10 z" fill="${hc}" ${st(2)}/>`;
    else if (p.hair === 2) s += `<path d="M29 35 Q29 13 50 14 Q72 14 72 33 Q65 24 56 26 Q48 21 40 27 Q33 28 29 35 Z" fill="${hc}" ${st()}/>`;
    else if (p.hair === 3) s += [[37, 21, 6], [45, 15.5, 6.5], [55, 15, 6.3], [63, 20, 5.6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hc}" ${st(2)}/>`).join('');
    return s;
  }
  const antennae = () => `<path d="M43 18 Q38 9 33 6 M56 16 Q60 7 65 5" fill="none" ${st(2.2)}/><circle cx="33" cy="6" r="3.2" fill="${O}"/><circle cx="65" cy="5" r="3.2" fill="${O}"/>`;
  const glasses = () => `<g fill="none" ${st(2)}><circle cx="47" cy="36" r="6.8"/><circle cx="60" cy="35.5" r="6.8"/><path d="M53.8 35.6 h-0.2 M40.2 35 L33 33"/></g>`;

  // one bee; o = {back, mid, front, before, after, legs, eyes, dx, dy, mouth, transform}
  function bee(p, o = {}) {
    const id = `b${++uid}`;
    const body = `
      <path d="M15 79 L6 83 L15 85 Z" fill="${O}"/>
      <clipPath id="${id}a"><ellipse cx="26" cy="76" rx="13" ry="10.5" transform="rotate(-20 26 76)"/></clipPath>
      <ellipse cx="26" cy="76" rx="13" ry="10.5" transform="rotate(-20 26 76)" fill="${p.tone}"/>
      <g clip-path="url(#${id}a)" fill="${O}"><rect x="16" y="60" width="4.2" height="30" transform="rotate(-20 26 76)"/><rect x="25" y="60" width="4.2" height="30" transform="rotate(-20 26 76)"/></g>
      <ellipse cx="26" cy="76" rx="13" ry="10.5" transform="rotate(-20 26 76)" fill="none" ${st()}/>
      <g class="wg" fill="${WING}" ${st(2.2)}><ellipse cx="24" cy="48" rx="12.5" ry="7.5" transform="rotate(-35 24 48)"/><ellipse cx="20" cy="59" rx="9" ry="5.6" transform="rotate(-12 20 59)"/></g>
      <g class="ba">${o.back || ''}</g>
      <clipPath id="${id}b"><ellipse cx="43" cy="70" rx="17" ry="17"/></clipPath>
      <ellipse cx="43" cy="70" rx="17" ry="17" fill="${p.tone}"/>
      <g clip-path="url(#${id}b)"><rect x="20" y="50" width="50" height="25" fill="${p.shirt}"/><path d="M20 75 h50" ${st(2)}/><rect x="20" y="79" width="50" height="4.4" fill="${O}"/></g>
      <ellipse cx="43" cy="70" rx="17" ry="17" fill="none" ${st()}/>
      ${LEGS[o.legs || 'stand']}`;
    const head = `
      <circle cx="51" cy="35" r="21" fill="${p.tone}" ${st()}/>
      ${p.hat ? hairHat(p) + antennae() : antennae() + hairHat(p)}
      <ellipse cx="42" cy="44" rx="3.6" ry="2.2" fill="${BLUSH}"/><ellipse cx="66" cy="43" rx="3.3" ry="2.1" fill="${BLUSH}"/>
      ${eyes(o.eyes, o.dx, o.dy)}${p.glasses ? glasses() : ''}${MOUTH[o.mouth || 'smile']}`;
    // the classes are for the page's motion: .bd the whole bee, .hd its head, .wg its wings, .ba / .fa its arms
    // 클래스는 페이지의 움직임용: .bd 벌 전체, .hd 머리, .wg 날개, .ba / .fa 팔
    return `${o.before || ''}<g class="bd"><g${o.transform ? ` transform="${o.transform}"` : ''}>${body}<g class="hd">${head}</g>${o.mid || ''}<g class="fa">${o.front || ''}</g></g></g>${o.after ? `<g class="af">${o.after}</g>` : ''}`;
  }

  const WOOD = '#b98454', CHAIR = '#5aa9a0';
  const stool = `<rect x="22" y="86" width="34" height="5" rx="2.5" fill="${WOOD}" ${st(2)}/><path d="M28 91 v8 M50 91 v8" ${st(3)}/>`;
  const armchair = (c = CHAIR) => `<rect x="12" y="58" width="16" height="36" rx="6" fill="${c}" ${st()}/><rect x="14" y="83" width="52" height="12" rx="5" fill="${c}" ${st()}/><path d="M18 95 v4 M60 95 v4" ${st(3)}/>`;
  const armrest = (c = CHAIR) => `<rect x="58" y="76" width="11" height="19" rx="5" fill="${c}" ${st()}/>`;
  const svg = (inner, w = 110) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 100" role="img">${inner}</svg>`;

  const pose = {
    typing: p => svg(stool + bee(p, {
      legs: 'sit', dx: 2, dy: 1, mouth: 'flat',
      back: arm('M34 61 Q44 74 64 73', p),
      mid: `<rect x="60" y="78" width="50" height="5" fill="${WOOD}" ${st(2)}/><path d="M104 83 v16" ${st(3)}/>` +
        `<path d="M66 77 h30" ${st(4)}/><path d="M72 76 L78 53 L98 53 L93 76 Z" fill="#cfd6df" ${st()}/>` +
        `<path d="M82 63 l3 -2 l3 2 v3.4 l-3 2 l-3 -2 z" fill="#f5a524" ${st(1.4)}/>`,
      front: arm('M53 61 Q64 66 70 73', p, [70, 73.5]) + `<path d="M70 66 l-1.5 -3 M75 68 l1 -3" ${st(1.6)}/>`,
    })),
    waiting: p => svg(bee(p, {
      mouth: 'o', dy: -1,
      back: arm('M33 61 Q29 68 30 75', p, [30, 76]),
      front: arm('M54 60 Q72 54 74 24', p, [74, 21]),
      after: `<path d="M81 4 h20 a6 6 0 0 1 6 6 v9 a6 6 0 0 1 -6 6 h-11 l-6 6 l1 -6 h-4 a6 6 0 0 1 -6 -6 v-9 a6 6 0 0 1 6 -6 z" fill="#fff" ${st(2)}/>` +
        `<text x="91.5" y="21.5" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="${O}">?</text>`,
    })),
    done: p => svg(bee(p, {
      eyes: 'happy', mouth: 'grin',
      back: arm('M34 61 Q44 74 55 72', p),
      mid: `<rect x="55" y="58" width="17" height="6" rx="2" fill="#c2853a" ${st(2)}/><rect x="53" y="63" width="21" height="22" rx="6" fill="#f5a524" ${st()}/>` +
        `<rect x="57" y="69" width="13" height="9" rx="2" fill="#fff6dc" ${st(1.6)}/><path d="M61 73.5 l2.5 -2 l2.5 2" fill="none" ${st(1.4)}/>`,
      front: `<circle cx="54" cy="73" r="3.8" fill="${p.tone}" ${st(2)}/>` + arm('M53 61 Q70 62 73 71', p, [73, 72]),
    })),
    resting: p => svg(armchair() + bee(p, {
      legs: 'sit', eyes: 'closed', mouth: 'smile',
      back: arm('M34 62 Q30 72 36 79', p),
      mid: `<path d="M71 52 q5 0 5 4 q0 4 -5 4" fill="none" ${st(2)}/><path d="M61 49 h11 l-1.5 13 h-8 z" fill="#fff" ${st(2)}/><path d="M62 52 h9" stroke="#8a5a3a" stroke-width="2"/>` +
        `<path d="M64 45 q-2 -3 0 -6 q2 -3 0 -6 M69 45 q-2 -3 0 -6" fill="none" ${st(1.6)} opacity=".55"/>`,
      front: arm('M53 62 Q63 68 64 59', p, [63, 58]) + armrest(),
    })),
    sleeping: p => svg(`<rect x="4" y="80" width="104" height="12" rx="5" fill="#e6d3b3" ${st()}/><path d="M10 92 v6 M102 92 v6" ${st(3)}/><ellipse cx="88" cy="76" rx="15" ry="6" fill="#fff" ${st()}/>` +
      bee(p, { legs: 'stand', eyes: 'closed', mouth: 'flat', transform: 'translate(8 27) rotate(78 55 55)' }) +
      `<path d="M12 70 Q14 60 30 60 L66 60 Q74 61 74 70 L74 84 L10 84 Z" fill="#8bb8e8" ${st()}/><path d="M14 66 h56" stroke="#fff" stroke-width="2" opacity=".7"/>` +
      `<g class="zz"><text x="84" y="44" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="${O}">z</text><text x="93" y="32" font-family="system-ui, sans-serif" font-weight="800" font-size="16" fill="${O}">Z</text></g>`),
    walking: p => svg(`<path d="M6 60 h9 M3 68 h11 M7 76 h7" ${st(2.2)} opacity=".45"/>` + bee(p, {
      legs: 'walk', dx: 1.5, transform: 'rotate(5 45 80)',
      back: arm('M34 61 Q40 70 46 72', p),
      front: arm('M53 61 Q48 70 44 76', p, [44, 77]),
    })),
    tv: p => svg(armchair('#e85d75') + `<rect x="78" y="44" width="30" height="22" rx="3" fill="${O}"/><rect x="81" y="47" width="24" height="16" rx="1.5" fill="#5aa9ff"/>` +
      `<path d="M81 63 L89 55 L95 60 L99 56 L105 62 V63 Z" fill="#3ecf8e"/><circle cx="99" cy="51" r="2.2" fill="#ffd34d"/><path d="M86 66 l-3 8 M100 66 l3 8 M80 74 h26" ${st(2.6)}/>` + bee(p, {
      legs: 'sit', dx: 3, mouth: 'smile',
      back: arm('M34 62 Q30 72 36 79', p),
      front: arm('M53 62 Q62 66 69 61', p, [69, 61]) + `<rect x="68" y="53" width="5" height="10" rx="1.5" fill="${O}"/>` + armrest('#e85d75'),
    })),
    reading: p => svg(armchair('#8b5cf6') + bee(p, {
      legs: 'sit', dx: 2, dy: 2.5, mouth: 'flat',
      back: arm('M34 62 Q44 72 55 68', p),
      mid: `<path d="M53 57 Q62 53 66 58 Q71 53 80 57 L80 73 Q71 69 66 74 Q62 69 53 73 Z" fill="#fff" ${st(2)}/><path d="M66 58 V74" ${st(1.6)}/>` +
        `<path d="M56 61 h7 M56 64.5 h7 M69 61 h8 M69 64.5 h8" stroke="#b8b0a2" stroke-width="1.4"/>`,
      front: `<circle cx="54" cy="68" r="3.8" fill="${p.tone}" ${st(2)}/>` + arm('M53 62 Q70 70 79 68', p, [79, 68]) + armrest('#8b5cf6'),
    })),
    phone: p => svg(bee(p, {
      dx: 2.5, dy: 2.5, mouth: 'smile',
      back: arm('M33 61 Q29 68 30 75', p, [30, 76]),
      mid: `<rect x="66" y="45" width="10" height="17" rx="2.5" fill="${O}"/><rect x="68" y="47.5" width="6" height="11" rx="1" fill="#5aa9ff"/>`,
      front: arm('M53 62 Q64 70 67 59', p, [67, 58.5]),
    })),
    standing: p => svg(bee(p, {
      back: arm('M34 61 Q30 69 31 76', p, [31, 77]),
      front: arm('M53 61 Q57 69 55 76', p, [55, 77]),
    })),
    chat: p => svg(bee(p, {
      mouth: 'grin',
      back: arm('M34 61 Q30 69 31 76', p, [31, 77]),
      front: arm('M53 61 Q66 62 70 52', p, [70, 51]),
    })),
    beer: p => svg(bee(p, {
      eyes: 'happy', mouth: 'grin',
      back: arm('M34 61 Q30 69 31 76', p, [31, 77]),
      mid: `<rect x="62" y="40" width="13" height="18" rx="2" fill="#f2b632" ${st(2)}/><path d="M75 44 q5 0 5 5 q0 5 -5 5" fill="none" ${st(2)}/><rect x="61" y="37" width="15" height="5" rx="2.5" fill="#fff" ${st(1.6)}/>`,
      front: arm('M53 61 Q64 66 64 55', p, [64, 54]),
    })),
    board: p => svg(`<rect x="70" y="18" width="38" height="30" rx="2" fill="#fff" ${st()}/><path d="M76 27 h22 M76 34 h26 M76 41 h16" stroke="#5aa9ff" stroke-width="2.4" stroke-linecap="round"/><path d="M89 48 v44 M80 92 h18" ${st(2.6)}/>` + bee(p, {
      mouth: 'o',
      back: arm('M34 61 Q30 69 31 76', p, [31, 77]),
      front: arm('M53 60 Q66 52 72 38', p, [72, 37]),
    })),
    pong: p => svg(bee(p, {
      mouth: 'grin',
      back: arm('M34 61 Q30 69 31 76', p, [31, 77]),
      mid: `<circle cx="78" cy="52" r="8" fill="#d63b3b" ${st(2)}/><path d="M73 59 l-5 6" ${st(3)}/><circle class="ball" cx="96" cy="40" r="3" fill="#ff9f2e" ${st(1.4)}/>`,
      front: arm('M53 61 Q64 66 69 64', p, [69, 64]),
    })),
    swim: p => svg(bee(p, {
      legs: 'none', mouth: 'grin',
      front: arm('M53 62 Q68 58 76 66', p, [76, 66]),
    }) + `<path d="M0 64 q9 -5 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 V100 H0 Z" fill="#7fd0e6" ${st(2)}/>`),
    clapping: p => svg(bee(p, {
      eyes: 'happy', mouth: 'grin',
      front: arm('M36 62 Q50 72 64 60', p, [64, 59]) + arm('M53 62 Q60 68 67 57', p, [67, 56]) +
        `<path d="M73 50 q4 4 0 9 M77 46 q7 7 0 16 M60 49 l-2 -4" fill="none" ${st(2)}/>`,
    })),
  };
  return { pose, bee };
})();
// building.js has a BEE of its own (the 3D bees' materials): the page reads these as BEE2D
// building.js 에는 자기 BEE (3D 벌의 재질) 가 있다: 페이지는 이것을 BEE2D 로 읽는다
window.BEE2D = BEE;

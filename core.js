// 보이는 길 — 순수 게임 로직 (렌더링과 무관)
// 규칙: 지금 보는 각도에서 두 칸의 윗면이 '맞닿아 보이면' 이어진 길이다. 각도는 어떤 값이든 된다.
// 카메라는 V 방향(카메라 쪽)에서 평행 투영으로 본다. 기울기는 PITCH_MIN~PITCH_MAX 로 제한.
//
// 두 칸 A, B가 한 칸 방향 d로 맞닿아 보이려면 w = B - A - d 가 시선 V와 평행해야 한다.
// 그래서 높이 차가 Δy인 두 칸은 수평 거리 |w_xz|가 Δy/tan(PITCH_MAX) ~ Δy/tan(PITCH_MIN) 사이일 때만 이어질 수 있다.

var PITCH_MIN_DEG = 20, PITCH_MAX_DEG = 65;

var LEVELS = [
  {
    name: "돌아가는 다리",
    hint: "색이 칠해진 손잡이를 누르면 같은 색 다리가 돌아갑니다. 두 다리를 이어 빛나는 곳까지 가세요.",
    sky: ["#fbe9dc", "#ecc9c2"], stone: ["#f6e6d6", "#e0b49b", "#c48d76"],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],[0,-3,0],
             [4,-1,0],[4,-2,0],
             [6,0,0],[7,0,0],[7,0,1],[6,-1,0],[6,-2,0],[6,-3,0],
             [7,-1,3],[7,-2,3],
             [7,0,5],[7,-1,5],[7,-2,5],
             [2,0,-2],[9,0,2],[9,-1,-1],[9,-2,-1]],
    deco: [{ at: [9,-1,-1], type: "dome" }],
    groups: [
      { type: "rot", axis: "y", pivot: [4,0,0], blocks: [[4,0,-1],[4,0,0],[4,0,1]], handle: [2,0,-2] },
      { type: "rot", axis: "y", pivot: [7,0,3], blocks: [[6,0,3],[7,0,3],[8,0,3]], handle: [9,0,2] }
    ],
    start: [0,0,0], goal: [7,0,5]
  },
  {
    name: "보이는 대로",
    hint: "세계를 이리저리 돌리고 기울여서, 낮은 길 끝과 탑이 맞닿아 보이는 각도를 찾으세요. 맞닿아 보이면 이어진 길입니다.",
    sky: ["#eef3e2", "#cfdcc4"], stone: ["#eef0dc", "#b9c49a", "#94a27a"],
    view: [283, 43],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],
             [4,2,2],[4,2,3],[4,2,4],[4,1,2],[4,0,2],[4,-1,2],
             [5,2,4]],
    deco: [{ at: [5,2,4], type: "tree" }],
    groups: [],
    start: [0,0,0], goal: [4,2,4]
  },
  {
    name: "함께 돌기",
    hint: "다리 위에 선 채로 손잡이를 돌리면 다리와 함께 돌아갑니다. 그다음엔 탑과 맞닿는 각도를 찾으세요.",
    sky: ["#ecebf6", "#cdc6e2"], stone: ["#e7e4f2", "#a9a3c9", "#8780ab"],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],
             [4,-1,0],[4,-2,0],
             [4,0,2],[4,0,3],[4,-1,3],[4,-2,3],
             [4,2,7],[4,2,8],[4,1,7],[4,0,7],[4,-1,7],[3,2,8],
             [1,0,-2]],
    deco: [{ at: [3,2,8], type: "dome" }],
    groups: [
      { type: "rot", axis: "y", pivot: [4,0,0], blocks: [[3,0,0],[4,0,0],[5,0,0]], handle: [1,0,-2] }
    ],
    start: [0,0,0], goal: [4,2,8]
  },
  {
    name: "긴 팔",
    hint: "한 칸 높은 팔은 지금은 어느 각도로 봐도 닿지 않아요. 팔을 돌려 가까이 끌어온 뒤 올라타세요.",
    sky: ["#e4eef5", "#bcd2e2"], stone: ["#eef3f6", "#a8bfd0", "#7f9db3"],
    blocks: [[0,0,0],[1,0,0],[0,-1,0],[0,-2,0],[0,0,1],[0,-1,1],
             [6,0,0],[6,-1,0],[6,-2,0],
             [6,1,4],[7,1,4],[6,0,4],[6,-1,4],[7,0,4],[7,1,5],
             [1,0,-2],[8,0,1],[8,-1,1]],
    deco: [{ at: [7,1,5], type: "flag" }, { at: [0,0,1], type: "tree" }, { at: [8,0,1], type: "dome" }],
    groups: [
      { type: "rot", axis: "y", pivot: [6,1,0], blocks: [[6,1,0],[6,1,-1],[6,1,-2],[6,1,-3]], handle: [1,0,-2] }
    ],
    start: [0,0,0], goal: [6,1,4]
  },
  {
    name: "정원의 끝",
    hint: "다리와 함께 돌고, 탑과 맞닿는 각도를 찾고, 먼 팔을 끌어와 올라타세요.",
    sky: ["#f3e6ee", "#d6bfd6"], stone: ["#f3e8ef", "#c9a7c0", "#a07f98"],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],
             [4,-1,0],[4,-2,0],
             [4,0,2],[4,0,3],[4,-1,3],[4,-2,3],
             [4,2,7],[4,2,8],[4,2,9],[4,1,7],[4,0,7],[4,-1,7],
             [4,3,17],[4,2,17],[4,1,17],
             [4,4,22],[4,4,23],[4,3,22],[4,2,22],[5,4,23],
             [1,0,-2],[6,1,9]],
    deco: [{ at: [5,4,23], type: "tree" }],
    groups: [
      { type: "rot", axis: "y", pivot: [4,0,0], blocks: [[3,0,0],[4,0,0],[5,0,0]], handle: [1,0,-2] },
      { type: "rot", axis: "y", pivot: [4,4,17], blocks: [[4,4,17],[5,4,17],[6,4,17],[7,4,17],[8,4,17]], handle: [6,1,9] }
    ],
    start: [0,0,0], goal: [4,4,23]
  },
  {
    name: "벽 타기",
    hint: "지렛대 위에 선 채로 손잡이를 돌리면 벽에 서게 됩니다. 벽에 붙은 엘리베이터와 미끄럼 발판을 타고 건너가세요.",
    sky: ["#f5ece0", "#e2cdb5"], stone: ["#f6efe4", "#d4b996", "#b0936f"],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],
             [4,0,0],
             [6,3,0],[7,3,0],
             [12,3,0],[12,2,0],[12,1,0],
             [14,2,1],[15,2,1],
             [1,0,-2],[5,-2,-2],[9,1,-2]],
    deco: [{ at: [15,2,1], type: "dome" }],
    groups: [
      { type: "rot", axis: "x", pivot: [3,0,0], blocks: [[3,0,0],[3,0,-1]], handle: [1,0,-2] },
      { type: "slide", offset: [0,3,0], steps: 2, blocks: [[5,0,0]], handle: [5,-2,-2], capTop: true },
      { type: "slide", offset: [3,0,0], steps: 2, blocks: [[8,3,0]], handle: [9,1,-2], capTop: true }
    ],
    capped: [[4,0,0],[6,3,0],[7,3,0],[12,3,0],[14,2,1]],
    start: [0,0,0], goal: [14,2,1], goalN: [0,0,1]
  },
  {
    name: "벽 위의 시계",
    hint: "벽에 선 다음, 시계바늘에 올라타 함께 돌고, 벽 엘리베이터로 더 높이 올라가세요. 마지막 벽은 한 칸 앞에 있어요.",
    sky: ["#f1e9f3", "#d5c4dc"], stone: ["#f4eef6", "#c3abc9", "#9c84a3"],
    view: [25, 35],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],
             [4,0,0],[4,1,0],[4,2,0],[4,-1,0],
             [13,5,0],[14,5,0],
             [16,6,1],[17,6,1],
             [1,0,-2],[9,0,0],[13,1,-2]],
    deco: [{ at: [17,6,1], type: "dome" }],
    groups: [
      { type: "rot", axis: "x", pivot: [3,0,0], blocks: [[3,0,0],[3,0,-1]], handle: [1,0,-2] },
      { type: "rot", axis: "z", pivot: [8,2,0], blocks: [[8,2,0],[8,3,0],[8,4,0],[8,5,0]], handle: [9,0,0], capTop: true },
      { type: "slide", offset: [0,3,0], steps: 2, blocks: [[12,2,0]], handle: [13,1,-2], capTop: true }
    ],
    capped: [[4,2,0],[13,5,0],[14,5,0],[16,6,1]],
    start: [0,0,0], goal: [16,6,1], goalN: [0,0,1]
  },
  {
    name: "세 개의 벽",
    hint: "바닥에서 앞벽으로, 앞벽에서 옆벽으로. 회전판은 다리도 되고, 올라탄 채 돌리면 벽을 바꿔 줍니다.",
    sky: ["#e8eef0", "#c2d3d8"], stone: ["#eef3f4", "#a9c0c6", "#82a0a8"],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],
             [4,0,0],[4,1,0],[4,2,0],[4,3,0],[4,-1,0],
             [3,-1,0],
             [6,3,-1],[6,2,-1],
             [7,4,-8],[8,4,-9],[8,3,-8],[8,3,-9],
             [1,0,-2],[7,1,0],[8,1,-4]],
    deco: [{ at: [8,4,-9], type: "dome" }],
    groups: [
      { type: "rot", axis: "x", pivot: [3,0,0], blocks: [[3,0,0],[3,0,-1]], handle: [1,0,-2] },
      { type: "rot", axis: "y", pivot: [6,3,0], blocks: [[6,3,0],[7,3,0]], handle: [7,1,0] },
      { type: "rot", axis: "x", pivot: [6,3,-4], blocks: [[6,3,-4],[6,4,-4],[6,5,-4],[6,6,-4]], handle: [8,1,-4] }
    ],
    start: [0,0,0], goal: [7,4,-8], goalN: [1,0,0]
  },
  {
    name: "거꾸로 매달리기",
    hint: "지렛대를 두 번 넘기면 천장에 매달립니다. 밑에서 올려다보며 더 낮은 천장으로 내려갔다가, 회전판을 타고 돌아 다시 위 천장으로 올라가세요.",
    sky: ["#e9ecf6", "#c4c9e3"], stone: ["#eff1f8", "#aab1d3", "#8189b3"],
    pitch: [-65, 65],
    blocks: [[0,0,0],[1,0,0],[2,0,0],[0,-1,0],[0,-2,0],
             [3,-1,0],
             [4,0,0],[4,0,1],[4,0,2],[4,1,0],[4,1,2],
             [4,-2,5],[5,-2,5],[4,-1,5],
             [12,-1,5],[13,-1,5],[12,0,5],
             [1,0,-2],[9,0,3]],
    deco: [{ at: [13,-1,5], type: "tree" }, { at: [4,1,2], type: "dome" }, { at: [4,1,0], type: "dome" }, { at: [12,0,5], type: "flag" }],
    groups: [
      { type: "rot", axis: "x", pivot: [3,0,0], blocks: [[3,0,0],[3,0,-1]], handle: [1,0,-2] },
      { type: "rot", axis: "y", pivot: [8,-2,5], blocks: [[8,-2,5],[8,-2,4],[8,-2,3]], handle: [9,0,3], faces: [[0,1,0],[0,-1,0]] }
    ],
    start: [0,0,0], goal: [12,-1,5], goalN: [0,-1,0]
  },
  {
    name: "하늘 탑",
    hint: "지금까지의 모든 것. 고리를 타고 돌고, 지렛대로 바깥 벽에 서서 맨 아래까지 내려갔다가, 엘리베이터로 올라 다시 일어서세요. 꼭대기에서 친구가 기다려요.",
    sky: ["#f6e7da", "#d9b9c4"], stone: ["#f7eee6", "#d1b2a6", "#a98a80"],
    pitch: [20, 50],
    view: [25, 35],
    cylinders: [{ c: [0, 0], r: 2.4, y: [-3, 6.5] }],
    blocks: [[3,0,-2],[3,-1,-2],[3,-2,-2],
             [-4,-2,-3],
             [-3,8,-2],[-2,8,-1],
             
             
             [3,-2,3],[3,-1,3],[3,0,3],[3,1,3],[3,2,3],[3,3,3],[3,-2,-3],[3,-1,-3],[3,0,-3],[3,1,-3],[3,2,-3],[3,3,-3],[3,4,-3],[3,5,-3],[3,6,-3],[-3,-2,3],[-3,-1,3],[-3,0,3],[-3,1,3],[-3,2,3],[-3,3,3],[-3,4,3],[-3,5,3],[-3,6,3],[-3,-2,-3],[-3,-1,-3],[-3,0,-3],[-3,1,-3],[-3,2,-3],[-3,3,-3],[-3,4,-3],[-3,5,-3],[-3,6,-3],
             [6,-1,1],[1,-1,-3],[-7,-2,-3],[-7,6,-3]],
    deco: [{ at: [-2,8,-1], type: "friend" }, { at: [3,3,3], type: "dome" }, { at: [3,6,-3], type: "dome" }, { at: [-3,6,3], type: "dome" }, { at: [-3,6,-3], type: "dome" }],
    groups: [
      { type: "rot", axis: "y", pivot: [0,1,0], blocks: [[0,1,-3],[1,1,-3],[2,1,-3]], handle: [6,-1,1] },
      { type: "rot", axis: "x", dir: -1, pivot: [-1,1,-3], blocks: [[-1,1,-3],[-2,1,-3]], handle: [1,-1,-3] },
      { type: "slide", offset: [0,8,0], steps: 2, blocks: [[-5,-2,-3]], handle: [-7,-2,-3] },
      { type: "rot", axis: "x", pivot: [-5,7,-3], blocks: [[-5,7,-3],[-6,7,-3]], handle: [-7,6,-3] }
    ],
    start: [3,0,-2], goal: [-3,8,-2]
  }
];

// ---------- 면(face) ----------
// 캐릭터는 블록의 한 면 위에 선다. 중력은 그 면의 바깥 방향(법선)의 반대.
// 같은 방향을 향한 면끼리만 걸어 다닐 수 있고, 면의 방향은 블록을 타고 돌 때만 바뀐다.
var FACE_N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]; // three.js 상자 면 순서와 같음
var UP = 2;
function nIndex(n) { for (var i = 0; i < 6; i++) if (FACE_N[i][0] === n[0] && FACE_N[i][1] === n[1] && FACE_N[i][2] === n[2]) return i; return -1; }

function vkey(p) { return p[0] + "," + p[1] + "," + p[2]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function depthOf(p, V) { return dot(p, V); }
function norm(v) { var l = Math.sqrt(dot(v, v)); return [v[0] / l, v[1] / l, v[2] / l]; }
function pitchOf(V) { return Math.atan2(V[1], Math.sqrt(V[0] * V[0] + V[2] * V[2])) * 180 / Math.PI; }
function elevOf(V, ni) { return Math.asin(Math.max(-1, Math.min(1, dot(norm(V), FACE_N[ni])))) * 180 / Math.PI; }
function dirFromAngles(yawRad, pitchRad) {
  return [Math.cos(pitchRad) * Math.sin(yawRad), Math.sin(pitchRad), Math.cos(pitchRad) * Math.cos(yawRad)];
}
function faceCenter(p, ni) { var n = FACE_N[ni]; return [p[0] + n[0] / 2, p[1] + n[1] / 2, p[2] + n[2] / 2]; }
function topOf(p) { return faceCenter(p, UP); }
function tangents(ni) {
  var n = FACE_N[ni];
  if (n[1] !== 0) return [[1, 0, 0], [0, 0, 1]];
  if (n[0] !== 0) return [[0, 1, 0], [0, 0, 1]];
  return [[1, 0, 0], [0, 1, 0]];
}
function planeDirs(ni) {
  var t = tangents(ni);
  return [t[0], [-t[0][0], -t[0][1], -t[0][2]], t[1], [-t[1][0], -t[1][1], -t[1][2]]];
}

function rot90(p, piv, axis) {
  var d = [p[0] - piv[0], p[1] - piv[1], p[2] - piv[2]], r;
  if (axis === "y") r = [d[2], d[1], -d[0]];
  else if (axis === "x") r = [d[0], -d[2], d[1]];
  else r = [-d[1], d[0], d[2]];
  return [r[0] + piv[0], r[1] + piv[1], r[2] + piv[2]];
}

function groupSteps(G) { return G.type === "slide" ? (G.steps || 2) : 4; }

function groupPos(G, st) {
  return G.blocks.map(function (p) {
    var r = p.slice();
    if (G.type === "slide") { for (var i = 0; i < 3; i++) r[i] += G.offset[i] * st; }
    else for (var k = 0; k < st * (G.dir < 0 ? 3 : 1); k++) r = rot90(r, G.pivot, G.axis);
    return r;
  });
}

// 디딜 수 없는 둥근 기둥(원통). 시야만 가린다. makeState가 레벨마다 채운다.
var CYLS = [];

function makeState(L) {
  CYLS = (L.cylinders || []).map(function (c) { return { cx: c.c[0], cz: c.c[1], r: c.r, y0: c.y[0], y1: c.y[1] }; });
  var blocks = [];
  var capKeys = {};
  (L.capped || []).forEach(function (p) { capKeys[vkey(p)] = true; });
  L.blocks.forEach(function (p) { blocks.push({ p: p.slice(), g: -1, capTop: !!capKeys[vkey(p)] }); });
  L.groups.forEach(function (G, gi) {
    var faces = G.faces ? G.faces.map(nIndex) : null; // 이 장치는 이 방향의 면으로만 디딜 수 있다 (없으면 모든 면)
    G.blocks.forEach(function (p, k) { blocks.push({ p: p.slice(), g: gi, k: k, capTop: !!G.capTop, faces: faces }); });
  });
  var find = function (q) { for (var i = 0; i < blocks.length; i++) if (vkey(blocks[i].p) === vkey(q)) return i; return -1; };
  var props = [];
  L.groups.forEach(function (G) {
    props.push([G.handle[0], G.handle[1] + 1, G.handle[2]]);
    var hb = find(G.handle); if (hb >= 0) blocks[hb].noStand = true; // 손잡이 받침대는 장치라서 디딜 수 없다
  });
  (L.deco || []).forEach(function (d) { props.push([d.at[0], d.at[1] + 1, d.at[2]]); });
  var v = L.view || [45, 35.26];
  return {
    blocks: blocks, gs: L.groups.map(function () { return 0; }), gdir: L.groups.map(function () { return 1; }),
    V: dirFromAngles(v[0] * Math.PI / 180, v[1] * Math.PI / 180),
    player: find(L.start), pn: UP, goal: find(L.goal), goalN: L.goalN ? nIndex(L.goalN) : UP, props: props,
    pr: L.pitch || [PITCH_MIN_DEG, PITCH_MAX_DEG] // 카메라 기울기 범위 (아래에서 올려다보는 장은 음수까지)
  };
}
function isWin(S) { return S.player === S.goal && S.pn === S.goalN; }

// 손잡이를 누르면: 지금 방향으로 한 칸. 막혀 있으면 반대로 되돌아간다 (중간에 갇히는 일이 없게).
function nextPositions(L, S, gi) {
  var G = L.groups[gi], n = groupSteps(G);
  var taken = {};
  S.blocks.forEach(function (b) { if (b.g !== gi) taken[vkey(b.p)] = true; });
  S.props.forEach(function (p) { taken[vkey(p)] = true; });
  var pb = S.blocks[S.player], pn = FACE_N[S.pn];
  if (pb.g !== gi) taken[vkey([pb.p[0] + pn[0], pb.p[1] + pn[1], pb.p[2] + pn[2]])] = true;
  var dir = (S.gdir && S.gdir[gi]) || 1;
  var tries = [dir, -dir];
  for (var t = 0; t < tries.length; t++) {
    var st = ((S.gs[gi] + tries[t]) % n + n) % n, np = groupPos(G, st), ok = true;
    for (var i = 0; i < np.length; i++) if (taken[vkey(np[i])]) { ok = false; break; }
    // 타고 있던 캐릭터가 돌고 난 뒤 몸이 들어갈 자리도 비어 있어야 한다
    if (ok && pb.g === gi && G.type !== "slide") {
      var turns = ((tries[t] > 0 ? 1 : 3) * (G.dir < 0 ? 3 : 1)) % 4, nn = FACE_N[S.pn];
      for (var k2 = 0; k2 < turns; k2++) nn = rot90(nn, [0, 0, 0], G.axis);
      var np2 = np[pb.k], body = vkey([np2[0] + nn[0], np2[1] + nn[1], np2[2] + nn[2]]);
      if (taken[body] || np.some(function (q) { return vkey(q) === body; })) ok = false;
    }
    if (ok) return { st: st, pos: np, step: tries[t] };
  }
  return null;
}

function applyGroup(L, S, gi, res) {
  var G = L.groups[gi];
  // 블록을 타고 돌면 캐릭터가 서 있는 면의 방향도 함께 돈다
  if (S.blocks[S.player].g === gi && G.type !== "slide") {
    var turns = ((res.step > 0 ? 1 : 3) * (G.dir < 0 ? 3 : 1)) % 4, n = FACE_N[S.pn];
    for (var k = 0; k < turns; k++) n = rot90(n, [0, 0, 0], G.axis);
    S.pn = nIndex(n);
  }
  S.gs[gi] = res.st;
  S.gdir[gi] = res.step || 1;
  S.blocks.forEach(function (b) { if (b.g === gi) b.p = res.pos[b.k].slice(); });
}

// 점 q에서 카메라 쪽(V 방향)으로 쏜 광선이 어떤 블록 속을 지나가는가 (스치기만 하면 가려진 게 아님)
function occluded(q, blocks, V) {
  for (var b = 0; b < blocks.length; b++) {
    var p = blocks[b].p, lo = 0, hi = Infinity, miss = false;
    for (var i = 0; i < 3; i++) {
      var v = V[i];
      if (Math.abs(v) < 1e-9) {
        if (!(q[i] > p[i] - 0.5 + 1e-6 && q[i] < p[i] + 0.5 - 1e-6)) { miss = true; break; }
        continue;
      }
      var a = (p[i] - 0.5 - q[i]) / v, c = (p[i] + 0.5 - q[i]) / v;
      if (a > c) { var tmp = a; a = c; c = tmp; }
      if (a > lo) lo = a;
      if (c < hi) hi = c;
    }
    if (!miss && hi - lo > 1e-3) return true;
  }
  for (var k = 0; k < CYLS.length; k++) if (rayHitsCyl(q, V, CYLS[k])) return true;
  return false;
}

// 점 q에서 V 방향 광선이 원통 속을 지나가는가
function rayHitsCyl(q, V, c) {
  var ox = q[0] - c.cx, oz = q[2] - c.cz;
  var a = V[0] * V[0] + V[2] * V[2], b = 2 * (ox * V[0] + oz * V[2]), cc = ox * ox + oz * oz - c.r * c.r;
  var t0, t1;
  if (a < 1e-12) { if (cc >= 0) return false; t0 = 0; t1 = Infinity; }
  else {
    var disc = b * b - 4 * a * cc;
    if (disc <= 0) return false;
    var sq = Math.sqrt(disc);
    t0 = (-b - sq) / (2 * a); t1 = (-b + sq) / (2 * a);
  }
  // 높이 범위
  if (Math.abs(V[1]) < 1e-12) { if (q[1] < c.y0 || q[1] > c.y1) return false; }
  else {
    var ya = (c.y0 - q[1]) / V[1], yb = (c.y1 - q[1]) / V[1];
    if (ya > yb) { var tt = ya; ya = yb; yb = tt; }
    t0 = Math.max(t0, ya); t1 = Math.min(t1, yb);
  }
  t0 = Math.max(t0, 0);
  return t1 - t0 > 1e-3;
}

// 면 전체(가운데 + 네 모서리)가 카메라를 향하고, 가려지지 않아야 '보이는 면'
function faceVisible(p, ni, blocks, V) {
  if (dot(V, FACE_N[ni]) <= 1e-6) return false;
  var c = faceCenter(p, ni), t = tangents(ni), e = 0.45;
  var pts = [[0, 0], [e, e], [e, -e], [-e, e], [-e, -e]];
  for (var i = 0; i < pts.length; i++) {
    var q = [c[0] + t[0][0] * pts[i][0] + t[1][0] * pts[i][1], c[1] + t[0][1] * pts[i][0] + t[1][1] * pts[i][1], c[2] + t[0][2] * pts[i][0] + t[1][2] * pts[i][1]];
    if (occluded(q, blocks, V)) return false;
  }
  return true;
}
function topVisible(p, blocks, V) { return faceVisible(p, UP, blocks, V); }

// 디딜 수 있는 면: 그 면 바깥 칸이 비어 있어야 한다
function standFaces(S, ni) {
  var occ = {}, n = FACE_N[ni];
  S.blocks.forEach(function (b) { occ[vkey(b.p)] = true; });
  S.props.forEach(function (p) { occ[vkey(p)] = true; });
  var t = [];
  S.blocks.forEach(function (b, i) { var p = b.p; if (!b.noStand && !(b.capTop && ni === UP) && !(b.faces && b.faces.indexOf(ni) < 0) && !occ[vkey([p[0] + n[0], p[1] + n[1], p[2] + n[2]])]) t.push(i); });
  return t;
}
function standTiles(S) { return standFaces(S, UP); }

// 두 면의 맞닿은 경계가 화면에서 실제로 보이는가 (앞쪽 경계 + 양쪽 경계 근처)
function seamVisible(S, i, j, d, V, ni) {
  if (ni === undefined) ni = UP;
  if (d.length === 2) d = [d[0], 0, d[1]];
  var bl = S.blocks, a = faceCenter(bl[i].p, ni), c = faceCenter(bl[j].p, ni);
  var ma = [a[0] + d[0] / 2, a[1] + d[1] / 2, a[2] + d[2] / 2], mc = [c[0] - d[0] / 2, c[1] - d[1] / 2, c[2] - d[2] / 2];
  var front = depthOf(ma, V) >= depthOf(mc, V) ? ma : mc;
  var na = [a[0] + d[0] * 0.45, a[1] + d[1] * 0.45, a[2] + d[2] * 0.45], nc = [c[0] - d[0] * 0.45, c[1] - d[1] * 0.45, c[2] - d[2] * 0.45];
  return !occluded(front, bl, V) && !occluded(na, bl, V) && !occluded(nc, bl, V);
}

// 카메라가 갈 수 있는 기울기(pr) 안이고, 그 면을 너무 비스듬하지도 너무 정면이지도 않게(20~65°) 볼 때만
function viewOK(V, ni, pr) {
  pr = pr || [PITCH_MIN_DEG, PITCH_MAX_DEG];
  var p = pitchOf(V), e = elevOf(V, ni);
  return p >= pr[0] - 0.5 && p <= pr[1] + 0.5 && e >= PITCH_MIN_DEG - 0.5 && e <= PITCH_MAX_DEG + 0.5;
}

// 실제로 맞붙은 면끼리 걷는 건 거의 정면에서 봐도 된다 (착시 연결만 20~65° 제한)
function flatViewOK(V, ni, pr) {
  pr = pr || [PITCH_MIN_DEG, PITCH_MAX_DEG];
  var p = pitchOf(V), e = elevOf(V, ni);
  return p >= pr[0] - 0.5 && p <= pr[1] + 0.5 && e >= 5;
}

// 지금 시선 V에서, 캐릭터가 서 있는 방향의 면들로 만든 길 그래프. tol: 화면상 어긋남 허용치(칸 단위)
function buildGraph(L, S, tol) {
  var V = S.V, vn = norm(V), blocks = S.blocks, ni = S.pn, walk = {}, adj = {}, dir = {};
  tol = tol || 0.03;
  if (!flatViewOK(V, ni, S.pr)) return { adj: adj, walk: walk, dir: dir, ni: ni };
  var illusionOK = viewOK(V, ni, S.pr);
  var vis = standFaces(S, ni).filter(function (i) { return faceVisible(blocks[i].p, ni, blocks, V); });
  var D = planeDirs(ni);
  vis.forEach(function (i) { walk[i] = true; adj[i] = []; });
  vis.forEach(function (i) {
    vis.forEach(function (j) {
      if (i === j) return;
      var pi = blocks[i].p, pj = blocks[j].p;
      D.forEach(function (d) {
        var w = [pj[0] - pi[0] - d[0], pj[1] - pi[1] - d[1], pj[2] - pi[2] - d[2]];
        var k = dot(w, vn);
        var r = [w[0] - k * vn[0], w[1] - k * vn[1], w[2] - k * vn[2]];
        if (Math.sqrt(dot(r, r)) > tol) return;
        if (!illusionOK && Math.sqrt(dot(w, w)) > 1e-6) return; // 착시 연결은 너무 정면/비스듬하면 안 된다
        if (adj[i].indexOf(j) >= 0) return;
        if (!seamVisible(S, i, j, d, V, ni)) return;
        adj[i].push(j); dir[i + ">" + j] = d;
      });
    });
  });
  return { adj: adj, walk: walk, dir: dir, ni: ni };
}

// 지금 배치에서, 캐릭터가 서 있는 방향의 두 면이 '정확히 맞닿아 보이는' 시선 방향들 (실제로 보이는 것만)
function alignViews(S) {
  var blocks = S.blocks, ni = S.pn, n = FACE_N[ni], T = standFaces(S, ni), out = [], seen = {}, D = planeDirs(ni);
  T.forEach(function (i) {
    T.forEach(function (j) {
      if (i === j) return;
      var pi = blocks[i].p, pj = blocks[j].p;
      if (dot([pj[0] - pi[0], pj[1] - pi[1], pj[2] - pi[2]], n) <= 0) return; // 바깥쪽에 있는 면 기준으로 한 번만
      D.forEach(function (d) {
        var w = [pj[0] - pi[0] - d[0], pj[1] - pi[1] - d[1], pj[2] - pi[2] - d[2]];
        if (!viewOK(w, ni, S.pr)) return;
        if (!faceVisible(pi, ni, blocks, w) || !faceVisible(pj, ni, blocks, w) || !seamVisible(S, i, j, d, w, ni)) return;
        var V = norm(w), key = V.map(function (x) { return x.toFixed(3); }).join(",") + "|" + i + "|" + j;
        if (seen[key]) return;
        seen[key] = true;
        out.push({ V: V, a: i, b: j });
      });
    });
  });
  return out;
}

function findPath(G, from, to) {
  if (!G.walk[to] || !G.walk[from]) return null;
  var prev = {}; prev[from] = -1; var q = [from];
  while (q.length) {
    var c = q.shift();
    if (c === to) break;
    (G.adj[c] || []).forEach(function (n) { if (prev[n] === undefined) { prev[n] = c; q.push(n); } });
  }
  if (prev[to] === undefined) return null;
  var path = [], c2 = to;
  while (c2 !== -1) { path.unshift(c2); c2 = prev[c2]; }
  return path;
}

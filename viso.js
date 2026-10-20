// ============================================================================
//  VISO.JS  ·  0.73  ·  La maschera deformabile del viso di Sofia (WebGL)
//  Come funziona, in parole semplici:
//   - il viso e' una rete di 468 punti (MediaPipe) uniti in 854 triangolini, piu' un
//     "alone" di 46 punti intorno (capelli, collo, sfondo) che non si muove;
//   - su ogni triangolino e' incollato il pezzo di foto (o di filmato) corrispondente;
//   - per far parlare Sofia NON si incolla una bocca: si SPOSTANO i punti (mascella,
//     mento, guance, labbra) verso le posizioni misurate nei video dell'alfabeto, e
//     la foto si deforma con loro. Fra una forma e l'altra i punti scorrono: niente
//     scatti, niente fantasmi;
//   - dentro le labbra che si aprono si vede l'interno della bocca (denti sopra
//     attaccati al labbro superiore, lingua e cavita' sotto), preso dalla "A" vera;
//   - il battito di ciglia e le sopracciglia sono altri spostamenti di punti.
//  Tutto resta nel telefono: nessun servizio, nessun costo.
// ============================================================================

const VS = `attribute vec2 a_pos; attribute vec2 a_uv; uniform vec2 u_dim; varying vec2 v_uv;
void main(){ v_uv = a_uv; gl_Position = vec4(a_pos.x / u_dim.x * 2.0 - 1.0, 1.0 - a_pos.y / u_dim.y * 2.0, 0.0, 1.0); }`;
const FS = `precision mediump float; uniform sampler2D u_tex; uniform float u_alfa; varying vec2 v_uv;
void main(){ vec4 c = texture2D(u_tex, v_uv); gl_FragColor = vec4(c.rgb, c.a * u_alfa); }`;

export class Viso {
  // rig = contenuto di rig.json; img = { base, cavita, denti } (HTMLImageElement gia' caricate)
  constructor(canvas, rig, img) {
    this.rig = rig; this.img = img; this.N = rig.n; this.W = rig.w; this.H = rig.h;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: false });
    if (!gl) throw new Error("niente WebGL");
    this.gl = gl;
    const prog = gl.createProgram();
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); gl.attachShader(prog, o); };
    sh(gl.VERTEX_SHADER, VS); sh(gl.FRAGMENT_SHADER, FS);
    gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    this.aPos = gl.getAttribLocation(prog, "a_pos"); this.aUv = gl.getAttribLocation(prog, "a_uv");
    gl.uniform2f(gl.getUniformLocation(prog, "u_dim"), this.W, this.H);
    this.uAlfa = gl.getUniformLocation(prog, "u_alfa");
    gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);
    this.bPos = gl.createBuffer(); this.bUv = gl.createBuffer(); this.bIdx = gl.createBuffer();
    gl.enableVertexAttribArray(this.aPos); gl.enableVertexAttribArray(this.aUv);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // i punti: viso (N) + alone (extra); indici dei triangoli
    const base = new Float32Array(this.N * 2);
    for (let i = 0; i < this.N; i++) { base[2 * i] = rig.base[i][0]; base[2 * i + 1] = rig.base[i][1]; }
    this.base = base;
    const extra = new Float32Array(rig.extra.length * 2);
    for (let i = 0; i < rig.extra.length; i++) { extra[2 * i] = rig.extra[i][0]; extra[2 * i + 1] = rig.extra[i][1]; }
    this.extra = extra; this.nExtra = rig.extra.length;
    const idx = new Uint16Array([...rig.tri, ...rig.triAlone]);
    this.nIdx = idx.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    this.pos = new Float32Array((this.N + this.nExtra) * 2); this.uv = new Float32Array((this.N + this.nExtra) * 2);
    this.pos.set(extra, this.N * 2); this.uv.set(extra, this.N * 2);
    // le tre texture
    this.texBase = this._texture(img.base, true);
    this.texCav = this._texture(img.cavita, false);
    this.texDenti = this._texture(img.denti, false);
    this.texVideo = this._texture(null, false);
    this.videoSrc = null;
    // interno della bocca
    this.interno = rig.interno; this.nInt = rig.interno.length;
    const ca = rig.cavita; this.cav = ca;
    this.cavUv = new Float32Array((this.nInt + 1) * 2);
    let cx = 0, cy = 0;
    for (let i = 0; i < this.nInt; i++) { const p = ca.anello[i]; const u = (p[0] - ca.x) / ca.w, v = (p[1] - ca.y) / ca.h; this.cavUv[2 * i + 2] = u; this.cavUv[2 * i + 3] = v; cx += u; cy += v; }
    this.cavUv[0] = cx / this.nInt; this.cavUv[1] = cy / this.nInt;
    this.cavPos = new Float32Array((this.nInt + 1) * 2);
    const fan = []; for (let i = 0; i < this.nInt; i++) fan.push(0, 1 + i, 1 + ((i + 1) % this.nInt));
    this.cavIdx = new Uint16Array(fan); this.bCavIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bCavIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.cavIdx, gl.STATIC_DRAW);
    // gli occhi: nella rete gli occhi sono due buchi (cosi' le palpebre possono chiudersi
    // sopra); dietro si disegna un rettangolo fermo con lo stesso pezzo di foto/filmato
    this.occhi = [[33, 133, 159, 145, 246, 7, 163, 144, 153, 154, 155, 157, 158, 160, 161, 173], [362, 263, 386, 374, 466, 249, 390, 373, 380, 381, 382, 384, 385, 387, 388, 398]];
    this.occhioPos = new Float32Array(8); this.occhioUv = new Float32Array(8);
    this.dentiPos = new Float32Array(8); this.dentiUv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    this.dentiIdx = new Uint16Array([0, 1, 2, 0, 2, 3]); this.bDentiIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bDentiIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.dentiIdx, gl.STATIC_DRAW);
    gl.viewport(0, 0, this.W, this.H);
    gl.clearColor(0.1, 0.08, 0.06, 1);
  }
  _texture(src, mip) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([30, 20, 15, 255]));
    return t;
  }
  _draw(tex, pos, uv, bIdx, n, alfa) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1f(this.uAlfa, alfa);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bPos); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW); gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bUv); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.DYNAMIC_DRAW); gl.vertexAttribPointer(this.aUv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
  }
  // Disegna il viso.
  //  delta: Float32Array(N*2), spostamento di ogni punto rispetto alla posa neutra, in
  //         coordinate della base (gia' lisciato dal chiamante);
  //  video, lm, R: se c'e' il filmato sotto: il <video>, i suoi punti del viso (N*2, nel
  //         fotogramma) e la parte lineare della posa [a,b,c,d] (base -> fotogramma) per
  //         girare gli spostamenti insieme alla testa. Senza: la foto base.
  disegna(delta, video, lm, R) {
    const gl = this.gl, N = this.N, pos = this.pos, uv = this.uv;
    let tex;
    if (video && lm) {
      if (this.videoSrc !== video || true) {
        gl.bindTexture(gl.TEXTURE_2D, this.texVideo);
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); this.videoSrc = video; }
        catch (e) { this.videoSrc = null; }
      }
      tex = this.videoSrc ? this.texVideo : this.texBase;
      if (!this.videoSrc) { lm = this.base; R = null; }
    } else { tex = this.texBase; lm = this.base; R = null; }
    const a = R ? R[0] : 1, b = R ? R[1] : 0, c = R ? R[2] : 0, d = R ? R[3] : 1;
    for (let i = 0; i < N; i++) {
      const x = lm[2 * i], y = lm[2 * i + 1], dx = delta[2 * i], dy = delta[2 * i + 1];
      uv[2 * i] = x / this.W; uv[2 * i + 1] = y / this.H;
      pos[2 * i] = x + a * dx + c * dy; pos[2 * i + 1] = y + b * dx + d * dy;
    }
    for (let i = N; i < N + this.nExtra; i++) { uv[2 * i] = pos[2 * i] / this.W; uv[2 * i + 1] = pos[2 * i + 1] / this.H; }
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 0) gli occhi fermi, dietro i buchi delle palpebre (dalla stessa texture, senza spostamenti)
    for (const ring of this.occhi) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const k of ring) { const x = lm[2 * k], y = lm[2 * k + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      x0 -= 14; x1 += 14; y0 -= 12; y1 += 12;
      const P = this.occhioPos, U = this.occhioUv;
      P[0] = x0; P[1] = y0; P[2] = x1; P[3] = y0; P[4] = x1; P[5] = y1; P[6] = x0; P[7] = y1;
      for (let i = 0; i < 4; i++) { U[2 * i] = P[2 * i] / this.W; U[2 * i + 1] = P[2 * i + 1] / this.H; }
      this._draw(tex, P, U, this.bDentiIdx, 6, 1);
    }
    // 1) la cavita' (lingua, denti sotto), tesa sull'anello interno delle labbra di adesso
    const cp = this.cavPos; let cx = 0, cy = 0;
    for (let i = 0; i < this.nInt; i++) { const k = this.interno[i]; cp[2 * i + 2] = pos[2 * k]; cp[2 * i + 3] = pos[2 * k + 1]; cx += pos[2 * k]; cy += pos[2 * k + 1]; }
    cp[0] = cx / this.nInt; cp[1] = cy / this.nInt;
    this._draw(this.texCav, cp, this.cavUv, this.bCavIdx, this.cavIdx.length, 1);
    // 2) i denti di sopra: attaccati al centro del labbro superiore interno (punto 13), larghi
    //    quanto la bocca di adesso, girati con la testa; la faccia disegnata dopo li copre
    //    ovunque tranne dentro la bocca aperta
    const de = this.rig.denti;
    const lx = pos[2 * 13], ly = pos[2 * 13 + 1];
    const wNow = Math.hypot(pos[2 * 308] - pos[2 * 78], pos[2 * 308 + 1] - pos[2 * 78 + 1]);
    const sx = Math.max(0.4, Math.min(1.4, wNow / de.larghezza)) * (R ? Math.hypot(a, b) : 1);
    const sy = R ? Math.hypot(c, d) : 1;
    const ang = R ? Math.atan2(b, a) : 0, ca_ = Math.cos(ang), sa_ = Math.sin(ang);
    const corners = [[de.x, de.y], [de.x + de.w, de.y], [de.x + de.w, de.y + de.h], [de.x, de.y + de.h]];
    for (let i = 0; i < 4; i++) {
      const ox = (corners[i][0] - de.centro[0]) * sx, oy = (corners[i][1] - de.centro[1] + 1) * sy;
      this.dentiPos[2 * i] = lx + ox * ca_ - oy * sa_; this.dentiPos[2 * i + 1] = ly + ox * sa_ + oy * ca_;
    }
    this._draw(this.texDenti, this.dentiPos, this.dentiUv, this.bDentiIdx, 6, 1);
    // 3) il viso e l'alone
    this._draw(tex, pos, uv, this.bIdx, this.nIdx, 1);
  }
}

// ---- il regista dei punti: dalle forme (vocale/consonante, apertura, battito) al delta ----
export class Mimica {
  constructor(rig) {
    this.rig = rig; this.N = rig.n;
    this.vis = {};
    for (const [v, sets] of Object.entries(rig.visemi)) this.vis[v] = sets.map(s => { const f = new Float32Array(this.N * 2); for (let i = 0; i < this.N; i++) { f[2 * i] = s[i][0] / 10; f[2 * i + 1] = s[i][1] / 10; } return f; });
    const conv = (s) => { const f = new Float32Array(this.N * 2); for (let i = 0; i < this.N; i++) { f[2 * i] = s[i][0] / 10; f[2 * i + 1] = s[i][1] / 10; } return f; };
    this.battito = conv(rig.battito); this.sopracciglia = conv(rig.sopracciglia);
    this.delta = new Float32Array(this.N * 2);     // quello che si disegna (lisciato)
    this.mira = new Float32Array(this.N * 2);
  }
  // accumula in `out` il viseme v al livello L (0..n-1, anche frazionario) con peso w
  _somma(out, v, L, w) {
    const sets = this.vis[v]; if (!sets || w <= 0) return;
    const n = sets.length;
    if (n === 1) { const s = sets[0]; for (let i = 0; i < out.length; i++) out[i] += w * s[i]; return; }
    const Lc = Math.max(0, Math.min(n - 1, L)), i0 = Math.floor(Lc), fr = Lc - i0;
    const s0 = sets[i0], s1 = sets[Math.min(n - 1, i0 + 1)];
    for (let i = 0; i < out.length; i++) out[i] += w * (s0[i] * (1 - fr) + s1[i] * fr);
  }
  // stato: { vVis, vPrima, k (0..1 peso del nuovo), apVis (0..1), battito (0..1), sopracciglia (0..1) }
  // dt in ms. Restituisce il delta lisciato.
  aggiorna(st, dt) {
    const m = this.mira; m.fill(0);
    const liv = (v) => st.apVis * ((this.vis[v] ? this.vis[v].length : 1) - 1);
    if (st.vVis && this.vis[st.vVis]) this._somma(m, st.vVis, liv(st.vVis), st.vPrima ? st.k : 1);
    if (st.vPrima && this.vis[st.vPrima] && st.k < 1) this._somma(m, st.vPrima, liv(st.vPrima), 1 - st.k);
    if (st.battito > 0) { const b = this.battito, w = st.battito; for (let i = 0; i < m.length; i++) m[i] += w * b[i]; }
    if (st.sopracciglia > 0) { const b = this.sopracciglia, w = st.sopracciglia; for (let i = 0; i < m.length; i++) m[i] += w * b[i]; }
    // lisciatura: i punti inseguono la mira con costante di tempo ~35 ms (la mascella ha un peso)
    const a = 1 - Math.exp(-Math.max(1, Math.min(60, dt)) / 35);
    const d = this.delta;
    for (let i = 0; i < d.length; i++) d[i] += (m[i] - d[i]) * a;
    return d;
  }
}

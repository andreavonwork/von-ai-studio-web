import { html, Component as PComponent } from './preact-htm.js';
class DCLogic extends PComponent {
  render() { return tpl(this.renderVals()); }
}
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { step: 0, tick: 0, dtab: 0, rx: 0, ry: 0, sel: {}, biz: 'cafe', msgs: [], flow: null, typing: false, draft: '', seq: 0, cmpPos: 50, cmpTouched: false };
    this.timers = [];
    this.chatRef = (el) => { this.chatEl = el; };
    this.bgRef = (el) => { this.cvBg = el; };
    this.splitRef = (el) => { this.splitEl = el; };
    this.storyRef = (el) => { this.storyEl = el; };
    this.state.msgs = this.greetMsgs('cafe');
  }
  componentDidMount() {
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (!reduce) this.iv = setInterval(() => this.setState({ tick: this.state.tick + 1 }), 2400);
    this.sphTimer = setTimeout(() => this.startSphere(reduce), 60);
    this.onScr = () => { if (this.scrRaf) return; this.scrRaf = requestAnimationFrame(() => { this.scrRaf = 0; this.scrollFx(); }); };
    window.addEventListener('scroll', this.onScr, { passive: true });
    window.addEventListener('resize', this.onScr);
    this.scrTimer = setTimeout(this.onScr, 120);
  }
  componentDidUpdate(pp, ps) {
    if (this.chatEl && (ps.msgs !== this.state.msgs || ps.typing !== this.state.typing)) this.chatEl.scrollTop = this.chatEl.scrollHeight;
  }
  componentWillUnmount() {
    if (this.iv) clearInterval(this.iv);
    this.timers.forEach((t) => clearTimeout(t));
    clearTimeout(this.sphTimer);
    clearTimeout(this.scrTimer);
    if (this.scrRaf) cancelAnimationFrame(this.scrRaf);
    window.removeEventListener('scroll', this.onScr);
    window.removeEventListener('resize', this.onScr);
    if (this.raf) cancelAnimationFrame(this.raf);
    var s = this.sph;
    if (s) {
      clearInterval(s.txtIv);
      window.removeEventListener('pointermove', s.onMove);
      document.removeEventListener('pointerleave', s.onLeave);
      window.removeEventListener('blur', s.onLeave);
    }
  }
  startSphere(reduce) {
    var el = this.cvBg;
    if (!el || !el.getContext) return;
    var small = window.innerWidth < 760;
    var n = small ? 3800 : 8400, pts = [], g = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < n; i++) {
      var y = 1 - ((i + 0.5) / n) * 2, r = Math.sqrt(1 - y * y), th = g * i;
      pts.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, u: (th / (2 * Math.PI)) % 1, ph: Math.random() * 6.283, jit: Math.random(), ox: 0, oy: 0, vx: 0, vy: 0 });
    }
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var CS = Math.ceil(13 * dpr), NC = 9;
    var atlas = document.createElement('canvas');
    atlas.width = CS * 10; atlas.height = CS * NC;
    var ac = atlas.getContext('2d');
    var stops = [[96, 16, 38], [176, 22, 58], [232, 64, 98], [255, 150, 172], [255, 232, 238]];
    ac.textAlign = 'center'; ac.textBaseline = 'middle';
    ac.font = '600 ' + Math.round(9.5 * dpr) + 'px Poppins, Montserrat, sans-serif';
    for (var c = 0; c < NC; c++) {
      var t = c / (NC - 1) * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(t)), f = t - k, A = stops[k], B = stops[k + 1];
      ac.fillStyle = 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * f) + ',' + Math.round(A[1] + (B[1] - A[1]) * f) + ',' + Math.round(A[2] + (B[2] - A[2]) * f) + ')';
      for (var d = 0; d < 10; d++) ac.fillText(String(d), d * CS + CS / 2, c * CS + CS / 2 + 0.5);
    }
    var mask = document.createElement('canvas');
    var s = { el: el, ctx: el.getContext('2d'), pts: pts, atlas: atlas, CS: CS, NC: NC, dpr: dpr, mask: mask, mctx: mask.getContext('2d', { willReadFrequently: true }), mx: 0, my: 0, hasM: false, px: 0, py: 0, time: 0, last: performance.now(), cx: null, cy: null, gx: null, gy: null, fade: 0, txt: [], glass: [], frame: 0, reduce: reduce };
    s.onMove = (e) => { s.mx = e.clientX; s.my = e.clientY; s.hasM = true; };
    s.onLeave = () => { s.hasM = false; };
    window.addEventListener('pointermove', s.onMove, { passive: true });
    document.addEventListener('pointerleave', s.onLeave);
    window.addEventListener('blur', s.onLeave);
    var collect = () => {
      var root = el.parentNode; if (!root) return;
      var skip = '.glass, .glass-2, header, #ficha, .fab';
      s.txt = Array.prototype.filter.call(root.querySelectorAll('.content footer .foot-grid > div, .content footer .wrap > div:last-child, .content [aria-label^="Rubros"] .rub, .content h1, .content h2, .content h3, .content p, .content .lbl, .content summary, .content li, .content .cta-link, .content .split-line, .content .marq span'), (n) => !n.closest(skip) && n.textContent.trim().length > 0);
      s.glass = Array.prototype.filter.call(root.querySelectorAll('.content .glass, .content .glass-2'), (n) => n.offsetWidth > 160 && !n.parentNode.closest('.glass, .glass-2'));
    };
    collect();
    s.txtIv = setInterval(collect, 1500);
    this.sph = s;
    var loop = () => { this.drawSphere(s); this.raf = requestAnimationFrame(loop); };
    loop();
  }
  drawSphere(s) {
    if (document.hidden) return;
    var now = performance.now(), dt = Math.min(0.05, (now - s.last) / 1000); s.last = now;
    if (!s.reduce) s.time += dt;
    s.fade = Math.min(1, s.fade + dt * 0.6);
    var el = s.el, dpr = s.dpr, W = window.innerWidth, H = Math.min(window.innerHeight, 1100);
    if (!W || !H) return;
    if (el.width !== Math.round(W * dpr) || el.height !== Math.round(H * dpr)) {
      el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
      el.style.height = H + 'px';
    }
    var c = s.ctx, T = s.time, sc = window.scrollY || 0, mob = W < 760;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    var tx = W * (mob ? 0.5 : 0.62 + 0.16 * Math.sin(sc / 1400)), ty = H * (0.54 + 0.04 * Math.sin(sc / 1100 + 1));
    if (s.cx == null) { s.cx = tx; s.cy = ty; }
    s.cx += (tx - s.cx) * 0.035; s.cy += (ty - s.cy) * 0.035;
    var R = mob ? W * 0.46 : Math.min(W * 0.27, H * 0.4);

    var gtx = s.hasM ? s.mx : s.cx + Math.cos(T * 0.21) * R * 0.9, gty = s.hasM ? s.my : s.cy + Math.sin(T * 0.17) * R * 0.7;
    if (s.gx == null) { s.gx = gtx; s.gy = gty; }
    s.gx += (gtx - s.gx) * 0.025; s.gy += (gty - s.gy) * 0.025;
    var gr = Math.max(W, H) * 0.42;
    var gg = c.createRadialGradient(s.gx, s.gy, 0, s.gx, s.gy, gr);
    gg.addColorStop(0, 'rgba(160,20,56,' + (0.22 * s.fade) + ')'); gg.addColorStop(0.45, 'rgba(110,14,40,' + (0.09 * s.fade) + ')'); gg.addColorStop(1, 'rgba(9,9,11,0)');

    var cyc = T / 20 + sc / 5200;
    var m = 0.5 - 0.5 * Math.cos(cyc * Math.PI * 2);
    var tpx = s.hasM ? (s.mx / W - 0.5) * 0.5 : 0, tpy = s.hasM ? (s.my / H - 0.5) * 0.3 : 0;
    s.px += (tpx - s.px) * 0.03; s.py += (tpy - s.py) * 0.03;
    var ry = T * 0.1 + sc * 0.00035 + s.px, tilt = 0.3 + 0.14 * Math.sin(T * 0.12) + s.py;
    var cr = Math.cos(ry), sr = Math.sin(ry), ct = Math.cos(tilt), st = Math.sin(tilt);
    var sw = Math.sin(T * 0.3) * 0.5, CS = s.CS, NC = s.NC, atlas = s.atlas;
    var mx = s.mx, my = s.my, useM = s.hasM && !s.reduce, rad = 110, base = 8.4 * Math.min(1, R / 300 + 0.25);

    for (var i = 0; i < s.pts.length; i++) {
      var p = s.pts[i];
      var dd = (p.y + 1) / 2, e = m * 1.7 - dd * 0.7; e = e < 0 ? 0 : e > 1 ? 1 : e; e = e * e * (3 - 2 * e);
      var br = 1 + 0.035 * Math.sin(T * 0.7 + p.y * 2.4 + p.ph * 0.2);
      var a = (p.u - 0.5) * 3.5 + sw, tw = p.y * 0.95;
      var hx = Math.sin(a) * 0.95, hz = Math.cos(a) * 0.75 - 0.36, hy = p.y * 0.62 + 0.17 * Math.sin(a * 2 + T * 0.5);
      var ctw = Math.cos(tw), stw = Math.sin(tw);
      var qx = hx * ctw - hz * stw, qz = hx * stw + hz * ctw;
      var x = p.x * br + (qx - p.x * br) * e, y = p.y * br + (hy - p.y * br) * e, z = p.z * br + (qz - p.z * br) * e;
      x += 0.04 * Math.sin(y * 3.1 + T * 0.9 + p.ph); y += 0.04 * Math.sin(z * 2.7 + T * 0.8 + p.ph); z += 0.04 * Math.sin(x * 3.3 + T * 1.0);
      var x1 = x * cr + z * sr, z1 = -x * sr + z * cr;
      var y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      var fp = 2.8 / (2.8 - z2);
      var sx = s.cx + x1 * R * fp, sy = s.cy + y1 * R * fp;
      if (useM) {
        var dx = sx + p.ox - mx, dy = sy + p.oy - my, d2 = dx * dx + dy * dy;
        if (d2 < rad * rad) { var dl = Math.sqrt(d2) || 1, q = 1 - dl / rad, fo = q * q * 3.2; p.vx += dx / dl * fo; p.vy += dy / dl * fo; }
      }
      p.vx += -p.ox * 0.03; p.vy += -p.oy * 0.03; p.vx *= 0.9; p.vy *= 0.9; p.ox += p.vx; p.oy += p.vy;
      var t = (z2 + 1.15) / 2.3; t = t < 0 ? 0 : t > 1 ? 1 : t;
      var al = (0.08 + 0.92 * t * t) * s.fade;
      if (al < 0.03) continue;
      var dg = 1 + Math.floor(t * 5.99) + Math.floor(p.jit * 3);
      var ci = Math.floor(t * (NC - 1) + p.jit * 0.9); if (ci > NC - 1) ci = NC - 1;
      var sz = base * (0.55 + 0.6 * t) * fp;
      c.globalAlpha = al;
      c.drawImage(atlas, (dg % 10) * CS, ci * CS, CS, CS, sx + p.ox - sz / 2, sy + p.oy - sz / 2, sz, sz);
    }
    c.globalAlpha = 1;

    s.frame++;
    if (s.frame % 2 === 0 || !s.rects) {
      var rects = [];
      var add = (list, str) => { for (var j = 0; j < list.length; j++) { var b = list[j].getBoundingClientRect(); if (b.width < 2 || b.bottom < -60 || b.top > H + 60) continue; rects.push([b.left, b.top, b.width, b.height, str]); } };
      add(s.glass, 0.4); add(s.txt, 1);
      s.rects = rects;
    }
    if (s.rects.length) {
      var K = 12, mw = Math.ceil(W / K), mh = Math.ceil(H / K), mk = s.mask, mc = s.mctx;
      if (mk.width !== mw || mk.height !== mh) { mk.width = mw; mk.height = mh; }
      mc.clearRect(0, 0, mw, mh);
      mc.fillStyle = '#000';
      for (var r2 = 0; r2 < s.rects.length; r2++) {
        var rr = s.rects[r2], pad = rr[4] === 1 ? 10 : 0;
        if (rr[4] !== 1) continue;
        mc.fillRect((rr[0] - pad) / K, (rr[1] - pad) / K, (rr[2] + pad * 2) / K, (rr[3] + pad * 2) / K);
      }
      var img = mc.getImageData(0, 0, mw, mh), px = img.data, n2 = mw * mh, A = s.mA && s.mA.length === n2 ? s.mA : (s.mA = new Float32Array(n2)), B = s.mB && s.mB.length === n2 ? s.mB : (s.mB = new Float32Array(n2));
      for (var q = 0; q < n2; q++) A[q] = px[q * 4 + 3] / 255;
      var rad = 3;
      for (var pass = 0; pass < 3; pass++) {
        for (var yy = 0; yy < mh; yy++) { var row = yy * mw; for (var xx = 0; xx < mw; xx++) { var acc = 0; for (var k = -rad; k <= rad; k++) { var xi = xx + k; acc += A[row + (xi < 0 ? 0 : xi >= mw ? mw - 1 : xi)]; } B[row + xx] = acc / (2 * rad + 1); } }
        for (var x2 = 0; x2 < mw; x2++) { for (var y2 = 0; y2 < mh; y2++) { var acc2 = 0; for (var k2 = -rad; k2 <= rad; k2++) { var yi = y2 + k2; acc2 += B[(yi < 0 ? 0 : yi >= mh ? mh - 1 : yi) * mw + x2]; } A[y2 * mw + x2] = acc2 / (2 * rad + 1); } }
      }
      for (var q2 = 0; q2 < n2; q2++) { var v = Math.min(1, A[q2] * 1.35); px[q2 * 4] = px[q2 * 4 + 1] = px[q2 * 4 + 2] = 0; px[q2 * 4 + 3] = Math.round(v * v * (3 - 2 * v) * 255); }
      mc.putImageData(img, 0, 0);
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.globalAlpha = 0.72;
      c.imageSmoothingEnabled = true;
      c.drawImage(mk, 0, 0, mw, mh, 0, 0, mw * K, mh * K);
      c.restore();
    }
    c.save();
    c.globalCompositeOperation = 'destination-over';
    c.fillStyle = gg; c.fillRect(0, 0, W, H);
    c.restore();
  }
  scrollFx() {
    var vh = window.innerHeight, W = window.innerWidth, cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    var sp = this.splitEl;
    if (sp) {
      var r = sp.getBoundingClientRect();
      var p = cl((vh - r.top) / (vh + r.height));
      var k = [0.8, -0.8, 1];
      var ls = sp.querySelectorAll('.xw-line');
      for (var i = 0; i < ls.length; i++) ls[i].style.transform = 'translate3d(' + ((0.5 - p) * W * k[i]).toFixed(1) + 'px,0,0)';
      var rv = sp.querySelector('.reveal');
      if (rv) { var rr = rv.getBoundingClientRect(); rv.style.setProperty('--rv', cl((vh * 0.92 - rr.top) / (vh * 0.6)).toFixed(3)); }
    }
    var so = this.storyEl;
    if (so) {
      var b = so.getBoundingClientRect();
      var pr = cl((50 - b.top) / Math.max(1, b.height - 680));
      var bar = so.querySelector('.prog'); if (bar) bar.style.transform = 'scaleX(' + pr.toFixed(3) + ')';
      var st = Math.min(3, Math.floor(pr * 4));
      if (st !== this.state.step) this.setState({ step: st });
    }
  }
  tema() { return this.props.tema || 'oscuro'; }
  dark() { return this.tema() !== 'claro'; }
  wa(text) { return 'https://wa.me/5493876383191?text=' + encodeURIComponent(text); }
  money(n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); }
  norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  bizData() {
    return {
      cafe: { label: 'Cafetería', name: 'Café del Centro', initial: 'C', color: '#a54055', greet: '¡Hola! Soy el asistente de Café del Centro. Te ayudo con horarios, la carta, reservas y envíos.', quick: ['Horarios', 'Quiero reservar', 'Ver la carta', '¿Dónde están?', '¿Hacen envíos?', 'Hablar con alguien'], horario: 'Abrimos de lunes a sábado de 8 a 20 h, y los domingos de 9 a 13 h.', envio: 'Sí, hacemos envíos en la zona centro de 9 a 19 h. Pasame tu dirección y te decimos el costo.', pago: 'Aceptamos efectivo, transferencia, tarjetas y Mercado Pago.', addr: 'Caseros 500, Salta', card: { title: 'Carta · destacados', foot: 'Precios de ejemplo', lines: [['Café con leche y medialunas', '$ 4.800'], ['Tostado de jamón y queso', '$ 6.500'], ['Budín casero', '$ 3.200'], ['Limonada con menta', '$ 3.900']] }, cardRe: /carta|menu|precio|comer|cuanto|sale/, flowRe: /reserv|mesa|lugar/, steps: [{ ask: '¡Dale! ¿Para qué día querés la mesa?', opts: ['Hoy', 'Mañana', 'El sábado'] }, { ask: '¿Para cuántas personas?', opts: ['2 personas', '4 personas', '6 personas'] }], done: (a) => 'Perfecto: mesa para ' + a[1] + ', ' + a[0].toLowerCase() + '. Le paso tu pedido a alguien del equipo para que confirme la disponibilidad.' },
      vete: { label: 'Veterinaria', name: 'Veterinaria Patitas', initial: 'P', color: '#3d7a64', greet: '¡Hola! Soy el asistente de Veterinaria Patitas. Te ayudo con turnos, vacunas, horarios y guardia.', quick: ['Horarios', 'Sacar turno', 'Vacunas', '¿Dónde están?', 'Formas de pago', 'Hablar con alguien'], horario: 'Atendemos de lunes a sábado de 9 a 20 h. Para urgencias fuera de horario, te pasamos con la guardia.', envio: 'Hacemos envío de alimento balanceado en la zona sur. Pasame tu dirección y te confirmamos.', pago: 'Efectivo, transferencia, tarjetas y Mercado Pago.', addr: 'Av. Tavella 1500, Salta', card: { title: 'Vacunas y consultas', foot: 'Precios de ejemplo', lines: [['Consulta general', '$ 15.000'], ['Vacuna antirrábica', '$ 12.000'], ['Séxtuple (perros)', '$ 18.000'], ['Triple felina', '$ 16.000']] }, cardRe: /vacun|precio|cuanto|sale|consulta/, flowRe: /turno|reserv|atender|control/, steps: [{ ask: '¡Claro! ¿Para qué mascota es el turno?', opts: ['Perro', 'Gato', 'Otro'] }, { ask: '¿Qué día te queda bien?', opts: ['Mañana', 'El viernes', 'El sábado'] }], done: (a) => 'Anotado: turno para tu ' + a[0].toLowerCase() + ', ' + a[1].toLowerCase() + '. Le paso tu pedido a recepción para que te confirme el horario.' },
      tecnico: { label: 'Servicio técnico', name: 'Servicio Técnico Sur', initial: 'S', color: '#5d6b8a', greet: '¡Hola! Soy el asistente de Servicio Técnico Sur. Te ayudo con presupuestos, demoras y horarios.', quick: ['Horarios', 'Pedir presupuesto', '¿Cuánto tarda?', '¿Dónde están?', 'Formas de pago', 'Hablar con alguien'], horario: 'Lunes a viernes de 9 a 19 h, y sábados de 9 a 13 h.', envio: 'No retiramos a domicilio: el equipo se deja en el local y te avisamos cuando está listo.', pago: 'Efectivo, transferencia o tarjeta. Las reparaciones tienen garantía.', addr: 'San Martín 850, Salta', demora: 'Los cambios de pantalla y batería suelen salir en el día. Otras fallas llevan de 2 a 5 días hábiles.', card: null, cardRe: /zzzz/, flowRe: /presupuesto|arregl|repar|roto|rota|pantalla|carga|bateria|precio|cuanto sale|cuanto cuesta/, steps: [{ ask: 'Dale. ¿Qué equipo es? Contame marca y modelo.', opts: ['iPhone 13', 'Samsung A54', 'Motorola G84'] }, { ask: '¿Qué problema tiene?', opts: ['Pantalla rota', 'No carga', 'Batería'] }], done: (a) => 'Gracias. ' + a[0] + ' con ' + a[1].toLowerCase() + ': le paso los datos a un técnico para que te confirme el presupuesto.' }
    };
  }
  timeFor(n) { var m = 24 + n; return '10:' + (m < 10 ? '0' + m : m); }
  greetMsgs(biz) { return [{ id: 'g0', kind: 'bot', text: this.bizData()[biz].greet }]; }
  think(text, flow) {
    var b = this.bizData()[this.state.biz]; var t = this.norm(text); var out = [];
    if (flow) {
      var answers = flow.answers.concat([text]); var next = flow.step + 1;
      if (next < b.steps.length) { out.push({ kind: 'bot', text: b.steps[next].ask }); return { out: out, flow: { step: next, answers: answers } }; }
      out.push({ kind: 'bot', text: b.done(answers) }); out.push({ kind: 'sys', text: 'Conversación derivada a una persona del equipo' }); return { out: out, flow: null };
    }
    if (/persona|alguien|humano|asesor|guardia|urgencia/.test(t)) { out.push({ kind: 'bot', text: 'Claro, te paso con alguien del equipo. Te responden en unos minutos.' }); out.push({ kind: 'sys', text: 'Conversación derivada a una persona del equipo' }); }
    else if (/gracias|genial|perfecto/.test(t)) out.push({ kind: 'bot', text: '¡De nada! Cualquier otra cosa, escribime.' });
    else if (/horari|abren|abierto|cierran|hora/.test(t)) out.push({ kind: 'bot', text: b.horario });
    else if (/donde|direcc|ubica|llegar|local/.test(t)) out.push({ kind: 'loc', title: b.name, addr: b.addr + ' (ejemplo)' });
    else if (/envio|delivery|domicilio|mandan|retiran/.test(t)) out.push({ kind: 'bot', text: b.envio });
    else if (/pago|pagar|tarjeta|transfer|efectivo|mercado/.test(t)) out.push({ kind: 'bot', text: b.pago });
    else if (b.demora && /tarda|demora|dias|listo/.test(t)) out.push({ kind: 'bot', text: b.demora });
    else if (b.flowRe.test(t)) { out.push({ kind: 'bot', text: b.steps[0].ask }); return { out: out, flow: { step: 0, answers: [] } }; }
    else if (b.card && b.cardRe.test(t)) out.push({ kind: 'card', title: b.card.title, foot: b.card.foot, lines: b.card.lines.map((l) => ({ a: l[0], b: l[1] })) });
    else if (/^(hola|buen|buenas|hey)/.test(t)) out.push({ kind: 'bot', text: '¡Hola! ¿En qué te puedo ayudar?' });
    else { out.push({ kind: 'bot', text: 'Esa no la sé responder todavía. Le paso tu consulta a alguien del equipo para que te ayude.' }); out.push({ kind: 'sys', text: 'Conversación derivada a una persona del equipo' }); }
    return { out: out, flow: null };
  }
  sendText(raw) {
    var text = String(raw || '').trim();
    if (!text || this.state.typing) return;
    var n = this.state.seq + 1; var res = this.think(text, this.state.flow);
    this.setState({ msgs: this.state.msgs.concat([{ id: 'u' + n, kind: 'user', text: text }]), draft: '', typing: true, seq: n, flow: res.flow });
    var tm = setTimeout(() => { var added = res.out.map((m, i) => Object.assign({ id: 'b' + n + '_' + i }, m)); this.setState({ typing: false, msgs: this.state.msgs.concat(added) }); }, 700 + Math.min(900, res.out.length * 350));
    this.timers.push(tm);
  }
  renderVals() {
    var s = this.state; var tick = s.tick; var dark = this.dark();
    var dNames = ['Panel', 'Ventas', 'Turnos', 'Stock'];
    var dTabs = dNames.map((label, k) => ({ label: label, sel: k === s.dtab ? 'true' : 'false', pillCls: k === s.dtab ? 'pill pill-on' : 'pill', navCls: k === s.dtab ? 'navbtn navbtn-on' : 'navbtn', isPanel: k === 0, isVentas: k === 1, isTurnos: k === 2, isStock: k === 3, pick: () => this.setState({ dtab: k }) }));
    var base = [52, 64, 48, 71, 83, 95, 40]; var dl = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    var bars = base.map((v, j) => { var wob = ((tick * 17 + j * 29) % 21) - 10; var h = Math.max(18, Math.min(100, v + wob)); return { h: h + '%', d: dl[j], bg: j === 5 ? 'var(--barhi)' : 'var(--bar)' }; });
    var pool = [
      { desc: 'Venta · funda y vidrio', m: 18500, dot: 'linear-gradient(135deg,#ffae33,#dc4a12)' },
      { desc: 'Pedido por WhatsApp', m: 35200, dot: 'linear-gradient(135deg,#2fe08f,#0f8a5c)' },
      { desc: 'Reparación entregada', m: 64000, dot: 'linear-gradient(135deg,#ff5a7a,#8c0f32)' },
      { desc: 'Venta · cargador', m: 22900, dot: 'linear-gradient(135deg,#d4c8bc,#a08c7c)' },
      { desc: 'Seña de turno', m: 5000, dot: 'linear-gradient(135deg,#9f7aea,#42164b)' }
    ];
    var moves = []; for (var i = 0; i < 4; i++) { var it = pool[(tick + i) % pool.length]; moves.push({ desc: it.desc, monto: this.money(it.m), dot: it.dot }); }
    var medios = ['Efectivo', 'Transferencia', 'Tarjeta', 'Mercado Pago']; var sales = [];
    for (var j2 = 0; j2 < 5; j2++) { var p = pool[(tick + j2) % pool.length]; var mm = 50 - ((tick * 7 + j2 * 11) % 45); sales.push({ hora: (17 - j2) + ':' + (mm < 10 ? '0' + mm : mm), desc: p.desc, medio: medios[(tick + j2) % 4], monto: this.money(p.m) }); }
    var tList = [{ hora: '10:00', cliente: 'Lucía P.', serv: 'Consulta' }, { hora: '11:30', cliente: 'Martín R.', serv: 'Entrega de equipo' }, { hora: '14:00', cliente: 'Sofía G.', serv: 'Presupuesto' }, { hora: '16:30', cliente: 'Diego A.', serv: 'Retiro' }, { hora: '18:00', cliente: 'Carla M.', serv: 'Consulta' }];
    var doneCount = 2 + (tick % 3);
    var turnos = tList.map((t, k) => { var ok = k < doneCount; return { hora: t.hora, cliente: t.cliente, serv: t.serv, estado: ok ? 'Confirmado' : 'Pendiente', bg: ok ? 'var(--okbg)' : 'var(--warnbg)', fg: ok ? 'var(--ok)' : 'var(--warn)' }; });
    var sList = [['Vidrios templados', 42], ['Cargadores originales', 8], ['Fundas', 64], ['Baterías', 3], ['Cables USB C', 25]];
    var stock = sList.map((x, k) => { var q = Math.max(1, x[1] - ((tick + k) % 3)); var low = q < 10; return { name: x[0], qty: String(q), w: Math.min(100, Math.round(q / 70 * 100) + 6) + '%', bg: low ? 'var(--warn)' : 'var(--fg3)', fg: low ? 'var(--warn)' : 'var(--fg)' }; });
    var circ = 2 * Math.PI * 38; var ventas = 284600 + tick * 18350; var ops = 21 + tick;

    var icons = { auto: 'M13 2L4 14h7l-1 8 9-12h-7z', diag: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4-4', ficha: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 7.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z', web: 'M3 5h18v12H3zM8 21h8', va: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' };
    var svcs = [
      { icon: icons.auto, title: 'Automatizaciones', text: 'Asistente de WhatsApp con IA que responde consultas y horarios, respuestas automáticas en Instagram y Facebook, y procesos internos conectados.', tag: 'Ver la demo del asistente ↓', href: '#asistente' },
      { icon: icons.ficha, title: 'Perfil de Google', text: 'Tu ficha de Google Maps completa: categorías, servicios, fotos, horarios y reseñas, para que te encuentren y te elijan.', tag: 'Ver el antes y después ↓', href: '#ficha' },
      { icon: icons.web, title: 'Sitios web', text: 'Desde una landing page hasta un sitio con varias secciones y catálogo, conectado con WhatsApp y tu ficha de Google. Los sitios más completos tienen plazo según su complejidad.', tag: 'Landing page en 3 a 5 días hábiles', href: this.wa('Hola Andrea, quiero consultar por una página web.') },
      { icon: icons.va, title: 'Asistente virtual con IA', text: 'Soporte administrativo remoto: agenda, seguimiento de clientes, carga de datos y reportes.', tag: 'Por hora o por mes', href: this.wa('Hola Andrea, quiero consultar por el asistente virtual.') }
    ];

    var modData = [
      { id: 'ventas', name: 'Ventas y caja', kind: 'kpi', big: '$ 284.600', sub: 'Vendido hoy · 21 operaciones' },
      { id: 'stock', name: 'Stock', kind: 'levels', rows: [{ a: 'Fundas', b: '80%', c: '#a08c7c' }, { a: 'Cargadores', b: '22%', c: '#d97706' }, { a: 'Baterías', b: '10%', c: '#d97706' }] },
      { id: 'turnos', name: 'Turnos y agenda', kind: 'list', rows: [{ a: '10:00 · Lucía P.', b: 'Confirmado', c: '#05724f' }, { a: '11:30 · Martín R.', b: 'Confirmado', c: '#05724f' }, { a: '16:30 · Diego A.', b: 'Pendiente', c: '#9a5306' }] },
      { id: 'clientes', name: 'Clientes', kind: 'kpi', big: '1.248', sub: 'Clientes registrados · 32 nuevos este mes' },
      { id: 'ordenes', name: 'Órdenes de trabajo', kind: 'list', rows: [{ a: 'iPhone 13 · pantalla', b: 'En proceso', c: '#9a5306' }, { a: 'Moto G84 · batería', b: 'Listo', c: '#05724f' }, { a: 'A54 · no carga', b: 'Ingresado', c: '#5a4a52' }] },
      { id: 'precios', name: 'Lista de precios', kind: 'list', rows: [{ a: 'Cambio de pantalla', b: '$ 85.000', c: '#5d0f22' }, { a: 'Cambio de batería', b: '$ 48.000', c: '#5d0f22' }, { a: 'Diagnóstico', b: '$ 8.000', c: '#5d0f22' }] },
      { id: 'reportes', name: 'Reportes', kind: 'bars', bars: [40, 62, 48, 75, 58, 92].map((h, k) => ({ h: h + '%', c: k === 5 ? '#5d0f22' : '#e3d9cf' })) },
      { id: 'export', name: 'Exportación de datos', kind: 'kpi', big: 'ventas_octubre.xlsx', sub: 'Listo para tu contador' }
    ];
    var mods = modData.map((m) => ({ name: m.name, cls: s.sel[m.id] ? 'mod mod-on' : 'mod', sel: s.sel[m.id] ? 'true' : 'false', mark: s.sel[m.id] ? '✓' : '+', pick: () => { var ns = Object.assign({}, this.state.sel); if (ns[m.id]) delete ns[m.id]; else ns[m.id] = true; this.setState({ sel: ns }); } }));
    var chosen = modData.filter((m) => s.sel[m.id]);
    var widgets = chosen.map((m) => ({ name: m.name, big: m.big, sub: m.sub, rows: m.rows || [], bars: m.bars || [], isKpi: m.kind === 'kpi', isList: m.kind === 'list', isLevels: m.kind === 'levels', isBars: m.kind === 'bars' }));

    var bd = this.bizData(); var biz = bd[s.biz];
    var bizTabs = ['cafe', 'vete', 'tecnico'].map((id) => ({ label: bd[id].label, cls: id === s.biz ? 'pill pill-on' : 'pill', sel: id === s.biz ? 'true' : 'false', pick: () => { if (id !== this.state.biz) this.setState({ biz: id, msgs: this.greetMsgs(id), flow: null, typing: false, draft: '' }); } }));
    var lastBot = -1; s.msgs.forEach((m, k) => { if (m.kind !== 'user') lastBot = k; });
    var msgs = s.msgs.map((m, k) => ({ id: m.id, text: m.text, title: m.title, addr: m.addr, foot: m.foot, lines: m.lines || [], time: this.timeFor(k), isUser: m.kind === 'user', isBotText: m.kind === 'bot', isCard: m.kind === 'card', isLoc: m.kind === 'loc', isSys: m.kind === 'sys', tick: k < lastBot ? '#53bdeb' : '#8696a0' }));
    var opts = s.flow ? biz.steps[s.flow.step].opts : biz.quick;

    var rub = ['Cafeterías', 'Restaurantes', 'Bares', 'Panaderías', 'Barberías', 'Peluquerías', 'Centros de estética', 'Veterinarias', 'Pet shops', 'Servicios técnicos', 'Talleres mecánicos', 'Comercios', 'Ferreterías', 'Ópticas', 'Indumentaria', 'Distribuidoras', 'Inmobiliarias', 'Consultorios', 'Estudios contables', 'Gimnasios', 'Hoteles', 'Profesionales'];
    var half = Math.ceil(rub.length / 2);

    var revText = 'Ordeno la información de tu negocio, automatizo lo que se repite y te dejo un sistema que tu equipo usa todos los días.'.split(' ');
    var revWords = revText.map((t, i) => ({ t: t, st: 'opacity: clamp(.16, calc(var(--rv) * ' + (revText.length + 4) + ' - ' + i + '), 1)' }));
    var stc = {}; for (var q = 1; q <= 4; q++) { var on = s.step === q - 1 ? ' on' : ''; stc['s' + q] = 'st' + on; stc['c' + q] = 'screen st' + on; }
    var mix = this.tema() === 'mixto';
    var L = mix ? 'theme-light' : '';
    var bands = { inicio: '', panel: L, servicios: '', split: L, problema: '', modulos: L, demo: '', story: '', caso: L, asistente: '', rubros: L, ficha: '', precios: '', preguntas: L, contacto: '', footer: '' };
    var orbs = dark ? [
      { st: 'width:170px;height:170px;left:8%;top:12%;background:radial-gradient(circle at 32% 28%, #ffd28a 0%, #ffae33 38%, #b8641a 100%);box-shadow:0 30px 60px rgba(0,0,0,.5);animation:roamA 46s ease-in-out infinite' },
      { st: 'width:230px;height:230px;right:6%;top:30%;background:radial-gradient(circle at 30% 26%, #ff8aa2 0%, #d01f45 40%, #5d0f22 100%);box-shadow:0 34px 70px rgba(0,0,0,.55);animation:roamB 58s ease-in-out infinite' },
      { st: 'width:100px;height:100px;left:46%;top:70%;background:radial-gradient(circle at 32% 28%, #ffffff 0%, #efe8df 45%, #a99a8c 100%);box-shadow:0 24px 50px rgba(0,0,0,.5);animation:roamC 40s ease-in-out infinite' },
      { st: 'width:70px;height:70px;left:22%;top:78%;background:radial-gradient(circle at 30% 26%, #ff8aa2 0%, #a3133b 50%, #3d0714 100%);box-shadow:0 20px 40px rgba(0,0,0,.5);animation:roamA 64s ease-in-out infinite reverse' }
    ] : [
      { st: 'width:240px;height:240px;left:-4%;top:14%;background:radial-gradient(circle at 32% 28%, #ffffff 0%, #f2ebe3 40%, #b9a896 100%);box-shadow:0 40px 70px rgba(80,60,40,.25);animation:roamA 50s ease-in-out infinite' },
      { st: 'width:170px;height:170px;right:5%;top:36%;background:radial-gradient(circle at 30% 26%, #c98a97 0%, #7e2238 45%, #3d0714 100%);box-shadow:0 34px 60px rgba(80,30,40,.3);animation:roamB 60s ease-in-out infinite' },
      { st: 'width:110px;height:110px;left:40%;top:72%;background:radial-gradient(circle at 32% 28%, #e8dccf 0%, #a08c7c 50%, #5e4f43 100%);box-shadow:0 24px 44px rgba(80,60,40,.28);animation:roamC 42s ease-in-out infinite' },
      { st: 'width:80px;height:80px;left:70%;top:8%;background:radial-gradient(circle at 32% 28%, #ffffff 0%, #efe6dc 45%, #b5a493 100%);box-shadow:0 20px 40px rgba(80,60,40,.25);animation:roamA 66s ease-in-out infinite reverse' }
    ];
    return {
      bands: bands, bgCanvas: this.bgRef, splitRef: this.splitRef, storyRef: this.storyRef, revWords: revWords, stc: stc,
      themeCls: dark ? 'theme-dark' : 'theme-light',
      dTabs: dTabs, tabPanel: s.dtab === 0, tabVentas: s.dtab === 1, tabTurnos: s.dtab === 2, tabStock: s.dtab === 3,
      bars: bars, moves: moves, sales: sales, turnos: turnos, stock: stock,
      ringDash: (circ * doneCount / 5).toFixed(1) + ' ' + circ.toFixed(1), ringNum: doneCount + '/5',
      ventasHoy: this.money(ventas), ticket: this.money(ventas / ops),
      tiltTf: 'perspective(1400px) rotateX(' + s.rx.toFixed(2) + 'deg) rotateY(' + s.ry.toFixed(2) + 'deg)',
      onTilt: (e) => { var r = e.currentTarget.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width - 0.5; var y = (e.clientY - r.top) / r.height - 0.5; this.setState({ rx: -y * 6, ry: x * 8 }); },
      offTilt: () => this.setState({ rx: 0, ry: 0 }),
      svcs: svcs,
      mods: mods, widgets: widgets, selNames: chosen.map((m) => ({ name: m.name })), noneSel: chosen.length === 0, selCount: chosen.length,
      selAll: () => { var ns = {}; modData.forEach((m) => { ns[m.id] = true; }); this.setState({ sel: ns }); },
      selNone: () => this.setState({ sel: {} }),
      waModulos: this.wa('Hola Andrea, armé un sistema en tu web con estos módulos: ' + (chosen.length ? chosen.map((m) => m.name).join(', ') : 'todavía no elegí') + '.'),
      bizTabs: bizTabs, bizName: biz.name, bizInitial: biz.initial, bizColor: biz.color, bizStatus: s.typing ? 'escribiendo...' : 'en línea',
      msgs: msgs, typing: s.typing, draft: s.draft, chatRef: this.chatRef, chatId: dark ? 'chat-o' : 'chat-c',
      quick: s.typing ? [] : opts.map((o) => ({ label: o, pick: () => this.sendText(o) })),
      onDraft: (e) => this.setState({ draft: e.target.value }),
      onKey: (e) => { if (e.key === 'Enter') { e.preventDefault(); this.sendText(this.state.draft); } },
      send: () => this.sendText(this.state.draft),
      rubros: rub.join('  ·  ') + '  ·', rubros2: '',
      cmpPos: s.cmpPos, cmpCls: s.cmpTouched ? 'cmp' : 'cmp hint', cmpHint: !s.cmpTouched,
      onCmp: (e) => this.setState({ cmpPos: Number(e.target.value), cmpTouched: true }),
      stopHint: () => { if (!this.state.cmpTouched) this.setState({ cmpTouched: true }); },
      waGeneral: this.wa('Hola Andrea, vi tu web y quiero hacer una consulta.'),
      waDiag: this.wa('Hola Andrea, quiero pedir el diagnóstico de sistemas sin cargo.'),
      waAuto: this.wa('Hola Andrea, probé el asistente de tu web y quiero consultar por la automatización de WhatsApp.'),
      waFicha: this.wa('Hola Andrea, quiero consultar por mi ficha de Google.')
    };
  }
}
function tpl(v) {
  const { themeCls, bgCanvas, waGeneral, bands, dTabs, d, ringDash, ringNum, ventasHoy, ticket, tabPanel, bars, b, moves, r, tabVentas, sales, tabTurnos, turnos, tabStock, stock, onTilt, offTilt, tiltTf, svcs, s, waDiag, splitRef, revWords, w, mods, m, selAll, selNone, selNames, n, noneSel, selCount, widgets, waModulos, storyRef, stc, bizTabs, waAuto, bizColor, bizInitial, bizName, bizStatus, chatRef, msgs, l, typing, quick, q, chatId, draft, onDraft, onKey, send, waFicha, cmpCls, cmpPos, cmpHint, onCmp, stopHint, rubros } = v;
  return html`<div class="${themeCls}">
<div class="page">
<canvas class="bgfx" ref="${bgCanvas}" aria-hidden="true"></canvas>

<div class="content">

<header style="position: sticky; top: 16px; z-index: 50; padding-top: 16px">
<div class="wrap">
<div class="glass" style="border-radius: 999px; height: 66px; padding: 0 10px 0 22px; display: flex; align-items: center; justify-content: space-between">
<a href="#inicio" style="text-decoration: none; color: var(--fg); display: flex; align-items: center; gap: 12px">
<span style="width: 28px; height: 28px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 3px"><span style="border-radius: 3px; background: #d4c8bc"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #5d0f22"></span></span>
<span style="display: flex; flex-direction: column; line-height: 1.1"><span class="t" style="font-size: 16px">VON AI Studio</span><span class="lbl" style="font-size: 8px">Soluciones digitales</span></span>
</a>
<nav class="nav-links" aria-label="Principal" style="display: flex; gap: 2px">
<a class="nav-link" href="#servicios">Servicios</a>
<a class="nav-link" href="#modulos">Armá tu sistema</a>
<a class="nav-link" href="#demo">Demo</a>
<a class="nav-link" href="#precios">Precios</a>
<a class="nav-link" href="#contacto">Contacto</a>
</nav>
<a class="btn btn-main" href="${waGeneral}" style="min-height: 46px; padding: 0 20px">Hablemos</a>
</div>
</div>
</header>

<section id="inicio" class="band ${bands.inicio}" style="position: relative; padding: 84px 0 120px">
<div class="wrap hero-grid">
<div class="rise">
<span class="glass-2 lbl" style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 999px; color: #c4bec1; font-size: 11px"><span class="live" style="width: 7px; height: 7px; border-radius: 50%; background: #2fe08f"></span>Salta, Argentina · presencial y remoto</span>
<h1 class="t h1" style="margin: 26px 0 0; font-size: 54px; line-height: 1.07">Sistemas de gestión a medida y <span class="acc">automatización con IA</span> para pymes</h1>
<p style="margin: 24px 0 0; font-size: 19px; line-height: 1.6; color: var(--fg2); max-width: 500px">Ordeno ventas, stock, turnos y clientes en un solo sistema, y automatizo las consultas de WhatsApp para que tu equipo recupere horas cada semana.</p>
<div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px">
<a class="btn btn-main" href="${waGeneral}">Escribime por WhatsApp</a>
<a class="btn btn-glass" href="#modulos">Armá tu sistema</a>
</div>
<p class="lbl" style="margin: 30px 0 0; font-size: 10px; display: flex; align-items: center; gap: 8px">Demo en vivo · tocá las pestañas del panel</p>
</div>
<div class="glass" style="position: relative; padding: 18px; border-radius: 32px">
<div class="dash">
<div class="side-nav glass-2" style="border-radius: 999px; padding: 10px 11px; display: flex; flex-direction: column; align-items: center; gap: 14px; align-self: start">
${(dTabs).map((d) => html`
<button type="button" class="${d.navCls}" aria-label="${d.label}" onClick="${d.pick}">
${(d.isPanel) ? html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="2"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="2"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="2"></rect></svg>` : null}
${(d.isVentas) ? html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V11M10 19V5M16 19v-6M22 19H2"></path></svg>` : null}
${(d.isTurnos) ? html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"></rect><path d="M3.5 10h17M8 3v4M16 3v4"></path></svg>` : null}
${(d.isStock) ? html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8L12 3.5 20.5 8v8L12 20.5 3.5 16z"></path><path d="M3.5 8L12 12.5 20.5 8M12 12.5v8"></path></svg>` : null}
</button>
`)}
</div>
<div style="min-width: 0">
<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap">
<div role="tablist" aria-label="Vistas del panel" class="glass-2" style="border-radius: 999px; padding: 5px; display: flex; gap: 4px; overflow-x: auto; max-width: 100%">
${(dTabs).map((d) => html`
<button type="button" role="tab" aria-selected="${d.sel}" class="${d.pillCls}" style="min-height: 38px; padding: 0 16px; border-color: transparent" onClick="${d.pick}">${d.label}</button>
`)}
</div>
<span class="lbl" style="font-size: 9px; display: flex; align-items: center; gap: 7px"><span class="live" style="width: 6px; height: 6px; border-radius: 50%; background: var(--ok)"></span>En vivo · datos de ejemplo</span>
</div>
<div class="kpis" style="margin-top: 22px">
<div class="ring" style="position: relative; width: 92px; height: 92px">
<svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
<circle cx="46" cy="46" r="38" fill="none" stroke="var(--bar)" stroke-width="8"></circle>
<circle cx="46" cy="46" r="38" fill="none" stroke="var(--acc)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${ringDash}" transform="rotate(-90 46 46)" style="transition: stroke-dasharray .9s ease"></circle>
</svg>
<div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center"><span class="t" style="font-size: 20px">${ringNum}</span><span class="lbl" style="font-size: 8px; letter-spacing: .1em">turnos</span></div>
</div>
<div><div class="lbl" style="font-size: 9px">Ventas de hoy</div><div class="t" style="font-size: 32px; margin-top: 4px">${ventasHoy}</div></div>
<div><div class="lbl" style="font-size: 9px">Ticket promedio</div><div class="t" style="font-size: 32px; margin-top: 4px">${ticket}</div></div>
</div>
<div style="margin-top: 20px; min-height: 250px">
${(tabPanel) ? html`
<div style="display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 12px">
<div class="glass-2" style="padding: 16px">
<div class="lbl" style="font-size: 9px">Semana</div>
<div style="display: flex; align-items: flex-end; gap: 8px; height: 150px; margin-top: 14px">
${(bars).map((b) => html`
<div style="flex-grow: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px">
<div class="bar" style="width: 100%; border-radius: 999px; background: ${b.bg}; height: ${b.h}"></div>
<span class="lbl" style="font-size: 9px; letter-spacing: .06em">${b.d}</span>
</div>
`)}
</div>
</div>
<div class="glass-2" style="padding: 6px 0; overflow: hidden">
${(moves).map((r) => html`
<div class="row-in" style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 14px">
<span style="width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%; background: ${r.dot}"></span>
<span style="flex-grow: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--fg2)">${r.desc}</span>
<span class="t" style="font-size: 13px">${r.monto}</span>
</div>
`)}
</div>
</div>
` : null}
${(tabVentas) ? html`
<div class="glass-2" style="padding: 6px 0">
${(sales).map((r) => html`
<div class="row-in" style="display: grid; grid-template-columns: 52px minmax(0,1fr) auto auto; gap: 12px; align-items: center; padding: 11px 16px; font-size: 14px; border-bottom: 1px solid var(--line)">
<span class="lbl" style="font-size: 10px; letter-spacing: .06em">${r.hora}</span>
<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${r.desc}</span>
<span class="lbl" style="font-size: 9px; letter-spacing: .08em; padding: 5px 10px; border-radius: 999px; background: var(--glass2); border: 1px solid var(--line)">${r.medio}</span>
<span class="t" style="font-size: 14px">${r.monto}</span>
</div>
`)}
</div>
` : null}
${(tabTurnos) ? html`
<div class="glass-2" style="padding: 6px 0">
${(turnos).map((r) => html`
<div class="row-in" style="display: grid; grid-template-columns: 56px minmax(0,1fr) auto; gap: 12px; align-items: center; padding: 11px 16px; font-size: 14px; border-bottom: 1px solid var(--line)">
<span class="t" style="font-size: 14px">${r.hora}</span>
<span style="min-width: 0"><span style="display: block">${r.cliente}</span><span style="display: block; font-size: 12px; color: var(--fg3)">${r.serv}</span></span>
<span class="lbl" style="font-size: 9px; letter-spacing: .08em; padding: 6px 11px; border-radius: 999px; background: ${r.bg}; color: ${r.fg}">${r.estado}</span>
</div>
`)}
</div>
` : null}
${(tabStock) ? html`
<div class="glass-2" style="padding: 8px 0">
${(stock).map((r) => html`
<div style="display: grid; grid-template-columns: minmax(0,1fr) 120px 44px; gap: 14px; align-items: center; padding: 11px 16px; font-size: 14px">
<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${r.name}</span>
<span style="height: 8px; border-radius: 999px; background: var(--bar); overflow: hidden"><span class="lvl" style="display: block; height: 100%; border-radius: 999px; width: ${r.w}; background: ${r.bg}"></span></span>
<span class="t" style="font-size: 13px; text-align: right; color: ${r.fg}">${r.qty}</span>
</div>
`)}
</div>
` : null}
</div>
</div>
</div>
</div>
</div>
</section>

<section class="band ${bands.servicios}" id="servicios" style="padding: 60px 0 120px">
<div class="wrap">
<div class="rise" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 24px">
<div><div class="lbl acc">Servicios</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">Lo que hago por tu negocio</h2></div>
<p style="margin: 0; max-width: 420px; font-size: 17px; line-height: 1.6; color: var(--fg2)">Cada proyecto arranca con un diagnóstico: primero entiendo cómo trabaja tu equipo y después propongo la herramienta.</p>
</div>

<a href="/sistemas-de-gestion-salta" class="folder" onPointerMove="${onTilt}" onPointerLeave="${offTilt}" style="display: block; margin-top: 260px; text-decoration: none; color: var(--fg); transform: ${tiltTf}">
<div class="balloon-wrap" aria-hidden="true"><span class="balloon">S</span></div>
<div class="folder-tab" style="z-index: 2"><span class="lbl" style="font-size: 10px; color: var(--fg)">Servicio principal</span></div>
<div class="folder-body">
<div>
<h3 class="t" style="margin: 0; font-size: 40px; line-height: 1.08">Sistemas de gestión a medida</h3>
<p style="margin: 16px 0 0; font-size: 18px; line-height: 1.6; color: var(--fg2); max-width: 560px">Un sistema para ordenar clientes, pedidos, stock, turnos o ventas según cómo trabaja tu negocio. Incluye puesta en marcha y capacitación para tu equipo.</p>
<span class="pill pill-on" style="margin-top: 26px; cursor: inherit">Desde USD 300</span>
</div>
<span style="width: 66px; height: 66px; border-radius: 50%; border: 1px solid var(--line2); display: flex; align-items: center; justify-content: center" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"></path></svg></span>
</div>
</a>

<div class="svc-grid" style="margin-top: 22px">
${(svcs).map((s) => html`
<a href="${s.href}" class="glass lift" style="text-decoration: none; color: var(--fg); padding: 30px; display: flex; flex-direction: column; gap: 14px">
<span style="width: 52px; height: 52px; border-radius: 50%; background: var(--glass2); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center" aria-hidden="true">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${s.icon}"></path></svg>
</span>
<h3 class="t" style="margin: 4px 0 0; font-size: 21px">${s.title}</h3>
<p style="margin: 0; font-size: 15px; line-height: 1.6; color: var(--fg2)">${s.text}</p>
<span class="lbl acc" style="margin-top: auto; padding-top: 8px; font-size: 10px">${s.tag}</span>
</a>
`)}
<a href="${waDiag}" class="lift svc-wide" style="text-decoration: none; color: #fff; padding: 34px; border-radius: 28px; background: var(--hl); display: flex; flex-direction: column; justify-content: space-between; gap: 16px; box-shadow: 0 24px 50px rgba(140,15,50,.35)">
<span class="lbl" style="font-size: 10px; color: #ffe1c7">Diagnóstico de sistemas · sin cargo</span>
<span class="t" style="font-size: 30px; line-height: 1.18; max-width: 620px">Contame cómo trabaja hoy tu negocio y te digo qué conviene hacer primero</span>
<span style="font-size: 16px; line-height: 1.6; color: #ffe8ec; max-width: 600px">Analizo tus procesos y te recomiendo herramientas concretas, con costos comparados y un plan para arrancar.</span>
<span class="lbl" style="font-size: 11px; color: #fff">Pedir mi diagnóstico ↗</span>
</a>
</div>
</div>
</section>

<section class="band ${bands.split} xw" ref="${splitRef}" aria-label="Ordená, automatizá, crecé" style="padding: 80px 0 120px">
<div class="xw-line" style="padding-left: 8vw">Ordená.</div>
<div class="xw-line xw-acc" style="padding-left: 2vw">Automatizá.</div>
<div class="xw-line" style="padding-left: 26vw">Crecé.</div>
<div class="wrap" style="margin-top: 90px">
<p class="reveal t" style="margin: 0 auto; max-width: 980px; text-align: center; font-size: 46px; line-height: 1.18; font-weight: 500">${(revWords).map((w) => html`<span style="display: inline; ${w.st}">${w.t} </span>`)}</p>
</div>
</section>

<section class="band ${bands.problema}" style="padding: 40px 0 120px">
<div class="wrap">
<div class="rise"><div class="lbl acc">El problema</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">¿Te suena alguna de estas?</h2></div>
<div class="g4" style="margin-top: 40px">
<div class="glass lift rise" style="padding: 28px; border-radius: 26px"><span class="t acc" style="font-size: 22px">01</span><p style="margin: 14px 0 0; font-size: 17px; line-height: 1.5">No sabés cuánto vendiste hasta que cerrás la caja.</p></div>
<div class="glass lift rise" style="padding: 28px; border-radius: 26px"><span class="t acc" style="font-size: 22px">02</span><p style="margin: 14px 0 0; font-size: 17px; line-height: 1.5">Te enterás de que falta stock cuando un cliente lo pide.</p></div>
<div class="glass lift rise" style="padding: 28px; border-radius: 26px"><span class="t acc" style="font-size: 22px">03</span><p style="margin: 14px 0 0; font-size: 17px; line-height: 1.5">Los turnos y pedidos están repartidos entre un cuaderno y el chat.</p></div>
<div class="glass lift rise" style="padding: 28px; border-radius: 26px"><span class="t acc" style="font-size: 22px">04</span><p style="margin: 14px 0 0; font-size: 17px; line-height: 1.5">La información de cada cliente depende de la memoria de alguien.</p></div>
</div>
</div>
</section>

<section class="band ${bands.modulos}" id="modulos" style="padding: 40px 0 130px">
<div class="wrap">
<div class="rise" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 24px">
<div><div class="lbl acc">Módulos</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">Armá tu sistema</h2></div>
<p style="margin: 0; max-width: 440px; font-size: 17px; line-height: 1.6; color: var(--fg2)">Elegí los módulos que necesita tu negocio y mirá cómo se arma tu panel a la derecha.</p>
</div>
<div class="builder" style="margin-top: 40px">
<div class="glass" style="padding: 12px; border-radius: 32px; display: grid; gap: 6px">
${(mods).map((m) => html`
<button type="button" class="${m.cls}" aria-pressed="${m.sel}" onClick="${m.pick}"><span>${m.name}</span><span style="font-size: 16px">${m.mark}</span></button>
`)}
<div style="display: flex; gap: 8px; padding: 6px 4px 2px">
<button type="button" class="pill" onClick="${selAll}">Elegir todos</button>
<button type="button" class="pill" onClick="${selNone}">Vaciar</button>
</div>
</div>
<div class="glass" style="padding: 14px; border-radius: 32px">
<div style="background: #f7f4f0; color: #1c1216; border-radius: 22px; min-height: 520px; display: grid; grid-template-columns: 160px minmax(0,1fr); overflow: hidden">
<div style="background: #fff; border-right: 1px solid #ece5dd; padding: 18px 10px; display: flex; flex-direction: column; gap: 4px">
<div class="t" style="font-size: 15px; padding: 2px 10px 14px">Tu negocio</div>
${(selNames).map((n) => html`
<div class="si row-in">${n.name}</div>
`)}
${(noneSel) ? html`<div class="si" style="opacity: .6">Sin módulos</div>` : null}
</div>
<div style="padding: 18px">
<div style="display: flex; justify-content: space-between; align-items: center"><div class="t" style="font-size: 18px">Panel</div><span class="chip" style="background: #fff; color: #5d0f22">${selCount} módulos</span></div>
${(noneSel) ? html`
<div style="margin-top: 18px; height: 420px; border: 2px dashed #ddd2c6; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #6b5a62; text-align: center; padding: 20px">
<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>
<span style="font-size: 15px">Elegí un módulo a la izquierda para empezar a armar tu sistema</span>
</div>
` : null}
<div class="wgrid" style="margin-top: 14px">
${(widgets).map((w) => html`
<div class="pop-in" style="background: #fff; border-radius: 16px; padding: 14px; font-size: 13px; min-height: 120px">
<div class="lbl" style="font-size: 8px; color: #6b5a62">${w.name}</div>
${(w.isKpi) ? html`<div class="t" style="font-size: 24px; margin-top: 8px">${w.big}</div><div style="color: #6b5a62; margin-top: 2px">${w.sub}</div>` : null}
${(w.isBars) ? html`<div style="display: flex; align-items: flex-end; gap: 6px; height: 70px; margin-top: 10px">${(w.bars).map((b) => html`<div style="flex-grow: 1; border-radius: 999px; background: ${b.c}; height: ${b.h}"></div>`)}</div>` : null}
${(w.isList) ? html`<div style="margin-top: 8px">${(w.rows).map((r) => html`<div style="display: flex; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f1ebe4"><span>${r.a}</span><span style="color: ${r.c}">${r.b}</span></div>`)}</div>` : null}
${(w.isLevels) ? html`<div style="margin-top: 8px; display: grid; gap: 7px">${(w.rows).map((r) => html`<div style="display: grid; grid-template-columns: 1fr 70px; gap: 8px; align-items: center"><span>${r.a}</span><span style="height: 6px; border-radius: 999px; background: #efe8e0; overflow: hidden"><span style="display: block; height: 100%; width: ${r.b}; background: ${r.c}"></span></span></div>`)}</div>` : null}
</div>
`)}
</div>
</div>
</div>
</div>
</div>
<div style="display: flex; justify-content: flex-end; margin-top: 20px">
<a class="btn btn-main" href="${waModulos}">Quiero un sistema con estos módulos</a>
</div>
</div>
</section>

<section class="band ${bands.demo}" id="demo" style="padding: 40px 0 0; text-align: center">
<div class="wrap apple">
<div class="lbl">Ejemplo · sistema para una veterinaria</div>
<h2 class="t" style="margin: 20px 0 0; font-size: 116px; line-height: .95; letter-spacing: -.045em">Tu negocio,<br />ordenado.</h2>
<p style="margin: 26px auto 0; font-size: 20px; line-height: 1.6; color: var(--fg2); max-width: 560px">Deslizá y mirá cómo funciona un sistema a medida, módulo por módulo.</p>
</div>
</section>

<section class="band ${bands.story} story" ref="${storyRef}" style="height: 2240px; padding-top: 40px">
<div style="position: sticky; top: 90px; height: 640px; display: flex; align-items: center">
<div class="wrap story-grid" style="width: 100%">
<div style="position: relative; min-height: 300px">
<div style="height: 3px; border-radius: 999px; background: var(--bar); overflow: hidden"><div class="prog" style="height: 100%; background: var(--barhi)"></div></div>
<div style="position: relative; margin-top: 30px; height: 250px">
<div class="${stc.s1}" style="position: absolute; inset: 0"><div class="t acc" style="font-size: 15px">01</div><h3 class="t" style="margin: 10px 0 0; font-size: 38px; line-height: 1.1">La agenda del día, en una pantalla</h3><p style="margin: 16px 0 0; font-size: 18px; line-height: 1.6; color: var(--fg2)">Quién viene, a qué hora y qué está pendiente. Sin cuaderno ni chats sueltos.</p></div>
<div class="${stc.s2}" style="position: absolute; inset: 0"><div class="t acc" style="font-size: 15px">02</div><h3 class="t" style="margin: 10px 0 0; font-size: 38px; line-height: 1.1">La historia de cada paciente</h3><p style="margin: 16px 0 0; font-size: 18px; line-height: 1.6; color: var(--fg2)">Datos del dueño, peso, consultas y tratamientos, para todo el equipo.</p></div>
<div class="${stc.s3}" style="position: absolute; inset: 0"><div class="t acc" style="font-size: 15px">03</div><h3 class="t" style="margin: 10px 0 0; font-size: 38px; line-height: 1.1">Recordatorios de vacunas</h3><p style="margin: 16px 0 0; font-size: 18px; line-height: 1.6; color: var(--fg2)">El sistema avisa qué vence y prepara el mensaje para mandarlo por WhatsApp.</p></div>
<div class="${stc.s4}" style="position: absolute; inset: 0"><div class="t acc" style="font-size: 15px">04</div><h3 class="t" style="margin: 10px 0 0; font-size: 38px; line-height: 1.1">La caja, sin cuentas a mano</h3><p style="margin: 16px 0 0; font-size: 18px; line-height: 1.6; color: var(--fg2)">Consultas, vacunas y venta de alimento sumadas al momento.</p></div>
</div>
</div>
<div style="border-radius: 24px; padding: 12px; background: #1b1719; box-shadow: var(--shadow)">
<div style="position: relative; aspect-ratio: 16 / 10; border-radius: 12px; overflow: hidden; background: #f7f4f0; text-align: left">
<div class="${stc.c1}">
<div class="side"><div class="t" style="font-size: 14px; padding: 4px 10px 14px">Patitas</div><div class="si si-on">Agenda</div><div class="si">Pacientes</div><div class="si">Vacunas</div><div class="si">Caja</div></div>
<div style="padding: 20px 22px"><div class="t" style="font-size: 20px">Agenda · martes</div>
<div style="background: #fff; border-radius: 14px; margin-top: 14px; font-size: 13px">
<div style="display: flex; gap: 12px; padding: 11px 14px; border-bottom: 1px solid #f1ebe4"><b class="t" style="font-size: 12px">09:30</b><span style="flex-grow: 1">Luna · control anual</span><span class="chip" style="background: #e6f6ef; color: #05724f">Atendido</span></div>
<div style="display: flex; gap: 12px; padding: 11px 14px; border-bottom: 1px solid #f1ebe4"><b class="t" style="font-size: 12px">10:15</b><span style="flex-grow: 1">Milo · vacuna séxtuple</span><span class="chip" style="background: #e6f6ef; color: #05724f">Atendido</span></div>
<div style="display: flex; gap: 12px; padding: 11px 14px; border-bottom: 1px solid #f1ebe4"><b class="t" style="font-size: 12px">11:00</b><span style="flex-grow: 1">Olivia · consulta</span><span class="chip" style="background: #fdf1de; color: #9a5306">En espera</span></div>
<div style="display: flex; gap: 12px; padding: 11px 14px"><b class="t" style="font-size: 12px">16:00</b><span style="flex-grow: 1">Simba · desparasitación</span><span class="chip" style="background: #f3efea; color: #5a4a52">Confirmado</span></div>
</div></div>
</div>
<div class="${stc.c2}">
<div class="side"><div class="t" style="font-size: 14px; padding: 4px 10px 14px">Patitas</div><div class="si">Agenda</div><div class="si si-on">Pacientes</div><div class="si">Vacunas</div><div class="si">Caja</div></div>
<div style="padding: 20px 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start">
<div style="background: #fff; border-radius: 14px; padding: 16px; grid-column: span 2; display: flex; gap: 14px; align-items: center"><span class="t" style="width: 54px; height: 54px; border-radius: 50%; background: #b48a5a; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px">L</span><div><div class="t" style="font-size: 20px">Luna</div><div style="font-size: 13px; color: #5a4a52">Golden retriever · 3 años · 28 kg · Dueña: Marina G.</div></div></div>
<div style="background: #fff; border-radius: 14px; padding: 14px; font-size: 13px"><div class="lbl" style="font-size: 8px; color: #5a4a52">Historia clínica</div><div style="margin-top: 8px; line-height: 1.7">12/09 · Control anual<br />03/06 · Otitis, tratamiento<br />20/01 · Vacuna antirrábica</div></div>
<div style="background: #fff; border-radius: 14px; padding: 14px; font-size: 13px"><div class="lbl" style="font-size: 8px; color: #5a4a52">Próximo</div><div class="t" style="font-size: 17px; margin-top: 8px">Antirrábica</div><div style="color: #9a5306">Vence el 20/01</div></div>
</div>
</div>
<div class="${stc.c3}">
<div class="side"><div class="t" style="font-size: 14px; padding: 4px 10px 14px">Patitas</div><div class="si">Agenda</div><div class="si">Pacientes</div><div class="si si-on">Vacunas</div><div class="si">Caja</div></div>
<div style="padding: 20px 22px"><div class="t" style="font-size: 20px">Vacunas por vencer</div>
<div style="background: #fff; border-radius: 14px; margin-top: 14px; font-size: 13px">
<div style="display: flex; gap: 12px; align-items: center; padding: 11px 14px; border-bottom: 1px solid #f1ebe4"><span style="flex-grow: 1">Milo · séxtuple · vence en 5 días</span><span class="chip" style="background: #1c1216; color: #f3efea">Enviar WhatsApp</span></div>
<div style="display: flex; gap: 12px; align-items: center; padding: 11px 14px; border-bottom: 1px solid #f1ebe4"><span style="flex-grow: 1">Nina · triple felina · vence en 8 días</span><span class="chip" style="background: #e6f6ef; color: #05724f">Enviado</span></div>
<div style="display: flex; gap: 12px; align-items: center; padding: 11px 14px"><span style="flex-grow: 1">Rocco · antirrábica · vence en 12 días</span><span class="chip" style="background: #1c1216; color: #f3efea">Enviar WhatsApp</span></div>
</div></div>
</div>
<div class="${stc.c4}">
<div class="side"><div class="t" style="font-size: 14px; padding: 4px 10px 14px">Patitas</div><div class="si">Agenda</div><div class="si">Pacientes</div><div class="si">Vacunas</div><div class="si si-on">Caja</div></div>
<div style="padding: 20px 22px"><div class="t" style="font-size: 20px">Caja de hoy</div>
<div style="display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin-top: 14px">
<div style="background: #fff; border-radius: 14px; padding: 12px"><div class="lbl" style="font-size: 8px; color: #5a4a52">Consultas</div><div class="t" style="font-size: 20px; margin-top: 4px">$ 60.000</div></div>
<div style="background: #fff; border-radius: 14px; padding: 12px"><div class="lbl" style="font-size: 8px; color: #5a4a52">Vacunas</div><div class="t" style="font-size: 20px; margin-top: 4px">$ 30.000</div></div>
<div style="background: #fff; border-radius: 14px; padding: 12px"><div class="lbl" style="font-size: 8px; color: #5a4a52">Alimento</div><div class="t" style="font-size: 20px; margin-top: 4px">$ 47.500</div></div>
</div>
<div style="background: #fff; border-radius: 14px; padding: 14px; margin-top: 10px; display: flex; align-items: flex-end; gap: 10px; height: 120px"><div style="flex-grow: 1; height: 45%; border-radius: 999px; background: #e3d9cf"></div><div style="flex-grow: 1; height: 70%; border-radius: 999px; background: #e3d9cf"></div><div style="flex-grow: 1; height: 55%; border-radius: 999px; background: #e3d9cf"></div><div style="flex-grow: 1; height: 90%; border-radius: 999px; background: #5d0f22"></div><div style="flex-grow: 1; height: 62%; border-radius: 999px; background: #e3d9cf"></div></div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>

<section class="band ${bands.caso}" id="caso" style="padding: 80px 0 120px">
<div class="wrap two-col">
<div class="glass" style="padding: 14px; border-radius: 32px">
<img src="/img/apple-service-panel.webp" width="1440" height="812" loading="lazy" decoding="async" alt="Panel del sistema de gestión de Apple Service Salta con ingresos, reparaciones activas, gastos y stock crítico" style="width: 100%; height: auto; display: block; border-radius: 20px" />
</div>
<div class="rise">
<div class="lbl acc">Caso real</div>
<h2 class="t h2" style="margin: 14px 0 0; font-size: 44px; line-height: 1.1">Lo construí primero para mi propio negocio</h2>
<p style="margin: 18px 0 0; font-size: 17px; line-height: 1.6; color: var(--fg2)">Apple Service Salta es mi servicio técnico de celulares. Operaba con cuadernos y planillas sueltas; hoy ventas, stock, reparaciones, clientes y caja viven en un solo sistema. Lo que aprendí ordenando mi negocio es lo que aplico en el tuyo.</p>
</div>
</div>
</section>

<section class="band ${bands.asistente}" id="asistente" style="padding: 40px 0 130px">
<div class="wrap two-col">
<div class="rise">
<div class="lbl acc">Asistente de IA para WhatsApp</div>
<h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">Escribile como si fueras un cliente</h2>
<p style="margin: 20px 0 0; font-size: 18px; line-height: 1.6; color: var(--fg2)">Elegí un rubro, escribí lo que quieras o tocá una sugerencia. Cuando hay que confirmar algo, deriva la conversación a una persona de tu equipo.</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px">
${(bizTabs).map((b) => html`
<button type="button" class="${b.cls}" aria-pressed="${b.sel}" onClick="${b.pick}">${b.label}</button>
`)}
</div>
<a class="btn btn-main" href="${waAuto}" style="margin-top: 34px">Quiero esto en mi WhatsApp</a>
</div>
<div style="display: flex; justify-content: center">
<div style="position: relative; width: 380px; max-width: 100%; border-radius: 64px; padding: 9px; background: linear-gradient(145deg,#f7f3ee 0%,#d6cdc3 35%,#a1968b 70%,#e5ddd4 100%); box-shadow: 0 50px 90px rgba(0,0,0,.25)">
<div style="position: absolute; left: -3px; top: 150px; width: 4px; height: 60px; border-radius: 4px; background: #b3a89d"></div>
<div style="position: absolute; right: -3px; top: 180px; width: 4px; height: 90px; border-radius: 4px; background: #b3a89d"></div>
<div style="border-radius: 56px; padding: 5px; background: #0d0d0e">
<div style="position: relative; border-radius: 51px; overflow: hidden; background: #efeae2; color: #1c1216">
<div style="position: absolute; left: 50%; top: 11px; width: 112px; height: 32px; margin-left: -56px; border-radius: 999px; background: #0d0d0e; z-index: 3"></div>
<div style="position: relative; z-index: 2; padding: 56px 18px 12px; display: flex; align-items: center; gap: 12px; background: rgba(247,244,240,.88); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-bottom: 1px solid rgba(0,0,0,.06)">
<div class="t" style="width: 42px; height: 42px; border-radius: 50%; background: ${bizColor}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 17px">${bizInitial}</div>
<div style="min-width: 0"><div style="font-size: 16px; font-weight: 600">${bizName}</div><div style="font-size: 12px; color: #667781">${bizStatus}</div></div>
<span class="lbl" style="margin-left: auto; font-size: 9px; color: #5a4a52; border: 1px solid rgba(0,0,0,.1); border-radius: 999px; padding: 5px 9px">Ejemplo</span>
</div>
<div ref="${chatRef}" class="scrl" aria-live="polite" style="height: 430px; overflow-y: auto; padding: 14px 12px; display: flex; flex-direction: column; gap: 7px">
${(msgs).map((m) => html`
${(m.isUser) ? html`
<div class="row-in" style="align-self: flex-end; max-width: 82%; background: #d9fdd3; padding: 8px 10px 5px 12px; border-radius: 16px 16px 4px 16px; font-size: 15px; line-height: 1.4"><span>${m.text}</span><span style="display: flex; justify-content: flex-end; align-items: center; gap: 4px; font-size: 11px; color: #667781; margin-top: 2px">${m.time} <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="${m.tick}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-label="Leído"><path d="M1 6l3 3 6-7M6 9l1 .5 6-7.5"></path></svg></span></div>
` : null}
${(m.isBotText) ? html`
<div class="row-in" style="align-self: flex-start; max-width: 86%; background: #fff; padding: 8px 12px 5px; border-radius: 16px 16px 16px 4px; font-size: 15px; line-height: 1.45"><span>${m.text}</span><span style="display: block; text-align: right; font-size: 11px; color: #667781; margin-top: 2px">${m.time}</span></div>
` : null}
${(m.isCard) ? html`
<div class="row-in" style="align-self: flex-start; width: 86%; background: #fff; border-radius: 16px 16px 16px 4px; overflow: hidden">
<div style="padding: 12px 14px 6px; font-size: 15px; font-weight: 600">${m.title}</div>
${(m.lines).map((l) => html`<div style="display: flex; justify-content: space-between; gap: 12px; padding: 7px 14px; font-size: 14px; border-top: 1px solid #f0ebe5"><span>${l.a}</span><span style="color: #5d0f22">${l.b}</span></div>`)}
<div style="padding: 6px 14px 8px; font-size: 11px; color: #667781; display: flex; justify-content: space-between"><span>${m.foot}</span><span>${m.time}</span></div>
</div>
` : null}
${(m.isLoc) ? html`
<div class="row-in" style="align-self: flex-start; width: 78%; background: #fff; border-radius: 16px 16px 16px 4px; overflow: hidden">
<div style="height: 100px; position: relative; background: linear-gradient(135deg,#e6efe4,#dfe7ec)"><div style="position: absolute; left: 0; right: 0; top: 44px; height: 9px; background: #fff"></div><div style="position: absolute; top: 0; bottom: 0; left: 58%; width: 9px; background: #fff"></div><svg width="28" height="28" viewBox="0 0 24 24" fill="#e11d48" style="position: absolute; left: calc(58% - 10px); top: 20px" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"></path></svg></div>
<div style="padding: 10px 14px 2px; font-size: 15px">${m.title}</div>
<div style="padding: 0 14px 8px; font-size: 12px; color: #667781; display: flex; justify-content: space-between; gap: 8px"><span>${m.addr}</span><span>${m.time}</span></div>
</div>
` : null}
${(m.isSys) ? html`<div class="row-in" style="align-self: center; background: #fff6d6; color: #5c4a10; font-size: 12px; padding: 6px 12px; border-radius: 10px; text-align: center">${m.text}</div>` : null}
`)}
${(typing) ? html`<div style="align-self: flex-start; background: #fff; padding: 12px 14px; border-radius: 16px; display: flex; gap: 5px" aria-label="Escribiendo"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>` : null}
</div>
<div class="scrl" style="padding: 4px 10px 0; display: flex; gap: 6px; overflow-x: auto">
${(quick).map((q) => html`<button type="button" class="qr" onClick="${q.pick}">${q.label}</button>`)}
</div>
<div style="padding: 10px 10px 22px; display: flex; gap: 8px; align-items: center">
<label for="${chatId}" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0)">Escribí un mensaje</label>
<input id="${chatId}" class="chat-in" type="text" placeholder="Escribí un mensaje" value="${draft}" onInput="${onDraft}" onKeyDown="${onKey}" />
<button type="button" class="send" aria-label="Enviar" onClick="${send}"><svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4l17.4-7.5c.8-.4.8-1.5 0-1.8L3.4 3.6c-.7-.3-1.4.3-1.2 1l1.9 6.4 9 1-9 1-1.9 6.4c-.2.7.5 1.3 1.2 1z"></path></svg></button>
</div>
<div style="height: 5px; width: 130px; border-radius: 999px; background: #1c1216; margin: 0 auto 8px; opacity: .85"></div>
</div>
</div>
</div>
</div>
</div>
</section>


<section class="band ${bands.ficha}" id="ficha" style="position: relative; padding: 130px 0">
<div class="wrap two-col" style="position: relative">
<div class="rise">
<div class="lbl acc">Perfil de Google</div>
<h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.08">Antes y después de optimizar una ficha</h2>
<p style="margin: 18px 0 0; font-size: 18px; line-height: 1.6; color: var(--fg2)">Una ficha completa, con fotos, horario, teléfono, sitio web y servicios, te trae llamadas, mensajes y visitas. Arrastrá la línea para comparar.</p>
<a class="btn btn-main" href="${waFicha}" style="margin-top: 28px">Revisar mi ficha</a>
<p class="lbl" style="margin: 22px 0 0; font-size: 9px">Ficha de ejemplo, armada para mostrar el cambio</p>
</div>
<div class="${cmpCls}" style="--pos: ${cmpPos}%; height: 540px; box-shadow: 0 40px 80px rgba(0,0,0,.45); border: 1px solid var(--line2)">
<div class="gm" style="position: absolute; inset: 0; background: #f1f3f4; padding: 22px 24px">
<span class="lbl" style="font-size: 10px; color: #3c4043; background: rgba(0,0,0,.07); border-radius: 999px; padding: 6px 12px">Antes</span>
<div style="height: 130px; border-radius: 14px; background: #dadce0; margin-top: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: #5f6368; font-size: 13px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 15l5-5 4 4 3-3 6 6"></path></svg>Sin fotos</div>
<div style="font-size: 22px; margin-top: 14px">VON AI Studio</div>
<div style="font-size: 13.5px; color: #70757a; margin-top: 3px">Sin reseñas · Empresa</div>
<div style="display: flex; gap: 6px; margin-top: 14px"><div class="gm-act" style="color: #5f6368"><span style="background: #e3e5e8"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 9-9 9-9-9z"></path><path d="M9 13v-2h5M12 9l2 2-2 2"></path></svg></span>Cómo llegar</div></div>
<div style="margin-top: 14px">
<div class="gm-row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"></path></svg>Salta</div>
<div class="gm-row" style="color: #9aa0a6"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>Sin horario</div>
<div class="gm-row" style="color: #9aa0a6"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path></svg>Sin teléfono</div>
<div class="gm-row" style="color: #9aa0a6"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"></path></svg>Sin sitio web</div>
</div>
</div>
<div class="cmp-after gm" style="background: #fff; padding: 22px 24px">
<div style="text-align: right"><span class="lbl" style="font-size: 10px; color: #fff; background: #8c0f32; border-radius: 999px; padding: 6px 12px">Después</span></div>
<div style="height: 130px; margin-top: 14px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 5px">
<div style="border-radius: 14px 4px 4px 14px; background: linear-gradient(135deg,#1b1719,#3a0a18); display: flex; align-items: center; justify-content: center"><span style="width: 44px; height: 44px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 4px"><span style="border-radius: 4px; background: #d4c8bc"></span><span style="border-radius: 4px; background: #a08c7c"></span><span style="border-radius: 4px; background: #a08c7c"></span><span style="border-radius: 4px; background: #d01f45"></span></span></div>
<div style="border-radius: 4px; background: linear-gradient(160deg,#e9e3dc,#b9aa9b)"></div>
<div style="border-radius: 4px 14px 14px 4px; background: linear-gradient(160deg,#8c0f32,#e2405f)"></div>
</div>
<div style="font-size: 22px; margin-top: 14px">VON AI Studio</div>
<div style="font-size: 13.5px; color: #70757a; margin-top: 3px">Consultor en informática · <span style="color: #188038">Abierto</span> · Cierra a las 18</div>
<div style="display: flex; gap: 6px; margin-top: 14px">
<div class="gm-act"><span style="background: #0b57d0; color: #fff"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 9-9 9-9-9z"></path><path d="M9 13v-2h5M12 9l2 2-2 2"></path></svg></span>Cómo llegar</div>
<div class="gm-act"><span style="background: #d3e3fd"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path></svg></span>Llamar</div>
<div class="gm-act"><span style="background: #d3e3fd"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"></path></svg></span>Sitio web</div>
<div class="gm-act"><span style="background: #d3e3fd"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.3A8.4 8.4 0 1 1 21 11.5z"></path></svg></span>WhatsApp</div>
<div class="gm-act"><span style="background: #d3e3fd"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13"></path></svg></span>Compartir</div>
</div>
<div style="margin-top: 12px">
<div class="gm-row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"></path></svg>Atiende en Salta capital y alrededores</div>
<div class="gm-row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>Lunes a viernes, 9 a 18 h</div>
<div class="gm-row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path></svg>+54 9 387 638 3191</div>
<div class="gm-row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"></path></svg><span style="color: #0b57d0">vonaistudio.com</span></div>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px"><span style="font-size: 12px; padding: 6px 11px; border-radius: 8px; border: 1px solid #dadce0; color: #3c4043">Sistemas de gestión</span><span style="font-size: 12px; padding: 6px 11px; border-radius: 8px; border: 1px solid #dadce0; color: #3c4043">Automatizaciones</span><span style="font-size: 12px; padding: 6px 11px; border-radius: 8px; border: 1px solid #dadce0; color: #3c4043">Perfil de Google</span><span style="font-size: 12px; padding: 6px 11px; border-radius: 8px; border: 1px solid #dadce0; color: #3c4043">Sitios web</span></div>
</div>
<div class="cmp-line"></div>
<div class="cmp-knob"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"></path></svg></div>
${(cmpHint) ? html`<div class="cmp-tip lbl" style="font-size: 10px; color: #f3efea">Arrastrá para comparar</div>` : null}
<input class="cmp-input" type="range" min="0" max="100" step="1" value="${cmpPos}" aria-label="Comparar antes y después" onInput="${onCmp}" onPointerDown="${stopHint}" />
</div>
</div>
</section>

<section class="band ${bands.precios}" id="precios" style="padding: 130px 0 110px">
<div class="wrap">
<div class="rise" style="text-align: center"><div class="lbl acc">Precios de referencia</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">Tres formas de empezar</h2><p style="margin: 16px auto 0; font-size: 17px; line-height: 1.6; color: var(--fg2); max-width: 600px">El valor final sale del diagnóstico, según los módulos y la cantidad de usuarios. Todos los sistemas tienen un mantenimiento mensual.</p></div>
<div class="g3" style="margin-top: 44px; align-items: stretch">
<div class="glass lift" style="padding: 34px; border-radius: 30px"><span class="pill" style="cursor: default">Sistema base</span><div class="t" style="font-size: 38px; margin-top: 22px"><span style="font-size: 16px; font-weight: 500; color: var(--fg3); letter-spacing: 0">Desde</span> USD 300</div><p style="margin: 14px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">Un sistema ya probado, cargado con los datos de tu negocio. Funciona en tu computadora.</p></div>
<div class="lift" style="padding: 34px; border-radius: 30px; background: var(--hl); color: #fff; box-shadow: 0 30px 60px rgba(140,15,50,.4)"><span class="pill" style="background: #f7f5f2; color: #5d0f22; border-color: #f7f5f2; cursor: default">A medida · el más elegido</span><div class="t" style="font-size: 38px; margin-top: 22px"><span style="font-size: 16px; font-weight: 500; color: #ffe8ec; letter-spacing: 0">Desde</span> USD 500</div><p style="margin: 14px 0 0; font-size: 16px; line-height: 1.6; color: #ffe8ec">La base más los módulos y cambios que necesita tu forma de trabajar.</p></div>
<div class="glass lift" style="padding: 34px; border-radius: 30px"><span class="pill" style="cursor: default">En la nube</span><div class="t" style="font-size: 38px; margin-top: 22px"><span style="font-size: 16px; font-weight: 500; color: var(--fg3); letter-spacing: 0">Desde</span> USD 800</div><p style="margin: 14px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">Acceso desde cualquier dispositivo, usuarios con permisos y seguridad para varios locales o equipos.</p></div>
</div>
</div>
</section>

<section class="band ${bands.preguntas}" id="preguntas" style="padding: 20px 0 120px">
<div class="wrap" style="max-width: 880px">
<div class="lbl acc">Preguntas frecuentes</div>
<h2 class="t h2" style="margin: 14px 0 26px; font-size: 40px; line-height: 1.1">Lo que suelen preguntarme</h2>
<div style="display: grid; gap: 10px">
<details class="glass" style="padding: 22px 26px; border-radius: 24px"><summary style="display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 17px">¿Cómo se paga?<span class="plus" style="width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; border: 1px solid var(--line2); display: flex; align-items: center; justify-content: center">+</span></summary><p style="margin: 12px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">Un 30% para confirmar y el 70% restante al entregar. El presupuesto queda por escrito antes de empezar.</p></details>
<details class="glass" style="padding: 22px 26px; border-radius: 24px"><summary style="display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 17px">¿Necesito saber de tecnología?<span class="plus" style="width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; border: 1px solid var(--line2); display: flex; align-items: center; justify-content: center">+</span></summary><p style="margin: 12px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">No. Todo se diseña para usarse en el día a día, y al entregar capacito a tu equipo.</p></details>
<details class="glass" style="padding: 22px 26px; border-radius: 24px"><summary style="display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 17px">¿Trabajás solo en Salta?<span class="plus" style="width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; border: 1px solid var(--line2); display: flex; align-items: center; justify-content: center">+</span></summary><p style="margin: 12px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">En Salta capital y alrededores trabajo presencial o por videollamada. Para otras ciudades, todo el proceso es remoto.</p></details>
</div>
</div>
</section>

<section class="band ${bands.contacto}" id="contacto" style="padding: 100px 0 90px">
<div class="wrap">
<div class="lbl">¿Empezamos?</div>
<a class="cta-link" href="${waGeneral}" style="display: inline-block; margin-top: 20px; font-size: 180px">Hablemos.</a>
</div>
</section>

<section class="band ${bands.rubros}" aria-label="Rubros con los que trabajo" style="padding: 26px 0; border-top: 1px solid var(--line); overflow: clip">
<div style="display: flex; align-items: center; gap: 28px">
<span class="lbl" style="flex-shrink: 0; padding-left: 32px; font-size: 10px">Trabajo con</span>
<div style="overflow: clip; flex-grow: 1; min-width: 0; -webkit-mask-image: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent); mask-image: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)">
<div class="rub"><span>${rubros}</span><span aria-hidden="true">${rubros}</span></div>
</div>
</div>
</section>

<footer class="band ${bands.footer}" style="border-top: 1px solid var(--line); padding: 56px 0 40px">
<div class="wrap">
<div class="foot-grid">
<div>
<div style="display: flex; align-items: center; gap: 12px"><span style="width: 28px; height: 28px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 3px"><span style="border-radius: 3px; background: #d4c8bc"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #5d0f22"></span></span><span class="t" style="font-size: 18px">VON AI Studio</span></div>
<p style="margin: 14px 0 0; font-size: 15px; line-height: 1.6; color: var(--fg2); max-width: 320px">Sistemas de gestión a medida y automatización con IA para pymes de Salta.</p>
<a class="btn btn-main" href="${waGeneral}" style="margin-top: 20px; min-height: 46px">Escribime por WhatsApp</a>
</div>
<div><div class="lbl" style="margin-bottom: 12px">Servicios</div><a class="foot-link" href="/sistemas-de-gestion-salta">Sistemas de gestión</a><a class="foot-link" href="#asistente">Automatizaciones</a><a class="foot-link" href="#ficha">Perfil de Google</a><a class="foot-link" href="#servicios">Sitios web</a></div>
<div><div class="lbl" style="margin-bottom: 12px">Contacto</div><a class="foot-link" href="${waGeneral}">+54 9 387 638 3191</a><a class="foot-link" href="mailto:andreavon.work@gmail.com">andreavon.work@gmail.com</a><span class="foot-link">Salta, Argentina</span><span class="foot-link">Lun a vie, 9 a 18 h</span></div>
<div><div class="lbl" style="margin-bottom: 12px">Seguime</div><a class="foot-link" href="https://instagram.com/vonaistudio">Instagram</a><a class="foot-link" href="https://maps.google.com/?cid=16941088603117214712">Google Maps</a></div>
</div>
<div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-top: 44px; padding-top: 22px; border-top: 1px solid var(--line); font-size: 13px; color: var(--fg3)">
<span>© 2026 VON AI Studio · Soluciones digitales</span><span>Hecho en Salta, Argentina</span>
</div>
</div>
</footer>

</div>
<a class="fab" href="${waGeneral}" aria-label="Escribir por WhatsApp">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.3A8.4 8.4 0 1 1 21 11.5z"></path></svg>
</a>
</div>
</div>`;
}
export default Component;

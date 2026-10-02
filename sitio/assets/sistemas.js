import { html, Component as PComponent } from './preact-htm.js';
class DCLogic extends PComponent {
  render() { return tpl(this.renderVals()); }
}
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { mod: 0, rx: 0, ry: 0 };
    this.timers = [];
    this.bgRef = (el) => { this.cvBg = el; };
    this.procRef = (el) => { this.procEl = el; };
  }
  componentDidMount() {
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    this.sphTimer = setTimeout(() => this.startSphere(reduce), 60);
    this.onScr = () => { if (this.scrRaf) return; this.scrRaf = requestAnimationFrame(() => { this.scrRaf = 0; this.scrollFx(); }); };
    window.addEventListener('scroll', this.onScr, { passive: true });
    window.addEventListener('resize', this.onScr);
    this.scrTimer = setTimeout(this.onScr, 120);
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
    var vh = window.innerHeight, cl = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    var pe = this.procEl;
    if (pe) {
      var r = pe.getBoundingClientRect();
      var p = cl((vh * 0.75 - r.top - 120) / Math.max(1, r.height - 200));
      pe.style.setProperty('--pp', p.toFixed(3));
    }
  }
  wa(text) { return 'https://wa.me/5493876383191?text=' + encodeURIComponent(text); }
  renderVals() {
    var s = this.state;
    var ok = { bg: '#e6f6ef', c: '#05724f' }, wait = { bg: '#fdf1de', c: '#9a5306' }, neu = { bg: '#f3efea', c: '#5a4a52' }, dark = { bg: '#1c1216', c: '#f3efea' };
    var R = (a, b, t) => ({ a: a, b: b, bg: t.bg, c: t.c });
    var data = [
      { name: 'Ventas y caja', tag: 'Base', text: 'Cada venta registrada con su medio de pago. La caja del día se arma sola y sabés cuánto vendiste sin esperar al cierre.', uiTitle: 'Caja de hoy', kind: 'kpi', kpis: [{ a: 'Vendido', b: '$ 284.600' }, { a: 'Operaciones', b: '21' }, { a: 'Ticket promedio', b: '$ 13.552' }], para: ['Comercios', 'Gastronomía', 'Servicios técnicos'] },
      { name: 'Stock', tag: 'Base', text: 'Entradas y salidas por producto, variantes como talle o color, y un aviso cuando algo llega al mínimo.', uiTitle: 'Stock', kind: 'levels', rows: [{ a: 'Fundas iPhone 13', b: '78%', c: '#5a4a52', q: '42' }, { a: 'Cargadores originales', b: '18%', c: '#9a5306', q: '8' }, { a: 'Baterías', b: '8%', c: '#9a5306', q: '3' }, { a: 'Vidrios templados', b: '62%', c: '#5a4a52', q: '35' }], para: ['Comercios', 'Distribuidoras', 'Ferreterías'] },
      { name: 'Clientes', tag: 'Base', text: 'Datos de contacto, historial de compras o servicios y notas, para que la información no dependa de la memoria de nadie.', uiTitle: 'Clientes', kind: 'list', rows: [R('Marina G. · 6 visitas', 'Frecuente', ok), R('Diego A. · 2 visitas', 'Nuevo', neu), R('Lucía P. · 11 visitas', 'Frecuente', ok), R('Carla M. · última hace 4 meses', 'Para recontactar', wait)], para: ['Todos los rubros'] },
      { name: 'Turnos y agenda', tag: 'A medida', text: 'La agenda del día y de la semana, con estados y recordatorios listos para mandar por WhatsApp.', uiTitle: 'Agenda · martes', kind: 'list', rows: [R('09:30 · Luna · control', 'Atendido', ok), R('11:00 · Martín R. · corte', 'En espera', wait), R('16:00 · Sofía G. · consulta', 'Confirmado', neu), R('18:00 · Carla M. · color', 'Enviar recordatorio', dark)], para: ['Veterinarias', 'Estética', 'Consultorios'] },
      { name: 'Órdenes de trabajo', tag: 'A medida', text: 'Cada equipo o trabajo con su estado, del ingreso a la entrega, con presupuesto y aviso al cliente cuando está listo.', uiTitle: 'Reparaciones activas', kind: 'list', rows: [R('#0003 · iPhone XR', 'Listo', ok), R('#0004 · iPhone 13 Pro Max', 'En reparación', wait), R('#0007 · Moto G84', 'Esperando repuesto', neu), R('#0010 · Samsung A54', 'Ingresado', neu)], para: ['Servicios técnicos', 'Talleres'] },
      { name: 'Gastos', tag: 'Base', text: 'Gastos fijos y variables por categoría, para ver la ganancia real y no solo lo que entra.', uiTitle: 'Este mes', kind: 'kpi', kpis: [{ a: 'Ingresos', b: '$ 4,1 M' }, { a: 'Gastos', b: '$ 1,6 M' }, { a: 'Ganancia', b: '$ 2,5 M' }], para: ['Todos los rubros'] },
      { name: 'Reportes', tag: 'A medida', text: 'Qué se vende más, qué días se trabaja más y cómo viene el mes, en gráficos simples y exportables a Excel.', uiTitle: 'Ventas por día', kind: 'bars', bars: [40, 62, 48, 75, 58, 92, 35].map((h, k) => ({ h: h + '%', d: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][k], c: k === 5 ? '#8c0f32' : '#e3d9cf' })), para: ['Dueños que quieren decidir con datos'] },
      { name: 'Usuarios y permisos', tag: 'En la nube', text: 'Cada persona entra con su usuario y ve solo lo que le corresponde. Queda registrado quién hizo cada cambio.', uiTitle: 'Usuarios', kind: 'list', rows: [R('Andrea · dueña', 'Acceso total', dark), R('Martín · mostrador', 'Ventas y clientes', neu), R('Sofía · técnica', 'Órdenes de trabajo', neu), R('Contador', 'Solo reportes', neu)], para: ['Equipos', 'Varios locales'] },
      { name: 'Asistente con IA', tag: 'Opcional', text: 'Le preguntás al sistema en palabras simples, como "¿qué producto dejó más ganancia este mes?", y te responde con tus datos.', uiTitle: 'Consulta', kind: 'list', rows: [R('¿Qué vendí más esta semana?', 'Fundas · 38', dark), R('¿Quién no vuelve hace 3 meses?', '12 clientes', neu), R('¿Cuánto gasté en repuestos?', '$ 640.000', neu)], para: ['Sistemas a medida y en la nube'] }
    ];
    var pad = (n) => (n < 10 ? '0' : '') + n;
    var mods = data.map((d, k) => ({ name: d.name, tag: d.tag, num: pad(k + 1), cls: k === s.mod ? 'mod mod-on' : 'mod', sel: k === s.mod ? 'true' : 'false', pick: () => this.setState({ mod: k }) }));
    var d = data[s.mod];
    var cur = { name: d.name, tag: d.tag, num: pad(s.mod + 1), text: d.text, uiTitle: d.uiTitle, isKpi: d.kind === 'kpi', isList: d.kind === 'list', isLevels: d.kind === 'levels', isBars: d.kind === 'bars', kpis: d.kpis || [], rows: d.rows || [], bars: d.bars || [], para: d.para.map((n) => ({ n: n })) };

    var ic = { diag: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4-4', draw: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3', team: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.8c2 .6 3.5 2.4 3.5 5.2', exp: 'M12 3v12M7 10l5 5 5-5M4 19h16', help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.2v.3' };
    var incl = [
      { icon: ic.diag, t: 'Diagnóstico sin cargo', d: 'Entiendo cómo trabaja tu equipo hoy y qué conviene ordenar primero.' },
      { icon: ic.draw, t: 'Diseño según tu negocio', d: 'Pantallas, campos y nombres pensados para tu rubro, no un programa genérico.' },
      { icon: ic.data, t: 'Carga inicial de datos', d: 'Paso tus productos, clientes y precios desde tus planillas o cuadernos.' },
      { icon: ic.team, t: 'Capacitación del equipo', d: 'Al entregar, practicamos juntos con casos reales de tu día a día.' },
      { icon: ic.exp, t: 'Tus datos son tuyos', d: 'Podés exportarlos cuando quieras, por ejemplo para tu contador.' },
      { icon: ic.help, t: 'Acompañamiento', d: 'Un mes de ajustes y consultas después de la entrega, incluido en el precio.' }
    ];
    var stepData = [
      { t: 'Diagnóstico', tag: 'Sin cargo', d: 'Charlamos, presencial o por videollamada, sobre cómo trabajás hoy, qué se pierde y qué te gustaría resolver.' },
      { t: 'Propuesta por escrito', tag: 'Módulos, precio y plazo', d: 'Te paso qué incluye el sistema, el valor final y los tiempos. Se confirma con el 30%.' },
      { t: 'Construcción', tag: 'Con avances', d: 'Armo el sistema y te muestro avances para ajustar a tiempo, antes de la entrega.' },
      { t: 'Carga de datos y capacitación', tag: 'Con tu equipo', d: 'Cargo tu información inicial y capacito a quienes lo van a usar.' },
      { t: 'Puesta en marcha', tag: 'Acompañamiento', d: 'Empezás a usarlo en el día a día y quedo cerca para resolver dudas y ajustes.' }
    ];
    var steps = stepData.map((x, i) => ({ n: pad(i + 1), t: x.t, tag: x.tag, d: x.d, st: 'opacity: clamp(.28, calc(var(--pp) * 5.6 - ' + i + '), 1)' }));

    var glassBtn = 'btn btn-glass', mainBtn = 'btn';
    var plans = [
      { name: 'Sistema base', price: 'USD 300', d: 'Un sistema ya probado, cargado con los datos de tu negocio.', items: [{ t: 'Ventas y caja, stock, clientes y gastos' }, { t: 'Funciona en tu computadora' }, { t: 'Carga inicial de datos' }, { t: 'Capacitación al entregar' }, { t: 'Listo en 3 a 5 días' }], cls: 'glass lift', st: '', lblSt: 'color: var(--fg3)', subSt: 'color: var(--fg2)', chkSt: 'color: var(--acc)', btnCls: glassBtn, btnSt: '', href: this.wa('Hola Andrea, quiero consultar por el sistema base.') },
      { name: 'A medida · el más elegido', price: 'USD 500', d: 'La base más los módulos y cambios que necesita tu forma de trabajar.', items: [{ t: 'Todo lo del sistema base' }, { t: 'Módulos de tu rubro: turnos, órdenes, reportes' }, { t: 'Campos y pantallas a tu medida' }, { t: 'Tu logo y tus colores' }, { t: 'Listo en 1 a 2 semanas' }], cls: 'lift', st: 'background: var(--hl); color: #fff; box-shadow: 0 30px 60px rgba(140,15,50,.4)', lblSt: 'color: #ffe1c7', subSt: 'color: #ffe8ec', chkSt: 'color: #fff', btnCls: mainBtn, btnSt: 'background: #f7f5f2; color: #5d0f22', href: this.wa('Hola Andrea, quiero consultar por un sistema a medida.') },
      { name: 'En la nube', price: 'USD 800', d: 'Acceso desde cualquier dispositivo, con usuarios y seguridad para varios locales o equipos.', items: [{ t: 'Todo lo del sistema a medida' }, { t: 'Desde la computadora, la tablet o el celular' }, { t: 'Usuarios con permisos y registro de cambios' }, { t: 'Listo en 3 a 6 semanas' }], cls: 'glass lift', st: '', lblSt: 'color: var(--fg3)', subSt: 'color: var(--fg2)', chkSt: 'color: var(--acc)', btnCls: glassBtn, btnSt: '', href: this.wa('Hola Andrea, quiero consultar por un sistema en la nube.') }
    ];
    var faqs = [
      { q: '¿Puedo sumar módulos más adelante?', a: 'Sí. Podés arrancar con lo esencial y agregar módulos cuando tu negocio lo pida.' },
      { q: '¿Qué pasa con mis datos?', a: 'Son tuyos. El sistema permite exportarlos cuando quieras.' },
      { q: '¿Cuánto tarda en estar listo?', a: 'Sistema base: 3 a 5 días. A medida: 1 a 2 semanas. En la nube: 3 a 6 semanas. Te confirmo el plazo por escrito en la propuesta.' },
      { q: '¿Lo puedo usar desde el celular?', a: 'El sistema en la nube funciona desde la computadora, la tablet o el celular. El sistema base funciona en tu computadora.' },
      { q: '¿Hay un pago mensual?', a: 'Sí. Todos los sistemas tienen un mantenimiento mensual, que incluye los costos de servidor. El consumo de APIs y de la IA integrada se cobra aparte, según el uso.' },
      { q: '¿Qué pasa después de la entrega?', a: 'Tenés un mes de acompañamiento incluido para ajustes y consultas. Después sigue el mantenimiento mensual.' },
      { q: '¿Mi equipo va a saber usarlo?', a: 'Sí. Está pensado para el día a día y al entregar hago una capacitación con tu equipo.' }
    ];
    var rub = ['Cafeterías', 'Restaurantes', 'Bares', 'Panaderías', 'Barberías', 'Peluquerías', 'Centros de estética', 'Veterinarias', 'Pet shops', 'Servicios técnicos', 'Talleres mecánicos', 'Comercios', 'Ferreterías', 'Ópticas', 'Indumentaria', 'Distribuidoras', 'Inmobiliarias', 'Consultorios', 'Estudios contables', 'Gimnasios', 'Hoteles', 'Profesionales'];
    return {
      themeCls: 'theme-dark', bgCanvas: this.bgRef, procRef: this.procRef,
      tiltTf: 'perspective(1400px) rotateX(' + s.rx.toFixed(2) + 'deg) rotateY(' + s.ry.toFixed(2) + 'deg)',
      onTilt: (e) => { var r = e.currentTarget.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width - 0.5; var y = (e.clientY - r.top) / r.height - 0.5; this.setState({ rx: -y * 5, ry: x * 7 }); },
      offTilt: () => this.setState({ rx: 0, ry: 0 }),
      mods: mods, cur: cur, incl: incl, steps: steps, plans: plans, faqs: faqs,
      rubros: rub.join('  ·  ') + '  ·',
      waGeneral: this.wa('Hola Andrea, quiero consultar por un sistema de gestión para mi negocio.'),
      waDemo: this.wa('Hola Andrea, quiero solicitar una demo del sistema de gestión. Mi negocio es:'),
      waHero: this.wa('Hola Andrea, quiero un sistema de gestión para mi negocio. Te cuento cómo trabajamos hoy:')
    };
  }
}
function tpl(v) {
  const { themeCls, bgCanvas, waGeneral, waHero, waDemo, onTilt, offTilt, tiltTf, mods, m, cur, k, r, b, x, incl, c, procRef, steps, p, plans, pl, it, faqs, f, rubros } = v;
  return html`<div class="${themeCls}">
<div class="page">
<canvas class="bgfx" ref="${bgCanvas}" aria-hidden="true"></canvas>

<div class="content">

<header style="position: sticky; top: 16px; z-index: 50; padding-top: 16px">
<div class="wrap">
<div class="glass" style="border-radius: 999px; height: 66px; padding: 0 10px 0 22px; display: flex; align-items: center; justify-content: space-between">
<a href="/" style="text-decoration: none; color: var(--fg); display: flex; align-items: center; gap: 12px">
<span style="width: 28px; height: 28px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 3px"><span style="border-radius: 3px; background: #d4c8bc"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #5d0f22"></span></span>
<span style="display: flex; flex-direction: column; line-height: 1.1"><span class="t" style="font-size: 16px">VON AI Studio</span><span class="lbl" style="font-size: 8px">Soluciones digitales</span></span>
</a>
<nav class="nav-links" aria-label="Principal" style="display: flex; gap: 2px">
<a class="nav-link" href="/">Inicio</a>
<a class="nav-link" href="#modulos">Módulos</a>
<a class="nav-link" href="#proceso">Cómo trabajo</a>
<a class="nav-link" href="#precios">Precios</a>
<a class="nav-link" href="#preguntas">Preguntas</a>
</nav>
<a class="btn btn-main" href="${waGeneral}" style="min-height: 46px; padding: 0 20px">Hablemos</a>
</div>
</div>
</header>

<section id="inicio" class="band" style="position: relative; padding: 70px 0 120px">
<div class="wrap">
<nav class="lbl" aria-label="Ruta" style="font-size: 10px; display: flex; gap: 10px; flex-wrap: wrap"><a href="/" style="color: var(--fg3); text-decoration: none">Inicio</a><span>/</span><span>Servicios</span><span>/</span><span style="color: var(--fg)">Sistemas de gestión en Salta</span></nav>
</div>
<div class="wrap hero-grid" style="margin-top: 36px">
<div class="rise">
<span class="glass-2 lbl" style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 999px; color: #c4bec1; font-size: 11px"><span class="live" style="width: 7px; height: 7px; border-radius: 50%; background: #2fe08f"></span>Salta, Argentina · presencial y remoto</span>
<h1 class="t h1" style="margin: 26px 0 0; font-size: 58px; line-height: 1.05">Sistemas de gestión <span class="acc">a medida</span> en Salta</h1>
<p style="margin: 24px 0 0; font-size: 19px; line-height: 1.6; color: var(--fg2); max-width: 520px">Para comercios, servicios técnicos, gastronomía y profesionales que hoy se organizan con cuadernos, planillas o mensajes sueltos. Ventas, stock, turnos y clientes en un solo lugar, pensado para cómo trabaja tu negocio.</p>
<div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px">
<a class="btn btn-main" href="${waHero}">Quiero un sistema para mi negocio</a>
<a class="btn btn-glass" href="${waDemo}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4M10.5 8.2v3.6L13.6 10z"></path></svg>Solicitar demo</a>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 22px; margin-top: 30px">
<div><div class="lbl" style="font-size: 9px">Precio</div><div class="t" style="font-size: 20px; margin-top: 4px">Desde USD 300</div></div>
<div style="width: 1px; background: var(--line)"></div>
<div><div class="lbl" style="font-size: 9px">Diagnóstico</div><div class="t" style="font-size: 20px; margin-top: 4px">Sin cargo</div></div>
<div style="width: 1px; background: var(--line)"></div>
<div><div class="lbl" style="font-size: 9px">Modalidad</div><div class="t" style="font-size: 20px; margin-top: 4px">Presencial o remoto</div></div>
</div>
</div>
<div class="hero-shot" onPointerMove="${onTilt}" onPointerLeave="${offTilt}" style="transform: ${tiltTf}">
<div class="glass" style="padding: 12px; border-radius: 30px">
<img src="/img/sistema-von-ai-studio.webp" width="1440" height="800" fetchpriority="high" alt="Panel del sistema de gestión de VON AI Studio: cobros del mes, prospectos, gastos y tareas del día" style="width: 100%; height: auto; display: block; border-radius: 20px" />
</div>
<div class="glass float-a" style="position: absolute; left: -34px; bottom: 54px; padding: 14px 18px; border-radius: 20px; display: flex; align-items: center; gap: 12px">
<span style="width: 38px; height: 38px; border-radius: 50%; background: var(--warnbg); color: var(--warn); display: flex; align-items: center; justify-content: center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg></span>
<div><div class="lbl" style="font-size: 8px">Aviso automático</div><div class="t" style="font-size: 15px; margin-top: 2px">2 tareas atrasadas</div></div>
</div>
<div class="glass float-b" style="position: absolute; right: -26px; top: -26px; padding: 14px 18px; border-radius: 20px; display: flex; align-items: center; gap: 12px">
<span style="width: 38px; height: 38px; border-radius: 50%; background: var(--okbg); color: var(--ok); display: flex; align-items: center; justify-content: center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>
<div><div class="lbl" style="font-size: 8px">CRM</div><div class="t" style="font-size: 15px; margin-top: 2px">Prospecto nuevo cargado</div></div>
</div>
</div>
</div>
</section>

<section class="band" style="padding: 40px 0 120px">
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

<section class="band" id="modulos" style="padding: 40px 0 130px">
<div class="wrap">
<div class="rise" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 24px">
<div><div class="lbl acc">Módulos</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">Elegí lo que necesita tu negocio</h2></div>
<p style="margin: 0; max-width: 440px; font-size: 17px; line-height: 1.6; color: var(--fg2)">Tocá cada módulo para ver qué hace. Arrancás con los que usás hoy y sumás otros cuando los necesites.</p>
</div>
<div class="mx" style="margin-top: 40px">
<div class="glass" style="padding: 12px; border-radius: 32px; display: grid; gap: 6px; align-content: start">
${(mods).map((m) => html`
<button type="button" class="${m.cls}" aria-pressed="${m.sel}" onClick="${m.pick}"><span style="display: flex; align-items: center; gap: 14px"><span style="font-size: 11px; opacity: .6">${m.num}</span>${m.name}</span><span style="font-size: 11px; opacity: .7">${m.tag}</span></button>
`)}
</div>
<div class="glass" style="padding: 34px; border-radius: 32px; display: flex; flex-direction: column">
<div class="pop-in" style="display: flex; flex-direction: column; height: 100%">
<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap">
<div><div class="lbl acc">${cur.num} · ${cur.tag}</div><h3 class="t" style="margin: 12px 0 0; font-size: 34px; line-height: 1.1">${cur.name}</h3></div>
</div>
<p style="margin: 16px 0 0; font-size: 17px; line-height: 1.6; color: var(--fg2); max-width: 560px">${cur.text}</p>
<div style="margin-top: 22px; background: #f7f4f0; color: #1c1216; border-radius: 20px; padding: 18px">
<div class="lbl" style="font-size: 8px; color: #6b5a62">${cur.uiTitle}</div>
${(cur.isKpi) ? html`<div style="display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; margin-top: 12px">${(cur.kpis).map((k) => html`<div style="background: #fff; border-radius: 14px; padding: 14px"><div class="lbl" style="font-size: 8px; color: #6b5a62">${k.a}</div><div class="t" style="font-size: 22px; margin-top: 6px">${k.b}</div></div>`)}</div>` : null}
${(cur.isList) ? html`<div style="background: #fff; border-radius: 14px; margin-top: 12px; font-size: 14px">${(cur.rows).map((r) => html`<div class="row-in" style="display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f1ebe4"><span>${r.a}</span><span class="chip" style="background: ${r.bg}; color: ${r.c}">${r.b}</span></div>`)}</div>` : null}
${(cur.isLevels) ? html`<div style="background: #fff; border-radius: 14px; margin-top: 12px; padding: 14px 16px; display: grid; gap: 12px; font-size: 14px">${(cur.rows).map((r) => html`<div style="display: grid; grid-template-columns: minmax(0,1fr) 140px 46px; gap: 12px; align-items: center"><span>${r.a}</span><span style="height: 8px; border-radius: 999px; background: #efe8e0; overflow: hidden"><span class="lvl" style="display: block; height: 100%; width: ${r.b}; background: ${r.c}"></span></span><span class="t" style="font-size: 13px; text-align: right; color: ${r.c}">${r.q}</span></div>`)}</div>` : null}
${(cur.isBars) ? html`<div style="background: #fff; border-radius: 14px; margin-top: 12px; padding: 16px; display: flex; align-items: flex-end; gap: 10px; height: 170px">${(cur.bars).map((b) => html`<div style="flex-grow: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px"><div class="bar" style="width: 100%; border-radius: 999px; background: ${b.c}; height: ${b.h}"></div><span class="lbl" style="font-size: 8px; letter-spacing: .06em; color: #6b5a62">${b.d}</span></div>`)}</div>` : null}
</div>
<div style="margin-top: auto; padding-top: 22px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center"><span class="lbl" style="font-size: 9px; margin-right: 6px">Ideal para</span>${(cur.para).map((x) => html`<span class="pill" style="min-height: 34px; padding: 0 14px; font-size: 12px; cursor: default">${x.n}</span>`)}</div>
</div>
</div>
</div>
<div class="glass" style="margin-top: 20px; padding: 22px 26px; border-radius: 26px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px">
<div><div class="t" style="font-size: 20px">¿Querés verlo funcionando?</div><p style="margin: 6px 0 0; font-size: 15px; line-height: 1.5; color: var(--fg2)">Te muestro un sistema en vivo, con datos de ejemplo de tu rubro, presencial o por videollamada.</p></div>
<a class="btn btn-main" href="${waDemo}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4M10.5 8.2v3.6L13.6 10z"></path></svg>Solicitar demo</a>
</div>
</div>
</section>

<section class="band" style="padding: 40px 0 130px">
<div class="wrap">
<div class="rise" style="text-align: center"><div class="lbl acc">Qué incluye</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">No es solo el sistema</h2><p style="margin: 16px auto 0; font-size: 17px; line-height: 1.6; color: var(--fg2); max-width: 600px">Te acompaño desde el análisis hasta que tu equipo lo usa solo.</p></div>
<div class="g3" style="margin-top: 44px">
${(incl).map((c) => html`
<div class="glass lift rise" style="padding: 30px; border-radius: 28px">
<span style="width: 50px; height: 50px; border-radius: 50%; background: var(--glass2); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${c.icon}"></path></svg></span>
<h3 class="t" style="margin: 18px 0 0; font-size: 21px">${c.t}</h3>
<p style="margin: 10px 0 0; font-size: 15px; line-height: 1.6; color: var(--fg2)">${c.d}</p>
</div>
`)}
</div>
</div>
</section>

<section class="band" id="proceso" ref="${procRef}" style="padding: 40px 0 140px">
<div class="wrap" style="max-width: 980px">
<div class="rise"><div class="lbl acc">Cómo trabajo</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">De la primera charla al sistema funcionando</h2></div>
<div class="proc" style="margin-top: 56px">
<div class="proc-rail" aria-hidden="true"><div class="proc-fill"></div></div>
${(steps).map((p) => html`
<div class="proc-step" style="position: relative; ${p.st}">
<span class="proc-dot t">${p.n}</span>
<div class="glass" style="padding: 26px 30px; border-radius: 26px">
<div style="display: flex; justify-content: space-between; gap: 14px; flex-wrap: wrap; align-items: baseline"><h3 class="t" style="margin: 0; font-size: 23px">${p.t}</h3><span class="lbl acc" style="font-size: 10px">${p.tag}</span></div>
<p style="margin: 10px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">${p.d}</p>
</div>
</div>
`)}
</div>
</div>
</section>

<section class="band" id="caso" style="padding: 40px 0 130px">
<div class="wrap">
<div class="rise" style="max-width: 720px"><div class="lbl acc">Casos reales</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 44px; line-height: 1.1">Primero los construí para mis propios negocios</h2><p style="margin: 18px 0 0; font-size: 17px; line-height: 1.6; color: var(--fg2)">Los uso todos los días. Lo que aprendí ordenando mis negocios es lo que aplico en el tuyo.</p></div>
<div class="two-col" style="margin-top: 40px; align-items: stretch; gap: 18px">
<div class="glass lift rise" style="padding: 32px; border-radius: 28px">
<div class="lbl acc" style="font-size: 10px">Servicio técnico</div>
<h3 class="t" style="margin: 12px 0 0; font-size: 26px; line-height: 1.15">Apple Service Salta</h3>
<p style="margin: 12px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">Operaba con cuadernos y planillas sueltas. Hoy ventas, stock, reparaciones, clientes y caja viven en un solo sistema.</p>
<div style="display: grid; gap: 10px; margin-top: 20px"><div style="display: flex; gap: 12px; align-items: center; font-size: 15px"><span style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--okbg); color: var(--ok); display: flex; align-items: center; justify-content: center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>Cada reparación con su estado, del ingreso a la entrega</div><div style="display: flex; gap: 12px; align-items: center; font-size: 15px"><span style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--okbg); color: var(--ok); display: flex; align-items: center; justify-content: center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>Aviso de stock crítico por modelo y color</div><div style="display: flex; gap: 12px; align-items: center; font-size: 15px"><span style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--okbg); color: var(--ok); display: flex; align-items: center; justify-content: center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>Ingresos, gastos y ganancia del día, la semana o el mes</div></div>
</div>
<div class="glass lift rise" style="padding: 32px; border-radius: 28px">
<div class="lbl acc" style="font-size: 10px">Estudio de servicios</div>
<h3 class="t" style="margin: 12px 0 0; font-size: 26px; line-height: 1.15">VON AI Studio</h3>
<p style="margin: 12px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">El sistema con el que manejo mi estudio: el de la imagen de arriba. Cobros, clientes, prospección y tareas en un solo lugar.</p>
<div style="display: grid; gap: 10px; margin-top: 20px"><div style="display: flex; gap: 12px; align-items: center; font-size: 15px"><span style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--okbg); color: var(--ok); display: flex; align-items: center; justify-content: center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>Cobros pendientes y vencidos del mes</div><div style="display: flex; gap: 12px; align-items: center; font-size: 15px"><span style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--okbg); color: var(--ok); display: flex; align-items: center; justify-content: center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>CRM y seguimiento de prospectos</div><div style="display: flex; gap: 12px; align-items: center; font-size: 15px"><span style="width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--okbg); color: var(--ok); display: flex; align-items: center; justify-content: center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></span>Tareas y calendario con avisos de atraso</div></div>
</div>
</div>
</div>
</section>

<section class="band" id="precios" style="padding: 40px 0 120px">
<div class="wrap">
<div class="rise" style="text-align: center"><div class="lbl acc">Precios de referencia</div><h2 class="t h2" style="margin: 14px 0 0; font-size: 46px; line-height: 1.1">Tres formas de empezar</h2><p style="margin: 16px auto 0; font-size: 17px; line-height: 1.6; color: var(--fg2); max-width: 600px">El valor final sale del diagnóstico, según los módulos y la cantidad de usuarios. Todos los sistemas tienen un mantenimiento mensual.</p></div>
<div class="g3" style="margin-top: 44px; align-items: stretch">
${(plans).map((pl) => html`
<div class="${pl.cls}" style="padding: 34px; border-radius: 30px; display: flex; flex-direction: column; ${pl.st}">
<span class="lbl" style="font-size: 11px; ${pl.lblSt}">${pl.name}</span>
<div class="t" style="font-size: 42px; margin-top: 18px"><span style="font-size: 16px; font-weight: 500; letter-spacing: 0; ${pl.subSt}">Desde</span> ${pl.price}</div>
<p style="margin: 12px 0 0; font-size: 16px; line-height: 1.6; ${pl.subSt}">${pl.d}</p>
<div style="display: grid; gap: 10px; margin: 22px 0 26px; font-size: 15px">
${(pl.items).map((it) => html`<div style="display: flex; gap: 10px; align-items: flex-start"><span aria-hidden="true" style="${pl.chkSt}">✓</span><span>${it.t}</span></div>`)}
</div>
<a class="${pl.btnCls}" href="${pl.href}" style="margin-top: auto; ${pl.btnSt}">Consultar por este</a>
</div>
`)}
</div>
</div>
</section>

<section class="band" id="preguntas" style="padding: 20px 0 120px">
<div class="wrap" style="max-width: 880px">
<div class="lbl acc">Preguntas frecuentes</div>
<h2 class="t h2" style="margin: 14px 0 26px; font-size: 40px; line-height: 1.1">Sobre los sistemas de gestión</h2>
<div style="display: grid; gap: 10px">
${(faqs).map((f) => html`
<details class="glass" style="padding: 22px 26px; border-radius: 24px"><summary style="display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 17px">${f.q}<span class="plus" style="width: 32px; height: 32px; flex-shrink: 0; border-radius: 50%; border: 1px solid var(--line2); display: flex; align-items: center; justify-content: center">+</span></summary><p style="margin: 12px 0 0; font-size: 16px; line-height: 1.6; color: var(--fg2)">${f.a}</p></details>
`)}
</div>
</div>
</section>

<section class="band " id="contacto" style="padding: 100px 0 90px">
<div class="wrap">
<div class="lbl">Contame cómo trabajás hoy y te digo qué sistema te conviene</div>
<a class="cta-link" href="${waGeneral}" style="display: inline-block; margin-top: 20px; font-size: 180px">Hablemos.</a>
</div>
</section>

<section class="band " aria-label="Rubros con los que trabajo" style="padding: 26px 0; border-top: 1px solid var(--line); overflow: clip">
<div style="display: flex; align-items: center; gap: 28px">
<span class="lbl" style="flex-shrink: 0; padding-left: 32px; font-size: 10px">Trabajo con</span>
<div style="overflow: clip; flex-grow: 1; min-width: 0; -webkit-mask-image: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent); mask-image: linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)">
<div class="rub"><span>${rubros}</span><span aria-hidden="true">${rubros}</span></div>
</div>
</div>
</section>

<footer class="band " style="border-top: 1px solid var(--line); padding: 56px 0 40px">
<div class="wrap">
<div class="foot-grid">
<div>
<div style="display: flex; align-items: center; gap: 12px"><span style="width: 28px; height: 28px; display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 3px"><span style="border-radius: 3px; background: #d4c8bc"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #a08c7c"></span><span style="border-radius: 3px; background: #5d0f22"></span></span><span class="t" style="font-size: 18px">VON AI Studio</span></div>
<p style="margin: 14px 0 0; font-size: 15px; line-height: 1.6; color: var(--fg2); max-width: 320px">Sistemas de gestión a medida y automatización con IA para pymes de Salta.</p>
<a class="btn btn-main" href="${waGeneral}" style="margin-top: 20px; min-height: 46px">Escribime por WhatsApp</a>
</div>
<div><div class="lbl" style="margin-bottom: 12px">Servicios</div><a class="foot-link" href="#inicio">Sistemas de gestión</a><a class="foot-link" href="/#asistente">Automatizaciones</a><a class="foot-link" href="/#ficha">Perfil de Google</a><a class="foot-link" href="/#servicios">Sitios web</a></div>
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

/**
 * Charcutería Norato — Motor de Brasa y Fuego
 * v8 — Llamas orgánicas irregulares con ciclos de vida independientes
 *
 * Técnicas:
 *  • Lecho de brasas/carbón con formas irregulares y pulso térmico
 *  • Grietas incandescentes entre carbones
 *  • Llamas orgánicas: alturas dramáticamente variadas, orígenes Y distribuidos,
 *    clustering en X, ciclos de vida independientes (aparecer/arder/apagarse)
 *  • Resplandor ambiental cálido desde las brasas
 *  • Humo sutil que nace cerca de las llamas activas
 *  • Chispas flotantes
 *  • Velocidad global al 50%
 */
(function () {
  'use strict';

  var canvas = document.getElementById('fire-smoke-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* ─── Configuración global ─── */
  var SPEED = 0.5;
  var width = 0, height = 0, dpr = 1;
  var isMobile = false;

  /* ─── Noise simplificado ─── */
  var perm = new Uint8Array(512);
  (function () {
    var p = [];
    for (var i = 0; i < 256; i++) p[i] = i;
    for (var i = 255; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    for (var i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad1d(hash, x) { return (hash & 1) === 0 ? x : -x; }

  function noise1d(x) {
    var xi = Math.floor(x) & 255;
    var xf = x - Math.floor(x);
    var u = fade(xf);
    return lerp(grad1d(perm[xi], xf), grad1d(perm[xi + 1], xf - 1), u);
  }

  function turbulence(x, octaves) {
    var val = 0, amp = 1, freq = 1, max = 0;
    for (var i = 0; i < octaves; i++) {
      val += noise1d(x * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / max;
  }

  /* ─── Resize ─── */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth || 1280;
    height = window.innerHeight || 800;
    isMobile = width < 768;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    buildEmberBed();
    buildFlamePoints();
  }

  /* ═══════════════════════════════════════════════════════
     1. LECHO DE BRASAS / CARBÓN — Piezas irregulares
     ═══════════════════════════════════════════════════════ */
  var coals = [];

  function buildEmberBed() {
    coals.length = 0;
    // Zona de brasas ocupa la franja inferior (~22% de la pantalla)
    var bedTop = height * 0.78;
    var bedH = height - bedTop;
    var count = isMobile ? 55 : 110;

    for (var i = 0; i < count; i++) {
      var cx = Math.random() * (width + 60) - 30;
      var cy = bedTop + Math.random() * bedH;
      // Poner más densidad abajo
      cy = bedTop + Math.pow(Math.random(), 0.6) * bedH;
      var size = Math.random() * 28 + 12;
      // Los carbones más abajo son más grandes
      var depthFactor = (cy - bedTop) / bedH;
      size *= (0.7 + depthFactor * 0.8);

      coals.push({
        x: cx,
        y: cy,
        w: size * (0.8 + Math.random() * 0.6),
        h: size * (0.5 + Math.random() * 0.4),
        rot: Math.random() * Math.PI * 2,
        // Cada carbón tiene su propio ciclo de pulso térmico
        phase: Math.random() * Math.PI * 2,
        freq: 0.0008 + Math.random() * 0.0015,
        // Intensidad base (0 = apagado/oscuro, 1 = muy caliente)
        heat: 0.15 + Math.random() * 0.85,
        // Tipo de color
        hue: Math.random(), // 0 = rojo oscuro, 1 = naranja brillante
        // Forma del carbón (puntos de deformación)
        deform: []
      });
      // Generar forma irregular con 6-8 puntos
      var pts = 6 + Math.floor(Math.random() * 3);
      var c = coals[coals.length - 1];
      for (var j = 0; j < pts; j++) {
        var angle = (j / pts) * Math.PI * 2;
        var rr = 0.7 + Math.random() * 0.6; // radio relativo
        c.deform.push({ a: angle, r: rr });
      }
    }
  }

  function drawCoal(coal, time) {
    var pulse = Math.sin(time * coal.freq + coal.phase) * 0.3 +
                Math.sin(time * coal.freq * 2.3 + coal.phase + 1.5) * 0.15 + 0.55;
    var heat = coal.heat * pulse;
    if (heat < 0.05) return;

    ctx.save();
    ctx.translate(coal.x, coal.y);
    ctx.rotate(coal.rot);

    // Dibujar forma irregular del carbón
    ctx.beginPath();
    var pts = coal.deform;
    for (var i = 0; i < pts.length; i++) {
      var px = Math.cos(pts[i].a) * pts[i].r * coal.w * 0.5;
      var py = Math.sin(pts[i].a) * pts[i].r * coal.h * 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else {
        // Usar cuadráticas para bordes redondeados
        var prev = pts[(i - 1 + pts.length) % pts.length];
        var cpx = Math.cos((pts[i].a + prev.a) * 0.5) * (pts[i].r + prev.r) * 0.5 * coal.w * 0.45;
        var cpy = Math.sin((pts[i].a + prev.a) * 0.5) * (pts[i].r + prev.r) * 0.5 * coal.h * 0.45;
        ctx.quadraticCurveTo(cpx, cpy, px, py);
      }
    }
    ctx.closePath();

    // Color del carbón: mezcla entre negro (apagado) y rojo/naranja (caliente)
    var r, g, b;
    if (coal.hue < 0.4) {
      // Rojo profundo
      r = Math.floor(40 + heat * 180);
      g = Math.floor(8 + heat * 35);
      b = Math.floor(5 + heat * 10);
    } else if (coal.hue < 0.75) {
      // Naranja cálido
      r = Math.floor(50 + heat * 205);
      g = Math.floor(12 + heat * 90);
      b = Math.floor(3 + heat * 15);
    } else {
      // Amarillo/blanco muy caliente
      r = Math.floor(60 + heat * 195);
      g = Math.floor(20 + heat * 140);
      b = Math.floor(5 + heat * 50);
    }

    // Cuerpo oscuro del carbón con brillo interno
    var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(coal.w, coal.h) * 0.5);
    grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.8 + heat * 0.2).toFixed(3) + ')');
    grad.addColorStop(0.5, 'rgba(' + Math.floor(r * 0.6) + ',' + Math.floor(g * 0.5) + ',' + Math.floor(b * 0.4) + ',' + (0.7 + heat * 0.15).toFixed(3) + ')');
    grad.addColorStop(0.85, 'rgba(' + Math.floor(r * 0.25) + ',' + Math.floor(g * 0.2) + ',' + Math.floor(b * 0.15) + ',0.85)');
    grad.addColorStop(1, 'rgba(15,8,5,0.9)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Glow/resplandor alrededor del carbón caliente
    if (heat > 0.35) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var glowSize = Math.max(coal.w, coal.h) * (0.8 + heat * 0.7);
      var gg = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
      gg.addColorStop(0, 'rgba(' + Math.min(255, r + 30) + ',' + Math.min(255, g + 20) + ',' + Math.min(255, b + 10) + ',' + (heat * 0.35).toFixed(3) + ')');
      gg.addColorStop(0.4, 'rgba(' + r + ',' + g + ',' + b + ',' + (heat * 0.15).toFixed(3) + ')');
      gg.addColorStop(1, 'rgba(' + Math.floor(r * 0.3) + ',0,0,0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════
     2. GRIETAS INCANDESCENTES — entre carbones
     ═══════════════════════════════════════════════════════ */
  function drawCracks(time) {
    var bedTop = height * 0.78;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var crackCount = isMobile ? 18 : 40;

    for (var i = 0; i < crackCount; i++) {
      var seed = i * 137.5;
      var x1 = ((seed * 7.31) % width);
      var y1 = bedTop + ((seed * 3.17) % (height - bedTop)) * 0.9;
      var len = 15 + (seed % 45);
      var angle = ((seed * 2.73) % Math.PI) - Math.PI * 0.5;

      var pulse = Math.sin(time * (0.001 + (seed % 5) * 0.0004) + seed) * 0.3 + 0.5;
      if (pulse < 0.15) { continue; }

      var x2 = x1 + Math.cos(angle) * len;
      var y2 = y1 + Math.sin(angle) * len * 0.5;

      // Glow de la grieta
      ctx.strokeStyle = 'rgba(255,' + Math.floor(80 + pulse * 100) + ',' + Math.floor(10 + pulse * 30) + ',' + (pulse * 0.6).toFixed(3) + ')';
      ctx.lineWidth = 1.5 + pulse * 2.5;
      ctx.shadowColor = 'rgba(255,100,20,' + (pulse * 0.4).toFixed(3) + ')';
      ctx.shadowBlur = 8 + pulse * 12;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      // Grieta con un quiebre intermedio
      var mx = (x1 + x2) * 0.5 + ((seed * 1.37) % 12 - 6);
      var my = (y1 + y2) * 0.5 + ((seed * 0.83) % 8 - 4);
      ctx.lineTo(mx, my);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════
     3. LLAMAS ORGÁNICAS — Irregulares con ciclos de vida
     ═══════════════════════════════════════════════════════ */
  var flamePoints = [];

  /**
   * Genera clusters de puntos de llama con distribución no uniforme.
   * Cada punto de llama tiene posición Y variable, tamaño diferenciado,
   * y un ciclo de vida independiente.
   */
  function buildFlamePoints() {
    flamePoints.length = 0;
    var totalCount = isMobile ? 20 : 38;

    // --- Generar posiciones X agrupadas en clusters ---
    // Crear 4-7 "hot spots" (centros de cluster) distribuidos por el ancho
    var numClusters = isMobile ? 4 : 7;
    var clusterCenters = [];
    for (var c = 0; c < numClusters; c++) {
      clusterCenters.push(width * 0.08 + Math.random() * width * 0.84);
    }

    // Decidir cuántas llamas hero (grandes), medianas y pequeñas
    var numLarge = isMobile ? 2 : 4;
    var numMedium = Math.floor(totalCount * 0.45);
    var numSmall = totalCount - numLarge - numMedium;

    var sizeList = [];
    for (var i = 0; i < numLarge; i++) sizeList.push('large');
    for (var i = 0; i < numMedium; i++) sizeList.push('medium');
    for (var i = 0; i < numSmall; i++) sizeList.push('small');

    // Mezclar el array para distribución aleatoria
    for (var i = sizeList.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = sizeList[i]; sizeList[i] = sizeList[j]; sizeList[j] = tmp;
    }

    for (var i = 0; i < totalCount; i++) {
      var sizeClass = sizeList[i];

      // Elegir un cluster center al azar y dispersar alrededor
      var cluster = clusterCenters[Math.floor(Math.random() * numClusters)];
      var spread = isMobile ? 70 : 100;
      var fx = cluster + (Math.random() - 0.5) * spread * 2;
      // Mantener dentro de pantalla con margen
      fx = Math.max(15, Math.min(width - 15, fx));

      // baseY variable entre 74% y 95% del alto de pantalla
      var baseY = height * 0.74 + Math.random() * height * 0.22;

      // Alturas según clase de tamaño (más fuego y más presencia)
      var maxH, baseW;
      if (sizeClass === 'large') {
        maxH = 220 + Math.random() * 90;  // 220-310px
        baseW = 34 + Math.random() * 22;
        baseY = height * 0.76 + Math.random() * height * 0.12;
      } else if (sizeClass === 'medium') {
        maxH = 85 + Math.random() * 65;   // 85-150px
        baseW = 22 + Math.random() * 16;
      } else {
        maxH = 32 + Math.random() * 26;   // 32-58px
        baseW = 12 + Math.random() * 12;
      }

      // Frecuencias de oscilación: pequeñas rápidas, grandes lentas y majestuosas
      var speedMul = sizeClass === 'small' ? 2.5 : (sizeClass === 'large' ? 0.4 : 1.0);

      flamePoints.push({
        x: fx,
        baseY: baseY,
        baseW: baseW,
        maxH: maxH,
        sizeClass: sizeClass,
        // Frecuencias de movimiento
        f1: (0.010 + Math.random() * 0.014) * speedMul,
        f2: (0.028 + Math.random() * 0.03) * speedMul,
        f3: (0.003 + Math.random() * 0.003) * speedMul,
        f4: (0.045 + Math.random() * 0.05) * speedMul,
        p1: Math.random() * Math.PI * 2,
        p2: Math.random() * Math.PI * 2,
        p3: Math.random() * Math.PI * 2,
        p4: Math.random() * Math.PI * 2,
        noiseSeed: Math.random() * 1000,
        // --- Ciclo de vida independiente ---
        // Mayor probabilidad de arrancar ardiendo para tener presencia continua
        state: Math.random() < 0.75 ? 'burning' : 'dormant',
        lifeAlpha: Math.random() < 0.75 ? (0.6 + Math.random() * 0.4) : 0.0,
        burnDuration: 0,
        burnTimer: 0,
        dormantDuration: 0,
        dormantTimer: 0,
        fadeSpeed: 0
      });

      var fp = flamePoints[flamePoints.length - 1];
      resetLifecycleTimers(fp);
    }
  }

  /**
   * Resetea los timers del ciclo de vida de una llama.
   * Más tiempo encendidas y menos tiempo dormidas para más fuego constante.
   */
  function resetLifecycleTimers(fp) {
    if (fp.sizeClass === 'small') {
      fp.burnDuration = 140 + Math.random() * 280;
      fp.dormantDuration = 35 + Math.random() * 70;
      fp.fadeSpeed = 0.04 + Math.random() * 0.04;
    } else if (fp.sizeClass === 'large') {
      fp.burnDuration = 600 + Math.random() * 900;
      fp.dormantDuration = 80 + Math.random() * 180;
      fp.fadeSpeed = 0.008 + Math.random() * 0.012;
    } else {
      fp.burnDuration = 260 + Math.random() * 500;
      fp.dormantDuration = 45 + Math.random() * 110;
      fp.fadeSpeed = 0.02 + Math.random() * 0.025;
    }
    fp.burnTimer = 0;
    fp.dormantTimer = 0;
  }

  /**
   * Actualiza el ciclo de vida de cada llama:
   *   burning → fading → dormant → igniting → burning ...
   */
  function updateFlameLifecycles(dt) {
    for (var i = 0; i < flamePoints.length; i++) {
      var fp = flamePoints[i];

      if (fp.state === 'burning') {
        fp.lifeAlpha = Math.min(1.0, fp.lifeAlpha + fp.fadeSpeed * dt);
        fp.burnTimer += dt;
        if (fp.burnTimer >= fp.burnDuration) {
          fp.state = 'fading';
        }
      } else if (fp.state === 'fading') {
        fp.lifeAlpha -= fp.fadeSpeed * dt;
        if (fp.lifeAlpha <= 0) {
          fp.lifeAlpha = 0;
          fp.state = 'dormant';
          fp.dormantTimer = 0;
          // Re-roll dormant duration
          if (fp.sizeClass === 'small') {
            fp.dormantDuration = 60 + Math.random() * 180;
          } else if (fp.sizeClass === 'large') {
            fp.dormantDuration = 200 + Math.random() * 500;
          } else {
            fp.dormantDuration = 100 + Math.random() * 300;
          }
        }
      } else if (fp.state === 'dormant') {
        fp.dormantTimer += dt;
        if (fp.dormantTimer >= fp.dormantDuration) {
          fp.state = 'igniting';
          fp.burnTimer = 0;
          // Re-roll burn duration
          if (fp.sizeClass === 'small') {
            fp.burnDuration = 80 + Math.random() * 200;
          } else if (fp.sizeClass === 'large') {
            fp.burnDuration = 400 + Math.random() * 600;
          } else {
            fp.burnDuration = 150 + Math.random() * 350;
          }
        }
      } else if (fp.state === 'igniting') {
        fp.lifeAlpha += fp.fadeSpeed * dt;
        if (fp.lifeAlpha >= 1.0) {
          fp.lifeAlpha = 1.0;
          fp.state = 'burning';
          fp.burnTimer = 0;
        }
      }
    }
  }

  function drawTongue(x, y, w, h, sway, turb, layer) {
    if (h < 4) return;
    var tipX = x + sway;
    var tipY = y - h;

    var lx = x - w * 0.5;
    var rx = x + w * 0.5;
    var baseSpread = w * 0.12;
    var blx = lx - baseSpread;
    var brx = rx + baseSpread;

    var midY = y - h * 0.4;
    var midSqueeze = w * 0.18 * turb;
    var mlx = lx + midSqueeze + sway * 0.15;
    var mrx = rx - midSqueeze + sway * 0.15;

    var hlx = tipX - w * 0.07 + turb * 3;
    var hrx = tipX + w * 0.07 - turb * 3;

    ctx.beginPath();
    ctx.moveTo(blx, y + 4);
    ctx.bezierCurveTo(lx - w * 0.18, y - h * 0.12, mlx - w * 0.1, midY + h * 0.04, mlx, midY);
    ctx.bezierCurveTo(mlx + w * 0.04, midY - h * 0.1, hlx - w * 0.03, tipY + h * 0.12, tipX, tipY);
    ctx.bezierCurveTo(hrx + w * 0.03, tipY + h * 0.12, mrx - w * 0.04, midY - h * 0.1, mrx, midY);
    ctx.bezierCurveTo(mrx + w * 0.1, midY + h * 0.04, rx + w * 0.18, y - h * 0.12, brx, y + 4);
    ctx.closePath();

    var grad = ctx.createLinearGradient(x, y + 4, tipX, tipY);
    if (layer === 0) {
      grad.addColorStop(0.0, 'rgba(200, 45, 12, 0.85)');
      grad.addColorStop(0.25, 'rgba(190, 40, 10, 0.65)');
      grad.addColorStop(0.55, 'rgba(155, 28, 8, 0.38)');
      grad.addColorStop(0.8, 'rgba(100, 15, 5, 0.12)');
      grad.addColorStop(1.0, 'rgba(50, 8, 3, 0)');
    } else if (layer === 1) {
      grad.addColorStop(0.0, 'rgba(255, 185, 45, 0.9)');
      grad.addColorStop(0.2, 'rgba(255, 140, 25, 0.78)');
      grad.addColorStop(0.45, 'rgba(245, 95, 12, 0.55)');
      grad.addColorStop(0.7, 'rgba(210, 55, 10, 0.25)');
      grad.addColorStop(1.0, 'rgba(160, 25, 5, 0)');
    } else {
      grad.addColorStop(0.0, 'rgba(255, 255, 230, 0.95)');
      grad.addColorStop(0.18, 'rgba(255, 245, 180, 0.85)');
      grad.addColorStop(0.4, 'rgba(255, 210, 100, 0.6)');
      grad.addColorStop(0.65, 'rgba(255, 160, 40, 0.3)');
      grad.addColorStop(1.0, 'rgba(240, 100, 15, 0)');
    }
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ═══════════════════════════════════════════════════════
     4. HUMO SUTIL — nace cerca de las llamas activas
     ═══════════════════════════════════════════════════════ */
  var smokePuffs = [];
  var maxSmoke;

  var smokeTex = document.createElement('canvas');
  smokeTex.width = 240; smokeTex.height = 240;
  var stx = smokeTex.getContext('2d');
  if (stx) {
    var sg = stx.createRadialGradient(120, 120, 0, 120, 120, 120);
    sg.addColorStop(0, 'rgba(85, 70, 60, 0.44)');
    sg.addColorStop(0.3, 'rgba(68, 55, 46, 0.28)');
    sg.addColorStop(0.65, 'rgba(48, 36, 28, 0.12)');
    sg.addColorStop(1, 'rgba(18, 12, 10, 0)');
    stx.fillStyle = sg;
    stx.fillRect(0, 0, 240, 240);
  }

  /**
   * Busca una llama activa (lifeAlpha > 0.3) al azar para originar humo
   * cerca de ella. Si no hay llamas activas, retorna posición aleatoria.
   */
  function getSmokeSrcX() {
    // Recopilar llamas activas
    var active = [];
    for (var i = 0; i < flamePoints.length; i++) {
      if (flamePoints[i].lifeAlpha > 0.3) {
        active.push(flamePoints[i]);
      }
    }
    if (active.length > 0) {
      var chosen = active[Math.floor(Math.random() * active.length)];
      // Pequeña dispersión alrededor de la llama
      return chosen.x + (Math.random() - 0.5) * 50;
    }
    return Math.random() * width;
  }

  function initSmoke() {
    maxSmoke = isMobile ? 30 : 60;
    smokePuffs.length = 0;
    for (var i = 0; i < maxSmoke; i++) smokePuffs.push(new Puff(true));
  }

  function Puff(scatter) {
    this.reset();
    if (scatter) {
      this.y = height * 0.4 + Math.random() * height * 0.45;
      this.life = Math.random() * this.maxLife;
    }
  }
  Puff.prototype.reset = function () {
    this.x = getSmokeSrcX();
    this.y = height * 0.78 - Math.random() * 40;
    this.vy = -(Math.random() * 0.9 + 0.35) * SPEED;
    this.vx = (Math.random() - 0.48) * 0.45;
    this.r = Math.random() * 65 + 48;
    this.maxR = this.r * (Math.random() * 2.4 + 2.2);
    this.grow = (Math.random() * 0.25 + 0.12) * SPEED;
    this.rot = Math.random() * Math.PI * 2;
    this.rotS = (Math.random() - 0.5) * 0.004 * SPEED;
    this.maxLife = Math.random() * 380 + 260;
    this.life = this.maxLife;
    this.maxA = Math.random() * 0.35 + 0.18;
  };
  Puff.prototype.update = function (wind, dt) {
    this.life -= dt;
    if (this.life <= 0 || this.y < -this.r * 2) { this.reset(); return; }
    this.x += (this.vx + wind * 0.3) * dt;
    this.y += this.vy * dt;
    this.rot += this.rotS * dt;
    if (this.r < this.maxR) this.r += this.grow * dt;
  };
  Puff.prototype.draw = function (ctx) {
    var p = this.life / this.maxLife;
    var a = Math.sin(p * Math.PI) * this.maxA;
    if (a <= 0.006) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.drawImage(smokeTex, -this.r, -this.r, this.r * 2, this.r * 2);
    ctx.restore();
  };

  /* ═══════════════════════════════════════════════════════
     5. CHISPAS — flotando desde las brasas
     ═══════════════════════════════════════════════════════ */
  var sparks = [];
  var maxSparks;

  function initSparks() {
    maxSparks = isMobile ? 35 : 70;
    sparks.length = 0;
    for (var i = 0; i < maxSparks; i++) sparks.push(new Spark(true));
  }

  function Spark(scatter) {
    this.reset();
    if (scatter) {
      this.y = height * 0.5 + Math.random() * height * 0.5;
      this.life = Math.random() * this.maxLife;
    }
  }
  Spark.prototype.reset = function () {
    this.x = Math.random() * width;
    this.y = height * 0.82 + Math.random() * height * 0.18;
    this.vy = -(Math.random() * 2.5 + 0.8) * SPEED;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.size = Math.random() * 2.5 + 0.8;
    this.maxLife = Math.random() * 300 + 180;
    this.life = this.maxLife;
    this.wp = Math.random() * Math.PI * 2;
    this.wf = Math.random() * 0.04 + 0.015;
    var r = Math.random();
    this.color = r > 0.55 ? '255,200,70' : r > 0.25 ? '255,120,35' : '255,240,200';
    this.drag = 0.9988 + Math.random() * 0.001;
  };
  Spark.prototype.update = function (wind, dt) {
    this.life -= dt;
    if (this.life <= 0 || this.y < -25) { this.reset(); return; }
    this.wp += this.wf * dt;
    this.vy *= this.drag;
    this.x += (this.vx + Math.sin(this.wp) * 0.8 + wind * 0.5) * dt;
    this.y += this.vy * dt;
  };
  Spark.prototype.draw = function (ctx) {
    var a = Math.min(1, (this.life / this.maxLife) * 1.2);
    if (a <= 0.02) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(' + this.color + ',' + (a * 0.18).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(' + this.color + ',' + a.toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + this.color + ',' + (a * 0.45).toFixed(3) + ')';
    ctx.lineWidth = Math.max(0.6, this.size * 0.5);
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 2.5, this.y - this.vy * 2.5);
    ctx.stroke();
    ctx.restore();
  };

  /* ═══════════════════════════════════════════════════════
     6. RESPLANDOR AMBIENTAL — desde las brasas
     ═══════════════════════════════════════════════════════ */
  function drawAmbientGlow(ctx, time) {
    var pulse = Math.sin(time * 0.0015) * 0.08 + Math.cos(time * 0.003) * 0.05 + 0.87;

    // Resplandor cálido que ilumina desde la zona de brasas
    var g1 = ctx.createRadialGradient(
      width * 0.5, height, 0,
      width * 0.5, height, height * 0.65
    );
    g1.addColorStop(0, 'rgba(255, 100, 20, ' + (0.28 * pulse).toFixed(3) + ')');
    g1.addColorStop(0.25, 'rgba(200, 55, 15, ' + (0.16 * pulse).toFixed(3) + ')');
    g1.addColorStop(0.55, 'rgba(120, 25, 8, ' + (0.06 * pulse).toFixed(3) + ')');
    g1.addColorStop(1, 'rgba(40, 8, 4, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Resplandor concentrado en la base
    var g2 = ctx.createRadialGradient(
      width * 0.5, height * 0.88, 0,
      width * 0.5, height * 0.88, height * 0.25
    );
    g2.addColorStop(0, 'rgba(255, 180, 80, ' + (0.12 * pulse).toFixed(3) + ')');
    g2.addColorStop(0.5, 'rgba(200, 80, 25, ' + (0.06 * pulse).toFixed(3) + ')');
    g2.addColorStop(1, 'rgba(120, 30, 10, 0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g2;
    ctx.fillRect(0, height * 0.5, width, height * 0.5);
    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════
     INTERACCIÓN CON VIENTO
     ═══════════════════════════════════════════════════════ */
  var mouseWind = 0, lastPointerX = null;
  function onPointer(x) {
    if (lastPointerX !== null) {
      mouseWind = Math.max(-2, Math.min(2, mouseWind + (x - lastPointerX) * 0.03));
    }
    lastPointerX = x;
  }
  window.addEventListener('mousemove', function (e) { onPointer(e.clientX); }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches[0]) onPointer(e.touches[0].clientX);
  }, { passive: true });

  /* ═══════════════════════════════════════════════════════
     BUCLE DE RENDERIZADO PRINCIPAL
     ═══════════════════════════════════════════════════════ */
  var lastT = 0;

  function render(rawTime) {
    requestAnimationFrame(render);
    var time = (typeof rawTime === 'number' && !isNaN(rawTime)) ? rawTime : performance.now();
    var rawDt = time - lastT;
    lastT = time;
    var dt = Math.min(rawDt, 50) / 16.667;
    var slowTime = time * SPEED;

    mouseWind *= 0.96;
    ctx.clearRect(0, 0, width, height);

    // ─── Actualizar ciclos de vida de llamas ───
    updateFlameLifecycles(dt);

    // ─── A. Resplandor ambiental ───
    drawAmbientGlow(ctx, slowTime);

    // ─── B. Humo (fondo, detrás de todo) ───
    for (var i = 0; i < smokePuffs.length; i++) {
      smokePuffs[i].update(mouseWind, dt);
      smokePuffs[i].draw(ctx);
    }

    // ─── C. Lecho de brasas/carbón ───
    for (var i = 0; i < coals.length; i++) {
      drawCoal(coals[i], slowTime);
    }

    // ─── D. Grietas incandescentes ───
    drawCracks(slowTime);

    // ─── E. Llamas orgánicas desde puntos calientes ───
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < flamePoints.length; i++) {
      var fp = flamePoints[i];

      // Usar lifeAlpha del ciclo de vida independiente
      var activity = fp.lifeAlpha;
      if (activity < 0.02) continue;

      // Agregar variación de turbulencia interna a la intensidad
      var n = turbulence(slowTime * 0.0005 + fp.noiseSeed, 3);
      var flutter = Math.sin(slowTime * fp.f1 + fp.p1) * 0.18
                  + Math.cos(slowTime * fp.f2 + fp.p2) * 0.1
                  + n * 0.12;

      // Para llamas pequeñas, agregar parpadeo rápido adicional
      var flicker = 1.0;
      if (fp.sizeClass === 'small') {
        flicker = 0.5 + Math.abs(Math.sin(slowTime * 0.08 + fp.p1)) * 0.5;
      }

      var h = fp.maxH * activity * (0.6 + flutter) * flicker;

      // Sway: llamas grandes se balancean lento y amplio, pequeñas son nerviosas
      var swayAmp = fp.sizeClass === 'large' ? 22 : (fp.sizeClass === 'small' ? 6 : 14);
      var sway = Math.sin(slowTime * fp.f3 + fp.p3) * swayAmp
               + Math.sin(slowTime * fp.f4 + fp.p4) * (swayAmp * 0.35)
               + mouseWind * 22
               + n * 6;

      var baseY = fp.baseY;

      // Capa exterior roja
      drawTongue(fp.x, baseY, fp.baseW * 1.2 * activity, h, sway, n, 0);
      // Capa media naranja
      drawTongue(fp.x, baseY, fp.baseW * 0.8 * activity, h * 0.7, sway * 0.8, n, 1);
      // Núcleo brillante (solo cuando la llama está bastante activa)
      if (activity > 0.4) {
        drawTongue(fp.x, baseY, fp.baseW * 0.4 * activity, h * 0.4, sway * 0.6, n, 2);
      }
    }
    ctx.restore();

    // ─── F. Chispas flotantes ───
    for (var i = 0; i < sparks.length; i++) {
      sparks[i].update(mouseWind, dt);
      sparks[i].draw(ctx);
    }
  }

  /* ─── Inicialización ─── */
  window.addEventListener('resize', function () {
    resize();
    initSmoke();
    initSparks();
  });

  resize();
  initSmoke();
  initSparks();
  lastT = performance.now();
  requestAnimationFrame(render);
})();

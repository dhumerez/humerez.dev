/* humerez.dev — shared behavior for / (EN) and /es/ (ES) */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pageLang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2);
  var LANG_KEY = 'preferred-lang';

  /* =====================================================
     LANGUAGE — separate URLs (/ = EN, /es/ = ES).
     First visit on EN page: if the browser prefers Spanish,
     switch to /es/. Manual choice (toggle click) wins forever.
     Never auto-redirect away from /es/ (explicit links win).
     ===================================================== */
  try {
    var stored = localStorage.getItem(LANG_KEY);
    if (pageLang === 'en') {
      if (stored === 'es') {
        location.replace('/es/' + location.hash);
      } else if (!stored) {
        var langs = navigator.languages || [navigator.language || ''];
        var prefersES = langs.some(function (l) { return (l || '').toLowerCase().indexOf('es') === 0; });
        if (prefersES) location.replace('/es/' + location.hash);
      }
    }
  } catch (e) { /* localStorage unavailable — skip auto-detect */ }

  // Toggle links store the explicit choice before navigating
  document.querySelectorAll('[data-set-lang]').forEach(function (el) {
    el.addEventListener('click', function () {
      try { localStorage.setItem(LANG_KEY, el.getAttribute('data-set-lang')); } catch (e) {}
    });
  });
  // Landing on /es/ directly counts as choosing Spanish only if nothing stored yet
  if (pageLang === 'es') {
    try { if (!localStorage.getItem(LANG_KEY)) localStorage.setItem(LANG_KEY, 'es'); } catch (e) {}
  }

  /* =====================================================
     v4 DECORATIVE LAYERS — injected here (not in the HTML) so the
     EN/ES pages stay in sync and crawlers see only real content.
     ===================================================== */
  var root = document.documentElement;
  var ES = pageLang === 'es';
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    n.setAttribute('aria-hidden', 'true');
    return n;
  };

  /* ---- boot shutter (class "boot" comes from the inline head script) ---- */
  if (root.classList.contains('boot')) {
    var shutter = el('div', 'boot-shutter', '<i></i><i></i><b></b><span>HUMEREZ.DEV // ' + (ES ? 'SISTEMA EN LÍNEA' : 'SYSTEM ONLINE') + '</span>');
    document.body.appendChild(shutter);
    root.style.setProperty('--boot', '0.95s');
    root.classList.remove('boot');
    setTimeout(function () { if (shutter.parentNode) shutter.parentNode.removeChild(shutter); }, 1700);
  }

  var heroBox = document.querySelector('.hero');
  var heroTitleEl = document.querySelector('.hero-title');

  /* ---- kinetic title: one span per letter, staggered ---- */
  if (heroTitleEl && !reducedMotion) {
    heroTitleEl.setAttribute('aria-label', heroTitleEl.textContent.replace(/\s+/g, ' ').trim());
    var chIdx = 0;
    var textNodes = [], tw = document.createTreeWalker(heroTitleEl, NodeFilter.SHOW_TEXT, null), tn;
    while ((tn = tw.nextNode())) textNodes.push(tn);
    textNodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split('').forEach(function (ch) {
        if (!ch.trim()) { frag.appendChild(document.createTextNode(ch)); return; }
        var s = el('span', 'ch');
        s.textContent = ch;
        s.style.animationDelay = 'calc(var(--boot, 0s) + ' + (0.1 + chIdx * 0.05).toFixed(2) + 's)';
        chIdx++;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ---- giant outline type behind the hero ---- */
  if (heroBox) {
    var ghostText = (ES
      ? 'FORWARD DEPLOYED ENGINEER // IMPLEMENTACIÓN DE IA // DESARROLLO DE SOFTWARE // '
      : 'FORWARD DEPLOYED ENGINEER // AI IMPLEMENTATION // SOFTWARE DEVELOPMENT // ');
    var ghost = el('div', 'hero-ghost', '<div>' + ghostText + ghostText + '</div>');
    var heroInner = heroBox.querySelector('.hero-inner');
    heroBox.insertBefore(ghost, heroInner);
  }

  /* ---- mecha HUD: tick ring, target brackets, unit tag, live deploy log ---- */
  var rigEl = document.querySelector('.mecha-rig');
  if (rigEl) {
    rigEl.appendChild(el('div', 'hud-wrap', ''));
    rigEl.lastChild.outerHTML =
      '<svg class="mecha-hud" viewBox="0 0 560 560" aria-hidden="true" focusable="false">' +
        '<circle class="hud-ticks" cx="280" cy="280" r="272"/>' +
        '<path class="hud-brackets" d="M58 112V58h54M448 58h54v54M502 448v54h-54M112 502H58v-54"/>' +
        '<path class="hud-cross" d="M280 14v30M280 516v30M14 280h30M516 280h30"/>' +
      '</svg>';
    rigEl.appendChild(el('div', 'hud-tag', (ES ? 'UNIDAD' : 'UNIT') + ' <b>FDE-01</b> // ' + (ES ? 'MODO' : 'MODE') + ' <b>FORWARD DEPLOYED</b>'));

    var logLines = ES
      ? ['> fde embed --equipo cliente', '[OK] procesos y datos mapeados', '> build asistente-rag --datos reales', '[OK] 7.600 artículos indexados', '> deploy --env produccion', '[OK] en producción, equipo capacitado']
      : ['> fde embed --team client', '[OK] processes and data mapped', '> build rag-assistant --data real', '[OK] 7,600 articles indexed', '> deploy --env production', '[OK] live, team onboarded'];
    var logBox = el('div', 'hero-log', '<div class="hero-log-head"><span>DEPLOY LOG</span><em>● LIVE</em></div><div class="hero-log-body"></div>');
    rigEl.appendChild(logBox);
    var logBody = logBox.querySelector('.hero-log-body');
    var renderLine = function (text) {
      var p = document.createElement('p');
      p.className = text.charAt(0) === '>' ? 'cmd' : 'ok';
      p.textContent = text;
      logBody.appendChild(p);
    };
    if (reducedMotion) {
      logLines.forEach(renderLine);
    } else {
      var logIdx = 0;
      var logTick = function () {
        var onScreen = !document.hidden && heroBox && heroBox.getBoundingClientRect().bottom > 0;
        var delay = 850;
        if (onScreen) {
          if (logIdx >= logLines.length) { logBody.innerHTML = ''; logIdx = 0; delay = 500; }
          else {
            renderLine(logLines[logIdx++]);
            if (logIdx === logLines.length) delay = 3200;
          }
        }
        setTimeout(logTick, delay);
      };
      setTimeout(logTick, 1800);
    }
  }

  /* ---- outlined ghost numerals on section headers ---- */
  document.querySelectorAll('.section-header').forEach(function (header) {
    var tagEl = header.querySelector('.section-tag');
    var m = tagEl && /^\s*(\d\d)/.exec(tagEl.textContent);
    if (m) { var g = el('span', 'section-ghost'); g.textContent = m[1]; header.appendChild(g); }
  });

  /* ---- project cards: one small motion graphic each ---- */
  var svgOpen = '<svg viewBox="0 0 320 96" preserveAspectRatio="xMidYMid meet" focusable="false">';
  var vizBuilders = [
    function () { // legal RAG: scan the corpus, cite the articles
      var s = '<path class="pv-l" d="M14 84H306"/>';
      for (var i = 0; i < 6; i++) {
        var x = 20 + 48 * i;
        s += '<rect class="pv-s" x="' + x + '" y="24" width="34" height="48"/>' +
             '<path class="pv-l" d="M' + (x + 6) + ' 36h22M' + (x + 6) + ' 46h22M' + (x + 6) + ' 56h14"/>' +
             '<circle class="pv-cite pv-fx" cx="' + (x + 17) + '" cy="12" r="4" style="animation-delay:' + (0.3 + 0.66 * i).toFixed(2) + 's"/>';
      }
      return s + '<rect class="pv-scan" x="13" y="18" width="3" height="60"/>';
    },
    function () { // restaurant: floor map + orders to the kitchen
      var s = '';
      for (var r = 0; r < 2; r++) for (var c = 0; c < 5; c++) {
        s += '<rect class="pv-table" x="' + (18 + 40 * c) + '" y="' + (16 + 40 * r) + '" width="28" height="24" style="animation-delay:' + (((r * 5 + c) * 1.7) % 6).toFixed(1) + 's"/>';
      }
      return s + '<rect class="pv-s" x="240" y="14" width="62" height="68"/>' +
        '<path class="pv-ticket" d="M250 30h42"/><path class="pv-l" d="M250 44h42M250 56h30M250 68h36"/>' +
        '<circle class="pv-order" cx="32" cy="48" r="4"/><circle class="pv-order" cx="32" cy="48" r="4" style="animation-delay:1.2s"/>';
    },
    function () { // receipts: ledger bars + verified receipt
      var hts = [28, 44, 36, 58, 40, 66, 50], s = '<path class="pv-l" d="M14 84H210"/>';
      for (var i = 0; i < hts.length; i++) {
        s += '<rect class="pv-bar" x="' + (24 + 26 * i) + '" y="' + (84 - hts[i]) + '" width="14" height="' + hts[i] + '" style="animation-delay:' + (i * 0.25).toFixed(2) + 's"/>';
      }
      return s + '<rect class="pv-s" x="228" y="10" width="70" height="76"/>' +
        '<path class="pv-l" d="M238 26h50M238 38h50M238 50h32"/><path class="pv-check" d="M246 68l10 9 22-20"/>';
    },
    function () { // condo: windows lighting up
      var b = [[36, 26, 64, 58], [112, 40, 84, 44], [208, 16, 76, 68]], s = '<path class="pv-l" d="M14 84H306"/>', n = 0;
      b.forEach(function (q) {
        s += '<rect class="pv-s" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '"/>';
        for (var y = q[1] + 8; y + 8 < q[1] + q[3]; y += 14) for (var x = q[0] + 8; x + 8 < q[0] + q[2]; x += 14) {
          s += '<rect class="pv-win" x="' + x + '" y="' + y + '" width="7" height="7" style="animation-delay:' + ((n++ * 37 % 60) / 10).toFixed(1) + 's"/>';
        }
      });
      return s;
    }
  ];
  document.querySelectorAll('.project-card').forEach(function (card, i) {
    var head = card.querySelector('.project-card-header');
    if (!head || !vizBuilders[i]) return;
    var viz = el('div', 'project-viz', svgOpen + vizBuilders[i]() + '</svg>');
    head.parentNode.insertBefore(viz, head.nextSibling);
  });

  /* ============ MOBILE NAV ============ */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ============ SECTION TAG DECODE (mono labels only — headings stay stable) ============ */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/<>';
  var decodeText = function (el) {
    var finalText = el.textContent;
    var total = finalText.length, startT = null, duration = 300 + total * 22;
    var frame = function (ts) {
      if (!startT) startT = ts;
      var p = Math.min((ts - startT) / duration, 1);
      var shown = Math.floor(p * total), out = '';
      for (var i = 0; i < total; i++) {
        var ch = finalText.charAt(i);
        out += (i < shown || ch === ' ' || ch === '/') ? ch : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = p < 1 ? out : finalText;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  /* ============ SCROLL REVEAL ============ */
  var revealEls = document.querySelectorAll('.reveal, .stagger');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          var tag = entry.target.classList.contains('section-tag') ? entry.target : entry.target.querySelector('.section-tag');
          if (tag) decodeText(tag);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ============ SCROLL-SPY ============ */
  var sections = document.querySelectorAll('section[id]');
  var navLinkEls = document.querySelectorAll('.nav-links a[href^="#"]');
  if (sections.length && navLinkEls.length && 'IntersectionObserver' in window) {
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navLinkEls.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { spyObserver.observe(s); });
    navLinkEls[0].classList.add('active');
  }

  /* ============ SMOOTH SCROLL ============ */
  var NAV_HEIGHT = 70;
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top: top, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  /* ============ BACK TO TOP ============ */
  var backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    var heroSection = document.querySelector('.hero');
    if (heroSection && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          backToTopBtn.classList.toggle('visible', !entry.isIntersecting);
        });
      }, { threshold: 0.1 }).observe(heroSection);
    }
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ============ SCROLL PROGRESS + PARALLAX ============ */
  var progressBar = document.querySelector('.scroll-progress');
  var shape1 = document.querySelector('.hero-shape--1');
  var shape2 = document.querySelector('.hero-shape--2');
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var scrollY = window.scrollY;
      if (progressBar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
      }
      if (!reducedMotion && scrollY < window.innerHeight) {
        if (shape1) shape1.style.transform = 'translateY(' + scrollY * 0.12 + 'px) rotate(12deg)';
        if (shape2) shape2.style.transform = 'translateY(' + scrollY * 0.08 + 'px) rotate(-8deg)';
      }
      ticking = false;
    });
  }, { passive: true });

  /* ============ HERO: STARFIELD + 3D TILT ============ */
  var heroEl = document.querySelector('.hero');
  var mx = 0, my = 0; // shared mouse offset, -0.5..0.5
  var mpx = -9999, mpy = -9999; // pointer position inside the hero (CSS px), off-screen when away

  var starsCanvas = document.querySelector('.hero-stars');
  if (starsCanvas && heroEl && starsCanvas.getContext) {
    var ctx = starsCanvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var stars = [], starsRunning = false, heroVisible = true;

    var sizeStars = function () {
      var w = heroEl.clientWidth, h = heroEl.clientHeight;
      starsCanvas.width = w * dpr;
      starsCanvas.height = h * dpr;
      starsCanvas.style.width = w + 'px';
      starsCanvas.style.height = h + 'px';
      var n = Math.min(210, Math.max(50, Math.floor(w / 7)));
      stars = [];
      for (var i = 0; i < n; i++) {
        var roll = Math.random();
        stars.push({
          x: Math.random() * starsCanvas.width,
          y: Math.random() * starsCanvas.height,
          z: 0.25 + Math.random() * 0.75,
          r: 0.6 + Math.random() * 1.5,
          p: Math.random() * Math.PI * 2,
          s: 0.4 + Math.random() * 1.2,
          c: roll < 0.08 ? '230,57,70' : (roll < 0.22 ? '0,180,216' : '155,173,196')
        });
      }
    };

    var drawStars = function (t) {
      ctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        if (starsRunning) {
          st.y -= st.s * st.z * 0.3 * dpr;
          if (st.y < -4) { st.y = starsCanvas.height + 4; st.x = Math.random() * starsCanvas.width; }
        }
        var a = 0.2 + 0.4 * st.z + Math.sin(t / 700 * st.s + st.p) * 0.18;
        var sx = st.x + mx * 26 * st.z * dpr, sy = st.y + my * 18 * st.z * dpr;
        ctx.beginPath();
        ctx.arc(sx, sy, st.r * st.z * dpr, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + st.c + ',' + Math.max(0.05, a).toFixed(3) + ')';
        ctx.fill();
        if (mpx > -9000) { // constellation lines to the pointer
          var dx = sx - mpx * dpr, dy = sy - mpy * dpr, d2 = dx * dx + dy * dy, R = 190 * dpr;
          if (d2 < R * R) {
            ctx.strokeStyle = 'rgba(0,180,216,' + ((1 - Math.sqrt(d2) / R) * 0.45).toFixed(3) + ')';
            ctx.lineWidth = dpr;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(mpx * dpr, mpy * dpr);
            ctx.stroke();
          }
        }
      }
      if (starsRunning && heroVisible && !document.hidden) requestAnimationFrame(drawStars);
    };

    sizeStars();
    if (reducedMotion) {
      drawStars(0); // single static frame
    } else {
      starsRunning = true;
      requestAnimationFrame(drawStars);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          var wasVisible = heroVisible;
          heroVisible = entries[0].isIntersecting;
          if (heroVisible && !wasVisible) requestAnimationFrame(drawStars);
        }).observe(heroEl);
      }
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && heroVisible) requestAnimationFrame(drawStars);
      });
      var resizeT;
      window.addEventListener('resize', function () {
        clearTimeout(resizeT);
        resizeT = setTimeout(sizeStars, 200);
      });
    }
  }

  var rig = document.querySelector('.mecha-rig');
  if (heroEl && window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    var tiltX = 0, tiltY = 0, curX = 0, curY = 0, tiltRaf = null;
    var tiltLoop = function () {
      curX += (tiltX - curX) * 0.08;
      curY += (tiltY - curY) * 0.08;
      if (rig) rig.style.transform = 'rotateY(' + curX.toFixed(2) + 'deg) rotateX(' + curY.toFixed(2) + 'deg)';
      if (Math.abs(tiltX - curX) > 0.02 || Math.abs(tiltY - curY) > 0.02) {
        tiltRaf = requestAnimationFrame(tiltLoop);
      } else {
        tiltRaf = null;
      }
    };
    heroEl.addEventListener('mousemove', function (e) {
      var r = heroEl.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width - 0.5;
      var ny = (e.clientY - r.top) / r.height - 0.5;
      mx = nx; my = ny;
      mpx = e.clientX - r.left; mpy = e.clientY - r.top;
      tiltX = nx * 16;
      tiltY = -ny * 12;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltLoop);
    });
    heroEl.addEventListener('mouseleave', function () {
      mx = 0; my = 0; tiltX = 0; tiltY = 0; mpx = -9999; mpy = -9999;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltLoop);
    });
  }

  /* ============ HERO: GLITCH + MECHA DRAW ============ */
  window.addEventListener('load', function () {
    if (reducedMotion) return;
    var mecha = document.querySelector('.hero-mecha');
    if (mecha) mecha.classList.add('mecha-draw');
  });

  /* ============ HERO ROLE TYPEWRITER ============ */
  var roleEl = document.querySelector('.hero-role [data-roles]');
  if (roleEl) {
    var roles = [];
    try { roles = JSON.parse(roleEl.getAttribute('data-roles')) || []; } catch (e) {}
    if (roles.length && !reducedMotion) {
      var roleIdx = 0, charIdx = 0, deleting = false;
      var typeTick = function () {
        var word = roles[roleIdx];
        charIdx += deleting ? -1 : 1;
        roleEl.textContent = word.slice(0, charIdx);
        var delay = deleting ? 35 : 70;
        if (!deleting && charIdx === word.length) { delay = 2200; deleting = true; }
        else if (deleting && charIdx === 0) {
          deleting = false;
          roleIdx = (roleIdx + 1) % roles.length;
          delay = 350;
        }
        setTimeout(typeTick, delay);
      };
      roleEl.textContent = '';
      setTimeout(typeTick, 600);
    } else if (roles.length) {
      roleEl.textContent = roles[0];
    }
  }

  /* ============ STAT COUNTERS ============ */
  var counters = document.querySelectorAll('[data-count-to]');
  var animateCounter = function (el) {
    var target = parseInt(el.getAttribute('data-count-to'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reducedMotion || !('requestAnimationFrame' in window)) {
      el.textContent = target.toLocaleString() + suffix;
      return;
    }
    var duration = 1400;
    var start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ============ MARQUEE (seamless loop) ============ */
  var marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack) marqueeTrack.innerHTML += marqueeTrack.innerHTML;

  /* ============ FORWARD-DEPLOYED FLOW: animate only while on screen ============ */
  var fdeFlow = document.querySelector('.fde-flow');
  if (fdeFlow) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        fdeFlow.classList.toggle('in-view', entries[0].isIntersecting);
      }, { threshold: 0.15 }).observe(fdeFlow);
    } else {
      fdeFlow.classList.add('in-view');
    }
  }

  /* ============ CARD SPOTLIGHT (cursor-tracked glow) ============ */
  if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    document.querySelectorAll('.service-card, .project-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      card.addEventListener('mouseleave', function () {
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      });
    });
  }

  /* ============ PROJECT CARDS: tilt + click ============ */
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  document.querySelectorAll('.project-card').forEach(function (card) {
    var url = card.getAttribute('data-url');
    if (url && url !== '#') {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return; // let real links be links
        window.open(url, '_blank', 'noopener,noreferrer');
      });
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'link');
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    }
    if (finePointer && !reducedMotion) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
        card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    }
  });

  /* ============ CONTACT FORM → mailto compose ============ */
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (contactForm.querySelector('[name="name"]') || {}).value || '';
      var email = (contactForm.querySelector('[name="email"]') || {}).value || '';
      var message = (contactForm.querySelector('[name="message"]') || {}).value || '';
      var subject = (pageLang === 'es' ? 'Proyecto — ' : 'Project inquiry — ') + (name || 'humerez.dev');
      var body = message + '\n\n— ' + name + (email ? ' <' + email + '>' : '');
      location.href = 'mailto:humerezdiego1994@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);
    });
  }
})();

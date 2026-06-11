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

  /* ============ SCROLL REVEAL ============ */
  var revealEls = document.querySelectorAll('.reveal, .stagger');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
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
      var n = Math.min(130, Math.max(40, Math.floor(w / 11)));
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
        ctx.beginPath();
        ctx.arc(st.x + mx * 26 * st.z * dpr, st.y + my * 18 * st.z * dpr, st.r * st.z * dpr, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + st.c + ',' + Math.max(0.05, a).toFixed(3) + ')';
        ctx.fill();
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
      tiltX = nx * 16;
      tiltY = -ny * 12;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltLoop);
    });
    heroEl.addEventListener('mouseleave', function () {
      mx = 0; my = 0; tiltX = 0; tiltY = 0;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltLoop);
    });
  }

  /* ============ HERO: GLITCH + MECHA DRAW ============ */
  window.addEventListener('load', function () {
    if (reducedMotion) return;
    var heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      heroTitle.classList.add('glitch-active');
      heroTitle.addEventListener('animationend', function () {
        heroTitle.classList.remove('glitch-active');
      }, { once: true });
    }
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

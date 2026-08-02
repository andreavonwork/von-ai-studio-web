(function () {
  var html = document.documentElement;
  var STORAGE_KEY = 'von_lang';

  function setLang(lang) {
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'es' || saved === 'en') setLang(saved);

  var toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = html.getAttribute('data-lang') === 'en' ? 'en' : 'es';
      setLang(current === 'es' ? 'en' : 'es');
    });
  }

  var spotlight = document.getElementById('spotlight');
  if (spotlight && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;
    var showTimeout;

    window.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      spotlight.classList.add('active');
      clearTimeout(showTimeout);
      showTimeout = setTimeout(function () {
        spotlight.classList.remove('active');
      }, 2200);
    }, { passive: true });

    (function follow() {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      spotlight.style.setProperty('--mx', currentX + 'px');
      spotlight.style.setProperty('--my', currentY + 'px');
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- solutions carousel + panels ---------- */
  var solTrack = document.getElementById('sol-track');

  if (solTrack) {
    var solCards = Array.prototype.slice.call(solTrack.querySelectorAll('.sol-card'));
    var solPeek = document.getElementById('sol-peek');
    var solNav = document.getElementById('sol-nav');
    var solDots = Array.prototype.slice.call(document.querySelectorAll('.sol-dot'));

    function solStep() {
      if (solCards.length < 2) return solTrack.clientWidth;
      return solCards[1].offsetLeft - solCards[0].offsetLeft;
    }

    function solMaxScroll() {
      return solTrack.scrollWidth - solTrack.clientWidth;
    }

    function solAtEnd() {
      return solTrack.scrollLeft >= solMaxScroll() - 4;
    }

    function solSync() {
      if (solPeek) solPeek.classList.toggle('is-off', solAtEnd());
      if (solNav) solNav.classList.toggle('is-back', solAtEnd());

      if (solDots.length) {
        var step = solStep();
        var i = step ? Math.round(solTrack.scrollLeft / step) : 0;
        i = Math.max(0, Math.min(solDots.length - 1, i));
        solDots.forEach(function (d, n) { d.classList.toggle('is-active', n === i); });
      }
    }

    solTrack.addEventListener('scroll', solSync, { passive: true });
    window.addEventListener('resize', solSync);
    solSync();

    // hovering the faded right edge slides the peeking card fully into view
    if (solPeek) {
      solPeek.addEventListener('mouseenter', function () {
        solTrack.scrollTo({ left: solMaxScroll(), behavior: 'smooth' });
      });
    }

    if (solNav) {
      solNav.addEventListener('click', function () {
        if (solAtEnd()) {
          solTrack.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          solTrack.scrollBy({ left: solStep(), behavior: 'smooth' });
        }
      });
    }

    function closeSolPanels() {
      document.querySelectorAll('.sol-panel.open').forEach(function (p) {
        p.classList.remove('open');
      });
      solCards.forEach(function (c) { c.classList.remove('is-open'); });
    }

    function openSolPanel(card) {
      var panel = document.getElementById(card.getAttribute('data-sol'));
      if (!panel) return;
      var wasOpen = panel.classList.contains('open');
      closeSolPanels();
      if (wasOpen) return;

      panel.classList.add('open');
      card.classList.add('is-open');
      panel.addEventListener('transitionend', function scrollWhenOpen(ev) {
        if (ev.propertyName !== 'grid-template-rows') return;
        panel.removeEventListener('transitionend', scrollWhenOpen);
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    solCards.forEach(function (card) {
      card.addEventListener('click', function () { openSolPanel(card); });
      card.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openSolPanel(card);
      });
    });

    document.querySelectorAll('.sol-panel-close').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeSolPanels();
      });
    });
  }

  var isTouch = window.matchMedia('(hover: none)').matches;
  var serviceTiles = document.querySelectorAll('.service-tile');

  if (isTouch && serviceTiles.length) {
    serviceTiles[0].classList.add('touch-active');
  }

  serviceTiles.forEach(function (tile) {
    tile.addEventListener('click', function (e) {
      if (e.target.closest('.tile-more')) return;
      if (!isTouch) return;
      if (tile.classList.contains('touch-active')) return;
      e.preventDefault();
      serviceTiles.forEach(function (t) {
        if (t !== tile) t.classList.remove('touch-active');
      });
      tile.classList.add('touch-active');
    });
  });

  function closeAllPanels() {
    document.querySelectorAll('.service-panel.open').forEach(function (p) {
      p.classList.remove('open');
    });
  }

  document.querySelectorAll('.tile-more').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var panel = document.getElementById(btn.getAttribute('data-panel'));
      if (!panel) return;
      var wasOpen = panel.classList.contains('open');
      closeAllPanels();
      if (!wasOpen) {
        panel.classList.add('open');
        panel.addEventListener('transitionend', function scrollWhenOpen(ev) {
          if (ev.propertyName !== 'grid-template-rows') return;
          panel.removeEventListener('transitionend', scrollWhenOpen);
          panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });
  });

  document.querySelectorAll('.panel-close').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var panel = btn.closest('.service-panel');
      if (panel) panel.classList.remove('open');
    });
  });

  var menuBtn = document.getElementById('menu-btn');
  var mainNav = document.getElementById('main-nav');

  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      menuBtn.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        menuBtn.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

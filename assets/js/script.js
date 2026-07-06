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

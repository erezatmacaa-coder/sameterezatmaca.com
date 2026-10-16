/* Ortak arayüz: tema, mobil menü. Sayfanın <head> bölümünde yüklenir. */
(function () {
  var root = document.documentElement;
  var KEY = 'sea-theme';
  root.classList.remove('no-js');
  root.classList.add('js');

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* depolama kapalı olabilir */ }
  }
  var initial = stored();
  if (initial === 'light' || initial === 'dark') root.setAttribute('data-theme', initial);

  function current() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var themeBtn = document.querySelector('.theme-toggle');
    function label() {
      if (!themeBtn) return;
      var next = current() === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç';
      themeBtn.setAttribute('aria-label', next);
      themeBtn.setAttribute('title', next);
    }
    label();
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      save(next);
      label();
    });

    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (toggle && nav) {
      var setOpen = function (open) {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
      };
      toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
      nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
      });
    }
  });
})();

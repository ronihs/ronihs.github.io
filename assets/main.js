(function () {
  var GITHUB_USER = 'ronihs';

  var SKILLS = [
    { name: 'Python', level: 75 },
    { name: 'HTML', level: 60 },
    { name: 'JavaScript', level: 60 },
    { name: 'Kotlin', level: 55 },
    { name: 'C / C++', level: 50 },
    { name: 'C#', level: 40 },
    { name: 'Go', level: 30 },
    { name: 'Flutter', level: 20 }
  ];

  var root = document.documentElement;

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', function () {
    var current = root.dataset.theme ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // Mobile menu
  var menuBtn = document.getElementById('menuToggle');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });

  // Nav border on scroll
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Skills
  var list = document.getElementById('skillList');
  SKILLS.forEach(function (s) {
    var on = Math.round(s.level / 5);
    var cells = '';
    for (var i = 0; i < 20; i++) cells += '<i' + (i < on ? ' class="on" style="transition-delay:' + (i * 30) + 'ms"' : '') + '></i>';
    var li = document.createElement('li');
    li.className = 'skill reveal';
    li.innerHTML =
      '<div class="skill__row"><span class="skill__name">' + s.name + '</span>' +
      '<span class="skill__pct mono">' + s.level + '%</span></div>' +
      '<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + s.level + '" aria-label="' + s.name + '">' + cells + '</div>';
    list.appendChild(li);
  });

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Active nav link
  var links = document.querySelectorAll('.nav__links a');
  if ('IntersectionObserver' in window) {
    var secIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { secIo.observe(s); });
  }

  // Projects from GitHub
  var projectList = document.getElementById('projectList');
  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function showEmpty() {
    projectList.innerHTML =
      '<div class="projects__empty">Projects are on GitHub — <a href="https://github.com/' + GITHUB_USER +
      '?tab=repositories" target="_blank" rel="noopener">browse all repositories</a>.</div>';
  }
  fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=updated')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (repos) {
      var items = repos
        .filter(function (r) { return !r.fork && r.name.toLowerCase() !== GITHUB_USER + '.github.io'; })
        .sort(function (a, b) { return b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at); })
        .slice(0, 6);
      if (!items.length) return showEmpty();
      projectList.innerHTML = items.map(function (r) {
        return '<a class="project reveal is-in" href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' +
          '<div class="project__top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg></div>' +
          '<h3>' + esc(r.name) + '</h3>' +
          '<p>' + esc(r.description || 'No description yet.') + '</p>' +
          '<div class="project__meta mono">' +
          (r.language ? '<span><span class="lang-dot"></span>' + esc(r.language) + '</span>' : '') +
          '<span>★ ' + r.stargazers_count + '</span></div></a>';
      }).join('');
    })
    .catch(showEmpty);
})();

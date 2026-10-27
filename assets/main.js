(function () {
  // ---------- Konfigurasi ----------
  var GITHUB_USER = 'ronihs';

  // Isi dengan URL profil Google Scholar, mis. 'https://scholar.google.com/citations?user=XXXX'
  var SCHOLAR_URL = 'https://scholar.google.co.id/citations?user=vs16vi0AAAAJ&hl=id';

  // Isi dengan username Medium tanpa '@', mis. 'ronihalim'
  var MEDIUM_USER = 'ronihalimsaputra';

  // Kata kunci untuk memilih repo AI / ML / DL dari GitHub
  var AI_KEYWORDS = /(\bai\b|ml|machine|learning|deep|neural|\bnn\b|cnn|rnn|lstm|gan|torch|tensorflow|keras|llm|rag|nlp|vision|spark|classif|predict|regress|cluster|model|data)/i;

  var root = document.documentElement;

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  // Coba sumber satu per satu sampai ada yang menghasilkan daftar tidak kosong
  function loadFirst(sources) {
    return sources.reduce(function (p, src) {
      return p.catch(function () {
        return src().then(function (list) {
          if (!list || !list.length) throw new Error('empty');
          return list;
        });
      });
    }, Promise.reject());
  }

  function excerpt(raw) {
    var text = (raw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 150 ? text.slice(0, 150).replace(/\s\S*$/, '') + '…' : text;
  }

  // Tampilkan bagian opsional bila datanya sudah diisi
  function enable(key) {
    document.querySelectorAll('[data-optional="' + key + '"]').forEach(function (el) { el.hidden = false; });
  }
  document.querySelectorAll('[data-optional]').forEach(function (el) { el.hidden = true; });

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

  // ---------- Penelitian ----------
  // Daftar penelitian ditulis langsung di index.html (#pubList)
  if (SCHOLAR_URL) {
    enable('research');
    document.getElementById('scholarLink').href = SCHOLAR_URL;
    document.getElementById('scholarSocial').href = SCHOLAR_URL;
  }

  // ---------- Tulisan (Medium) ----------
  if (MEDIUM_USER) {
    enable('writing');
    var mediumUrl = 'https://medium.com/@' + MEDIUM_USER;
    document.getElementById('mediumLink').href = mediumUrl;
    document.getElementById('mediumSocial').href = mediumUrl;
    var postList = document.getElementById('postList');
    // Kartu sudah ditulis ke HTML oleh GitHub Actions; fetch hanya bila kosong
    if (!postList.querySelector('.post')) loadPosts();
  }

  function loadPosts() {
    var postList = document.getElementById('postList');
    var mediumUrl = 'https://medium.com/@' + MEDIUM_USER;
    postList.innerHTML = '<div class="post post--skeleton"></div><div class="post post--skeleton"></div><div class="post post--skeleton"></div>';
    var fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    // Data lokal (diperbarui GitHub Actions), lalu rss2json sebagai cadangan
    loadFirst([
      function () { return getJSON('data/medium.json'); },
      function () {
        return getJSON('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://medium.com/feed/@' + MEDIUM_USER))
          .then(function (d) {
            return (d.items || []).map(function (it) {
              return { title: it.title, link: it.link, date: (it.pubDate || '').slice(0, 10), excerpt: excerpt(it.description), image: it.thumbnail };
            });
          });
      }
    ])
      .then(function (posts) {
        postList.innerHTML = posts.slice(0, 6).map(function (it) {
          var date = it.date ? fmt.format(new Date(it.date + 'T00:00:00')) : '';
          return '<a class="post" href="' + esc(it.link) + '" target="_blank" rel="noopener">' +
            (it.image ? '<img class="post__img" src="' + esc(it.image) + '" alt="" loading="lazy" onerror="this.remove()">' : '') +
            '<span class="post__date mono">' + esc(date) + '</span>' +
            '<h3>' + esc(it.title) + '</h3><p>' + esc(it.excerpt || '') + '</p>' +
            '<span class="post__more mono">Baca di Medium →</span></a>';
        }).join('');
      })
      .catch(function () {
        postList.innerHTML = '<div class="projects__empty">Baca tulisan saya di ' +
          '<a href="' + esc(mediumUrl) + '" target="_blank" rel="noopener">Medium</a>.</div>';
      });
  }

  // ---------- Proyek dari GitHub ----------
  var projectList = document.getElementById('projectList');
  function showEmpty() {
    projectList.innerHTML =
      '<div class="projects__empty">Proyek tersedia di GitHub — <a href="https://github.com/' + GITHUB_USER +
      '?tab=repositories" target="_blank" rel="noopener">lihat semua repositori</a>.</div>';
  }
  function aiRepos(repos) {
    return repos
      .filter(function (r) {
        if (r.fork || r.name.toLowerCase() === GITHUB_USER + '.github.io') return false;
        var hay = [r.name, r.description || '', r.language || '', (r.topics || []).join(' ')].join(' ');
        return r.language === 'Jupyter Notebook' || AI_KEYWORDS.test(hay);
      })
      .sort(function (a, b) { return b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at); })
      .slice(0, 9);
  }
  // Kartu sudah ditulis ke HTML oleh GitHub Actions; fetch hanya bila kosong
  if (!projectList.querySelector('.project')) loadFirst([
    function () { return getJSON('data/repos.json').then(aiRepos); },
    function () { return getJSON('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=updated').then(aiRepos); }
  ])
    .then(function (items) {
      projectList.innerHTML = items.map(function (r) {
        return '<a class="project" href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' +
          '<div class="project__top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg></div>' +
          '<h3>' + esc(r.name) + '</h3>' +
          '<p>' + esc(r.description || 'Belum ada deskripsi.') + '</p>' +
          '<div class="project__meta mono">' +
          (r.language ? '<span><span class="lang-dot"></span>' + esc(r.language) + '</span>' : '') +
          '<span>★ ' + r.stargazers_count + '</span></div></a>';
      }).join('');
    })
    .catch(showEmpty);

  // ---------- Reveal on scroll ----------
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

  // ---------- Active nav link ----------
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
})();

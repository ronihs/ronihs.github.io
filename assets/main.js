(function () {
  // ---------- Konfigurasi ----------
  var GITHUB_USER = 'ronihs';

  // Isi dengan URL profil Google Scholar, mis. 'https://scholar.google.com/citations?user=XXXX'
  var SCHOLAR_URL = 'https://scholar.google.co.id/citations?user=vs16vi0AAAAJ&hl=id';

  // Isi dengan username Medium tanpa '@', mis. 'ronihalim'
  var MEDIUM_USER = 'ronihalimsaputra';

  // Daftar penelitian (dari Google Scholar). Tanpa 'url', judul mengarah ke pencarian Google Scholar.
  var PUBLICATIONS = [
    {
      title: 'Integrasi BiLSTM-GRU dan Retrieval-Augmented Generation untuk Prediksi Harga Saham Perbankan',
      authors: 'Roni Halim Saputra, Eri Zuliarso',
      venue: 'Jurnal Minfo Polgan, 15(3), 2500–2508',
      year: 2026
    },
    {
      title: 'Analisis dan Pengelompokan Kompetensi Karyawan Divisi Sewing dengan Metode Weighted Product',
      authors: 'Suluh Hidayat, Heni Candra Kirana, Roni Halim Saputra, Kristiawan Nugroho, Eka Ardhianto',
      venue: 'STORAGE: Jurnal Ilmiah Teknik dan Ilmu Komputer, 4(3), 250–257',
      year: 2025
    },
    {
      title: 'Deteksi Penyakit Tomat melalui Citra Daun Menggunakan Metode Convolutional Neural Network',
      authors: 'Rito Cipta Sigitta, Roni Halim Saputra, Fathulloh',
      venue: 'Aviation Electronics, Information Technology, Telecommunications, Electricals, Controls (AVITEC), 5(1), 43–51',
      year: 2023
    }
  ];

  // Kata kunci untuk memilih repo AI / ML / DL dari GitHub
  var AI_KEYWORDS = /(\bai\b|ml|machine|learning|deep|neural|\bnn\b|cnn|rnn|lstm|gan|torch|tensorflow|keras|llm|rag|nlp|vision|spark|classif|predict|regress|cluster|model|data)/i;

  var root = document.documentElement;

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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
  if (SCHOLAR_URL || PUBLICATIONS.length) {
    enable('research');
    ['scholarLink', 'scholarSocial'].forEach(function (id) {
      var a = document.getElementById(id);
      if (SCHOLAR_URL) a.href = SCHOLAR_URL;
      else a.parentNode.removeChild(a);
    });
    var pubList = document.getElementById('pubList');
    if (PUBLICATIONS.length) {
      pubList.innerHTML = PUBLICATIONS
        .slice()
        .sort(function (a, b) { return (b.year || 0) - (a.year || 0); })
        .map(function (p) {
          var url = p.url || 'https://scholar.google.com/scholar?q=' + encodeURIComponent('"' + p.title + '"');
          var authors = p.authors
            ? '<p class="pub__authors">' + esc(p.authors).replace('Roni Halim Saputra', '<strong>Roni Halim Saputra</strong>') + '</p>'
            : '';
          return '<li class="pub reveal"><span class="pub__year mono">' + esc(p.year || '') + '</span>' +
            '<div><h3><a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a></h3>' +
            authors + (p.venue ? '<p>' + esc(p.venue) + '</p>' : '') + '</div></li>';
        }).join('');
    } else {
      pubList.innerHTML = '<li class="projects__empty">Daftar lengkap penelitian tersedia di ' +
        '<a href="' + esc(SCHOLAR_URL) + '" target="_blank" rel="noopener">Google Scholar</a>.</li>';
    }
  }

  // ---------- Tulisan (Medium) ----------
  if (MEDIUM_USER) {
    enable('writing');
    var mediumUrl = 'https://medium.com/@' + MEDIUM_USER;
    document.getElementById('mediumLink').href = mediumUrl;
    document.getElementById('mediumSocial').href = mediumUrl;
    var postList = document.getElementById('postList');
    var fmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://medium.com/feed/@' + MEDIUM_USER))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var items = (data.items || []).slice(0, 6);
        if (!items.length) throw new Error('empty');
        postList.innerHTML = items.map(function (it) {
          var text = (it.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (text.length > 150) text = text.slice(0, 150).replace(/\s\S*$/, '') + '…';
          var date = it.pubDate ? fmt.format(new Date(it.pubDate.replace(' ', 'T') + 'Z')) : '';
          return '<a class="post" href="' + esc(it.link) + '" target="_blank" rel="noopener">' +
            '<span class="post__date mono">' + esc(date) + '</span>' +
            '<h3>' + esc(it.title) + '</h3><p>' + esc(text) + '</p>' +
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
  fetch('https://api.github.com/users/' + GITHUB_USER + '/repos?per_page=100&sort=updated')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (repos) {
      var items = repos
        .filter(function (r) {
          if (r.fork || r.name.toLowerCase() === GITHUB_USER + '.github.io') return false;
          var hay = [r.name, r.description || '', r.language || '', (r.topics || []).join(' ')].join(' ');
          return r.language === 'Jupyter Notebook' || AI_KEYWORDS.test(hay);
        })
        .sort(function (a, b) { return b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at); })
        .slice(0, 9);
      if (!items.length) return showEmpty();
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

  // Nomor bagian mengikuti bagian yang tampil
  document.querySelectorAll('main section:not([hidden]) .section__num').forEach(function (el, i) {
    el.textContent = el.textContent.replace(/^\d+/, String(i + 1).padStart(2, '0'));
  });

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

# ronihs.github.io

Portofolio Roni Halim Saputra, M.Kom — https://ronihs.github.io/

Situs statis tanpa proses build:

- `index.html` — isi halaman (tentang, pengalaman, pendidikan, kontak)
- `assets/style.css` — tampilan (tema terang/gelap)
- `assets/main.js` — konfigurasi di bagian atas:
  - `SCHOLAR_URL` — profil Google Scholar (daftar penelitian ada di `index.html`, `#pubList`)
  - `MEDIUM_USER` — tulisan Medium dimuat otomatis
  - `AI_KEYWORDS` — penyaring repo GitHub untuk bagian Proyek AI/ML/DL
- `images/` — foto

Data proyek GitHub dan artikel Medium disimpan di `data/repos.json` dan
`data/medium.json`, diperbarui otomatis tiap 6 jam oleh workflow
`.github/workflows/update-data.yml` (`scripts/update_data.py`), yang juga menulis kartunya langsung ke `index.html`. Jalankan manual
lewat tab **Actions → Update GitHub & Medium data → Run workflow**.

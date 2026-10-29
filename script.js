(function () {
  "use strict";

  var KEY = "misi-informatika-info-viral-v1";
  var TOTAL = 6;

  // ---------- Penyimpanan (aman jika storage diblokir) ----------
  var state = { jawab: {}, selesai: {}, anggota: [], peran: [], offset: 0, mudah: "", ciri: {}, langkah: null, kuis: {}, kunci: {} };

  function simpan() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function muat() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var data = JSON.parse(raw);
        for (var k in data) { if (Object.prototype.hasOwnProperty.call(state, k)) state[k] = data[k]; }
      }
    } catch (e) {}
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---------- Data konten ----------
  var CIRI = [
    { t: "Menggunakan huruf kapital dan tanda seru berlebihan", j: "ragu" },
    { t: "Tidak menyebut nama pengirim atau sumber resmi", j: "ragu" },
    { t: "Memaksa untuk segera disebarkan sebelum waktu tertentu", j: "ragu" },
    { t: "Mengancam akan ada hukuman jika tidak dilakukan", j: "ragu" },
    { t: "Ada pengumuman yang sama di situs atau akun resmi sekolah", j: "percaya" }
  ];

  var LANGKAH = [
    "Berhenti sejenak dan jangan langsung meneruskan pesan",
    "Periksa siapa pengirim dan apa sumber informasinya",
    "Bandingkan dengan sumber resmi atau situs pemeriksa fakta",
    "Tanyakan kepada guru atau orang tua jika masih ragu",
    "Bagikan hanya jika sudah terbukti benar, atau laporkan jika hoaks"
  ];

  var KUIS = [
    {
      q: "Pesan berantai menyuruhmu menyebarkan secepatnya. Apa yang sebaiknya dilakukan pertama kali?",
      o: ["Segera meneruskan ke semua grup", "Memeriksa sumber dan kebenarannya", "Mengabaikan semua pesan di grup", "Menambah komentar lalu menyebarkannya"],
      a: 1,
      u: "Memeriksa dulu mencegah kita ikut menyebarkan informasi yang keliru."
    },
    {
      q: "Mana sumber yang paling tepat untuk memeriksa pengumuman sekolah?",
      o: ["Pesan teruskan dari teman", "Tebakan berdasarkan perasaan", "Akun atau situs resmi sekolah serta guru", "Unggahan tanpa nama yang banyak dibagikan"],
      a: 2,
      u: "Sumber resmi dapat dipertanggungjawabkan."
    },
    {
      q: "Dampak apa yang dapat muncul jika hoaks terus disebarkan?",
      o: ["Orang menjadi cemas dan salah mengambil keputusan", "Tidak ada dampak apa pun", "Semua orang menjadi lebih pintar", "Hoaks otomatis menjadi benar"],
      a: 0,
      u: "Informasi keliru dapat menimbulkan kecemasan dan keputusan yang salah."
    },
    {
      q: "Beredar pesan viral berjudul \"Heboh! Minum air garam menyembuhkan semua penyakit\". Tindakan paling tepat?",
      o: ["Meneruskan agar keluarga ikut tahu", "Mencobanya dulu untuk membuktikan", "Percaya karena banyak yang membagikan", "Mencari kebenarannya di situs kesehatan resmi atau pemeriksa fakta"],
      a: 3,
      u: "Klaim kesehatan harus dicek ke sumber resmi. Banyaknya pembagian bukan bukti kebenaran."
    },
    {
      q: "Mengapa pesan hoaks sering memakai kalimat yang menakutkan atau mendesak?",
      o: ["Agar pesan mudah dilupakan", "Agar pembaca panik dan cepat menyebarkan tanpa berpikir", "Agar pesan terlihat lebih sopan", "Agar pembaca punya waktu memeriksanya"],
      a: 1,
      u: "Rasa takut dan terburu-buru membuat orang lupa memeriksa kebenaran."
    }
  ];

  var NAMA_PERAN = ["Navigator", "Pencatat", "Pemeriksa Fakta", "Juru Bicara"];

  // ---------- Progres ----------
  function hitungProgres() {
    var n = Object.keys(state.selesai).filter(function (k) { return state.selesai[k]; }).length;
    $("#bar").style.width = (n / TOTAL * 100) + "%";
    $("#progressText").textContent = n + " dari " + TOTAL + " tahap selesai";
    $$(".card").forEach(function (c) {
      c.classList.toggle("selesai", !!state.selesai[c.getAttribute("data-tahap")]);
    });
    $("#selesaiSemua").hidden = n < TOTAL;
    $("#unduhPdf").hidden = n < TOTAL;
  }

  function aturTombolSelesai() {
    $$("[data-selesai]").forEach(function (b) {
      var no = b.getAttribute("data-selesai");
      b.textContent = state.selesai[no] ? "Tahap " + no + " selesai (klik untuk batalkan)" : "Tandai tahap " + no + " selesai";
      b.addEventListener("click", function () {
        state.selesai[no] = !state.selesai[no];
        b.textContent = state.selesai[no] ? "Tahap " + no + " selesai (klik untuk batalkan)" : "Tandai tahap " + no + " selesai";
        simpan();
        hitungProgres();
      });
    });
  }

  // ---------- Tahap 1: peran ----------
  function ambilAnggota() {
    return $$(".anggota").map(function (i) { return i.value.trim(); });
  }

  function tampilPeran() {
    var ul = $("#daftarPeran");
    ul.innerHTML = "";
    var nama = state.anggota.filter(Boolean);
    nama.forEach(function (n, i) {
      var li = document.createElement("li");
      var peran = NAMA_PERAN[(i + state.offset) % NAMA_PERAN.length];
      var b = document.createElement("b");
      b.textContent = peran;
      li.appendChild(b);
      li.appendChild(document.createTextNode(": " + n));
      ul.appendChild(li);
    });
  }

  function acak(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function mulaiTahap1() {
    var inputs = $$(".anggota");
    state.anggota.forEach(function (n, i) { if (inputs[i]) inputs[i].value = n; });
    $("#namaKelompok").value = state.namaKelompok || "";
    $("#namaKelompok").addEventListener("input", function () { state.namaKelompok = this.value; simpan(); updateRekap(); });
    inputs.forEach(function (inp) {
      inp.addEventListener("input", function () {
        state.anggota = ambilAnggota();
        simpan();
        tampilPeran();
        updateRekap();
      });
    });
    $("#acakPeran").addEventListener("click", function () {
      state.anggota = acak(ambilAnggota());
      state.offset = 0;
      var inputs2 = $$(".anggota");
      inputs2.forEach(function (inp, i) { inp.value = state.anggota[i] || ""; });
      simpan(); tampilPeran(); updateRekap();
    });
    $("#putarPeran").addEventListener("click", function () {
      state.offset = (state.offset + 1) % NAMA_PERAN.length;
      simpan(); tampilPeran();
    });
    tampilPeran();
  }

  // ---------- Tahap 3 & 5 & 6: isian ----------
  function mulaiIsian() {
    $$(".jawab").forEach(function (ta) {
      var k = ta.getAttribute("data-key");
      if (state.jawab[k]) ta.value = state.jawab[k];
      ta.addEventListener("input", function () {
        state.jawab[k] = ta.value;
        simpan();
        updateRekap();
      });
    });
    $$(".radio").forEach(function (r) {
      if (state.mudah === r.value) r.checked = true;
      r.addEventListener("change", function () { state.mudah = r.value; simpan(); });
    });
  }

  function updateRekap() {
    var a = state.anggota.filter(Boolean).join(", ") || "-";
    var teks =
      "HASIL KELOMPOK: " + (state.namaKelompok || "-") + "\n" +
      "Anggota: " + a + "\n\n" +
      "Solusi: " + (state.jawab.solusi || "-") + "\n\n" +
      "Alasan: " + (state.jawab.alasan || "-") + "\n\n" +
      "Pesan untuk teman: " + (state.jawab.pesan || "-");
    $("#rekap").value = teks;
  }

  function mulaiSalin() {
    $("#salin").addEventListener("click", function () {
      var el = $("#rekap");
      var info = $("#infoSalin");
      function ok() { info.textContent = "Tersalin. Tempel ke papan diskusi kelas."; info.className = "hasil ok"; }
      function gagal() {
        el.focus(); el.select();
        info.textContent = "Teks sudah dipilih. Tekan Ctrl+C untuk menyalin.";
        info.className = "hasil bad";
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(el.value).then(ok, gagal);
      } else {
        gagal();
      }
    });
  }

  // ---------- Tantangan A: ciri ----------
  function mulaiCiri() {
    var wadah = $("#ciri");
    CIRI.forEach(function (c, i) {
      var d = document.createElement("div");
      d.className = "item";
      d.id = "ciri" + i;
      var s = document.createElement("span");
      s.textContent = c.t;
      var sel = document.createElement("select");
      sel.setAttribute("aria-label", "Penilaian untuk: " + c.t);
      [["", "Pilih..."], ["ragu", "Meragukan"], ["percaya", "Cukup dapat dipercaya"]].forEach(function (o) {
        var op = document.createElement("option");
        op.value = o[0]; op.textContent = o[1];
        sel.appendChild(op);
      });
      sel.value = state.ciri[i] || "";
      sel.addEventListener("change", function () { state.ciri[i] = sel.value; simpan(); d.className = "item"; });
      d.appendChild(s); d.appendChild(sel);
      wadah.appendChild(d);
    });
    function kunciCiri() {
      $$("#ciri select").forEach(function (s) { s.disabled = true; });
      $("#cekCiri").disabled = true;
    }
    function periksaCiri() {
      var benar = 0, kosong = 0;
      CIRI.forEach(function (c, i) {
        var d = $("#ciri" + i), v = $("select", d).value;
        if (!v) { kosong++; d.className = "item"; return; }
        if (v === c.j) { benar++; d.className = "item benar"; } else { d.className = "item salah"; }
      });
      var h = $("#hasilCiri");
      if (kosong) { h.textContent = "Jawab semua ciri dulu."; h.className = "hasil bad"; return; }
      h.textContent = benar + " dari " + CIRI.length + " tepat." + (benar === CIRI.length ? " Bagus!" : " Coba perbaiki yang merah.");
      h.className = "hasil " + (benar === CIRI.length ? "ok" : "bad");
      h.textContent += " Jawaban dikunci.";
      state.kunci.ciri = true; simpan(); kunciCiri();
    }
    $("#cekCiri").addEventListener("click", periksaCiri);
    if (state.kunci.ciri) periksaCiri();
  }

  // ---------- Tantangan B: urutan ----------
  function mulaiLangkah() {
    if (!state.langkah || state.langkah.length !== LANGKAH.length) {
      // urutan awal diacak, pastikan tidak langsung benar
      var urut;
      do { urut = acak(LANGKAH.map(function (_, i) { return i; })); }
      while (urut.every(function (v, i) { return v === i; }));
      state.langkah = urut;
    }
    gambarLangkah();
    function periksaLangkah() {
      var benar = 0;
      $$("#langkah li").forEach(function (li, pos) {
        var idx = state.langkah[pos];
        if (idx === pos) { benar++; li.className = "benar"; } else { li.className = "salah"; }
      });
      var h = $("#hasilLangkah");
      h.textContent = benar + " dari " + LANGKAH.length + " langkah di tempat yang tepat.";
      h.className = "hasil " + (benar === LANGKAH.length ? "ok" : "bad");
      h.textContent += " Jawaban dikunci.";
      state.kunci.langkah = true; simpan();
      $$("#langkah button").forEach(function (b) { b.disabled = true; });
      $("#cekLangkah").disabled = true;
    }
    $("#cekLangkah").addEventListener("click", periksaLangkah);
    if (state.kunci.langkah) periksaLangkah();
  }

  function gambarLangkah() {
    var ol = $("#langkah");
    ol.innerHTML = "";
    state.langkah.forEach(function (idx, pos) {
      var li = document.createElement("li");
      var s = document.createElement("span");
      s.textContent = LANGKAH[idx];
      var naik = document.createElement("button");
      naik.className = "btn ghost small"; naik.type = "button";
      naik.textContent = "Naik"; naik.setAttribute("aria-label", "Naikkan: " + LANGKAH[idx]);
      naik.disabled = pos === 0 || !!state.kunci.langkah;
      naik.addEventListener("click", function () { tukar(pos, pos - 1); });
      var turun = document.createElement("button");
      turun.className = "btn ghost small"; turun.type = "button";
      turun.textContent = "Turun"; turun.setAttribute("aria-label", "Turunkan: " + LANGKAH[idx]);
      turun.disabled = pos === state.langkah.length - 1 || !!state.kunci.langkah;
      turun.addEventListener("click", function () { tukar(pos, pos + 1); });
      li.appendChild(s); li.appendChild(naik); li.appendChild(turun);
      ol.appendChild(li);
    });
  }

  function tukar(a, b) {
    if (state.kunci.langkah) return;
    var t = state.langkah[a]; state.langkah[a] = state.langkah[b]; state.langkah[b] = t;
    simpan(); gambarLangkah();
    $("#hasilLangkah").textContent = "";
  }

  // ---------- Tantangan C: kuis ----------
  function mulaiKuis() {
    var w = $("#kuis");
    KUIS.forEach(function (s, i) {
      var d = document.createElement("div");
      d.className = "soal"; d.id = "soal" + i;
      var p = document.createElement("p");
      p.textContent = (i + 1) + ". " + s.q;
      d.appendChild(p);
      s.o.forEach(function (teks, j) {
        var l = document.createElement("label");
        l.className = "opsi";
        var r = document.createElement("input");
        r.type = "radio"; r.name = "kuis" + i; r.value = j;
        if (state.kuis[i] === j) r.checked = true;
        r.addEventListener("change", function () { state.kuis[i] = j; simpan(); d.className = "soal"; var u = $(".umpan", d); if (u) u.remove(); });
        l.appendChild(r);
        l.appendChild(document.createTextNode(teks));
        d.appendChild(l);
      });
      w.appendChild(d);
    });
    function periksaKuis() {
      var benar = 0, kosong = 0;
      KUIS.forEach(function (s, i) {
        var d = $("#soal" + i);
        var u = $(".umpan", d); if (u) u.remove();
        if (typeof state.kuis[i] !== "number") { kosong++; return; }
        var tepat = state.kuis[i] === s.a;
        if (tepat) benar++;
        d.className = "soal " + (tepat ? "benar" : "salah");
        var e = document.createElement("p");
        e.className = "umpan";
        e.textContent = (tepat ? "Tepat. " : "Belum tepat. ") + s.u;
        d.appendChild(e);
      });
      var h = $("#hasilKuis");
      if (kosong) { h.textContent = "Jawab semua soal dulu."; h.className = "hasil bad"; return; }
      h.textContent = "Skor: " + benar + " dari " + KUIS.length;
      h.className = "hasil " + (benar === KUIS.length ? "ok" : "bad");
      h.textContent += ". Jawaban dikunci.";
      state.kunci.kuis = true; simpan();
      $$("#kuis input").forEach(function (r) { r.disabled = true; });
      $$("#kuis label.opsi").forEach(function (l) { l.classList.add("terkunci"); });
      $("#cekKuis").disabled = true;
    }
    $("#cekKuis").addEventListener("click", periksaKuis);
    if (state.kunci.kuis) periksaKuis();
  }

  // ---------- Ekspor ke Word ----------
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  }
  function isi(s) { return s && String(s).trim() ? esc(s) : "<i>(belum diisi)</i>"; }

  function bangunDokumen() {
    var nama = state.namaKelompok || "";
    var anggota = state.anggota.filter(Boolean);
    var tanggal = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    var h = "";
    h += "<h1>Hasil Misi: Info Viral, Benar atau Hoaks?</h1>";
    h += "<p>Informatika SMP Kelas VII · Dampak Sosial Informatika<br>Tanggal: " + esc(tanggal) + "</p>";

    h += "<h2>1. Identitas Kelompok</h2>";
    h += "<p><b>Nama kelompok:</b> " + isi(nama) + "</p>";
    h += "<table><tr><th>Anggota</th><th>Peran pada misi ini</th></tr>";
    if (anggota.length) {
      anggota.forEach(function (n, i) {
        h += "<tr><td>" + esc(n) + "</td><td>" + esc(NAMA_PERAN[(i + state.offset) % NAMA_PERAN.length]) + "</td></tr>";
      });
    } else {
      h += "<tr><td colspan='2'><i>(belum diisi)</i></td></tr>";
    }
    h += "</table>";

    h += "<h2>2. Jawaban Pertanyaan Pemantik</h2>";
    h += "<p><b>1. Bagian mana dari pesan ini yang membuatmu ragu? Mengapa?</b><br>" + isi(state.jawab.p1) + "</p>";
    h += "<p><b>2. Bagaimana cara kelompokmu memeriksa kebenaran pesan ini?</b><br>" + isi(state.jawab.p2) + "</p>";
    h += "<p><b>3. Apa akibatnya jika pesan ini terus disebarkan?</b><br>" + isi(state.jawab.p3) + "</p>";

    // --- Penilaian tantangan
    var HURUF = ["A", "B", "C", "D"];
    var bCiri = 0, bLang = 0, bKuis = 0;
    CIRI.forEach(function (c, i) { if (state.ciri[i] === c.j) bCiri++; });
    LANGKAH.forEach(function (_, pos) { if (state.langkah && state.langkah[pos] === pos) bLang++; });
    KUIS.forEach(function (s, i) { if (state.kuis[i] === s.a) bKuis++; });
    function nilai(b, n) { return Math.round(b / n * 100); }
    var nA = nilai(bCiri, CIRI.length), nB = nilai(bLang, LANGKAH.length), nC = nilai(bKuis, KUIS.length);
    var rata = Math.round((nA + nB + nC) / 3);

    h += "<h2>3. Hasil dan Nilai Tantangan Interaktif</h2>";
    h += "<table class='nilai'><tr><th>Tantangan</th><th>Benar</th><th>Nilai (0–100)</th></tr>";
    h += "<tr><td>A. Pilah ciri pesan</td><td>" + bCiri + " dari " + CIRI.length + "</td><td>" + nA + "</td></tr>";
    h += "<tr><td>B. Urutkan langkah</td><td>" + bLang + " dari " + LANGKAH.length + "</td><td>" + nB + "</td></tr>";
    h += "<tr><td>C. Kuis cepat</td><td>" + bKuis + " dari " + KUIS.length + "</td><td>" + nC + "</td></tr>";
    h += "<tr><th>Nilai rata-rata</th><th></th><th>" + rata + "</th></tr></table>";

    h += "<p><b>A. Pilah ciri pesan</b></p><table><tr><th>Ciri</th><th>Jawaban kelompok</th><th>Kunci</th><th>Hasil</th></tr>";
    function namaCiri(v) { return v === "ragu" ? "Meragukan" : v === "percaya" ? "Cukup dapat dipercaya" : "(belum dijawab)"; }
    CIRI.forEach(function (c, i) {
      var ok = state.ciri[i] === c.j;
      h += "<tr><td>" + esc(c.t) + "</td><td>" + esc(namaCiri(state.ciri[i])) + "</td><td>" + esc(namaCiri(c.j)) +
        "</td><td class='" + (ok ? "ok" : "no2") + "'>" + (ok ? "Benar" : "Salah") + "</td></tr>";
    });
    h += "</table>";

    h += "<p><b>B. Urutan langkah sebelum membagikan informasi</b></p><table><tr><th>No</th><th>Susunan kelompok</th><th>Hasil</th></tr>";
    LANGKAH.forEach(function (_, pos) {
      var idx = state.langkah ? state.langkah[pos] : null;
      var ok = idx === pos;
      h += "<tr><td>" + (pos + 1) + "</td><td>" + (idx === null ? "<i>(belum diurutkan)</i>" : esc(LANGKAH[idx])) +
        "</td><td class='" + (ok ? "ok" : "no2") + "'>" + (ok ? "Benar" : "Salah") + "</td></tr>";
    });
    h += "</table><p><b>Urutan yang benar:</b></p><ol>";
    LANGKAH.forEach(function (t) { h += "<li>" + esc(t) + "</li>"; });
    h += "</ol>";

    h += "<p><b>C. Kuis cepat</b> (nilai " + nC + ")</p>";
    KUIS.forEach(function (s, i) {
      var jw = state.kuis[i], ok = jw === s.a;
      h += "<div class='soal-p'><p><b>" + (i + 1) + ". " + esc(s.q) + "</b></p>";
      s.o.forEach(function (t, k) {
        var tanda = (k === jw ? " ← jawaban kelompok" : "") + (k === s.a ? " ✓ kunci" : "");
        h += "<p class='opsi-p'>" + HURUF[k] + ". " + esc(t) + (tanda ? "<i>" + tanda + "</i>" : "") + "</p>";
      });
      h += "<p class='opsi-p'>Hasil: <span class='" + (ok ? "ok" : "no2") + "'>" +
        (typeof jw !== "number" ? "Belum dijawab" : ok ? "Benar" : "Salah") + "</span>. Pembahasan: " + esc(s.u) + "</p></div>";
    });

    h += "<h2>4. Lembar Jawaban Kelompok</h2>";
    h += "<p><b>Solusi yang dipilih kelompok</b><br>" + isi(state.jawab.solusi) + "</p>";
    h += "<p><b>Alasan memilih solusi</b><br>" + isi(state.jawab.alasan) + "</p>";
    h += "<p><b>Pesan untuk teman-teman sebelum membagikan informasi</b><br>" + isi(state.jawab.pesan) + "</p>";

    h += "<h2>5. Refleksi</h2>";
    h += "<p><b>Hal yang paling dipelajari</b><br>" + isi(state.jawab.r1) + "</p>";
    h += "<p><b>Bagian yang masih membingungkan</b><br>" + isi(state.jawab.r2) + "</p>";
    h += "<p><b>Kemudahan penggunaan website</b><br>" + isi(state.mudah) + "</p>";

    return "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'><title>Hasil Misi Informatika</title>" +
      "<style>" +
      "@page{size:A4;margin:2.5cm;}" +
      "body{font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4;}" +
      "h1{font-size:18pt;color:#1a3f9e;} h2{font-size:14pt;color:#1a3f9e;margin-top:18pt;}" +
      "table{border-collapse:collapse;width:100%;} th,td{border:1px solid #999;padding:5pt;text-align:left;vertical-align:top;}" +
      "th{background:#e8eefc;}" +
      "</style></head><body>" + h + "</body></html>";
  }

  function namaBerkas() {
    var slug = (state.namaKelompok || "kelompok").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "kelompok";
    return "Hasil-Misi-Info-Viral-" + slug + ".doc";
  }

  // ---------- Unduh PDF (lewat dialog cetak browser) ----------
  function mulaiPdf() {
    var judulAsli = document.title;
    function bersihkan() {
      document.body.classList.remove("cetak-pdf");
      $("#cetak").innerHTML = "";
      document.title = judulAsli;
    }
    window.addEventListener("afterprint", bersihkan);
    $("#btnPdf").addEventListener("click", function () {
      var sem = Object.keys(state.selesai).filter(function (k) { return state.selesai[k]; }).length;
      if (sem < TOTAL) return;
      var html = bangunDokumen();
      var isiBody = html.substring(html.indexOf("<body>") + 6, html.lastIndexOf("</body>"));
      $("#cetak").innerHTML = isiBody;
      document.title = namaBerkas().replace(/\.doc$/, "");
      document.body.classList.add("cetak-pdf");
      var info = $("#infoPdf");
      info.textContent = "Pada jendela cetak, pilih tujuan \"Simpan sebagai PDF\".";
      info.className = "hasil ok";
      setTimeout(function () { window.print(); }, 100);
    });
  }

  // ---------- Tema: otomatis / terang / gelap ----------
  function mulaiTema() {
    var KT = "tema-misi", MODE = ["auto", "terang", "gelap"];
    var NAMA = { auto: "Otomatis", terang: "Terang", gelap: "Gelap" };
    var IKON = { auto: "🌓", terang: "☀️", gelap: "🌙" };
    var btn = $("#tema"), mode = "auto";
    try { var s = localStorage.getItem(KT); if (MODE.indexOf(s) > -1) mode = s; } catch (e) {}
    function terapkan() {
      if (mode === "auto") document.documentElement.removeAttribute("data-tema");
      else document.documentElement.setAttribute("data-tema", mode);
      $(".ti", btn).textContent = IKON[mode];
      $(".tl", btn).textContent = NAMA[mode];
      btn.setAttribute("aria-label", "Tema: " + NAMA[mode] + ". Tekan untuk mengganti.");
      btn.title = "Tema: " + NAMA[mode];
    }
    btn.addEventListener("click", function () {
      mode = MODE[(MODE.indexOf(mode) + 1) % MODE.length];
      try { if (mode === "auto") localStorage.removeItem(KT); else localStorage.setItem(KT, mode); } catch (e) {}
      terapkan();
      var t = $("#toast");
      t.textContent = "Tema: " + NAMA[mode] + (mode === "auto" ? " (mengikuti perangkat)" : "");
      t.classList.add("show");
      clearTimeout(btn._t); btn._t = setTimeout(function () { t.classList.remove("show"); }, 1800);
    });
    terapkan();
  }

  // ---------- Reset ----------
  function mulaiReset() {
    $("#reset").addEventListener("click", function () {
      if (confirm("Hapus semua isian di perangkat ini dan mulai ulang?")) {
        try { localStorage.removeItem(KEY); } catch (e) {}
        location.reload();
      }
    });
  }

  // ---------- Navigasi tahap, toast, auto-scroll ----------
  function mulaiNav() {
    var wadah = $("#steps"), toast = $("#toast"), t;
    function info(m) { toast.textContent = m; toast.classList.add("show"); clearTimeout(t); t = setTimeout(function () { toast.classList.remove("show"); }, 2200); }
    for (var i = 1; i <= TOTAL; i++) {
      var a = document.createElement("a");
      a.href = "#t" + i; a.textContent = i; a.setAttribute("aria-label", "Ke tahap " + i);
      wadah.appendChild(a);
    }
    function perbarui() {
      $$("#steps a").forEach(function (a, k) { a.classList.toggle("done", !!state.selesai[k + 1]); });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            $$("#steps a").forEach(function (a) { a.classList.toggle("aktif", a.getAttribute("href") === "#" + e.target.id); });
          }
        });
      }, { rootMargin: "-35% 0px -55% 0px" });
      $$(".card").forEach(function (c) { io.observe(c); });
    }
    $$("[data-selesai]").forEach(function (b) {
      b.addEventListener("click", function () {
        var no = +b.getAttribute("data-selesai");
        perbarui();
        if (state.selesai[no]) {
          if (no < TOTAL) { info("Tahap " + no + " selesai. Lanjut ke tahap " + (no + 1)); setTimeout(function () { $("#t" + (no + 1)).scrollIntoView({ behavior: "smooth" }); }, 500); }
          else info("Semua tahap selesai!");
        }
      });
    });
    perbarui();
  }

  // ---------- Mulai ----------
  muat();
  aturTombolSelesai();
  mulaiTahap1();
  mulaiIsian();
  mulaiCiri();
  mulaiLangkah();
  mulaiKuis();
  mulaiSalin();
  mulaiReset();
  mulaiNav();
  mulaiTema();
  mulaiPdf();
  updateRekap();
  hitungProgres();
})();

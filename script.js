/*
  MYSTERY BOX — FLIRTY VERSION
  Semua konten yang sering diganti ada di CONFIG.
*/

const CONFIG = {
  music: {
    title: "The World Is Ugly",
    artist: "My Chemical Romance",
    audio: "assets/lagu.mp3",
    cover: "cover.jpeg",
    lyricsTitle: "The World Is Ugly",
    lyrics: `[00:00.00-00:04.50]But you'll never fight alone
[00:04.50-00:06.50]cause i just
[00:06.50-00:10.00]wanted you to know
[00:10.00-00:15.00]that the world is ugly
[00:15.00-00:20.50]but you beautiful to me
[00:20.50-00:26.00]Well are you thinking of me now.`
  },

  finish: {
    title: "oke, sekarang jangan senyum-senyum dulu ya.",
    text: "ayo, scroll kebawah dulu, ada kejutan kecil.",
    words: ["hey", "jangan salting", "pasti lucu", "hehe", "santai", "buka ini"]
  },

  question: {
    title: "kalau aku sayang kamu,<br><em>kamu ngga keberatan kan?</em>",
    text: "jawab jujur ya, aku pengen tau isi hati kamu."
  },

  emailjs: {
    publicKey: "NrGWBxQIGbqh8GdNe",
    serviceId: "service_89pizzh",
    templateId: "template_qetht7c"
  }
};

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const audio = $("#audio");
const cursorHeart = $("#cursorHeart");
let parsedLyrics = [];
let currentLyricIndex = -1;
let heartX = window.innerWidth / 2;
let heartY = window.innerHeight / 2;
let targetHeartX = heartX;
let targetHeartY = heartY;
let heartScale = 0.7;

function updateCursorHeart(clientX, clientY) {
  targetHeartX = clientX;
  targetHeartY = clientY;
  if (!cursorHeart.classList.contains("visible")) cursorHeart.classList.add("visible");
}

function animateCursorHeart() {
  const dx = targetHeartX - heartX;
  const dy = targetHeartY - heartY;
  heartX += dx * 0.18;
  heartY += dy * 0.18;
  heartScale += (((Math.abs(dx) + Math.abs(dy)) > 12) ? 1.02 : 0.98 - heartScale) * 0.18;
  heartScale = Math.min(1.08, Math.max(0.78, heartScale));

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  cursorHeart.style.transform = `translate(${heartX}px, ${heartY}px) scale(${heartScale}) rotate(${angle * 0.18}deg)`;
  requestAnimationFrame(animateCursorHeart);
}

window.addEventListener("pointermove", e => updateCursorHeart(e.clientX, e.clientY));
window.addEventListener("pointerdown", e => {
  updateCursorHeart(e.clientX, e.clientY);
  heartScale = 1.12;
});
window.addEventListener("pointerleave", () => cursorHeart.classList.remove("visible"));
window.addEventListener("touchmove", e => {
  const touch = e.touches[0];
  if (touch) updateCursorHeart(touch.clientX, touch.clientY);
}, { passive: true });
window.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  if (touch) {
    updateCursorHeart(touch.clientX, touch.clientY);
    heartScale = 1.12;
  }
}, { passive: true });

requestAnimationFrame(animateCursorHeart);

function formatTime(sec) {
  if (!Number.isFinite(sec)) return "0:00";
  return `${Math.floor(sec / 60)}:${Math.floor(sec % 60).toString().padStart(2,"0")}`;
}

// Parse simple LRC-like lyrics. Supports:
// 1) [00:12.00]teks
// 2) [00:12.00-00:15.50]teks  -> start and end time, so duration is explicit
// 3) plain text lines without timestamps
// Returns array of {time, end, text}
function parseLRC(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const timeRegex = /\[(\d+):(\d{2}(?:\.\d+)?)\]/g;
  const rangeRegex = /\[(\d+):(\d{2}(?:\.\d+)?)\s*-\s*(\d+):(\d{2}(?:\.\d+)?)\]/g;
  const out = [];

  lines.forEach(line => {
    const rangeMatch = line.match(rangeRegex);
    if (rangeMatch && rangeMatch.length) {
      const match = line.match(/\[(\d+):(\d{2}(?:\.\d+)?)\s*-\s*(\d+):(\d{2}(?:\.\d+)?)\](.*)$/);
      if (match) {
        const start = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
        const end = parseInt(match[3], 10) * 60 + parseFloat(match[4]);
        const textOnly = match[5].trim();
        out.push({ time: start, end, text: textOnly, hasDuration: true });
        return;
      }
    }

    let match;
    const times = [];
    while ((match = timeRegex.exec(line)) !== null) {
      const m = parseInt(match[1], 10);
      const s = parseFloat(match[2]);
      times.push(m * 60 + s);
    }

    const textOnly = line.replace(timeRegex, '').trim();
    if (times.length) {
      times.forEach((t, idx) => {
        const nextTime = times[idx + 1];
        out.push({
          time: t,
          end: nextTime ?? null,
          text: textOnly,
          hasDuration: nextTime !== undefined
        });
      });
    } else {
      out.push({ time: null, end: null, text: line, hasDuration: false });
    }
  });

  out.sort((a, b) => {
    if (a.time === null && b.time === null) return 0;
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time - b.time;
  });

  return out;
}

function renderLyrics(list) {
  const container = $("#lyrics");
  if (!list || !list.length) { container.textContent = CONFIG.music.lyrics; return; }
  container.innerHTML = '';
  list.forEach((L, i) => {
    const div = document.createElement('div');
    div.className = 'lyric-line';
    div.dataset.index = i;
    if (L.time !== null) div.dataset.time = L.time;
    div.textContent = L.text;
    container.appendChild(div);
  });
}

function updateLyrics(currentTime) {
  if (!parsedLyrics || !parsedLyrics.length) return;

  let idx = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    const entry = parsedLyrics[i];
    if (entry.time === null) continue;

    const start = entry.time;
    const end = entry.end ?? Number.POSITIVE_INFINITY;

    if (currentTime >= start && currentTime < end) {
      idx = i;
      break;
    }

    if (currentTime >= start && end === Number.POSITIVE_INFINITY) {
      idx = i;
    }
  }

  if (idx === currentLyricIndex) return;

  if (currentLyricIndex !== -1) {
    const prev = document.querySelector(`.lyric-line[data-index="${currentLyricIndex}"]`);
    if (prev) prev.classList.remove('current');
  }

  if (idx !== -1) {
    const el = document.querySelector(`.lyric-line[data-index="${idx}"]`);
    if (el) {
      el.classList.add('current');
      el.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  currentLyricIndex = idx;
}

// ---------- local data ----------
function initData() {
  $("#coverImage").src = CONFIG.music.cover;
  $("#songTitle").textContent = CONFIG.music.title;
  $("#songArtist").textContent = CONFIG.music.artist;
  $("#lyricsTitle").textContent = CONFIG.music.lyricsTitle;
  // try parse timed lyrics (LRC-like). If none, render plain text.
  parsedLyrics = parseLRC(CONFIG.music.lyrics || '');
  renderLyrics(parsedLyrics.length ? parsedLyrics : null);
  $("#finishTitle").textContent = CONFIG.finish.title;
  $("#finishText").textContent = CONFIG.finish.text;

  $("#questionTitle").innerHTML = CONFIG.question.title;
  $("#questionText").textContent = CONFIG.question.text;

  audio.src = CONFIG.music.audio;
}

// ---------- particles ----------
function spawnParticles() {
  const container = $("#particles");
  const colors = ["#d96d91","#a83c59","#efadc4","#7d2945"];
  for (let i=0;i<28;i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const size = 5 + Math.random()*7;
    p.style.left = `${Math.random()*100}%`;
    p.style.top = `${-40-Math.random()*80}px`;
    p.style.width = `${size}px`;
    p.style.height = `${size*1.5}px`;
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.animationDuration = `${8+Math.random()*10}s`;
    p.style.animationDelay = `${Math.random()*12}s`;
    container.appendChild(p);
  }
}

// ---------- reveal ----------
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, {threshold:.14});

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// ---------- smooth links ----------
document.querySelectorAll("[data-scroll]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(btn.dataset.scroll)?.scrollIntoView({behavior:"smooth"});
  });
});

// ---------- first mystery box ----------
$("#openBox").addEventListener("click", () => {
  $("#player").scrollIntoView({behavior:"smooth"});
});

// ---------- player ----------
$("#playBtn").addEventListener("click", async () => {
  if (audio.paused) {
    try { await audio.play(); }
    catch { alert("Audio belum bisa diputar. Coba tekan play lagi."); }
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", () => $("#playBtn").textContent = "Ⅱ");
audio.addEventListener("pause", () => $("#playBtn").textContent = "▶");

audio.addEventListener("loadedmetadata", () => {
  $("#total").textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  $("#current").textContent = formatTime(audio.currentTime);
  $("#progress").value = (audio.currentTime/audio.duration)*100;
    // update synced lyrics (if any)
    updateLyrics(audio.currentTime);
});

$("#progress").addEventListener("input", e => {
  if (audio.duration) audio.currentTime = audio.duration * (e.target.value/100);
});

$("#backBtn").addEventListener("click", () => {
  audio.currentTime = Math.max(0, audio.currentTime - 10);
});
$("#forwardBtn").addEventListener("click", () => {
  audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
});

// ---------- song finished ----------
audio.addEventListener("ended", () => {
  const section = $("#afterSong");
  section.scrollIntoView({behavior:"smooth"});
  const holder = $("#floatingWords");

  CONFIG.finish.words.forEach((word, i) => {
    const el = document.createElement("span");
    el.textContent = word;
    el.style.left = `${8+Math.random()*84}%`;
    el.style.animationDelay = `${i*.18}s`;
    el.style.animationDuration = `${4+Math.random()*3}s`;
    holder.appendChild(el);
    setTimeout(() => el.remove(), 7500);
  });
});

// ---------- final box ----------
$("#finalBox").addEventListener("click", () => {
  $("#questionModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#senderName").focus(), 100);
});

function closeModal() {
  $("#questionModal").classList.add("hidden");
  document.body.style.overflow = "";
}
$("#closeModal").addEventListener("click", closeModal);
$("#questionModal").addEventListener("click", e => {
  if (e.target.id === "questionModal") closeModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

// ---------- answer ----------
let selectedAnswer = "";
document.querySelectorAll(".answer-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedAnswer = btn.dataset.answer;
    document.querySelectorAll(".answer-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

// ---------- EmailJS ----------
function emailReady() {
  return CONFIG.emailjs.publicKey !== "GANTI_PUBLIC_KEY" &&
         CONFIG.emailjs.serviceId !== "GANTI_SERVICE_ID" &&
         CONFIG.emailjs.templateId !== "GANTI_TEMPLATE_ID";
}

if (emailReady()) emailjs.init({publicKey: CONFIG.emailjs.publicKey});

$("#answerForm").addEventListener("submit", async e => {
  e.preventDefault();

  const name = $("#senderName").value.trim();
  const message = $("#senderMessage").value.trim();
  const status = $("#status");
  const button = $("#sendBtn");

  if (!name) return showStatus("Isi nama kamu dulu.", "error");
  if (!selectedAnswer) return showStatus("Pilih salah satu jawaban dulu.", "error");

  if (!emailReady()) {
    return showStatus("EmailJS belum dikonfigurasi di script.js.", "error");
  }

  button.disabled = true;
  button.textContent = "mengirim...";

  try {
    await emailjs.send(CONFIG.emailjs.serviceId, CONFIG.emailjs.templateId, {
      from_name: name,
      yn_answer: selectedAnswer,
      message: message || "(tidak ada pesan tambahan)",
      to_name: "Kamu",
      reply_to: ""
    });

    showStatus("jawabanmu sudah terkirim.", "success");
    button.textContent = "terkirim";
  } catch (error) {
    console.error(error);
    showStatus("gagal mengirim. cek konfigurasi EmailJS.", "error");
    button.disabled = false;
    button.textContent = "kirim jawaban";
  }
});

function showStatus(text, type) {
  $("#status").textContent = text;
  $("#status").className = `status ${type}`;
}

initData();
spawnParticles();

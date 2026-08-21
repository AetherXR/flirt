FLIRTY MYSTERY BOX

Struktur:
index.html
style.css
script.js
assets/
  lagu.mp3
  cover.jpg
  foto1.jpg
  foto2.jpg
  foto3.jpg

1. Masukkan file audio dan foto ke folder assets.
2. Edit CONFIG di script.js untuk mengganti lagu, cover, lirik, tulisan, foto, dan pertanyaan.
3. Isi Public Key, Service ID, dan Template ID EmailJS.
4. Template EmailJS menerima:
   {{from_name}}
   {{yn_answer}}
   {{message}}
   {{to_name}}
   {{reply_to}}

Flow:
Hero flirty -> mystery box -> web music player -> lyrics -> efek setelah lagu selesai -> 3 foto dengan scroll reveal -> mystery box terakhir -> pertanyaan flirty -> EmailJS.

Versi ini sengaja TIDAK membuat confession/proposal. Tone-nya teasing/flirty saja.

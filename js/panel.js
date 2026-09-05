// Lógica del botón de "un solo toque" para escuchar el audio de un panel.
// No hay autoplay real (los móviles lo bloquean); en su lugar, el primer
// toque del usuario en cualquier parte de la foto inicia la reproducción.
(function () {
  var boton = document.querySelector(".hero-tap");
  var audio = document.getElementById("audio-panel");
  var botonPlay = document.querySelector(".boton-play");
  var texto = document.getElementById("hero-texto");
  var progreso = document.getElementById("hero-progreso");

  if (!boton || !audio) return;

  var TEXTO_INICIAL = texto.textContent;

  function mostrarEstadoReproduciendo() {
    botonPlay.style.display = "none";
    texto.textContent = "Reproduciendo...";
  }

  function mostrarEstadoPausado() {
    botonPlay.style.display = "flex";
    texto.textContent = TEXTO_INICIAL;
  }

  boton.addEventListener("click", function () {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", mostrarEstadoReproduciendo);
  audio.addEventListener("pause", mostrarEstadoPausado);
  audio.addEventListener("ended", mostrarEstadoPausado);

  audio.addEventListener("timeupdate", function () {
    if (!audio.duration) return;
    progreso.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  });
})();

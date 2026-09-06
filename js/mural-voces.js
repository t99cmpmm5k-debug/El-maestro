// Reproductor del mural de voces: cada tarjeta tiene su propio audio, pero
// solo puede sonar uno a la vez (al reproducir uno, se pausan los demás).
(function () {
  var tarjetas = document.querySelectorAll(".tarjeta-voz");
  var reproduciendoActual = null;

  tarjetas.forEach(function (tarjeta) {
    var audio = tarjeta.querySelector("audio");
    var boton = tarjeta.querySelector(".boton-voz");
    if (!audio || !boton) return;

    var iconoPlay = tarjeta.querySelector(".icono-play");
    var iconoPausa = tarjeta.querySelector(".icono-pausa");
    var tiempo = tarjeta.querySelector(".voz-tiempo");
    var tiempoInicial = tiempo.textContent;

    boton.addEventListener("click", function () {
      if (audio.paused) {
        if (reproduciendoActual && reproduciendoActual !== audio) {
          reproduciendoActual.pause();
        }
        audio.play();
        reproduciendoActual = audio;
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", function () {
      iconoPlay.hidden = true;
      iconoPausa.hidden = false;
    });

    function mostrarEstadoPausado() {
      iconoPlay.hidden = false;
      iconoPausa.hidden = true;
      tiempo.textContent = tiempoInicial;
    }

    audio.addEventListener("pause", mostrarEstadoPausado);
    audio.addEventListener("ended", mostrarEstadoPausado);

    audio.addEventListener("timeupdate", function () {
      if (!audio.duration) return;
      var restante = Math.max(0, audio.duration - audio.currentTime);
      var minutos = Math.floor(restante / 60);
      var segundos = Math.floor(restante % 60);
      tiempo.textContent = minutos + ":" + (segundos < 10 ? "0" : "") + segundos;
    });
  });
})();

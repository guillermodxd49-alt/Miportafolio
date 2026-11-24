/* ============================================================
   PORTFOLIO — script.js (JavaScript puro, sin librerías)
   Funciones: tema claro/oscuro, menú móvil, navegación activa,
   animaciones, formulario con Formspree y lightbox accesible.
   ============================================================ */
(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js'); // Activa las animaciones solo si hay JS

  // Compatibilidad con Safari anterior: addEventListener no siempre existe
  function escucharMedia(consulta, callback) {
    if (consulta.addEventListener) consulta.addEventListener('change', callback);
    else if (consulta.addListener) consulta.addListener(callback);
  }

  /* ---------- 1. MODO CLARO / OSCURO ---------- */
  const CLAVE_TEMA = 'portfolio-tema';
  const botonTema = document.getElementById('theme-toggle');
  const metaColor = document.querySelector('meta[name="theme-color"]');
  const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)');

  function leerTema() {
    try { return localStorage.getItem(CLAVE_TEMA); } catch (e) { return null; }
  }

  function guardarTema(valor) {
    try { localStorage.setItem(CLAVE_TEMA, valor); } catch (e) { /* modo privado */ }
  }

  function esOscuro() {
    return root.dataset.theme === 'dark' || (!root.dataset.theme && prefiereOscuro.matches);
  }

  function actualizarTema() {
    const oscuro = esOscuro();
    // La etiqueta queda fija: aria-pressed comunica el estado.
    botonTema.setAttribute('aria-pressed', String(oscuro));
    botonTema.title = oscuro ? 'Activar modo claro' : 'Activar modo oscuro';
    if (metaColor) metaColor.setAttribute('content', oscuro ? '#0d0d0f' : '#f7f5f3');
  }

  const temaGuardado = leerTema();
  if (temaGuardado === 'dark' || temaGuardado === 'light') root.dataset.theme = temaGuardado;
  actualizarTema();

  botonTema.addEventListener('click', function () {
    const nuevo = esOscuro() ? 'light' : 'dark';
    root.dataset.theme = nuevo;
    guardarTema(nuevo);
    actualizarTema();
  });

  // Si el usuario no eligió tema, seguimos su preferencia del sistema
  escucharMedia(prefiereOscuro, function () {
    if (!root.dataset.theme) actualizarTema();
  });

  /* ---------- 2. MENÚ MÓVIL ---------- */
  const botonMenu = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-principal');
  const enlacesNav = nav.querySelectorAll('a');

  function abrirMenu(abrir) {
    nav.classList.toggle('is-open', abrir);
    botonMenu.setAttribute('aria-expanded', String(abrir));
    botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  }

  botonMenu.addEventListener('click', function () {
    const abrir = botonMenu.getAttribute('aria-expanded') !== 'true';
    abrirMenu(abrir);
    if (abrir && enlacesNav.length) enlacesNav[0].focus();
  });

  enlacesNav.forEach(function (enlace) {
    enlace.addEventListener('click', function () { abrirMenu(false); });
  });

  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && nav.classList.contains('is-open')) {
      abrirMenu(false);
      botonMenu.focus();
    }
  });

  document.addEventListener('click', function (evento) {
    if (!nav.contains(evento.target) && !botonMenu.contains(evento.target)) abrirMenu(false);
  });

  const esEscritorio = window.matchMedia('(min-width: 48rem)');
  escucharMedia(esEscritorio, function (evento) {
    if (evento.matches) abrirMenu(false);
  });

  /* ---------- 3. SECCIÓN ACTIVA EN EL MENÚ ---------- */
  const enlacesPorId = {};
  enlacesNav.forEach(function (enlace) {
    enlacesPorId[enlace.getAttribute('href').slice(1)] = enlace;
  });

  function marcarSeccion(id) {
    enlacesNav.forEach(function (enlace) { enlace.removeAttribute('aria-current'); });
    if (enlacesPorId[id]) enlacesPorId[id].setAttribute('aria-current', 'location');
  }

  marcarSeccion('inicio'); // Estado inicial al cargar la página

  if ('IntersectionObserver' in window) {
    const seccionesVisibles = new Set();
    const observadorNav = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) seccionesVisibles.add(entrada.target.id);
        else seccionesVisibles.delete(entrada.target.id);
      });

      // Se limpia antes de marcar para no dejar un enlace "activo" obsoleto
      enlacesNav.forEach(function (enlace) { enlace.removeAttribute('aria-current'); });
      const actual = Object.keys(enlacesPorId).find(function (id) {
        return seccionesVisibles.has(id);
      });
      if (actual) enlacesPorId[actual].setAttribute('aria-current', 'location');
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section[id]').forEach(function (seccion) {
      if (enlacesPorId[seccion.id]) observadorNav.observe(seccion);
    });
  }

  /* ---------- 4. ANIMACIONES DE ENTRADA ---------- */
  const elementosRevelar = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observadorRevelar = new IntersectionObserver(function (entradas, observador) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elementosRevelar.forEach(function (elemento) { observadorRevelar.observe(elemento); });
  } else {
    elementosRevelar.forEach(function (elemento) { elemento.classList.add('is-visible'); });
  }

  /* ---------- 5. FORMULARIO DE CONTACTO (FORMSPREE) ---------- */
  const formulario = document.getElementById('form-contacto');
  const estadoFormulario = document.getElementById('form-estado');
  const botonEnviar = document.getElementById('form-enviar');
  const TEXTO_BOTON = botonEnviar.textContent;
  const PLACEHOLDER_ENDPOINT = '[COMPLETAR';
  let enviando = false;

  function mostrarEstado(mensaje, tipo) {
    estadoFormulario.textContent = mensaje;
    estadoFormulario.classList.remove('form-estado--ok', 'form-estado--error');
    if (tipo) estadoFormulario.classList.add('form-estado--' + tipo);
  }

  const camposValidar = [
    { el: document.getElementById('nombre'), mensaje: 'Ingresá tu nombre.' },
    { el: document.getElementById('email'), mensaje: 'Ingresá un email válido.' },
    { el: document.getElementById('mensaje'), mensaje: 'Contame un poco más (mínimo 10 caracteres).' }
  ];

  function limpiarError(campo) {
    campo.removeAttribute('aria-invalid');
    campo.removeAttribute('aria-describedby');
    const error = campo.parentNode.querySelector('.campo-error');
    if (error) error.remove();
  }

  function marcarError(campo, mensaje) {
    campo.setAttribute('aria-invalid', 'true');
    const id = 'error-' + campo.id;
    campo.setAttribute('aria-describedby', id);
    let error = campo.parentNode.querySelector('.campo-error');
    if (!error) {
      error = document.createElement('p');
      error.className = 'campo-error';
      error.id = id;
      campo.parentNode.appendChild(error);
    }
    error.textContent = mensaje;
  }

  // EDITAR AQUÍ: pegá el endpoint de Formspree real en data-endpoint de index.html
  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();

    // Validación nativa + mensajes accesibles junto a cada campo
    if (!formulario.checkValidity()) {
      camposValidar.forEach(function (item) {
        const demasiadoCorto = item.el.id === 'mensaje' && item.el.value.trim().length < 10;
        if (!item.el.validity.valid || demasiadoCorto) marcarError(item.el, item.mensaje);
        else limpiarError(item.el);
      });
      formulario.reportValidity();
      mostrarEstado('Revisá los campos marcados antes de enviar.', 'error');
      return;
    }

    const endpoint = (formulario.dataset.endpoint || '').trim();
    if (!endpoint || endpoint.indexOf(PLACEHOLDER_ENDPOINT) !== -1) {
      mostrarEstado('El formulario todavía no está habilitado. Escribime por WhatsApp o al correo tiagoguileiv@gmail.com y te respondo.', 'error');
      return;
    }

    // El honeypot va en el cuerpo: si un bot lo completa, no se envía nada
    const datos = new FormData(formulario);
    if (datos.get('_gotcha')) {
      mostrarEstado('Mensaje enviado. Gracias por escribirme.', 'ok');
      formulario.reset();
      return;
    }

    if (enviando) return;
    enviando = true;
    camposValidar.forEach(function (item) { limpiarError(item.el); });

    // No se deshabilita el botón: así no se pierde el foco del teclado
    botonEnviar.setAttribute('aria-disabled', 'true');
    botonEnviar.textContent = 'Enviando…';
    formulario.setAttribute('aria-busy', 'true');
    mostrarEstado('Enviando mensaje…');

    const control = typeof AbortController === 'function' ? new AbortController() : null;
    const temporizador = control ? setTimeout(function () { control.abort(); }, 15000) : null;

    fetch(endpoint, {
      method: 'POST',
      body: datos,
      headers: { 'Accept': 'application/json' },
      signal: control ? control.signal : undefined
    }).then(function (respuesta) {
      if (!respuesta.ok) throw new Error('Error del servidor: ' + respuesta.status);
      mostrarEstado('¡Listo! Tu mensaje llegó. Gracias por escribirme.', 'ok');
      formulario.reset();
      camposValidar.forEach(function (item) { limpiarError(item.el); });
    }).catch(function (error) {
      console.error('No se pudo enviar el formulario:', error);
      mostrarEstado(error.name === 'AbortError'
        ? 'Se agotó el tiempo de espera. Escribime por WhatsApp o al correo tiagoguileiv@gmail.com.'
        : 'No se pudo enviar el mensaje. Escribime por WhatsApp o al correo tiagoguileiv@gmail.com.', 'error');
    }).finally(function () {
      if (temporizador) clearTimeout(temporizador);
      enviando = false;
      botonEnviar.removeAttribute('aria-disabled');
      botonEnviar.textContent = TEXTO_BOTON;
      formulario.removeAttribute('aria-busy');
      botonEnviar.focus();
    });
  });

  // Quita el error del campo en cuanto la persona lo corrige
  camposValidar.forEach(function (item) {
    item.el.addEventListener('input', function () {
      if (item.el.validity.valid) limpiarError(item.el);
      if (estadoFormulario.classList.contains('form-estado--error')) mostrarEstado('');
    });
  });

  /* ---------- 6. LIGHTBOX ACCESIBLE ---------- */
  const lightbox = document.getElementById('lightbox');
  const imagenLightbox = document.getElementById('lightbox-img');
  const tituloLightbox = document.getElementById('lightbox-caption');
  const botonCerrar = document.getElementById('lightbox-cerrar');
  let botonQueAbrio = null;

  function abrirLightbox(boton) {
    botonQueAbrio = boton;
    imagenLightbox.src = boton.dataset.src;
    imagenLightbox.alt = boton.dataset.alt || '';
    const ancho = Number(boton.dataset.width);
    const alto = Number(boton.dataset.height);
    if (ancho > 0 && alto > 0) {
      imagenLightbox.width = ancho;
      imagenLightbox.height = alto;
    }
    tituloLightbox.textContent = boton.dataset.caption || '';
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
    else lightbox.setAttribute('open', '');
    botonCerrar.focus();
  }

  document.querySelectorAll('[data-lightbox]').forEach(function (boton) {
    boton.addEventListener('click', function () { abrirLightbox(boton); });
  });

  function finalizarCierre() {
    if (botonQueAbrio) {
      botonQueAbrio.focus();
      botonQueAbrio = null;
    }
    // Mantiene una imagen válida (transparente) cuando está cerrado
    imagenLightbox.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    imagenLightbox.alt = '';
    tituloLightbox.textContent = '';
  }

  function cerrarLightbox() {
    if (typeof lightbox.close === 'function' && lightbox.open) lightbox.close();
    else {
      lightbox.removeAttribute('open');
      finalizarCierre(); // El fallback no dispara el evento "close"
    }
  }

  botonCerrar.addEventListener('click', cerrarLightbox);

  lightbox.addEventListener('click', function (evento) {
    // Cerrar al tocar el fondo oscuro (no la imagen ni el botón)
    if (evento.target === lightbox) cerrarLightbox();
  });

  // Esc funciona también en navegadores sin soporte completo de <dialog>
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && lightbox.open) cerrarLightbox();
  });

  lightbox.addEventListener('close', finalizarCierre);

  /* ---------- 7. ENLACES PENDIENTES DE COMPLETAR ---------- */
  const estadoPie = document.getElementById('footer-estado');

  document.querySelectorAll('[data-placeholder]').forEach(function (enlace) {
    enlace.addEventListener('click', function (evento) {
      evento.preventDefault(); // Evita que el "#" lleve arriba de la página
      const aviso = 'Pendiente: completa el enlace (' + enlace.dataset.placeholder +
                    ') con tu URL real en index.html.';
      enlace.title = aviso;

      if (enlace.closest('.site-footer')) {
        estadoPie.textContent = aviso;
      } else {
        let avisoLocal = enlace.parentNode.querySelector('.aviso-inline');
        if (!avisoLocal) {
          avisoLocal = document.createElement('p');
          avisoLocal.className = 'form-estado aviso-inline';
          avisoLocal.setAttribute('role', 'status');
          enlace.parentNode.appendChild(avisoLocal);
        }
        avisoLocal.textContent = aviso;
      }
    });
  });

  /* ---------- 8. AÑO DEL PIE DE PÁGINA ---------- */
  document.getElementById('anio').textContent = String(new Date().getFullYear());
})();

/* ============================================================
   PORTFOLIO — script.js (JavaScript puro, sin librerías)
   Funciones: tema claro/oscuro, menú móvil, navegación activa,
   animaciones de entrada, formulario y enlaces pendientes.
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
    botonTema.setAttribute('aria-pressed', String(oscuro));
    botonTema.setAttribute('aria-label', oscuro ? 'Activar modo claro' : 'Activar modo oscuro');
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
    const observadorNav = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) marcarSeccion(entrada.target.id);
      });
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

  /* ---------- 5. FORMULARIO DE CONTACTO ---------- */
  const formulario = document.getElementById('form-contacto');
  const estadoFormulario = document.getElementById('form-estado');
  const CORREO = 'guillermosesion12@gmail.com'; // CAMBIAR si cambia tu email

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault(); // Evita el envío mailto básico del atributo action

    if (!formulario.checkValidity()) {
      formulario.reportValidity();
      return;
    }

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    const asunto = 'Mensaje desde el portfolio: ' + nombre;
    const cuerpo = 'Nombre: ' + nombre + '\nEmail: ' + email + '\n\n' + mensaje;
    const enlace = 'mailto:' + CORREO + '?subject=' + encodeURIComponent(asunto) +
                   '&body=' + encodeURIComponent(cuerpo);

    estadoFormulario.textContent = 'Se está abriendo tu correo. Si no se abre, escribime directamente a ' + CORREO;
    window.location.href = enlace;
  });

  /* ---------- 6. ENLACES PENDIENTES DE COMPLETAR ---------- */
  const estadoPie = document.getElementById('footer-estado');

  document.querySelectorAll('[data-placeholder]').forEach(function (enlace) {
    enlace.addEventListener('click', function (evento) {
      evento.preventDefault(); // Evita que el "#" lleve arriba de la página
      const aviso = 'Pendiente: completa el enlace (' + enlace.dataset.placeholder +
                    ') con tu URL real en index.html.';
      enlace.title = aviso;

      if (enlace.closest('.site-footer')) {
        // En el pie ya existe una región de estado: la reutilizamos
        estadoPie.textContent = aviso;
      } else {
        // En las tarjetas mostramos el aviso junto al botón (un solo anuncio)
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

  /* ---------- 7. AÑO DEL PIE DE PÁGINA ---------- */
  document.getElementById('anio').textContent = String(new Date().getFullYear());
})();

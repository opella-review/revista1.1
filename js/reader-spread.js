(() => {
  'use strict';

  const TOTAL_PAGES = 16;
  const PAGE_RATIO = 1280 / 1437;
  const TURN_MS = 860;
  const SINGLE_TURN_MS = 740;

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;
  const DOUBLE_TAP_ZOOM = 2.15;

  const pagePath = (n) => `pages/page-${String(n).padStart(2, '0')}.webp`;
  const thumbPath = (n) => `thumbs/page-${String(n).padStart(2, '0')}.webp`;

  const el = {
    openReaderBtn: document.getElementById('openReaderBtn'),
    readerSection: document.getElementById('revista'),
    readerShell: document.getElementById('readerShell'),
    readerCanvas: document.getElementById('readerCanvas'),
    pageStage: document.getElementById('pageStage'),

    singleView: document.getElementById('singleView'),
    singleBackLayer: document.getElementById('singleBackLayer'),
    singleFrontLayer: document.getElementById('singleFrontLayer'),
    singleBackPage: document.getElementById('singleBackPage'),
    singleFrontPage: document.getElementById('singleFrontPage'),

    spreadView: document.getElementById('spreadView'),
    leftLayer: document.getElementById('leftLayer'),
    rightLayer: document.getElementById('rightLayer'),
    rightUnderLayer: document.getElementById('rightUnderLayer'),
    turningLeaf: document.getElementById('turningLeaf'),

    leftPage: document.getElementById('leftPage'),
    rightPage: document.getElementById('rightPage'),
    rightUnderPage: document.getElementById('rightUnderPage'),
    turnFrontPage: document.getElementById('turnFrontPage'),
    turnBackPage: document.getElementById('turnBackPage'),

    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pageIndicator: document.getElementById('pageIndicator'),

    thumbsBtn: document.getElementById('thumbsBtn'),
    closeThumbsBtn: document.getElementById('closeThumbsBtn'),
    thumbDrawer: document.getElementById('thumbDrawer'),
    thumbGrid: document.getElementById('thumbGrid'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),

    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomResetBtn: document.getElementById('zoomResetBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    swipeHint: document.getElementById('swipeHint')
  };

  let currentPage = 1;
  let animating = false;
  let focusMode = false;
  let savedScrollY = 0;

  let zoomScale = 1;
  let panX = 0;
  let panY = 0;

  let mousePanStart = null;
  let touchStart = null;
  let pinchStart = null;
  let lastTap = { time: 0, x: 0, y: 0 };
  let resizeTimer = null;

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
  const isReadingMode = () => document.fullscreenElement === el.readerShell || focusMode;
  const readerHasFocus = () => isReadingMode() || el.readerShell.contains(document.activeElement);

  function normalizeDesktopPage(page) {
    const p = Math.max(1, Math.min(TOTAL_PAGES, Number(page) || 1));
    if (p === 1 || p === TOTAL_PAGES) return p;
    return p % 2 === 0 ? p : p - 1;
  }

  function viewFor(page = currentPage) {
    if (isMobile()) {
      const p = Math.max(1, Math.min(TOTAL_PAGES, Number(page) || 1));
      return { type: 'single', pages: [p], anchor: p };
    }

    const p = normalizeDesktopPage(page);

    if (p === 1 || p === TOTAL_PAGES) {
      return { type: 'single', pages: [p], anchor: p };
    }

    return {
      type: 'spread',
      pages: [p, p + 1],
      anchor: p
    };
  }

  function nextAnchor(page = currentPage) {
    if (isMobile()) return Math.min(TOTAL_PAGES, page + 1);

    const p = normalizeDesktopPage(page);
    if (p === 1) return 2;
    if (p >= 14) return 16;
    return p + 2;
  }

  function prevAnchor(page = currentPage) {
    if (isMobile()) return Math.max(1, page - 1);

    const p = normalizeDesktopPage(page);
    if (p === 16) return 14;
    if (p <= 2) return 1;
    return p - 2;
  }

  function isAtStart() {
    return currentPage <= 1;
  }

  function isAtEnd() {
    if (isMobile()) return currentPage >= TOTAL_PAGES;
    return normalizeDesktopPage(currentPage) >= TOTAL_PAGES;
  }

  function setImg(img, page, alt = true) {
    if (!page) {
      img.removeAttribute('src');
      img.alt = '';
      return;
    }
    img.src = pagePath(page);
    img.alt = alt
      ? (page === 1
          ? 'Portada de Opella Winter Evolution'
          : page === TOTAL_PAGES
            ? 'Contraportada de Opella Winter Evolution'
            : `Página ${page} de Opella Winter Evolution`)
      : '';
  }

  function prefetch(page) {
    if (page < 1 || page > TOTAL_PAGES) return;
    const img = new Image();
    img.src = pagePath(page);
  }

  function canvasAvailableSize() {
    const style = window.getComputedStyle(el.readerCanvas);
    const px =
      parseFloat(style.paddingLeft || 0) +
      parseFloat(style.paddingRight || 0);

    const py =
      parseFloat(style.paddingTop || 0) +
      parseFloat(style.paddingBottom || 0);

    return {
      width: Math.max(1, el.readerCanvas.clientWidth - px),
      height: Math.max(1, el.readerCanvas.clientHeight - py)
    };
  }

  function fitStage(view = viewFor(currentPage)) {
    const available = canvasAvailableSize();
    const mobile = isMobile();

    const marginX = mobile ? 22 : 58;
    const marginY = mobile ? 78 : 48;

    const maxW = Math.max(220, available.width - marginX);
    const maxH = Math.max(220, available.height - marginY);

    const ratio = view.type === 'spread'
      ? PAGE_RATIO * 2
      : PAGE_RATIO;

    let width = maxW;
    let height = width / ratio;

    if (height > maxH) {
      height = maxH;
      width = height * ratio;
    }

    el.pageStage.style.width = `${Math.floor(width)}px`;
    el.pageStage.style.height = `${Math.floor(height)}px`;
  }

  function activePages() {
    return viewFor(currentPage).pages;
  }

  function updateIndicator() {
    const view = viewFor(currentPage);

    if (view.pages.length === 1 && view.pages[0] === 1) {
      el.pageIndicator.textContent = `Portada · 1 / ${TOTAL_PAGES}`;
      return;
    }

    if (view.pages.length === 1 && view.pages[0] === TOTAL_PAGES) {
      el.pageIndicator.textContent = `Contraportada · ${TOTAL_PAGES} / ${TOTAL_PAGES}`;
      return;
    }

    if (view.pages.length === 1) {
      el.pageIndicator.textContent = `${view.pages[0]} / ${TOTAL_PAGES}`;
      return;
    }

    el.pageIndicator.textContent = `${view.pages[0]}–${view.pages[1]} / ${TOTAL_PAGES}`;
  }

  function updateThumbs() {
    const visible = activePages();

    el.thumbGrid.querySelectorAll('.thumb').forEach((button) => {
      const n = Number(button.dataset.page);
      button.classList.toggle('active', visible.includes(n));
    });
  }

  function updateControls() {
    updateIndicator();

    el.prevBtn.disabled = isAtStart() || animating;
    el.nextBtn.disabled = isAtEnd() || animating;

    el.zoomResetBtn.textContent = `${Math.round(zoomScale * 100)}%`;
    el.zoomOutBtn.disabled = zoomScale <= MIN_ZOOM + 0.001;
    el.zoomInBtn.disabled = zoomScale >= MAX_ZOOM - 0.001;

    updateThumbs();
  }

  function clampPan() {
    if (zoomScale <= 1.001) {
      panX = 0;
      panY = 0;
      return;
    }

    const canvas = canvasAvailableSize();
    const stageW = el.pageStage.offsetWidth;
    const stageH = el.pageStage.offsetHeight;

    const maxX = Math.max(0, ((stageW * zoomScale) - canvas.width) / 2);
    const maxY = Math.max(0, ((stageH * zoomScale) - canvas.height) / 2);

    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
  }

  function applyZoom(animate = false) {
    clampPan();

    el.pageStage.classList.toggle('zoom-animate', animate);
    el.pageStage.style.setProperty('--zoom', zoomScale.toFixed(4));
    el.pageStage.style.setProperty('--pan-x', `${panX.toFixed(2)}px`);
    el.pageStage.style.setProperty('--pan-y', `${panY.toFixed(2)}px`);

    el.readerCanvas.classList.toggle('is-zoomed', zoomScale > 1.01);

    updateControls();

    if (animate) {
      window.setTimeout(() => {
        el.pageStage.classList.remove('zoom-animate');
      }, 220);
    }
  }

  function resetZoom(animate = false) {
    zoomScale = 1;
    panX = 0;
    panY = 0;
    mousePanStart = null;
    pinchStart = null;

    el.readerCanvas.classList.remove('is-panning');

    applyZoom(animate);
  }

  function zoomAt(clientX, clientY, targetScale, animate = false) {
    const rect = el.readerCanvas.getBoundingClientRect();

    const pointX = clientX - (rect.left + rect.width / 2);
    const pointY = clientY - (rect.top + rect.height / 2);

    const oldScale = zoomScale;
    const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetScale));

    if (Math.abs(nextScale - oldScale) < 0.001) return;

    panX = pointX - (nextScale * (pointX - panX) / oldScale);
    panY = pointY - (nextScale * (pointY - panY) / oldScale);

    zoomScale = nextScale;
    applyZoom(animate);
  }

  function setZoom(targetScale) {
    if (targetScale <= MIN_ZOOM + 0.001) {
      resetZoom(true);
      return;
    }

    const rect = el.readerCanvas.getBoundingClientRect();

    zoomAt(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      targetScale,
      true
    );
  }

  function clearAnimationClasses() {
    el.singleFrontLayer.classList.remove('single-turn-forward', 'single-turn-backward');
    el.singleBackLayer.classList.remove('single-reveal');
    el.singleBackLayer.style.visibility = '';

    el.turningLeaf.classList.remove('is-active', 'turn-forward', 'turn-backward');
    el.rightUnderLayer.classList.remove('is-visible');
  }

  function render(page = currentPage, preserveZoom = false) {
    const view = viewFor(page);
    currentPage = view.anchor;

    clearAnimationClasses();

    if (view.type === 'single') {
      el.singleView.hidden = false;
      el.spreadView.hidden = true;

      setImg(el.singleFrontPage, view.pages[0]);
      setImg(el.singleBackPage, view.pages[0], false);
    } else {
      el.singleView.hidden = true;
      el.spreadView.hidden = false;

      setImg(el.leftPage, view.pages[0]);
      setImg(el.rightPage, view.pages[1]);

      setImg(el.rightUnderPage, null, false);
      setImg(el.turnFrontPage, null, false);
      setImg(el.turnBackPage, null, false);
    }

    fitStage(view);

    if (!preserveZoom) {
      resetZoom(false);
    } else {
      applyZoom(false);
    }

    updateControls();

    const n = view.anchor;
    for (let p = n - 2; p <= n + 3; p += 1) {
      prefetch(p);
    }
  }

  function animateSingleTo(targetPage, direction) {
    if (animating) return;

    const targetView = viewFor(targetPage);

    if (targetView.type !== 'single') {
      /* Portada -> primer pliego: preparamos el pliego detrás de la portada. */
      const current = viewFor(currentPage);

      if (current.type === 'single' && targetView.type === 'spread') {
        animating = true;
        if (zoomScale > 1.01) resetZoom(false);

        /* La portada/contraportada conserva su tamaño individual mientras gira.
           Al terminar, aparece el pliego completo. Así evitamos estirarla al doble. */
        el.singleView.hidden = false;
        el.spreadView.hidden = true;

        setImg(el.singleFrontPage, current.pages[0]);
        setImg(el.singleBackPage, null, false);
        el.singleBackLayer.style.visibility = 'hidden';

        fitStage(current);

        requestAnimationFrame(() => {
          el.singleFrontLayer.classList.add(
            direction === 'next' ? 'single-turn-forward' : 'single-turn-backward'
          );
        });

        window.setTimeout(() => {
          animating = false;
          currentPage = targetView.anchor;
          render(currentPage);
        }, SINGLE_TURN_MS + 30);

        updateControls();
        return;
      }
    }

    animating = true;
    if (zoomScale > 1.01) resetZoom(false);

    const currentView = viewFor(currentPage);

    setImg(el.singleFrontPage, currentView.pages[0]);
    setImg(el.singleBackPage, targetView.pages[0]);

    el.singleView.hidden = false;
    el.spreadView.hidden = true;
    fitStage(targetView);

    requestAnimationFrame(() => {
      el.singleBackLayer.classList.add('single-reveal');
      el.singleFrontLayer.classList.add(
        direction === 'next' ? 'single-turn-forward' : 'single-turn-backward'
      );
    });

    window.setTimeout(() => {
      animating = false;
      currentPage = targetView.anchor;
      render(currentPage);
    }, SINGLE_TURN_MS + 30);

    updateControls();
  }

  function animateSpreadForward(targetAnchor) {
    const currentView = viewFor(currentPage);
    const targetView = viewFor(targetAnchor);

    if (currentView.type !== 'spread') {
      animateSingleTo(targetAnchor, 'next');
      return;
    }

    /* Último pliego -> contraportada:
       la hoja derecha 15 gira; al terminar aparece la contraportada. */
    if (targetView.type === 'single') {
      animating = true;
      if (zoomScale > 1.01) resetZoom(false);

      setImg(el.turnFrontPage, currentView.pages[1]);
      setImg(el.turnBackPage, targetView.pages[0]);
      setImg(el.rightUnderPage, targetView.pages[0], false);

      el.rightUnderLayer.classList.add('is-visible');
      el.turningLeaf.classList.add('is-active');

      requestAnimationFrame(() => {
        el.turningLeaf.classList.add('turn-forward');
      });

      window.setTimeout(() => {
        animating = false;
        currentPage = targetView.anchor;
        render(currentPage);
      }, TURN_MS + 30);

      updateControls();
      return;
    }

    animating = true;
    if (zoomScale > 1.01) resetZoom(false);

    /* Ejemplo 2–3 -> 4–5:
       - página 3 es el frente de la hoja que gira;
       - página 4 es el reverso de esa misma hoja;
       - página 5 ya está debajo, a la derecha.
       Sólo la hoja derecha se mueve. */
    setImg(el.turnFrontPage, currentView.pages[1]);
    setImg(el.turnBackPage, targetView.pages[0]);
    setImg(el.rightUnderPage, targetView.pages[1]);

    el.rightUnderLayer.classList.add('is-visible');
    el.turningLeaf.classList.add('is-active');

    requestAnimationFrame(() => {
      el.turningLeaf.classList.add('turn-forward');
    });

    window.setTimeout(() => {
      animating = false;
      currentPage = targetView.anchor;
      render(currentPage);
    }, TURN_MS + 30);

    updateControls();
  }

  function animateSpreadBackward(targetAnchor) {
    const currentView = viewFor(currentPage);
    const targetView = viewFor(targetAnchor);

    if (currentView.type !== 'spread') {
      /* Contraportada -> último pliego */
      if (currentView.type === 'single' && targetView.type === 'spread') {
        /* La contraportada es una hoja individual: gira como tal y después reaparece el libro abierto. */
        animateSingleTo(targetAnchor, 'prev');
        return;
      }

      animateSingleTo(targetAnchor, 'prev');
      return;
    }

    if (targetView.type === 'single') {
      /* Primer pliego -> portada. La portada es la excepción individual. */
      animateSingleTo(targetAnchor, 'prev');
      return;
    }

    animating = true;
    if (zoomScale > 1.01) resetZoom(false);

    /* Ejemplo 4–5 -> 2–3:
       La página 3 (derecha objetivo) entra desde el lomo.
       En el reverso lleva la página 4 (izquierda actual).
       La página 2 queda revelada debajo a la izquierda.
       El elemento animado sigue siendo una única hoja. */
    setImg(el.leftPage, targetView.pages[0]);
    setImg(el.rightPage, currentView.pages[1]);

    setImg(el.turnFrontPage, targetView.pages[1]);
    setImg(el.turnBackPage, currentView.pages[0]);

    el.turningLeaf.classList.add('is-active', 'turn-backward');

    window.setTimeout(() => {
      animating = false;
      currentPage = targetView.anchor;
      render(currentPage);
    }, TURN_MS + 30);

    updateControls();
  }

  function nextPage() {
    if (animating || isAtEnd()) return;

    const target = nextAnchor(currentPage);

    if (isMobile()) {
      animateSingleTo(target, 'next');
      return;
    }

    const currentView = viewFor(currentPage);

    if (currentView.type === 'single') {
      animateSingleTo(target, 'next');
    } else {
      animateSpreadForward(target);
    }
  }

  function prevPage() {
    if (animating || isAtStart()) return;

    const target = prevAnchor(currentPage);

    if (isMobile()) {
      animateSingleTo(target, 'prev');
      return;
    }

    const currentView = viewFor(currentPage);

    if (currentView.type === 'single' && currentPage === TOTAL_PAGES) {
      animateSpreadBackward(target);
    } else if (currentView.type === 'single') {
      animateSingleTo(target, 'prev');
    } else {
      animateSpreadBackward(target);
    }
  }

  function goToPage(page) {
    if (animating) return;

    const requested = Math.max(1, Math.min(TOTAL_PAGES, Number(page) || 1));
    currentPage = isMobile() ? requested : normalizeDesktopPage(requested);

    closeDrawer();
    resetZoom(false);
    render(currentPage);

    el.readerCanvas.focus({ preventScroll: true });
  }

  function buildThumbnails() {
    const frag = document.createDocumentFragment();

    for (let n = 1; n <= TOTAL_PAGES; n += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'thumb portrait';
      button.dataset.page = String(n);

      button.setAttribute(
        'aria-label',
        n === 1
          ? 'Ir a portada'
          : n === TOTAL_PAGES
            ? 'Ir a contraportada'
            : `Ir a página ${n}`
      );

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.src = thumbPath(n);
      img.alt = '';

      const label = document.createElement('span');
      label.textContent =
        n === 1
          ? 'Portada'
          : n === TOTAL_PAGES
            ? 'Contraportada'
            : `Página ${n}`;

      button.append(img, label);
      button.addEventListener('click', () => goToPage(n));
      frag.append(button);
    }

    el.thumbGrid.append(frag);
  }

  function openDrawer() {
    el.thumbDrawer.classList.add('open');
    el.drawerBackdrop.classList.add('open');
    el.thumbDrawer.setAttribute('aria-hidden', 'false');

    const active = el.thumbGrid.querySelector('.thumb.active');
    if (active) active.scrollIntoView({ block: 'center' });
  }

  function closeDrawer() {
    el.thumbDrawer.classList.remove('open');
    el.drawerBackdrop.classList.remove('open');
    el.thumbDrawer.setAttribute('aria-hidden', 'true');
  }

  function lockScroll() {
    savedScrollY = window.scrollY || 0;
    document.body.classList.add('reader-focus-active');
  }

  function unlockScroll() {
    document.body.classList.remove('reader-focus-active');
    window.scrollTo(0, savedScrollY);
  }

  function enterFocusMode() {
    focusMode = true;
    el.readerShell.classList.add('reading-active');

    lockScroll();

    el.fullscreenBtn.setAttribute('title', 'Salir de pantalla completa');
    el.fullscreenBtn.setAttribute('aria-label', 'Salir de pantalla completa');

    window.setTimeout(() => fitStage(viewFor(currentPage)), 60);
  }

  function exitFocusMode() {
    focusMode = false;
    el.readerShell.classList.remove('reading-active');

    unlockScroll();
    resetZoom(false);

    el.fullscreenBtn.setAttribute('title', 'Pantalla completa');
    el.fullscreenBtn.setAttribute('aria-label', 'Pantalla completa');

    window.setTimeout(() => fitStage(viewFor(currentPage)), 60);
  }

  async function toggleFullscreen() {
    if (focusMode) {
      exitFocusMode();
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (
      document.fullscreenEnabled &&
      typeof el.readerShell.requestFullscreen === 'function'
    ) {
      try {
        await el.readerShell.requestFullscreen();
        return;
      } catch (_) {
        /* Fallback debajo */
      }
    }

    enterFocusMode();
  }

  function openReader() {
    el.readerSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    window.setTimeout(() => {
      el.readerCanvas.focus({ preventScroll: true });
    }, 650);
  }

  function distance(a, b) {
    return Math.hypot(
      b.clientX - a.clientX,
      b.clientY - a.clientY
    );
  }

  function midpoint(a, b) {
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2
    };
  }

  function handleDoubleTap(x, y) {
    const now = Date.now();

    const near = Math.hypot(
      x - lastTap.x,
      y - lastTap.y
    ) < 46;

    if (
      now - lastTap.time < 320 &&
      near
    ) {
      if (zoomScale > 1.01) {
        resetZoom(true);
      } else {
        zoomAt(x, y, DOUBLE_TAP_ZOOM, true);
      }

      lastTap = { time: 0, x: 0, y: 0 };
    } else {
      lastTap = { time: now, x, y };
    }
  }

  el.openReaderBtn.addEventListener('click', openReader);
  el.prevBtn.addEventListener('click', prevPage);
  el.nextBtn.addEventListener('click', nextPage);
  el.pageIndicator.addEventListener('click', openDrawer);

  el.thumbsBtn.addEventListener('click', openDrawer);
  el.closeThumbsBtn.addEventListener('click', closeDrawer);
  el.drawerBackdrop.addEventListener('click', closeDrawer);

  el.zoomOutBtn.addEventListener('click', () => setZoom(zoomScale - ZOOM_STEP));
  el.zoomResetBtn.addEventListener('click', () => resetZoom(true));
  el.zoomInBtn.addEventListener('click', () => setZoom(zoomScale + ZOOM_STEP));

  el.fullscreenBtn.addEventListener('click', toggleFullscreen);

  el.readerCanvas.addEventListener('mousedown', (event) => {
    if (
      zoomScale <= 1.01 ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    mousePanStart = {
      x: event.clientX,
      y: event.clientY,
      panX,
      panY
    };

    el.readerCanvas.classList.add('is-panning');
  });

  window.addEventListener('mousemove', (event) => {
    if (!mousePanStart) return;

    panX =
      mousePanStart.panX +
      (event.clientX - mousePanStart.x);

    panY =
      mousePanStart.panY +
      (event.clientY - mousePanStart.y);

    applyZoom(false);
  });

  window.addEventListener('mouseup', () => {
    mousePanStart = null;
    el.readerCanvas.classList.remove('is-panning');
  });

  el.readerCanvas.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) {
      if (!isReadingMode()) return;

      const a = event.touches[0];
      const b = event.touches[1];
      const mid = midpoint(a, b);

      pinchStart = {
        distance: distance(a, b),
        scale: zoomScale,
        panX,
        panY,
        midX: mid.x,
        midY: mid.y
      };

      touchStart = null;
      event.preventDefault();
      return;
    }

    if (event.touches.length !== 1) return;

    const t = event.touches[0];

    touchStart = {
      x: t.clientX,
      y: t.clientY,
      time: Date.now(),
      panX,
      panY
    };
  }, { passive: false });

  el.readerCanvas.addEventListener('touchmove', (event) => {
    if (
      event.touches.length === 2 &&
      pinchStart
    ) {
      if (isReadingMode()) event.preventDefault();

      const a = event.touches[0];
      const b = event.touches[1];
      const mid = midpoint(a, b);

      const ratio =
        distance(a, b) /
        Math.max(1, pinchStart.distance);

      zoomScale = Math.max(
        MIN_ZOOM,
        Math.min(
          MAX_ZOOM,
          pinchStart.scale * ratio
        )
      );

      panX =
        pinchStart.panX +
        (mid.x - pinchStart.midX);

      panY =
        pinchStart.panY +
        (mid.y - pinchStart.midY);

      applyZoom(false);
      return;
    }

    if (
      event.touches.length === 1 &&
      zoomScale > 1.01 &&
      touchStart
    ) {
      if (isReadingMode()) event.preventDefault();

      const t = event.touches[0];

      panX =
        touchStart.panX +
        (t.clientX - touchStart.x);

      panY =
        touchStart.panY +
        (t.clientY - touchStart.y);

      applyZoom(false);
    }
  }, { passive: false });

  el.readerCanvas.addEventListener('touchend', (event) => {
    if (pinchStart) {
      if (event.touches.length < 2) {
        pinchStart = null;
      }

      if (zoomScale < 1.04) {
        resetZoom(true);
      }

      return;
    }

    if (
      !touchStart ||
      !event.changedTouches.length
    ) {
      return;
    }

    const t = event.changedTouches[0];

    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const elapsed = Date.now() - touchStart.time;
    const moved = Math.hypot(dx, dy);
    const wasZoomed = zoomScale > 1.01;

    touchStart = null;

    if (wasZoomed) {
      if (
        moved < 12 &&
        elapsed < 280
      ) {
        handleDoubleTap(t.clientX, t.clientY);
      }

      return;
    }

    if (
      Math.abs(dx) > 48 &&
      Math.abs(dx) > Math.abs(dy) * 1.15
    ) {
      dx < 0 ? nextPage() : prevPage();
      return;
    }

    if (
      moved < 12 &&
      elapsed < 280
    ) {
      handleDoubleTap(t.clientX, t.clientY);
    }
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (!readerHasFocus()) return;

    if (
      event.key === 'ArrowRight' ||
      event.key === 'PageDown'
    ) {
      event.preventDefault();
      nextPage();
    } else if (
      event.key === 'ArrowLeft' ||
      event.key === 'PageUp'
    ) {
      event.preventDefault();
      prevPage();
    } else if (
      event.key === '+' ||
      event.key === '='
    ) {
      event.preventDefault();
      setZoom(zoomScale + ZOOM_STEP);
    } else if (
      event.key === '-'
    ) {
      event.preventDefault();
      setZoom(zoomScale - ZOOM_STEP);
    } else if (
      event.key === '0'
    ) {
      event.preventDefault();
      resetZoom(true);
    } else if (
      event.key === 'Escape' &&
      el.thumbDrawer.classList.contains('open')
    ) {
      closeDrawer();
    } else if (
      event.key === 'Escape' &&
      focusMode
    ) {
      exitFocusMode();
    }
  });

  function handleResize() {
    clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
      const previous = currentPage;

      if (!isMobile()) {
        currentPage = normalizeDesktopPage(previous);
      }

      render(currentPage);
    }, 140);
  }

  window.addEventListener('resize', handleResize);

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  }

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === el.readerShell) {
      el.readerShell.classList.add('reading-active');

      el.fullscreenBtn.setAttribute(
        'title',
        'Salir de pantalla completa'
      );

      el.fullscreenBtn.setAttribute(
        'aria-label',
        'Salir de pantalla completa'
      );
    } else if (!focusMode) {
      el.readerShell.classList.remove('reading-active');

      el.fullscreenBtn.setAttribute(
        'title',
        'Pantalla completa'
      );

      el.fullscreenBtn.setAttribute(
        'aria-label',
        'Pantalla completa'
      );

      resetZoom(false);
    }

    window.setTimeout(() => {
      fitStage(viewFor(currentPage));
    }, 80);
  });

  buildThumbnails();
  render(1);
})();

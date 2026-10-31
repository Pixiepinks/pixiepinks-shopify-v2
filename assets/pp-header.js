/* Shopify owns routing and commerce; this module only manages disclosure UI. */
class PPMenu extends HTMLElement {
  connectedCallback() {
    this.controller?.abort();
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };
    this.dialog = this.querySelector('dialog');
    this.toggle = this.querySelector('.pp-menu__toggle');
    this.toggle.addEventListener('click', () => {
      this.dialog.showModal();
      this.toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('pp-menu-open');
    }, options);
    this.querySelector('.pp-menu__close').addEventListener('click', () => this.dialog.close(), options);
    this.dialog.addEventListener('click', (event) => {
      if (event.target !== this.dialog) return;
      const bounds = this.dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) this.dialog.close();
    }, options);
    this.dialog.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const items = getFocusableElements(this.dialog).filter((item) => item.getClientRects().length);
      const first = items[0];
      const last = items[items.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    }, options);
    this.dialog.addEventListener('close', () => {
      document.body.classList.remove('pp-menu-open');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.toggle.focus();
    }, options);
    this.desktop = window.matchMedia('(min-width: 990px)');
    this.desktop.addEventListener('change', () => { if (this.desktop.matches && this.dialog.open) this.dialog.close(); }, options);
  }
  disconnectedCallback() {
    if (this.dialog?.open) this.dialog.close();
    document.body.classList.remove('pp-menu-open');
    this.controller?.abort();
  }
}
if (!customElements.get('pp-menu')) customElements.define('pp-menu', PPMenu);

function initializePPNavigation(root = document) {
  root.querySelectorAll('.pp-navigation details, .pp-menu__dialog details').forEach((details) => {
    if (details.dataset.ppReady) return;
    details.dataset.ppReady = 'true';
    const summary = details.querySelector(':scope > summary');
    details.addEventListener('toggle', () => {
      summary.setAttribute('aria-expanded', String(details.open));
      if (details.open) {
        const list = details.parentElement.parentElement;
        list.querySelectorAll(':scope > li > details').forEach((peer) => { if (peer !== details) peer.open = false; });
      }
    });
    details.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !details.open) return;
      event.preventDefault();
      event.stopPropagation();
      details.open = false;
      summary.setAttribute('aria-expanded', 'false');
      summary.focus();
    });
  });
}
initializePPNavigation();
document.addEventListener('shopify:section:load', (event) => initializePPNavigation(event.target));
document.addEventListener('click', (event) => {
  document.querySelectorAll('.pp-navigation details[open]').forEach((details) => {
    if (!details.contains(event.target)) details.open = false;
  });
});
document.addEventListener('focusin', (event) => {
  document.querySelectorAll('.pp-navigation__inner > details[open], .pp-navigation__list > li > details[open]').forEach((details) => {
    if (!details.contains(event.target)) details.open = false;
  });
});
function measurePPHeader(root = document) {
  root.querySelectorAll('.pp-header__main').forEach((main) => {
    const section = main.closest('.section-header');
    if (!section || main.ppSizeObserver) return;
    main.ppSizeObserver = new ResizeObserver(() => section.style.setProperty('--pp-main-height', `${main.offsetHeight}px`));
    main.ppSizeObserver.observe(main);
  });
}
measurePPHeader();
document.addEventListener('shopify:section:load', (event) => measurePPHeader(event.target));
document.addEventListener('shopify:section:unload', (event) => {
  event.target.querySelectorAll('.pp-header__main').forEach((main) => main.ppSizeObserver?.disconnect());
});

/* Move the same Shopify links into More; never synthesize destinations. */
function initializePPOverflow(root = document) {
  root.querySelectorAll('.pp-navigation').forEach((nav) => {
    if (nav.ppOverflowObserver) return;
    const list = nav.querySelector('.pp-navigation__list');
    const more = list.querySelector('.pp-nav-more');
    const panel = more.querySelector('.pp-nav-more__panel');
    const items = Array.from(list.querySelectorAll(':scope > [data-pp-nav-item]'));
    const fit = () => {
      if (!nav.offsetWidth) return;
      const active = nav.contains(document.activeElement) ? document.activeElement : null;
      const restoreFocus = () => {
        if (!active) return;
        if (panel.contains(active)) more.querySelector('details').open = true;
        const target = more.contains(active) && more.hidden ? nav.querySelector('.pp-all-categories > summary') : active;
        target.focus({ preventScroll: true });
      };
      items.forEach((item) => list.insertBefore(item, more));
      more.hidden = true;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      const widths = items.map((item) => item.getBoundingClientRect().width);
      const total = widths.reduce((sum, width) => sum + width + gap, -gap);
      if (total <= list.clientWidth) { restoreFocus(); return; }
      more.hidden = false;
      const reserved = more.getBoundingClientRect().width + gap;
      let used = 0;
      let overflowing = false;
      items.forEach((item, index) => {
        const next = widths[index] + (used ? gap : 0);
        if (overflowing || used + next + reserved > list.clientWidth) {
          overflowing = true;
          panel.appendChild(item);
        } else used += next;
      });
      restoreFocus();
    };
    nav.ppOverflowObserver = new ResizeObserver(fit);
    nav.ppOverflowObserver.observe(list);
    document.fonts?.ready.then(fit);
    fit();
  });
}
initializePPOverflow();
document.addEventListener('shopify:section:load', (event) => initializePPOverflow(event.target));
document.addEventListener('shopify:section:unload', (event) => {
  event.target.querySelectorAll('.pp-navigation').forEach((nav) => nav.ppOverflowObserver?.disconnect());
});

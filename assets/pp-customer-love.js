/* Category motion only. Adjust data-speed in pp-love__track.liquid (pixels/second). */
if (!customElements.get('pp-review-carousel')) {
  customElements.define('pp-review-carousel', class extends HTMLElement {
    connectedCallback() {
      this.list = this.querySelector('.pp-love__track');
      if (!this.list) return;
      this.items = Array.from(this.list.children);
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.events = new AbortController();
      const on = (target, type, handler, options = {}) => target.addEventListener(type, handler, { ...options, signal: this.events.signal });
      this.speed = Math.max(0, Number(this.dataset.speed) || 25);
      this.focused = false;
      this.hovered = false;
      this.pointer = null;
      this.touching = false;
      this.editorPaused = false;
      this.suppressClick = false;
      this.resumeAt = 0;
      on(this.motion, 'change', () => this.measure());
      on(this.list, 'pointerenter', (event) => { if (event.pointerType === 'mouse') this.hovered = true; });
      on(this.list, 'pointerleave', () => { this.hovered = false; this.delay(); });
      on(document, 'shopify:section:select', (event) => { if (event.target.contains(this)) this.editorPaused = true; });
      on(document, 'shopify:section:deselect', (event) => { if (event.target.contains(this)) { this.editorPaused = false; this.delay(); } });
      on(this.list, 'focusin', (event) => {
        this.focused = true;
      });
      on(this.list, 'focusout', () => {
        this.focused = false;
        this.delay();
      });
      on(this.list, 'keydown', (event) => {
        this.focused = true;
        if (event.target === this.list && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          this.list.scrollLeft += (event.key === 'ArrowRight' ? 1 : -1) * (this.itemWidth + this.gap || 80);
          this.readScroll();
        }
      });
      on(this.list, 'pointerdown', (event) => {
        if (event.button !== 0) return;
        this.suppressClick = false;
        this.pointer = { id: event.pointerId, type: event.pointerType, started: performance.now(), x: event.clientX, scroll: this.list.scrollLeft, moved: false };
        this.delay();
      });
      on(window, 'pointermove', (event) => {
        const pointer = this.pointer;
        if (!pointer || event.pointerId !== pointer.id || pointer.type !== 'mouse') return;
        const delta = event.clientX - pointer.x;
        if (!pointer.moved && Math.abs(delta) < 6) return;
        pointer.moved = true;
        this.list.dataset.dragging = '';
        this.list.setPointerCapture(pointer.id);
        event.preventDefault();
        this.list.scrollLeft = pointer.scroll - delta;
        this.readScroll();
      });
      const release = (event) => {
        if (!this.pointer || event.pointerId !== this.pointer.id) return;
        // A held touch is a pause gesture; quick taps keep native link navigation.
        this.suppressClick = this.pointer.moved || (this.pointer.type === 'touch' && performance.now() - this.pointer.started >= 400);
        if (this.list.hasPointerCapture(event.pointerId)) this.list.releasePointerCapture(event.pointerId);
        this.pointer = null;
        delete this.list.dataset.dragging;
        this.delay();
      };
      on(window, 'pointerup', release);
      on(window, 'pointercancel', release);
      on(this.list, 'click', (event) => {
        if (!this.suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
        this.suppressClick = false;
      }, { capture: true });
      on(this.list, 'dragstart', (event) => event.preventDefault());
      on(this.list, 'touchstart', () => { this.touching = true; this.delay(); }, { passive: true });
      on(this.list, 'touchend', (event) => { this.touching = event.touches.length > 0; this.delay(); }, { passive: true });
      on(this.list, 'touchcancel', () => { this.touching = false; this.delay(); }, { passive: true });
      on(this.list, 'wheel', () => this.delay(), { passive: true });
      on(this.list, 'scroll', () => this.readScroll(), { passive: true });
      on(document, 'shopify:block:select', (event) => {
        if (!this.contains(event.target)) return;
        this.editorPaused = true;
        event.target.scrollIntoView({ block: 'nearest', inline: 'center' });
      });
      on(document, 'shopify:block:deselect', () => { this.editorPaused = false; this.delay(); });
      on(document, 'visibilitychange', () => { this.lastTime = null; });
      this.resize = new ResizeObserver(() => {
        if (this.width !== this.list.clientWidth) this.measure();
      });
      this.resize.observe(this.list);
      this.visible = true;
      this.intersection = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.lastTime = null;
      });
      this.intersection.observe(this);
      this.measure();
    }

    delay() { this.resumeAt = performance.now() + 1200; }

    clearCopies() {
      this.list.querySelectorAll('[data-review-copy]').forEach((item) => item.remove());
      delete this.list.dataset.loop;
      this.list.style.removeProperty('--pp-review-width');
    }

    measure() {
      cancelAnimationFrame(this.frame);
      const phase = this.period ? ((this.position - this.period) % this.period + this.period) % this.period / this.period : 0;
      this.clearCopies();
      this.width = this.list.clientWidth;
      if (this.dataset.auto !== "true" || this.motion.matches || !this.items.length || !this.width) {
        this.period = 0;
        this.list.scrollLeft = 0;
        return;
      }
      // Freeze the original flex layout before copies are added; image loading cannot change this width.
      this.itemWidth = this.items[0].getBoundingClientRect().width;
      this.gap = parseFloat(getComputedStyle(this.list).columnGap) || 0;
      this.period = this.items.length * (this.itemWidth + this.gap);
      this.list.style.setProperty('--pp-review-width', `${this.itemWidth}px`);
      this.list.dataset.loop = '';
      const copy = () => this.items.map((original) => {
        const item = original.cloneNode(true);
        item.dataset.reviewCopy = '';
        item.setAttribute('aria-hidden', 'true');
        [item, ...item.querySelectorAll('*')].forEach((node) => {
          node.removeAttribute('id');
          Array.from(node.attributes).filter((attribute) => attribute.name.startsWith('data-shopify')).forEach((attribute) => node.removeAttribute(attribute.name));
        });
        item.querySelectorAll('a, button, [tabindex]').forEach((node) => node.setAttribute('tabindex', '-1'));
        return item;
      });
      // One preceding sequence permits backwards swipes; enough following sequences cover even short rows.
      this.list.prepend(...copy());
      for (let i = 0; i < Math.ceil((this.width + this.gap) / this.period); i++) this.list.append(...copy());
      // Use actual sequence positions, including browser subpixel gap rounding.
      this.period = this.items[0].getBoundingClientRect().left - this.list.firstElementChild.getBoundingClientRect().left;
      this.position = this.period * (1 + phase);
      this.writeScroll();
      this.lastTime = null;
      this.frame = requestAnimationFrame((time) => this.tick(time));
    }

    writeScroll() {
      this.list.scrollLeft = this.position;
      this.written = this.list.scrollLeft;
    }

    readScroll() {
      // Ignore our own rounded browser scroll events: keep the fractional animation accumulator.
      if (!this.period || Math.abs(this.list.scrollLeft - this.written) < 1) return;
      this.position = this.list.scrollLeft;
      this.delay();
      if (!this.focused && !this.pointer && !this.touching) this.normalize();
    }

    normalize() {
      this.position = this.period + ((this.position - this.period) % this.period + this.period) % this.period;
      this.writeScroll();
    }

    tick(time) {
      const elapsed = this.lastTime === null ? 0 : Math.min(time - this.lastTime, 50);
      this.lastTime = time;
      if (this.visible && !document.hidden && !this.editorPaused && !this.hovered && !this.focused && !this.pointer && !this.touching && time >= this.resumeAt) {
        this.position += this.speed * elapsed / 1000;
        this.normalize();
      }
      this.frame = requestAnimationFrame((next) => this.tick(next));
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.frame);
      this.events?.abort();
      this.resize?.disconnect();
      this.intersection?.disconnect();
      if (this.list) this.clearCopies();
    }
  });
}

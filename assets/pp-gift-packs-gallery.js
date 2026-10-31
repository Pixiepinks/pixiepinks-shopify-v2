/* Native scroll-snap: real products only, with no duplicate slides or dependencies. */
if (!customElements.get('pp-gift-carousel')) {
  customElements.define('pp-gift-carousel', class extends HTMLElement {
    connectedCallback() {
      if (this.events) return;
      this.track = this.querySelector('[data-track]');
      if (!this.track) return;
      this.cards = [...this.querySelectorAll('[data-slide]')];
      this.controls = this.querySelector('[data-controls]');
      this.dots = this.querySelector('[data-dots]');
      this.toggle = this.querySelector('[data-toggle]');
      this.status = this.querySelector('[data-status]');
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.userPaused = false;
      this.hovered = false;
      this.inView = false;
      this.events = new AbortController();
      const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: this.events.signal });

      listen(this.querySelector('[data-previous]'), 'click', () => this.manual(this.index - 1));
      listen(this.querySelector('[data-next]'), 'click', () => this.manual(this.index + 1));
      listen(this.dots, 'click', (event) => {
        const dot = event.target.closest('[data-page]');
        if (dot) this.manual(Number(dot.dataset.page));
      });
      if (this.toggle) listen(this.toggle, 'click', () => {
        this.userPaused = !this.userPaused;
        this.syncToggle();
        this.schedule();
      });
      listen(this, 'pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        this.hovered = true;
        this.schedule();
      });
      listen(this, 'pointerleave', () => { this.hovered = false; this.schedule(); });
      listen(this, 'focusin', () => this.schedule());
      listen(this, 'focusout', () => queueMicrotask(() => { if (this.isConnected) this.schedule(); }));
      // Manual use stays paused until the customer explicitly presses Play.
      for (const type of ['pointerdown', 'wheel']) listen(this.track, type, () => this.pause());
      listen(this.track, 'keydown', (event) => {
        this.pause();
        if (event.target !== this.track) return;
        let next;
        if (event.key === 'ArrowRight') next = this.index + 1;
        if (event.key === 'ArrowLeft') next = this.index - 1;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = this.positions.length - 1;
        if (next !== undefined) { event.preventDefault(); this.manual(next); }
      });
      listen(this.track, 'scroll', () => {
        this.clearTimer();
        clearTimeout(this.settleTimer);
        this.settleTimer = setTimeout(() => { this.update(); this.schedule(); }, 150);
      });
      listen(document, 'visibilitychange', () => this.schedule());
      listen(this.motion, 'change', () => { this.syncToggle(); this.schedule(); });
      this.resize = new ResizeObserver(() => this.measure());
      this.resize.observe(this.track);
      this.visibility = new IntersectionObserver(([entry]) => { this.inView = entry.isIntersecting; this.schedule(); });
      this.visibility.observe(this);
      this.measure();
      this.syncToggle();
    }

    measure() {
      const max = Math.max(0, this.track.scrollWidth - this.track.clientWidth);
      const origin = this.cards[0]?.offsetLeft || 0;
      this.positions = [...new Set(this.cards.map((card) => Math.round(Math.min(max, card.offsetLeft - origin))))];
      const previousCount = this.dots.children.length;
      if (previousCount !== this.positions.length) {
        this.dots.replaceChildren(...this.positions.map((_, page) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'pp-gift__dot';
          button.dataset.page = page;
          button.setAttribute('aria-label', `${this.dataset.pageLabel} ${page + 1}`);
          button.setAttribute('aria-controls', this.track.id);
          return button;
        }));
      }
      this.controls.hidden = max < 2;
      this.update();
      this.schedule();
    }

    update() {
      this.index = this.positions.reduce((best, position, index) =>
        Math.abs(position - this.track.scrollLeft) < Math.abs(this.positions[best] - this.track.scrollLeft) ? index : best, 0);
      [...this.dots.children].forEach((dot, page) => dot.setAttribute('aria-current', String(page === this.index)));
    }

    go(index, announce = false) {
      const page = (index + this.positions.length) % this.positions.length;
      this.track.scrollTo({ left: this.positions[page], behavior: this.motion.matches ? 'instant' : 'smooth' });
      if (announce) this.status.textContent = `${this.dataset.pageLabel} ${page + 1} / ${this.positions.length}`;
    }

    manual(index) { this.pause(); this.go(index, true); }
    pause() { this.userPaused = true; this.syncToggle(); this.clearTimer(); }

    syncToggle() {
      if (!this.toggle) return;
      this.toggle.hidden = this.motion.matches;
      this.toggle.setAttribute('aria-label', this.userPaused ? this.dataset.playLabel : this.dataset.pauseLabel);
      this.toggle.dataset.paused = String(this.userPaused);
    }

    clearTimer() { clearTimeout(this.timer); this.timer = null; }

    schedule() {
      this.clearTimer();
      if (!this.isConnected || this.dataset.autoplay !== 'true' || this.userPaused || this.motion.matches ||
          this.hovered || this.contains(document.activeElement) || document.hidden || !this.inView || this.positions.length < 2) return;
      const interval = Math.max(3000, Math.min(12000, Number(this.dataset.interval) || 5000));
      this.timer = setTimeout(() => { this.go(this.index + 1); this.schedule(); }, interval);
    }

    disconnectedCallback() {
      this.clearTimer();
      clearTimeout(this.settleTimer);
      this.events?.abort();
      this.events = null;
      this.resize?.disconnect();
      this.visibility?.disconnect();
    }
  });
}

/* Apply reduced-motion preferences to homepage slideshows without changing Dawn. */
(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pausedForMotion = new WeakSet();
  const sync = (root = document) => {
    root.querySelectorAll('slideshow-component.pp-home-hero').forEach((slideshow) => {
      if (!slideshow.sliderAutoplayButton || typeof slideshow.autoPlayToggle !== 'function') return;
      if (preference.matches && slideshow.autoplayButtonIsSetToPlay) {
        slideshow.autoPlayToggle();
        pausedForMotion.add(slideshow);
      } else if (!preference.matches && pausedForMotion.has(slideshow)) {
        // Leave autoplay paused: only the visitor's play action should resume it.
        pausedForMotion.delete(slideshow);
      }
    });
  };
  customElements.whenDefined('slideshow-component').then(() => sync());
  preference.addEventListener('change', () => sync());
  document.addEventListener('shopify:section:load', (event) => sync(event.target));
})();

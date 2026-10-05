/* Fuzzy (blur-up) loading for every image: covers, cards, markdown content.
 * Images get .fuzzy (blurred) until loaded, then .loaded (sharp).
 * Skips already-handled nodes; also picks up lazily added content. */
(() => {
  function mark(img) {
    if (img.dataset.fuzzy) return;
    img.dataset.fuzzy = '1';
    img.classList.add('fuzzy');
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    const done = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth > 0) {
      done();
    } else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  }

  function scan(root) {
    const imgs = root.querySelectorAll
      ? root.querySelectorAll('img:not([data-fuzzy])')
      : [];
    imgs.forEach(mark);
  }

  scan(document);

  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'IMG') mark(node);
        else scan(node);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
})();

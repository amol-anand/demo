/**
 * CTA Bar Block
 * Renders a row of CTA buttons on a dark teal background.
 * Content model: one row per button  each row's first cell contains the link.
 * @param {Element} block the block element
 */
export default function decorate(block) {
  // EDS decorates links inside single-child divs as .button before this runs.
  // We query all links in the block  one per row  and rebuild the layout.
  const rows = block.querySelectorAll(':scope > div');

  const bar = document.createElement('div');
  bar.className = 'cta-bar-inner';

  rows.forEach((row) => {
    // Find the link anywhere within this row (may be wrapped in p.button-container etc.)
    const link = row.querySelector('a');
    if (!link) return;

    const btn = document.createElement('a');
    btn.className = 'cta-bar-btn';
    btn.href = link.href;
    btn.textContent = link.textContent.trim();
    btn.setAttribute('aria-label', link.getAttribute('aria-label') || link.textContent.trim());

    bar.append(btn);
  });

  block.replaceChildren(bar);
}

/**
 * Dosing Banner block
 *
 * Content model (authored as a table):
 *   Row 1: heading text (e.g. "Experience once-monthly dosing with Emgality ")
 *   Row 2: CTA link (e.g. [How to Take Emgality](/dosing-for-migraine))
 *   Row 3: footnote text (e.g. " Following an initial loading dose&")
 *
 * Renders a full-width teal banner with the heading on the left,
 * CTA button on the right, and a footnote spanning the full width below.
 *
 * @param {Element} block the dosing-banner block element
 */
export default function decorate(block) {
  const rows = block.querySelectorAll(':scope > div');

  // Extract content from authored rows
  const headingRow = rows[0];
  const ctaRow = rows[1];
  const footnoteRow = rows[2];

  // Build heading element  promote content from first cell
  const headingCell = headingRow ? headingRow.querySelector(':scope > div') : null;
  const headingContent = headingCell ? headingCell.firstElementChild || headingCell : null;

  const heading = document.createElement('div');
  heading.className = 'dosing-banner-heading';
  if (headingContent) {
    // Re-use existing element (may be a <p> or <h2> from authoring)
    if (headingContent.tagName !== 'H2') {
      const h2 = document.createElement('h2');
      h2.append(...headingContent.childNodes);
      heading.append(h2);
    } else {
      heading.append(headingContent);
    }
  }

  // Build CTA button from authored link
  const ctaCell = ctaRow ? ctaRow.querySelector(':scope > div') : null;
  const ctaLink = ctaCell ? ctaCell.querySelector('a') : null;
  const cta = document.createElement('div');
  cta.className = 'dosing-banner-cta';
  if (ctaLink) {
    ctaLink.className = 'dosing-banner-btn';
    cta.append(ctaLink);
  }

  // Build footnote
  const footnoteCell = footnoteRow ? footnoteRow.querySelector(':scope > div') : null;
  const footnote = document.createElement('div');
  footnote.className = 'dosing-banner-footnote';
  if (footnoteCell) {
    footnote.append(...footnoteCell.childNodes);
  }

  // Build inner layout: heading + cta in a row, footnote below
  const inner = document.createElement('div');
  inner.className = 'dosing-banner-inner';
  inner.append(heading, cta);

  // Replace block content
  block.replaceChildren(inner, footnote);
}

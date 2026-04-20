/**
 * Savings Banner Block
 *
 * Renders a teal banner with a heading, a CTA button, and a disclaimer.
 * Authored as a two-row block:
 *   Row 1: Col 1 = heading, Col 2 = CTA link (becomes a styled button)
 *   Row 2: Col 1 (spans) = disclaimer paragraph
 *
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = block.querySelectorAll(':scope > div');

  // Row 1: heading + CTA
  const contentRow = rows[0];
  if (contentRow) {
    const cols = contentRow.querySelectorAll(':scope > div');
    const headingCol = cols[0];
    const ctaCol = cols[1];

    if (headingCol) headingCol.classList.add('savings-banner-heading');
    if (ctaCol) {
      ctaCol.classList.add('savings-banner-cta');
      // Promote the link to a styled button
      const link = ctaCol.querySelector('a');
      if (link) link.classList.add('savings-banner-button');
    }
  }

  // Row 2: disclaimer (may span full width)
  const disclaimerRow = rows[1];
  if (disclaimerRow) {
    disclaimerRow.classList.add('savings-banner-disclaimer');
  }
}

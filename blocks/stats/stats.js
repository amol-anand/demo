/**
 * Stats block
 *
 * Renders a statistics section with a header, two side-by-side stat graphics,
 * and an optional footnote. Authored as a three-row block:
 *   Row 1: Col 1 = header paragraph (intro text for the stats)
 *   Row 2: Col 1 = first stat image, Col 2 = second stat image
 *   Row 3: Col 1 = footnote paragraph
 *
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = block.querySelectorAll(':scope > div');

  rows.forEach((row, i) => {
    const cols = row.querySelectorAll(':scope > div');

    if (i === 0) {
      // Row 1: header text
      row.classList.add('stats-header');
    } else if (i === 1) {
      // Row 2: stat graphics (one or two columns)
      row.classList.add('stats-graphics');
      cols.forEach((col) => {
        col.classList.add('stats-graphic-item');
        // Ensure picture fills the column cleanly
        const picture = col.querySelector('picture');
        if (picture) {
          const img = picture.querySelector('img');
          if (img && !img.getAttribute('alt')) {
            img.setAttribute('alt', '');
          }
        }
      });
    } else if (i === rows.length - 1 && rows.length > 2) {
      // Last row beyond row 2: footnote
      row.classList.add('stats-footnote');
    }
  });
}

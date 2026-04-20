/**
 * Lifestyle Feature Block
 * Two-column layout: left = heading + subtext, right = image + captions
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = block.querySelectorAll(':scope > div');
  if (!rows.length) return;

  const row = rows[0];
  const cols = row.querySelectorAll(':scope > div');
  if (cols.length < 2) return;

  const textCol = cols[0];
  const imageCol = cols[1];

  textCol.classList.add('lifestyle-feature-text');
  imageCol.classList.add('lifestyle-feature-media');

  // Mark the heading (first h2/h3/h4/em/strong) for styling
  const heading = textCol.querySelector('h2, h3, h4');
  if (heading) heading.classList.add('lifestyle-feature-heading');

  // Wrap remaining paragraphs in a subtext container
  const subtextParas = textCol.querySelectorAll('p');
  if (subtextParas.length) {
    const subtextDiv = document.createElement('div');
    subtextDiv.classList.add('lifestyle-feature-subtext');
    subtextParas.forEach((p) => subtextDiv.append(p));
    textCol.append(subtextDiv);
  }

  // Mark captions (paragraphs after the picture in image col)
  const captions = imageCol.querySelectorAll('p');
  captions.forEach((p) => p.classList.add('lifestyle-feature-caption'));
}

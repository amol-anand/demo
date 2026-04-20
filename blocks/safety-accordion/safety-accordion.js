/*
 * Safety Accordion Block
 * Expandable safety information panel with two columns:
 * SAFETY SUMMARY and INDICATIONS.
 * Authored as a 2-row table: row 1 = panel titles (col1 | col2),
 * row 2 = panel content (col1 | col2).
 * A toggle button at the top controls expand/collapse.
 */

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  const [titleRow, contentRow] = rows;
  const [safetyTitleCell, indicationsTitleCell] = [...titleRow.children];
  const [safetyContentCell, indicationsContentCell] = [...contentRow.children];

  // --- Build toggle banner ---
  const banner = document.createElement('button');
  banner.type = 'button';
  banner.className = 'safety-accordion-banner';
  banner.setAttribute('aria-expanded', 'false');
  banner.setAttribute('aria-controls', 'safety-accordion-panel');

  const safetyLabel = document.createElement('span');
  safetyLabel.className = 'safety-accordion-label safety';
  safetyLabel.append(...safetyTitleCell.childNodes);

  const indicationsLabel = document.createElement('span');
  indicationsLabel.className = 'safety-accordion-label indications';
  indicationsLabel.append(...indicationsTitleCell.childNodes);

  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'safety-accordion-toggle-icon';
  toggleIcon.setAttribute('aria-hidden', 'true');

  banner.append(safetyLabel, indicationsLabel, toggleIcon);

  // --- Build expandable panel ---
  const panel = document.createElement('div');
  panel.className = 'safety-accordion-panel';
  panel.id = 'safety-accordion-panel';
  panel.setAttribute('role', 'region');
  panel.hidden = true;

  // Safety summary column
  const safetyCol = document.createElement('div');
  safetyCol.className = 'safety-accordion-column safety';
  const safetyHeading = document.createElement('h2');
  safetyHeading.className = 'safety-accordion-column-title';
  safetyHeading.textContent = safetyLabel.textContent.trim();
  safetyCol.append(safetyHeading);
  safetyCol.append(safetyContentCell);
  safetyContentCell.className = 'safety-accordion-content';

  // Indications column
  const indicationsCol = document.createElement('div');
  indicationsCol.className = 'safety-accordion-column indications';
  const indicationsHeading = document.createElement('h2');
  indicationsHeading.className = 'safety-accordion-column-title';
  indicationsHeading.textContent = indicationsLabel.textContent.trim();
  indicationsCol.append(indicationsHeading);
  indicationsCol.append(indicationsContentCell);
  indicationsContentCell.className = 'safety-accordion-content';

  panel.append(safetyCol, indicationsCol);

  // --- Toggle behavior ---
  function togglePanel() {
    const isExpanded = banner.getAttribute('aria-expanded') === 'true';
    banner.setAttribute('aria-expanded', String(!isExpanded));
    panel.hidden = isExpanded;
    block.classList.toggle('is-expanded', !isExpanded);
  }

  banner.addEventListener('click', togglePanel);

  // --- Replace block content ---
  block.replaceChildren(banner, panel);
}

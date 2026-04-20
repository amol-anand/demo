/**
 * Promo Banner Block
 * 2-column promotional block: left = image, right = logo + heading + body + CTAs + disclaimer
 * @param {Element} block the block element
 */
export default function decorate(block) {
  const rows = block.querySelectorAll(':scope > div')
  if (!rows.length) return

  const row = rows[0]
  const cells = row.querySelectorAll(':scope > div')
  if (cells.length < 2) return

  const [imageCell, contentCell] = cells

  // --- Image column ---
  imageCell.classList.add('promo-banner-image')

  // Build figure: find picture and caption text
  // EDS wrapTextNodes may have wrapped picture in a <p>; handle both cases
  const picture = imageCell.querySelector('picture')
  if (picture) {
    // Find any caption: a <p> inside the cell that doesn't contain the picture
    const allPs = [...imageCell.querySelectorAll('p')]
    const captionP = allPs.find((p) => !p.contains(picture) && p.textContent.trim())

    const figure = document.createElement('figure')
    // Detach picture from its current parent <p> if needed
    const picParentP = picture.closest('p')
    if (picParentP) {
      picParentP.replaceWith(figure)
    } else {
      picture.replaceWith(figure)
    }
    figure.append(picture)

    if (captionP) {
      const caption = document.createElement('figcaption')
      caption.append(...captionP.childNodes)
      captionP.remove()
      figure.append(caption)
    }
  }

  // --- Content column ---
  contentCell.classList.add('promo-banner-content')

  // Mark the logo image wrapper
  const logoPicture = contentCell.querySelector('picture')
  if (logoPicture) {
    const logoWrap = logoPicture.closest('p') || logoPicture.parentElement
    logoWrap.classList.add('promo-banner-logo')
  }

  // Mark the CTA links as buttons
  const links = contentCell.querySelectorAll('a')
  links.forEach((link) => {
    link.classList.add('promo-banner-cta')
  })

  // Mark the last paragraph as disclaimer if it contains legal text signals
  const paragraphs = [...contentCell.querySelectorAll('p')]
  const lastP = paragraphs[paragraphs.length - 1]
  if (lastP && !lastP.querySelector('a') && (
    lastP.textContent.includes('©')
    || lastP.textContent.includes('PP-')
    || lastP.querySelector('sup')
  )) {
    lastP.classList.add('promo-banner-disclaimer')
  }
}

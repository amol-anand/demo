export default function decorate(block) {
  // Expected content model (plain.html):
  // Row 1: background image (picture)
  // Row 2: headline line 1 (green box)
  // Row 3: headline line 2 (green box, italic)
  // Row 4: subtext (red/orange box)
  // Row 5: scroll button link
  // Row 6: caption text

  const rows = [...block.children];

  // Extract content cells
  const picRow = rows[0];
  const headline1Row = rows[1];
  const headline2Row = rows[2];
  const subtextRow = rows[3];
  const scrollRow = rows[4];
  const captionRow = rows[5];

  // Build new hero structure
  block.innerHTML = '';

  // Background picture
  const bgWrapper = document.createElement('div');
  bgWrapper.className = 'hero-bg';
  const pic = picRow?.querySelector('picture') || picRow?.querySelector('img');
  if (pic) bgWrapper.appendChild(pic.closest ? pic.closest('picture') || pic : pic);
  block.appendChild(bgWrapper);

  // Content overlay
  const content = document.createElement('div');
  content.className = 'hero-content';

  // Headline box 1 (teal, straight text)
  const h1Box = document.createElement('div');
  h1Box.className = 'hero-headline hero-headline--line1';
  const h1Text = headline1Row?.querySelector('p, h1, h2, h3') || headline1Row;
  h1Box.innerHTML = h1Text?.innerHTML || headline1Row?.textContent?.trim() || '';
  content.appendChild(h1Box);

  // Headline box 2 (teal, italic)
  const h2Box = document.createElement('div');
  h2Box.className = 'hero-headline hero-headline--line2';
  const h2Text = headline2Row?.querySelector('p, h1, h2, h3') || headline2Row;
  h2Box.innerHTML = h2Text?.innerHTML || headline2Row?.textContent?.trim() || '';
  content.appendChild(h2Box);

  // Subtext box (orange/red)
  const subBox = document.createElement('div');
  subBox.className = 'hero-subtext';
  const subText = subtextRow?.querySelector('p, h1, h2, h3, h4') || subtextRow;
  subBox.innerHTML = subText?.innerHTML || subtextRow?.textContent?.trim() || '';
  content.appendChild(subBox);

  block.appendChild(content);

  // Scroll button
  if (scrollRow) {
    const scrollLink = scrollRow.querySelector('a');
    const scrollBtn = document.createElement('div');
    scrollBtn.className = 'hero-scroll';
    if (scrollLink) {
      const btn = document.createElement('a');
      btn.href = scrollLink.href;
      btn.className = 'hero-scroll-btn';
      btn.innerHTML = `${scrollLink.textContent.trim()} <svg aria-hidden="true" focusable="false" viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg"><path d="m13.777 .395-5.421 5.495c-.194.197-.51.199-.707.005a.497.497 0 0 0-.005-.005L2.222.395C2.028.198 1.712.196 1.515.39a.497.497 0 0 0-.005.005L.346 1.574c-.192.195-.192.508 0 .702l7.298 7.396c.194.197.51.199.707.005a.497.497 0 0 0 .005-.005l7.298-7.396c.192-.195.192-.508 0-.702L14.49.395C14.296.198 13.98.196 13.782.39a.497.497 0 0 0-.005.005z"/></svg>`;
      scrollBtn.appendChild(btn);
    }
    block.appendChild(scrollBtn);
  }

  // Caption
  if (captionRow) {
    const caption = document.createElement('p');
    caption.className = 'hero-caption';
    caption.textContent = captionRow?.textContent?.trim() || '';
    block.appendChild(caption);
  }
}

/**
 * Decorate the location block
 * @param {Element} block the block element
 */
export default function decorate(block) {
  // Get all the main sections from the block
  const container = document.createElement('div');
  container.className = 'location-container';

  // Extract the heading (city and office type) - could be h1, h2, or h3
  const heading = block.querySelector('h1, h2, h3');
  if (heading) {
    heading.className = 'location-heading';
  }

  // Extract region and country info
  const metaInfo = document.createElement('div');
  metaInfo.className = 'location-meta';

  // Create sections for address, contact, and notes
  const addressSection = document.createElement('div');
  addressSection.className = 'location-address';

  const contactSection = document.createElement('div');
  contactSection.className = 'location-contact';

  const notesSection = document.createElement('div');
  notesSection.className = 'location-notes';

  let inAddress = false;
  let hasAddress = false;
  let hasContact = false;
  let hasNotes = false;

  // Get the content wrapper
  const content = block.querySelector(':scope > div > div');
  if (!content) return;

  // Process all children in order
  const children = [...content.children];
  children.forEach((child) => {
    const text = child.textContent.trim();
    const tagName = child.tagName.toLowerCase();

    // Handle region and country metadata
    if (tagName === 'p' && (text.startsWith('Region:') || text.startsWith('Country:'))) {
      metaInfo.append(child.cloneNode(true));
    } else if ((tagName === 'h2' || tagName === 'h4') && text === 'Address') {
      // Handle address heading (can be h2 or h4 depending on page type)
      inAddress = true;
      const addressHeading = child.cloneNode(true);
      addressHeading.className = 'location-section-heading';
      addressSection.append(addressHeading);
      hasAddress = true;
    } else if (inAddress && tagName === 'p' && !text.startsWith('Phone:') && !text.startsWith('Fax:')) {
      // Handle address paragraphs (after Address heading until we hit phone/fax)
      // Check if it's a note (italic text)
      const em = child.querySelector('em');
      if (em) {
        inAddress = false;
        notesSection.append(child.cloneNode(true));
        hasNotes = true;
      } else {
        addressSection.append(child.cloneNode(true));
      }
    } else if (tagName === 'p' && (text.startsWith('Phone:') || text.startsWith('Fax:'))) {
      // Handle phone and fax
      inAddress = false;
      const contactPara = child.cloneNode(true);
      // Style phone links
      const phoneLink = contactPara.querySelector('a[href^="tel:"]');
      if (phoneLink) {
        phoneLink.className = 'location-phone-link';
      }
      contactSection.append(contactPara);
      hasContact = true;
    } else if (tagName === 'p' && child.querySelector('em')) {
      // Handle notes (italic paragraphs outside address)
      notesSection.append(child.cloneNode(true));
      hasNotes = true;
    }
  });

  // Build the final structure
  if (heading) container.append(heading);
  if (metaInfo.children.length > 0) container.append(metaInfo);
  if (hasAddress) container.append(addressSection);
  if (hasContact) container.append(contactSection);
  if (hasNotes) container.append(notesSection);

  // Replace block content with reorganized structure
  block.textContent = '';
  block.append(container);
}

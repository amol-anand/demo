/**
 * Decorate the location block
 * @param {Element} block the block element
 */
export default function decorate(block) {
  // Get all the main sections from the block
  const container = document.createElement('div');
  container.className = 'location-container';

  // Extract the heading (city and office type)
  const heading = block.querySelector('h1');
  if (heading) {
    heading.className = 'location-heading';
  }

  // Extract region and country info
  const metaInfo = document.createElement('div');
  metaInfo.className = 'location-meta';

  const paragraphs = [...block.querySelectorAll('p')];
  paragraphs.forEach((p) => {
    const text = p.textContent.trim();
    if (text.startsWith('Region:') || text.startsWith('Country:')) {
      metaInfo.append(p);
    }
  });

  // Find and style the address section
  const addressSection = block.querySelector('.location-address');
  if (addressSection) {
    const addressHeading = addressSection.querySelector('h2');
    if (addressHeading) {
      addressHeading.className = 'location-section-heading';
    }
  }

  // Find and style the contact section
  const contactSection = block.querySelector('.location-contact');
  if (contactSection) {
    // Add icons or styling for phone/fax if needed
    const phoneLinks = contactSection.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach((link) => {
      link.className = 'location-phone-link';
    });
  }

  // Find and style the notes section
  const notesSection = block.querySelector('.location-notes');
  if (notesSection) {
    // Notes are already styled with <em> in the template
  }

  // Reorganize the block structure
  const content = block.querySelector(':scope > div > div');
  if (content) {
    if (heading) container.append(heading);
    if (metaInfo && metaInfo.children.length > 0) container.append(metaInfo);
    if (addressSection) container.append(addressSection);
    if (contactSection) container.append(contactSection);
    if (notesSection) container.append(notesSection);

    // Replace block content with reorganized structure
    block.textContent = '';
    block.append(container);
  }
}

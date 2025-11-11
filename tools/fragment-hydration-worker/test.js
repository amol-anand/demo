/* eslint-disable no-console */
/**
 * Test suite for fragment hydration worker
 * Run with: node test.js
 */

import { handleRequest } from './worker.js';

// Mock fetch for testing
global.fetch = async (input) => {
  const url = typeof input === 'string' ? input : input.url;

  // Mock origin response
  if (!url.includes('.plain.html')) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <h1>Test Page</h1>
  <p>Introduction paragraph before fragments.</p>
  <section>
    <h2>Featured Products</h2>
    <a href="/fragments/product-showcase">Product Showcase</a>
  </section>
  <section>
    <h2>Customer Testimonials</h2>
    <a href="/fragments/testimonials">Testimonials</a>
  </section>
  <p>Regular content here</p>
  <a href="/about">Regular Link</a>
  <p>Conclusion paragraph after fragments.</p>
</body>
</html>`,
      {
        status: 200,
        headers: { 'content-type': 'text/html' },
      },
    );
  }

  // Mock fragment responses
  if (url.includes('/fragments/product-showcase.plain.html')) {
    return new Response(
      '<div class="product-grid"><article><h3>Product A</h3><p>Amazing features</p></article><article><h3>Product B</h3><p>Great value</p></article></div>',
      { status: 200, headers: { 'content-type': 'text/html' } },
    );
  }

  if (url.includes('/fragments/testimonials.plain.html')) {
    return new Response(
      '<div class="testimonials"><blockquote><p>"Excellent service!" - Jane Doe</p></blockquote><blockquote><p>"Highly recommend!" - John Smith</p></blockquote></div>',
      { status: 200, headers: { 'content-type': 'text/html' } },
    );
  }

  return new Response('Not Found', { status: 404 });
};

// Test runner
async function runTests() {
  console.log('Starting fragment hydration worker tests...\n');

  try {
    // Test 1: Basic fragment hydration
    console.log('Test 1: Basic fragment hydration');
    const request = new Request('https://example.com/test-page');
    const response = await handleRequest(request);

    const html = await response.text();

    // Check that fragments were hydrated
    if (html.includes('fragment-hydrated')) {
      console.log('✓ Fragments were hydrated');
    } else {
      console.error('✗ Fragments were not hydrated');
    }

    // Check that product showcase fragment content is present
    if (html.includes('product-grid') && html.includes('Product A')) {
      console.log('✓ Product showcase fragment content is present');
    } else {
      console.error('✗ Product showcase fragment content is missing');
    }

    // Check that testimonials fragment content is present
    if (html.includes('testimonials') && html.includes('Jane Doe')) {
      console.log('✓ Testimonials fragment content is present');
    } else {
      console.error('✗ Testimonials fragment content is missing');
    }

    // Check that original fragment links are removed
    if (!html.includes('href="/fragments/product-showcase"')) {
      console.log('✓ Original fragment links were removed');
    } else {
      console.error('✗ Original fragment links still present');
    }

    // Check that regular links are preserved
    if (html.includes('href="/about"')) {
      console.log('✓ Regular links are preserved');
    } else {
      console.error('✗ Regular links were modified');
    }

    // Check that custom header was added
    if (response.headers.get('X-Fragment-Hydration') === 'processed') {
      console.log('✓ Custom header was added');
    } else {
      console.error('✗ Custom header is missing');
    }

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

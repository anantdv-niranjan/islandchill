import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, watch: null },
  appType: 'custom'
});
after(() => server.close());

const { Badge, BADGE_VARIANTS } = await server.ssrLoadModule('/src/components/ui/Badge.jsx');
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test('Badge renders with default primary variant, subtle appearance, and md size', () => {
  const html = render(Badge, { children: 'Default Badge' });
  assert.match(html, /class="[^"]*badge-base[^"]*"/);
  assert.match(html, /badge-subtle-primary/);
  assert.match(html, /badge-size-md/);
  assert.match(html, /badge-shape-rounded/);
  assert.match(html, /Default Badge/);
});

test('Badge supports all 6 core variants: primary, secondary, success, warning, error, info', () => {
  const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];

  for (const variant of variants) {
    const html = render(Badge, { variant, children: `${variant} text` });
    assert.match(html, new RegExp(`badge-subtle-${variant}`), `Expected class for variant ${variant}`);
    assert.match(html, new RegExp(`${variant} text`));
  }
});

test('Badge normalizes common aliases to standard variants', () => {
  // danger -> error
  const htmlDanger = render(Badge, { variant: 'danger', children: 'Danger' });
  assert.match(htmlDanger, /badge-subtle-error/);

  // accent -> primary
  const htmlAccent = render(Badge, { variant: 'accent', children: 'Accent' });
  assert.match(htmlAccent, /badge-subtle-primary/);

  // neutral / gray / grey -> secondary
  const htmlNeutral = render(Badge, { variant: 'neutral', children: 'Neutral' });
  assert.match(htmlNeutral, /badge-subtle-secondary/);

  const htmlGray = render(Badge, { variant: 'gray', children: 'Gray' });
  assert.match(htmlGray, /badge-subtle-secondary/);
});

test('Badge supports solid and outline appearances via props and booleans', () => {
  const htmlSolid = render(Badge, { variant: 'success', appearance: 'solid', children: 'Solid' });
  assert.match(htmlSolid, /badge-solid-success/);

  const htmlOutline = render(Badge, { variant: 'error', outline: true, children: 'Outline' });
  assert.match(htmlOutline, /badge-outline-error/);
});

test('Badge supports sizes: sm, md, lg', () => {
  const htmlSm = render(Badge, { size: 'sm', children: 'Small' });
  assert.match(htmlSm, /badge-size-sm/);

  const htmlLg = render(Badge, { size: 'lg', children: 'Large' });
  assert.match(htmlLg, /badge-size-lg/);
});

test('Badge supports shapes and pill shorthand', () => {
  const htmlPill = render(Badge, { pill: true, children: 'Pill' });
  assert.match(htmlPill, /badge-shape-pill/);

  const htmlSquare = render(Badge, { shape: 'square', children: 'Square' });
  assert.match(htmlSquare, /badge-shape-square/);
});

test('Badge renders dot indicator with optional pulse and custom color', () => {
  const htmlDot = render(Badge, { variant: 'success', dot: true, pulse: true, children: 'Live' });
  assert.match(htmlDot, /badge-dot/);
  assert.match(htmlDot, /badge-dot-pulse/);

  const htmlCustomDot = render(Badge, { dot: true, dotColor: '#10b981', children: 'Custom Dot' });
  assert.match(htmlCustomDot, /style="background-color:#10b981"/);
});

test('Badge renders remove button when onRemove is supplied', () => {
  const htmlRemove = render(Badge, { onRemove: () => {}, children: 'Dismissible' });
  assert.match(htmlRemove, /badge-remove-btn/);
  assert.match(htmlRemove, /aria-label="Remove"/);
});

test('Badge passes through custom className, style, and HTML attributes', () => {
  const html = render(Badge, {
    className: 'custom-user-class',
    style: { zIndex: 10 },
    id: 'badge-test-id',
    title: 'Custom Title',
    children: 'Attributes'
  });
  assert.match(html, /custom-user-class/);
  assert.match(html, /style="z-index:10"/);
  assert.match(html, /id="badge-test-id"/);
  assert.match(html, /title="Custom Title"/);
});

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

const { Button, BUTTON_VARIANTS } = await server.ssrLoadModule('/src/components/ui/Button.jsx');
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test('Button renders with default primary variant, solid appearance, and md size', () => {
  const html = render(Button, { children: 'Click Me' });
  assert.match(html, /<button/);
  assert.match(html, /btn-base/);
  assert.match(html, /btn-solid-primary/);
  assert.match(html, /btn-size-md/);
  assert.match(html, /type="button"/);
  assert.match(html, /Click Me/);
});

test('Button supports all Badge variants: primary, secondary, success, warning, error, info, purple', () => {
  const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'purple'];

  for (const variant of variants) {
    const html = render(Button, { variant, children: `${variant} button` });
    assert.match(html, new RegExp(`btn-solid-${variant}`));
    assert.match(html, new RegExp(`${variant} button`));
  }
});

test('Button supports transparent variant for links and unstyled buttons', () => {
  // via variant="transparent"
  const htmlTrans = render(Button, { variant: 'transparent', children: 'Link Action' });
  assert.match(htmlTrans, /btn-transparent/);

  // via variant="link"
  const htmlLinkVar = render(Button, { variant: 'link', children: 'Link Variant' });
  assert.match(htmlLinkVar, /btn-transparent/);

  // via link={true} boolean shortcut
  const htmlLinkProp = render(Button, { link: true, children: 'Inline Link' });
  assert.match(htmlLinkProp, /btn-link/);

  // via transparent={true}
  const htmlTransProp = render(Button, { transparent: true, children: 'Transparent Prop' });
  assert.match(htmlTransProp, /btn-transparent/);
});

test('Button supports appearances: solid, subtle, outline', () => {
  const htmlSubtle = render(Button, { variant: 'success', appearance: 'subtle', children: 'Subtle' });
  assert.match(htmlSubtle, /btn-subtle-success/);

  const htmlOutline = render(Button, { variant: 'error', outline: true, children: 'Outline' });
  assert.match(htmlOutline, /btn-outline-error/);
});

test('Button supports sizes: sm, md, lg', () => {
  const htmlSm = render(Button, { size: 'sm', children: 'Small' });
  assert.match(htmlSm, /btn-size-sm/);

  const htmlLg = render(Button, { size: 'lg', children: 'Large' });
  assert.match(htmlLg, /btn-size-lg/);
});

test('Button supports shapes and pill shorthand', () => {
  const htmlPill = render(Button, { pill: true, children: 'Pill' });
  assert.match(htmlPill, /btn-shape-pill/);

  const htmlSquare = render(Button, { shape: 'square', children: 'Square' });
  assert.match(htmlSquare, /btn-shape-square/);
});

test('Button renders loading state with spinner and disabled attribute', () => {
  const htmlLoading = render(Button, { loading: true, loadingText: 'Saving...', children: 'Save' });
  assert.match(htmlLoading, /btn-loading/);
  assert.match(htmlLoading, /btn-spinner/);
  assert.match(htmlLoading, /disabled/);
  assert.match(htmlLoading, /Saving\.\.\./);
});

test('Button renders as an anchor tag when href is provided', () => {
  const htmlAnchor = render(Button, { href: '/dashboard', children: 'Go to Dashboard' });
  assert.match(htmlAnchor, /<a/);
  assert.match(htmlAnchor, /href="\/dashboard"/);
  assert.match(htmlAnchor, /Go to Dashboard/);
});

test('Button handles disabled state and passes through custom attributes', () => {
  const htmlDisabled = render(Button, {
    disabled: true,
    className: 'custom-btn-class',
    id: 'btn-test',
    children: 'Disabled'
  });
  assert.match(htmlDisabled, /disabled/);
  assert.match(htmlDisabled, /btn-disabled/);
  assert.match(htmlDisabled, /custom-btn-class/);
  assert.match(htmlDisabled, /id="btn-test"/);
});

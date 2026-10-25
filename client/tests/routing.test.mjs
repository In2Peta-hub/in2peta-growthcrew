import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRoute, viewUrl } from '../src/routing.js';

test('localhost site and app routes preserve the port', () => {
  assert.equal(viewUrl('workspace', 'http://localhost:5173/'), 'http://app.localhost:5173/');
  assert.equal(viewUrl('review', 'http://localhost:5173/'), 'http://app.localhost:5173/leads');
  assert.equal(viewUrl('social', 'http://app.localhost:8080/leads'), 'http://app.localhost:8080/social');
  assert.equal(viewUrl('landing', 'http://app.localhost:5173/social'), 'http://localhost:5173/');
});

test('custom domains use the matching app subdomain', () => {
  assert.equal(viewUrl('social', 'https://growthcrew.example.com/'), 'https://app.growthcrew.example.com/social');
  assert.equal(viewUrl('landing', 'https://app.growthcrew.example.com/leads'), 'https://growthcrew.example.com/');
});

test('direct links restore each dashboard view', () => {
  for (const [path, view] of [['/', 'workspace'], ['/leads', 'review'], ['/social/', 'social'], ['/login', 'login'], ['/seo', 'soon:seo']]) {
    assert.equal(readRoute(`http://app.localhost:5173${path}`), view);
  }
  assert.equal(readRoute('http://localhost:5173/'), 'landing');
  assert.equal(readRoute('http://localhost:5173/?oauth_success=true'), 'social');
  assert.equal(readRoute('http://localhost:5173/leads'), 'review');
});

test('Vercel previews stay functional without an app DNS record', () => {
  assert.equal(viewUrl('review', 'https://preview.vercel.app/'), 'https://preview.vercel.app/app/leads');
  assert.equal(readRoute('https://preview.vercel.app/app/leads'), 'review');
  assert.equal(readRoute('https://preview.vercel.app/'), 'landing');
});

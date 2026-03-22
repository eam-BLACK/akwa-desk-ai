/**
 * HelpdeskOS — Database API (Netlify Blobs)
 * POST /.netlify/functions/db
 * Body: { action: 'get'|'set'|'delete'|'list', key, value }
 */

const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'POST only' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { action, key, value } = body;
  if (!action) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'action required' }) };

  // ── Use @netlify/blobs as the persistent store ──────────────────
  let store;
  try {
    const { getStore } = require('@netlify/blobs');
    store = getStore('helpdeskos');
  } catch (e) {
    // Package not available — return 503 so client falls back to localStorage
    return { statusCode: 503, headers: HEADERS, body: JSON.stringify({ error: 'Blobs unavailable', detail: e.message }) };
  }

  try {
    // ── GET ──────────────────────────────────────────────────────
    if (action === 'get') {
      if (!key) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'key required' }) };
      let val = null;
      try { val = await store.get(key, { type: 'json' }); } catch { val = null; }
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ value: val }) };
    }

    // ── SET ──────────────────────────────────────────────────────
    if (action === 'set') {
      if (!key) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'key required' }) };
      await store.setJSON(key, value);
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
    }

    // ── DELETE ───────────────────────────────────────────────────
    if (action === 'delete') {
      if (!key) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'key required' }) };
      await store.delete(key);
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true }) };
    }

    // ── BULK GET (fetch multiple keys at once) ───────────────────
    if (action === 'bulk_get') {
      const keys = body.keys || [];
      const results = {};
      await Promise.all(keys.map(async k => {
        try { results[k] = await store.get(k, { type: 'json' }); }
        catch { results[k] = null; }
      }));
      return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ values: results }) };
    }

    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Unknown action' }) };

  } catch (err) {
    console.error('DB error:', err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};

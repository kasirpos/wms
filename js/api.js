/************************************************************
 * WMS SYSTEM - API CLIENT
 * ----------------------------------------------------------
 * Wrapper fetch untuk Google Apps Script Web App.
 *
 * GET  : action dikirim lewat query string (?action=parts)
 * POST : action + data dikirim sebagai JSON body
 *
 * Catatan CORS:
 * - Apps Script tidak support preflight OPTIONS.
 * - Gunakan Content-Type: text/plain agar tidak trigger preflight.
 ************************************************************/

function buildQuery_(params) {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      qs.append(k, v);
    }
  });
  return qs.toString();
}

/**
 * GET request ke Apps Script.
 * @param {string} action
 * @param {object} [params]
 * @returns {Promise<object>}
 */
async function apiGet(action, params) {
  if (!CONFIG.API_URL || CONFIG.API_URL.indexOf('GANTI_DENGAN') !== -1) {
    return { success: false, message: 'API_URL belum dikonfigurasi di js/config.js' };
  }

  const query = buildQuery_(Object.assign({ action: action }, params || {}));
  const url   = CONFIG.API_URL + '?' + query;

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    if (!res.ok) {
      return { success: false, message: 'HTTP ' + res.status + ' - ' + res.statusText };
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      return { success: false, message: 'Response bukan JSON: ' + text.slice(0, 200) };
    }
  } catch (err) {
    return { success: false, message: 'Network error: ' + (err.message || err) };
  }
}

/**
 * POST request ke Apps Script.
 * @param {string} action
 * @param {object} data
 * @returns {Promise<object>}
 */
async function apiPost(action, data) {
  if (!CONFIG.API_URL || CONFIG.API_URL.indexOf('GANTI_DENGAN') !== -1) {
    return { success: false, message: 'API_URL belum dikonfigurasi di js/config.js' };
  }

  const payload = Object.assign({}, data || {}, { action: action });

  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      // text/plain menghindari preflight OPTIONS yang tidak didukung Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!res.ok) {
      return { success: false, message: 'HTTP ' + res.status + ' - ' + res.statusText };
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      return { success: false, message: 'Response bukan JSON: ' + text.slice(0, 200) };
    }
  } catch (err) {
    return { success: false, message: 'Network error: ' + (err.message || err) };
  }
}

/**
 * Cek koneksi API.
 * @returns {Promise<boolean>}
 */
async function apiPing() {
  const r = await apiGet('test');
  return !!(r && r.success);
}

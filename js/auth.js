/************************************************************
 * WMS SYSTEM - AUTHENTICATION
 * ----------------------------------------------------------
 * - Login form handler
 * - Session storage management
 * - Show/hide login page vs app page
 * - Logout
 ************************************************************/

(function () {

  const SESSION_KEY = (typeof CONFIG !== 'undefined' && CONFIG.SESSION_KEY)
    ? CONFIG.SESSION_KEY
    : 'wmsUser';

  /* --------------------------------------------------------
     SESSION HELPERS
  -------------------------------------------------------- */

  function getStoredUser() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function setStoredUser(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user || {}));
  }

  function clearStoredUser() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /* --------------------------------------------------------
     PAGE VISIBILITY
  -------------------------------------------------------- */

  function showLoginPage() {
    const loginEl = document.getElementById('loginPage');
    const appEl   = document.getElementById('appPage');
    if (loginEl) loginEl.classList.remove('hidden');
    if (appEl)   appEl.classList.add('hidden');
  }

  function showAppPage() {
    const loginEl = document.getElementById('loginPage');
    const appEl   = document.getElementById('appPage');
    if (loginEl) loginEl.classList.add('hidden');
    if (appEl)   appEl.classList.remove('hidden');

    // Update info user di topbar
    const u = getStoredUser();
    const info = document.getElementById('userInfo');
    if (info) info.textContent = u.FullName || u.Username || '-';
  }

  /* --------------------------------------------------------
     LOGOUT (global, dipakai oleh tombol di index.html)
  -------------------------------------------------------- */

  window.logoutUser = function () {
    if (!confirm('Logout dari WMS System?')) return;
    clearStoredUser();
    showLoginPage();
    const u = document.getElementById('username');
    const p = document.getElementById('password');
    const m = document.getElementById('loginMessage');
    if (u) u.value = '';
    if (p) p.value = '';
    if (m) m.textContent = '';
  };

  /* --------------------------------------------------------
     LOGIN HANDLER
  -------------------------------------------------------- */

  function bindLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const username = (document.getElementById('username').value || '').trim();
      const password = document.getElementById('password').value || '';
      const msg      = document.getElementById('loginMessage');
      const btn      = form.querySelector('button');

      if (msg) msg.textContent = '';
      if (!username || !password) {
        if (msg) msg.textContent = 'Username dan Password wajib diisi.';
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = 'CHECKING...'; }

      try {
        const res = await apiGet('login', { username: username, password: password });

        if (!res || !res.success) {
          throw new Error((res && res.message) || 'Login gagal.');
        }

        // Simpan user ke sessionStorage
        setStoredUser(res.user || {});
        showAppPage();

        // Muat ulang data & tampilkan dashboard
        if (typeof buildNav  === 'function') buildNav();
        if (typeof loadCache === 'function') await loadCache();
        if (typeof go        === 'function') go('dashboard');

      } catch (err) {
        if (msg) msg.textContent = err.message || 'Login gagal.';
        clearStoredUser();
        showLoginPage();
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
      }
    });
  }

  /* --------------------------------------------------------
     AUTO-LOGIN (jika session masih ada)
  -------------------------------------------------------- */

  function autoLoginIfSessionExists() {
    const u = getStoredUser();
    if (u && u.Username) {
      showAppPage();
      return true;
    }
    showLoginPage();
    return false;
  }

  /* --------------------------------------------------------
     INIT
  -------------------------------------------------------- */

  function init() {
    bindLoginForm();
    autoLoginIfSessionExists();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

/* Auth */

const GOOGLE_CLIENT_ID = '793382486546-2i5jln0l5ascenv4ko4o9ttl43bue1fq.apps.googleusercontent.com';

function openModal(f)  { document.getElementById('authModal').classList.add('open'); switchForm(f); }
function closeModal()  { document.getElementById('authModal').classList.remove('open'); }

function switchForm(f) {
  const isLogin = f === 'login';
  document.getElementById('formLogin').style.display    = isLogin ? '' : 'none';
  document.getElementById('formRegister').style.display = isLogin ? 'none' : '';
  document.getElementById('modalTitle').textContent     = isLogin ? 'Login' : 'Create Account';
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  if (!email || !pass) { showToast('Fill in all fields', 'error'); return; }
  const btn = document.getElementById('btnLogin');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password: pass })
    });
    if (ok) {
      authToken   = data.accessToken;
      currentUser = data.user;
      localStorage.setItem('qm_token', authToken);
      localStorage.setItem('qm_user',  JSON.stringify(currentUser));
      closeModal();
      updateAuth();
      showToast(`Welcome back, ${currentUser.firstName || currentUser.email}!`, 'success');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch { showToast('Network error', 'error'); }
  setLoading(btn, false, 'Login →');
}

async function doRegister() {
  const firstName = document.getElementById('regFirst').value.trim();
  const lastName  = document.getElementById('regLast').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const pass      = document.getElementById('regPassword').value;
  if (!email || !pass) { showToast('Email and password required', 'error'); return; }
  if (pass.length < 8) { showToast('Password must be at least 8 chars', 'error'); return; }
  const btn = document.getElementById('btnRegister');
  setLoading(btn, true);
  try {
    const { ok, data } = await apiFetch('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password: pass, firstName, lastName })
    });
    if (ok) {
      authToken   = data.accessToken;
      currentUser = data.user;
      localStorage.setItem('qm_token', authToken);
      localStorage.setItem('qm_user',  JSON.stringify(currentUser));
      closeModal();
      updateAuth();
      showToast(`Welcome, ${currentUser.firstName || currentUser.email}!`, 'success');
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch { showToast('Network error', 'error'); }
  setLoading(btn, false, 'Create Account →');
}

function doLogout() {
  authToken   = null;
  currentUser = null;
  localStorage.removeItem('qm_token');
  localStorage.removeItem('qm_user');
  updateAuth();
  showToast('Logged out', 'success');
  if (document.getElementById('page-history').classList.contains('active')) initHistory();
}

function googleLogin() {
  if (typeof google === 'undefined') { showToast('Google library not loaded', 'error'); return; }
  const container = document.getElementById('g-btn-container');
  container.innerHTML = '';
  google.accounts.id.initialize({
    client_id:   GOOGLE_CLIENT_ID,
    callback:    handleGoogleCredential,
    auto_select: false
  });
  google.accounts.id.prompt(n => {
    if (n.isNotDisplayed() || n.isSkippedMoment()) {
      google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 356 });
    }
  });
}

async function handleGoogleCredential(response) {
  try {
    const { ok, data } = await apiFetch('/api/auth/google', {
      method: 'POST', body: JSON.stringify({ idToken: response.credential })
    });
    if (ok) {
      authToken   = data.accessToken;
      currentUser = data.user;
      localStorage.setItem('qm_token', authToken);
      localStorage.setItem('qm_user',  JSON.stringify(currentUser));
      closeModal();
      updateAuth();
      showToast(`Welcome, ${currentUser.firstName || currentUser.email}!`, 'success');
    } else {
      showToast(data.message || 'Google login failed', 'error');
    }
  } catch { showToast('Network error', 'error'); }
}

function updateAuth() {
  const tb = document.getElementById('topbarAuth');
  const sb = document.getElementById('sidebarAuth');
  if (currentUser) {
    const initials = ((currentUser.firstName?.[0] || '') + (currentUser.lastName?.[0] || '')).toUpperCase()
                   || currentUser.email[0].toUpperCase();
    tb.innerHTML = `
      <div class="user-chip">
        <div class="user-avatar">${initials}</div>
        <span>${currentUser.firstName || currentUser.email}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="doLogout()">Logout</button>`;
    sb.innerHTML = `
      <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;" onclick="doLogout()">Logout</button>`;
  } else {
    tb.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="openModal('login')">Login</button>
      <button class="btn btn-primary btn-sm" onclick="openModal('register')">Register</button>`;
    sb.innerHTML = `
      <button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;" onclick="openModal('login')">Login</button>`;
  }
}
const API_BASE = 'http://localhost:5001/api';

// ─── State ───────────────────────────────────────────────────────────────────
let currentUser = null;
let authToken = null;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const sections = {
  auth: document.getElementById('auth-section'),
  register: document.getElementById('register-section'),
  dashboard: document.getElementById('dashboard-section'),
  profile: document.getElementById('profile-section'),
};

const statusDot = document.getElementById('status-dot');

// ─── Utility ─────────────────────────────────────────────────────────────────
function showSection(name) {
  Object.values(sections).forEach(s => s.classList.add('hidden'));
  sections[name].classList.remove('hidden');
}

function setLoading(btnId, spinnerId, textId, loading) {
  const btn = document.getElementById(btnId);
  const spinner = document.getElementById(spinnerId);
  const text = document.getElementById(textId);
  btn.disabled = loading;
  spinner.classList.toggle('hidden', !loading);
  text.style.opacity = loading ? '0.5' : '1';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function setStatus(state) {
  statusDot.className = `status-dot ${state}`;
}

async function apiRequest(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function init() {
  setStatus('loading');
  const stored = await chrome.storage.local.get(['token', 'user']);
  if (stored.token && stored.user) {
    authToken = stored.token;
    currentUser = stored.user;
    try {
      // Verify token is still valid
      const res = await apiRequest('/auth/me');
      currentUser = res.user;
      setStatus('online');
      showDashboard();
    } catch {
      await chrome.storage.local.clear();
      setStatus('offline');
      showSection('auth');
    }
  } else {
    setStatus('offline');
    showSection('auth');
  }
}

async function login() {
  const email = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;
  if (!email || !password) return showError('auth-error', 'Email and password are required.');

  setLoading('login-btn', 'login-spinner', 'login-text', true);
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authToken = data.token;
    currentUser = data.user;
    await chrome.storage.local.set({ token: authToken, user: currentUser });
    setStatus('online');
    showDashboard();
  } catch (err) {
    showError('auth-error', err.message);
  } finally {
    setLoading('login-btn', 'login-spinner', 'login-text', false);
  }
}

async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  if (!name || !email || !password) return showError('register-error', 'All fields are required.');

  setLoading('register-btn', 'register-spinner', 'register-text', true);
  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    authToken = data.token;
    currentUser = data.user;
    await chrome.storage.local.set({ token: authToken, user: currentUser });
    setStatus('online');
    showDashboard();
  } catch (err) {
    showError('register-error', err.message);
  } finally {
    setLoading('register-btn', 'register-spinner', 'register-text', false);
  }
}

async function logout() {
  await chrome.storage.local.clear();
  authToken = null;
  currentUser = null;
  setStatus('offline');
  showSection('auth');
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function showDashboard() {
  document.getElementById('user-name').textContent = currentUser.name || 'User';
  document.getElementById('user-email').textContent = currentUser.email || '';
  document.getElementById('user-avatar').textContent = (currentUser.name || 'U')[0].toUpperCase();
  document.getElementById('fill-result').classList.add('hidden');
  showSection('dashboard');
}

// ─── Autofill ─────────────────────────────────────────────────────────────────
async function triggerAutofill() {
  setLoading('autofill-btn', 'autofill-spinner', 'autofill-text', true);
  document.getElementById('fill-result').classList.add('hidden');

  try {
    // 1. Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found.');

    // 2. Extract form structure from page via content script
    const pageStructure = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_FORMS' });
    if (!pageStructure || !pageStructure.forms || pageStructure.forms.length === 0) {
      throw new Error('No fillable forms found on this page.');
    }

    // 3. Send to backend: Sarvam AI analyzes + returns fill map
    const result = await apiRequest('/autofill/analyze', {
      method: 'POST',
      body: JSON.stringify({
        pageUrl: tab.url,
        pageTitle: tab.title,
        forms: pageStructure.forms,
      }),
    });

    if (!result.fillMap || Object.keys(result.fillMap).length === 0) {
      throw new Error('Sarvam AI could not map any fields to your profile.');
    }

    // 4. Send fill instructions to content script
    await chrome.tabs.sendMessage(tab.id, {
      type: 'FILL_FORMS',
      fillMap: result.fillMap,
    });

    showFillResult(true, `✓ Filled ${result.fieldsCount} field${result.fieldsCount !== 1 ? 's' : ''} using AI`);
  } catch (err) {
    showFillResult(false, err.message);
  } finally {
    setLoading('autofill-btn', 'autofill-spinner', 'autofill-text', false);
  }
}

function showFillResult(success, msg) {
  const el = document.getElementById('fill-result');
  el.className = `fill-result ${success ? 'success' : 'error'}`;
  document.getElementById('result-icon').textContent = success ? '✓' : '✗';
  document.getElementById('result-msg').textContent = msg;
  el.classList.remove('hidden');
}

// ─── Profile ──────────────────────────────────────────────────────────────────
const PROFILE_FIELDS = [
  { key: 'name',        label: 'Full Name',       type: 'text' },
  { key: 'email',       label: 'Email',            type: 'email' },
  { key: 'phone',       label: 'Phone Number',     type: 'tel' },
  { key: 'dob',         label: 'Date of Birth',    type: 'date' },
  { key: 'gender',      label: 'Gender',           type: 'select',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
  { key: 'address',     label: 'Street Address',   type: 'text' },
  { key: 'city',        label: 'City',             type: 'text' },
  { key: 'state',       label: 'State/Province',   type: 'text' },
  { key: 'pincode',     label: 'Pincode / ZIP',    type: 'text' },
  { key: 'country',     label: 'Country',          type: 'text' },
  { key: 'linkedin',    label: 'LinkedIn URL',      type: 'url' },
  { key: 'github',      label: 'GitHub URL',       type: 'url' },
  { key: 'occupation',  label: 'Occupation',       type: 'text' },
  { key: 'company',     label: 'Company / College', type: 'text' },
  { key: 'pan',         label: 'PAN Number',       type: 'text' },
  { key: 'aadhaar',     label: 'Aadhaar (last 4)', type: 'text' },
];

async function openProfile() {
  try {
    const data = await apiRequest('/profile');
    renderProfileForm(data.profile || {});
    showSection('profile');
  } catch (err) {
    alert('Failed to load profile: ' + err.message);
  }
}

function renderProfileForm(profile) {
  const container = document.getElementById('profile-form');
  container.innerHTML = '';
  PROFILE_FIELDS.forEach(field => {
    const group = document.createElement('div');
    group.className = 'input-group';
    group.innerHTML = `<label>${field.label}</label>`;

    if (field.type === 'select') {
      const sel = document.createElement('select');
      sel.id = `pf-${field.key}`;
      sel.innerHTML = `<option value="">Select…</option>` +
        field.options.map(o => `<option value="${o}" ${profile[field.key] === o ? 'selected' : ''}>${o}</option>`).join('');
      group.appendChild(sel);
    } else {
      const inp = document.createElement('input');
      inp.type = field.type;
      inp.id = `pf-${field.key}`;
      inp.value = profile[field.key] || '';
      inp.placeholder = field.label;
      group.appendChild(inp);
    }

    container.appendChild(group);
  });
}

async function saveProfile() {
  const profileData = {};
  PROFILE_FIELDS.forEach(field => {
    const el = document.getElementById(`pf-${field.key}`);
    if (el) profileData[field.key] = el.value.trim();
  });

  console.log('[FormFill AI] Saving profile:', JSON.stringify(profileData));

  setLoading('save-profile-btn', 'save-spinner', 'save-text', true);
  try {
    const result = await apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    console.log('[FormFill AI] Profile saved successfully:', JSON.stringify(result));
    // Update local user data with profile name/email if changed
    if (profileData.name) currentUser.name = profileData.name;
    if (profileData.email) currentUser.email = profileData.email;
    await chrome.storage.local.set({ user: currentUser });
    showDashboard();
  } catch (err) {
    console.error('[FormFill AI] Profile save failed:', err.message);
    showError('profile-error', err.message);
  } finally {
    setLoading('save-profile-btn', 'save-spinner', 'save-text', false);
  }
}


// ─── Event Listeners ──────────────────────────────────────────────────────────
document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('register-btn').addEventListener('click', register);
document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('autofill-btn').addEventListener('click', triggerAutofill);
document.getElementById('edit-profile-btn').addEventListener('click', openProfile);
document.getElementById('save-profile-btn').addEventListener('click', saveProfile);
document.getElementById('back-btn').addEventListener('click', showDashboard);
document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); showSection('register'); });
document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showSection('auth'); });

document.getElementById('password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();

const API_BASE = 'http://127.0.0.1:8000/alokaziosistema';
const BACKEND_ORIGIN = 'http://127.0.0.1:8000';
const SESSION_KEY = 'powerbank_atal_publikoa_saioa';

const Session = {
  get() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user && typeof user.id_erab === 'number' ? user : null;
    } catch {
      return null;
    }
  },

  save(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem(SESSION_KEY);
  },

  require() {
    if (this.get()) return true;
    const current = `${location.pathname.split('/').pop()}${location.search}`;
    location.href = `login.html?next=${encodeURIComponent(current)}`;
    return false;
  },
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[char];
  });
}

async function api(path, { method = 'GET', body } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(
      'Ezin da zerbitzariarekin konektatu. Egiaztatu backend-a martxan dagoela.',
    );
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const detail = data && typeof data === 'object' ? data.detail : data;
    let message = 'Errorea gertatu da.';
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((item) => item.msg || 'Datu baliogabea').join(', ');
    }
    throw new Error(message);
  }

  return data;
}

function safeNext(next, fallback = 'nire-kontua.html') {
  if (!next) return fallback;
  if (!/^[a-zA-Z0-9_-]+\.html(?:\?[^#]*)?$/.test(next)) return fallback;
  return next;
}

function renderNavbar(active = '') {
  const container = document.getElementById('navbar');
  if (!container) return;

  const user = Session.get();
  const userLinks = user
    ? `
      <li class="nav-item">
        <a class="nav-link ${active === 'erreserbak' ? 'active' : ''}" href="erreserbak.html">Erreserbak</a>
      </li>`
    : '';

  container.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
      <div class="container">
        <a class="navbar-brand fw-semibold" href="index.html">
          <i class="bi bi-battery-charging me-1"></i>Powerbank
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#mainNavbar" aria-controls="mainNavbar"
          aria-expanded="false" aria-label="Menua ireki">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNavbar">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link ${active === 'kargaguneak' ? 'active' : ''}" href="index.html">Kargaguneak</a>
            </li>
            ${userLinks}
          </ul>
          <div class="d-flex flex-wrap align-items-center gap-2">
            ${
              user
                ? `
                  <span class="navbar-text text-white-50 d-none d-lg-inline">
                    <i class="bi bi-person-circle me-1"></i>${escapeHtml(user.izena)}
                  </span>
                  <a class="btn btn-outline-light btn-sm" href="nire-kontua.html">
                    <i class="bi bi-person-gear me-1"></i>Nire kontua
                  </a>
                  <button class="btn btn-warning btn-sm" type="button" id="logoutButton">
                    <i class="bi bi-box-arrow-right me-1"></i>Saioa itxi
                  </button>`
                : `
                  <a class="btn btn-outline-light btn-sm" href="login.html">
                    <i class="bi bi-box-arrow-in-right me-1"></i>Saioa hasi
                  </a>
                  <a class="btn btn-warning btn-sm" href="erregistroa.html">
                    <i class="bi bi-person-plus me-1"></i>Erregistratu
                  </a>`
            }
          </div>
        </div>
      </div>
    </nav>`;

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      Session.clear();
      location.href = 'index.html';
    });
  }
}

function showAlert(container, message, type = 'danger') {
  if (!container) return;
  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Itxi"></button>
    </div>`;
}

function setButtonLoading(button, loading, loadingText = 'Kargatzen...') {
  if (!button) return;
  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${escapeHtml(loadingText)}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat('eu-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat('eu-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat('eu-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function egoeraTakilla(egoera) {
  const map = {
    erabilgarri: { label: 'Erabilgarri', css: 'success', icon: 'check-circle-fill' },
    mantentze_lanetan: { label: 'Mantentze-lanetan', css: 'warning', icon: 'tools' },
    zerbitzuz_kanpo: { label: 'Zerbitzuz kanpo', css: 'danger', icon: 'x-circle-fill' },
  };
  return map[egoera] || { label: egoera || 'Ezezaguna', css: 'secondary', icon: 'info-circle' };
}

function egoeraPostua(egoera) {
  const map = {
    hutsa: { label: 'Hutsa', css: 'secondary', icon: 'circle' },
    kargatuta: { label: 'Kargatuta', css: 'success', icon: 'battery-full' },
    kargatzen: { label: 'Kargatzen', css: 'warning', icon: 'battery-charging' },
  };
  return map[egoera] || { label: egoera || 'Ezezaguna', css: 'secondary', icon: 'info-circle' };
}

function egoeraErreserba(egoera) {
  const map = {
    aktiboa: { label: 'Aktiboa', css: 'success', icon: 'check-circle-fill' },
    amaituta: { label: 'Amaituta', css: 'secondary', icon: 'clock-history' },
    ezeztatuta: { label: 'Ezeztatuta', css: 'danger', icon: 'x-circle-fill' },
  };
  return map[egoera] || { label: egoera || 'Ezezaguna', css: 'secondary', icon: 'info-circle' };
}

function badge(label, css = 'secondary', icon = 'info-circle') {
  return `<span class="badge text-bg-${css}"><i class="bi bi-${icon} me-1"></i>${escapeHtml(label)}</span>`;
}

function imageUrl(url) {
  if (!url) return 'assets/placeholder.svg';
  if (/^(?:https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith('/')) return `${BACKEND_ORIGIN}${url}`;
  if (url.startsWith('uploads/')) return `${BACKEND_ORIGIN}/${url}`;
  return url;
}

function confirmAction(message, confirmLabel = 'Berretsi') {
  return new Promise((resolve) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal fade';
    wrapper.tabIndex = -1;
    wrapper.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Berretsi</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Itxi"></button>
          </div>
          <div class="modal-body">${escapeHtml(message)}</div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Utzi</button>
            <button type="button" class="btn btn-danger" id="confirmActionButton">${escapeHtml(confirmLabel)}</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(wrapper);
    const modal = new bootstrap.Modal(wrapper);
    let answered = false;

    const finish = (value) => {
      if (answered) return;
      answered = true;
      resolve(value);
      modal.hide();
    };

    wrapper
      .querySelector('#confirmActionButton')
      .addEventListener('click', () => finish(true));
    wrapper.addEventListener('hidden.bs.modal', () => {
      if (!answered) resolve(false);
      wrapper.remove();
    });

    modal.show();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar(document.body.dataset.page || '');
});

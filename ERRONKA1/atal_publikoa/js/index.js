let kargaguneak = [];
let irudiakMap = new Map();
let xehetasunModal = null;

document.addEventListener('DOMContentLoaded', () => {
  const alerta = document.getElementById('alerta');
  const zerrenda = document.getElementById('kargaguneZerrenda');
  const detailElement = document.getElementById('xehetasunModal');
  xehetasunModal = new bootstrap.Modal(detailElement);

  document.getElementById('urtea').textContent = new Date().getFullYear();

  const heroReserveButton = document.getElementById('heroReserveButton');
  heroReserveButton.href = Session.get()
    ? 'erreserbak.html'
    : `login.html?next=${encodeURIComponent('erreserbak.html')}`;

  document.getElementById('bilaketa').addEventListener('input', renderKargaguneak);
  document.getElementById('egoeraFilter').addEventListener('change', renderKargaguneak);
  document.getElementById('garbituFilter').addEventListener('click', () => {
    document.getElementById('bilaketa').value = '';
    document.getElementById('egoeraFilter').value = '';
    renderKargaguneak();
  });

  zerrenda.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-detail-id]');
    if (detailButton) {
      openXehetasunak(Number(detailButton.dataset.detailId));
    }
  });

  kargatuKargaguneak(alerta);
});

async function kargatuKargaguneak(alerta) {
  try {
    const [takillak, irudiak] = await Promise.all([
      api('/takillak'),
      api('/takillak/irudiak'),
    ]);

    kargaguneak = takillak;
    irudiakMap = new Map();
    for (const irudia of irudiak) {
      if (!irudiakMap.has(irudia.id_takilla)) {
        irudiakMap.set(irudia.id_takilla, []);
      }
      irudiakMap.get(irudia.id_takilla).push(irudia);
    }

    renderKargaguneak();
  } catch (error) {
    showAlert(alerta, error.message, 'danger');
    document.getElementById('kargaguneZerrenda').innerHTML = '';
    document.getElementById('emaitzaKopurua').textContent = '';
  }
}

function renderKargaguneak() {
  const bilaketa = document.getElementById('bilaketa').value.trim().toLowerCase();
  const egoera = document.getElementById('egoeraFilter').value;
  const zerrenda = document.getElementById('kargaguneZerrenda');
  const kopurua = document.getElementById('emaitzaKopurua');

  const filtratuak = kargaguneak.filter((takilla) => {
    const testua = `${takilla.izena} ${takilla.helbidea}`.toLowerCase();
    if (bilaketa && !testua.includes(bilaketa)) return false;
    if (egoera && takilla.egoera !== egoera) return false;
    return true;
  });

  kopurua.textContent = `${filtratuak.length} kargagune`;

  if (!filtratuak.length) {
    zerrenda.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info mb-0">
          <i class="bi bi-info-circle me-1"></i>Ez da kargagunerik aurkitu bilaketa honekin.
        </div>
      </div>`;
    return;
  }

  zerrenda.innerHTML = filtratuak
    .map((takilla) => {
      const state = egoeraTakilla(takilla.egoera);
      const lehenIrudia = irudiakMap.get(takilla.id_takilla)?.[0];
      const reserveHref = Session.get()
        ? `erreserbak.html?kargagune=${takilla.id_takilla}`
        : `login.html?next=${encodeURIComponent(`erreserbak.html?kargagune=${takilla.id_takilla}`)}`;

      return `
        <div class="col-md-6 col-xl-4">
          <article class="card kargagune-card h-100 shadow-sm">
            <img
              src="${escapeHtml(imageUrl(lehenIrudia?.url))}"
              class="card-img-top"
              alt="${escapeHtml(takilla.izena)}"
              onerror="this.onerror=null;this.src='assets/placeholder.svg';" />
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                <h3 class="h5 mb-0">${escapeHtml(takilla.izena)}</h3>
                ${badge(state.label, state.css, state.icon)}
              </div>
              <p class="text-muted small mb-3">
                <i class="bi bi-geo-alt me-1"></i>${escapeHtml(takilla.helbidea)}
              </p>
              <div class="mt-auto d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-outline-primary btn-sm" data-detail-id="${takilla.id_takilla}">
                  <i class="bi bi-info-circle me-1"></i>Xehetasunak
                </button>
                <a class="btn btn-primary btn-sm" href="${reserveHref}">
                  <i class="bi bi-calendar-plus me-1"></i>Erreserbatu
                </a>
              </div>
            </div>
          </article>
        </div>`;
    })
    .join('');
}

async function openXehetasunak(id) {
  const title = document.getElementById('xehetasunIzena');
  const body = document.getElementById('xehetasunEdukia');
  const reserveLink = document.getElementById('xehetasunErreserbatu');

  title.textContent = 'Kargagunearen xehetasunak';
  body.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="text-muted mt-3 mb-0">Informazioa kargatzen...</p>
    </div>`;
  reserveLink.href = '#';
  reserveLink.classList.add('disabled');
  xehetasunModal.show();

  try {
    const [takilla, postuak, powerbanks, irudiak] = await Promise.all([
      api(`/takillak/${id}`),
      api(`/takillak/${id}/postuak`),
      api('/powerbanks'),
      api(`/takillak/${id}/irudiak`),
    ]);

    title.textContent = takilla.izena;

    const state = egoeraTakilla(takilla.egoera);
    const powerbankMap = new Map(
      powerbanks.map((powerbank) => [powerbank.id_postu, powerbank]),
    );

    const carousel = irudiak.length
      ? `
        <div id="detailCarousel" class="carousel slide mb-4" data-bs-ride="carousel">
          <div class="carousel-inner rounded">
            ${irudiak
              .map(
                (irudia, index) => `
                  <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img
                      src="${escapeHtml(imageUrl(irudia.url))}"
                      class="d-block w-100 detail-image"
                      alt="${escapeHtml(takilla.izena)}"
                      onerror="this.onerror=null;this.src='assets/placeholder.svg';" />
                  </div>`,
              )
              .join('')}
          </div>
          ${
            irudiak.length > 1
              ? `
                <button class="carousel-control-prev" type="button" data-bs-target="#detailCarousel" data-bs-slide="prev">
                  <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Aurrekoa</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#detailCarousel" data-bs-slide="next">
                  <span class="carousel-control-next-icon" aria-hidden="true"></span>
                  <span class="visually-hidden">Hurrengoa</span>
                </button>`
              : ''
          }
        </div>`
      : `
        <img
          src="assets/placeholder.svg"
          class="d-block w-100 detail-image mb-4"
          alt="${escapeHtml(takilla.izena)}" />`;

    const postuRows = postuak
      .map((postu) => {
        const powerbank = powerbankMap.get(postu.id_postu);
        const postState = egoeraPostua(postu.egoera);
        const reserves = takilla.egoera === 'erabilgarri' && Boolean(powerbank);

        return `
          <tr>
            <td class="fw-semibold">#${postu.id_postu}</td>
            <td>${badge(postState.label, postState.css, postState.icon)}</td>
            <td>${powerbank ? `#${powerbank.id_power}` : '<span class="text-muted">-</span>'}</td>
            <td>${powerbank ? `${powerbank.karga}%` : '<span class="text-muted">-</span>'}</td>
            <td>
              ${
                reserves
                  ? '<span class="badge text-bg-success"><i class="bi bi-check-circle me-1"></i>Erreserbagarri</span>'
                  : '<span class="badge text-bg-secondary"><i class="bi bi-slash-circle me-1"></i>Ez erabilgarri</span>'
              }
            </td>
          </tr>`;
      })
      .join('');

    body.innerHTML = `
      ${carousel}
      <div class="d-flex flex-wrap justify-content-between gap-2 mb-4">
        <div>
          <p class="mb-1"><i class="bi bi-geo-alt me-1 text-primary"></i>${escapeHtml(takilla.helbidea)}</p>
          <p class="mb-0 text-muted small">Kargagunearen identifikatzailea: #${takilla.id_takilla}</p>
        </div>
        ${badge(state.label, state.css, state.icon)}
      </div>

      <h3 class="h6 text-uppercase text-muted mb-3">Karga-postuen erabilgarritasuna</h3>
      ${
        postuak.length
          ? `
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Postua</th>
                    <th>Egoera</th>
                    <th>Powerbank</th>
                    <th>Karga</th>
                    <th>Erreserba</th>
                  </tr>
                </thead>
                <tbody>${postuRows}</tbody>
              </table>
            </div>`
          : '<div class="alert alert-info mb-0">Kargagune honek ez du karga-posturik.</div>'
      }`;

    const canReserve = takilla.egoera === 'erabilgarri';
    if (canReserve) {
      reserveLink.href = Session.get()
        ? `erreserbak.html?kargagune=${takilla.id_takilla}`
        : `login.html?next=${encodeURIComponent(`erreserbak.html?kargagune=${takilla.id_takilla}`)}`;
      reserveLink.classList.remove('disabled');
    } else {
      reserveLink.href = '#';
      reserveLink.classList.add('disabled');
    }
  } catch (error) {
    body.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(error.message)}</div>`;
  }
}

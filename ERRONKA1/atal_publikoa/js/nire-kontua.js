document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('urtea').textContent = new Date().getFullYear();

  if (!Session.require()) return;

  const alerta = document.getElementById('alerta');
  const profileForm = document.getElementById('profileForm');
  const profileButton = profileForm.querySelector('button[type="submit"]');
  const reservationsContainer = document.getElementById('erreserbakZerrenda');
  const statsContainer = document.getElementById('estatistikak');

  await kargatuProfila(alerta);
  await kargatuErreserbak();

  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!profileForm.checkValidity()) {
      profileForm.classList.add('was-validated');
      return;
    }

    const user = Session.get();
    if (!user) {
      Session.require();
      return;
    }

    const body = {
      nan: document.getElementById('nan').value.trim(),
      izena: document.getElementById('izena').value.trim(),
      abizenak: document.getElementById('abizenak').value.trim(),
      email: document.getElementById('email').value.trim(),
      helbidea: document.getElementById('helbidea').value.trim(),
    };

    const pasahitza = document.getElementById('pasahitza').value;
    if (pasahitza) body.pasahitza = pasahitza;

    setButtonLoading(profileButton, true, 'Gordetzen...');

    try {
      const updated = await api(`/erabiltzaileak/${user.id_erab}/nire-datuak`, {
        method: 'PATCH',
        body,
      });

      Session.save(updated);
      document.getElementById('pasahitza').value = '';
      document.getElementById('profileHello').textContent =
        `Kaixo, ${updated.izena} ${updated.abizenak}.`;
      renderNavbar('nire-kontua');
      showAlert(alerta, 'Zure datuak ondo eguneratu dira.', 'success');
    } catch (error) {
      showAlert(alerta, error.message, 'danger');
    } finally {
      setButtonLoading(profileButton, false);
    }
  });

  document
    .getElementById('refreshReservations')
    .addEventListener('click', kargatuErreserbak);

  async function kargatuProfila(alertaContainer) {
    const user = Session.get();
    try {
      const profile = await api(`/erabiltzaileak/${user.id_erab}/nire-datuak`);
      Session.save(profile);

      document.getElementById('nan').value = profile.nan;
      document.getElementById('izena').value = profile.izena;
      document.getElementById('abizenak').value = profile.abizenak;
      document.getElementById('email').value = profile.email;
      document.getElementById('helbidea').value = profile.helbidea;
      document.getElementById('profileHello').textContent =
        `Kaixo, ${profile.izena} ${profile.abizenak}.`;
    } catch (error) {
      showAlert(alertaContainer, error.message, 'danger');
    }
  }

  async function kargatuErreserbak() {
    const user = Session.get();
    if (!user) {
      Session.require();
      return;
    }
    try {
      const reservations = await fetchUserReservations(user.id_erab);

      const aktiboak = reservations.filter((item) => item.egoera === 'aktiboa').length;
      const amaituak = reservations.filter((item) => item.egoera === 'amaituta').length;
      const ezeztatuak = reservations.filter((item) => item.egoera === 'ezeztatuta').length;

      statsContainer.innerHTML = `
        <div class="col-6 col-md-3">
          <div class="card stat-card shadow-sm h-100">
            <div class="card-body">
              <div class="text-muted small">Guztira</div>
              <div class="h4 mb-0">${reservations.length}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card stat-card shadow-sm h-100" style="border-left-color: #198754;">
            <div class="card-body">
              <div class="text-muted small">Aktiboak</div>
              <div class="h4 mb-0">${aktiboak}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card stat-card shadow-sm h-100" style="border-left-color: #6c757d;">
            <div class="card-body">
              <div class="text-muted small">Amaituak</div>
              <div class="h4 mb-0">${amaituak}</div>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card stat-card shadow-sm h-100" style="border-left-color: #dc3545;">
            <div class="card-body">
              <div class="text-muted small">Ezeztatuak</div>
              <div class="h4 mb-0">${ezeztatuak}</div>
            </div>
          </div>
        </div>`;

      renderReservations(reservationsContainer, reservations, {
        emptyMessage: 'Oraindik ez duzu erreserbarik egin.',
        onCancelled: kargatuErreserbak,
        alertContainer: alerta,
      });
    } catch (error) {
      reservationsContainer.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(error.message)}</div>`;
    }
  }
});

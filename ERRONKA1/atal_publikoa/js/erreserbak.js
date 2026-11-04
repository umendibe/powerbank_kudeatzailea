document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('urtea').textContent = new Date().getFullYear();

  if (!Session.require()) return;

  const alerta = document.getElementById('alerta');
  const form = document.getElementById('reservationForm');
  const submitButton = form.querySelector('button[type="submit"]');
  const kargaguneSelect = document.getElementById('kargaguneSelect');
  const postuSelect = document.getElementById('postuSelect');
  const postuLaguntza = document.getElementById('postuLaguntza');
  const dataInput = document.getElementById('data');
  const hasieraInput = document.getElementById('hasieraOrdua');
  const amaieraInput = document.getElementById('amaieraOrdua');
  const reservationsContainer = document.getElementById('erreserbakZerrenda');
  const disponibilitatea = document.getElementById('disponibilitatea');
  const postuTaula = document.getElementById('postuTaula');

  let unekoPostuak = [];
  let unekoPowerbankMap = new Map();
  let erreserbaGuztiak = [];

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  dataInput.min = todayString;
  dataInput.value = todayString;

  await kargatuKargaguneak();
  await kargatuErreserbak();

  kargaguneSelect.addEventListener('change', async () => {
    await kargatuPostuak(kargaguneSelect.value);
  });

  [postuSelect, dataInput, hasieraInput, amaieraInput].forEach((input) => {
    input.addEventListener('change', eguneratuDisponibilitatea);
  });

  postuTaula.addEventListener('click', (event) => {
    const button = event.target.closest('[data-choose-post]');
    if (!button) return;

    postuSelect.value = button.dataset.choosePost;
    eguneratuDisponibilitatea();
  });

  document
    .getElementById('refreshReservations')
    .addEventListener('click', kargatuDatuakBerriro);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const user = Session.get();
    if (!user) {
      Session.require();
      return;
    }

    const selectedPost = postuSelect.selectedOptions[0];
    const idPower = Number(selectedPost?.dataset.power || 0);
    const idPostu = Number(postuSelect.value);
    const idKargagune = Number(kargaguneSelect.value);

    if (!idKargagune || !idPostu || !idPower) {
      showAlert(alerta, 'Aukeratu kargagunea eta karga-postua.', 'danger');
      return;
    }

    const tarte = lortuTartea();
    if (!tarte || tarte.error) {
      showAlert(alerta, tarte?.error || 'Aukeratu eguna, hasiera-ordua eta amaiera-ordua.', 'danger');
      return;
    }

    if (duGatazka(idPostu, idPower, tarte.hasiera, tarte.amaiera)) {
      showAlert(
        alerta,
        'Aukeratutako karga-postuak beste erreserba bat du ordu-tarte horretan. Aukeratu beste postu edo tarte bat.',
        'danger',
      );
      eguneratuDisponibilitatea();
      return;
    }

    setButtonLoading(submitButton, true, 'Erreserbatzen...');

    try {
      await api('/erreserbak/publiko', {
        method: 'POST',
        body: {
          id_erab: user.id_erab,
          id_power: idPower,
          erreserba_hasiera: tarte.hasiera.toISOString(),
          erreserba_bukaera: tarte.amaiera.toISOString(),
          id_hasiera_takilla: idKargagune,
          id_hasiera_postua: idPostu,
        },
      });

      showAlert(
        alerta,
        'Erreserba ondo sortu da. Zure erreserben zerrendan ikus dezakezu.',
        'success',
      );

      postuSelect.value = '';
      hasieraInput.value = '';
      amaieraInput.value = '';
      form.classList.remove('was-validated');

      await kargatuPostuak(kargaguneSelect.value);
      await kargatuErreserbak();

      reservationsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showAlert(alerta, error.message, 'danger');
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  async function kargatuKargaguneak() {
    try {
      const takillak = await api('/takillak');
      kargaguneSelect.innerHTML = '<option value="">Aukeratu kargagunea</option>';

      for (const takilla of takillak) {
        const option = document.createElement('option');
        option.value = String(takilla.id_takilla);
        option.textContent = `${takilla.izena} · ${takilla.helbidea}`;
        option.disabled = takilla.egoera !== 'erabilgarri';
        if (option.disabled) {
          option.textContent += ' (ez dago erabilgarri)';
        }
        kargaguneSelect.appendChild(option);
      }

      const preselect = Number(
        new URLSearchParams(location.search).get('kargagune'),
      );
      if (preselect) {
        const option = kargaguneSelect.querySelector(`option[value="${preselect}"]`);
        if (option && !option.disabled) {
          kargaguneSelect.value = String(preselect);
          await kargatuPostuak(preselect);
        }
      }
    } catch (error) {
      showAlert(alerta, error.message, 'danger');
    }
  }

  async function kargatuPostuak(kargaguneId) {
    postuSelect.disabled = true;
    postuSelect.innerHTML = '<option value="">Aukeratu karga-postua</option>';
    postuLaguntza.textContent = 'Postu bakoitzak bertan dagoen powerbank-a erakusten du.';
    unekoPostuak = [];
    unekoPowerbankMap = new Map();
    erreserbaGuztiak = [];

    if (!kargaguneId) {
      postuSelect.innerHTML = '<option value="">Lehenengo aukeratu kargagunea</option>';
      eguneratuDisponibilitatea();
      return;
    }

    try {
      const [postuak, powerbanks, erreserbak] = await Promise.all([
        api(`/takillak/${kargaguneId}/postuak`),
        api('/powerbanks'),
        api('/erreserbak'),
      ]);

      unekoPostuak = postuak;
      unekoPowerbankMap = new Map(
        powerbanks.map((powerbank) => [powerbank.id_postu, powerbank]),
      );
      erreserbaGuztiak = erreserbak;

      const erabilgarriak = postuak.filter((postu) =>
        unekoPowerbankMap.has(postu.id_postu),
      );

      if (!erabilgarriak.length) {
        postuSelect.innerHTML =
          '<option value="">Ez dago powerbank-ik kargagune honetan</option>';
        postuLaguntza.textContent =
          'Kargagune honetan ez dago une honetan erreserbatzeko powerbank-ik.';
        eguneratuDisponibilitatea();
        return;
      }

      postuSelect.innerHTML = '<option value="">Aukeratu karga-postua</option>';
      for (const postu of erabilgarriak) {
        const powerbank = unekoPowerbankMap.get(postu.id_postu);
        const option = document.createElement('option');
        option.value = String(postu.id_postu);
        option.dataset.power = String(powerbank.id_power);
        option.textContent = `Postua #${postu.id_postu} · Powerbank #${powerbank.id_power} (${powerbank.karga}%)`;
        postuSelect.appendChild(option);
      }

      postuSelect.disabled = false;
      postuLaguntza.textContent = `${erabilgarriak.length} karga-postu erabilgarri.`;
      eguneratuDisponibilitatea();
    } catch (error) {
      showAlert(alerta, error.message, 'danger');
      eguneratuDisponibilitatea();
    }
  }

  function lortuTartea() {
    if (!dataInput.value || !hasieraInput.value || !amaieraInput.value) {
      return { hasiera: null, amaiera: null, error: null };
    }

    const hasiera = new Date(`${dataInput.value}T${hasieraInput.value}:00`);
    const amaiera = new Date(`${dataInput.value}T${amaieraInput.value}:00`);

    if (Number.isNaN(hasiera.getTime()) || Number.isNaN(amaiera.getTime())) {
      return {
        hasiera: null,
        amaiera: null,
        error: 'Data edo orduak ez dira baliozkoak.',
      };
    }

    if (amaiera <= hasiera) {
      return {
        hasiera,
        amaiera,
        error: 'Amaiera-ordua hasiera-ordua baino beranduagoa izan behar da.',
      };
    }

    if (hasiera <= new Date()) {
      return {
        hasiera,
        amaiera,
        error: 'Erreserba etorkizuneko data eta orduetarako egin behar da.',
      };
    }

    return { hasiera, amaiera, error: null };
  }

  function duGatazka(idPostu, idPower, hasiera, amaiera) {
    return erreserbaGuztiak.some((erreserba) => {
      if (erreserba.egoera !== 'aktiboa') return false;

      const postuBera = Number(erreserba.id_hasiera_postua) === Number(idPostu);
      const powerBera = Number(erreserba.id_power) === Number(idPower);
      if (!postuBera && !powerBera) return false;

      return (
        new Date(erreserba.erreserba_hasiera) < amaiera &&
        new Date(erreserba.erreserba_bukaera) > hasiera
      );
    });
  }

  function eguneratuDisponibilitatea() {
    const tarte = lortuTartea();
    postuTaula.innerHTML = renderPostuTaula(tarte);

    if (!kargaguneSelect.value) {
      setDisponibilitatea(
        'secondary',
        'calendar-check',
        'Aukeratu kargagunea, karga-postua eta ordu-tartea erabilgarritasuna ikusteko.',
      );
      return;
    }

    if (!unekoPostuak.length) {
      setDisponibilitatea(
        'info',
        'info-circle',
        'Kargagune honek ez du karga-posturik.',
      );
      return;
    }

    if (!postuSelect.value) {
      setDisponibilitatea(
        'secondary',
        'calendar-check',
        'Aukeratu karga-postu bat eta ordu-tartea erabilgarritasuna ikusteko.',
      );
      return;
    }

    if (tarte.error) {
      setDisponibilitatea('warning', 'exclamation-triangle', tarte.error);
      return;
    }

    if (!tarte.hasiera) {
      setDisponibilitatea(
        'info',
        'clock',
        'Aukeratu erreserbaren eguna eta hasiera- eta amaiera-orduak.',
      );
      return;
    }

    const powerbank = unekoPowerbankMap.get(Number(postuSelect.value));
    if (!powerbank) {
      setDisponibilitatea(
        'danger',
        'x-circle',
        'Karga-postu honek ez du powerbank-ik une honetan.',
      );
      return;
    }

    if (
      duGatazka(
        Number(postuSelect.value),
        powerbank.id_power,
        tarte.hasiera,
        tarte.amaiera,
      )
    ) {
      setDisponibilitatea(
        'danger',
        'x-circle',
        'Karga-postu hau ez dago libre ordu-tarte horretan. Aukeratu beste postu edo tarte bat.',
      );
      return;
    }

    setDisponibilitatea(
      'success',
      'check-circle',
      `Karga-postua libre dago ${formatDateTime(tarte.hasiera.toISOString())} - ${formatTime(tarte.amaiera.toISOString())} tartean.`,
    );
  }

  function renderPostuTaula(tarte) {
    if (!kargaguneSelect.value) {
      return '<p class="text-muted mb-0">Aukeratu kargagune bat karga-postuak ikusteko.</p>';
    }

    if (!unekoPostuak.length) {
      return '<div class="alert alert-info mb-0">Kargagune honek ez du karga-posturik.</div>';
    }

    const tarteBaliozkoa = tarte && tarte.hasiera && !tarte.error;

    const rows = unekoPostuak
      .map((postu) => {
        const powerbank = unekoPowerbankMap.get(postu.id_postu);
        const state = egoeraPostua(postu.egoera);
        let erabilgarritasuna = badge('Aukeratu ordua', 'secondary', 'clock');

        if (powerbank && tarteBaliozkoa) {
          const okupatuta = duGatazka(
            postu.id_postu,
            powerbank.id_power,
            tarte.hasiera,
            tarte.amaiera,
          );
          erabilgarritasuna = okupatuta
            ? badge('Okupatuta', 'danger', 'x-circle-fill')
            : badge('Libre', 'success', 'check-circle-fill');
        } else if (!powerbank) {
          erabilgarritasuna = badge('Powerbankik gabe', 'secondary', 'battery');
        }

        return `
          <tr>
            <td class="fw-semibold">#${postu.id_postu}</td>
            <td>${badge(state.label, state.css, state.icon)}</td>
            <td>${powerbank ? `#${powerbank.id_power}` : '<span class="text-muted">-</span>'}</td>
            <td>${powerbank ? `${powerbank.karga}%` : '<span class="text-muted">-</span>'}</td>
            <td>${erabilgarritasuna}</td>
            <td class="text-end">
              ${
                powerbank
                  ? `<button type="button" class="btn btn-outline-primary btn-sm" data-choose-post="${postu.id_postu}">
                       <i class="bi bi-check2 me-1"></i>Aukeratu
                     </button>`
                  : '<span class="text-muted small">-</span>'
              }
            </td>
          </tr>`;
      })
      .join('');

    return `
      <div class="table-responsive">
        <table class="table table-sm table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Postua</th>
              <th>Egoera</th>
              <th>Powerbank</th>
              <th>Karga</th>
              <th>Hautatutako tartea</th>
              <th class="text-end">Ekintza</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function setDisponibilitatea(type, icon, message) {
    disponibilitatea.className = `alert alert-${type} small`;
    disponibilitatea.innerHTML = `<i class="bi bi-${icon} me-1"></i>${escapeHtml(message)}`;
  }

  async function kargatuDatuakBerriro() {
    if (kargaguneSelect.value) {
      await kargatuPostuak(kargaguneSelect.value);
    }
    await kargatuErreserbak();
  }

  async function kargatuErreserbak() {
    const user = Session.get();
    if (!user) {
      Session.require();
      return;
    }
    try {
      const reservations = await fetchUserReservations(user.id_erab);
      renderReservations(reservationsContainer, reservations, {
        emptyMessage: 'Oraindik ez duzu erreserbarik egin.',
        onCancelled: kargatuDatuakBerriro,
        alertContainer: alerta,
      });
    } catch (error) {
      reservationsContainer.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(error.message)}</div>`;
    }
  }
});

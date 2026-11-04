async function fetchUserReservations(userId) {
  const [reservations, takillak] = await Promise.all([
    api(`/erabiltzaileak/${userId}/erreserbak`),
    api('/takillak'),
  ]);

  const takillaMap = new Map(takillak.map((takilla) => [takilla.id_takilla, takilla]));

  return reservations
    .map((reservation) => ({
      ...reservation,
      kargagune_izena:
        takillaMap.get(reservation.id_hasiera_takilla)?.izena ||
        `#${reservation.id_hasiera_takilla}`,
    }))
    .sort(
      (a, b) =>
        new Date(b.erreserba_hasiera).getTime() -
        new Date(a.erreserba_hasiera).getTime(),
    );
}

function isFutureReservation(reservation) {
  return new Date(reservation.erreserba_hasiera).getTime() > Date.now();
}

function canCancelReservation(reservation) {
  return reservation.egoera === 'aktiboa' && isFutureReservation(reservation);
}

function renderReservations(
  container,
  reservations,
  {
    emptyMessage = 'Ez duzu erreserbarik.',
    onCancelled = null,
    alertContainer = null,
  } = {},
) {
  if (!container) return;

  if (!reservations.length) {
    container.innerHTML = `<div class="alert alert-info mb-0">${escapeHtml(emptyMessage)}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>Kargagunea</th>
            <th>Powerbank</th>
            <th>Hasiera</th>
            <th>Bukaera</th>
            <th>Egoera</th>
            <th class="text-end">Ekintza</th>
          </tr>
        </thead>
        <tbody>
          ${reservations
            .map((reservation) => {
              const state = egoeraErreserba(reservation.egoera);
              return `
                <tr>
                  <td>
                    <span class="fw-semibold">${escapeHtml(reservation.kargagune_izena)}</span>
                    <div class="small text-muted">
                      #${reservation.id_hasiera_takilla} · Postua #${reservation.id_hasiera_postua}
                    </div>
                  </td>
                  <td>#${reservation.id_power}</td>
                  <td class="text-nowrap">${formatDateTime(reservation.erreserba_hasiera)}</td>
                  <td class="text-nowrap">${formatDateTime(reservation.erreserba_bukaera)}</td>
                  <td>${badge(state.label, state.css, state.icon)}</td>
                  <td class="text-end">
                    ${
                      canCancelReservation(reservation)
                        ? `<button type="button" class="btn btn-outline-danger btn-sm" data-cancel-id="${reservation.id_erreserba}">
                             <i class="bi bi-x-circle me-1"></i>Ezeztatu
                           </button>`
                        : '<span class="text-muted small">-</span>'
                    }
                  </td>
                </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>`;

  container.querySelectorAll('[data-cancel-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const reservationId = Number(button.dataset.cancelId);
      const reservation = reservations.find(
        (item) => item.id_erreserba === reservationId,
      );
      if (!reservation) return;

      const user = Session.get();
      if (!user) {
        Session.require();
        return;
      }

      const confirmed = await confirmAction(
        `Erreserba #${reservationId} (${reservation.kargagune_izena}) ezeztatu nahi duzu?`,
        'Ezeztatu',
      );
      if (!confirmed) return;

      setButtonLoading(button, true, 'Ezeztatzen...');
      try {
        await api(`/erreserbak/${reservationId}/ezeztatu-publikoa`, {
          method: 'PATCH',
          body: { id_erab: user.id_erab },
        });
        showAlert(alertContainer, 'Erreserba ondo ezeztatu da.', 'success');
        if (onCancelled) await onCancelled();
      } catch (error) {
        setButtonLoading(button, false);
        showAlert(alertContainer, error.message, 'danger');
      }
    });
  });
}

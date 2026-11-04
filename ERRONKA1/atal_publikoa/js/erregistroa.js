document.addEventListener('DOMContentLoaded', () => {
  const alerta = document.getElementById('alerta');
  const form = document.getElementById('registerForm');
  const submitButton = form.querySelector('button[type="submit"]');

  document.getElementById('urtea').textContent = new Date().getFullYear();

  const next = new URLSearchParams(location.search).get('next');
  const destination = safeNext(next, 'nire-kontua.html');
  document.getElementById('loginLink').href =
    `login.html?next=${encodeURIComponent(destination)}`;

  if (Session.get()) {
    location.href = destination;
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const pasahitza = document.getElementById('pasahitza').value;
    const pasahitzaErrepikatu = document.getElementById('pasahitzaErrepikatu').value;

    if (pasahitza !== pasahitzaErrepikatu) {
      document
        .getElementById('pasahitzaErrepikatu')
        .setCustomValidity('Pasahitzak ez datoz bat.');
      showAlert(alerta, 'Pasahitzak ez datoz bat.', 'danger');
      form.classList.add('was-validated');
      return;
    }

    document.getElementById('pasahitzaErrepikatu').setCustomValidity('');

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const body = {
      nan: document.getElementById('nan').value.trim(),
      izena: document.getElementById('izena').value.trim(),
      abizenak: document.getElementById('abizenak').value.trim(),
      email: document.getElementById('email').value.trim(),
      pasahitza,
      helbidea: document.getElementById('helbidea').value.trim(),
    };

    setButtonLoading(submitButton, true, 'Erregistratzen...');

    try {
      await api('/erabiltzaileak/erregistratu', { method: 'POST', body });

      const user = await api('/login/public', {
        method: 'POST',
        body: { email: body.email, pasahitza: body.pasahitza },
      });

      Session.save(user);
      location.href = destination;
    } catch (error) {
      setButtonLoading(submitButton, false);
      showAlert(alerta, error.message, 'danger');
    }
  });
});

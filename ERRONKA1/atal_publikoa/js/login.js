document.addEventListener('DOMContentLoaded', () => {
  const next = new URLSearchParams(location.search).get('next');
  const alerta = document.getElementById('alerta');
  const form = document.getElementById('loginForm');
  const submitButton = form.querySelector('button[type="submit"]');

  document.getElementById('urtea').textContent = new Date().getFullYear();

  const destination = safeNext(next, 'nire-kontua.html');
  const registerLink = document.getElementById('registerLink');
  registerLink.href = `erregistroa.html?next=${encodeURIComponent(destination)}`;

  if (Session.get()) {
    location.href = destination;
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const email = document.getElementById('email').value.trim();
    const pasahitza = document.getElementById('pasahitza').value;

    setButtonLoading(submitButton, true, 'Saioa hasten...');

    try {
      const user = await api('/login/public', {
        method: 'POST',
        body: { email, pasahitza },
      });

      Session.save(user);
      location.href = destination;
    } catch (error) {
      setButtonLoading(submitButton, false);
      showAlert(alerta, error.message, 'danger');
    }
  });
});

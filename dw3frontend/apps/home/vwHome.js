document.addEventListener('DOMContentLoaded', function() {
  if (!dw3IsLogged()) {
    return;
  }

  document.getElementById('usuarioLogado').textContent = localStorage.getItem('username') || '';
});

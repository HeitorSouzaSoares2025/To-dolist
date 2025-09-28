// Seletores
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const themeSelect = document.getElementById('themeSelect');

// Verifica se já existe login
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    window.location.href = 'index.html';
  }
});

// Login
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const theme = themeSelect.value;

  if (!username) return;

  // Salvar usuário atual
  localStorage.setItem('currentUser', username);
  localStorage.setItem('theme', theme);

  // Se não existir lista de tarefas para esse usuário, cria uma vazia
  if (!localStorage.getItem(`tasks_${username}`)) {
    localStorage.setItem(`tasks_${username}`, JSON.stringify([]));
  }

  window.location.href = 'index.html';
});

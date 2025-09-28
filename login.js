// ============================
// Seletores dos elementos HTML
// ============================

// Pega o formulário de login pelo ID
const loginForm = document.getElementById('loginForm');

// Pega o campo de entrada do nome de usuário
const usernameInput = document.getElementById('username');

// Pega o select de escolha do tema
const themeSelect = document.getElementById('themeSelect');


// ======================================
// Verifica se já existe um usuário logado
// ======================================

// Quando a página termina de carregar (DOMContentLoaded)
window.addEventListener('DOMContentLoaded', () => {
  // Busca no localStorage se já existe um usuário salvo
  const savedUser = localStorage.getItem('currentUser');

  // Se encontrar, redireciona direto para a página principal
  if (savedUser) {
    window.location.href = 'index.html';
  }
});


// ===================
// Lógica do formulário
// ===================

// Quando o formulário de login for enviado
loginForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Impede o comportamento padrão do formulário (que é recarregar a página)

  // Obtém os valores inseridos pelo usuário
  const username = usernameInput.value.trim(); // Remove espaços extras do nome
  const theme = themeSelect.value; // Pega o tema escolhido

  // Se o campo do nome estiver vazio, não faz nada
  if (!username) return;

  // Salva o nome do usuário atual no localStorage
  localStorage.setItem('currentUser', username);

  // Salva o tema escolhido pelo usuário
  localStorage.setItem('theme', theme);

  // Se o usuário não tiver ainda uma lista de tarefas salva, cria uma vazia
  if (!localStorage.getItem(`tasks_${username}`)) {
    localStorage.setItem(`tasks_${username}`, JSON.stringify([]));
  }

  // Redireciona para a página principal do app de tarefas
  window.location.href = 'index.html';
});

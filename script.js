// ===============================
// SCRIPT PRINCIPAL DO TASKMASTER
// ===============================

// --- Seletores principais
const currentUser = localStorage.getItem('currentUser'); // pega usuário logado
const taskForm = document.getElementById('taskForm');    // formulário de nova tarefa
const taskInput = document.getElementById('taskInput');  // input do título da tarefa
const prioritySelect = document.getElementById('prioritySelect'); // prioridade
const dueDateInput = document.getElementById('dueDate'); // data limite
const categoryInput = document.getElementById('categoryInput'); // categoria
const taskList = document.getElementById('taskList');    // lista onde tarefas serão renderizadas
const themeToggle = document.getElementById('themeToggle'); // botão tema
const compactToggle = document.getElementById('compactToggle'); // botão modo compacto
const filterSelect = document.getElementById('filterSelect');   // seletor de filtros
const searchInput = document.getElementById('searchInput');     // barra de pesquisa
const progressBar = document.getElementById('progressBar');     // barra de progresso
const badgeArea = document.getElementById('badgeArea');         // área de badges
const chartCanvas = document.getElementById('taskChart');       // gráfico

// --- Se não estiver logado, volta para login
if (!currentUser) {
  window.location.href = 'login.html';
}

// --- Carregar ou inicializar lista de tarefas do usuário
let tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`) || '[]');

// -----------------------------
// Salvar tarefas no localStorage
function saveTasks() {
  localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
}

// -----------------------------
// Alternância de Tema
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

// Restaurar tema salvo
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') document.body.classList.add('dark');

// -----------------------------
// Modo compacto
compactToggle.addEventListener('click', () => {
  document.body.classList.toggle('compact');
  localStorage.setItem('compact', document.body.classList.contains('compact'));
});

// Restaurar modo compacto salvo
if (localStorage.getItem('compact') === 'true') {
  document.body.classList.add('compact');
}

// -----------------------------
// Adicionar nova tarefa
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = taskInput.value.trim();
  const priority = prioritySelect.value;
  const due = dueDateInput.value;
  const category = categoryInput.value.trim();

  if (!title) return;

  const task = {
    id: Date.now(),       // id único
    title,                // título
    priority,             // prioridade
    due,                  // data limite
    category,             // categoria
    completed: false,     // estado inicial
    important: false,     // marcação de importante
    subtasks: []          // lista de subtarefas
  };

  tasks.unshift(task);    // adiciona no topo da lista
  saveTasks();
  renderTasks();          // renderiza novamente
  taskForm.reset();       // limpa formulário
});

// -----------------------------
// Renderizar lista de tarefas
function renderTasks() {
  taskList.innerHTML = '';

  // Aplicar filtro
  const filter = filterSelect.value;
  const search = searchInput.value.toLowerCase();

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search);
    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'completed') return t.completed;
    if (filter === 'important') return t.important;
    if (filter === 'pending') return !t.completed;
    return true;
  });

  filteredTasks.forEach(t => {
    const li = document.createElement('li');
    li.className = `task-card ${t.completed ? 'completed' : ''}`;

    // Título da tarefa
    const title = document.createElement('span');
    title.textContent = t.title;

    // Botão completar
    const completeBtn = document.createElement('button');
    completeBtn.textContent = '✔';
    completeBtn.addEventListener('click', () => {
      t.completed = !t.completed;
      saveTasks();
      renderTasks();
    });

    // Botão importante
    const importantBtn = document.createElement('button');
    importantBtn.textContent = '★';
    if (t.important) importantBtn.classList.add('active');
    importantBtn.addEventListener('click', () => {
      t.important = !t.important;
      saveTasks();
      renderTasks();
    });

    // Botão deletar
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑';
    deleteBtn.addEventListener('click', () => {
      tasks = tasks.filter(task => task.id !== t.id);
      saveTasks();
      renderTasks();
    });

    li.appendChild(title);
    li.appendChild(completeBtn);
    li.appendChild(importantBtn);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  });

  updateProgress();
  updateChart();
  updateBadges();
}

// -----------------------------
// Atualizar barra de progresso
function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = `${percent}%`;
  progressBar.textContent = `${percent}%`;
}

// -----------------------------
// Atualizar gráfico
function updateChart() {
  const ctx = chartCanvas.getContext('2d');
  const done = tasks.filter(t => t.completed).length;
  const pending = tasks.length - done;

  // Reseta canvas
  ctx.clearRect(0,0,chartCanvas.width,chartCanvas.height);

  // Simples gráfico de barras
  ctx.fillStyle = 'green';
  ctx.fillRect(20, 200 - done*10, 40, done*10);

  ctx.fillStyle = 'red';
  ctx.fillRect(80, 200 - pending*10, 40, pending*10);

  ctx.fillStyle = '#fff';
  ctx.fillText(`Concluídas: ${done}`, 20, 220);
  ctx.fillText(`Pendentes: ${pending}`, 80, 220);
}

// -----------------------------
// Badges / Conquistas
function updateBadges() {
  badgeArea.innerHTML = '';
  const done = tasks.filter(t => t.completed).length;

  if (done >= 1) badgeArea.innerHTML += '<span>🏆 Primeira tarefa concluída!</span>';
  if (done >= 10) badgeArea.innerHTML += '<span>🔥 10 tarefas concluídas!</span>';
  if (done >= 50) badgeArea.innerHTML += '<span>💎 50 tarefas concluídas!</span>';
}

// -----------------------------
// Busca e filtros
searchInput.addEventListener('input', renderTasks);
filterSelect.addEventListener('change', renderTasks);

// -----------------------------
// Notificações
if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

function notify(msg) {
  if (Notification.permission === 'granted') {
    new Notification(msg);
  }
}

// -----------------------------
// PWA: registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker registrado!'))
    .catch(err => console.error('Erro SW:', err));
}

// -----------------------------
// Inicialização
document.addEventListener('DOMContentLoaded', renderTasks);

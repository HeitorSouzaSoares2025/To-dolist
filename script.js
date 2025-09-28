// ----------------- Usuário atual -----------------
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
  window.location.href = 'login.html';
}

let tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`)) || [];

// Salvar sempre com base no usuário logado
function saveTasks() {
  localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
}

// ----------------- Seletores -----------------
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const tasksChartCtx = document.getElementById('tasksChart').getContext('2d');
const badgeGrid = document.getElementById('badgeGrid');
const trophyModal = document.getElementById('trophyModal');
const trophyMessage = document.getElementById('trophyMessage');
const closeTrophy = document.getElementById('closeTrophy');

const taskInput = document.getElementById('taskInput');
const priorityInput = document.getElementById('priorityInput');
const dueDateInput = document.getElementById('dueDateInput');
const categorySelect = document.getElementById('categorySelect');
const customCategoryInput = document.getElementById('customCategoryInput');

let chart;

// ----------------- Tema -----------------
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
});

// Aplica tema salvo
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');
});

// ----------------- Mostrar campo de categoria personalizada -----------------
categorySelect.addEventListener('change', () => {
  if (categorySelect.value === 'custom') {
    customCategoryInput.classList.remove('hidden');
  } else {
    customCategoryInput.classList.add('hidden');
    customCategoryInput.value = '';
  }
});

// ----------------- Adicionar Tarefa -----------------
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = taskInput.value.trim();
  const priority = priorityInput.value;
  const due = dueDateInput.value;
  const category = categorySelect.value === 'custom' && customCategoryInput.value.trim()
    ? customCategoryInput.value.trim()
    : categorySelect.value;

  if (!title) return;

  const newTask = {
    id: Date.now(),
    title,
    priority,
    due,
    category,
    completed: false,
    important: false
  };

  tasks.push(newTask);
  saveTasks(); // ✅ salva por usuário

  renderTasks();
  updateChart();
  checkBadges();

  taskForm.reset();
  customCategoryInput.classList.add('hidden');
});

// ----------------- Renderização -----------------
function renderTasks() {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;

  taskList.innerHTML = '';

  tasks
    .filter(task =>
      (task.title.toLowerCase().includes(search)) &&
      (filter === 'all' ||
       (filter === 'pending' && !task.completed) ||
       (filter === 'completed' && task.completed) ||
       (filter === 'important' && task.important) ||
       (filter === task.category))
    )
    .forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card priority-${task.priority} ${task.important ? 'important' : ''}`;

      card.innerHTML = `
        <div>
          <h3>${task.title}</h3>
          <small>Categoria: ${task.category}</small><br>
          <small>Prazo: ${task.due || '—'}</small>
        </div>
        <div>
          <button class="star-btn" onclick="toggleImportant(${task.id})">⭐</button>
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${task.id})">
        </div>
      `;

      taskList.appendChild(card);
    });
}

// ----------------- Funções de Tarefa -----------------
function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  saveTasks(); // ✅
  renderTasks();
  updateChart();
  checkBadges();
}

function toggleImportant(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.important = !task.important;
  saveTasks(); // ✅
  renderTasks();
}

searchInput.addEventListener('input', renderTasks);
filterSelect.addEventListener('change', renderTasks);

// ----------------- Gráfico -----------------
function updateChart() {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  if (chart) chart.destroy();
  chart = new Chart(tasksChartCtx, {
    type: 'doughnut',
    data: {
      labels: ['Concluídas', 'Pendentes'],
      datasets: [{
        data: [completed, pending],
        backgroundColor: ['#22c55e', '#f59e0b']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// ----------------- Badges -----------------
function checkBadges() {
  const completed = tasks.filter(t => t.completed).length;
  badgeGrid.innerHTML = '';

  const allBadges = [
    { icon: '🥉', text: 'Primeira Tarefa', unlock: 1 },
    { icon: '🥈', text: '5 Tarefas', unlock: 5 },
    { icon: '🥇', text: '10 Tarefas', unlock: 10 },
    { icon: '🏆', text: '20 Tarefas Concluídas', unlock: 20 }
  ];

  let newlyUnlocked = null;

  allBadges.forEach(b => {
    const badge = document.createElement('div');
    badge.className = 'badge ' + (completed >= b.unlock ? 'earned' : 'locked');

    badge.innerHTML = `
      <div class="icon">${b.icon}</div>
      <p>${b.text}</p>
    `;

    badgeGrid.appendChild(badge);

    // animação se desbloqueou agora
    if (completed === b.unlock) {
      newlyUnlocked = b;
      badge.animate([
        { transform: 'scale(0.8)', opacity: 0 },
        { transform: 'scale(1.1)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 600, easing: 'ease-out' });
    }
  });

  // Mostrar modal para nova conquista
  if (newlyUnlocked) {
    trophyMessage.textContent = `Você desbloqueou: ${newlyUnlocked.text}`;
    trophyModal.style.display = 'flex';
  }
}

// ----------------- Inicialização -----------------
renderTasks();
updateChart();
checkBadges();

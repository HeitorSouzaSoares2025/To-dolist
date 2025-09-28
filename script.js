// Seletores
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

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let chart;

// ----------------- Tema -----------------
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// ----------------- Adicionar Tarefa -----------------
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const desc = document.getElementById('taskDesc').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const due = document.getElementById('taskDue').value;

  const newTask = {
    id: Date.now(),
    title,
    desc,
    priority,
    due,
    completed: false,
    important: false
  };

  tasks.push(newTask);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
  updateChart();
  taskForm.reset();
});

// ----------------- Renderização -----------------
function renderTasks() {
  const search = searchInput.value.toLowerCase();
  const filter = filterSelect.value;

  taskList.innerHTML = '';

  tasks
    .filter(task => 
      (task.title.toLowerCase().includes(search) || task.desc.toLowerCase().includes(search)) &&
      (filter === 'all' ||
       (filter === 'pending' && !task.completed) ||
       (filter === 'completed' && task.completed) ||
       (filter === 'important' && task.important))
    )
    .forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card priority-${task.priority} ${task.important ? 'important' : ''}`;

      card.innerHTML = `
        <div>
          <h3>${task.title}</h3>
          <p>${task.desc || ''}</p>
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
  localStorage.setItem('tasks', JSON.stringify(tasks));
  renderTasks();
  updateChart();
  checkBadges();
}

function toggleImportant(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.important = !task.important;
  localStorage.setItem('tasks', JSON.stringify(tasks));
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

  const badges = [];
  if (completed >= 1) badges.push({ icon: '🥉', text: 'Primeira Tarefa' });
  if (completed >= 5) badges.push({ icon: '🥈', text: '5 Tarefas' });
  if (completed >= 10) badges.push({ icon: '🥇', text: '10 Tarefas' });
  if (completed >= 20) badges.push({ icon: '🏆', text: '20 Tarefas Concluídas' });

  badges.forEach(b => {
    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.innerHTML = `<div style="font-size:2rem;">${b.icon}</div><p>${b.text}</p>`;
    badgeGrid.appendChild(badge);
  });

  if (badges.length) {
    const lastBadge = badges[badges.length - 1];
    trophyMessage.textContent = `Você desbloqueou: ${lastBadge.text}`;
    trophyModal.style.display = 'flex';
  }
}

closeTrophy.addEventListener('click', () => {
  trophyModal.style.display = 'none';
});

// ----------------- Inicialização -----------------
renderTasks();
updateChart();
checkBadges();

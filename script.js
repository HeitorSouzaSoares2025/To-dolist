// script.js
// Entrypoint for TaskMaster: drag-drop, subtasks, compact mode, notifications, PWA registration.

// ----------------- Usuário atual -----------------
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
  window.location.href = 'login.html';
}

// load tasks per user
let tasks = JSON.parse(localStorage.getItem(`tasks_${currentUser}`)) || [];
function saveTasks(){ localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks)); }

// ----------------- Selectors -----------------
const userLabel = document.getElementById('userLabel');
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const themeToggle = document.getElementById('themeToggle');
const compactToggle = document.getElementById('compactToggle');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const tasksChartCtx = document.getElementById('tasksChart');
const badgeGrid = document.getElementById('badgeGrid');
const trophyModal = document.getElementById('trophyModal');
const trophyMessage = document.getElementById('trophyMessage');
const closeTrophy = document.getElementById('closeTrophy');
const logoutBtn = document.getElementById('logoutBtn');

const taskInput = document.getElementById('taskInput');
const priorityInput = document.getElementById('priorityInput');
const dueDateInput = document.getElementById('dueDateInput');
const categorySelect = document.getElementById('categorySelect');
const customCategoryInput = document.getElementById('customCategoryInput');

const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

let chart = null;

// show user label
userLabel.textContent = `Usuário: ${currentUser}`;

// ----------------- Theme & Compact -----------------
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});
compactToggle.addEventListener('click', () => {
  document.body.classList.toggle('compact');
  compactToggle.textContent = document.body.classList.contains('compact') ? '📐 Normal' : '📐 Compacto';
  localStorage.setItem('compact', document.body.classList.contains('compact') ? '1':'0');
});

// apply saved
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
  if (localStorage.getItem('compact') === '1') {
    document.body.classList.add('compact');
    compactToggle.textContent = '📐 Normal';
  }
});

// ----------------- Category custom field -----------------
categorySelect.addEventListener('change', () => {
  customCategoryInput.classList.toggle('hidden', categorySelect.value !== 'custom');
  if (categorySelect.value !== 'custom') customCategoryInput.value = '';
});

// ----------------- Task form submit -----------------
taskForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const title = taskInput.value.trim();
  if(!title) return;
  const priority = priorityInput.value;
  const due = dueDateInput.value;
  const category = categorySelect.value === 'custom' && customCategoryInput.value.trim() ? customCategoryInput.value.trim() : categorySelect.value;

  const task = {
    id: Date.now(),
    title, priority, due, category,
    completed:false, important:false,
    subtasks: []
  };
  tasks.unshift(task); // newest on top
  saveTasks();
  renderTasks();
  updateChart();
  checkBadges();
  updateProgressBar();
  taskForm.reset();
  customCategoryInput.classList.add('hidden');

  // auto notification if due is today (quick)
  scheduleDueNotification(task);
});

// ----------------- Render tasks (with drag handles & subtasks) -----------------
function renderTasks(){
  taskList.innerHTML = '';
  const search = (searchInput.value || '').toLowerCase();
  const filter = filterSelect.value || 'all';

  tasks
    .filter(t => (t.title.toLowerCase().includes(search) || (t.subtasks||[]).some(s=>s.text.toLowerCase().includes(search))))
    .filter(t => filter === 'all' || filter === t.category || (filter === 'pending' && !t.completed) || (filter === 'completed' && t.completed) || (filter === 'important' && t.important))
    .forEach((t, idx) => {
      const card = document.createElement('div');
      card.className = `task-card fade-in priority-${t.priority} ${t.important?'important':''}`;
      card.draggable = true;
      card.dataset.id = t.id;

      // left content (title + subtasks)
      const left = document.createElement('div');
      left.className = 'left';
      const title = document.createElement('h3');
      title.textContent = t.title;
      left.appendChild(title);
      const meta = document.createElement('small');
      meta.textContent = `Categoria: ${t.category} ${t.due ? ' • Prazo: '+t.due : ''}`;
      left.appendChild(meta);

      // subtask list
      const subtasksEl = document.createElement('div');
      subtasksEl.className = 'subtasks';
      (t.subtasks||[]).forEach(sub=>{
        const subEl = document.createElement('div');
        subEl.className = 'subtask' + (sub.done?' completed':'');
        subEl.innerHTML = `
          <button aria-label="toggle subtask" class="sub-toggle">${sub.done? '✅':'⬜'}</button>
          <div class="subtext">${escapeHtml(sub.text)}</div>
        `;
        subEl.querySelector('.sub-toggle').addEventListener('click', ()=>{
          sub.done = !sub.done;
          saveTasks(); renderTasks(); updateProgressBar(); checkBadges();
        });
        subtasksEl.appendChild(subEl);
      });
      // add subtask control
      const addSubBtn = document.createElement('button');
      addSubBtn.className = 'btn-add-sub';
      addSubBtn.textContent = '＋ Subtarefa';
      addSubBtn.addEventListener('click', ()=>{
        const txt = prompt('Digite a subtarefa:');
        if(!txt) return;
        t.subtasks = t.subtasks || [];
        t.subtasks.push({ text: txt.trim(), done:false });
        saveTasks(); renderTasks(); checkBadges(); updateProgressBar();
      });

      // actions area (star, complete emoji, edit, delete)
      const actions = document.createElement('div');
      actions.className = 'actions';
      const starBtn = document.createElement('button');
      starBtn.className = 'star-btn';
      starBtn.title = 'Favoritar';
      starBtn.innerText = t.important ? '⭐' : '☆';
      starBtn.addEventListener('click', ()=>{ t.important = !t.important; saveTasks(); renderTasks(); });

      const completeBtn = document.createElement('button');
      completeBtn.className = 'btn-complete';
      completeBtn.title = 'Concluir';
      completeBtn.innerText = t.completed ? '✅' : '⬜';
      completeBtn.addEventListener('click', ()=>{ t.completed = !t.completed; saveTasks(); renderTasks(); updateChart(); checkBadges(); updateProgressBar(); });

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.title = 'Editar';
      editBtn.innerText = '✏️';
      editBtn.addEventListener('click', ()=> editTask(t.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.title = 'Remover';
      delBtn.innerText = '🗑️';
      delBtn.addEventListener('click', ()=> deleteTask(t.id));

      actions.appendChild(starBtn);
      actions.appendChild(completeBtn);
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      // associate elements to card
      card.appendChild(left);
      left.appendChild(subtasksEl);
      left.appendChild(addSubBtn);
      card.appendChild(actions);

      // mark completed styling
      card.classList.toggle('completed', t.completed);

      // drag events
      card.addEventListener('dragstart', dragStart);
      card.addEventListener('dragend', dragEnd);

      taskList.appendChild(card);
    });

  // allow drop on list
  enableDragDropOnList();
}

// ----------------- Drag & Drop -----------------
let dragEl = null;
function dragStart(e){
  dragEl = e.currentTarget;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}
function dragEnd(e){
  if(dragEl) dragEl.classList.remove('dragging');
  dragEl = null;
}
function enableDragDropOnList(){
  taskList.addEventListener('dragover', e=>{
    e.preventDefault();
    const after = getDragAfterElement(taskList, e.clientY);
    const dragging = document.querySelector('.dragging');
    if(!dragging) return;
    if(after == null) taskList.appendChild(dragging);
    else taskList.insertBefore(dragging, after);
  });

  taskList.addEventListener('drop', ()=>{
    // rebuild tasks array in the new order
    const newOrder = [...taskList.querySelectorAll('.task-card')].map(el => Number(el.dataset.id));
    tasks = newOrder.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    saveTasks();
    renderTasks();
  });
}
function getDragAfterElement(container, y){
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if(offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element || null;
}

// ----------------- Edit & Delete -----------------
function editTask(id){
  const task = tasks.find(t=>t.id===id);
  if(!task) return;
  const newTitle = prompt('Editar título:', task.title);
  if(newTitle === null) return;
  task.title = newTitle.trim() || task.title;
  saveTasks();
  renderTasks();
}

function deleteTask(id){
  if(!confirm('Remover tarefa?')) return;
  tasks = tasks.filter(t=>t.id!==id);
  saveTasks(); renderTasks(); updateChart(); checkBadges(); updateProgressBar();
}

// ----------------- Search & Filter listeners -----------------
searchInput.addEventListener('input', renderTasks);
filterSelect.addEventListener('change', renderTasks);

// ----------------- Progress Bar & Chart -----------------
function updateProgressBar(){
  const completed = tasks.filter(t=>t.completed).length;
  const total = tasks.length;
  const pct = total === 0 ? 0 : Math.round((completed/total)*100);
  if(progressBar) progressBar.style.width = `${pct}%`;
  if(progressText) progressText.textContent = `${pct}% concluído`;
}

function updateChart(){
  const completed = tasks.filter(t=>t.completed).length;
  const pending = tasks.length - completed;
  if(chart) chart.destroy();
  chart = new Chart(tasksChartCtx.getContext ? tasksChartCtx.getContext('2d') : tasksChartCtx, {
    type:'doughnut',
    data:{ labels:['Concluídas','Pendentes'], datasets:[{ data:[completed,pending], backgroundColor:['#22c55e','#f59e0b'] }] },
    options:{ responsive:true, plugins:{legend:{position:'bottom'}}}
  });
}

// ----------------- Badges -----------------
function checkBadges(){
  const completed = tasks.filter(t=>t.completed).length;
  badgeGrid.innerHTML = '';
  const allBadges = [
    { icon:'🥉', text:'Primeira Tarefa', unlock:1 },
    { icon:'🥈', text:'5 Tarefas', unlock:5 },
    { icon:'🥇', text:'10 Tarefas', unlock:10 },
    { icon:'🏆', text:'20 Tarefas Concluídas', unlock:20 },
    { icon:'🔥', text:'3 dias seguidos', unlock:9999, note:'(impl. futura)' }
  ];
  let newly = null;
  allBadges.forEach(b=>{
    const el = document.createElement('div');
    el.className = 'badge ' + (completed >= b.unlock ? 'earned':'locked');
    el.innerHTML = `<div class="icon">${b.icon}</div><div>${b.text}</div>`;
    badgeGrid.appendChild(el);
    if(completed === b.unlock) newly = b;
  });
  if(newly){
    trophyMessage.textContent = `Você desbloqueou: ${newly.text}`;
    trophyModal.style.display = 'flex';
    setTimeout(()=>trophyModal.classList.add('show'),10);
    // try show browser notification
    tryShowNotification(`Conquista desbloqueada: ${newly.text}`);
  }
}

// close trophy
closeTrophy.addEventListener('click', ()=>{ trophyModal.classList.remove('show'); setTimeout(()=> trophyModal.style.display='none',300); });

// ----------------- Notifications -----------------
function tryShowNotification(text){
  if(!('Notification' in window)) return;
  if(Notification.permission === 'granted'){
    new Notification('TaskMaster', { body: text, icon: '/icon-192.png' });
  } else if(Notification.permission !== 'denied'){
    Notification.requestPermission().then(perm => { if(perm==='granted') new Notification('TaskMaster', { body: text, icon:'/icon-192.png' }); });
  }
}

// schedule quick notification if due date is today and permission given
function scheduleDueNotification(task){
  if(!task.due) return;
  const dueDate = new Date(task.due);
  const today = new Date();
  if(dueDate.toDateString() === today.toDateString()){
    // short delay so user sees it right after adding
    setTimeout(()=> tryShowNotification(`Tarefa com prazo hoje: ${task.title}`), 1500);
  }
}

// ----------------- Logout -----------------
logoutBtn.addEventListener('click', ()=>{
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
});

// ----------------- Service Worker registration (PWA) -----------------
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/sw.js').catch(()=>{/* ignore */});
  });
}

// ----------------- Helper: escapeHtml for subtask text -----------------
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

// ----------------- Initialization -----------------
renderTasks();
updateChart();
checkBadges();
updateProgressBar();

// ask for notification permission proactively but politely
if('Notification' in window && Notification.permission === 'default'){
  setTimeout(()=> Notification.requestPermission().catch(()=>{}), 2000);
}

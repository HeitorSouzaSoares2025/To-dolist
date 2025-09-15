// Elementos
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const filters = document.querySelectorAll(".filters button");
const progressBar = document.getElementById("progress");
const totalCount = document.getElementById("total");
const pendingCount = document.getElementById("pending");
const completedCount = document.getElementById("completed");

// LocalStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Funções
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total ? (completed / total) * 100 : 0;
  progressBar.style.width = percent + "%";

  progressBar.classList.remove("low","medium","high");
  if (percent <= 33) progressBar.classList.add("low");
  else if (percent <= 66) progressBar.classList.add("medium");
  else progressBar.classList.add("high");

  totalCount.textContent = total;
  pendingCount.textContent = total - completed;
  completedCount.textContent = completed;
}

function renderTasks(filter = "all") {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    if (filter === "active" && task.completed) return;
    if (filter === "completed" && !task.completed) return;

    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";
    li.setAttribute("data-priority", task.priority);

    const taskInfo = document.createElement("div");
    taskInfo.className = "task-info";

    const taskText = document.createElement("span");
    taskText.textContent = task.text;

    const taskMeta = document.createElement("span");
    taskMeta.className = "task-meta";
    taskMeta.innerHTML = `Prioridade: <span class="priority-badge ${task.priority}">${task.priority}</span> | Criada: ${task.created}`;

    if (task.completed && task.completedTime) {
      const completedTime = document.createElement("div");
      completedTime.className = "completed-time";
      completedTime.textContent = `Concluída: ${task.completedTime}`;
      taskMeta.appendChild(completedTime);
    }

    taskInfo.appendChild(taskText);
    taskInfo.appendChild(taskMeta);

    // Concluir tarefa
    li.addEventListener("click", () => {
      tasks[index].completed = !tasks[index].completed;
      tasks[index].completedTime = tasks[index].completed ? new Date().toLocaleString() : null;
      saveTasks();
      renderTasks(filter);
      updateProgress();
    });

    // Botão editar
    const editBtn = document.createElement("button");
    editBtn.className = "edit";
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const newText = prompt("Editar tarefa:", task.text);
      if (newText !== null && newText.trim() !== "") {
        task.text = newText.trim();
        task.priority = prompt("Editar prioridade (Baixa, Média, Alta):", task.priority) || task.priority;
        saveTasks();
        renderTasks(filter);
      }
    });

    // Botão remover com animação
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove";
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      li.classList.add("removing");
      setTimeout(() => {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks(filter);
        updateProgress();
      }, 300);
    });

    li.appendChild(taskInfo);
    li.appendChild(editBtn);
    li.appendChild(removeBtn);
    taskList.appendChild(li);
  });
  updateProgress();
}

// Adicionar tarefa
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;
  if (text !== "") {
    tasks.push({ text, priority, completed: false, created: new Date().toLocaleString(), completedTime: null });
    saveTasks();
    taskInput.value = "";
    renderTasks();
  }
});

// Adicionar com Enter
taskInput.addEventListener("keydown", e => { if (e.key === "Enter") addTaskBtn.click(); });

// Filtros
filters.forEach(btn => {
  btn.addEventListener("click", () => { renderTasks(btn.dataset.filter); });
});

// Inicialização
renderTasks();

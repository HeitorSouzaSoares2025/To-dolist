const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const filters = document.querySelectorAll(".filters button");
const progressBar = document.getElementById("progress");

// Função para atualizar a barra de progresso
function updateProgress() {
  const tasks = document.querySelectorAll("#taskList li");
  const completed = document.querySelectorAll("#taskList li.completed");
  const percent = tasks.length ? (completed.length / tasks.length) * 100 : 0;
  progressBar.style.width = percent + "%";
}

// Criar tarefa
function createTask(text, priority) {
  const li = document.createElement("li");
  li.setAttribute("data-priority", priority);

  const taskInfo = document.createElement("div");
  taskInfo.className = "task-info";

  const taskText = document.createElement("span");
  taskText.textContent = text;

  const taskMeta = document.createElement("span");
  taskMeta.className = "task-meta";
  taskMeta.textContent = "Prioridade: " + priority;

  taskInfo.appendChild(taskText);
  taskInfo.appendChild(taskMeta);

  // Botão concluir
  li.addEventListener("click", () => {
    li.classList.toggle("completed");
    updateProgress();
  });

  // Botão remover
  const removeBtn = document.createElement("button");
  removeBtn.className = "remove";
  removeBtn.textContent = "Remover";
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // evita conflito com o click do li
    li.remove();
    updateProgress();
  });

  li.appendChild(taskInfo);
  li.appendChild(removeBtn);
  taskList.appendChild(li);

  updateProgress();
}

// Adicionar tarefa pelo botão
addTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  const priority = prioritySelect.value;

  if (text !== "") {
    createTask(text, priority);
    taskInput.value = "";
  }
});

// Adicionar tarefa com Enter
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTaskBtn.click();
  }
});

// Filtros
filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    const tasks = taskList.querySelectorAll("li");

    tasks.forEach((task) => {
      switch (filter) {
        case "all":
          task.style.display = "flex";
          break;
        case "active":
          task.style.display = task.classList.contains("completed") ? "none" : "flex";
          break;
        case "completed":
          task.style.display = task.classList.contains("completed") ? "flex" : "none";
          break;
      }
    });
  });
});

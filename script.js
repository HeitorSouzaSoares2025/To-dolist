const taskInput = document.getElementById("taskInput");
const categorySelect = document.getElementById("category");
const prioritySelect = document.getElementById("priority");
const taskList = document.getElementById("taskList");

// Carregar ao abrir
window.onload = loadTasks;

function addTask() {
  const text = taskInput.value.trim();
  const category = categorySelect.value;
  const priority = prioritySelect.value;

  if (text === "") return;

  createTaskElement({ text, category, priority, completed: false });
  saveTasks();
  taskInput.value = "";
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.setAttribute("data-priority", task.priority);
  if (task.completed) li.classList.add("completed");

  const taskInfo = document.createElement("div");
  taskInfo.classList.add("task-info");

  const taskText = document.createElement("span");
  taskText.textContent = task.text;

  const taskMeta = document.createElement("span");
  taskMeta.classList.add("task-meta");
  taskMeta.textContent = `${task.category} • Prioridade: ${task.priority}`;

  taskInfo.appendChild(taskText);
  taskInfo.appendChild(taskMeta);

  li.appendChild(taskInfo);

  // Clique para concluir
  li.addEventListener("click", () => {
    li.classList.toggle("completed");
    saveTasks();
  });

  // Botão remover
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "X";
  removeBtn.classList.add("remove");
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    li.remove();
    saveTasks();
  };

  li.appendChild(removeBtn);
  taskList.appendChild(li);
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    tasks.push({
      text: li.querySelector(".task-info span").textContent,
      category: li.querySelector(".task-meta").textContent.split(" • ")[0],
      priority: li.getAttribute("data-priority"),
      completed: li.classList.contains("completed")
    });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach(task => createTaskElement(task));
}

function filterTasks(filter) {
  const tasks = document.querySelectorAll("#taskList li");
  tasks.forEach(li => {
    switch (filter) {
      case "all":
        li.style.display = "flex";
        break;
      case "completed":
        li.style.display = li.classList.contains("completed") ? "flex" : "none";
        break;
      case "pending":
        li.style.display = !li.classList.contains("completed") ? "flex" : "none";
        break;
    }
  });
}

const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

// Carregar tarefas salvas
window.onload = loadTasks;

function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") return;

  createTaskElement(taskText);
  saveTasks();
  taskInput.value = "";
}

function createTaskElement(text) {
  const li = document.createElement("li");
  li.textContent = text;

  li.addEventListener("click", () => {
    li.classList.toggle("completed");
    saveTasks();
  });

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "X";
  removeBtn.classList.add("remove");
  removeBtn.onclick = () => {
    li.remove();
    saveTasks();
  };

  li.appendChild(removeBtn);
  taskList.appendChild(li);
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll("#taskList li").forEach(li => {
    tasks.push({ text: li.firstChild.textContent, completed: li.classList.contains("completed") });
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach(t => {
    createTaskElement(t.text);
    if (t.completed) {
      taskList.lastChild.classList.add("completed");
    }
  });
}

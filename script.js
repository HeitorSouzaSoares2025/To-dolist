const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');

function addTask() {
  const text = taskInput.value.trim();
  if (text === '') return;

  const li = document.createElement('li');
  li.className = "flex items-center justify-between bg-gray-50 p-2 rounded shadow-sm";

  const span = document.createElement('span');
  span.textContent = text;
  span.className = "flex-1 cursor-pointer";
  span.onclick = () => {
    span.classList.toggle("line-through");
    span.classList.toggle("text-gray-400");
  };

  const delBtn = document.createElement('button');
  delBtn.textContent = "❌";
  delBtn.className = "ml-2 text-red-500 hover:text-red-700";
  delBtn.onclick = () => li.remove();

  li.appendChild(span);
  li.appendChild(delBtn);
  taskList.appendChild(li);
  taskInput.value = "";
}

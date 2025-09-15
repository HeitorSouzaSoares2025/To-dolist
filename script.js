const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const deadlineInput = document.getElementById("deadlineInput");
const alertMinutesInput = document.getElementById("alertMinutes");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const completedList = document.getElementById("completedList");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const toggleThemeBtn = document.getElementById("toggleTheme");
const alertSound = document.getElementById("alertSound");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const filterButtons = document.querySelectorAll(".filter-btn");

// Dark/Light mode persistente
if(localStorage.getItem("theme")==="dark"){
  document.documentElement.classList.add("dark");
  toggleThemeBtn.textContent="☀️";
}

toggleThemeBtn.addEventListener("click", ()=>{
  document.documentElement.classList.toggle("dark");
  toggleThemeBtn.textContent=document.documentElement.classList.contains("dark")?"☀️":"🌙";
  localStorage.setItem("theme",document.documentElement.classList.contains("dark")?"dark":"light");
});

// Carregar tarefas do localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks(){
  localStorage.setItem("tasks",JSON.stringify(tasks));
  updateProgress();
}

function updateProgress(){
  const total = tasks.length;
  const done = tasks.filter(t=>t.done).length;
  const percent = total? (done/total)*100 :0;
  progressBar.style.width = percent+"%";
  progressText.textContent=`${done}/${total} concluídas`;
}

// Renderiza tarefas
function renderTasks(filter="all"){
  taskList.innerHTML="";
  completedList.innerHTML="";
  tasks.forEach((task,index)=>{
    if(filter!=="all"){
      if(filter==="pending" && task.done) return;
      if(filter==="done" && !task.done) return;
      if(["Pessoal","Trabalho","Estudos"].includes(filter) && task.category!==filter) return;
    }

    const li=document.createElement("li");
    li.className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg shadow transition";
    li.setAttribute("draggable",!task.done);

    const left=document.createElement("div");
    left.className="flex flex-col sm:flex-row sm:items-center gap-2";

    const topRow=document.createElement("div");
    topRow.className="flex items-center gap-3";

    const checkbox=document.createElement("input");
    checkbox.type="checkbox";
    checkbox.checked=task.done;
    checkbox.className="w-5 h-5";
    checkbox.addEventListener("change",()=>{
      task.done=!task.done;
      saveTasks();
      renderTasks(filter);
    });

    const text=document.createElement("span");
    text.textContent=task.text;
    if(task.done) text.classList.add("line-through","text-gray-500");

    const tag=document.createElement("span");
    tag.textContent=task.category;
    tag.className="px-2 py-1 rounded-full text-xs text-white";
    if(task.category==="Pessoal") tag.classList.add("bg-pink-500");
    if(task.category==="Trabalho") tag.classList.add("bg-green-500");
    if(task.category==="Estudos") tag.classList.add("bg-purple-500");

    topRow.appendChild(checkbox);
    topRow.appendChild(text);
    topRow.appendChild(tag);

    const bottomRow=document.createElement("div");
    bottomRow.className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400";
    if(task.deadline){
      const date=new Date(task.deadline);
      bottomRow.textContent="⏰ "+date.toLocaleString("pt-BR")+` (alerta: ${task.alertBefore} min antes)`;
    }

    left.appendChild(topRow);
    if(task.deadline) left.appendChild(bottomRow);

    const delBtn=document.createElement("button");
    delBtn.textContent="🗑️";
    delBtn.className="ml-3 text-red-500 hover:text-red-700";
    delBtn.addEventListener("click",()=>{
      tasks.splice(index,1);
      saveTasks();
      renderTasks(filter);
    });

    li.appendChild(left);
    li.appendChild(delBtn);

    // Alertas visuais e sonoros
    if(task.deadline && !task.done){
      const now=new Date();
      const deadlineDate=new Date(task.deadline);
      const diff=(deadlineDate-now)/1000/60;
      if(diff<=task.alertBefore && diff>0){
        li.classList.add("task-alert");
        alertSound.play();
        if("Notification" in window && Notification.permission==="granted"){
          new Notification("⏰ Tarefa quase vencendo!",{
            body:`${task.text} (faltam ${Math.round(diff)} min)`,
            icon:"https://cdn-icons-png.flaticon.com/512/1827/1827415.png"
          });
        }
      }
    }

    if(task.done){
      completedList.appendChild(li);
    } else {
      taskList.appendChild(li);
    }

    // Drag & Drop
    li.addEventListener("dragstart",(e)=>{
      li.classList.add("dragging");
      e.dataTransfer.setData("text/plain",index);
    });
    li.addEventListener("dragend",()=>li.classList.remove("dragging"));
  });
}

// Drag & Drop área
taskList.addEventListener("dragover",e=>{
  e.preventDefault();
  const dragging=document.querySelector(".dragging");
  const afterElement=getDragAfterElement(taskList,e.clientY);
  if(afterElement==null){
    taskList.appendChild(dragging);
  }else{
    taskList.insertBefore(dragging,afterElement);
  }
});

function getDragAfterElement(container,y){
  const draggableElements=[...container.querySelectorAll("li:not(.dragging)")];
  return draggableElements.reduce((closest,child)=>{
    const box=child.getBoundingClientRect();
    const offset=y-box.top-box.height/2;
    if(offset<0 && offset>closest.offset){
      return {offset:offset,element:child};
    }else{return closest;}
  },{offset:Number.NEGATIVE_INFINITY}).element;
}

// Adicionar tarefa
addTaskBtn.addEventListener("click",()=>{
  const text=taskInput.value.trim();
  const category=categoryInput.value;
  const deadline=deadlineInput.value;
  const alertBefore=parseInt(alertMinutesInput.value)||15;
  if(text){
    tasks.push({text,category,deadline,alertBefore,done:false});
    saveTasks();
    renderTasks();
    taskInput.value="";
    deadlineInput.value="";
    alertMinutesInput.value="15";
  }
});

// Filtros
filterButtons.forEach(btn=>btn.addEventListener("click",()=>renderTasks(btn.dataset.filter)));

// Exportar JSON
exportBtn.addEventListener("click",()=>{
  const dataStr="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(tasks));
  const dlAnchor=document.createElement("a");
  dlAnchor.setAttribute("href",dataStr);
  dlAnchor.setAttribute("download","tasks.json");
  dlAnchor.click();
});

// Importar JSON
importFile.addEventListener("change",e=>{
  const file=e.target.files[0];
  if(file){
    const reader=new FileReader();
    reader.onload=function(ev){
      try{
        const imported=JSON.parse(ev.target.result);
        if(Array.isArray(imported)){
          tasks=imported;
          saveTasks();
          renderTasks();
        }else{alert("Arquivo inválido");}
      }catch(err){alert("Erro ao ler arquivo JSON");}
    };
    reader.readAsText(file);
  }
});

// Atualização periódica para alertas
setInterval(()=>renderTasks(),60000);

// Inicializar
renderTasks();

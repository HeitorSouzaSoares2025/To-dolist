// Elementos do DOM
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDeadline = document.getElementById('task-deadline');
const taskAlert = document.getElementById('task-alert');
const categorySelect = document.getElementById('category-select');
const prioritySelect = document.getElementById('priority-select');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const filterStatus = document.getElementById('filter-status');
const filterCategory = document.getElementById('filter-category');
const alarmSound = document.getElementById('alarm-sound');
const exportCsvBtn = document.getElementById('export-csv');
const exportPdfBtn = document.getElementById('export-pdf');
const importCsvInput = document.getElementById('import-csv');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Solicitar permissão de notificação
if ("Notification" in window) {
    Notification.requestPermission();
}

// Salvar tarefas no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Atualizar contador
function updateCount() {
    taskCount.textContent = `Tarefas pendentes: ${tasks.filter(t => !t.completed).length}`;
}

// Notificação
function notify(task, msg) {
    if (Notification.permission === "granted") {
        new Notification(msg, { body: `[${task.category}] ${task.text} (${task.priority}) - Prazo: ${task.deadline}` });
    }
    alarmSound.play();
}

// Checar prazos e alertas
function checkDeadlines() {
    const now = new Date();
    tasks.forEach(task => {
        if (task.completed) return;
        const deadline = new Date(task.deadline);
        const alertTime = new Date(deadline.getTime() - (task.alert * 60000 || 0));
        if (!task.alerted && task.alert > 0 && now >= alertTime && now < deadline) {
            notify(task, "Alerta antecipado!");
            task.alerted = true;
        }
        if (!task.notified && now >= deadline) {
            notify(task, "Tarefa vencida!");
            task.notified = true;
        }
    });
    saveTasks();
}
setInterval(checkDeadlines, 1000); // Atualização a cada 1s

// Criar elemento de tarefa
function createTaskElement(task, index) {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');
    li.classList.add(`priority-${task.priority}`);
    li.setAttribute('draggable', true);

    li.innerHTML = `
        <div class="task-info">[${task.category}] ${task.text} (${task.priority}) - Prazo: ${task.deadline.replace("T"," ")} - Alertar: ${task.alert} min antes</div>
        <div class="task-actions">
            <button class="edit">Editar</button>
            <button class="delete">Excluir</button>
        </div>
        <canvas class="task-circle"></canvas>
    `;

    const canvas = li.querySelector('.task-circle');
    const ctx = canvas.getContext('2d');

    // Desenhar gráfico circular
    function drawCircle() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const now = new Date();
        const deadline = new Date(task.deadline);
        const created = new Date(task.created || now);
        const totalMs = deadline - created;
        const diffMs = deadline - now;
        const percent = totalMs > 0 ? Math.max(0, Math.min(1, diffMs / totalMs)) : 0;
        let color = "#28a745";
        if (task.priority === "Média") color = "#ffc107";
        else if (task.priority === "Alta") color = "#dc3545";

        // Fundo
        ctx.beginPath();
        ctx.arc(25, 25, 22, 0, 2 * Math.PI);
        ctx.fillStyle = "#eee";
        ctx.fill();

        // Progresso
        ctx.beginPath();
        ctx.moveTo(25, 25);
        ctx.arc(25, 25, 22, -Math.PI/2, -Math.PI/2 + 2 * Math.PI * percent, false);
        ctx.fillStyle = color;
        ctx.fill();

        // Atualizar borda do li conforme prioridade e tempo
        if (diffMs <= 0) li.style.borderLeftColor = "#dc3545";
        else if (diffMs <= 24 * 3600000) {
            const ratio = diffMs / (24 * 3600000);
            const r = Math.round(255*(1-ratio));
            const g = Math.round(193*ratio);
            li.style.borderLeftColor = `rgb(${r},${g},7)`;
        } else li.style.borderLeftColor = color;

        // Tooltip
        const hours = Math.floor(diffMs/3600000);
        const minutes = Math.floor((diffMs % 3600000)/60000);
        li.title = diffMs <= 0 ? "Vencida!" : `Tempo restante: ${hours}h ${minutes}m`;
    }
    drawCircle();
    setInterval(drawCircle, 1000);

    // Marcar concluída
    li.querySelector('.task-info').addEventListener('click', () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    });

    // Editar
    li.querySelector('.edit').addEventListener('click', () => {
        const newText = prompt("Editar tarefa:", task.text);
        const newDeadline = prompt("Editar prazo (AAAA-MM-DDTHH:MM):", task.deadline);
        const newAlert = prompt("Alertar X minutos antes:", task.alert);
        if (newText && newDeadline) {
            task.text = newText;
            task.deadline = newDeadline;
            task.alert = parseInt(newAlert) || 0;
            task.notified = false;
            task.alerted = false;
            saveTasks();
            renderTasks();
        }
    });

    // Excluir
    li.querySelector('.delete').addEventListener('click', () => {
        if (confirm("Deseja realmente excluir esta tarefa?")) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }
    });

    // Drag & Drop
    li.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', index); });
    li.addEventListener('dragover', e => e.preventDefault());
    li.addEventListener('drop', e => {
        e.preventDefault();
        const draggedIndex = e.dataTransfer.getData('text/plain');
        const temp = tasks[draggedIndex];
        tasks.splice(draggedIndex, 1);
        tasks.splice(index, 0, temp);
        saveTasks();
        renderTasks();
    });

    return li;
}

// Renderizar lista de tarefas
function renderTasks() {
    taskList.innerHTML = '';
    let filtered = tasks;
    if(filterStatus.value !== 'all'){
        const completed = filterStatus.value === 'completed';
        filtered = filtered.filter(t => t.completed === completed);
    }
    if(filterCategory.value !== 'all'){
        filtered = filtered.filter(t => t.category === filterCategory.value);
    }
    filtered.forEach((task, index) => taskList.appendChild(createTaskElement(task, index)));
    updateCount();
}

// Adicionar tarefa
taskForm.addEventListener('submit', e => {
    e.preventDefault();
    if(!taskInput.value || !taskDeadline.value) return;
    const now = new Date();
    const newTask = {
        text: taskInput.value,
        deadline: taskDeadline.value,
        alert: parseInt(taskAlert.value) || 0,
        category: categorySelect.value,
        priority: prioritySelect.value,
        completed: false,
        notified: false,
        alerted: false,
        created: now
    };
    tasks.push(newTask);
    saveTasks();
    taskInput.value = '';
    taskDeadline.value = '';
    taskAlert.value = '0';
    renderTasks();
    if(Notification.permission === "granted"){
        notify(newTask,"Tarefa adicionada!");
    }
});

// Filtros
filterStatus.addEventListener('change', renderTasks);
filterCategory.addEventListener('change', renderTasks);

// Exportar CSV
exportCsvBtn.addEventListener('click', () => {
    const csvContent = "data:text/csv;charset=utf-8," + ["Tarefa,Prazo,Alertar,Categoria,Prioridade,Concluída"]
        .concat(tasks.map(t => `${t.text},${t.deadline},${t.alert},${t.category},${t.priority},${t.completed}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tasks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Exportar PDF
exportPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(12);
    let y = 10;
    doc.text("To-Do List", 10, y); y += 10;
    tasks.forEach(t => {
        let line = `- [${t.category}] ${t.text} (${t.priority}) - Prazo: ${t.deadline} - Alertar: ${t.alert} min antes - Concluída: ${t.completed}`;
        if(y > 280){ doc.addPage(); y = 10; }
        doc.text(line, 10, y);
        y += 8;
    });
    doc.save("tasks.pdf");
});

// Importar CSV
importCsvInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = function(event){
            const lines = event.target.result.split("\n").slice(1);
            lines.forEach(line => {
                const [text, deadline, alert, category, priority, completed] = line.split(",");
                if(text && deadline){
                    tasks.push({
                        text,
                        deadline,
                        alert: parseInt(alert) || 0,
                        category,
                        priority,
                        completed: completed === "true",
                        notified: false,
                        alerted: false,
                        created: new Date()
                    });
                }
            });
            saveTasks();
            renderTasks();
        }
        reader.readAsText(file);
    }
});

// Inicialização
renderTasks();

// DOM Elements
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const categorySelect = document.getElementById("categorySelect");

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Categories with colors
const categories = {
  work: { name: "Work", color: "#3498db" },
  personal: { name: "Personal", color: "#2ecc71" },
  shopping: { name: "Shopping", color: "#f39c12" },
  other: { name: "Other", color: "#9b59b6" }
};

// Initialize app
function init() {
  renderTasks();
  setupDragAndDrop();
  loadThemePreference();
}

// Display all tasks
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.dataset.index = index;
    li.draggable = true;
    
    // Set category color as left border
    li.style.borderLeft = `4px solid ${categories[task.category].color}`;
    
    li.innerHTML = `
      <span class="${task.completed ? 'completed' : ''}">${task.text}</span>
      <div>
        <span class="category-tag" style="background-color: ${categories[task.category].color}">
          ${categories[task.category].name}
        </span>
        <button onclick="toggleComplete(${index})">${task.completed ? '↩' : '✓'}</button>
        <button class="delete-btn" onclick="deleteTask(${index})">✕</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

// Add a new task
function addTask() {
  const text = taskInput.value.trim();
  if (text === "") return;

  const category = categorySelect.value;
  tasks.push({ text, completed: false, category });
  saveTasks();
  taskInput.value = "";
  renderTasks();
}

// Toggle task completion
function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}

// Delete a task
function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Setup drag and drop functionality
function setupDragAndDrop() {
  let draggedItem = null;

  taskList.addEventListener("dragstart", (e) => {
    if (e.target.tagName === "LI") {
      draggedItem = e.target;
      e.target.style.opacity = "0.5";
    }
  });

  taskList.addEventListener("dragover", (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(e.clientY);
    const currentItem = document.querySelector(".dragging");
    
    if (afterElement == null) {
      taskList.appendChild(draggedItem);
    } else {
      taskList.insertBefore(draggedItem, afterElement);
    }
  });

  taskList.addEventListener("dragend", (e) => {
    if (e.target.tagName === "LI") {
      e.target.style.opacity = "1";
      updateTaskOrder();
    }
  });

  function getDragAfterElement(y) {
    const draggableElements = [...taskList.querySelectorAll("li:not(.dragging)")];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
}

function updateTaskOrder() {
  const newTasks = [];
  const items = taskList.querySelectorAll("li");
  
  items.forEach(item => {
    const index = item.dataset.index;
    newTasks.push(tasks[index]);
  });
  
  tasks = newTasks;
  saveTasks();
}

// Dark/Light mode toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
  updateThemeButtonText();
});

function loadThemePreference() {
  const darkMode = localStorage.getItem("darkMode") === "true";
  if (darkMode) {
    document.body.classList.add("dark-mode");
  }
  updateThemeButtonText();
}

function updateThemeButtonText() {
  const isDarkMode = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// Add task on pressing Enter
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

// Initialize the app
init();
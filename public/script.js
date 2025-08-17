// DOM Elements
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const categorySelect = document.getElementById("categorySelect");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskError = document.getElementById("taskError");

// Task data
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Categories
const categories = {
    work: { name: "Work", color: "#3a86ff" },
    personal: { name: "Personal", color: "#8338ec" },
    shopping: { name: "Shopping", color: "#ff006e" },
    other: { name: "Other", color: "#fb5607" }
};

// Initialize app
function init() {
    renderTasks();
    setupEventListeners();
    loadThemePreference();
}

// Display error messages
function showError(message, duration = 5000) {
    taskError.textContent = message;
    taskError.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => {
            taskError.style.display = 'none';
        }, duration);
    }
}

// Task Functions
function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        showError("Please enter a task!");
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        text,
        completed: false,
        category: categorySelect.value,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    taskInput.value = "";
    taskError.style.display = 'none';
    renderTasks();
}

function toggleComplete(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = tasks.length ? "" : '<p class="empty-message">No tasks yet. Add one above!</p>';
    
    tasks.forEach(task => {
        const li = document.createElement("li");
        li.className = `category-${task.category} ${task.completed ? "completed" : ""}`;
        li.style.borderLeft = `4px solid ${categories[task.category].color}`;
        
        li.innerHTML = `
            <div class="task-content">
                <span>${task.text}</span>
                <span class="category-tag" style="background-color: ${categories[task.category].color}">
                    ${categories[task.category].name}
                </span>
            </div>
            <div class="task-actions">
                <button class="complete-btn">${task.completed ? '↩ Undo' : '✓ Done'}</button>
                <button class="delete-btn">✕ Delete</button>
            </div>
        `;
        
        li.querySelector(".complete-btn").addEventListener("click", () => toggleComplete(task.id));
        li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(task.id));
        taskList.appendChild(li);
    });
}

// Theme Management
function loadThemePreference() {
    const darkMode = localStorage.getItem("darkMode") === "true";
    document.body.classList.toggle("dark-mode", darkMode);
    updateThemeButtonText();
}

function updateThemeButtonText() {
    themeToggle.textContent = document.body.classList.contains("dark-mode") 
        ? "☀️ Light Mode" 
        : "🌙 Dark Mode";
}

// Event Listeners
function setupEventListeners() {
    addTaskBtn.addEventListener("click", addTask);
    taskInput.addEventListener("keypress", (e) => e.key === "Enter" && addTask());
    
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
        updateThemeButtonText();
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
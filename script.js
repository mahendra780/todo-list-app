// DOM Elements
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const categorySelect = document.getElementById("categorySelect");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskError = document.getElementById("taskError");

// Firebase Reference
const tasksCollection = firebase.firestore().collection("tasks");

// Task data
let tasks = [];

// Categories
const categories = {
    work: { name: "Work", color: "#3a86ff" },
    personal: { name: "Personal", color: "#8338ec" },
    shopping: { name: "Shopping", color: "#ff006e" },
    other: { name: "Other", color: "#fb5607" }
};

// Initialize app
function init() {
    loadThemePreference();
    setupEventListeners();
    setupFirebaseListener();
}

// Add Task
async function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        showError(taskError, "Please enter a task!");
        return;
    }

    try {
        await tasksCollection.add({
            text,
            completed: false,
            category: categorySelect.value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        taskInput.value = "";
        taskError.style.display = 'none';
    } catch (error) {
        showError(taskError, "Failed to add task: " + error.message);
    }
}

// Delete Task
async function deleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    try {
        await tasksCollection.doc(taskId).delete();
    } catch (error) {
        showError(taskError, "Failed to delete task: " + error.message);
    }
}

// Toggle Complete
async function toggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
        await tasksCollection.doc(taskId).update({
            completed: !task.completed
        });
    } catch (error) {
        showError(taskError, "Failed to update task: " + error.message);
    }
}

// Real-time Listener
function setupFirebaseListener() {
    tasksCollection
        .orderBy("createdAt", "desc")
        .onSnapshot(snapshot => {
            tasks = [];
            snapshot.forEach(doc => {
                tasks.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderTasks();
        }, error => {
            showError(taskError, "Database error: " + error.message);
        });
}

// Render Tasks
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
                <button class="complete-btn" data-id="${task.id}">
                    ${task.completed ? '↩ Undo' : '✓ Done'}
                </button>
                <button class="delete-btn" data-id="${task.id}">✕ Delete</button>
            </div>
        `;
        
        li.querySelector(".complete-btn").addEventListener("click", (e) => toggleComplete(e.target.dataset.id));
        li.querySelector(".delete-btn").addEventListener("click", (e) => deleteTask(e.target.dataset.id));
        taskList.appendChild(li);
    });
}

// Theme Management
function loadThemePreference() {
    const darkMode = localStorage.getItem("darkMode") === "true";
    document.body.classList.toggle("dark-mode", darkMode);
    updateThemeButton();
}

function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
    updateThemeButton();
}

function updateThemeButton() {
    themeToggle.textContent = document.body.classList.contains("dark-mode") 
        ? "☀️ Light Mode" 
        : "🌙 Dark Mode";
}

// Error Handling
function showError(element, message, duration = 5000) {
    element.textContent = message;
    element.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }
}

// Event Listeners
function setupEventListeners() {
    addTaskBtn.addEventListener("click", addTask);
    taskInput.addEventListener("keypress", (e) => e.key === "Enter" && addTask());
    themeToggle.addEventListener("click", toggleTheme);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
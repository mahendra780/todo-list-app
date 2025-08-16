import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    serverTimestamp,
    deleteDoc,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// DOM Elements
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const categorySelect = document.getElementById("categorySelect");
const addTaskBtn = document.getElementById("addTaskBtn");

// Initialize tasks array
let tasks = [];

// Categories with colors
const categories = {
    work: { name: "Work", color: "#3498db" },
    personal: { name: "Personal", color: "#2ecc71" },
    shopping: { name: "Shopping", color: "#f39c12" },
    other: { name: "Other", color: "#9b59b6" }
};

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    // Load theme first
    loadThemePreference();
    
    // Setup Firebase listener
    setupFirebaseListener();
    
    // Setup event listeners
    setupEventListeners();
    
    // Focus the input
    taskInput.focus();
});

// Display all tasks
function renderTasks() {
    taskList.innerHTML = "";
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p class="empty-message">No tasks yet. Add one above!</p>';
        return;
    }
    
    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.dataset.index = index;
        li.draggable = true;
        li.className = `category-${task.category}`;
        
        if (task.completed) {
            li.classList.add("completed");
        }
        
        li.innerHTML = `
            <div class="task-content">
                <span>${task.text}</span>
                <span class="category-tag">${categories[task.category].name}</span>
            </div>
            <div class="task-actions">
                <button class="complete-btn">${task.completed ? '↩ Undo' : '✓ Done'}</button>
                <button class="delete-btn">✕ Delete</button>
            </div>
        `;
        taskList.appendChild(li);
        
        // Add event listeners to the new buttons
        li.querySelector(".complete-btn").addEventListener("click", () => toggleComplete(index));
        li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(index));
    });
}

// Add a new task
async function addTask() {
    const text = taskInput.value.trim();
    if (text === "") {
        alert("Please enter a task!");
        return;
    }

    const category = categorySelect.value;
    
    try {
        await addDoc(collection(firebaseDb, "tasks"), {
            text: text,
            completed: false,
            category: category,
            createdAt: serverTimestamp()
        });
        taskInput.value = "";
        taskInput.focus();
    } catch (error) {
        console.error("Error adding task: ", error);
        alert("Failed to add task. Please try again.");
    }
}

// Toggle task completion
async function toggleComplete(index) {
    const task = tasks[index];
    
    try {
        await updateDoc(doc(firebaseDb, "tasks", task.id), {
            completed: !task.completed
        });
    } catch (error) {
        console.error("Error updating task: ", error);
        alert("Failed to update task. Please try again.");
    }
}

// Delete a task
async function deleteTask(index) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    const taskId = tasks[index].id;
    
    try {
        await deleteDoc(doc(firebaseDb, "tasks", taskId));
    } catch (error) {
        console.error("Error deleting task: ", error);
        alert("Failed to delete task. Please try again.");
    }
}

// Setup Firebase real-time listener
function setupFirebaseListener() {
    onSnapshot(collection(firebaseDb, "tasks"), (snapshot) => {
        tasks = [];
        snapshot.forEach(doc => {
            tasks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by creation date (newest first)
        tasks.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        
        renderTasks();
        saveToLocalStorage();
    }, (error) => {
        console.error("Firebase error: ", error);
        loadFromLocalStorage();
    });
}

// Save tasks to localStorage as backup
function saveToLocalStorage() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from localStorage if Firebase fails
function loadFromLocalStorage() {
    const localTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = localTasks;
    renderTasks();
}

// Theme management
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
    themeToggle.innerHTML = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Setup all event listeners
function setupEventListeners() {
    // Add task on button click
    addTaskBtn.addEventListener("click", addTask);
    
    // Add task on pressing Enter
    taskInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addTask();
    });
    
    // Setup drag and drop
    setupDragAndDrop();
}

// Drag and drop functionality
function setupDragAndDrop() {
    let draggedItem = null;

    taskList.addEventListener("dragstart", (e) => {
        if (e.target.tagName === "LI") {
            draggedItem = e.target;
            e.target.classList.add("dragging");
        }
    });

    taskList.addEventListener("dragover", (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(e.clientY);
        
        if (afterElement == null) {
            taskList.appendChild(draggedItem);
        } else {
            taskList.insertBefore(draggedItem, afterElement);
        }
    });

    taskList.addEventListener("dragend", (e) => {
        if (e.target.tagName === "LI") {
            e.target.classList.remove("dragging");
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

// Update task order after drag and drop
async function updateTaskOrder() {
    // Note: This is a simplified implementation
    // For a production app, you might want to add an "order" field to your tasks
    // and update it in Firestore when reordering
    saveToLocalStorage();
}
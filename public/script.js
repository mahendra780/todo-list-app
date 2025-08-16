import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// DOM Elements
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const themeToggle = document.getElementById("themeToggle");
const categorySelect = document.getElementById("categorySelect");
const addTaskBtn = document.getElementById("addTaskBtn");
const authContainer = document.getElementById("authContainer");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userEmail = document.getElementById("userEmail");

// Initialize Firebase
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCUZP-faySw4n67Pjr1oWq9-NW1aQi70ow",
  authDomain: "todo-list-sync-c546e.firebaseapp.com",
  projectId: "todo-list-sync-c546e",
  storageBucket: "todo-list-sync-c546e.firebasestorage.app",
  messagingSenderId: "887382646844",
  appId: "1:887382646844:web:811a325046c371592b6339",
  measurementId: "G-9J0K7FDVN2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// Global variables
let tasks = [];
let currentUser = null;

const categories = {
  work: { name: "Work", color: "#3498db" },
  personal: { name: "Personal", color: "#2ecc71" },
  shopping: { name: "Shopping", color: "#f39c12" },
  other: { name: "Other", color: "#9b59b6" }
};

// Initialize the app
function init() {
  setupAuthListeners();
  setupEventListeners();
  loadThemePreference();
}

// Auth State Listener
function setupAuthListeners() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      userEmail.textContent = user.email;
      authContainer.style.display = "none";
      logoutBtn.style.display = "block";
      setupFirebaseListener();
    } else {
      currentUser = null;
      authContainer.style.display = "block";
      logoutBtn.style.display = "none";
      taskList.innerHTML = "";
    }
  });
}

// Auth Functions
async function handleLogin() {
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
  } catch (error) {
    alert("Login failed: " + error.message);
  }
}

async function handleSignup() {
  try {
    await createUserWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
  } catch (error) {
    alert("Signup failed: " + error.message);
  }
}

async function handleGoogleLogin() {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Google login failed: " + error.message);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
}

// Task Functions
async function addTask() {
  if (!currentUser) return;
  
  const text = taskInput.value.trim();
  if (!text) {
    alert("Please enter a task!");
    return;
  }

  try {
    await addDoc(collection(db, "tasks"), {
      text,
      completed: false,
      category: categorySelect.value,
      createdAt: serverTimestamp(),
      userId: currentUser.uid
    });
    taskInput.value = "";
  } catch (error) {
    alert("Failed to add task: " + error.message);
  }
}

async function toggleComplete(index) {
  if (!currentUser) return;
  
  const task = tasks[index];
  try {
    await updateDoc(doc(db, "tasks", task.id), {
      completed: !task.completed
    });
  } catch (error) {
    alert("Failed to update task: " + error.message);
  }
}

async function deleteTask(index) {
  if (!currentUser) return;
  
  if (!confirm("Are you sure you want to delete this task?")) return;
  
  try {
    await deleteDoc(doc(db, "tasks", tasks[index].id));
  } catch (error) {
    alert("Failed to delete task: " + error.message);
  }
}

function setupFirebaseListener() {
  if (!currentUser) return;

  const q = query(
    collection(db, "tasks"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    tasks = [];
    snapshot.forEach(doc => {
      if (doc.data().userId === currentUser.uid) {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    renderTasks();
  });
}

function renderTasks() {
  taskList.innerHTML = tasks.length ? "" : '<p class="empty-message">No tasks yet. Add one above!</p>';
  
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.dataset.index = index;
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
    
    li.querySelector(".complete-btn").addEventListener("click", () => toggleComplete(index));
    li.querySelector(".delete-btn").addEventListener("click", () => deleteTask(index));
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
  // Auth
  loginBtn.addEventListener("click", handleLogin);
  signupBtn.addEventListener("click", handleSignup);
  googleLoginBtn.addEventListener("click", handleGoogleLogin);
  logoutBtn.addEventListener("click", handleLogout);
  
  // Tasks
  addTaskBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keypress", (e) => e.key === "Enter" && addTask());
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
    updateThemeButtonText();
  });
}

// Initialize the app
init();
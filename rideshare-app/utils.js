// ─── Firebase Config ───────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCGNLUG_MN5YDFaVKweACGFUdbMzN8xP4E",
  authDomain: "hitch-8d742.firebaseapp.com",
  projectId: "hitch-8d742",
  storageBucket: "hitch-8d742.firebasestorage.app",
  messagingSenderId: "29983465742",
  appId: "1:29983465742:web:31813fd04e5104fb22b75f"
};

// ─── Backend Base URL ──────────────────────────────────────────────────────
const API_BASE = "http://localhost:5050";

// ─── Auth Helpers ──────────────────────────────────────────────────────────
function getToken()  { return localStorage.getItem("hitchToken"); }
function getUserId() { return localStorage.getItem("hitchUserId"); }
function getUserEmail() { return localStorage.getItem("hitchUserEmail"); }

function saveAuth(token, uid, email) {
  localStorage.setItem("hitchToken",  token);
  localStorage.setItem("hitchUserId", uid);
  localStorage.setItem("hitchUserEmail", email);
}

function clearAuth() {
  localStorage.removeItem("hitchToken");
  localStorage.removeItem("hitchUserId");
  localStorage.removeItem("hitchUserEmail");
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// ─── API Helpers ───────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  let token = localStorage.getItem("hitchToken");

  // 🔄 Try refreshing token
  if (window.firebaseAuth?.currentUser) {
    try {
      token = await window.firebaseAuth.currentUser.getIdToken(true);
      localStorage.setItem("hitchToken", token);
    } catch (err) {
      console.log("Token refresh failed");
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.clear(); // ✅ KEEP THIS
      window.location.href = "login.html";
    }
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// ─── Toast ────────────────────────────────────────────────────────────────
function showToast(msg, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

// ─── Format Helpers ───────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

function initials(email) {
  return (email || "?")[0].toUpperCase();
}
// what the foxtrot
console.log("what u doing here btw")
const API_BASE = "https://okbutlike.3utilities.com:6066"; 
const authUI = document.getElementById("authUI");
const gameUI = document.getElementById("gameUI");
const logoutBtn = document.getElementById("logoutBtn");
const earnBtn = document.getElementById("earnBtn");
const localCoinsEl = document.getElementById("localCoins");
const totalCoinsEl = document.getElementById("totalCoins");
const leaderboardList = document.getElementById("leaderboardList");
const showLogin = document.getElementById("showLogin");
const showRegister = document.getElementById("showRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
let currentUser = null;
let sessionToken = null;
let sessionScore = 0; 
const SESSION_KEY = 'wart';
const USER_KEY = 'okbutlike';
function showError(message, duration = 5000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(220, 20, 60, 0.95);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
function showSuccess(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(34, 139, 34, 0.95);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
function updateCounters() {
    localCoinsEl.textContent = "coin: " + sessionScore;
    totalCoinsEl.textContent = "your total score: " + (currentUser?.totalScore || 0);
}
function saveSession() {
    if (currentUser && sessionToken) {
        const sessionData = {
            user: currentUser,
            token: sessionToken,
            savedAt: Date.now()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    }
}
function loadSession() {
    try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
            const sessionData = JSON.parse(saved);
            const age = Date.now() - sessionData.savedAt;
            if (age < 24 * 60 * 60 * 1000) {
                currentUser = sessionData.user;
                sessionToken = sessionData.token;
                return true;
            } else {
                sessionStorage.removeItem(SESSION_KEY); 
            }
        }
    } catch (error) {
        console.log(error);
        sessionStorage.removeItem(SESSION_KEY); 
    }
    return false;
}
function clearSession() {
    currentUser = null;
    sessionToken = null;
    sessionScore = 0;
    sessionStorage.removeItem(SESSION_KEY);
}
async function makeAuthenticatedRequest(endpoint, data = {}) {
    if (!sessionToken || !currentUser) {
        throw new Error('not authenticated');
    }
    const requestData = {
        ...data,
        sessionToken,
        userId: currentUser.id
    };
    const response = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });
    const result = await response.json();
    if (!response.ok && result.error && result.error.includes('session')) {
        showError('session expired, login again');
        logout();
        throw new Error('session expired');
    }
    return result;
}
async function loadLeaderboard() {
    try {
        const response = await fetch(API_BASE + "/leaderboard");
        if (!response.ok) {
            throw new Error('fuck');
        }
        const users = await response.json();
        leaderboardList.innerHTML = "";
        if (users.length === 0) {
            const emptyLi = document.createElement("li");
            emptyLi.textContent = "u first i think";
            emptyLi.style.fontStyle = "italic";
            leaderboardList.appendChild(emptyLi);
            return;
        }
        users.forEach((user, index) => {
            const li = document.createElement("li");
            if (index === 0) li.classList.add("rank-1");
            else if (index === 1) li.classList.add("rank-2");
            else if (index === 2) li.classList.add("rank-3");
            li.textContent = `${user.nickname}: ${user.totalScore.toLocaleString()}`;
            leaderboardList.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        leaderboardList.innerHTML = "<li style='font-style: italic;'>idk what</li>";
    }
}
function switchToGame() {
    authUI.style.display = "none";
    gameUI.style.display = "block";
    logoutBtn.style.display = "block";
    updateCounters();
    loadLeaderboard();
    saveSession();
}
function switchToAuth() {
    authUI.style.display = "block";
    gameUI.style.display = "none";
    logoutBtn.style.display = "none";
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    document.querySelectorAll('input').forEach(input => input.value = '');
}
function logout() {
    if (sessionToken) {
        makeAuthenticatedRequest('/logout').catch(() => {
        });
    }
    clearSession();
    switchToAuth();
}
earnBtn.addEventListener("click", async () => {
    if (!currentUser || !sessionToken) {
        showError('not logged in');
        return;
    }
    try {
        const result = await makeAuthenticatedRequest('/earn');
        if (result.success) {
            sessionScore += result.earnedPoints || 5; 
            currentUser.totalScore = result.totalScore; 
            updateCounters();
            loadLeaderboard();
        } else {
            showError(result.error || 'no free coin ig');
        }
    } catch (error) {
        console.error(error);
        showError('wahahahwhdahdh');
    }
});
showLogin.onclick = () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    document.getElementById("loginName").focus(); 
};
showRegister.onclick = () => {
    registerForm.style.display = "block";
    loginForm.style.display = "none";
    document.getElementById("regName").focus();
};
registerBtn.onclick = async () => {
    const nickname = document.getElementById("regName").value.trim();
    const password = document.getElementById("regPass").value.trim();
    if (!nickname || !password) {
        showError('please fill in all fields');
        return;
    }
    if (nickname.length < 3) {
        showError('nickname must be at least 3 characters');
        return;
    }
    if (password.length < 3) {
        showError('password must be at least 3 characters');
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
        showError('letters numbers and underscores only');
        return;
    }
    registerBtn.disabled = true;
    registerBtn.textContent = 'creating account...';
    try {
        const response = await fetch(API_BASE + "/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname, password })
        });
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            sessionToken = data.sessionToken;
            sessionScore = 0; 
            showSuccess(`helo ${nickname}`);
            switchToGame();
        } else {
            showError(data.error || 'registration failed');
        }
    } catch (error) {
        console.error(error);
        showError('registration failed, oops');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'register';
    }
};
loginBtn.onclick = async () => {
    const nickname = document.getElementById("loginName").value.trim();
    const password = document.getElementById("loginPass").value.trim();
    if (!nickname || !password) {
        showError('please fill in all fields');
        return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = 'logging In...';
    try {
        const response = await fetch(API_BASE + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nickname, password })
        });
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            sessionToken = data.sessionToken;
            sessionScore = 0; 
            showSuccess(`welcome back ${nickname}`);
            switchToGame();
        } else {
            showError(data.error || 'login failed');
        }
    } catch (error) {
        console.error(error);
        showError('cant login, server might be down who knows');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'login';
    }
};
logoutBtn.onclick = () => {
    logout();
    showSuccess('logged out');
};
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (loginForm.style.display !== 'none' && loginForm.contains(e.target)) {
            loginBtn.click();
        } else if (registerForm.style.display !== 'none' && registerForm.contains(e.target)) {
            registerBtn.click();
        }
    }
});
earnBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); 
    }
});
window.addEventListener("load", async () => {
    if (loadSession()) {
        switchToGame();
    } else {
        switchToAuth();
        loadLeaderboard(); 
    }
    setInterval(loadLeaderboard, 30000); 
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser) {
        loadLeaderboard();
    }
});
window.addEventListener('online', () => {
    showSuccess('connection restored');
    if (currentUser) loadLeaderboard();
});
window.addEventListener('offline', () => {
    showError('connection lost', 10000);
});

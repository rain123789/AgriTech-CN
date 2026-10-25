// auth.js — AgriTech 本地账号系统
// 原版依赖 Firebase Auth/Firestore，缺少海外配置时登录注册完全不可用。
// 本实现复用 Flask + SQLite + Werkzeug 密码哈希 + JWT，保留原有
// register.js / login.js 所需的 window.authManager API。

const API_BASE = "";

const AUTH_STORAGE_KEY = "agritech_session";

const ROLE_HOME = {
  farmer: "farmer.html",
  buyer: "buyer.html",
  equipment: "equipment.html",
  grocery: "grocery.html",
  expert: "expert.html",
  admin: "admin.html",
  shopkeeper: "shopkeeper.html",
};

class AuthManager {
  constructor() {
    this.currentUser = this._restoreSession();
    this.accessToken = localStorage.getItem("agritech_access_token") || "";
  }

  _restoreSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  _setSession(user, accessToken = "") {
    this.currentUser = user;
    this.accessToken = accessToken || this.accessToken;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    if (accessToken) localStorage.setItem("agritech_access_token", accessToken);
  }

  _usernameFromEmail(email, fullname) {
    const local = String(email).split("@")[0] || "";
    const cleaned = local
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}._-]/gu, "")
      .slice(0, 24);
    if (cleaned.length >= 2) return cleaned;
    let hash = 0;
    for (const char of `${fullname}${email}`) {
      hash = (hash * 31 + char.codePointAt(0)) >>> 0;
    }
    return `user_${hash.toString(36)}`;
  }

  async register({ role, fullname, email, password }) {
    const validation = this._validateRegistrationData({ role, fullname, email, password });
    if (!validation.valid) return { success: false, message: validation.message };
    const passwordCheck = this._validatePassword(password);
    if (!passwordCheck.valid) return { success: false, message: passwordCheck.message };

    const payload = {
      username: this._usernameFromEmail(email, fullname),
      full_name: String(fullname).trim(),
      email: String(email).trim().toLowerCase(),
      password,
      role: String(role).trim().toLowerCase(),
      location: "中国大陆",
    };

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { success: false, message: this._friendlyApiMessage(data.message || data.error, response.status) };
      }
      const user = this._normalizeUser(data.user, fullname, email);
      this._setSession(user);
      return { success: true, message: "账号创建成功，正在进入工作台…", user };
    } catch (error) {
      return {
        success: false,
        message: "无法连接本地服务，请确认已运行“启动平台.cmd”，并访问 http://127.0.0.1:5000 。",
      };
    }
  }

  async login(email, password) {
    const validation = this._validateLoginData(email, password);
    if (!validation.valid) return { success: false, message: validation.message };

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username: String(email).trim().toLowerCase(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { success: false, message: this._friendlyApiMessage(data.message || data.error, response.status) };
      }
      const user = this._normalizeUser(data.user, "", email);
      this._setSession(user, data.access_token || "");
      return { success: true, message: "登录成功！", user };
    } catch (error) {
      return {
        success: false,
        message: "无法连接本地服务，请确认已运行“启动平台.cmd”，并访问 http://127.0.0.1:5000 。",
      };
    }
  }

  async logout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (_) {
      // 本地无服务时也应允许清理本地会话
    }
    this.currentUser = null;
    this.accessToken = "";
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("agritech_access_token");
    window.location.href = "login.html";
    return { success: true };
  }

  isLoggedIn() {
    return Boolean(this.getCurrentUser());
  }

  getCurrentUser() {
    if (this.currentUser) return this.currentUser;
    this.currentUser = this._restoreSession();
    return this.currentUser;
  }

  getHomePageForRole(role) {
    return ROLE_HOME[role] || "main.html";
  }

  async getAllUsers() {
    return [];
  }

  async setBanned() {
    return { success: false, message: "用户管理需由管理员在本地数据库执行。" };
  }

  async setRole() {
    return { success: false, message: "角色变更需由管理员在本地数据库执行。" };
  }

  _normalizeUser(apiUser, fallbackName = "", fallbackEmail = "") {
    const source = apiUser || {};
    return {
      id: source.id || Date.now(),
      username: source.username || "",
      fullname: source.full_name || source.fullname || fallbackName || source.username || "用户",
      email: source.email || fallbackEmail,
      role: source.role || "farmer",
      location: source.location || "中国大陆",
    };
  }

  _validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(String(email).trim());
  }

  _isValidFullName(name) {
    const value = String(name).trim();
    return (
      value.length >= 2 &&
      value.length <= 50 &&
      /^[\p{L}\p{M}·.'’\-\s]+$/u.test(value) &&
      !/^\s*$/.test(value)
    );
  }

  _validatePassword(password) {
    if (String(password).length < 8) {
      return { valid: false, message: "密码至少需要 8 位字符" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "密码需要包含至少一个小写字母" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "密码需要包含至少一个大写字母" };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: "密码需要包含至少一个数字" };
    }
    return { valid: true };
  }

  _validateRegistrationData({ role, fullname, email, password }) {
    if (!role || !fullname || !email || !password) {
      return { valid: false, message: "请完整填写所有字段" };
    }
    const allowedRoles = ["buyer", "farmer", "equipment", "grocery", "expert"];
    if (!allowedRoles.includes(String(role).trim().toLowerCase())) {
      return { valid: false, message: "请选择有效的用户角色" };
    }
    if (!this._isValidFullName(fullname)) {
      return { valid: false, message: "姓名支持中文、英文字母、空格、间隔号、点号和连字符，长度 2–50 个字符" };
    }
    if (!this._validateEmail(email)) {
      return { valid: false, message: "请输入有效的邮箱地址" };
    }
    return { valid: true };
  }

  _validateLoginData(email, password) {
    if (!email || !password) return { valid: false, message: "请输入邮箱和密码" };
    if (!this._validateEmail(email)) return { valid: false, message: "请输入有效的邮箱地址" };
    return { valid: true };
  }

  _friendlyApiMessage(message, status) {
    const text = String(message || "");
    if (status === 401) return "邮箱或密码不正确";
    if (status === 409) return "该邮箱或用户名已被注册";
    if (text.includes("Full Name") || text.includes("full_name") || text.includes("姓名")) {
      return "姓名格式无效，请输入 2–50 个中文或英文字符";
    }
    if (text.includes("valid email")) return "请输入有效的邮箱地址";
    if (text.includes("Password")) return "密码至少 8 位，且需包含大写字母、小写字母和数字";
    return text || "操作失败，请稍后重试";
  }

  updateAuthUI() {
    const user = this.getCurrentUser();
    const isLoggedIn = Boolean(user);
    const loginBtn = document.querySelector(".login-btn-desktop");
    const registerBtn = document.querySelector(".register-btn-desktop");
    const logoutBtn = document.querySelector(".logout-button");
    const mobileLogin = document.querySelector('a[href="login.html"].mobile-link');
    const mobileReg = document.querySelector('a[href="register.html"].mobile-link');

    if (isLoggedIn) {
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
      if (logoutBtn) {
        logoutBtn.style.display = "inline-flex";
        logoutBtn.onclick = (event) => {
          event.preventDefault();
          this.logout();
        };
      }
      if (mobileLogin) mobileLogin.style.display = "none";
      if (mobileReg) mobileReg.style.display = "none";
    } else {
      if (loginBtn) loginBtn.style.display = "inline-flex";
      if (registerBtn) registerBtn.style.display = "inline-flex";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (mobileLogin) mobileLogin.style.display = "flex";
      if (mobileReg) mobileReg.style.display = "flex";
    }
  }
}

window.authManager = new AuthManager();

window.requireAuth = function (allowedRoles = []) {
  const user = window.authManager.getCurrentUser();
  if (!user) {
    window.showAuthMessage("请先登录后再访问此页面。", "error");
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return false;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    window.showAuthMessage("当前账号没有访问该页面的权限。", "error");
    setTimeout(() => (window.location.href = "unauthorized.html"), 1200);
    return false;
  }
  return true;
};

window.redirectIfLoggedIn = function () {
  const user = window.authManager.getCurrentUser();
  if (user) window.location.href = window.authManager.getHomePageForRole(user.role);
};

window.showAuthMessage = function (message, type = "info") {
  document.querySelector(".auth-message")?.remove();
  const div = document.createElement("div");
  div.className = `auth-message auth-message-${type}`;
  div.setAttribute("role", type === "error" ? "alert" : "status");
  div.innerHTML = `
    <div class="auth-message-content">
      <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
      <span></span>
    </div>`;
  div.querySelector("span").textContent = String(message);
  div.style.cssText = `
    position:fixed; top:20px; right:20px; z-index:10000;
    padding:15px 20px; border-radius:8px; color:white;
    font-weight:500; box-shadow:0 4px 12px rgba(0,0,0,.15);
    animation:slideInRight .3s ease-out; max-width:440px; line-height:1.6`;
  const colors = {
    success: "linear-gradient(135deg,#4caf50,#45a049)",
    error: "linear-gradient(135deg,#f44336,#e53935)",
    info: "linear-gradient(135deg,#2196f3,#1976d2)",
  };
  div.style.background = colors[type] || colors.info;
  document.body.appendChild(div);
  setTimeout(() => {
    if (div.parentNode) {
      div.style.animation = "slideOutRight .3s ease-out";
      setTimeout(() => div.remove(), 300);
    }
  }, 5000);
};

const authStyle = document.createElement("style");
authStyle.textContent = `
  @keyframes slideInRight  { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
  @keyframes slideOutRight { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(100%)} }
  .auth-message-content { display:flex; align-items:center; gap:10px; }
  .auth-message-content i { font-size:1.2rem; }
`;
document.head.appendChild(authStyle);

document.addEventListener("DOMContentLoaded", () => {
  window.authManager.updateAuthUI();
});

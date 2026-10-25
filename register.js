// register.js — AgriTech Registration Page Handler
// Change from original: handleRegister is async + removed fake setTimeout

const ALLOWED_ROLES = ["buyer", "farmer", "equipment", "grocery", "expert"];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function isValidFullName(fullname) {
  const value = String(fullname).trim();
  return value.length >= 2 && value.length <= 50 && /^[\p{L}\p{M}·.'’\-\s]+$/u.test(value);
}

function setFieldState(input, isValid) {
  if (!input) return;
  input.classList.toggle("error", !isValid);
  input.setAttribute("aria-invalid", String(!isValid));
}

function validateRegisterFields(formData) {
  const roleInput = document.getElementById("role");
  const fullnameInput = document.getElementById("fullname");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  if (!ALLOWED_ROLES.includes(formData.role)) {
    setFieldState(roleInput, false);
    return "请选择有效的用户角色";
  }

  if (!formData.fullname) {
    setFieldState(fullnameInput, false);
    return "请输入姓名或昵称";
  }

  if (!isValidFullName(formData.fullname)) {
    setFieldState(fullnameInput, false);
    return "姓名支持中文、英文字母及常用姓名符号，长度 2–50 个字符";
  }

  if (!formData.email) {
    setFieldState(emailInput, false);
    return "请输入邮箱地址";
  }

  if (!isValidEmail(formData.email)) {
    setFieldState(emailInput, false);
    return "请输入有效的邮箱地址";
  }

  if (!formData.password) {
    setFieldState(passwordInput, false);
    return "请设置密码";
  }

  if (!isValidPassword(formData.password)) {
    setFieldState(passwordInput, false);
    return "密码至少 8 位，并需包含大写字母、小写字母和数字";
  }

  setFieldState(roleInput, true);
  setFieldState(fullnameInput, true);
  setFieldState(emailInput, true);
  setFieldState(passwordInput, true);
  return "";
}

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("password-eye");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className = "fas fa-eye-slash";
  } else {
    passwordInput.type = "password";
    eyeIcon.className = "fas fa-eye";
  }
}

function handleBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "index.html";
  }
}

function updateRoleIcon() {
  const roleSelect = document.getElementById("role");
  const roleIcon = document.getElementById("role-icon");
  const value = roleSelect.value;

  const iconMap = {
    buyer: "fas fa-shopping-cart role-buyer",
    farmer: "fas fa-tractor role-farmer",
    equipment: "fas fa-tools role-equipment",
    grocery: "fas fa-store role-grocery",
    expert: "fas fa-user-graduate role-expert",
  };
  roleIcon.className = iconMap[value] || "fas fa-user-tag";
}

function checkPasswordStrength() {
  const password = document.getElementById("password").value;
  const strengthBar = document.getElementById("strength-bar");
  const strengthText = document.getElementById("strength-text");

  // Empty field — reset completely
  if (password.length === 0) {
    strengthBar.className = "strength-bar";
    strengthBar.style.width = "0%";
    strengthText.textContent = "";
    return;
  }

  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[\d\W]/.test(password)) strength += 25;

  strengthBar.className = "strength-bar";

  // Extra credit for very long passwords
  if (password.length >= 16) strength = Math.min(strength + 10, 100);

  strengthBar.className = "strength-bar";
  strengthBar.style.width = strength + "%";

  if (strength <= 25) {
    strengthBar.classList.add("strength-weak");
    strengthText.textContent = "密码强度较弱";
  } else if (strength <= 50) {
    strengthBar.classList.add("strength-fair");
    strengthText.textContent = "密码强度一般";
  } else if (strength <= 75) {
    strengthBar.classList.add("strength-good");
    strengthText.textContent = "密码强度良好";
  } else {
    strengthBar.classList.add("strength-strong");
    strengthText.textContent = "密码强度较强";
  }
}

function updateProgress() {
  const fields = ["role", "fullname", "email", "password"];
  fields.forEach((fieldId, index) => {
    const field = document.getElementById(fieldId);
    const step = document.getElementById(`step-${index + 1}`);
    if (field && field.value.trim() !== "") {
      step.classList.add("completed");
    } else if (step) {
      step.classList.remove("completed");
    }
  });

  const password = document.getElementById("password").value;
  const finalStep = document.getElementById("step-5");
  if (finalStep) {
    if (
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[\d\W]/.test(password)
    ) {
      finalStep.classList.add("completed");
    } else {
      finalStep.classList.remove("completed");
    }
  }
}

// ── Main register handler (now async) ────────────────────────────────────────
async function handleRegister(event) {
  event.preventDefault();

  const registerBtn = document.getElementById("register-btn");
  const registerText = document.getElementById("register-text");
  const inputs = document.querySelectorAll("input, select");

  registerBtn.classList.add("loading");
  registerText.textContent = "正在创建账号…";
  registerBtn.disabled = true;

  inputs.forEach((input) => input.classList.remove("error", "success"));

  const formData = {
    role: document.getElementById("role").value,
    fullname: document.getElementById("fullname").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  const confirmInput = document.getElementById("confirmPassword");
  if (confirmInput && confirmInput.value && confirmInput.value !== formData.password) {
    setFieldState(confirmInput, false);
    showAuthMessage("两次输入的密码不一致。", "error");
    registerBtn.classList.remove("loading");
    registerText.textContent = "创建账号";
    registerBtn.disabled = false;
    return;
  }

  const validationMessage = validateRegisterFields(formData);
  if (validationMessage) {
    showAuthMessage(validationMessage, "error");
    registerBtn.classList.remove("loading");
    registerText.textContent = "创建账号";
    registerBtn.disabled = false;
    return;
  }

  const result = await window.authManager.register(formData);

  if (result.success) {
    inputs.forEach((input) => input.classList.add("success"));
    registerText.textContent = "账号创建成功！";
    showAuthMessage(result.message, "success");
    setTimeout(() => {
      // Redirect to the role-specific home page
      window.location.href = window.authManager.getHomePageForRole(result.user.role);
    }, 1500);
  } else {
    showAuthMessage(result.message, "error");

    const msg = result.message.toLowerCase();
    if (msg.includes("email") || msg.includes("gmail")) document.getElementById("email").classList.add("error");
    if (msg.includes("fullname") || msg.includes("full name")) document.getElementById("fullname").classList.add("error");
    if (msg.includes("password")) document.getElementById("password").classList.add("error");

    registerBtn.classList.remove("loading");
    registerText.textContent = "创建账号";
    registerBtn.disabled = false;
  }
}

// Input listeners
document.querySelectorAll("input, select").forEach((input) => {
  input.addEventListener("input", updateProgress);
  input.addEventListener("change", updateProgress);
  input.addEventListener("focus", function () { this.parentElement.style.transform = "translateY(-2px)"; });
  input.addEventListener("blur", function () { this.parentElement.style.transform = "translateY(0)"; });
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const form = document.querySelector("form");
    if (
      document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "SELECT"
    ) {
      const inputs = Array.from(form.querySelectorAll("input, select"));
      const idx = inputs.indexOf(document.activeElement);
      if (idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      } else {
        form.dispatchEvent(new Event("submit"));
      }
    }
  }
});

document.addEventListener("DOMContentLoaded", updateProgress);
document.getElementById("password").addEventListener("input", checkPasswordStrength);
// Lamp Toggle Feature
document.addEventListener("DOMContentLoaded", () => {
  const lampToggle = document.getElementById("lampToggle");
  const darkOverlay = document.getElementById("darkOverlay");

  if (!lampToggle || !darkOverlay) return;

  const formInputs = document.querySelectorAll(
    "#role, #fullname, #email, #password, #confirmPassword, #register-btn"
  );

  let lampOn = true;

  lampToggle.addEventListener("click", () => {
    lampOn = !lampOn;

    if (lampOn) {
      lampToggle.textContent = "💡 开";
      darkOverlay.classList.add("hidden");

      formInputs.forEach(input => {
        input.disabled = false;
      });

    } else {
      lampToggle.textContent = "💡 关";
      darkOverlay.classList.remove("hidden");

      formInputs.forEach(input => {
        input.disabled = true;
      });
    }
  });
});
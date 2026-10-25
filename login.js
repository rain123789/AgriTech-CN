// login.js — AgriTech Login Page Handler
// Only change from original: handleLogin is now async (Firebase calls are async)

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldState(input, isValid) {
  if (!input) return;
  input.classList.toggle("error", !isValid);
  input.setAttribute("aria-invalid", String(!isValid));
}

function validateLoginFields(email, password, emailInput, passwordInput) {
  if (!email) {
    setFieldState(emailInput, false);
    return "请输入邮箱地址";
  }

  if (!isValidEmail(email)) {
    setFieldState(emailInput, false);
    return "请输入有效的邮箱地址";
  }

  if (!password) {
    setFieldState(passwordInput, false);
    return "请输入密码";
  }

  setFieldState(emailInput, true);
  setFieldState(passwordInput, true);
  return "";
}

async function handleLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.querySelector('button[type="submit"]');

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  const validationMessage = validateLoginFields(email, password, emailInput, passwordInput);
  if (validationMessage) {
    showAuthMessage(validationMessage, "error");
    return;
  }

  // Basic client-side password length validation
  const pwdInput = document.getElementById('password');
  const pwdErr = document.getElementById('loginPasswordError');
  if (password.length < 8) {
    pwdErr.textContent = '密码至少需要 8 位字符。';
    pwdInput.classList.add('error');
    return;
  } else {
    if (pwdErr) pwdErr.textContent = '';
    pwdInput.classList.remove('error');
  }

  // Loading state
  const originalText = loginBtn.innerText;
  loginBtn.innerText  = "正在登录…";
  loginBtn.disabled   = true;

  // Clear previous error styles
  emailInput.classList.remove("error");
  passwordInput.classList.remove("error");

  const result = await window.authManager.login(email, password);

  if (result.success) {
    showAuthMessage(result.message, "success");
    // Role-based redirect
    setTimeout(() => {
      window.location.href = window.authManager.getHomePageForRole(result.user.role);
    }, 1000);
  } else {
    showAuthMessage(result.message, "error");

    const msg = result.message.toLowerCase();
    if (msg.includes("email")) {
      emailInput.classList.add("error");
    } else {
      passwordInput.classList.add("error");
    }

    loginBtn.innerText = originalText;
    loginBtn.disabled  = false;
  }
}

// Remove error styling on input
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => input.classList.remove("error"));
});

function togglePassword() {
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("password-eye");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.className  = "fas fa-eye-slash";
  } else {
    passwordInput.type = "password";
    eyeIcon.className  = "fas fa-eye";
  }
}
// Lamp Toggle Feature
document.addEventListener("DOMContentLoaded", () => {
  const lampToggle = document.getElementById("lampToggle");
  const darkOverlay = document.getElementById("darkOverlay");

  if (!lampToggle || !darkOverlay) return;

  const inputs = document.querySelectorAll(
    'input, button[type="submit"]'
  );

  let lampOn = true;

  lampToggle.addEventListener("click", () => {
    lampOn = !lampOn;

    if (lampOn) {
      lampToggle.textContent = "💡 开";
      darkOverlay.classList.add("hidden");

      inputs.forEach(input => {
        input.disabled = false;
      });

    } else {
      lampToggle.textContent = "💡 关";
      darkOverlay.classList.remove("hidden");

      inputs.forEach(input => {
        input.disabled = true;
      });
    }
  });
});
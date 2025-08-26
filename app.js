// -----------------------------
// Sign Up function
// -----------------------------
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    document.getElementById("error-msg").innerText = error.message;
    document.getElementById("error-msg").style.color = "red";
  } else {
    // ✅ Check if this signup is the admin
    if (email === "abhayrangappanvat@gmail.com") {
      localStorage.setItem("isAdmin", "true");
    } else {
      localStorage.setItem("isAdmin", "false");
    }

    document.getElementById("error-msg").innerText =
      "✅ Signup successful! Please check your email.";
    document.getElementById("error-msg").style.color = "green";
  }
}

// -----------------------------
// Login function
// -----------------------------
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById("error-msg").innerText = error.message;
    document.getElementById("error-msg").style.color = "red";
  } else {
    // ✅ Check if this login is the admin
    if (email === "abhayrangappanvat@gmail.com") {
      localStorage.setItem("isAdmin", "true");
    } else {
      localStorage.setItem("isAdmin", "false");
    }

    window.location.href = "home.html"; // redirect to home page
  }
}

// -----------------------------
// Logout function
// -----------------------------
async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem("isAdmin"); // ✅ clear admin flag
  window.location.href = "index.html";
}

// -----------------------------
// Show / Hide Password Toggle
// -----------------------------
const togglePassword = document.getElementById("toggle-password");
if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const passwordField = document.getElementById("password");

    if (passwordField.type === "password") {
      passwordField.type = "text";
      togglePassword.classList.add("active"); // fill circle with blue
    } else {
      passwordField.type = "password";
      togglePassword.classList.remove("active");
    }
  });
}

// -----------------------------
// Attach Events
// -----------------------------
document.getElementById("login-btn")?.addEventListener("click", login);
document.getElementById("signup-btn")?.addEventListener("click", signup);

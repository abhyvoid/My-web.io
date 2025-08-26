// app.js

// Sign Up function
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { user, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    document.getElementById("message").innerText =
      "Signup successful! Please check your email.";
  }
}

// Login function
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    window.location.href = "home.html"; // redirect to home page
  }
}

// Logout function
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

/* -----------------------------
   Show / Hide Password Toggle
----------------------------- */
const togglePassword = document.getElementById("toggle-password");
if (togglePassword) {
  togglePassword.addEventListener("click", () => {
    const passwordField = document.getElementById("password");

    if (passwordField.type === "password") {
      passwordField.type = "text";
      togglePassword.classList.add("active"); // adds blue inner circle
    } else {
      passwordField.type = "password";
      togglePassword.classList.remove("active");
    }
  });
}

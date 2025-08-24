// app.js

// Sign Up function
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { user, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    document.getElementById("message").innerText = "Signup successful! Please check your email.";
  }
}

// Login function
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

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

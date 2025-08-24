// app.js (only login & signup)

// Signup
document.getElementById("signup-btn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    document.getElementById("error-msg").innerText = error.message;
  } else {
    document.getElementById("error-msg").innerText =
      "Signup successful! Please check your email.";
  }
});

// Login
document.getElementById("login-btn")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    document.getElementById("error-msg").innerText = error.message;
  } else {
    window.location.href = "home.html"; // redirect to home page
  }
});

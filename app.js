// Signup
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    document.getElementById("message").innerText = "Signup successful! Now login.";
  }
}

// Login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    window.location.href = "home.html";
  }
}

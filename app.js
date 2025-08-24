// app.js

// ---------------- AUTH FUNCTIONS ----------------

// Sign Up
async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    document.getElementById("message").innerText =
      "Signup successful! Please check your email.";
  }
}

// Login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  let { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    window.location.href = "home.html"; // redirect to home
  }
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// ---------------- HOME PAGE FUNCTIONS ----------------
document.addEventListener("DOMContentLoaded", async () => {
  // Check if we’re on home.html
  if (window.location.pathname.includes("home.html")) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Side menu toggle
    const menuBtn = document.getElementById("menu-btn");
    const sideMenu = document.getElementById("side-menu");
    if (menuBtn && sideMenu) {
      menuBtn.addEventListener("click", () => {
        sideMenu.classList.toggle("hidden");
      });
    }

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    // Dark mode toggle
    const darkToggle = document.getElementById("dark-mode-toggle");
    if (darkToggle) {
      darkToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
      });
    }

    // ---------------- ADMIN ONLY ----------------
    const ADMIN_EMAIL = "abhayrangappanvat@gmail.com"; // change if needed
    const adminControls = document.getElementById("admin-controls");
    const addPostBtn = document.getElementById("add-post-btn");
    const fabBtn = document.createElement("div");

    if (user && user.email === ADMIN_EMAIL) {
      // Show floating + button
      fabBtn.innerText = "+";
      fabBtn.id = "fab-btn";
      fabBtn.style.position = "fixed";
      fabBtn.style.bottom = "20px";
      fabBtn.style.right = "20px";
      fabBtn.style.width = "50px";
      fabBtn.style.height = "50px";
      fabBtn.style.borderRadius = "50%";
      fabBtn.style.background = "#007bff";
      fabBtn.style.color = "white";
      fabBtn.style.display = "flex";
      fabBtn.style.alignItems = "center";
      fabBtn.style.justifyContent = "center";
      fabBtn.style.fontSize = "24px";
      fabBtn.style.cursor = "pointer";
      document.body.appendChild(fabBtn);

      // Toggle editor panel when fab clicked
      fabBtn.addEventListener("click", () => {
        adminControls.classList.toggle("hidden");
      });

      // Example post creation (will expand later)
      if (addPostBtn) {
        addPostBtn.addEventListener("click", () => {
          const text = document.getElementById("post-text").value;
          const container = document.getElementById("posts-container");
          const newPost = document.createElement("div");
          newPost.innerText = text;
          container.appendChild(newPost);
        });
      }
    } else {
      // Hide admin controls if not admin
      if (adminControls) adminControls.remove();
    }
  }
});

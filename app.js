// app.js
import { supabase } from "./supabase.js";

// --------- LOGIN ---------
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");
  const errorMsg = document.getElementById("error-msg");

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        errorMsg.textContent = "❌ " + error.message;
      } else {
        window.location.href = "home.html"; // redirect on success
      }
    });
  }

  // --------- SIGNUP ---------
  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        errorMsg.textContent = "❌ " + error.message;
      } else {
        errorMsg.textContent = "✅ Signup successful! Please login now.";
      }
    });
  }

  // --------- CHECK SESSION ---------
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session && window.location.pathname.includes("index.html")) {
      // already logged in → go to home
      window.location.href = "home.html";
    }
  });
});

// --------- LOGOUT ---------
export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}    

// ✅ Connect Supabase
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_KEY";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";

const postsContainer = document.getElementById("posts");
const addPostBtn = document.getElementById("add-post-btn");
const modal = document.getElementById("add-post-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const savePostBtn = document.getElementById("save-post-btn");
const logoutBtn = document.getElementById("logout-btn");
const darkModeToggle = document.getElementById("dark-mode-toggle");

// -----------------------------
// Check user
// -----------------------------
async function checkUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Auth error:", error.message);
    window.location.href = "index.html";
    return;
  }
  const user = data.user;
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Show + button only for admin
  if (user.email === ADMIN_EMAIL) {
    addPostBtn.style.display = "block";
  } else {
    addPostBtn.style.display = "none";
  }

  loadPosts();
}
checkUser();

// -----------------------------
// Logout
// -----------------------------
logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert("Logout failed: " + error.message);
  } else {
    window.location.href = "index.html";
  }
});

// -----------------------------
// Dark Mode
// -----------------------------
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeToggle.textContent =
    document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
});

// -----------------------------
// Modal handling
// -----------------------------
addPostBtn.addEventListener("click", () => {
  modal.style.display = "block";
});
closeModalBtn.addEventListener("click", () => {
  modal.style.display = "none";
});

// -----------------------------
// Save new post
// -----------------------------
savePostBtn.addEventListener("click", async () => {
  const text = document.getElementById("post-text").value.trim();
  const file = document.getElementById("post-image").files[0];

  if (!text && !file) {
    alert("Post cannot be empty");
    return;
  }

  let imageUrl = null;
  if (file) {
    const { data, error } = await supabase.storage
      .from("posts")
      .upload(`images/${Date.now()}_${file.name}`, file);

    if (error) {
      alert("Error uploading image: " + error.message);
      return;
    }
    imageUrl = `${supabaseUrl}/storage/v1/object/public/posts/${data.path}`;
  }

  const { error } = await supabase
    .from("posts")
    .insert([{ content: text, image_url: imageUrl }]);

  if (error) {
    alert("Error saving post: " + error.message);
    return;
  }

  modal.style.display = "none";
  document.getElementById("post-text").value = "";
  document.getElementById("post-image").value = "";
  loadPosts();
});

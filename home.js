// home.js

// Redirect if not logged in
supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    window.location.href = "index.html";
  } else {
    loadPosts();
    checkAdmin(session.user.email);
  }
});

// Show admin-only UI if logged in as admin
function checkAdmin(email) {
  if (email === "abhayrangappanvat@gmail.com") {
    document.getElementById("add-post-circle").classList.remove("hidden");
  }
}

// Toggle side menu
document.getElementById("menu-btn").addEventListener("click", () => {
  document.getElementById("side-menu").classList.toggle("hidden");
});

// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// Dark mode toggle
document.getElementById("dark-mode-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

// Floating + button toggles editor panel
document.getElementById("add-post-circle").addEventListener("click", () => {
  document.getElementById("admin-controls").classList.toggle("hidden");
});

// Add Post
document.getElementById("add-post-btn").addEventListener("click", async () => {
  const text = document.getElementById("post-text").value;
  const file = document.getElementById("post-image").files[0];
  let imageUrl = "";

  if (file) {
    const { data, error } = await supabase.storage.from("images").upload(`posts/${Date.now()}-${file.name}`, file);
    if (error) {
      alert("Image upload failed");
      return;
    }
    const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(data.path);
    imageUrl = publicUrl.publicUrl;
  }

  const { error } = await supabase.from("posts").insert([{ text, image_url: imageUrl }]);
  if (error) {
    alert("Error adding post: " + error.message);
  } else {
    document.getElementById("post-text").value = "";
    document.getElementById("post-image").value = "";
    loadPosts();
  }
});

// Load Posts
async function loadPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  data.forEach((post) => {
    const div = document.createElement("div");
    div.classList.add("post");
    div.innerHTML = `
      <p>${post.text}</p>
      ${post.image_url ? `<img src="${post.image_url}" alt="post image" />` : ""}
    `;
    container.appendChild(div);
  });
}

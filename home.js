// Check session on load
supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    window.location.href = "index.html";
  } else {
    loadPosts();
    showAdminControls(session.user.email);
  }
});

// Show admin-only controls
function showAdminControls(email) {
  if (email === "abhayrangappanvat@gmail.com") {
    document.getElementById("add-post-circle").classList.remove("hidden");
  } else {
    document.getElementById("admin-controls").classList.add("hidden");
    document.getElementById("add-post-circle").classList.add("hidden");
  }
}

// Add Post
document.getElementById("add-post-btn")?.addEventListener("click", async () => {
  const text = document.getElementById("post-text").value;
  const file = document.getElementById("post-Image").files[0];
  let imageUrl = "";

  if (file) {
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from("Images")
      .upload(`posts/${Date.now()}-${file.name}`, file, { cacheControl: "3600", upsert: false });

    if (error) {
      alert("Image upload failed: " + error.message);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(data.path);
    imageUrl = urlData.publicUrl;
  }

  // Insert into posts table
  const { error: insertError } = await supabase.from("posts").insert([
    { text, image_url: imageUrl, author: "admin" }
  ]);

  if (insertError) {
    alert("Error adding post: " + insertError.message);
  } else {
    document.getElementById("post-text").value = "";
    document.getElementById("post-image").value = "";
    loadPosts();
  }
});

// Load Posts
async function loadPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) return console.error(error);

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

// Logout
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// Menu toggle
document.getElementById("menu-btn")?.addEventListener("click", () => {
  document.getElementById("side-menu").classList.toggle("hidden");
});

// Dark mode toggle
document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

// Floating + button (open editor for admin only)
document.getElementById("add-post-circle")?.addEventListener("click", () => {
  document.getElementById("admin-controls").classList.toggle("hidden");
});

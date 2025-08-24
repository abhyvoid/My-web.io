// ✅ Check session on load
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = "index.html"; // redirect if not logged in
  } else {
    loadPosts();
    showAdminControls(session.user.email);
  }
});

// ✅ Listen for login/logout changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    window.location.href = "index.html";
  } else {
    loadPosts();
    showAdminControls(session.user.email);
  }
});

// ✅ Show admin-only UI
function showAdminControls(email) {
  const addCircle = document.getElementById("add-post-circle");
  const addBtn = document.getElementById("add-post-btn");
  const delBtn = document.getElementById("delete-post-btn");

  if (email === "abhayrangappanvat@gmail.com") {
    addCircle.style.display = "flex";
    addBtn.style.display = "block";
    delBtn.style.display = "block";
  } else {
    addCircle.style.display = "none";
    addBtn.style.display = "none";
    delBtn.style.display = "none";
  }
}

// ✅ Add Post
document.getElementById("add-post-btn")?.addEventListener("click", async () => {
  const text = document.getElementById("post-text").value;
  const file = document.getElementById("post-image").files[0];
  let imageUrl = "";

  if (file) {
    const { data, error } = await supabase.storage.from("images")
      .upload(`posts/${Date.now()}-${file.name}`, file);
    if (error) {
      alert("Image upload failed");
      return;
    }
    const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(data.path);
    imageUrl = publicUrl.publicUrl;
  }

  const { error } = await supabase.from("posts").insert([
    { text, image_url: imageUrl, author: "admin" }
  ]);

  if (error) {
    alert("Error adding post: " + error.message);
  } else {
    document.getElementById("post-text").value = "";
    document.getElementById("post-image").value = "";
    loadPosts();
  }
});

// ✅ Load Posts
async function loadPosts() {
  const { data, error } = await supabase.from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  // check current session for admin rights
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = session?.user?.email === "abhayrangappanvat@gmail.com";

  data.forEach((post) => {
    const div = document.createElement("div");
    div.classList.add("post");
    div.innerHTML = `
      <p>${post.text}</p>
      ${post.image_url ? `<img src="${post.image_url}" alt="post image" />` : ""}
      ${isAdmin ? `<button class="delete-btn" data-id="${post.id}">Delete</button>` : ""}
    `;
    container.appendChild(div);
  });

  // attach delete events
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) {
        alert("Error deleting post");
      } else {
        loadPosts();
      }
    });
  });
}

// ✅ Logout
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// ✅ Menu toggle
document.getElementById("menu-btn")?.addEventListener("click", () => {
  document.getElementById("side-menu").classList.toggle("hidden");
});

// ✅ Dark mode
document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

// ✅ Floating + button → toggle editor
document.getElementById("add-post-circle")?.addEventListener("click", () => {
  document.getElementById("admin-controls").classList.toggle("hidden");
});

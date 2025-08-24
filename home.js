// home.js

// ---- CONFIG ----
const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";
const IMAGES_BUCKET = "images"; // must exist and be public

// ---- STATE ----
let currentEmail = null;
let isAdmin = false;

// ---- AUTH GATE + UI SETUP ----
supabase.auth.onAuthStateChange(async (_event, session) => {
  if (!session) {
    // Not logged in -> back to login
    window.location.href = "index.html";
    return;
  }
  currentEmail = session.user.email || "";
  isAdmin = currentEmail === ADMIN_EMAIL;

  setupAdminUI();
  await loadPosts();
});

// Show/hide admin bits
function setupAdminUI() {
  const addCircle = document.getElementById("add-post-circle");
  const editor = document.getElementById("admin-controls");

  // Always start hidden
  editor.classList.add("hidden");

  if (isAdmin) {
    addCircle.style.display = "flex"; // admin sees the +
  } else {
    addCircle.style.display = "none";  // non-admin sees nothing
  }
}

// ---- UI HANDLERS ----
document.getElementById("menu-btn")?.addEventListener("click", () => {
  document.getElementById("side-menu").classList.toggle("hidden");
});

document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// Toggle editor from the floating +
document.getElementById("add-post-circle")?.addEventListener("click", () => {
  if (!isAdmin) return; // ultra-safety
  document.getElementById("admin-controls").classList.toggle("hidden");
});

// Add Post (admin only)
document.getElementById("add-post-btn")?.addEventListener("click", async () => {
  if (!isAdmin) {
    alert("Only admin can add posts.");
    return;
  }

  const textEl = document.getElementById("post-text");
  const fileEl = document.getElementById("post-image");
  const text = (textEl.value || "").trim();
  const file = fileEl.files[0];

  let imageUrl = "";

  // Upload image if chosen
  if (file) {
    const path = `posts/${Date.now()}-${file.name}`;
    const { data: up, error: upErr } = await supabase
      .storage
      .from(IMAGES_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (upErr) {
      alert("Image upload failed: " + upErr.message);
      return;
    }
    const { data: p } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(up.path);
    imageUrl = p.publicUrl;
  }

  const { error: insErr } = await supabase.from("posts").insert([
    { text, image_url: imageUrl, author: "admin" }
  ]);

  if (insErr) {
    alert("Error adding post: " + insErr.message);
    return;
  }

  // clear inputs and hide editor
  textEl.value = "";
  fileEl.value = "";
  document.getElementById("admin-controls").classList.add("hidden");
  await loadPosts();
});

// ---- DATA ----
async function loadPosts() {
  const container = document.getElementById("posts-container");
  container.innerHTML = "Loading...";

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = "Failed to load posts.";
    console.error(error);
    return;
  }

  container.innerHTML = "";
  data.forEach((post) => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <p>${escapeHtml(post.text || "")}</p>
      ${post.image_url ? `<img src="${post.image_url}" alt="post image" />` : ""}
      ${isAdmin ? `<button class="delete-btn" data-id="${post.id}">Delete</button>` : ""}
    `;
    container.appendChild(div);
  });

  if (isAdmin) {
    container.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        const { error: delErr } = await supabase.from("posts").delete().eq("id", id);
        if (delErr) {
          alert("Error deleting post: " + delErr.message);
        } else {
          await loadPosts();
        }
      });
    });
  }
}

// ---- small helper ----
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => (
    { "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]
  ));
}

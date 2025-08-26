  // ✅ Connect to Supabase
const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_KEY";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";

const postsContainer = document.getElementById("posts");
const addPostBtn = document.getElementById("add-post-btn");
const modal = document.getElementById("add-post-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const savePostBtn = document.getElementById("save-post-btn");
const logoutBtn = document.getElementById("logout-btn");
const darkModeToggle = document.getElementById("dark-mode-toggle");

// -----------------------------
// Check current user
// -----------------------------
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Admin check
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
  await supabase.auth.signOut();
  window.location.href = "index.html";
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
addPostBtn.addEventListener("click", () => (modal.style.display = "block"));
closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));

// -----------------------------
// Save new post (Admin only)
// -----------------------------
savePostBtn.addEventListener("click", async () => {
  const text = document.getElementById("post-text").value;
  const file = document.getElementById("post-image").files[0];

  let imageUrl = null;
  if (file) {
    const { data, error } = await supabase.storage
      .from("posts")
      .upload(`images/${Date.now()}_${file.name}`, file);

    if (error) {
      alert("Error uploading image");
      return;
    }
    imageUrl = `${supabaseUrl}/storage/v1/object/public/posts/${data.path}`;
  }

  await supabase.from("posts").insert([{ content: text, image_url: imageUrl }]);
  modal.style.display = "none";
  document.getElementById("post-text").value = "";
  document.getElementById("post-image").value = "";
  loadPosts();
});

// -----------------------------
// Load posts
// -----------------------------
async function loadPosts() {
  postsContainer.innerHTML = "";
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, content, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading posts:", error);
    return;
  }

  posts.forEach((post) => {
    renderPost(post);
  });
}

// -----------------------------
// Render a single post
// -----------------------------
async function renderPost(post) {
  const postDiv = document.createElement("div");
  postDiv.classList.add("post");

  postDiv.innerHTML = `
    <p>${post.content}</p>
    ${post.image_url ? `<img src="${post.image_url}" alt="Post Image" />` : ""}
    <button class="like-btn">❤️ Like</button>
    <span class="like-count">0</span>
    <div class="comments"></div>
    <input type="text" class="comment-input" placeholder="Write a comment..." />
    <button class="comment-btn">Comment</button>
    <div class="admin-actions" style="display:none;">
      <button class="delete-btn">🗑️ Delete</button>
    </div>
  `;

  // Likes
  const likeBtn = postDiv.querySelector(".like-btn");
  const likeCount = postDiv.querySelector(".like-count");
  likeBtn.addEventListener("click", async () => {
    await supabase.from("likes").insert([{ post_id: post.id }]);
    updateLikes(post.id, likeCount);
  });
  updateLikes(post.id, likeCount);

  // Comments
  const commentBtn = postDiv.querySelector(".comment-btn");
  const commentInput = postDiv.querySelector(".comment-input");
  const commentsDiv = postDiv.querySelector(".comments");

  commentBtn.addEventListener("click", async () => {
    const text = commentInput.value.trim();
    if (!text) return;
    await supabase.from("comments").insert([{ post_id: post.id, text }]);
    commentInput.value = "";
    loadComments(post.id, commentsDiv);
  });
  loadComments(post.id, commentsDiv);

  // Admin delete
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.email === ADMIN_EMAIL) {
    postDiv.querySelector(".admin-actions").style.display = "block";
    postDiv.querySelector(".delete-btn").addEventListener("click", async () => {
      await supabase.from("posts").delete().eq("id", post.id);
      loadPosts();
    });
  }

  postsContainer.appendChild(postDiv);
}

// -----------------------------
// Update likes
// -----------------------------
async function updateLikes(postId, likeCountEl) {
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  likeCountEl.textContent = count;
}

// -----------------------------
// Load comments
// -----------------------------
async function loadComments(postId, container) {
  container.innerHTML = "";
  const { data: comments } = await supabase
    .from("comments")
    .select("text, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  comments.forEach((c) => {
    const div = document.createElement("div");
    div.textContent = c.text;
    container.appendChild(div);
  });
}

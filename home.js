// Check session on load
supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    window.location.href = "index.html";
  } else {
    loadPosts();
    showAdminControls(session.user.email);
    subscribeToChanges();
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

// Add Post (Admin only)
document.getElementById("add-post-btn")?.addEventListener("click", async () => {
  const text = document.getElementById("post-text").value;
  const file = document.getElementById("post-image").files[0];
  let imageUrl = "";

  if (file) {
    const { data, error } = await supabase
      .storage
      .from("Images")
      .upload(`posts/${Date.now()}-${file.name}`, file);

    if (error) {
      alert("Image upload failed: " + error.message);
      return;
    }
    const { data: urlData } = supabase.storage.from("Images").getPublicUrl(data.path);
    imageUrl = urlData.publicUrl;
  }

  const { error: insertError } = await supabase.from("posts").insert([
    { text, image_url: imageUrl, author: "admin" }
  ]);

  if (insertError) alert("Error adding post: " + insertError.message);
  else {
    document.getElementById("post-text").value = "";
    document.getElementById("post-image").value = "";
  }
});

// Load Posts
async function loadPosts() {
  const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (error) return console.error(error);

  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  data.forEach((post) => renderPost(post));
}

// Render single post
function renderPost(post) {
  const container = document.getElementById("posts-container");
  const div = document.createElement("div");
  div.classList.add("post");

  div.innerHTML = `
    <p>${post.text}</p>
    ${post.image_url ? `<img src="${post.image_url}" alt="post image" />` : ""}
    <div class="actions">
      <button class="like-btn" data-id="${post.id}">❤️ Like</button>
      <span id="like-count-${post.id}">0</span>
    </div>
    <div class="comments">
      <input type="text" placeholder="Write a comment..." class="comment-input" data-id="${post.id}">
      <button class="comment-btn" data-id="${post.id}">Comment</button>
      <div id="comments-${post.id}"></div>
    </div>
    ${post.author === "admin" ? `<button class="delete-btn" data-id="${post.id}">Delete</button>` : ""}
  `;

  container.appendChild(div);

  loadLikes(post.id);
  loadComments(post.id);

  div.querySelector(".like-btn").addEventListener("click", () => toggleLike(post.id));
  div.querySelector(".comment-btn").addEventListener("click", () => addComment(post.id));
  div.querySelector(".delete-btn")?.addEventListener("click", () => deletePost(post.id));
}

// Like/Unlike
async function toggleLike(postId) {
  const user = (await supabase.auth.getUser()).data.user;
  const email = user.email;

  const { data } = await supabase.from("likes").select("*").eq("post_id", postId).eq("user_email", email);

  if (data.length > 0) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("user_email", email);
  } else {
    await supabase.from("likes").insert([{ post_id: postId, user_email: email }]);
  }
}

// Load Likes
async function loadLikes(postId) {
  const { count } = await supabase.from("likes").select("*", { count: "exact" }).eq("post_id", postId);
  document.getElementById(`like-count-${postId}`).innerText = count || 0;
}

// Add Comment
async function addComment(postId) {
  const input = document.querySelector(`.comment-input[data-id="${postId}"]`);
  const text = input.value;
  const user = (await supabase.auth.getUser()).data.user;

  if (text.trim() === "") return;

  await supabase.from("comments").insert([{ post_id: postId, text, author: user.email }]);
  input.value = "";
}

// Load Comments
async function loadComments(postId) {
  const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at");
  const container = document.getElementById(`comments-${postId}`);
  container.innerHTML = "";
  data.forEach((c) => {
    const p = document.createElement("p");
    p.textContent = `${c.author}: ${c.text}`;
    container.appendChild(p);
  });
}

// Delete Post (admin only)
async function deletePost(id) {
  await supabase.from("posts").delete().eq("id", id);
}

// Realtime Subscriptions
function subscribeToChanges() {
  supabase.channel("realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadPosts)
    .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, loadPosts)
    .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, loadPosts)
    .subscribe();
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

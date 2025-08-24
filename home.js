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
  }
}

// Add Post
document.getElementById("add-post-btn")?.addEventListener("click", async () => {
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
      <div class="likes-comments">
        <button class="like-btn" data-id="${post.id}">❤️ Like</button>
        <span id="like-count-${post.id}">0</span>
        <div class="comments">
          <input type="text" placeholder="Add a comment..." data-id="${post.id}" class="comment-input">
          <button class="comment-btn" data-id="${post.id}">Comment</button>
          <div id="comments-${post.id}"></div>
        </div>
      </div>
    `;
    container.appendChild(div);

    loadLikes(post.id);
    loadComments(post.id);
  });

  // Like events
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleLike(btn.dataset.id));
  });

  // Comment events
  document.querySelectorAll(".comment-btn").forEach((btn) => {
    btn.addEventListener("click", () => addComment(btn.dataset.id));
  });
}

// Toggle Like
async function toggleLike(postId) {
  const user = (await supabase.auth.getUser()).data.user;
  const email = user.email;

  const { data: existing } = await supabase.from("likes").select("*").eq("post_id", postId).eq("user_email", email);

  if (existing.length > 0) {
    await supabase.from("likes").delete().eq("id", existing[0].id);
  } else {
    await supabase.from("likes").insert([{ post_id: postId, user_email: email }]);
  }
  loadLikes(postId);
}

// Load Likes
async function loadLikes(postId) {
  const { data } = await supabase.from("likes").select("*").eq("post_id", postId);
  document.getElementById(`like-count-${postId}`).innerText = data.length;
}

// Add Comment
async function addComment(postId) {
  const input = document.querySelector(`.comment-input[data-id='${postId}']`);
  const text = input.value;
  const user = (await supabase.auth.getUser()).data.user;

  if (!text) return;

  await supabase.from("comments").insert([{ post_id: postId, author: user.email, text }]);
  input.value = "";
  loadComments(postId);
}

// Load Comments
async function loadComments(postId) {
  const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });

  const container = document.getElementById(`comments-${postId}`);
  container.innerHTML = "";
  data.forEach((comment) => {
    const div = document.createElement("div");
    div.classList.add("comment");
    div.innerHTML = `<p><b>${comment.author}:</b> ${comment.text}</p>`;
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

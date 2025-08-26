  // ----- ROLE CONTROL -----
let isAdmin = localStorage.getItem("isAdmin") === "true";

// ----- Elements -----
const addBtn = document.getElementById("addBtn");
const addModal = document.getElementById("addModal");
const postsContainer = document.getElementById("posts");

// Show admin features
if (isAdmin) {
  document.querySelectorAll(".admin-only").forEach(el => (el.style.display = "block"));
}

// ----- Sidebar -----
document.querySelector(".menu-btn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("active");
});

// ----- Theme Toggle -----
document.querySelector(".theme-btn").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// ----- Add Post -----
addBtn.addEventListener("click", () => {
  addModal.style.display = "flex";
});

function closeModal() {
  addModal.style.display = "none";
}

async function savePost() {
  const text = document.getElementById("postText").value;
  const file = document.getElementById("postImage").files[0];
  let imgURL = "";

  if (file) {
    const reader = new FileReader();
    reader.onload = async function (e) {
      imgURL = e.target.result;

      // ✅ Insert post into Supabase
      const { error } = await supabase.from("posts").insert([
        { text: text, image_url: imgURL, likes: 0 }
      ]);

      if (error) {
        alert("Error adding post: " + error.message);
      } else {
        loadPosts(); // refresh posts list
      }
    };
    reader.readAsDataURL(file);
  } else {
    // ✅ Insert post into Supabase (text only)
    const { error } = await supabase.from("posts").insert([
      { text: text, image_url: null, likes: 0 }
    ]);

    if (error) {
      alert("Error adding post: " + error.message);
    } else {
      loadPosts();
    }
  }

  document.getElementById("postText").value = "";
  document.getElementById("postImage").value = "";
  closeModal();
}

// ----- Load Posts -----
async function loadPosts() {
  postsContainer.innerHTML = ""; // clear old

  const { data, error } = await supabase.from("posts").select("*").order("id", { ascending: false });

  if (error) {
    console.error("Error loading posts:", error.message);
    return;
  }

  data.forEach(postData => {
    createPost(postData);
  });
}

// ----- Create Post (with Supabase data) -----
function createPost(postData) {
  const post = document.createElement("div");
  post.className = "post";

  let content = `<p>${postData.text || ""}</p>`;
  if (postData.image_url) {
    content += `<img src="${postData.image_url}" alt="Post Image">`;
  }

  content += `
    <div class="actions">
      <button class="likeBtn">❤️ <span>${postData.likes || 0}</span></button>
      <button class="commentBtn">💬</button>
      <button class="deleteBtn admin-only">Delete</button>
    </div>
    <div class="comments"></div>
  `;

  post.innerHTML = content;
  postsContainer.appendChild(post);

  // Show admin controls if admin
  if (isAdmin) {
    post.querySelectorAll(".admin-only").forEach(el => (el.style.display = "inline-block"));
  }

  // Like button → update in Supabase
  post.querySelector(".likeBtn").addEventListener("click", async (e) => {
    const span = e.target.querySelector("span");
    const newLikes = parseInt(span.textContent) + 1;
    span.textContent = newLikes;

    await supabase.from("posts").update({ likes: newLikes }).eq("id", postData.id);
  });

  // Comment button → insert into Supabase comments table
  post.querySelector(".commentBtn").addEventListener("click", async () => {
    const comment = prompt("Enter your comment:");
    if (comment) {
      const div = post.querySelector(".comments");
      const p = document.createElement("p");
      p.textContent = comment;
      div.appendChild(p);

      await supabase.from("comments").insert([
        { post_id: postData.id, text: comment }
      ]);
    }
  });

  // Load existing comments
  loadComments(postData.id, post.querySelector(".comments"));

  // Delete button (admin only)
  const delBtn = post.querySelector(".deleteBtn");
  delBtn.addEventListener("click", async () => {
    if (confirm("Delete this post?")) {
      await supabase.from("posts").delete().eq("id", postData.id);
      post.remove();
    }
  });
}

// ----- Load Comments -----
async function loadComments(postId, commentsContainer) {
  const { data, error } = await supabase.from("comments").select("*").eq("post_id", postId);
  if (error) return console.error("Error loading comments:", error.message);

  data.forEach(c => {
    const p = document.createElement("p");
    p.textContent = c.text;
    commentsContainer.appendChild(p);
  });
}

// ----- Initial Load -----
loadPosts();

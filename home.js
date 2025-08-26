// ----- ROLE CONTROL -----
// ✅ Reads admin flag set in app.js during login/signup
let isAdmin = localStorage.getItem("isAdmin") === "true";

// ----- Elements -----
const addBtn = document.getElementById("addBtn");
const addModal = document.getElementById("addModal");
const postsContainer = document.getElementById("posts");

// Show admin features that exist on initial load (like the + button)
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

function savePost() {
  const text = document.getElementById("postText").value;
  const file = document.getElementById("postImage").files[0];
  let imgURL = "";

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imgURL = e.target.result;
      createPost(text, imgURL);
    };
    reader.readAsDataURL(file);
  } else {
    createPost(text, imgURL);
  }

  document.getElementById("postText").value = "";
  document.getElementById("postImage").value = "";
  closeModal();
}

// ----- Create Post -----
// ✅ Delete button is now always rendered but hidden with .admin-only (like the + button)
function createPost(text, imgURL) {
  const post = document.createElement("div");
  post.className = "post";

  let content = `<p>${text}</p>`;
  if (imgURL) {
    content += `<img src="${imgURL}" alt="Post Image">`;
  }

  content += `
    <div class="actions">
      <button class="likeBtn">❤️ <span>0</span></button>
      <button class="commentBtn">💬</button>
      <button class="deleteBtn admin-only">Delete</button> <!-- ✅ always present, hidden for non-admin -->
    </div>
    <div class="comments"></div>
  `;

  post.innerHTML = content;
  postsContainer.prepend(post);

  // ✅ If admin, reveal admin-only controls inside THIS newly created post
  if (isAdmin) {
    post.querySelectorAll(".admin-only").forEach(el => (el.style.display = "inline-block"));
  }

  // Like button
  post.querySelector(".likeBtn").addEventListener("click", (e) => {
    const span = e.target.querySelector("span");
    span.textContent = parseInt(span.textContent) + 1;
  });

  // Comment button
  post.querySelector(".commentBtn").addEventListener("click", () => {
    const comment = prompt("Enter your comment:");
    if (comment) {
      const div = post.querySelector(".comments");
      const p = document.createElement("p");
      p.textContent = comment;
      div.appendChild(p);
    }
  });

  // ✅ Delete button (listener attached either way; button is hidden for non-admin)
  const delBtn = post.querySelector(".deleteBtn");
  delBtn.addEventListener("click", () => {
    post.remove();
  });
      }

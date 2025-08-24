// app.js
// Utility selector
function $(id) {
  return document.getElementById(id);
}

// ---------------- INDEX PAGE (Login / Signup) ----------------
(function initIndexPage() {
  const emailInput = $("email");
  const passInput = $("password");
  const loginBtn = $("login-btn");
  const signupBtn = $("signup-btn");
  const errMsg = $("error-msg");

  if (!emailInput || !passInput) return; // Not on login page

  // If already logged in, go to home
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      window.location.href = "home.html";
    }
  });

  function showError(msg) {
    if (errMsg) errMsg.textContent = msg;
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const password = passInput.value;
      if (!email || !password) {
        showError("Please enter email and password.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        showError(error.message);
        return;
      }
      window.location.href = "home.html";
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const email = emailInput.value.trim();
      const password = passInput.value;
      if (!email || !password) {
        showError("Please enter email and password.");
        return;
      }

      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        showError(error.message);
        return;
      }
      // Auto login after signup
      await supabase.auth.signInWithPassword({ email, password });
      window.location.href = "home.html";
    });
  }
})();

// ---------------- HOME PAGE ----------------
(function initHomePage() {
  const logoutBtn = $("logout-btn");
  const menuBtn = $("menu-btn");
  const sideMenu = $("side-menu");
  const darkToggle = $("dark-mode-toggle");
  const postsContainer = $("posts-container");
  const addPostBtn = $("add-post-btn");
  const deletePostBtn = $("delete-post-btn");
  const postText = $("post-text");
  const postImage = $("post-image");
  const adminControls = $("admin-controls");

  if (!postsContainer) return; // Not on home page

  let currentUser = null;
  const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";

  // Check current session
  supabase.auth.getUser().then(({ data }) => {
    currentUser = data.user;

    if (!currentUser) {
      window.location.href = "index.html";
      return;
    }

    if (currentUser.email === ADMIN_EMAIL) {
      adminControls.classList.remove("hidden");
    }
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // Hamburger menu
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      sideMenu.classList.toggle("hidden");
    });
  }

  // Dark mode toggle
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      document.body.classList.toggle("light");
    });
  }

  // Fetch posts
  async function loadPosts() {
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      return;
    }

    postsContainer.innerHTML = "";
    data.forEach((post) => {
      const div = document.createElement("div");
      div.className = "post";

      let content = `<p>${post.text || ""}</p>`;
      if (post.image_url) {
        content += `<img src="${post.image_url}" alt="post image">`;
      }

      div.innerHTML = content;
      postsContainer.appendChild(div);
    });
  }
  loadPosts();

  // Add Post (admin only)
  if (addPostBtn) {
    addPostBtn.addEventListener("click", async () => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;

      const text = postText.value.trim();
      let imageUrl = null;

      if (postImage.files.length > 0) {
        const file = postImage.files[0];
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from("images").upload(fileName, file);
        if (error) {
          alert("Upload failed: " + error.message);
          return;
        }
        imageUrl = `${supabaseUrl}/storage/v1/object/public/images/${fileName}`;
      }

      const { error } = await supabase.from("posts").insert([{ text, image_url: imageUrl }]);
      if (error) {
        alert("Error adding post: " + error.message);
        return;
      }

      postText.value = "";
      postImage.value = "";
      loadPosts();
    });
  }

  // Delete Last Post (admin only)
  if (deletePostBtn) {
    deletePostBtn.addEventListener("click", async () => {
      if (!currentUser || currentUser.email !== ADMIN_EMAIL) return;

      const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(1);
      if (error || data.length === 0) return;

      const lastPost = data[0];
      await supabase.from("posts").delete().eq("id", lastPost.id);
      loadPosts();
    });
  }
})();

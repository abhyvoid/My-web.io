// app.js
// Works for BOTH pages (index.html & home.html) without changing your layout.
// Requires: supabase.js to have `window.supabase` client already created.
// Admin email:
const ADMIN_EMAIL = "abhayrangappanvat@gmail.com";

// ---------- Helpers ----------
function $(id) { return document.getElementById(id); }
function show(el) { if (el) el.classList.remove("hidden"); }
function hide(el) { if (el) el.classList.add("hidden"); }
function isAdminEmail(email) { return email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase(); }
function setBtnEnabled(el, enabled) { if (el) el.disabled = !enabled; }

// ---------- Auth state (shared) ----------
async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user || null;
}

// Persist theme
(function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") document.body.classList.add("dark");
})();

// ---------- INDEX PAGE (login/signup) ----------
(function initIndexPage() {
  const emailInput = $("email");
  const passInput  = $("password");
  const loginBtn   = $("login-btn");
  const signupBtn  = $("signup-btn");
  const errMsg     = $("error-msg");

  if (!loginBtn && !signupBtn) return; // Not on index.html

  async function routeIfLoggedIn() {
    const user = await getCurrentUser();
    if (user) {
      window.location.href = "home.html";
    }
  }

  // If already logged in, go straight to home
  routeIfLoggedIn();

  function setBusy(b) {
    setBtnEnabled(loginBtn, !b);
    setBtnEnabled(signupBtn, !b);
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      if (!emailInput || !passInput) return;
      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) {
        if (errMsg) errMsg.textContent = "Please enter email and password.";
        return;
      }

      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);

      if (error) {
        if (errMsg) errMsg.textContent = error.message;
        return;
      }
      window.location.href = "home.html";
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      if (!emailInput || !passInput) return;
      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) {
        if (errMsg) errMsg.textContent = "Please enter email and password.";
        return;
      }

      setBusy(true);
      const { error } = await supabase.auth.signUp({ email, password });
      setBusy(false);

      if (error) {
        if (errMsg) errMsg.textContent = error.message;
        return;
      }
      // After sign up, user may need to verify email depending on Supabase settings.
      // Try to log in right away for your flow:
      const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr) {
        if (errMsg) errMsg.textContent = "Signed up. Please verify your email, then log in.";
        return;
      }
      window.location.href = "home.html";
    });
  }
})();

// ---------- HOME PAGE ----------
(function initHomePage() {
  const menuBtn        = $("menu-btn");
  const sideMenu       = $("side-menu");
  const logoutBtn      = $("logout-btn");
  const darkToggle     = $("dark-mode-toggle");

  const postsContainer = $("posts-container");

  const addFab         = $("add-post-toggle");   // the circular + button (admin-only)
  const adminPanel     = $("admin-controls");    // hidden editor panel
  const postText       = $("post-text");
  const postImage      = $("post-image");
  const addPostBtn     = $("add-post-btn");
  const deletePostBtn  = $("delete-post-btn");

  // If these elements don't exist, we're not on home.html
  if (!postsContainer) return;

  // Redirect to login if not signed in
  async function guard() {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = "index.html";
      return null;
    }
    return user;
  }

  // Menu toggle
  if (menuBtn && sideMenu) {
    menuBtn.addEventListener("click", () => {
      sideMenu.classList.toggle("hidden");
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // Dark mode
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const mode = document.body.classList.contains("dark") ? "dark" : "light";
      localStorage.setItem("theme", mode);
    });
  }

  // Load posts
  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading posts:", error.message);
      return;
    }

    postsContainer.innerHTML = "";
    (data || []).forEach(p => {
      const card = document.createElement("div");
      card.className = "post-card";

      if (p.image_url) {
        const img = document.createElement("img");
        img.src = p.image_url;
        img.alt = "post image";
        img.className = "post-image";
        card.appendChild(img);
      }

      if (p.text) {
        const t = document.createElement("p");
        t.className = "post-text";
        t.textContent = p.text;
        card.appendChild(t);
      }

      const meta = document.createElement("div");
      meta.className = "post-meta";
      const when = p.created_at ? new Date(p.created_at).toLocaleString() : "";
      meta.textContent = when;
      card.appendChild(meta);

      postsContainer.appendChild(card);
    });
  }

  // Realtime updates
  function subscribeRealtime() {
    supabase
      .channel("posts-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => loadPosts()
      )
      .subscribe();
  }

  // Admin gating
  async function setupAdminUI() {
    const user = await guard();
    if (!user) return;

    const admin = isAdminEmail(user.email);

    // Only admin sees +
    if (addFab) admin ? show(addFab) : hide(addFab);

    // Ensure editor is hidden initially
    if (adminPanel) hide(adminPanel);

    // + toggles editor panel
    if (addFab && adminPanel) {
      addFab.addEventListener("click", () => {
        adminPanel.classList.toggle("hidden");
      });
    }

    // Add Post (admin only)
    if (addPostBtn) {
      addPostBtn.addEventListener("click", async () => {
        if (!isAdminEmail((await getCurrentUser())?.email)) return;

        const text = (postText && postText.value.trim()) || "";
        let image_url = null;

        // If there is an image file, upload to storage 'images' bucket
        if (postImage && postImage.files && postImage.files[0]) {
          const file = postImage.files[0];
          const filename = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
          const path = `uploads/${filename}`;

          const { error: upErr } = await supabase.storage
            .from("images")
            .upload(path, file, { upsert: false });

          if (upErr) {
            alert("Image upload failed: " + upErr.message);
            return;
          }

          const { data: pub } = supabase.storage.from("images").getPublicUrl(path);
          image_url = pub?.publicUrl || null;
        }

        const { error: insertErr } = await supabase
          .from("posts")
          .insert([{ text, image_url }]);

        if (insertErr) {
          alert("Error adding post: " + insertErr.message);
          return;
        }

        // Reset editor
        if (postText) postText.value = "";
        if (postImage) postImage.value = "";
        if (adminPanel) hide(adminPanel);
      });
    }

    // Delete last post (admin only)
    if (deletePostBtn) {
      deletePostBtn.addEventListener("click", async () => {
        if (!isAdminEmail((await getCurrentUser())?.email)) return;

        // Get latest post
        const { data, error } = await supabase
          .from("posts")
          .select("id, image_url")
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          alert("Error fetching posts: " + error.message);
          return;
        }

        if (!data || data.length === 0) {
          alert("No posts to delete.");
          return;
        }

        const post = data[0];

        // Delete DB row
        const { error: delErr } = await supabase
          .from("posts")
          .delete()
          .eq("id", post.id);

        if (delErr) {
          alert("Error deleting post: " + delErr.message);
          return;
        }

        // Optionally delete image file (only if stored in our bucket)
        if (post.image_url) {
          try {
            // Extract path after /object/public/images/
            const m = post.image_url.match(/\/object\/public\/images\/(.+)$/);
            if (m && m[1]) {
              await supabase.storage.from("images").remove([m[1]]);
            }
          } catch (_) {
            // ignore if parsing fails
          }
        }

        alert("Last post deleted.");
      });
    }
  }

  // Initialize
  (async function run() {
    const user = await guard();
    if (!user) return;

    // Ensure non-admin cannot see editor pieces
    if (!isAdminEmail(user.email)) {
      hide(addFab);
      hide(adminPanel);
    }

    await loadPosts();
    subscribeRealtime();
    await setupAdminUI();
  })();
})();

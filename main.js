  // ---------- SIDEBAR LOGIC (clean toggle) ----------
  const hamburger = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlayBlur");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const backToTopLink = document.getElementById("backToTopLink");

  function openSidebar() {
    sidebar.classList.add("open");
    overlay.classList.add("active");
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  }

  if (hamburger) hamburger.addEventListener("click", openSidebar);
  if (closeSidebarBtn) closeSidebarBtn.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  // Back to top smooth scroll (for sidebar link)
  if (backToTopLink) {
    backToTopLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      closeSidebar();
    });
  }

  // Optional: Close sidebar when any level link is clicked (for better mobile UX)
  const allLevelLinks = document.querySelectorAll('.level-link, .sidebar nav a');
  allLevelLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Only close sidebar if the link is inside sidebar or we want to close on navigation
      if (sidebar.classList.contains('open')) {
        // small delay to allow navigation, but it's fine.
        closeSidebar();
      }
    });
  });
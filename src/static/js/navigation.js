(function () {
  function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
  }

  document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) {
      menuToggle.addEventListener("click", toggleSidebar);
    }

    const submenus = document.querySelectorAll(".submenu-toggle");
    submenus.forEach((btn) => {
      btn.addEventListener("click", () => {
        const submenu = btn.nextElementSibling;
        if (submenu) submenu.classList.toggle("hidden");
      });
    });
  });
})();

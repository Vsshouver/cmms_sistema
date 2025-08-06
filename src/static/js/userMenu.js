(function () {
  let isOpen = false;

  function toggleUserMenu() {
    const dropdown = document.getElementById("user-dropdown");
    if (dropdown) {
      isOpen = !isOpen;
      dropdown.style.display = isOpen ? "block" : "none";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const userBtn = document.getElementById("user-btn");
    if (userBtn) {
      userBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleUserMenu();
      });
    }

    document.addEventListener("click", function () {
      if (isOpen) {
        toggleUserMenu();
      }
    });
  });
})();

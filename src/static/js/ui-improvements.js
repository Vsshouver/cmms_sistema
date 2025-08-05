
document.addEventListener("DOMContentLoaded", function () {
    // Sidebar toggle
    const toggleSidebarBtn = document.getElementById("toggle-sidebar");
    const sidebar = document.getElementById("sidebar");
    const content = document.getElementById("main-content");

    if (toggleSidebarBtn && sidebar && content) {
        toggleSidebarBtn.addEventListener("click", () => {
            sidebar.classList.toggle("w-16");
            sidebar.classList.toggle("w-64");
            content.classList.toggle("ml-16");
            content.classList.toggle("ml-64");
        });
    }

    // Dropdown de usuário
    const userBtn = document.getElementById("user-menu-btn");
    const userDropdown = document.getElementById("user-dropdown");

    if (userBtn && userDropdown) {
        userBtn.addEventListener("click", () => {
            userDropdown.classList.toggle("hidden");
        });

        // Fechar dropdown se clicar fora
        document.addEventListener("click", (event) => {
            if (!userBtn.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.add("hidden");
            }
        });
    }

    // Submenus
    document.querySelectorAll(".submenu-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const target = document.getElementById(button.dataset.target);
            if (target) {
                target.classList.toggle("hidden");
            }
        });
    });
});

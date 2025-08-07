class NavigationManager {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.container = document.getElementById('main-content');
    this.menuToggle = document.getElementById('menu-toggle');

    this.pages = {
      'dashboard': window.DashboardPage,
      'ordens-servico': window.WorkOrdersPage,
      'preventivas': window.PreventivasPage,
      'backlog': window.BacklogPage,
      'equipamentos': window.EquipmentsPage,
      'estoque': window.InventoryPage,
      'pneus': window.TiresPage,
      'mecanicos': window.MechanicsPage,
      'usuarios': window.UsersPage,
      'tipos-equipamento': window.EquipmentTypesPage,
      'tipos-manutencao': window.MaintenanceTypesPage,
      'grupos-item': window.ItemGroupsPage,
      'movimentacoes': window.MovementsPage,
      'analise-oleo': window.OilAnalysisPage,
      'importacao': window.ImportPage
    };

    this.init();
  }

  init() {
    this.setupSidebarToggle();
    this.setupNavGroups();
    this.setupNavLinks();

    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink && activeLink.dataset.page) {
      this.navigateTo(activeLink.dataset.page);
    }
  }

  setupSidebarToggle() {
    if (this.menuToggle) {
      this.menuToggle.addEventListener('click', () => {
        if (this.sidebar) {
          this.sidebar.classList.toggle('collapsed');
        }
      });
    }
  }

  setupNavGroups() {
    const headers = document.querySelectorAll('.nav-group-header');
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const group = header.parentElement;
        if (group) {
          group.classList.toggle('expanded');
        }
      });
    });
  }

  setupNavLinks() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.addEventListener('click', evt => {
        evt.preventDefault();
        const page = link.dataset.page;
        if (page) {
          this.navigateTo(page);
        }
      });
    });
  }

  setActiveLink(link) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (link) {
      link.classList.add('active');
    }
  }

  async navigateTo(page) {
    if (!this.container) return;

    const PageClass = this.pages[page];
    if (!PageClass) {
      console.warn(`Página desconhecida: ${page}`);
      this.container.innerHTML = '<p>Página não encontrada.</p>';
      return;
    }

    try {
      const instance = new PageClass();
      await instance.render(this.container);
      this.currentPage = page;
      this.setActiveLink(document.querySelector(`[data-page="${page}"]`));
    } catch (err) {
      console.error('Erro ao carregar página:', page, err);
      this.container.innerHTML = '<p>Erro ao carregar página.</p>';
    }
  }
}

window.NavigationManager = NavigationManager;

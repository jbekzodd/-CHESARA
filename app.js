/* =========================================================
   CHESARA — FRONTEND APPLICATION
   ========================================================= */

const CHESARA = {

  state: {
    currentPage: "dashboard",
    user: {
      name: "Administrator",
      role: "Super Admin",
      initials: "SA"
    },

    dashboard: null,

    pages: [
      "dashboard",
      "students",
      "teachers",
      "groups",
      "attendance",
      "lessons",
      "analysis",
      "tournaments",
      "news",
      "reports",
      "alerts",
      "settings"
    ]
  },

  /* =======================================================
     INIT
  ======================================================= */

  async init() {

    console.log("♟ CHESARA frontend ishga tushdi.");

    this.setupNavigation();
    this.setupMobileNavigation();
    this.setupGlobalButtons();

    await this.loadDashboard();

    this.handleRoute();

    window.addEventListener("popstate", () => {
      this.handleRoute();
    });

  },

  /* =======================================================
     API
  ======================================================= */

  async api(url, options = {}) {

    try {

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json"
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {

      console.error("CHESARA API ERROR:", error);

      this.showToast(
        "Server bilan bog‘lanishda muammo yuz berdi.",
        "error"
      );

      return null;
    }
  },

  /* =======================================================
     DASHBOARD
  ======================================================= */

  async loadDashboard() {

    const data = await this.api("/api/dashboard");

    if (!data) return;

    this.state.dashboard = data;

    this.updateDashboard();

  },

  updateDashboard() {

    const data = this.state.dashboard;

    if (!data) return;

    this.setText(
      "[data-stat='students']",
      data.students
    );

    this.setText(
      "[data-stat='teachers']",
      data.teachers
    );

    this.setText(
      "[data-stat='groups']",
      data.groups
    );

    this.setText(
      "[data-stat='alerts']",
      data.alerts
    );

    this.setText(
      "[data-stat='present']",
      data.attendance?.present ?? 0
    );

    this.setText(
      "[data-stat='absent']",
      data.attendance?.absent ?? 0
    );

    this.setText(
      "[data-stat='late']",
      data.attendance?.late ?? 0
    );

  },

  /* =======================================================
     NAVIGATION
  ======================================================= */

  setupNavigation() {

    document.addEventListener("click", (event) => {

      const link = event.target.closest(
        "[data-page]"
      );

      if (!link) return;

      event.preventDefault();

      const page = link.dataset.page;

      if (!this.state.pages.includes(page)) {
        console.warn(
          "CHESARA: noma’lum page:",
          page
        );
        return;
      }

      this.navigate(page);

    });

  },

  navigate(page) {

    if (!this.state.pages.includes(page)) {
      return;
    }

    this.state.currentPage = page;

    const url =
      page === "dashboard"
        ? "/"
        : `/?page=${page}`;

    history.pushState(
      { page },
      "",
      url
    );

    this.renderPage(page);

    this.updateActiveNavigation(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  },

  handleRoute() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const page =
      params.get("page") || "dashboard";

    this.state.currentPage =
      this.state.pages.includes(page)
        ? page
        : "dashboard";

    this.renderPage(
      this.state.currentPage
    );

    this.updateActiveNavigation(
      this.state.currentPage
    );

  },

  /* =======================================================
     PAGE RENDERING
  ======================================================= */

  renderPage(page) {

    const pageTitle =
      document.querySelector(
        "[data-page-title]"
      );

    if (pageTitle) {

      pageTitle.textContent =
        this.getPageTitle(page);

    }

    document
      .querySelectorAll("[data-page-view]")
      .forEach((element) => {

        element.classList.remove("active");

        if (
          element.dataset.pageView === page
        ) {
          element.classList.add("active");
        }

      });

    this.updatePageContent(page);

  },

  getPageTitle(page) {

    const titles = {

      dashboard: "Boshqaruv paneli",

      students:
        "O‘quvchilar",

      teachers:
        "Ustozlar",

      groups:
        "Guruhlar",

      attendance:
        "Davomat",

      lessons:
        "Darslar",

      analysis:
        "AI O‘yin tahlili",

      tournaments:
        "Turnirlar",

      news:
        "Shaxmat yangiliklari",

      reports:
        "Hisobotlar",

      alerts:
        "Ogohlantirishlar",

      settings:
        "Sozlamalar"

    };

    return titles[page] ||
      "CHESARA";
  },

  updatePageContent(page) {

    if (page === "analysis") {
      this.initAnalysisPage();
    }

    if (page === "attendance") {
      this.initAttendancePage();
    }

    if (page === "reports") {
      this.initReportsPage();
    }

    if (page === "alerts") {
      this.initAlertsPage();
    }

  },

  /* =======================================================
     ACTIVE NAVIGATION
  ======================================================= */

  updateActiveNavigation(page) {

    document
      .querySelectorAll(
        "[data-page]"
      )
      .forEach((element) => {

        element.classList.toggle(
          "active",
          element.dataset.page === page
        );

      });

  },

  /* =======================================================
     MOBILE
  ======================================================= */

  setupMobileNavigation() {

    const menuButton =
      document.querySelector(
        "[data-mobile-menu]"
      );

    const sidebar =
      document.querySelector(
        "[data-sidebar]"
      );

    const overlay =
      document.querySelector(
        "[data-sidebar-overlay]"
      );

    if (!menuButton || !sidebar) {
      return;
    }

    menuButton.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "mobile-open"
        );

        if (overlay) {

          overlay.classList.toggle(
            "visible"
          );

        }

        document.body.classList.toggle(
          "menu-open"
        );

      }
    );

    if (overlay) {

      overlay.addEventListener(
        "click",
        () => {

          sidebar.classList.remove(
            "mobile-open"
          );

          overlay.classList.remove(
            "visible"
          );

          document.body.classList.remove(
            "menu-open"
          );

        }
      );

    }

  },

  /* =======================================================
     GLOBAL BUTTONS
  ======================================================= */

  setupGlobalButtons() {

    document.addEventListener(
      "click",
      (event) => {

        const button =
          event.target.closest(
            "[data-action]"
          );

        if (!button) return;

        const action =
          button.dataset.action;

        switch (action) {

          case "refresh":
            this.loadDashboard();
            this.showToast(
              "Ma’lumotlar yangilanmoqda..."
            );
            break;

          case "open-analysis":
            this.navigate("analysis");
            break;

          case "open-reports":
            this.navigate("reports");
            break;

          case "open-attendance":
            this.navigate("attendance");
            break;

          case "logout":
            this.logout();
            break;

          default:
            console.warn(
              "Noma’lum action:",
              action
            );

        }

      }
    );

  },

  /* =======================================================
     AI ANALYSIS
  ======================================================= */

  initAnalysisPage() {

    const form =
      document.querySelector(
        "[data-analysis-form]"
      );

    if (!form || form.dataset.ready) {
      return;
    }

    form.dataset.ready = "true";

    form.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        const source =
          form.querySelector(
            "[name='source']"
          )?.value || "manual";

        const game =
          form.querySelector(
            "[name='game']"
          )?.value || "";

        const player =
          form.querySelector(
            "[name='player']"
          )?.value || "O‘yinchi";

        if (!game.trim()) {

          this.showToast(
            "Avval PGN yoki o‘yin ma’lumotlarini kiriting.",
            "error"
          );

          return;
        }

        this.showToast(
          "O‘yin CHESARA AI tahliliga yuborilmoqda..."
        );

        const result =
          await this.api(
            "/api/chess/analyze",
            {
              method: "POST",

              body: JSON.stringify({
                source,
                game,
                player
              })

            }
          );

        if (!result) return;

        this.renderAnalysisResult(
          result
        );

      }
    );

  },

  renderAnalysisResult(result) {

    const container =
      document.querySelector(
        "[data-analysis-result]"
      );

    if (!container) return;

    container.innerHTML = `

      <div class="chesara-analysis-result">

        <div class="analysis-status">
          <span class="status-dot"></span>

          <div>
            <strong>
              O‘yin qabul qilindi
            </strong>

            <small>
              CHESARA AI Intelligence
            </small>
          </div>
        </div>

        <div class="analysis-grid">

          <div class="analysis-card">
            <span>Accuracy</span>
            <strong>
              ${result.analysis?.accuracy ?? "—"}
            </strong>
          </div>

          <div class="analysis-card">
            <span>Blunders</span>
            <strong>
              ${result.analysis?.blunders ?? 0}
            </strong>
          </div>

          <div class="analysis-card">
            <span>Mistakes</span>
            <strong>
              ${result.analysis?.mistakes ?? 0}
            </strong>
          </div>

          <div class="analysis-card">
            <span>Opening</span>
            <strong>
              ${result.opening?.name ?? "—"}
            </strong>
          </div>

        </div>

        <div class="analysis-message">
          ${result.message || ""}
        </div>

      </div>

    `;

  },

  /* =======================================================
     ATTENDANCE
  ======================================================= */

  initAttendancePage() {

    document
      .querySelectorAll(
        "[data-attendance-action]"
      )
      .forEach((button) => {

        if (button.dataset.ready) {
          return;
        }

        button.dataset.ready = "true";

        button.addEventListener(
          "click",
          () => {

            const action =
              button.dataset.attendanceAction;

            this.showToast(
              `Davomat amali: ${action}`
            );

          }
        );

      });

  },

  /* =======================================================
     REPORTS
  ======================================================= */

  initReportsPage() {

    const button =
      document.querySelector(
        "[data-generate-report]"
      );

    if (!button || button.dataset.ready) {
      return;
    }

    button.dataset.ready = "true";

    button.addEventListener(
      "click",
      () => {

        this.showToast(
          "Hisobot shakllantirish moduli ishga tushirildi."
        );

      }
    );

  },

  /* =======================================================
     ALERTS
  ======================================================= */

  initAlertsPage() {

    const alerts =
      document.querySelectorAll(
        "[data-alert]"
      );

    alerts.forEach((alert) => {

      alert.addEventListener(
        "click",
        () => {

          alert.classList.toggle(
            "read"
          );

        }
      );

    });

  },

  /* =======================================================
     LOGOUT
  ======================================================= */

  logout() {

    localStorage.removeItem(
      "chesara_session"
    );

    this.showToast(
      "Sessiya yakunlandi."
    );

    setTimeout(() => {
      window.location.reload();
    }, 700);

  },

  /* =======================================================
     HELPERS
  ======================================================= */

  setText(selector, value) {

    const element =
      document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }

  },

  showToast(message, type = "success") {

    let container =
      document.querySelector(
        ".chesara-toast-container"
      );

    if (!container) {

      container =
        document.createElement("div");

      container.className =
        "chesara-toast-container";

      document.body.appendChild(
        container
      );

    }

    const toast =
      document.createElement("div");

    toast.className =
      `chesara-toast ${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {

      toast.classList.add(
        "hide"
      );

      setTimeout(() => {
        toast.remove();
      }, 300);

    }, 3000);

  }

};


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    CHESARA.init();
  }
);

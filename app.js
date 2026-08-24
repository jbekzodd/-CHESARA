/* =========================================================
   CHESARA — FRONTEND APPLICATION
   FULL VERSION
   Dashboard + Navigation + AI + Attendance + Reports
   + CHESARA ID + PASSPORT + 3-DOT ACTIONS
   ========================================================= */

const CHESARA = {

  /* =======================================================
     STATE
     ======================================================= */

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
      "settings",
      "passport"
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
    this.setupMoreMenus();
    this.setupPassportButtons();

    await this.loadDashboard();

    this.handleRoute();

    window.addEventListener(
      "popstate",
      () => this.handleRoute()
    );

  },

  /* =======================================================
     API
     ======================================================= */

  async api(url, options = {}) {

    try {

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (
        contentType.includes("application/json")
      ) {
        return await response.json();
      }

      return await response.text();

    } catch (error) {

      console.error(
        "CHESARA API ERROR:",
        error
      );

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

    const data =
      await this.api("/api/dashboard");

    if (!data) return;

    this.state.dashboard = data;

    this.updateDashboard();

  },

  updateDashboard() {

    const data =
      this.state.dashboard;

    if (!data) return;

    this.setText(
      "[data-stat='students']",
      data.students ?? 0
    );

    this.setText(
      "[data-stat='teachers']",
      data.teachers ?? 0
    );

    this.setText(
      "[data-stat='groups']",
      data.groups ?? 0
    );

    this.setText(
      "[data-stat='alerts']",
      data.alerts ?? 0
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

    document.addEventListener(
      "click",
      event => {

        const link =
          event.target.closest(
            "[data-page]"
          );

        if (!link) return;

        event.preventDefault();

        const page =
          link.dataset.page;

        if (
          !this.state.pages.includes(page)
        ) {

          console.warn(
            "CHESARA: noma’lum page:",
            page
          );

          return;
        }

        this.navigate(page);

      }
    );

  },

  navigate(page) {

    if (
      !this.state.pages.includes(page)
    ) {
      return;
    }

    this.state.currentPage =
      page;

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

    this.updateActiveNavigation(
      page
    );

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
      params.get("page") ||
      "dashboard";

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
     PAGE TITLES
     ======================================================= */

  getPageTitle(page) {

    const titles = {

      dashboard:
        "Boshqaruv paneli",

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
        "Sozlamalar",

      passport:
        "CHESARA Passport"

    };

    return (
      titles[page] ||
      "CHESARA"
    );

  },

  /* =======================================================
     PAGE RENDER
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
      .querySelectorAll(
        "[data-page-view]"
      )
      .forEach(element => {

        element.classList.remove(
          "active"
        );

        if (
          element.dataset.pageView ===
          page
        ) {

          element.classList.add(
            "active"
          );

        }

      });

    this.updatePageContent(page);

  },

  updatePageContent(page) {

    if (
      page === "analysis"
    ) {
      this.initAnalysisPage();
    }

    if (
      page === "attendance"
    ) {
      this.initAttendancePage();
    }

    if (
      page === "reports"
    ) {
      this.initReportsPage();
    }

    if (
      page === "alerts"
    ) {
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
      .forEach(element => {

        element.classList.toggle(
          "active",
          element.dataset.page === page
        );

      });

  },

  /* =======================================================
     MOBILE NAVIGATION
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

    if (
      !menuButton ||
      !sidebar
    ) {
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
      event => {

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

            this.navigate(
              "analysis"
            );

            break;

          case "open-reports":

            this.navigate(
              "reports"
            );

            break;

          case "open-attendance":

            this.navigate(
              "attendance"
            );

            break;

          case "passport":

            this.openPassport();

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

    if (
      !form ||
      form.dataset.ready
    ) {
      return;
    }

    form.dataset.ready =
      "true";

    form.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        const source =
          form.querySelector(
            "[name='source']"
          )?.value ||
          "manual";

        const game =
          form.querySelector(
            "[name='game']"
          )?.value ||
          "";

        const player =
          form.querySelector(
            "[name='player']"
          )?.value ||
          "O‘yinchi";

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
              ${
                result.analysis?.accuracy ??
                "—"
              }
            </strong>
          </div>

          <div class="analysis-card">
            <span>Blunders</span>
            <strong>
              ${
                result.analysis?.blunders ??
                0
              }
            </strong>
          </div>

          <div class="analysis-card">
            <span>Mistakes</span>
            <strong>
              ${
                result.analysis?.mistakes ??
                0
              }
            </strong>
          </div>

          <div class="analysis-card">
            <span>Opening</span>
            <strong>
              ${
                result.opening?.name ??
                "—"
              }
            </strong>
          </div>

        </div>

        <div class="analysis-message">
          ${
            result.message ||
            ""
          }
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
      .forEach(button => {

        if (
          button.dataset.ready
        ) {
          return;
        }

        button.dataset.ready =
          "true";

        button.addEventListener(
          "click",
          () => {

            const action =
              button.dataset
                .attendanceAction;

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

    if (
      !button ||
      button.dataset.ready
    ) {
      return;
    }

    button.dataset.ready =
      "true";

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

    alerts.forEach(alert => {

      if (
        alert.dataset.ready
      ) {
        return;
      }

      alert.dataset.ready =
        "true";

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
     CHESARA PASSPORT
     ======================================================= */

  setupPassportButtons() {

    document.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-chesara-action='passport']"
          );

        if (!button) return;

        event.preventDefault();

        this.openPassport();

      }
    );

  },

  openPassport(id = "") {

    const modal =
      document.createElement(
        "div"
      );

    modal.className =
      "chesara-modal-overlay";

    modal.innerHTML = `

      <div class="chesara-modal">

        <div class="chesara-modal-header">

          <div>

            <div class="chesara-modal-title">
              🪪 CHESARA PASSPORT
            </div>

            <div class="chesara-modal-subtitle">
              CHESARA ID orqali shaxsni tekshirish
            </div>

          </div>

          <button
            type="button"
            class="chesara-close"
            data-close
          >
            ×
          </button>

        </div>

        <div class="chesara-modal-body">

          <div class="chesara-form-group">

            <label>
              CHESARA ID
            </label>

            <input
              id="chesaraPassportId"
              type="text"
              placeholder="CH-000001"
              value="${this.escapeAttribute(id)}"
            >

          </div>

          <button
            type="button"
            class="chesara-primary-button"
            id="chesaraPassportSearch"
          >
            🔎 Tekshirish
          </button>

          <div
            id="chesaraPassportResult"
            style="margin-top:20px"
          ></div>

        </div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelectorAll(
        "[data-close]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => modal.remove()
        );

      });

    modal
      .querySelector(
        "#chesaraPassportSearch"
      )
      ?.addEventListener(
        "click",
        async () => {

          const input =
            modal.querySelector(
              "#chesaraPassportId"
            );

          const value =
            input?.value?.trim();

          if (!value) {

            this.showToast(
              "CHESARA ID kiriting.",
              "error"
            );

            return;
          }

          await this.searchPassport(
            value,
            modal.querySelector(
              "#chesaraPassportResult"
            )
          );

        }
      );

  },

  async searchPassport(
    id,
    container
  ) {

    if (!container) return;

    container.innerHTML = `
      <div class="chesara-loading">
        Tekshirilmoqda...
      </div>
    `;

    /*
      Backenddagi Passport endpoint
      mavjud bo‘lsa shu yer orqali olinadi.
    */

    const endpoints = [
      `/api/passport/${encodeURIComponent(id)}`,
      `/api/passports/${encodeURIComponent(id)}`,
      `/api/users/passport/${encodeURIComponent(id)}`
    ];

    let result = null;

    for (
      const endpoint of endpoints
    ) {

      try {

        const response =
          await fetch(
            endpoint,
            {
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );

        if (
          response.ok
        ) {

          result =
            await response.json();

          break;

        }

      } catch (error) {

        console.warn(
          "Passport endpoint:",
          endpoint,
          error.message
        );

      }

    }

    if (!result) {

      container.innerHTML = `

        <div class="chesara-empty">

          <div style="font-size:42px">
            🪪
          </div>

          <strong>
            CHESARA ID topilmadi
          </strong>

          <p>
            Kiritilgan ID bo‘yicha
            tasdiqlangan ma’lumot mavjud emas.
          </p>

        </div>

      `;

      return;
    }

    this.renderPassport(
      result,
      container
    );

  },

  renderPassport(
    data,
    container
  ) {

    const passport =
      data.passport ||
      data.user ||
      data;

    const name =
      passport.fullName ||
      passport.name ||
      [
        passport.firstName,
        passport.lastName
      ]
        .filter(Boolean)
        .join(" ") ||
      "Noma’lum";

    const id =
      passport.chesaraId ||
      passport.chesaraID ||
      passport.id ||
      "—";

    const role =
      passport.role ||
      passport.status ||
      "—";

    const photo =
      passport.photo ||
      passport.photoUrl ||
      passport.image ||
      "";

    const certificateList =
      Array.isArray(
        passport.certificates
      )
        ? passport.certificates
        : [];

    container.innerHTML = `

      <div class="chesara-passport">

        <div class="passport-top">

          <div class="passport-logo">
            ♟
          </div>

          <div>

            <strong>
              CHESARA
            </strong>

            <small>
              SHAXMAT PASPORTI
            </small>

          </div>

          <span class="passport-verified">
            ✓ TASDIQLANGAN
          </span>

        </div>

        <div class="passport-content">

          <div class="passport-person">

            <div class="passport-photo">

              ${
                photo
                  ? `
                    <img
                      src="${this.escapeAttribute(photo)}"
                      alt="CHESARA Passport"
                    >
                  `
                  : `
                    <div class="passport-no-photo">
                      ♟
                    </div>
                  `
              }

            </div>

            <div class="passport-person-info">

              <div class="passport-id-label">
                CHESARA ID
              </div>

              <div class="passport-id-value">
                ${this.escapeHtml(id)}
              </div>

              <h3>
                ${this.escapeHtml(name)}
              </h3>

              <span class="passport-role">
                ${this.escapeHtml(role)}
              </span>

            </div>

          </div>

          <div class="passport-details">

            ${this.passportField(
              "Tug‘ilgan sana",
              passport.birthDate
            )}

            ${this.passportField(
              "Telefon",
              passport.phone
            )}

            ${this.passportField(
              "Hudud",
              passport.region
            )}

            ${this.passportField(
              "Faoliyat",
              passport.activityType
            )}

            ${this.passportField(
              "CHESARA status",
              passport.chesaraStatus ||
              passport.status
            )}

            ${this.passportField(
              "Ustozlik statusi",
              passport.teacherStatus
            )}

          </div>

          ${
            certificateList.length
              ? `

                <div class="passport-certificates">

                  <h4>
                    🎓 Sertifikatlar
                  </h4>

                  ${certificateList
                    .map(
                      certificate => `

                        <div class="passport-certificate">

                          <strong>
                            ${this.escapeHtml(
                              certificate.name ||
                              certificate.title ||
                              "CHESARA sertifikati"
                            )}
                          </strong>

                          ${
                            certificate.number
                              ? `
                                <span>
                                  № ${this.escapeHtml(
                                    certificate.number
                                  )}
                                </span>
                              `
                              : ""
                          }

                        </div>

                      `
                    )
                    .join("")}

                </div>

              `
              : ""
          }

        </div>

      </div>
    `;

  },

  passportField(
    label,
    value
  ) {

    return `

      <div class="passport-field">

        <span>
          ${this.escapeHtml(label)}
        </span>

        <strong>
          ${this.escapeHtml(
            value || "—"
          )}
        </strong>

      </div>

    `;

  },

  /* =======================================================
     CHESARA ID SEARCH
     ======================================================= */

  async searchChesaraId(id) {

    const value =
      String(id || "")
        .trim();

    if (!value) {

      this.showToast(
        "CHESARA ID kiriting.",
        "error"
      );

      return null;
    }

    const endpoints = [
      `/api/passport/${encodeURIComponent(value)}`,
      `/api/passports/${encodeURIComponent(value)}`,
      `/api/users/passport/${encodeURIComponent(value)}`
    ];

    for (
      const endpoint of endpoints
    ) {

      const result =
        await this.api(
          endpoint
        );

      if (result) {
        return result;
      }

    }

    return null;

  },

  /* =======================================================
     3 DOT MENU
     ======================================================= */

  setupMoreMenus() {

    document.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-more-menu]"
          );

        if (!button) {

          document
            .querySelectorAll(
              ".chesara-more-dropdown"
            )
            .forEach(menu => {

              menu.classList.add(
                "hidden"
              );

            });

          return;
        }

        event.stopPropagation();

        const menu =
          button
            .parentElement
            ?.querySelector(
              ".chesara-more-dropdown"
            );

        if (!menu) return;

        document
          .querySelectorAll(
            ".chesara-more-dropdown"
          )
          .forEach(item => {

            if (
              item !== menu
            ) {

              item.classList.add(
                "hidden"
              );

            }

          });

        menu.classList.toggle(
          "hidden"
        );

      }
    );

  },

  createMoreMenu(
    options = {}
  ) {

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "chesara-more-wrapper";

    wrapper.innerHTML = `

      <button
        type="button"
        class="chesara-more-button"
        data-more-menu
        title="Qo‘shimcha amallar"
      >
        ⋮
      </button>

      <div
        class="chesara-more-dropdown hidden"
      >

        ${
          options.view !== false
            ? `
              <button
                type="button"
                data-more-action="view"
              >
                👁 Ko‘rish
              </button>
            `
            : ""
        }

        ${
          options.edit !== false
            ? `
              <button
                type="button"
                data-more-action="edit"
              >
                ✏️ Tahrirlash
              </button>
            `
            : ""
        }

        ${
          options.delete !== false
            ? `
              <button
                type="button"
                class="danger"
                data-more-action="delete"
              >
                🗑 O‘chirish
              </button>
            `
            : ""
        }

      </div>
    `;

    wrapper
      .querySelectorAll(
        "[data-more-action]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async event => {

            event.stopPropagation();

            const action =
              button.dataset.moreAction;

            wrapper
              .querySelector(
                ".chesara-more-dropdown"
              )
              ?.classList.add(
                "hidden"
              );

            if (
              typeof options[action] ===
              "function"
            ) {

              await options[action]();

            }

          }
        );

      });

    return wrapper;

  },

  /* =======================================================
     EDIT MODAL
     ======================================================= */

  openEditModal(
    title,
    fields = {},
    onSave
  ) {

    const modal =
      document.createElement(
        "div"
      );

    modal.className =
      "chesara-modal-overlay";

    const fieldsHtml =
      Object.entries(fields)
        .map(
          ([key, value]) => `

            <div class="chesara-form-group">

              <label>
                ${this.escapeHtml(key)}
              </label>

              <input
                type="text"
                data-edit-field="${this.escapeAttribute(key)}"
                value="${this.escapeAttribute(
                  value ?? ""
                )}"
              >

            </div>

          `
        )
        .join("");

    modal.innerHTML = `

      <div class="chesara-modal">

        <div class="chesara-modal-header">

          <div class="chesara-modal-title">
            ✏️ ${this.escapeHtml(title)}
          </div>

          <button
            type="button"
            class="chesara-close"
            data-close
          >
            ×
          </button>

        </div>

        <div class="chesara-modal-body">

          ${fieldsHtml}

        </div>

        <div class="chesara-modal-footer">

          <button
            type="button"
            class="chesara-secondary-button"
            data-close
          >
            Bekor qilish
          </button>

          <button
            type="button"
            class="chesara-primary-button"
            data-save
          >
            💾 Saqlash
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    modal
      .querySelectorAll(
        "[data-close]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          () => modal.remove()
        );

      });

    modal
      .querySelector(
        "[data-save]"
      )
      ?.addEventListener(
        "click",
        async () => {

          const result = {};

          modal
            .querySelectorAll(
              "[data-edit-field]"
            )
            .forEach(input => {

              result[
                input.dataset.editField
              ] = input.value;

            });

          if (
            typeof onSave ===
            "function"
          ) {

            await onSave(result);

          }

          modal.remove();

        }
      );

  },

  /* =======================================================
     DELETE CONFIRM
     ======================================================= */

  async confirmDelete(
    title =
      "O‘chirish",
    message =
      "Haqiqatan ham o‘chirmoqchimisiz?"
  ) {

    return new Promise(
      resolve => {

        const modal =
          document.createElement(
            "div"
          );

        modal.className =
          "chesara-modal-overlay";

        modal.innerHTML = `

          <div
            class="chesara-modal"
            style="max-width:420px"
          >

            <div class="chesara-modal-header">

              <div class="chesara-modal-title">
                🗑 ${this.escapeHtml(title)}
              </div>

            </div>

            <div class="chesara-modal-body">

              <div class="chesara-danger-box">
                ${this.escapeHtml(message)}
              </div>

            </div>

            <div class="chesara-modal-footer">

              <button
                type="button"
                class="chesara-secondary-button"
                data-no
              >
                Bekor qilish
              </button>

              <button
                type="button"
                class="chesara-danger-button"
                data-yes
              >
                🗑 O‘chirish
              </button>

            </div>

          </div>
        `;

        document.body.appendChild(
          modal
        );

        modal
          .querySelector(
            "[data-no]"
          )
          .addEventListener(
            "click",
            () => {

              modal.remove();

              resolve(false);

            }
          );

        modal
          .querySelector(
            "[data-yes]"
          )
          .addEventListener(
            "click",
            () => {

              modal.remove();

              resolve(true);

            }
          );

      }
    );

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

    setTimeout(
      () => {
        window.location.reload();
      },
      700
    );

  },

  /* =======================================================
     HELPERS
     ======================================================= */

  setText(
    selector,
    value
  ) {

    const element =
      document.querySelector(
        selector
      );

    if (element) {

      element.textContent =
        value;

    }

  },

  escapeHtml(value) {

    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );

  },

  escapeAttribute(value) {

    return this.escapeHtml(
      value
    );

  },

  showToast(
    message,
    type = "success"
  ) {

    let container =
      document.querySelector(
        ".chesara-toast-container"
      );

    if (!container) {

      container =
        document.createElement(
          "div"
        );

      container.className =
        "chesara-toast-container";

      document.body.appendChild(
        container
      );

    }

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      `chesara-toast ${type}`;

    toast.textContent =
      message;

    container.appendChild(
      toast
    );

    setTimeout(
      () => {

        toast.classList.add(
          "hide"
        );

        setTimeout(
          () => {
            toast.remove();
          },
          300
        );

      },
      3000
    );

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

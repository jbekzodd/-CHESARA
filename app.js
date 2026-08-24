'use strict';

/*
============================================================
 CHESARA FRONTEND APPLICATION
 v2 — Telegram + Role + Super Admin + Actions
============================================================
*/

const CHESARA = {

  SUPER_ADMIN: {
    telegramId: 1148401454,
    username: 'jovliyev_bekzod'
  },

  state: {
    currentPage: 'dashboard',

    user: {
      id: null,
      telegramId: null,
      username: '',
      name: 'Mehmon',
      role: null,
      roleSelected: false,
      isSuperAdmin: false,
      teacherType: null,
      passportId: null
    },

    dashboard: null,

    pages: [
      'dashboard',
      'students',
      'teachers',
      'groups',
      'attendance',
      'lessons',
      'analysis',
      'tournaments',
      'news',
      'reports',
      'alerts',
      'settings',
      'passport',
      'centers',
      'courses'
    ]
  },

  /*
  ============================================================
  INIT
  ============================================================
  */

  async init() {

    console.log('♟ CHESARA frontend ishga tushmoqda...');

    try {

      this.initTelegram();

      this.loadLocalUser();

      await this.loadCurrentUser();

      this.setupNavigation();

      this.setupMobileNavigation();

      this.setupGlobalButtons();

      this.setupThreeDotActions();

      this.handleRoute();

      await this.loadDashboard();

      this.updateUserInterface();

      console.log('✅ CHESARA frontend tayyor.');

    } catch (error) {

      console.error(
        '❌ CHESARA INIT ERROR:',
        error
      );

      this.showToast(
        'CHESARA ishga tushirishda xatolik.',
        'error'
      );
    }

  },

  /*
  ============================================================
  TELEGRAM WEB APP
  ============================================================
  */

  initTelegram() {

    const tg =
      window.Telegram &&
      window.Telegram.WebApp;

    if (!tg) {

      console.log(
        'ℹ️ Telegram WebApp topilmadi. Oddiy brauzer rejimi.'
      );

      return;
    }

    try {

      tg.ready();

      tg.expand();

      this.telegram = tg;

      const tgUser =
        tg.initDataUnsafe?.user;

      if (tgUser) {

        this.state.user.id =
          tgUser.id || null;

        this.state.user.telegramId =
          tgUser.id || null;

        this.state.user.username =
          tgUser.username || '';

        this.state.user.name =
          [
            tgUser.first_name || '',
            tgUser.last_name || ''
          ]
            .join(' ')
            .trim() || 'Foydalanuvchi';

        this.state.user.isSuperAdmin =
          this.isSuperAdmin(tgUser);

      }

      console.log(
        'Telegram user:',
        this.state.user
      );

    } catch (error) {

      console.error(
        'Telegram WebApp xatosi:',
        error
      );

    }

  },

  /*
  ============================================================
  LOCAL USER
  ============================================================
  */

  loadLocalUser() {

    try {

      const saved =
        localStorage.getItem(
          'chesara_user'
        );

      if (!saved) return;

      const user =
        JSON.parse(saved);

      this.state.user = {
        ...this.state.user,
        ...user
      };

    } catch (error) {

      console.warn(
        'Local user o‘qilmadi:',
        error
      );

    }

  },

  saveLocalUser() {

    try {

      localStorage.setItem(
        'chesara_user',
        JSON.stringify(
          this.state.user
        )
      );

    } catch (error) {

      console.warn(
        'Local user saqlanmadi:',
        error
      );

    }

  },

  /*
  ============================================================
  SUPER ADMIN
  ============================================================
  */

  isSuperAdmin(user) {

    if (!user) return false;

    const id =
      Number(
        user.id ||
        user.telegramId ||
        0
      );

    const username =
      String(
        user.username || ''
      )
        .replace('@', '')
        .toLowerCase();

    return (
      id ===
        this.SUPER_ADMIN.telegramId ||
      username ===
        this.SUPER_ADMIN.username
          .toLowerCase()
    );

  },

  /*
  ============================================================
  CURRENT USER
  ============================================================
  */

  async loadCurrentUser() {

    const tg =
      window.Telegram &&
      window.Telegram.WebApp;

    let data = null;

    try {

      if (
        this.state.user.telegramId
      ) {

        data =
          await this.api(
            `/api/user/${this.state.user.telegramId}`
          );

      }

    } catch (error) {

      console.warn(
        'User API mavjud emas yoki ishlamadi.',
        error
      );

    }

    if (data?.user) {

      this.state.user = {
        ...this.state.user,
        ...data.user
      };

    }

    /*
    SUPER ADMIN DOIMO ANIQLANADI
    */

    this.state.user.isSuperAdmin =
      this.isSuperAdmin(
        this.state.user
      );

    if (
      this.state.user.isSuperAdmin
    ) {

      this.state.user.role =
        'super_admin';

      this.state.user.roleSelected =
        true;

    }

    this.saveLocalUser();

  },

  /*
  ============================================================
  API
  ============================================================
  */

  async api(
    url,
    options = {}
  ) {

    try {

      const response =
        await fetch(
          url,
          {
            headers: {
              'Content-Type':
                'application/json',

              ...(options.headers || {})
            },

            ...options
          }
        );

      if (!response.ok) {

        throw new Error(
          `HTTP ${response.status}`
        );

      }

      const text =
        await response.text();

      if (!text) return {};

      try {

        return JSON.parse(text);

      } catch {

        return {
          success: true,
          text
        };

      }

    } catch (error) {

      console.error(
        'CHESARA API ERROR:',
        url,
        error
      );

      return null;

    }

  },

  /*
  ============================================================
  DASHBOARD
  ============================================================
  */

  async loadDashboard() {

    const data =
      await this.api(
        '/api/dashboard'
      );

    if (!data) {

      console.log(
        'Dashboard API hozircha mavjud emas.'
      );

      return;

    }

    this.state.dashboard =
      data;

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

  /*
  ============================================================
  NAVIGATION
  ============================================================
  */

  setupNavigation() {

    document.addEventListener(
      'click',
      event => {

        const link =
          event.target.closest(
            '[data-page]'
          );

        if (!link) return;

        event.preventDefault();

        const page =
          link.dataset.page;

        if (
          !this.state.pages.includes(
            page
          )
        ) {

          console.warn(
            'Noma’lum page:',
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
      !this.state.pages.includes(
        page
      )
    ) {

      return;
    }

    this.state.currentPage =
      page;

    const url =
      page === 'dashboard'
        ? '/'
        : `/?page=${encodeURIComponent(page)}`;

    history.pushState(
      { page },
      '',
      url
    );

    this.renderPage(page);

    this.updateActiveNavigation(
      page
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  },

  handleRoute() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const requested =
      params.get('page') ||
      'dashboard';

    const page =
      this.state.pages.includes(
        requested
      )
        ? requested
        : 'dashboard';

    this.state.currentPage =
      page;

    this.renderPage(page);

    this.updateActiveNavigation(
      page
    );

  },

  /*
  ============================================================
  PAGE RENDER
  ============================================================
  */

  renderPage(page) {

    const title =
      document.querySelector(
        '[data-page-title]'
      );

    if (title) {

      title.textContent =
        this.getPageTitle(page);

    }

    document
      .querySelectorAll(
        '[data-page-view]'
      )
      .forEach(
        element => {

          element.classList.remove(
            'active'
          );

          if (
            element.dataset.pageView ===
            page
          ) {

            element.classList.add(
              'active'
            );

          }

        }
      );

    this.updatePageContent(
      page
    );

  },

  getPageTitle(page) {

    const titles = {

      dashboard:
        'Boshqaruv paneli',

      students:
        'O‘quvchilar',

      teachers:
        'Ustozlar',

      groups:
        'Guruhlar',

      attendance:
        'Davomat',

      lessons:
        'Darslar',

      analysis:
        'AI O‘yin tahlili',

      tournaments:
        'Turnirlar',

      news:
        'Yangiliklar',

      reports:
        'Hisobotlar',

      alerts:
        'Ogohlantirishlar',

      settings:
        'Sozlamalar',

      passport:
        'CHESARA Pasporti',

      centers:
        'Markazlar',

      courses:
        'Kurslar'

    };

    return (
      titles[page] ||
      'CHESARA'
    );

  },

  updatePageContent(page) {

    if (
      page === 'analysis'
    ) {

      this.initAnalysisPage();

    }

    if (
      page === 'attendance'
    ) {

      this.initAttendancePage();

    }

    if (
      page === 'reports'
    ) {

      this.initReportsPage();

    }

    if (
      page === 'alerts'
    ) {

      this.initAlertsPage();

    }

  },

  updateActiveNavigation(
    page
  ) {

    document
      .querySelectorAll(
        '[data-page]'
      )
      .forEach(
        element => {

          element.classList.toggle(
            'active',
            element.dataset.page ===
              page
          );

        }
      );

  },

  /*
  ============================================================
  MOBILE
  ============================================================
  */

  setupMobileNavigation() {

    const button =
      document.querySelector(
        '[data-mobile-menu]'
      );

    const sidebar =
      document.querySelector(
        '[data-sidebar]'
      );

    const overlay =
      document.querySelector(
        '[data-sidebar-overlay]'
      );

    if (
      !button ||
      !sidebar
    ) {

      return;
    }

    button.addEventListener(
      'click',
      () => {

        sidebar.classList.toggle(
          'mobile-open'
        );

        overlay?.classList.toggle(
          'visible'
        );

        document.body.classList.toggle(
          'menu-open'
        );

      }
    );

    overlay?.addEventListener(
      'click',
      () => {

        sidebar.classList.remove(
          'mobile-open'
        );

        overlay.classList.remove(
          'visible'
        );

        document.body.classList.remove(
          'menu-open'
        );

      }
    );

  },

  /*
  ============================================================
  GLOBAL BUTTONS
  ============================================================
  */

  setupGlobalButtons() {

    document.addEventListener(
      'click',
      event => {

        const button =
          event.target.closest(
            '[data-action]'
          );

        if (!button) return;

        const action =
          button.dataset.action;

        switch (action) {

          case 'refresh':

            this.loadDashboard();

            this.showToast(
              'Ma’lumotlar yangilanmoqda...'
            );

            break;

          case 'open-analysis':

            this.navigate(
              'analysis'
            );

            break;

          case 'open-reports':

            this.navigate(
              'reports'
            );

            break;

          case 'open-attendance':

            this.navigate(
              'attendance'
            );

            break;

          case 'open-passport':

            this.navigate(
              'passport'
            );

            break;

          case 'logout':

            this.logout();

            break;

          default:

            console.warn(
              'Noma’lum action:',
              action
            );

        }

      }
    );

  },

  /*
  ============================================================
  3 NUQTA — TAHRIRLASH / O‘CHIRISH / KO‘RISH
  ============================================================
  */

  setupThreeDotActions() {

    document.addEventListener(
      'click',
      event => {

        const button =
          event.target.closest(
            '[data-more-action]'
          );

        if (!button) return;

        event.stopPropagation();

        const type =
          button.dataset.moreAction;

        const id =
          button.dataset.id || '';

        this.openActionMenu(
          button,
          type,
          id
        );

      }
    );

    document.addEventListener(
      'click',
      event => {

        if (
          !event.target.closest(
            '.chesara-action-menu'
          ) &&
          !event.target.closest(
            '[data-more-action]'
          )
        ) {

          this.closeActionMenus();

        }

      }
    );

  },

  openActionMenu(
    button,
    type,
    id
  ) {

    this.closeActionMenus();

    const menu =
      document.createElement(
        'div'
      );

    menu.className =
      'chesara-action-menu';

    menu.innerHTML = `

      <button
        type="button"
        data-menu-action="view"
        data-id="${this.escape(id)}"
      >
        👁 Ko‘rish
      </button>

      <button
        type="button"
        data-menu-action="edit"
        data-id="${this.escape(id)}"
      >
        ✏️ Tahrirlash
      </button>

      <button
        type="button"
        data-menu-action="delete"
        data-id="${this.escape(id)}"
      >
        🗑 O‘chirish
      </button>

    `;

    document.body.appendChild(
      menu
    );

    const rect =
      button.getBoundingClientRect();

    menu.style.position =
      'fixed';

    menu.style.top =
      `${rect.bottom + 6}px`;

    menu.style.left =
      `${Math.max(
        8,
        rect.right - 190
      )}px`;

    menu.addEventListener(
      'click',
      event => {

        const item =
          event.target.closest(
            '[data-menu-action]'
          );

        if (!item) return;

        this.handleMenuAction(
          item.dataset.menuAction,
          item.dataset.id,
          type
        );

        this.closeActionMenus();

      }
    );

  },

  closeActionMenus() {

    document
      .querySelectorAll(
        '.chesara-action-menu'
      )
      .forEach(
        menu => menu.remove()
      );

  },

  async handleMenuAction(
    action,
    id,
    type
  ) {

    if (
      action === 'view'
    ) {

      this.showToast(
        `Ma’lumot ko‘rish: ${id || type}`
      );

      return;
    }

    if (
      action === 'edit'
    ) {

      this.showToast(
        `Tahrirlash: ${id || type}`
      );

      return;
    }

    if (
      action === 'delete'
    ) {

      const confirmed =
        window.confirm(
          'Bu ma’lumotni o‘chirishni xohlaysizmi?'
        );

      if (!confirmed) return;

      const result =
        await this.api(
          `/api/${type}/${encodeURIComponent(id)}`,
          {
            method: 'DELETE'
          }
        );

      if (
        result
      ) {

        this.showToast(
          'Ma’lumot o‘chirildi.'
        );

        await this.loadDashboard();

      }

    }

  },

  /*
  ============================================================
  AI ANALYSIS
  ============================================================
  */

  initAnalysisPage() {

    const form =
      document.querySelector(
        '[data-analysis-form]'
      );

    if (
      !form ||
      form.dataset.ready
    ) {

      return;
    }

    form.dataset.ready =
      'true';

    form.addEventListener(
      'submit',
      async event => {

        event.preventDefault();

        const source =
          form.querySelector(
            '[name="source"]'
          )?.value ||
          'manual';

        const game =
          form.querySelector(
            '[name="game"]'
          )?.value ||
          '';

        const player =
          form.querySelector(
            '[name="player"]'
          )?.value ||
          'O‘yinchi';

        if (
          !game.trim()
        ) {

          this.showToast(
            'Avval PGN yoki o‘yin ma’lumotini kiriting.',
            'error'
          );

          return;
        }

        this.showToast(
          'O‘yin CHESARA AI tahliliga yuborilmoqda...'
        );

        const result =
          await this.api(
            '/api/chess/analyze',
            {
              method: 'POST',

              body:
                JSON.stringify({
                  source,
                  game,
                  player
                })
            }
          );

        if (!result) {

          this.showToast(
            'AI tahlil serveri javob bermadi.',
            'error'
          );

          return;
        }

        this.renderAnalysisResult(
          result
        );

      }
    );

  },

  renderAnalysisResult(
    result
  ) {

    const container =
      document.querySelector(
        '[data-analysis-result]'
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
                '—'
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
                '—'
              }
            </strong>
          </div>

        </div>

        <div class="analysis-message">
          ${
            this.escape(
              result.message || ''
            )
          }
        </div>

      </div>

    `;

  },

  /*
  ============================================================
  ATTENDANCE
  ============================================================
  */

  initAttendancePage() {

    document
      .querySelectorAll(
        '[data-attendance-action]'
      )
      .forEach(
        button => {

          if (
            button.dataset.ready
          ) {

            return;
          }

          button.dataset.ready =
            'true';

          button.addEventListener(
            'click',
            () => {

              const action =
                button.dataset
                  .attendanceAction;

              this.showToast(
                `Davomat: ${action}`
              );

            }
          );

        }
      );

  },

  /*
  ============================================================
  REPORTS
  ============================================================
  */

  initReportsPage() {

    const button =
      document.querySelector(
        '[data-generate-report]'
      );

    if (
      !button ||
      button.dataset.ready
    ) {

      return;
    }

    button.dataset.ready =
      'true';

    button.addEventListener(
      'click',
      () => {

        this.showToast(
          'Hisobot tayyorlanmoqda...'
        );

      }
    );

  },

  /*
  ============================================================
  ALERTS
  ============================================================
  */

  initAlertsPage() {

    document
      .querySelectorAll(
        '[data-alert]'
      )
      .forEach(
        alert => {

          if (
            alert.dataset.ready
          ) return;

          alert.dataset.ready =
            'true';

          alert.addEventListener(
            'click',
            () => {

              alert.classList.toggle(
                'read'
              );

            }
          );

        }
      );

  },

  /*
  ============================================================
  USER INTERFACE
  ============================================================
  */

  updateUserInterface() {

    const user =
      this.state.user;

    const name =
      user.name ||
      'Foydalanuvchi';

    const role =
      this.getRoleName(
        user.role
      );

    document
      .querySelectorAll(
        '[data-user-name]'
      )
      .forEach(
        element => {
          element.textContent =
            name;
        }
      );

    document
      .querySelectorAll(
        '[data-user-role]'
      )
      .forEach(
        element => {
          element.textContent =
            role;
        }
      );

    document
      .querySelectorAll(
        '[data-user-telegram]'
      )
      .forEach(
        element => {
          element.textContent =
            user.telegramId ||
            user.id ||
            '—';
        }
      );

    const initials =
      name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(
          x =>
            x.charAt(0)
              .toUpperCase()
        )
        .join('') ||
      'CH';

    document
      .querySelectorAll(
        '[data-user-initials]'
      )
      .forEach(
        element => {
          element.textContent =
            initials;
        }
      );

    /*
    STATIK ESKI ADMIN MATNLARINI
    SUPER ADMIN BO‘LMAGANDA O‘ZGARTIRAMIZ
    */

    if (
      !user.isSuperAdmin
    ) {

      document
        .querySelectorAll(
          '.profile-info strong'
        )
        .forEach(
          element => {
            element.textContent =
              name;
          }
        );

      document
        .querySelectorAll(
          '.profile-info span'
        )
        .forEach(
          element => {
            element.textContent =
              role;
          }
        );

    } else {

      document
        .querySelectorAll(
          '.profile-info strong'
        )
        .forEach(
          element => {
            element.textContent =
              name;
          }
        );

      document
        .querySelectorAll(
          '.profile-info span'
        )
        .forEach(
          element => {
            element.textContent =
              'Super Admin';
          }
        );

    }

    /*
    SUPER ADMINGA QO‘SHIMCHA MENYULAR
    */

    if (
      user.isSuperAdmin
    ) {

      this.enableSuperAdminUI();

    }

  },

  enableSuperAdminUI() {

    const nav =
      document.querySelector(
        '.sidebar-nav'
      );

    if (!nav) return;

    if (
      document.querySelector(
        '[data-page="centers"]'
      )
    ) {

      return;
    }

    const section =
      document.createElement(
        'div'
      );

    section.className =
      'nav-section chesara-admin-section';

    section.innerHTML = `

      <div class="nav-label">
        SUPER ADMIN
      </div>

      <a
        href="?page=centers"
        class="nav-item"
        data-page="centers"
      >
        <span class="nav-icon">🏢</span>
        <span>Markazlar</span>
      </a>

      <a
        href="?page=courses"
        class="nav-item"
        data-page="courses"
      >
        <span class="nav-icon">📚</span>
        <span>Kurslar</span>
      </a>

      <a
        href="?page=passport"
        class="nav-item"
        data-page="passport"
      >
        <span class="nav-icon">🪪</span>
        <span>CHESARA Pasporti</span>
      </a>

    `;

    nav.appendChild(
      section
    );

  },

  /*
  ============================================================
  ROLE
  ============================================================
  */

  getRoleName(role) {

    const roles = {

      super_admin:
        'Super Admin',

      director:
        'Direktor',

      controller:
        'Nazoratchi',

      teacher:
        'Ustoz',

      student:
        'O‘quvchi',

      parent:
        'Ota-ona'

    };

    return (
      roles[role] ||
      'Foydalanuvchi'
    );

  },

  /*
  ============================================================
  LOGOUT
  ============================================================
  */

  logout() {

    localStorage.removeItem(
      'chesara_session'
    );

    localStorage.removeItem(
      'chesara_user'
    );

    if (
      this.telegram
    ) {

      try {

        this.telegram.close();

      } catch {}

    }

    window.location.href =
      '/';

  },

  /*
  ============================================================
  HELPERS
  ============================================================
  */

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
        value ?? '';

    }

  },

  escape(value) {

    return String(
      value ?? ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  },

  showToast(
    message,
    type = 'success'
  ) {

    let container =
      document.querySelector(
        '.chesara-toast-container'
      );

    if (!container) {

      container =
        document.createElement(
          'div'
        );

      container.className =
        'chesara-toast-container';

      document.body.appendChild(
        container
      );

    }

    const toast =
      document.createElement(
        'div'
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
          'hide'
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


/*
============================================================
 START
============================================================
*/

document.addEventListener(
  'DOMContentLoaded',
  () => {

    CHESARA.init();

  }
);


/*
============================================================
 GLOBAL ACCESS
============================================================
*/

window.CHESARA =
  CHESARA;

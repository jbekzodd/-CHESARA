/* =========================================================
   CHESARA — NEXT FRONTEND MODULE
   PASSPORT / ID / 3-DOT ACTIONS / ROLE UI
   ========================================================= */

Object.assign(CHESARA, {

  /* =======================================================
     CHESARA PASSPORT
     ======================================================= */

  openPassport(id = "") {

    const passportId =
      id ||
      localStorage.getItem("chesara_passport_id") ||
      "";

    const modal = document.createElement("div");

    modal.className = "modal-overlay";

    modal.innerHTML = `
      <div class="modal">

        <div class="modal-header">
          <div>
            <div class="modal-title">
              🪪 CHESARA PASPORTI
            </div>

            <div class="card-subtitle">
              CHESARA ID orqali tekshirish
            </div>
          </div>

          <button
            class="more-button"
            data-close-modal
          >
            ×
          </button>
        </div>

        <div class="modal-body">

          <div class="form-group">

            <label class="form-label">
              CHESARA ID
            </label>

            <input
              id="passportSearchInput"
              type="text"
              value="${this.escapeHtml(passportId)}"
              placeholder="Masalan: CH-000001"
            />

          </div>

          <button
            class="btn btn-primary"
            id="passportSearchButton"
          >
            🔎 Tekshirish
          </button>

          <div
            id="passportResult"
            style="margin-top:20px"
          ></div>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector("[data-close-modal]")
      ?.addEventListener("click", () => {
        modal.remove();
      });

    modal
      .querySelector("#passportSearchButton")
      ?.addEventListener("click", async () => {

        const input =
          modal.querySelector(
            "#passportSearchInput"
          );

        const id =
          input?.value?.trim();

        if (!id) {

          this.showToast(
            "CHESARA ID kiriting.",
            "error"
          );

          return;
        }

        await this.searchPassport(
          id,
          modal.querySelector(
            "#passportResult"
          )
        );

      });

  },

  async searchPassport(id, container) {

    if (!container) return;

    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;

    /*
      Backend endpoint mavjud bo'lmasa,
      foydalanuvchiga xato ko'rsatamiz.
      Soxta ma'lumot yaratmaymiz.
    */

    const result =
      await this.api(
        `/api/passport/${encodeURIComponent(id)}`
      );

    if (!result) {

      container.innerHTML = `
        <div class="alert alert-warning">
          🪪 Bu CHESARA ID bo‘yicha
          ma’lumot topilmadi yoki Passport
          API hali ulanmagan.
        </div>
      `;

      return;
    }

    this.renderPassport(
      result,
      container
    );

  },

  renderPassport(data, container) {

    const passport =
      data.passport ||
      data.user ||
      data;

    const photo =
      passport.photo ||
      passport.image ||
      "";

    const name =
      passport.fullName ||
      passport.name ||
      "Noma’lum";

    const id =
      passport.chesaraId ||
      passport.id ||
      "—";

    const role =
      passport.role ||
      passport.status ||
      "—";

    container.innerHTML = `

      <div class="passport">

        <div class="passport-header">

          <div class="passport-brand">

            <div class="logo-icon">
              ♟
            </div>

            <div>

              <div class="passport-brand-title">
                CHESARA
              </div>

              <div class="passport-brand-subtitle">
                SHAXMAT PASPORTI
              </div>

            </div>

          </div>

          <span class="badge badge-green">
            ✓ TEKSHIRILDI
          </span>

        </div>

        <div class="passport-body">

          <div class="passport-profile">

            <div class="passport-photo">

              ${
                photo
                  ? `<img
                       src="${this.escapeAttribute(photo)}"
                       alt="CHESARA Passport"
                     >`
                  : `<div class="flex-center"
                          style="width:100%;height:100%;font-size:42px">
                       ♟
                     </div>`
              }

            </div>

            <div>

              <div class="passport-id">
                CHESARA ID:
              </div>

              <div class="passport-id">
                <strong>
                  ${this.escapeHtml(id)}
                </strong>
              </div>

              <div class="passport-name">
                ${this.escapeHtml(name)}
              </div>

              <span class="passport-role">
                ${this.escapeHtml(role)}
              </span>

            </div>

          </div>

          <div class="passport-grid">

            ${this.passportField(
              "Tug‘ilgan sana",
              passport.birthDate
            )}

            ${this.passportField(
              "Jinsi",
              passport.gender
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
              "CHESARA statusi",
              passport.chesaraStatus ||
              passport.status
            )}

            ${this.passportField(
              "Faoliyat turi",
              passport.activityType
            )}

          </div>

          ${
            passport.certificates?.length
              ? `
                <div style="margin-top:20px">

                  <strong>
                    🎓 Sertifikatlar
                  </strong>

                  <div class="certificate-list">

                    ${passport.certificates
                      .map(cert => `
                        <div class="certificate">
                          ${this.escapeHtml(
                            cert.name ||
                            cert.title ||
                            "Sertifikat"
                          )}
                        </div>
                      `)
                      .join("")}

                  </div>

                </div>
              `
              : ""
          }

        </div>

      </div>
    `;

  },

  passportField(label, value) {

    return `
      <div class="passport-field">

        <div class="passport-field-label">
          ${this.escapeHtml(label)}
        </div>

        <div class="passport-field-value">
          ${this.escapeHtml(
            value || "—"
          )}
        </div>

      </div>
    `;

  },

  /* =======================================================
     THREE DOT MENU
     ======================================================= */

  createMoreMenu(options = {}) {

    const menu =
      document.createElement("div");

    menu.className = "more-menu";

    const button =
      document.createElement("button");

    button.className =
      "more-button";

    button.type = "button";

    button.textContent = "⋮";

    const dropdown =
      document.createElement("div");

    dropdown.className =
      "more-dropdown hidden";

    const actions = [
      {
        key: "view",
        label: "👁 Ko‘rish"
      },
      {
        key: "edit",
        label: "✏️ Tahrirlash"
      },
      {
        key: "delete",
        label: "🗑 O‘chirish",
        danger: true
      }
    ];

    actions.forEach(action => {

      if (
        options[action.key] === false
      ) {
        return;
      }

      const item =
        document.createElement("button");

      item.type = "button";

      item.textContent =
        action.label;

      if (action.danger) {
        item.classList.add("danger");
      }

      item.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          dropdown.classList.add(
            "hidden"
          );

          if (
            typeof options[action.key]
            === "function"
          ) {
            options[action.key]();
          }

        }
      );

      dropdown.appendChild(item);

    });

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        document
          .querySelectorAll(
            ".more-dropdown"
          )
          .forEach(element => {

            if (
              element !== dropdown
            ) {
              element.classList.add(
                "hidden"
              );
            }

          });

        dropdown.classList.toggle(
          "hidden"
        );

      }
    );

    menu.appendChild(button);
    menu.appendChild(dropdown);

    return menu;

  },

  /* =======================================================
     GENERIC EDIT MODAL
     ======================================================= */

  openEditModal(title, fields = {}, onSave) {

    const modal =
      document.createElement("div");

    modal.className =
      "modal-overlay";

    const fieldHtml =
      Object.entries(fields)
        .map(([key, value]) => {

          return `
            <div class="form-group">

              <label class="form-label">
                ${this.escapeHtml(key)}
              </label>

              <input
                class="form-control"
                data-edit-field="${this.escapeAttribute(key)}"
                value="${this.escapeAttribute(
                  value ?? ""
                )}"
              >

            </div>
          `;

        })
        .join("");

    modal.innerHTML = `

      <div class="modal">

        <div class="modal-header">

          <div class="modal-title">
            ✏️ ${this.escapeHtml(title)}
          </div>

          <button
            class="more-button"
            data-close
          >
            ×
          </button>

        </div>

        <div class="modal-body">

          ${fieldHtml}

        </div>

        <div class="modal-footer">

          <button
            class="btn btn-secondary"
            data-close
          >
            Bekor qilish
          </button>

          <button
            class="btn btn-primary"
            data-save
          >
            💾 Saqlash
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelectorAll("[data-close]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => modal.remove()
        );

      });

    modal
      .querySelector("[data-save]")
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
     CONFIRM DELETE
     ======================================================= */

  async confirmDelete(
    title = "O‘chirish",
    message = "Haqiqatan ham o‘chirmoqchimisiz?"
  ) {

    return new Promise(resolve => {

      const modal =
        document.createElement("div");

      modal.className =
        "modal-overlay";

      modal.innerHTML = `

        <div class="modal"
             style="max-width:420px">

          <div class="modal-header">

            <div class="modal-title">
              🗑 ${this.escapeHtml(title)}
            </div>

          </div>

          <div class="modal-body">

            <div class="alert alert-danger">
              ${this.escapeHtml(message)}
            </div>

          </div>

          <div class="modal-footer">

            <button
              class="btn btn-secondary"
              data-no
            >
              Bekor qilish
            </button>

            <button
              class="btn btn-danger"
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
        .querySelector("[data-no]")
        .addEventListener(
          "click",
          () => {

            modal.remove();
            resolve(false);

          }
        );

      modal
        .querySelector("[data-yes]")
        .addEventListener(
          "click",
          () => {

            modal.remove();
            resolve(true);

          }
        );

    });

  },

  /* =======================================================
     CHESARA ID SEARCH
     ======================================================= */

  async searchChesaraId(id) {

    const value =
      String(id || "").trim();

    if (!value) {

      this.showToast(
        "CHESARA ID kiriting.",
        "error"
      );

      return null;

    }

    const result =
      await this.api(
        `/api/passport/${encodeURIComponent(value)}`
      );

    if (!result) {

      this.showToast(
        "CHESARA ID topilmadi.",
        "error"
      );

      return null;

    }

    return result;

  },

  /* =======================================================
     SECURITY HELPERS
     ======================================================= */

  escapeHtml(value) {

    return String(
      value ?? ""
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  },

  escapeAttribute(value) {

    return this.escapeHtml(
      value
    );

  }

});


/* =========================================================
   GLOBAL CHESARA BUTTONS
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-chesara-action]"
      );

    if (!button) return;

    const action =
      button.dataset.chesaraAction;

    if (
      action === "passport"
    ) {

      CHESARA.openPassport();

    }

  }
);


/* =========================================================
   CLOSE THREE-DOT MENUS
   ========================================================= */

document.addEventListener(
  "click",
  () => {

    document
      .querySelectorAll(
        ".more-dropdown"
      )
      .forEach(menu => {

        menu.classList.add(
          "hidden"
        );

      });

  }
);

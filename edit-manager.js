/* =========================================================
   ADINE EDIT MANAGER
   Farm / House / Flock editing layer.
   Does not replace existing create/delete logic.
========================================================= */
(function () {
  "use strict";

  const FIELD_MAP = {
    farm: {
      farmName: "name", farmCode: "farm_code", farmLocation: "location",
      farmOwner: "owner_name", farmManager: "manager_name", farmCapacity: "capacity", farmNotes: "notes"
    },
    house: {
      houseName: "name", houseCode: "house_code", houseCapacity: "capacity",
      houseLength: "length_m", houseWidth: "width_m", houseVentilation: "ventilation_type",
      houseSystem: "housing_system", houseNotes: "notes", houseInitialBirdCount: "initial_bird_count"
    },
    flock: {
      flockName: "name", flockCode: "flock_code", productionType: "production_type",
      genetics: "genetics", flockStrain: "strain", flockProgram: "program", flockSex: "sex",
      birdCount: "initial_bird_count", placementDate: "placement_date", startAgeDays: "start_age_days",
      flockNotes: "notes", initialAverageWeightG: "initial_average_weight_g"
    }
  };

  let editState = { type: null, id: null };

  function pageType() {
    if (document.getElementById("farmForm")) return "farm";
    if (document.getElementById("houseForm")) return "flock";
    return null;
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? String(el.value ?? "").trim() : "";
  }

  function setVal(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value == null ? "" : value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function numberValue(v) {
    return Number(String(v ?? "").replace(/[۰-۹]/g, c => String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g, "").trim());
  }

  function payloadFromForm(type, existing) {
    const payload = {};
    Object.entries(FIELD_MAP[type]).forEach(([id, column]) => {
      if (!(column in existing)) return;
      const raw = val(id);
      if (["capacity", "length_m", "width_m", "initial_bird_count", "start_age_days", "initial_average_weight_g"].includes(column)) {
        if (raw !== "") payload[column] = numberValue(raw);
        else payload[column] = null;
      } else if (column === "placement_date") {
        if (raw) payload[column] = raw.replace(/-/g, "/");
      } else {
        payload[column] = raw;
      }
    });
    return payload;
  }

  async function fetchRow(table, id) {
    const { data, error } = await supabaseClient.from(table).select("*").eq("id", id).maybeSingle();
    if (error || !data) throw error || new Error("رکورد پیدا نشد.");
    return data;
  }

  function fillForm(type, row) {
    Object.entries(FIELD_MAP[type]).forEach(([id, column]) => {
      if (column in row) setVal(id, row[column]);
    });
    if (type === "flock" && row.placement_date) setVal("placementDate", String(row.placement_date).replace(/-/g, "/"));
  }

  function addCancel(form) {
    let b = form.querySelector(".adine-edit-cancel");
    if (b) return b;
    b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-secondary adine-edit-cancel";
    b.textContent = "انصراف از ویرایش";
    b.addEventListener("click", cancelEdit);
    form.querySelector(".button-row")?.appendChild(b);
    return b;
  }

  function beginEdit(type, id, row) {
    const form = document.getElementById(type === "farm" ? "farmForm" : type === "house" ? "houseForm" : "flockForm");
    if (!form) return;
    editState = { type, id };
    fillForm(type, row);
    addCancel(form);
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.textContent = type === "farm" ? "ذخیره تغییرات فارم" : type === "house" ? "ذخیره تغییرات سالن" : "ذخیره تغییرات گله";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    editState = { type: null, id: null };
    const form = document.getElementById(pageType() === "farm" ? "farmForm" : document.getElementById("houseForm") ? "houseForm" : "flockForm");
    if (!form) return;
    form.reset();
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.textContent = pageType() === "farm" ? "ذخیره فارم" : "ذخیره" + (form.id === "houseForm" ? " سالن" : " گله");
    form.querySelector(".adine-edit-cancel")?.remove();
  }

  async function saveEdit(event) {
    if (!editState.type) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const type = editState.type;
    const table = type === "farm" ? "farms" : type === "house" ? "houses" : "flocks";
    const form = event.currentTarget;
    const row = await fetchRow(table, editState.id);
    const payload = payloadFromForm(type, row);
    if (type === "house" && "farm_id" in row) payload.farm_id = selectedFarm?.id || row.farm_id;
    try {
      const { error } = await supabaseClient.from(table).update(payload).eq("id", editState.id);
      if (error) throw error;
      alert(type === "farm" ? "تغییرات فارم با موفقیت ذخیره شد." : type === "house" ? "تغییرات سالن با موفقیت ذخیره شد." : "تغییرات گله با موفقیت ذخیره شد.");
      editState = { type: null, id: null };
      form.reset();
      form.querySelector(".adine-edit-cancel")?.remove();
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.textContent = type === "farm" ? "ذخیره فارم" : type === "house" ? "ذخیره سالن" : "ذخیره گله";
      if (type === "farm" && typeof loadFarms === "function") await loadFarms();
      if (type === "house" && typeof loadHouses === "function") await loadHouses();
      if (type === "flock" && typeof loadFlocks === "function") await loadFlocks();
    } catch (e) {
      console.error("Edit save error:", e);
      alert("ذخیره تغییرات انجام نشد:\n" + (e?.message || e));
    }
  }

  function attachForm(type, form) {
    if (!form || form.dataset.adineEditBound) return;
    form.dataset.adineEditBound = "1";
    form.addEventListener("submit", saveEdit, true);
  }

  async function addButtons() {
    try {
      if (document.getElementById("farmsList") && typeof farms !== "undefined") {
        document.querySelectorAll("#farmsList .farm-card").forEach((card, i) => {
          const row = farms[i]; if (!row || card.querySelector(".adine-edit-btn")) return;
          const b = document.createElement("button"); b.type="button"; b.className="btn btn-secondary adine-edit-btn"; b.textContent="ویرایش";
          b.onclick = () => beginEdit("farm", row.id, row);
          card.querySelector(".button-row")?.appendChild(b);
        });
        attachForm("farm", document.getElementById("farmForm"));
      }
      if (document.getElementById("housesList") && typeof houses !== "undefined") {
        document.querySelectorAll("#housesList .card").forEach((card, i) => {
          const row = houses[i]; if (!row || card.querySelector(".adine-edit-btn")) return;
          const b = document.createElement("button"); b.type="button"; b.className="btn btn-secondary adine-edit-btn"; b.textContent="ویرایش";
          b.onclick = () => beginEdit("house", row.id, row);
          card.querySelector(".button-row")?.appendChild(b);
        });
        attachForm("house", document.getElementById("houseForm"));
      }
      if (document.getElementById("flocksList") && typeof flocks !== "undefined") {
        document.querySelectorAll("#flocksList .card").forEach((card, i) => {
          const row = flocks[i]; if (!row || card.querySelector(".adine-edit-btn")) return;
          const b = document.createElement("button"); b.type="button"; b.className="btn btn-secondary adine-edit-btn"; b.textContent="ویرایش";
          b.onclick = () => beginEdit("flock", row.id, row);
          card.querySelector(".button-row")?.appendChild(b);
        });
        attachForm("flock", document.getElementById("flockForm"));
      }
    } catch (e) { console.error("Edit manager:", e); }
  }

  function ensureExtraFields() {
    const form = document.getElementById("houseForm");
    if (form && !document.getElementById("houseInitialBirdCount")) {
      const group = document.createElement("div"); group.className="form-group";
      group.innerHTML='<label for="houseInitialBirdCount">تعداد اولیه جوجه / مرغ سالن</label><input id="houseInitialBirdCount" type="text" inputmode="numeric" autocomplete="off" placeholder="مثلاً ۵۰۰۰۰">';
      form.querySelector(".form-grid")?.appendChild(group);
    }
    const flockForm = document.getElementById("flockForm");
    if (flockForm && !document.getElementById("initialAverageWeightG")) {
      const group = document.createElement("div"); group.className="form-group";
      group.innerHTML='<label for="initialAverageWeightG">میانگین وزن اولیه (گرم) *</label><input id="initialAverageWeightG" type="text" inputmode="decimal" autocomplete="off" placeholder="مثلاً ۴۵">';
      const count = document.getElementById("birdCount")?.closest(".form-group");
      count?.after(group);
    }
  }

  function boot() {
    ensureExtraFields();
    addButtons();
    setTimeout(addButtons, 700);
    setTimeout(addButtons, 1600);
    setTimeout(addButtons, 3000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

"use strict";

/* ADINEH HEALTH RECORDS RUNTIME V2
   Authoritative UI bridge for health_events.
   It intentionally does not depend on reportability flags or intelligence views.
*/
(function () {
  if (window.__ADINE_HEALTH_RECORDS_RUNTIME_V2__) return;
  window.__ADINE_HEALTH_RECORDS_RUNTIME_V2__ = true;

  const state = { flock: null, rows: [], catalog: new Map(), bound: false };
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replace(/[&<>\"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const num = (v) => Number(v || 0).toLocaleString("fa-IR");
  const typeLabel = (v) => ({mortality:"تلفات",cull:"حذفی",disease:"بیماری",suspected_disease:"بیماری مشکوک",clinical_case:"مورد بالینی",environmental:"محیطی / مدیریتی"}[v] || v || "رخداد سلامت");
  const severityLabel = (v) => ({mild:"خفیف",moderate:"متوسط",severe:"شدید"}[v] || v || "-");
  const jalali = (v) => {
    try {
      if (window.AdineDateSystem?.formatJalali) return window.AdineDateSystem.formatJalali(v, true);
      if (window.jalaliDate?.isoToJalali) return window.jalaliDate.isoToJalali(v);
    } catch (_) {}
    return v || "-";
  };

  async function waitForClient() {
    for (let i = 0; i < 80; i++) {
      if (window.supabaseClient) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    return false;
  }

  async function resolveFlock() {
    if (window.healthFlock?.id) return window.healthFlock;
    let id = null;
    try { id = window.getCurrentSelection?.()?.flockId || null; } catch (_) {}
    if (!id) {
      try { id = localStorage.getItem("selectedFlockId") || localStorage.getItem("activeFlockId") || null; } catch (_) {}
    }
    if (!id) {
      const select = $("flockSelect");
      if (select?.value) id = select.value;
    }
    if (!id) return null;
    const r = await supabaseClient.from("flocks").select("*").eq("id", id).maybeSingle();
    if (r.error) throw r.error;
    state.flock = r.data || null;
    if (state.flock) window.healthFlock = state.flock;
    return state.flock;
  }

  async function loadRows() {
    const flock = await resolveFlock();
    if (!flock?.id) throw new Error("گله فعال پیدا نشد.");
    const r = await supabaseClient.from("health_events").select("*").eq("flock_id", flock.id).order("event_date", {ascending:false}).order("created_at", {ascending:false}).limit(500);
    if (r.error) throw r.error;
    state.rows = r.data || [];

    const ids = [...new Set(state.rows.flatMap(x => [x.suspected_disease_id, x.confirmed_disease_id]).filter(Boolean))];
    state.catalog.clear();
    if (ids.length) {
      const d = await supabaseClient.from("health_disease_catalog").select("id,name_fa").in("id", ids);
      if (!d.error) (d.data || []).forEach(x => state.catalog.set(x.id, x.name_fa));
    }
  }

  function disease(row) {
    return state.catalog.get(row.confirmed_disease_id) || state.catalog.get(row.suspected_disease_id) || "-";
  }

  function showError(message) {
    const targets = [$("healthHistoryTable"), $("healthReportTableBody")].filter(Boolean);
    targets.forEach(t => {
      t.innerHTML = `<tr><td colspan="10"><div class="empty-state" style="color:#a61b1b">خطا در دریافت سوابق سلامت: ${esc(message)}<br><small>منبع داده: health_events</small></div></td></tr>`;
    });
    const status = $("healthStatus");
    if (status) {
      status.className = "status-box show status-error";
      status.textContent = "خطا در دریافت سوابق سلامت: " + message;
    }
    console.error("HEALTH_RECORDS_RUNTIME_V2", message);
  }

  function renderHistory() {
    const body = $("healthHistoryTable");
    if (!body) return;
    if (!state.rows.length) {
      body.innerHTML = `<tr><td colspan="10"><div class="empty-state">برای این گله هیچ پرونده‌ای در health_events پیدا نشد.</div></td></tr>`;
      return;
    }
    body.innerHTML = state.rows.map(row => `
      <tr>
        <td>${esc(jalali(row.event_date))}</td>
        <td>${esc(typeLabel(row.event_type))}</td>
        <td>${num(row.mortality_count)}</td>
        <td>${num(row.cull_count)}</td>
        <td>${num(row.affected_count)}</td>
        <td>${esc(disease(row))}</td>
        <td>${esc(severityLabel(row.severity))}</td>
        <td><span class="badge ${row.show_in_reports ? "badge-success" : "badge-warning"}">${row.show_in_reports ? "نمایش" : "خصوصی"}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn-secondary" type="button" data-health-runtime-view="${esc(row.id)}">مشاهده</button>
          <button class="btn btn-secondary" type="button" data-health-runtime-edit="${esc(row.id)}">ویرایش</button>
          <button class="btn btn-danger" type="button" data-health-runtime-delete="${esc(row.id)}">حذف</button>
        </td>
      </tr>`).join("");

    body.querySelectorAll("[data-health-runtime-view]").forEach(b => b.addEventListener("click", () => viewRow(b.dataset.healthRuntimeView)));
    body.querySelectorAll("[data-health-runtime-edit]").forEach(b => b.addEventListener("click", () => editRow(b.dataset.healthRuntimeEdit)));
    body.querySelectorAll("[data-health-runtime-delete]").forEach(b => b.addEventListener("click", () => deleteRow(b.dataset.healthRuntimeDelete)));
  }

  async function viewRow(id) {
    const row = state.rows.find(x => x.id === id); if (!row) return;
    window.selectedEventId = id;
    const p = $("reportPreview");
    if (p) {
      p.innerHTML = `<div class="report-box"><h3>${esc(typeLabel(row.event_type))} — پرونده سلامت</h3><p>تاریخ: <strong>${esc(jalali(row.event_date))}</strong> | سن: ${num(row.flock_age_days)} روز</p><p>تلفات: ${num(row.mortality_count)} | حذفی: ${num(row.cull_count)} | درگیر: ${num(row.affected_count)}</p><p>بیماری: ${esc(disease(row))} | شدت: ${esc(severityLabel(row.severity))}</p><p>مرگ ناگهانی: ${row.sudden_death ? "بله" : "خیر"} | وضعیت پرونده: ${esc(row.status || "-")}</p><p>گزارش: ${row.show_in_reports ? "نمایش" : "خصوصی"}</p><p>${esc(row.notes || "")}</p><div id="runtimeChildDetails">در حال دریافت علائم و کالبدگشایی...</div></div>`;
    }
    await loadChildren(id);
    try { window.openTab?.("report"); } catch (_) {}
    document.querySelector('[data-tab="report"]')?.click();
  }

  async function loadChildren(id) {
    const host = $("runtimeChildDetails"); if (!host) return;
    const [s, n] = await Promise.all([
      supabaseClient.from("health_event_signs").select("sign_id,health_clinical_signs(name_fa)").eq("event_id", id),
      supabaseClient.from("health_necropsies").select("necropsy_date,birds_examined,gross_diagnosis,veterinarian_notes").eq("event_id", id).order("created_at", {ascending:false}).limit(1).maybeSingle()
    ]);
    const signs = (s.data || []).map(x => x.health_clinical_signs?.name_fa).filter(Boolean);
    const nec = n.data;
    host.innerHTML = `${signs.length ? `<p><strong>علائم:</strong> ${signs.map(esc).join("، ")}</p>` : "<p>علائم بالینی ثبت نشده است.</p>"}${nec ? `<p><strong>کالبدگشایی:</strong> ${num(nec.birds_examined)} پرنده — ${esc(nec.gross_diagnosis || "بدون تشخیص ماکروسکوپی")}</p>` : "<p>کالبدگشایی ثبت نشده است.</p>"}`;
  }

  function editRow(id) {
    const row = state.rows.find(x => x.id === id); if (!row) return;
    window.selectedEventId = id;
    const set = (id, v) => { const e = $(id); if (e) e.value = v ?? ""; };
    set("eventType", row.event_type); set("mortalityCount", row.mortality_count); set("cullCount", row.cull_count); set("affectedCount", row.affected_count); set("severity", row.severity); set("diagnosisStatus", row.diagnosis_status); set("suddenDeath", String(!!row.sudden_death)); set("eventStatus", row.status); set("eventAge", row.flock_age_days); set("eventNotes", row.notes); set("suspectedDisease", row.suspected_disease_id); set("confirmedDisease", row.confirmed_disease_id); set("reportLevel", row.report_level);
    const d = $("eventDate"); if (d) d.value = jalali(row.event_date);
    if ($("showInReports")) $("showInReports").checked = !!row.show_in_reports;
    if ($("includeWeekly")) $("includeWeekly").checked = !!row.include_in_weekly_report;
    if ($("includeAnalysis")) $("includeAnalysis").checked = !!row.include_in_management_analysis;
    document.querySelector('[data-tab="event"]')?.click();
    const status = $("healthStatus"); if (status) { status.className = "status-box show status-success"; status.textContent = "حالت ویرایش پرونده فعال است؛ پس از ذخیره، سوابق و گزارش مجدداً بارگذاری می‌شوند."; }
  }

  async function deleteRow(id) {
    const row = state.rows.find(x => x.id === id); if (!row) return;
    const phrase = window.prompt("برای حذف قطعی پرونده، عبارت «حذف پرونده» را دقیقاً وارد کنید. این عملیات قابل بازیابی نیست.");
    if (phrase !== "حذف پرونده") return;
    const r = await supabaseClient.from("health_events").delete().eq("id", id);
    if (r.error) { showError(r.error.message); return; }
    await refresh();
  }

  function bindEditSave() {
    const form = $("healthEventForm");
    if (!form || form.dataset.runtimeEditBound) return;
    form.dataset.runtimeEditBound = "1";
    form.addEventListener("submit", async (ev) => {
      if (!window.selectedEventId || !state.rows.some(x => x.id === window.selectedEventId)) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      const id = window.selectedEventId;
      const v = (id) => $(id)?.value ?? "";
      const checked = (id) => !!$(id)?.checked;
      let date = v("eventDate");
      try { date = window.jalaliDate?.jalaliToISO ? (window.jalaliDate.jalaliToISO(date) || date) : date; } catch (_) {}
      const payload = { event_date: date, flock_age_days: Number(v("eventAge") || 0), event_type:v("eventType"), status:v("eventStatus") || "open", mortality_count:Number(v("mortalityCount") || 0), cull_count:Number(v("cullCount") || 0), affected_count:Number(v("affectedCount") || 0), suspected_disease_id:v("suspectedDisease") || null, confirmed_disease_id:v("confirmedDisease") || null, severity:v("severity") || null, diagnosis_status:v("diagnosisStatus") || "not_confirmed", sudden_death:v("suddenDeath") === "true", notes:v("eventNotes"), show_in_reports:checked("showInReports"), report_level:v("reportLevel") || "private", include_in_weekly_report:checked("includeWeekly"), include_in_management_analysis:checked("includeAnalysis") };
      if (!payload.show_in_reports) { payload.report_level = "private"; payload.include_in_weekly_report = false; }
      const r = await supabaseClient.from("health_events").update(payload).eq("id", id).select("*").single();
      if (r.error) { showError(r.error.message); return; }
      window.selectedEventId = null;
      await refresh();
      document.querySelector('[data-tab="history"]')?.click();
    }, true);
  }

  async function refresh() {
    try { await loadRows(); renderHistory(); renderReportTable(); bindEditSave(); } catch (e) { showError(e.message || String(e)); }
  }

  function renderReportTable() {
    const body = $("healthReportTableBody");
    if (!body) return;
    if (!state.rows.length) { body.innerHTML = `<tr><td colspan="9" class="health-report-empty">برای این گله هیچ پرونده‌ای در health_events ثبت نشده است.</td></tr>`; return; }
    body.innerHTML = state.rows.map(row => `<tr><td>${esc(jalali(row.event_date))}</td><td>${num(row.flock_age_days)}</td><td>${esc(typeLabel(row.event_type))}</td><td>${num(row.mortality_count || row.cull_count || row.affected_count)}</td><td>${esc(disease(row))}</td><td>${esc(severityLabel(row.severity))}</td><td>${row.sudden_death ? "مرگ ناگهانی" : "-"}</td><td>${esc(row.notes || "-")}</td><td><span class="badge ${row.show_in_reports ? "badge-success" : "badge-warning"}">${row.show_in_reports ? "نمایش" : "خصوصی"}</span></td></tr>`).join("");
    const note = $("healthReportNote"); if (note) note.textContent = `منبع مستقیم: health_events | ${num(state.rows.length)} پرونده سلامت این گله | وضعیت گزارش هر پرونده جداگانه مشخص شده است.`;
  }

  async function boot() {
    if (!(await waitForClient())) return;
    try {
      await refresh();
      if (!state.bound) {
        state.bound = true;
        const f = $("flockSelect");
        f?.addEventListener("change", () => setTimeout(refresh, 250));
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") setTimeout(refresh, 300); });
      }
    } catch (e) { showError(e.message || String(e)); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();

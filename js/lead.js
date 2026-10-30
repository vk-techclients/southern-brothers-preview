/* Southern Brothers — lead capture on VK house rails.
 * Shared by the "Message Us" widget and the General Inquiry, Bid Request,
 * and Subcontractor Application forms. Submissions POST directly to the
 * Farm2Chef Supabase project (public anon key, INSERT-only by RLS).
 * Store: public.lead, segment="southern-brothers",
 * source_page="southern-brothers-preview:<source>",
 * segment_data={client, ref:"SB-XXXXXX", form_type, source, page, ...all fields}
 * Alert email is sent house-side by alerts/southern_brothers_alerts.py —
 * recipient lives THERE, not in this file. This is a lead widget, NOT an AI chatbot.
 */
(function () {
  "use strict";
  var CONFIG = {
    SUPABASE_URL: "https://jlwxwyortlhslxoxwveb.supabase.co",
    ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsd3h3eW9ydGxoc2x4b3h3dmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MTM5NjgsImV4cCI6MjEwODA4OTk2OH0.ffl-S4efjHt1DCZccfhXzU8An489aljtLSuFVrN5VfI",
    TABLE: "lead",
    CLIENT: "southern-brothers",
    SITE_TAG: "southern-brothers-preview",
  };
  var REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function makeRef() {
    var out = "";
    for (var i = 0; i < 6; i++) out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
    return "SB-" + out;
  }
  function capture(fields, formType, source, all) {
    var ref = makeRef();
    var sd = { client: CONFIG.CLIENT, ref: ref, form_type: formType, source: source, page: window.location.pathname };
    Object.keys(all).forEach(function (k) { sd[k] = all[k]; });
    var payload = {
      name: fields.name || null, email: fields.email || null, phone: fields.phone || null,
      segment: CONFIG.CLIENT, source_page: CONFIG.SITE_TAG + ":" + source,
      message: fields.message || null, segment_data: sd,
    };
    return fetch(CONFIG.SUPABASE_URL + "/rest/v1/" + CONFIG.TABLE, {
      method: "POST",
      headers: { apikey: CONFIG.ANON_KEY, Authorization: "Bearer " + CONFIG.ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    }).then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return ref; });
  }
  function wire(form) {
    if (!form) return;
    var doneId = form.getAttribute("data-done"), errId = form.getAttribute("data-error");
    var errorBox = errId ? document.getElementById(errId) : null;
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (errorBox) errorBox.classList.remove("show");
      var fd = new FormData(form);
      if (fd.get("company_fax")) { showDone(makeRef()); return; }
      var all = {};
      fd.forEach(function (v, k) { if (k !== "company_fax") all[k] = v.toString().trim(); });
      var name = all.name || ((all.first_name || "") + " " + (all.last_name || "")).trim() || all.contact_name || all.company_name || "";
      var fields = { name: name, email: all.email || "", phone: all.phone || "", message: all.message || all.description || all.additional_info || "" };
      if (!fields.name || !fields.email || !fields.phone) {
        if (errorBox) { errorBox.textContent = "Please include your name, email, and phone so the Southern Brothers team can reach you."; errorBox.classList.add("show"); }
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      capture(fields, form.getAttribute("data-form-type") || "general_inquiry", form.getAttribute("data-source") || "form", all)
        .then(function (ref) { showDone(ref); })
        .catch(function () {
          if (btn) btn.disabled = false;
          if (errorBox) { errorBox.textContent = "Something went wrong sending that — nothing was saved. Please try again, or call (832) 271-5436."; errorBox.classList.add("show"); }
        });
      function showDone(ref) {
        form.style.display = "none";
        var done = doneId ? document.getElementById(doneId) : null;
        if (done) {
          var refEl = done.querySelector(".done-ref");
          if (refEl) refEl.textContent = ref;
          done.hidden = false;
          done.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (form.id === "popup-lead-form") {
          var r2 = document.getElementById("popup-done-ref"); if (r2) r2.textContent = ref;
          showStep("done"); suppress7d();
        }
      }
    });
  }
  document.querySelectorAll("form.sb-lead-form").forEach(wire);

  /* Message Us widget — lead widget, not an AI chatbot */
  var backdrop = document.getElementById("msg-backdrop");
  if (!backdrop) return;
  var fab = document.getElementById("msg-fab");
  var stepPick = document.getElementById("msg-step-pick"), stepForm = document.getElementById("msg-step-form"), stepDone = document.getElementById("msg-step-done");
  function suppressed() { try { return Number(localStorage.getItem("sb_popup_suppress_until") || 0) > Date.now(); } catch (e) { return false; } }
  function suppress7d() { try { localStorage.setItem("sb_popup_suppress_until", String(Date.now() + 7 * 24 * 3600 * 1000)); } catch (e) {} }
  function showStep(w) { stepPick.hidden = w !== "pick"; stepForm.hidden = w !== "form"; stepDone.hidden = w !== "done"; }
  function openPopup() { showStep("pick"); backdrop.classList.add("open"); document.body.style.overflow = "hidden"; }
  function closePopup() { backdrop.classList.remove("open"); document.body.style.overflow = ""; }
  if (fab) fab.addEventListener("click", openPopup);
  ["msg-close", "msg-dismiss", "msg-done-close"].forEach(function (id) {
    var el = document.getElementById(id); if (el) el.addEventListener("click", function () { suppress7d(); closePopup(); });
  });
  backdrop.addEventListener("click", function (ev) { if (ev.target === backdrop) { suppress7d(); closePopup(); } });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && backdrop.classList.contains("open")) closePopup(); });
  var back = document.getElementById("msg-back"); if (back) back.addEventListener("click", function () { showStep("pick"); });
  backdrop.querySelectorAll(".pick-row").forEach(function (row) {
    row.addEventListener("click", function () {
      var dest = row.getAttribute("data-dest");
      if (dest) { window.location.href = dest; return; }
      var interest = row.getAttribute("data-interest") || "";
      var sel = document.getElementById("popup-interest"); if (sel) sel.value = interest;
      showStep("form");
    });
  });
  var isFormPage = /contact|bid-request|subcontractor/.test(window.location.pathname);
  var alreadyShown = false; try { alreadyShown = sessionStorage.getItem("sb_popup_shown") === "1"; } catch (e) {}
  if (!isFormPage && !alreadyShown && !suppressed()) {
    var fired = false;
    function maybeFire() {
      if (fired) return;
      var ae = document.activeElement;
      if (ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA" || ae.tagName === "SELECT")) return;
      fired = true; try { sessionStorage.setItem("sb_popup_shown", "1"); } catch (e) {}
      openPopup();
    }
    setTimeout(maybeFire, 20000);
    window.addEventListener("scroll", function () {
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      if (max > 0 && h.scrollTop / max >= 0.5) maybeFire();
    }, { passive: true });
  }
})();

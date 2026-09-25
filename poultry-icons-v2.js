/* ADINE POULTRY HEALTH CENTER - Dashboard icon refinement v1 */
(function(){
  "use strict";
  function apply(){
    if(!window.AdiPoultryIcons) return;
    const I=window.AdiPoultryIcons.ICON;
    I.farm='<svg class="adi-farm-detailed" viewBox="0 0 48 48"><path d="M3 20 24 11l21 9v20H3z"/><path d="M3 20h42M7 23h34M7 38h34"/><path d="M8 24v7M12 24v7M16 24v7M32 24v7M36 24v7M40 24v7"/><path d="M8 24h10v7H8zM30 24h10v7H30z"/><path d="M19 24h10v14H19z"/><path d="M21 38V28h6v10"/><path d="M12 20v-3h4v3M20 17v-4h4v4M28 17v-4h4v4M36 20v-3h4v3"/><circle cx="13" cy="8" r="3"/><path d="m11.5 8 1.5-1.2L14.5 8 13 9.2M21 8h6M24 5v6M32 8h6"/><circle cx="37" cy="8" r="3"/><path d="m35.5 8 1.5-1.2L38.5 8 37 9.2"/><path d="M4 40h40"/></svg>';
    I.flock='<svg viewBox="0 0 48 48"><circle cx="18" cy="16" r="6"/><path d="M7 37c1-7 5-11 11-11s10 4 11 11M12 16c0-4 3-6 6-6s6 2 6 6M24 16l7 2-7 2"/><circle cx="34" cy="25" r="5"/><path d="M27 40c1-6 3-9 7-10M31 25l6 2-6 2M18 34v6M23 34v6"/></svg>';
    I.weeklyReport='<svg viewBox="0 0 48 48"><path d="M13 6h20l7 7v29H13zM33 6v8h7M19 21h15M19 27h11M19 36l6-7 5 4 7-8"/></svg>';
    I.healthcare='<svg viewBox="0 0 48 48"><path d="M10 18h28v22H10zM16 18v-5a8 8 0 0 1 16 0v5M17 27h6M20 24v6M28 25h5M28 30h5M9 10h9M13.5 6v8"/></svg>';
    I.mortality='<svg viewBox="0 0 48 48"><circle cx="19" cy="16" r="6"/><path d="M8 37c1-7 5-11 11-11s10 4 11 11M13 16c0-4 2-6 6-6s6 2 6 6M25 16l7 2-7 2M34 6 44 23H24zM34 11v6M34 20h.01"/></svg>';
    I.report='<svg viewBox="0 0 48 48"><path d="M11 7h21l6 6v28H11zM32 7v7h6M17 22h15M17 28h9M17 36l5-6 5 4 7-9"/></svg>';
    I.accounting='<svg viewBox="0 0 48 48"><path d="M10 7h24a3 3 0 0 1 3 3v31H13a3 3 0 0 1-3-3zM16 15h14M16 21h9M16 28h3M16 34h3M25 39V30h5v9M32 39V25h5v14M13 39h24"/></svg>';
    I.archive='<svg viewBox="0 0 48 48"><path d="M7 10h34v8H7zM10 18h28v22H10zM7 10V7h34v3M18 25h12M18 31h12M20 18v-4h8v4"/></svg>';
    I.settings='<svg viewBox="0 0 48 48"><path d="M20 7h8l1 5 5 2 4-2 4 7-4 3v5l4 3-4 7-4-2-5 2-1 5h-8l-1-5-5-2-4 2-4-7 4-3v-5l-4-3 4-7 4 2 5-2z"/><circle cx="24" cy="24" r="7"/><circle cx="24" cy="24" r="2"/></svg>';
    I.professionals='<svg viewBox="0 0 48 48"><circle cx="20" cy="14" r="7"/><path d="M8 39c1-8 6-13 12-13s11 5 12 13M14 14c0-4 3-7 6-7s6 3 6 7M30 24h9v15h-9zM34.5 27v9M31.5 31.5h6M34 18v6M31 21h6"/></svg>';
    document.querySelectorAll(".menu-icon.adi-icon-ready").forEach(function(el){el.classList.remove("adi-icon-ready");});
    window.AdiPoultryIcons.scan();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",apply,{once:true});
  else apply();
})();
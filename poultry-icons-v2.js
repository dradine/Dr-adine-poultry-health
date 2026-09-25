/* ADINE POULTRY HEALTH CENTER - Unified dashboard icon system */
(function(){
  "use strict";

  const COLOR = "#68736f";

  function apply(){
    if(!window.AdiPoultryIcons) return;
    const I=window.AdiPoultryIcons.ICON;

    I.home='<svg viewBox="0 0 48 48"><path d="M6 22 24 7l18 15"/><path d="M10 20v21h28V20"/><path d="M19 41V29h10v12"/><path d="M15 25h5M28 25h5"/></svg>';

    I.accounting='<svg viewBox="0 0 48 48"><path d="M9 7h23a3 3 0 0 1 3 3v31H12a3 3 0 0 1-3-3z"/><path d="M15 14h13M15 20h9M15 26h6"/><path d="M25 41V31h5v10M32 41V25h5v16M39 41V19h3v22M12 41h30"/></svg>';

    I.professionals='<svg viewBox="0 0 48 48"><circle cx="20" cy="13" r="7"/><path d="M8 39c1-8 6-13 12-13s11 5 12 13"/><path d="M31 24h8v14h-8zM35 27v8M32 31h6"/><path d="M35 17v6M32 20h6"/></svg>';

    I.farm='<svg class="adi-farm-detailed" viewBox="0 0 96 48"><path d="M4 24 24 10l68 6v25H4z"/><path d="M4 24 24 10l68 6"/><path d="M24 10v31M24 16h68"/><path d="M10 28h10v9H10zM30 28h10v9H30zM45 25h45v10H45z"/><path d="M48 25v10M60 25v10M72 25v10M84 25v10"/><path d="M8 41h84"/><path d="M18 21v-5h6v5M35 16v-5h6v5M52 17v-5h6v5M69 18v-5h6v5M86 20v-5h6v5"/></svg>';

    I.flock='<svg viewBox="0 0 96 48"><path d="M7 23 48 7l41 16M14 21v22M82 21v22M22 25h52M22 25v16M74 25v16M22 41h52"/><path d="M36 32c0-5 3-8 7-8 4 0 7 3 7 8 0 4-3 7-7 7h-4l-3 2 1-4c-1-1-1-3-1-5z"/><circle cx="45" cy="28" r="1"/><path d="M50 30l5 2-5 2M39 38v3M47 38v3"/><ellipse cx="77" cy="37" rx="4" ry="5"/><ellipse cx="86" cy="37" rx="4" ry="5"/><path d="M10 43h78"/></svg>';

    I.weeklyReport='<svg viewBox="0 0 48 48"><path d="M12 6h20l7 7v29H12zM32 6v8h7"/><path d="M18 21h16M18 27h12M18 37l6-7 5 4 8-9"/></svg>';

    I.healthcare='<svg viewBox="0 0 48 48"><path d="M10 16h28v25H10zM16 16v-4a8 8 0 0 1 16 0v4"/><path d="M17 28h7M20.5 24.5v7M29 25h5M29 31h5"/></svg>';

    I.mortality='<svg viewBox="0 0 48 48"><circle cx="17" cy="16" r="6"/><path d="M7 37c1-7 5-11 10-11s9 4 10 11M12 16c0-4 2-6 5-6s5 2 5 6M22 16l6 2-6 2"/><path d="M35 6 45 23H25zM35 11v6M35 20h.01"/></svg>';

    I.report='<svg viewBox="0 0 48 48"><path d="M10 7h21l7 7v27H10zM31 7v8h7"/><path d="M16 21h15M16 27h10M16 37l5-6 5 4 7-9"/></svg>';

    I.archive='<svg viewBox="0 0 48 48"><path d="M7 10h34v8H7zM10 18h28v22H10zM18 25h12M18 31h12M19 6h10"/></svg>';

    I.settings='<svg viewBox="0 0 48 48"><path d="m20 7 4 3 4-3 4 4 5-1 1 6 4 3-3 5 3 5-4 3-1 6-5-1-4 4-4-3-5 1-1-6-4-3 3-5-3-5 4-3 1-6 5 1z"/><circle cx="24" cy="24" r="7"/><circle cx="24" cy="24" r="2"/></svg>';

    I.scale='<svg viewBox="0 0 48 48"><path d="M8 8h32v32H8z"/><path d="M14 15h20M14 21h12M15 36V27h5v9M23 36V23h5v13M31 36V18h4v18M13 39h24"/></svg>';

    I.report=I.report;

    document.querySelectorAll(".menu-icon.adi-icon-ready,.bottom-nav [data-icon].adi-icon-ready").forEach(function(el){
      el.classList.remove("adi-icon-ready");
    });
    window.AdiPoultryIcons.scan();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",apply,{once:true});
  }else{
    apply();
  }
})();
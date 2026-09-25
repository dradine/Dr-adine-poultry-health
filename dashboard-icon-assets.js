/* Compatibility shim for the approved dashboard icon renderer.
   The renderer itself lives only in dashboard-icon-fix.js.
   Keeping this file intentionally inert prevents two sprite engines from
   competing over the same DOM nodes. */
window.ADI_DASHBOARD_ICON_SPRITE = null;
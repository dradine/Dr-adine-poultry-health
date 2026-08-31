/*
 * LEGACY COMPATIBILITY SHIM — NOT A CALCULATION ENGINE
 * Canonical FCR owner: Supabase public.canonicalize_broiler_fcr()
 * This file intentionally contains no FCR or performance formulas.
 * It exists temporarily because weekly.html still references the legacy filename.
 */
(function(){
  'use strict';
  if (typeof window !== 'undefined') {
    window.AdinePerformance = window.AdinePerformance || {
      version: 'LEGACY-COMPAT-SHIM',
      canonical: function(rows){ return Array.isArray(rows) ? rows : []; },
      quality: function(){ return {ok:true, issues:[]}; }
    };
  }
})();

/* Expose the official broiler registry on window for report/runtime consumers.
   broiler-official-standards-v1.js intentionally declares the registry as a
   top-level lexical binding; report-engine reads it through window/global.
*/
(function (g) {
  if (typeof BROILER_OFFICIAL_STANDARDS_V1 !== 'undefined') {
    g.BROILER_OFFICIAL_STANDARDS_V1 = BROILER_OFFICIAL_STANDARDS_V1;
  }
})(typeof window !== 'undefined' ? window : globalThis);

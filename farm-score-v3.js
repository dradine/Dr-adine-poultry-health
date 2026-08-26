/* ADINE FARM SCORE LOADER
   The canonical implementation now lives in performance-period-engine-v8.js.
   This file is intentionally tiny so reports.html can keep its existing script order. */
(function(g){
  "use strict";
  if (g.__ADINE_CANONICAL_ENGINE_REQUESTED) return;
  g.__ADINE_CANONICAL_ENGINE_REQUESTED = true;
  if (typeof document !== "undefined" && document.write) {
    document.write('<script src="performance-period-engine-v8.js"><\\/script>');
  }
})(window);
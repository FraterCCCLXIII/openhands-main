/**
 * Reo Analytics Initialization Script
 * This script dynamically loads the Reo analytics library and initializes it
 * after the critical render path has completed.
 */
(function() {
  var clientID = "6bac7145b4ee6ec";
  var loaded = false;

  function loadReo() {
    if (loaded) return;
    loaded = true;

    var script = document.createElement("script");
    script.src = "https://static.reo.dev/" + clientID + "/reo.js";
    script.async = true;
    script.defer = true;

    script.onload = function() {
      if (window.Reo) {
        window.Reo.init({ clientID: clientID });
      }
    };

    document.head.appendChild(script);
  }

  function scheduleAfterLoad() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadReo, { timeout: 3000 });
    } else {
      window.setTimeout(loadReo, 1500);
    }
  }

  if (document.readyState === "complete") {
    scheduleAfterLoad();
  } else {
    window.addEventListener("load", scheduleAfterLoad, { once: true });
  }
})();

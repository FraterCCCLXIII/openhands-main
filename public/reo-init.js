/**
 * Reo Analytics Initialization Script
 * This script dynamically loads the Reo analytics library and initializes it
 */
(function() {
  var clientID = "6bac7145b4ee6ec";
  var script = document.createElement("script");
  
  script.src = "https://static.reo.dev/" + clientID + "/reo.js";
  script.defer = true;
  
  script.onload = function() {
    if (window.Reo) {
      window.Reo.init({ clientID: clientID });
    }
  };
  
  document.head.appendChild(script);
})();


(function(window, angular) {
  "use strict";

  var module = angular.module('player-api', ['settings']);

  module.factory('playerApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Logs in by name
        get: function (fn) {
          $.get(url + '/player')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              err = new Error(err);
              err.status = jqXHR.status;
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);
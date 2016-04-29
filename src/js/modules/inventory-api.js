(function(window, angular) {
  "use strict";

  var module = angular.module('inventory-api', ['settings']);

  module.factory('inventoryApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Gets player inventory
        get: function (fn) {
          $.get(url + '/inventory')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);
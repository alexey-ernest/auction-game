(function(window, angular) {
  "use strict";

  var module = angular.module('auth-api', ['settings']);

  module.factory('authApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Logs in by name
        login: function (name, fn) {
          var data = {
            name: name
          };

          $.ajax({
            url: url + '/login',
            type: 'POST',
            data: data
          }).done(function(result, status, jqXHR) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Logs out
        logout: function (token, fn) {
          $.ajax({
            url: url + '/logout',
            type: 'DELETE',
            headers: {'Authorization': 'JWT ' + token}
          }).done(function(result) {
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
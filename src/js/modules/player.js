(function (window, angular) {
    "use strict";

    var module = angular.module('player', ['ngCookies']);

    module.factory('player', ['$window', '$cookies', function ($window, $cookies) {
      var cookieKey = 'player';
      return {
        set: function (data) {
          var now = new $window.Date();
          var exp = new $window.Date(now.getFullYear(), now.getMonth() + 1, now.getDate()); // this will set the expiration to 1 month
          $cookies.putObject(cookieKey, data, { expires: exp });
        },
        get: function () {
          return $cookies.getObject(cookieKey);
        }
      };
    }
  ]);

})(window, window.angular);
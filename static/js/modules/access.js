(function (window, angular) {
  "use strict";

  var module = angular.module('access', []);

  module.factory('access', [function () {
    var token;
    return {
      token: function (data) {
        if (data) {
          token = data;
        }
        return token;
      }
    };
  }]);

})(window, window.angular);
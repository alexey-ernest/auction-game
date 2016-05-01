(function (angular, io) {
  "use strict";

  var module = angular.module('socket', []);

  module.factory('socket', [function () {
    return io();
  }]);

})(window.angular, window.io);
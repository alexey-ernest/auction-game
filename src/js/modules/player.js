(function (window, angular) {
    "use strict";

    var module = angular.module('player', []);

    module.factory('player', [function () {
      var player;
      return {
        set: function (data) {
          player = data;
        },
        get: function () {
          return player;
        }
      };
    }
  ]);

})(window, window.angular);
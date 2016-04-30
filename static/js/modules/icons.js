(function (window, angular) {
  "use strict";

  var module = angular.module('icons', []);

  var icons = {
    'bread': 'flaticon-bread-silhouette-side-view',
    'carrot': 'flaticon-carrot',
    'diamond': 'flaticon-jewelry-stone',
    'default': 'fa fa-star-o'
  };

  module.factory('icons', [function () {
    var token;
    return {
      getIcon: function (item) {
        return icons[item] || icons['default'];
      }
    };
  }]);

})(window, window.angular);
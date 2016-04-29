(function(window, angular) {
    "use strict";

    var module = angular.module('home', [
      'ui.router',
      'access'
    ]);

    // Routes
    module.config([
      '$stateProvider', function ($stateProvider) {
        $stateProvider
          .state('home', {
            url: '/auction',
            templateUrl: 'home.html',
            controller: 'HomeCtrl',
            data: {
              pageTitle: 'Crossover Auction Game'
            }
          });
        }
    ]);

    // Controllers
    module.controller('HomeCtrl', [
      '$scope', '$state', 'access',
      function ($scope, $state, access) {
        if (!access.token()) {
          return $state.go('login');
        }
      }
    ]);
    
})(window, window.angular);
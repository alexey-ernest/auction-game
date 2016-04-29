(function(window, angular) {
    "use strict";

    var module = angular.module('home', [
      'ui.router',
      'player'
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
      '$scope', '$state', 'player',
      function ($scope, $state, player) {
        player = player.get();
        if (!player) {
          return $state.go('login');
        }

        $scope.player = player;
      }
    ]);
    
})(window, window.angular);
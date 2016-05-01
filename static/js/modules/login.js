(function (window, angular) {
    "use strict";

    var module = angular.module('login', [
      'ui.router',
      'auth-api',
      'player-api',
      'access',
      'player',
      'events'
    ]);

    // Routes
    module.config([
      '$stateProvider', function ($stateProvider) {
        $stateProvider
          .state('login', {
            url: '/',
            templateUrl: 'login.html',
            controller: 'LoginCtrl',
            data: {
              pageTitle: 'Log in to Crossover Auction Game'
            }
          });
        }
    ]);

    // Controllers
    module.controller('LoginCtrl', [
      '$scope', '$state', 'authApi', 'playerApi', 'access', 'player', 'events', '$mdDialog',
      function ($scope, $state, authApi, playerApi, access, player, events, $mdDialog) {

        $scope.login = {};
        $scope.loading = false;

        $scope.submit = function (params) {
          $scope.loading = true;
          authApi.login(params.name, function (err, data) {
            if (err) {
              $scope.loading = false;
              console.error(err.message);
              return $mdDialog.show($mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Log in error')
                .content('Something wrong with a server.')
                .ok('Ok'));
            }

            access.token(data.token);
            player.set(null);

            // loading player data
            playerApi.get(access.token(), function (err, data) {
              $scope.loading = false;
              if (err) console.error(err.message);

              player.set(data);
              $scope.$emit(events.login, data);
              $state.go('home');
            });
          });
        };
      }
    ]);
})(window, window.angular);
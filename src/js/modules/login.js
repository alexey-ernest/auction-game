(function (window, angular) {
    "use strict";

    var module = angular.module('login', [
      'ui.router',
      'auth-api',
      'player'
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
              pageTitle: 'Log in to the Auction Game'
            }
          });
        }
    ]);

    // Controllers
    module.controller('LoginCtrl', [
      '$scope', '$state', 'authApi', 'player', '$mdDialog',
      function ($scope, $state, authApi, player, $mdDialog) {

        $scope.login = {};
        $scope.loading = false;

        $scope.submit = function (params) {
          $scope.loading = true;
          authApi.login(params.name, function (err, data) {
            $scope.loading = false;
            if (err) {
              console.error(err.message);
              return $mdDialog.show($mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Log in error')
                .content('Something wrong with the server.')
                .ok('Ok'));
            }

            player.set(data);
            $state.go('home');
          });
        };
      }
    ]);
})(window, window.angular);
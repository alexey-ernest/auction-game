(function (window, angular) {
    "use strict";

    var module = angular.module('login', [
      'ui.router',
      'auth-api',
      'access',
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
              pageTitle: 'Auction Game - Log in'
            }
          });
        }
    ]);

    // Controllers
    module.controller('LoginCtrl', [
      '$scope', '$state', 'authApi', 'access', 'player', '$mdDialog',
      function ($scope, $state, authApi, access, player, $mdDialog) {

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
                .content('Something wrong with a server.')
                .ok('Ok'));
            }

            access.token(data.token);
            player.set(null);
            $state.go('home');
          });
        };
      }
    ]);
})(window, window.angular);
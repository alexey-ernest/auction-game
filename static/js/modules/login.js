(function (window, angular) {
    "use strict";

    var module = angular.module('login', [
      'ui.router',
      'auth-api',
      'access'
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
      '$scope', '$state', 'authApi', 'access', '$mdDialog',
      function ($scope, $state, authApi, access, $mdDialog) {

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
            $state.go('home');
          });
        };
      }
    ]);
})(window, window.angular);
(function (angular) {
  "use strict";

  var module = angular.module('stats', [
    'player-api', 
    'auth-api', 
    'access', 
    'player'
  ]);
  
  module.directive('auctionStats', [
    '$interval', 'playerApi', 'player', '$state', 'authApi', 'access',
    function($interval, playerApi, player, $state, authApi, access) {

      return {
        restrict: 'EA',
        scope: {},
        templateUrl: 'stats.html',
        link: function($scope, element) {
          $scope.player = player.get();

          // polling player data
          var timeoutId = $interval(function() {
            if (!access.token()) return;

            playerApi.get(access.token(), function (err, data) {
              if (err && err.status === 401) {
                access.token(null);
                return $state.go('login');
              }

              if (err) return console.error(err);

              player.set(data);
              $scope.player = data;
            });
          }, 1000);

          // destructor
          $scope.$on('$destroy', function() {
            $interval.cancel(timeoutId);
          });

          $scope.logout = function () {
            authApi.logout(access.get(), function (err) {
              if (err) return console.error(err);
              access.token(null);
              $state.go('login');
            });
          };
        }
      };
  }]);

})(window.angular);

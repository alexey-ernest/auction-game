(function (angular) {
  "use strict";

  var module = angular.module('stats', [
    'player-api', 
    'auth-api', 
    'access', 
    'player',
    'events'
  ]);
  
  module.directive('auctionStats', [
    'playerApi', 'player', '$state', 'authApi', 'access', 'events',
    function(playerApi, player, $state, authApi, access, events) {

      function loadPlayerData($scope) {
        if (!access.token()) return $state.go('login');

        $scope.loading = true;
        playerApi.get(access.token(), function (err, data) {
          $scope.loading = false;
          if (err && err.status === 401) {
            access.token(null);
            return $state.go('login');
          }

          if (err) return console.error(err);

          player.set(data);
          $scope.player = data;
          $scope.$digest();
        });
      }

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'stats.html',
        link: function($scope) {

          $scope.loading = false;
          $scope.player = player.get();
          
          if (!$scope.player) {
            loadPlayerData($scope);
          }

          $scope.$on(events.auctionCompleted, function() {
            // reloading player data
            loadPlayerData($scope);
          });

          $scope.logout = function () {
            authApi.logout(access.token(), function (err) {
              if (err) return console.error(err);

              access.token(null);
              $state.go('login');
            });
          };
        }
      };
  }]);

})(window.angular);

angular.module('stats', ['player-api', 'auth-api']).directive('auctionStats', [
  '$interval', 'playerApi', 'player', '$state', 'authApi', function($interval, playerApi, player, $state, authApi) {

    return {
      restrict: 'EA',
      scope: {},
      templateUrl: 'stats.html',
      link: function($scope, element) {
        $scope.player = player.get();

        // polling player data
        var timeoutId = $interval(function() {
          if (!player.get()) return;

          playerApi.get(function (err, data) {
            if (err && err.status === 401) {
              return $state.go('login');
            }

            if (err) return console.error(err);

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
          authApi.logout(function (err) {
            if (err) return console.error(err);
            $state.go('login');
          });
        };
      }
    };
  }
]);
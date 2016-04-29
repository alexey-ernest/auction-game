angular.module('game', ['auction-api']).directive('auctionGame', [
  '$interval', 'auctionApi', 'player', '$mdDialog',
  function($interval, auctionApi, player, $mdDialog) {

    return {
      restrict: 'EA',
      scope: {},
      templateUrl: 'game.html',
      link: function($scope, element) {
        $scope.loading = false;
        $scope.player = player.get();
        $scope.auction = null;
        $scope.latest = null;
        $scope.timeLeft = 0;

        var $baseScope = $scope;

        // polling player data
        var timeoutId = $interval(function() {
          if (!player.get()) return;

          $scope.loading = true;
          auctionApi.getCurrent(function (err, data) {
            $scope.loading = false;
            if (err) return console.error(err);
            
            if (!data || !data.id) {
              data = null;
              // getting latest auction
              auctionApi.getLatest(function (err, latest) {
                if (err) return console.error(err);
                
                if (!latest.id) {
                  latest = null;
                }
                $scope.latest = latest;
              });
            } else {
              var end = moment.utc(data.end_time);
              var now = moment();
              now = now.add(-now.utcOffset(), 'm').utc(); // convert current time to UTC
              $scope.timeLeft = end.diff(now, 's');
            }
            
            $scope.latest = null;
            $scope.auction = data;  
          });
        }, 1000);

        // destructor
        $scope.$on('$destroy', function() {
          $interval.cancel(timeoutId);
        });

        // confirm auction
        function betController($scope, $mdDialog) {
          $scope.player = player.get();
          $scope.bet = $baseScope.bet;
          $scope.auction = $baseScope.auction;

          $scope.hide = function() {
            $mdDialog.hide();
          };
          $scope.cancel = function() {
            $mdDialog.cancel();
          };
          $scope.confirm = function(data) {
            $mdDialog.hide(data);
          };
        }

        $scope.doBet = function (e) {
          $scope.bet = {
            bid: $scope.auction.bid ? $scope.auction.bid + 1 : $scope.auction.min_bid
          };

          $mdDialog.show({
            controller: betController,
            templateUrl: 'bet-dialog.html',
            parent: angular.element(document.body),
            targetEvent: e,
            clickOutsideToClose: true,
            fullscreen: false
          })
          .then(function (data) {
            auctionApi.bet(data.bid, function (err) {
              if (err) {
                console.log(err.message);
                return $mdDialog.show($mdDialog.alert()
                  .clickOutsideToClose(true)
                  .title('Failed to place a bid')
                  .content('Try again.')
                  .ok('Ok'));
                }

              return $mdDialog.show($mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Bid placed')
                .content('Your bid has been successfully placed.')
                .ok('Ok'));
            });
          });
        };
      }
    };
  }
]);
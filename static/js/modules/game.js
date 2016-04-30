(function (angular) {
  "use strict";

  var module = angular.module('game', [
    'auction-api', 
    'access',
    'icons'
  ]);

  module.directive('auctionGame', [
    '$interval', 'auctionApi', 'player', 'access', 'icons', '$mdDialog',
    function($interval, auctionApi, player, access, icons, $mdDialog) {

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'game.html',
        link: function($scope, element) {
          $scope.loading = false;
          $scope.auction = null;
          $scope.latest = null;
          $scope.timeLeft = 0;
          $scope.canBet = false;

          $scope.player = player.get();
          $scope.$watch(function() { 
            return player.get();
          }, function(value) {
            $scope.player = value;
          });

          var $baseScope = $scope;

          // polling player data
          var timeoutId = $interval(function() {
            if (!access.token()) return;

            $scope.loading = true;
            auctionApi.getCurrent(access.token(), function (err, data) {
              $scope.loading = false;
              if (err) return console.error(err);
              
              if (!data || !data.id) {
                data = null;
                // getting latest auction
                auctionApi.getLatest(access.token(), function (err, latest) {
                  if (err) return console.error(err);
                  
                  if (latest && !latest.id) {
                    latest = null;
                  }
                  if (latest) {
                    latest.icon = icons.getIcon(latest.item);
                  }
                  $scope.latest = latest;
                });
              } else {
                var end = moment(data.end_time);
                var now = moment();
                $scope.timeLeft = end.diff(now, 's');
                $scope.canBet = $scope.player && $scope.player.id !== data.seller;

                data.icon = icons.getIcon(data.item);
                data.min_bid = data.bid ? data.bid + 1 : data.min_bid;
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
              auctionApi.bet(access.token(), data.bid, function (err) {
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

})(window.angular);
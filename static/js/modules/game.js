(function (angular) {
  "use strict";

  var module = angular.module('game', [
    'auction-api', 
    'access',
    'icons',
    'events'
  ]);

  module.directive('auctionGame', [
    'auctionApi', 'player', 'access', 'icons', 'events', '$mdDialog',
    function(auctionApi, player, access, icons, events, $mdDialog) {

      function loadCurrentAuction($scope) {
        if (!access.token()) return;

        $scope.loading = true;
        auctionApi.getCurrent(access.token(), function (err, data) {
          $scope.loading = false;
          if (err) return console.error(err);
          
          if (data && data.id) {
            data.icon = icons.getIcon(data.item);
            data.min_bid = data.bid ? data.bid + 1 : data.min_bid;
            $scope.canBet = $scope.player && $scope.player.id !== data.seller;
          } else {
            data = null;
          }

          $scope.auction = data;
        });
      }

      function updateAuction($scope, data) {
        if (data) {
          data.icon = icons.getIcon(data.item);
        }

        $scope.auction = data;
        $scope.canBet = $scope.player && $scope.player.id !== data.seller;
        $scope.$digest();
      }

      function loadLatestAuction($scope) {
        if (!access.token()) return;

        $scope.loading = true;

        auctionApi.getLatest(access.token(), function (err, latest) {
          $scope.loading = false;
          if (err) return console.error(err);
          
          if (latest && latest.id) {
            latest.icon = icons.getIcon(latest.item);
          } else {
            latest = null;
          }

          $scope.latest = latest;
          $scope.$digest();
        });
      }

      return {
        restrict: 'EA',
        scope: {},
        replace: true,
        templateUrl: 'game.html',
        link: function($scope) {

          $scope.player = player.get();
          $scope.$watch(function() { 
            return player.get();
          }, function(value) {
            $scope.player = value;
          });

          var $baseScope = $scope;

          loadCurrentAuction($scope);
          loadLatestAuction($scope);

          $scope.$on(events.auctionStarted, function() {
            $scope.latest = null;
            loadCurrentAuction($scope);
          });
          $scope.$on(events.auctionUpdated, function(event, data) {
            updateAuction($scope, data);
          });
          $scope.$on(events.auctionCompleted, function() {
            $scope.auction = null;
            loadLatestAuction($scope);
          });
          $scope.$on(events.noAuctions, function() {
            if ($scope.auction || $scope.latest) {
              $scope.auction = null;
              $scope.latest = null;
              $scope.$digest();
            }
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
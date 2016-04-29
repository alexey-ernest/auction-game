angular.module('inventory', ['inventory-api', 'auction-api']).directive('auctionInventory', [
  '$interval', 'inventoryApi', 'auctionApi', 'player', '$mdDialog',
  function($interval, inventoryApi, auctionApi, player, $mdDialog) {

    return {
      restrict: 'EA',
      scope: {},
      templateUrl: 'inventory.html',
      link: function($scope, element) {
        $scope.loading = false;
        $scope.inventory = [];
        $scope.newAuction = {};

        var $baseScope = $scope;

        // polling player data
        var timeoutId = $interval(function() {
          if (!player.get()) return;

          $scope.loading = true;
          inventoryApi.get(function (err, items) {
            $scope.loading = false;
            if (err) return console.error(err);
            
            $scope.inventory = items;
          });
        }, 1000);

        // destructor
        $scope.$on('$destroy', function() {
          $interval.cancel(timeoutId);
        });

        // confirm auction
        function dialogController($scope, $mdDialog) {
          $scope.auction = $baseScope.newAuction;

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

        $scope.auction = function (item, e) {
          $scope.newAuction = {
            item: item,
            quantity: 1,
            min_bid: 1
          };

          $mdDialog.show({
            controller: dialogController,
            templateUrl: 'auction-dialog.html',
            parent: angular.element(document.body),
            targetEvent: e,
            clickOutsideToClose: true,
            fullscreen: false
          })
          .then(function (data) {
            auctionApi.start(data.item.item, data.quantity, data.min_bid, function (err) {
              if (err) {
                console.log(err.message);
                return $mdDialog.show($mdDialog.alert()
                  .clickOutsideToClose(true)
                  .title('Failed to start auction')
                  .content('Try again.')
                  .ok('Ok'));
                }

              return $mdDialog.show($mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Auction queued')
                .content('Auction successfully added to the queue.')
                .ok('Ok'));
            });
          });
        };
      }
    };
  }
]);
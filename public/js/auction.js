(function(window, angular) {
  "use strict";

  var module = angular.module('auction-api', ['settings']);

  module.factory('auctionApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        
        // Adds auction to the queue
        start: function (item, quantity, min_bid, fn) {
          var data = {
            item: item,
            quantity: quantity,
            min_bid: min_bid
          };
          $.post(url + '/auction', data)
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Makes a bet
        bet: function (bid, fn) {
          var data = {
            bid: bid
          };
          $.post(url + '/auction/bet', data)
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Gets current auction
        getCurrent: function (fn) {
          $.get(url + '/auction')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Gets latest
        getLatest: function (fn) {
          $.get(url + '/auction/latest')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);
(function(window, angular) {
  "use strict";

  var module = angular.module('auth-api', ['settings']);

  module.factory('authApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Logs in by name
        login: function (name, fn) {
          var data = {
            name: name
          };

          $.ajax({
            url: url + '/login',
            type: 'POST',
            data: data
          })
            .done(function(result, status, jqXHR) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        },

        // Logs out
        logout: function (fn) {
          $.ajax({
            url: url + '/logout',
            type: 'DELETE'
          })
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);
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
(function(window, angular) {
    "use strict";

    var module = angular.module('home', [
      'ui.router',
      'player'
    ]);

    // Routes
    module.config([
      '$stateProvider', function ($stateProvider) {
        $stateProvider
          .state('home', {
            url: '/auction',
            templateUrl: 'home.html',
            controller: 'HomeCtrl',
            data: {
              pageTitle: 'Crossover Auction Game'
            }
          });
        }
    ]);

    // Controllers
    module.controller('HomeCtrl', [
      '$scope', '$state', 'player',
      function ($scope, $state, player) {
        player = player.get();
        if (!player) {
          return $state.go('login');
        }

        $scope.player = player;
      }
    ]);
    
})(window, window.angular);
(function(window, angular) {
  "use strict";

  var module = angular.module('inventory-api', ['settings']);

  module.factory('inventoryApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Gets player inventory
        get: function (fn) {
          $.get(url + '/inventory')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);
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
(function(window, angular) {
  "use strict";

  var module = angular.module('player-api', ['settings']);

  module.factory('playerApi', [
    'urls', function (urls) {
      var url = urls.api;

      return {
        // Logs in by name
        get: function (fn) {
          $.get(url + '/player')
            .done(function(result) {
              fn(null, result);
            })
            .fail(function(jqXHR, textStatus, err) {
              err = new Error(err);
              err.status = jqXHR.status;
              fn(err);
            });
        }
      };
    }
  ]);  
    
})(window, window.angular);
(function (window, angular) {
    "use strict";

    var module = angular.module('player', ['ngCookies']);

    module.factory('player', ['$window', '$cookies', function ($window, $cookies) {
      var cookieKey = 'player';
      return {
        set: function (data) {
          var now = new $window.Date();
          var exp = new $window.Date(now.getFullYear(), now.getMonth() + 1, now.getDate()); // this will set the expiration to 1 month
          $cookies.putObject(cookieKey, data, { expires: exp });
        },
        get: function () {
          return $cookies.getObject(cookieKey);
        }
      };
    }
  ]);

})(window, window.angular);
(function (angular) {
    "use strict";

    angular.module('settings', [])
      .constant('urls', {
        api: '/api'
      });
}) ((window.angular));
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
(function (angular) {
    'use strict';

    var app = angular.module('auction', [
      'ui.router', // for ui routing
      'ngMaterial', // activate material design
      'home',
      'login',
      'stats',
      'inventory',
      'game'
    ]);

    // Config
    app.config([
      '$urlRouterProvider', '$locationProvider', '$stateProvider', '$mdThemingProvider',
      function ($urlRouterProvider, $locationProvider, $stateProvider, $mdThemingProvider) {
        
        // routes
        $stateProvider
          .state('auction', {
            'abstract': true,
            template: '<div ui-view></div>'
          });

        $urlRouterProvider.otherwise('/');

        // theme
        $mdThemingProvider.theme('default')
          .primaryPalette('grey')
          .accentPalette('green', {
            'default': '500',
            'hue-1': '200',
            'hue-2': '700',
            'hue-3': 'A200'
          });
      }
    ]);

    // Main application controller
    app.controller('AuctionCtrl', [
      '$rootScope',
      function ($rootScope) {

        $rootScope.pageTitle = 'Crossover Auction Game';
        $rootScope.$on('$stateChangeSuccess', function (event, toState/*, toParams, from, fromParams*/) {
          if (angular.isDefined(toState.data) && angular.isDefined(toState.data.pageTitle)) {
            $rootScope.pageTitle = toState.data.pageTitle;
          }
        });
      }
    ]);

})((window.angular));
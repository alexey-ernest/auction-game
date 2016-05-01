(function (angular) {
  'use strict';

  var app = angular.module('auction', [
    'ui.router', // for ui routing
    'ngMaterial', // activate material design
    'home',
    'login',
    'stats',
    'inventory',
    'game',
    'socket',
    'events',
    'access',
    'player'
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

      // defining themes
      var lightGreenTheme = $mdThemingProvider.extendPalette('light-green', {
        'contrastLightColors': ['500']
      });
      $mdThemingProvider.definePalette('light-green-auction', lightGreenTheme);

      var deepPurpleTheme = $mdThemingProvider.extendPalette('deep-purple', {
        'contrastLightColors': ['500']
      });
      $mdThemingProvider.definePalette('deep-purple-auction', deepPurpleTheme);

      // configuring themes
      $mdThemingProvider.theme('default')
        .backgroundPalette('grey', {
          'default': '100'
        })
        .primaryPalette('deep-purple-auction', {
          'default': '500',
          'hue-1': '700',
          'hue-2': '100'
        })
        .accentPalette('light-green-auction', {
          'default': '500'
        });
    }
  ]);

  // Main application controller
  app.controller('AuctionCtrl', [
    '$rootScope', '$state', 'socket', 'events', 'access', 'player',
    function ($rootScope, $state, socket, events, access, player) {

      // Client events
      $rootScope.$on(events.login, function (event, player) {
        socket.emit('login', player.id);
      });

      // Server events
      socket.on('logout', function () {
        $rootScope.$broadcast(events.logout);
        access.token(null);
        player.set(null);
        $state.go('login');
      });

      socket.on('auction-started', function () {
        $rootScope.$broadcast(events.auctionStarted);
      });

      socket.on('auction-updated', function (data) {
        $rootScope.$broadcast(events.auctionUpdated, data);
      });

      socket.on('auction-completed', function () {
        $rootScope.$broadcast(events.auctionCompleted);
      });

      socket.on('no-auctions', function () {
        $rootScope.$broadcast(events.noAuctions);
      });

      $rootScope.pageTitle = 'Crossover Auction Game';
      $rootScope.$on('$stateChangeSuccess', function (event, toState/*, toParams, from, fromParams*/) {
        if (angular.isDefined(toState.data) && angular.isDefined(toState.data.pageTitle)) {
          $rootScope.pageTitle = toState.data.pageTitle;
        }
      });
    }
  ]);

})((window.angular));
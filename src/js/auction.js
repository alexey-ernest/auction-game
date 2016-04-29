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
//= require jquery
//= require jquery_ujs
//= require angular/angular
//= require angular-ui-router/release/angular-ui-router
//= require_self
//= require_tree .

angular
  .module('myApp', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider
      .state('notesIndex', {
        url: '/notes',
        component: 'notesIndex'
      })
      .state('notesShow', {
        url: '/notes/:id',
        component: 'notesShow'
      })
      .state('notesNew', {
        url: '/notes/new',
        component: 'notesNew'
      })
      .state('notesEdit', {
        url: '/notes/:id/edit',
        component: 'notesEdit'
      });

    // default fall back route
    $urlRouterProvider.otherwise('/notes');

    // enable HTML5 Mode for SEO
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
  });

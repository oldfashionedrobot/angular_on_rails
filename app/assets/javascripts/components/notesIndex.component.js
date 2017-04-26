angular
  .module('myApp')
  .component('notesIndex', {
    templateUrl: 'notesIndex.template.html',
    controller: NotesIndexController
  });

NotesIndexController.$inject = ['$http'];

function NotesIndexController($http) {
  var vm = this;

  vm.notes = [];

  $http.get('/api/notes').then(function(resp) {
    vm.notes = resp.data;
  });
}

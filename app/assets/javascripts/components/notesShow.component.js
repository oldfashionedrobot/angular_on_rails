angular
  .module('myApp')
  .component('notesShow', {
    templateUrl: 'notesShow.template.html',
    controller: NotesShowController
  });

NotesShowController.$inject = ['$http', '$stateParams'];

function NotesShowController($http, $stateParams) {
  var vm = this;

  vm.note = {};

  $http.get('/api/notes/' + $stateParams.id).then(function(resp) {
    vm.note = resp.data;
  });
}

angular
  .module('notesApp')
  .controller('NotesShowController', NotesShowController);

NotesShowController.$inject = ['$stateParams', 'notesService'];

function NotesShowController($stateParams, notesService) {
  var vm = this;

  vm.note = {};

  notesService.getNote($stateParams.id).then(function(resp) {
    vm.note = resp.data;
  });
}

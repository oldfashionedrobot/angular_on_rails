angular
  .module('notesApp')
  .controller('NotesIndexController', NotesIndexController);

NotesIndexController.$inject = ['notesService'];

function NotesIndexController(notesService) {
  var vm = this;

  vm.notes = [];

  notesService.getNotes().then(function(resp) {
    vm.notes = resp.data;
  });
}

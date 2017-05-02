angular
  .module('notesApp')
  .controller('NotesEditController', NotesEditController);

NotesEditController.$inject = ['$stateParams', '$state', 'notesService',];

function NotesEditController($stateParams, $state, notesService) {
  var vm = this;

  vm.note = {};

  vm.saveNote = saveNote;

  notesService.getNote($stateParams.id).then(function(resp) {
    vm.note = resp.data;
  });

  function saveNote() {
    notesService.updateNote(vm.note).then(function(resp) {
      if(resp.status == 200) {
        $state.go('notesShow', { id: resp.data.id })
      } else {
        alert('Something went wrong when trying to update')
      }
    });
  }
}

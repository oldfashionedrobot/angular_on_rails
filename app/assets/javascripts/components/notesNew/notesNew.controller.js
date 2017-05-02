angular
  .module('notesApp')
  .controller('NotesNewController', NotesNewController);

NotesNewController.$inject = ['$state', 'notesService'];

function NotesNewController($state, notesService) {
  var vm = this;

  vm.note = {
    title: '',
    body: '',
    category: ''
  };

  vm.saveNote = saveNote;

  function saveNote() {
    notesService.createNote(vm.note).then(function(resp) {
      if(resp.status == 201) {
        $state.go('notesShow', { id: resp.data.id })
      } else {
        alert('Something went wrong when trying to create')
      }
    });
  }
}

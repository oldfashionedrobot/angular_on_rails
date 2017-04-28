angular
  .module('notesApp')
  .factory('notesService', notesService);

notesService.$inject = ['$http'];

function notesService($http) {
  var service = {};

  service.getNotes = getNotes;
  service.getNote = getNote;
  service.createNote = createNote;
  service.updateNote = updateNote;

  return service;

  function getNotes() {
    return $http.get('/api/notes');
  }

  function getNote(id) {
    return $http.get('/api/notes/' + id);
  }

  function createNote(note) {
    return $http.post('/api/notes/', note);
  }

  function updateNote(note) {
    return $http.put('/api/notes/' + note.id, note);
  }
}
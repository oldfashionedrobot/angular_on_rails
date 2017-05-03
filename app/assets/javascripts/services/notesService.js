angular
  .module('notesApp')
  .factory('notesService', notesService);

notesService.$inject = ['$http'];

function notesService($http) {
  var factory = {};

  factory.getNotes = function() {
    return $http.get('/api/notes');
  };

  factory.getNote = function(id) {
    return $http.get('/api/notes/' + id);
  }

  return factory;
}


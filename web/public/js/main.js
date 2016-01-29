var app = angular.module('myApp', []);


app.controller('statusControler', ['$scope', function($scope) {
  $scope.greeting = 'Hola!';
}]);
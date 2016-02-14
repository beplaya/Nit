

angular.module('nitForGitTeamApp').controller('glimrGraphController', ['$scope', 'glimrData',
                                 function($scope, glimrData) {
    $scope.glimrData = glimrData;
    $scope.glimrData.addListener(function(){
        Highcharts.chart('glimrGraphControllerContainer', {

        xAxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        },

        series: [{
            data: [29.9, 71.5, 100*Math.random(), 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
        }]});
    });
}]);

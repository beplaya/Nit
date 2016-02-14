

angular.module('nitForGitTeamApp').controller('glimrGraphController', ['$scope', 'glimrData',
                                 function($scope, glimrData) {
    $scope.glimrData = glimrData;
    $scope.max = 15;
    $scope.glimrData.addListener(function(){
        var sprintNames = [];
        var numberOfCardsMergedArray = [];
        var numberOfCardsWorkedArray = [];
        var numberOfCommitsArray = [];
        var numberOfAuthorsArray = [];
        var sprints = $scope.glimrData.allSprints.reverse();
        for(var i=0; (i<sprints.length && i<$scope.max); i++) {
            sprintNames.push(sprints[i].name);
            numberOfCardsWorkedArray.push(sprints[i].logsAnalysis.cards.length);
            numberOfCommitsArray.push(sprints[i].logsAnalysis.logObjects.length);
            numberOfAuthorsArray.push(sprints[i].logsAnalysis.authors.length);
            var cardsWorked = sprints[i].logsAnalysis.cards;
            var numberOfCardsMerged = 0;
            for(var j=0; j<cardsWorked.length; j++) {
                var commits = cardsWorked[j].commits;
                for(var k=0; k<commits.length; k++) {
                    if(commits[k].pullRequest.isPullRequest) {
                        numberOfCardsMerged++;
                        break
                    }
                }
            }
            numberOfCardsMergedArray.push(numberOfCardsMerged);
        }
        sprintNames.reverse();
        numberOfCardsWorkedArray.reverse();
        numberOfCardsMergedArray.reverse();
        numberOfCommitsArray.reverse();
        numberOfAuthorsArray.reverse();

        var graphData = {
            title: {text:"GLIMR Sprint Report"},
            xAxis: {
                categories: sprintNames
            },
            yAxis: [
                {
                    gridLineWidth: 1,
                    title: {
                        text: '# of Cards'
                    }
                },{
                    gridLineWidth: 1,
                    title: {
                        text: '# of Commits'
                    },
                    opposite : true
                },{
                    gridLineWidth: 1,
                    title: {
                        text: '# of Unique Authors'
                    },
                    opposite : true
                }
            ],
            series: [
                { data: numberOfCardsWorkedArray, name:"Cards With Commits", yAxis: 0}
                ,{ data: numberOfCardsMergedArray, name:"Cards Merged", yAxis: 0}
                ,{ data: numberOfCommitsArray, name:"Commits", yAxis: 1}
                ,{ data: numberOfAuthorsArray, name:"Unique Authors", yAxis: 2}
            ]
        };
        Highcharts.chart('glimrGraphControllerContainer', graphData);
    }, $scope);
}]);

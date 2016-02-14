

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
        var avgCommitFreqArray = [];
        var sprints = $scope.glimrData.allSprints.reverse();
        for(var i=0; (i<sprints.length && i<$scope.max); i++) {
            sprintNames.push(sprints[i].name);
            numberOfCardsWorkedArray.push(sprints[i].logsAnalysis.cards.length);
            numberOfCommitsArray.push(sprints[i].logsAnalysis.logObjects.length);
            numberOfAuthorsArray.push(sprints[i].logsAnalysis.authors.length);
            avgCommitFreqArray.push(1*sprints[i].logsAnalysis.logObjects[0].deltas.rollingAverageMs/60/60/1000);
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
        avgCommitFreqArray.reverse();

        //~
//        var velociyArray = [10, 50, 39, 56, 66, 42, 33, 15, 63, 32, 40, 26, 64, 24, 2];
        //~
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
                    },
                    opposite : false
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
                ,{
                    gridLineWidth: 1,
                    title: {
                        text: 'Average Commit Freq. Hrs.'
                    },
                    opposite : true
                }
//                ,{
//                    gridLineWidth: 1,
//                    title: {
//                        text: '# of Story Points'
//                    },
//                    opposite : false
//                }

            ],
            series: [
                { data: numberOfCardsWorkedArray, name:"Cards With Commits", yAxis: 0}
                ,{ data: numberOfCardsMergedArray, name:"Cards Merged", yAxis: 0}
                ,{ data: numberOfCommitsArray, name:"Commits", yAxis: 1}
                ,{ data: numberOfAuthorsArray, name:"Unique Authors", yAxis: 2}
//                ,{ data: velociyArray, name:"Story Point Velociy", yAxis: 4}
                ,{ data: avgCommitFreqArray, name:"Average Commit Freq. Hrs.", yAxis: 3}
            ]
        };
        Highcharts.chart('glimrGraphControllerContainer', graphData);
    }, $scope);
}]);

Array.prototype.min = function(comparer) {

    if (this.length === 0) return null;
    if (this.length === 1) return this[0];

    comparer = (comparer || Math.min);

    var v = this[0];
    for (var i = 1; i < this.length; i++) {
        v = comparer(this[i], v);
    }

    return v;
};

Array.prototype.max = function(comparer) {

    if (this.length === 0) return null;
    if (this.length === 1) return this[0];

    comparer = (comparer || Math.max);

    var v = this[0];
    for (var i = 1; i < this.length; i++) {
        v = comparer(this[i], v);
    }

    return v;
};


Math.standardDeviation = function(values){
  var avg = Math.average(values);

  var squareDiffs = values.map(function(value){
    var diff = value - avg;
    var sqrDiff = diff * diff;
    return sqrDiff;
  });

  var avgSquareDiff = Math.average(squareDiffs);

  var stdDev = Math.sqrt(avgSquareDiff);
  return stdDev;
}

Math.average = function(data){
  var sum = data.reduce(function(sum, value){
    return sum + value;
  }, 0);

  var avg = sum / data.length;
  return avg;
}

angular.module('nitForGitTeamApp').controller('glimrGraphController', ['$scope', 'glimrData',
                                 function($scope, glimrData) {
    $scope.glimrData = glimrData;
    $scope.max = 16;

    $scope.minOf = function(a){
        return a.min();
    };

    $scope.maxOf = function(a){
        return a.max();
    };

    $scope.glimrData.addListener(function(){
        var sprintNames = [];
        var numberOfCardsMergedArray = [];
        var numberOfCardsWorkedArray = [];
        var numberOfCommitsArray = [];
        var numberOfCommitsPerCardArray = [];
        var AVG_numberOfCommitsPerCardArray = [];
        var STD_ABOVE_numberOfCommitsPerCardArray = [];
        var STD_BELOW_numberOfCommitsPerCardArray = [];
        var misestimationIndexArray = [];
        var numberOfAuthorsArray = [];
        var avgCommitFreqArray = [];
        var sprints = $scope.glimrData.allSprints.reverse();
        for(var i=0; (i<sprints.length && i<$scope.max); i++) {
            sprintNames.push(sprints[i].name);
            numberOfCardsWorkedArray.push(sprints[i].logsAnalysis.cards.length);
            numberOfCommitsArray.push(sprints[i].logsAnalysis.logObjects.length);
            var cPc = sprints[i].logsAnalysis.cards.length!=0 ? (sprints[i].logsAnalysis.logObjects.length/sprints[i].logsAnalysis.cards.length) : 0;
            numberOfCommitsPerCardArray.push(cPc);



            numberOfAuthorsArray.push(sprints[i].logsAnalysis.authors.length);
            var rollingAvg = 1*sprints[i].logsAnalysis.logObjects[0].deltas.rollingAverageMs;
            var commitFreqCPHr = rollingAvg ==0 ? 0 :1/(rollingAvg/60/60/1000);
            avgCommitFreqArray.push(commitFreqCPHr);
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
        numberOfCommitsPerCardArray.reverse();
        numberOfAuthorsArray.reverse();
        avgCommitFreqArray.reverse();

        for(var i=0; i<numberOfCommitsPerCardArray.length; i++) {
            var cPc = numberOfCommitsPerCardArray[i];
            var avg = Math.average(numberOfCommitsPerCardArray);
            AVG_numberOfCommitsPerCardArray.push(avg);
            var std = Math.standardDeviation(numberOfCommitsPerCardArray);
            STD_ABOVE_numberOfCommitsPerCardArray.push(avg+std);
            STD_BELOW_numberOfCommitsPerCardArray.push(avg-std);
            misestimationIndexArray.push(std !=0 ? ((cPc-avg) / std) : 0);
        }

        //~
        var velocityArray = [10, 50, 39, 56, 66, 42, 33, 15, 63, 32, 40, 26, 64, 24, 42, 0];
        //~

        //################################################################
        //################################################################
        //################################################################
        //################################################################
        //################################################################



        $scope.chartObject = {
          "type": "LineChart",
          "displayed": false,
          "data": {
            "cols": [
              {
                "id": "sprint",
                "label": "Sprint",
                "type": "string",
                "p": {}
              },
              {
                "id": "velocity",
                "label": "Velocity",
                "type": "number",
                "p": {}
              }
            ],
            "rows": [
              {
                "c": [
                  {
                    "v": sprintNames[0]
                  },
                  {
                    "v": velocityArray[0],
                  }
                ]
              },
              {
                "c": [
                  {
                    "v": sprintNames[1]
                  },
                  {
                    "v": velocityArray[1]
                  }
                ]
              }
            ]
          },
          "options": {
            "title": "Sales per month",
            "isStacked": "true",
            "fill": 20,
            "displayExactValues": true,
            "vAxis": {
              "title": "Sales unit",
              "gridlines": {
                "count": 10
              }
            },
            "hAxis": {
              "title": "Date"
            }
          },
          "formatters": {}
        }

    }, $scope);
}]);


//
//
//
//        var graphData = {
//            title: {text:"GLIMR Sprint Report"},
//            xAxis: {
//                categories: sprintNames
//            },
//            yAxis: [
//                {
//                    gridLineWidth: 1,
//                    title: {
//                        text: '# of Cards'
//                    },
//                    opposite : false
//                }
//                ,{
//                    gridLineWidth: 1,
//                    title: {
//                        text: '# of Commits'
//                    },
//                    opposite : false
//                }
//                ,{
//                    gridLineWidth: 1,
//                    title: {
//                        text: 'Commits/Hour'
//                    },
//                    opposite : true
//                }
//                ,{
//                    gridLineWidth: 1,
//                    title: {
//                        text: '# Commits Per Card'
//                    },
//                    opposite : true
//                }
//                ,{
//                    gridLineWidth: 1,
//                    title: {
//                        text: 'Misestimation Index'
//                    },
//                    opposite : true
//                }
////                ,{
////                    gridLineWidth: 1,
////                    title: {
////                        text: '# of Unique Authors'
////                    },
////                    opposite : true
////                }
//                ,{
//                    gridLineWidth: 1,
//                    title: {
//                        text: '# of Story Points'
//                    },
//                    opposite : false
//                }
//
//            ],
//            series: [
//                { data: numberOfCardsMergedArray, name:"Cards Merged", yAxis: 0, color: '#000'}
//                ,{ data: numberOfCommitsArray, name:"Commits", yAxis: 1, color: '#0f0'}
//                ,{ data: avgCommitFreqArray, name:"Average Commit Freq.", yAxis: 2, color: '#00f'}
//                ,{ data: numberOfCommitsPerCardArray, name:"Commits Per Card", yAxis: 3, color: '#00e6e6'}
//                ,{ data: AVG_numberOfCommitsPerCardArray, name:"Avg. Commits Per Card", yAxis: 3, color: '#008888'}
//                ,{ data: STD_ABOVE_numberOfCommitsPerCardArray, name:"+1std Commits Per Card", yAxis: 3, color: '#f00'}
//                ,{ data: STD_BELOW_numberOfCommitsPerCardArray, name:"-1std Commits Per Card", yAxis: 3, color: '#faa'}
//                ,{ data: misestimationIndexArray, name:"Misestimation Index", yAxis: 4, color: '#f0f'}
////                ,{ data: numberOfCardsWorkedArray, name:"Cards With Commits", yAxis: 0}
////                ,{ data: numberOfAuthorsArray, name:"Unique Authors", yAxis: 2}
//                ,{ data: velocityArray, name:"Story Point Velociy", yAxis: 5, color: '#870'}
//            ]
//        };
//        Highcharts.chart('glimrGraphControllerContainer', graphData);
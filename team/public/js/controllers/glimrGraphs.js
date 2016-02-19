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
        var velociyArray = [10, 50, 39, 56, 66, 42, 33, 15, 63, 32, 40, 26, 64, 24, 42, 0];
        //~

        //################################################################
        //################################################################
        //################################################################
        //################################################################
        //################################################################
		var data = [3, 6, 2, 7, 5, 2, 0, 3, 8, 9, 2, 5, 9, 3, 6, 3, 6, 2, 7, 5, 2, 1, 3, 8, 9, 2, 5, 9, 2, 7];


        var graphId = "glimrGraphControllerContainer";
        // define dimensions of graph
        var margins = [80, 80, 80, 80]; // margins
        var width = 1000 - margins[1] - margins[3]; // width
        var height = 400 - margins[0] - margins[2]; // height


        // X scale will fit all values from data[] within pixels 0-w
        var x = d3.scale.linear().domain([0, data.length]).range([0, width]);
        // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
        var y = d3.scale.linear().domain([0, 10]).range([height, 0]);
        var line = d3.svg.line()
            .x(function(d,i) {
                return x(i);
            })
            .y(function(d) {
                return y(d);
            })
            var graph = d3.select("#" + graphId).append("svg:svg")
                  .attr("width", width + margins[1] + margins[3])
                  .attr("height", height + margins[0] + margins[2])
                .append("svg:g")
                  .attr("transform", "translate(" + margins[3] + "," + margins[0] + ")");

            var xAxis = d3.svg.axis().scale(x).tickSize(-height).tickSubdivide(true);
            graph.append("svg:g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis);


            var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("left");
            graph.append("svg:g")
                  .attr("class", "y axis")
                  .attr("transform", "translate(-25,0)")
                  .call(yAxisLeft);

            graph.append("svg:path").attr("d", line(data));


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
//                ,{ data: velociyArray, name:"Story Point Velociy", yAxis: 5, color: '#870'}
//            ]
//        };
//        Highcharts.chart('glimrGraphControllerContainer', graphData);
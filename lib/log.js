module.exports = function(nit) {
    //

    Date.prototype.dayId = function(){
        return this.getFullYear()+"_"+this.getMonth()+"_"+this.getDate();
    };

    var L = {  nit : nit,
        chart : require(__dirname +"/chart/chart.js")(),
        trailingN : 100,
        statPage : {
            files : {
                root : __dirname+"/../stats/",
                index : __dirname+"/../stats/index.html",
                commitFrequency : "commit_frequency.js",
                commitFrequencyChart : "commit_frequency_chart.js"
            }
        }
    };

    L.chartCommitFrequencyData = function() {
        var self = this;
        var fs = require('fs');
        self.getCommitFrequency(function(commitFrequencyData){
            var chartData = self.chart.commitFrequencyData(commitFrequencyData);
            fs.writeFileSync(self.statPage.files.root + self.statPage.files.commitFrequencyChart, "var commitFrequencyDataChart = " + JSON.stringify(chartData) + ";");
            self.nit.runner.run("open", [self.statPage.files.index]);
        });
    };

    L.getLogs = function(cb){
        var self = this;
        self.nit.git(["log"], function(data){
            cb && cb(self.toEntryObjectsArray(data));
        });
    };

    L.updateStatPage = function() {
        var self = this;
        var fs = require('fs');
        self.getCommitFrequency(function(commitFrequencyData){
            fs.writeFileSync(self.statPage.files.root + self.statPage.files.commitFrequency, "var commitFrequencyData = " + JSON.stringify(commitFrequencyData)+";");
        });
    };

    L.getCommitFrequency = function(cb) {
        var self = this;

        self.getLogs(function(entries){
            var R = {
                all : L.statEntries(entries),
                trailing : L.statEntries(entries.slice(0, self.trailingN)),
            };
            R.trending = L.trending(R.all, R.trailing);
            R.entries = entries;
            cb && cb(R);
        });
    };

    L.trending = function(all, trailing) {
        var deltaAvg = (trailing.average.millis - all.average.millis)
        var percentDeltaAvg = 100*deltaAvg/all.average.millis;
        var deltaAvgPercentStdev = deltaAvg/all.stdev.millis;
        var message = L.getDeltaStdevMessage(deltaAvgPercentStdev);
        return {
            count : this.trailingN,
            deltaAvg : deltaAvg,
            percentDeltaAvg : percentDeltaAvg,
            deltaAvgPercentStdev : deltaAvgPercentStdev,
            message : message
        };
    };

    L.getDeltaStdevMessage = function(deltaStdev) {
        var message = "Cruise control";
        var smallT = 1;
        var largeT = 2;
        if(deltaStdev < -largeT) {
            message = "Nitros engaged";
        } else if(deltaStdev < -smallT) {
            message = "Accelerating";
        } else if(deltaStdev > smallT) {
            message = "Coasting";
        } else if(deltaStdev > largeT) {
            message = "Braking";
        }
        return message;
    };

    L.getWeeklyMovingAverage = function(entries) {
        var self = this;
        var dailyMovingAverages = self.getDailyMovingAverage(entries);
        var weeklyMovingAverages = [];
        for(var i=0; i<dailyMovingAverages.length; i++){
            var week = dailyMovingAverages[i].week;
            if(!weeklyMovingAverages[week]){
                weeklyMovingAverages[week] = {
                    sum: dailyMovingAverages[i].average,
                    N: 1,
                    DN : dailyMovingAverages[i].N,
                    average: dailyMovingAverages[i].average
                    }
            }else {
                weeklyMovingAverages[week].sum += dailyMovingAverages[i].average;
                weeklyMovingAverages[week].N++;
                weeklyMovingAverages[week].DN+=dailyMovingAverages[i].N;
                weeklyMovingAverages[week].average = weeklyMovingAverages[week].sum / weeklyMovingAverages[week].N;
            }
        }
        return weeklyMovingAverages;
    }

    L.getDailyMovingAverage = function(entries) {
        var self = this;
        var dailyEntries = [];
        var dayIndex = -1;
        var lastDayOfWeek = 10;
        var weekIndex = -1
        var dayId;
        for(var i=0; i<entries.length; i++){
            var entry = entries[i];
            var _dayId = entry.date.dayId();
            if(entry.date.getDay() < lastDayOfWeek){
                weekIndex++;
            }
            lastDayOfWeek = entry.date.getDay();
            if(dayId != _dayId){
                if(dailyEntries[dayIndex]){
                    var last = -1;
                    dailyEntries[dayIndex].N = 0;
                    for(var j=0; j<dailyEntries[dayIndex].entries.length; j++){
                        var time = dailyEntries[dayIndex].entries[j].date.getTime();
                        if(last!=-1){
                            var delta = Math.abs(time-last);
                            dailyEntries[dayIndex].sum+= delta > 6*60*60*1000 ? dailyEntries[dayIndex].average : delta;
                            dailyEntries[dayIndex].N++;
                            dailyEntries[dayIndex].average = dailyEntries[dayIndex].sum / dailyEntries[dayIndex].N;
                        }
                        last = time;
                    }
                    dailyEntries[dayIndex].entries = undefined;
                }
                dayIndex++;
                dayId = _dayId;
            }
            if(!dailyEntries[dayIndex]){
                dailyEntries.push({week: weekIndex, dayId: dayId, entries : [], sum:0});
            }
            dailyEntries[dayIndex].entries.push(entry);
        }
        return dailyEntries;
    };

    L.statEntries = function(entries) {
        var self = this;
        var threshold = 6*60*60*1000;//6 hours
        var sum = 0;
        var last = -1;

        var sum = 0;
        var last = entries[0].date.getTime();
        var deltas = [];
        var fullDeltas = [];
        var dailyMovingAverage = self.getDailyMovingAverage(entries);
        var weeklyMovingAverages = self.getWeeklyMovingAverage(entries);
        for(var i=1; i<entries.length; i++){
            var delta = last - entries[i].date.getTime();
            if(delta < threshold) {
                deltas.push(delta);
                fullDeltas.push({value: delta, clean:true});
                sum += delta;
            } else {
                fullDeltas.push({value: delta, clean:false});
            }
            last = entries[i].date.getTime();
        }
        var N = deltas.length;
        var avg = sum / N;
        var diffs = deltas.map(function(value){
          return value - avg;
        });
        var squareDiffs = deltas.map(function(value){
          var diff = value - avg;
          return diff * diff;
        });
        var avgSquareDiff = self.average(squareDiffs);
        var stdev = Math.sqrt(avgSquareDiff / N);
        var result = {
            N : N,
            count : fullDeltas.length,
            deltas : {
                full : fullDeltas,
                cleaned : deltas
            },
            dailyMovingAverage : dailyMovingAverage,
            weeklyMovingAverages : weeklyMovingAverages,
            sum : {
                millis : sum,
                span : self.toSpan(sum)
            },
            average : {
                millis : avg,
                span : self.toSpan(avg)
            },
            stdev : {
                millis : stdev,
                span : self.toSpan(stdev)
            }
        };
        return result;
    };

    L.toSpan = function(millis) {
        var hours = Math.floor(millis/(60*60*1000));
        millis -= hours * (60*60*1000);

        var minutes = Math.floor(millis/(60*1000));
        millis -= minutes * (60*1000);

        var seconds = Math.floor(millis/1000);
        millis -= seconds * 1000;

        return span = {
            hours : hours,
            minutes : minutes,
            seconds : seconds,
            millis : millis
        };
    };

    L.average = function(data){
      var sum = data.reduce(function(sum, value){
        return sum + value;
      }, 0);

      var avg = sum / data.length;
      return avg;
    };

    L.toEntryObjectsArray = function(logOutput) {
        var entryTextBlocks = logOutput.split("\ncommit ");
        var entryObjects = [];
        var index = 0;
        for(var i=0; i<entryTextBlocks.length; i++){
            var entryLines = entryTextBlocks[i];
            if(entryLines.length===0){
                continue;
            }else {
                var entryObj = L.createEntry(entryLines);
                entryObjects[index] = entryObj;
                index++;
            }
        }
        entryObjects = entryObjects.sort(function(a, b){
            return a.date.getTime() < b.date.getTime() ? 1 : (a.date.getTime() === b.date.getTime() ? 0 : -1);
        });
        return entryObjects;
    };

    L.createEntry = function(entryLines) {
        var entry = {};
        var lines = entryLines.split("\n");
        for(var i=0; i<lines.length; i++){
            var l = lines[i];
            if(l.length > 0 && !entry.commit) {
                entry.commit = l;
            } else if(l.indexOf("Author: ") != -1) {
                entry.author = {
                    name: l.split("<")[0].replace("Author: ", "").trim(),
                    email: l.split("<")[1].replace(">")
                };
            } else if(l.indexOf("Date: ") != -1) {
                entry.date = new Date(l.replace("Date: ", ""));
            }
        }
        entry.message = entryLines.split("Date: ")[1];
        entry.message = entry.message.substring(entry.message.indexOf("\n\n")+"\n\n".length, entry.message.length).trim();
        return entry;
    };

    return L;
};
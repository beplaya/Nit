module.exports = function(nit) {
    var L = { nit : nit , trailingN : 100, statPage : {files : {root : __dirname+"/../stats/", commitFrequency : "commit_frequency.json"}}};

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
            fs.writeFileSync(self.statPage.files.root + self.statPage.files.commitFrequency, JSON.stringify(commitFrequencyData));
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

            console.log("ALL:", R.all);
            console.log("Last "+self.trailingN+":", R.trailing);
            console.log("trending ", R.trending);
            cb && cb(R);
        });
    };

    L.trending = function(all, trailing) {
        var deltaAvg = (trailing.average.millis - all.average.millis)
        var percentDeltaAvg = 100*deltaAvg/all.average.millis;
        var deltaAvgPercentStdev = deltaAvg/all.stdev.millis;
        var message = L.getDeltaStdevMessage(deltaAvgPercentStdev);
        return {
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

    L.statEntries = function(entries) {
        var self = this;
        var threshold = 6*60*60*1000;//6 hours
        var sum = 0;
        var last = -1;

        var sum = 0;
        var last = entries[0].date.getTime();
        var deltas = [];
        for(var i=1; i<entries.length; i++){
            var delta = last - entries[i].date.getTime();
            if(delta < threshold) {
                deltas[deltas.length] = delta;
                sum += delta;
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
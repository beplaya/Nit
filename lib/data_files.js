module.exports = function DataFiles() {
    var DF = {};
    DF.nettings = require(__dirname + '/nit_settings.js')().load();
    DF.nira = require(__dirname + '/nira/nira.js')(DF.nettings);
    DF.fs = require('fs');
    DF.directories = {};
    DF.directories.webRoot = __dirname + "/../web";
    DF.directories.root = DF.directories.webRoot + "/project_cache";
    DF.directories.projectRoot = DF.directories.root + "/project_" + DF.nettings.jira.projectKey;
    DF.directories.json = DF.directories.projectRoot + "/json";

    DF.files = {
        status : "status.json",
        oneLineLogData : "one_line_log_data.json",
        issue : "issue.json",
    };

    DF.writeStatusDataFile = function(statusData, currentBranch, isDetached) {
        var jsonData = {};
        var lines = statusData.split("\n");
        jsonData.currentBranch = currentBranch || "?";
        jsonData.lines = [];
        jsonData.statusStringIsClean = false;
        jsonData.isDetached = isDetached;
        jsonData.msg = "";
        if(isDetached){
            jsonData.msg = "~ HEAD Detached ~ " + currentBranch;
        }
        if(DF.statusStringIsClean(jsonData.lines, statusData)){
            jsonData.msg = "";
            jsonData.statusStringIsClean = true;
        }
        for(var i=0; i<lines.length; i++){
            var l = lines[i].trim();
            if(l.length>0)
                jsonData.lines.push(lines[i]);
        }
        //
        var file = DF.directories.json + "/" + DF.files.status;
        DF.writeFile(file, JSON.stringify(jsonData));
    };

    DF.statusStringIsClean = function(strings, str) {
       var joined = strings.join();
       return joined.indexOf("nothing to commit, working directory clean") != -1;
    };

    DF.writeOneLineLogFile = function(oneLineLogData){
        var lines = oneLineLogData.split('\n');
        var lineMessages = [];
        var largestLineMessageLength = 0;
        for(var i=0; i<lines.length; i++) {
            var words = lines[i].split(" ");
            var hash = words[0];
            if(hash.length > 0){
                var message = "";
                for(var j=1; j<words.length; j++) {
                    message += " " + words[j];
                }
                message = message.trim();
                var smallHash = hash.substring(0, 7);
                message = (i+1) + " | " + smallHash + " | - | " + message;
                lineMessages.push(message);
                if(message.length > largestLineMessageLength) {
                    largestLineMessageLength = message.length;
                }
            }
        }

        var file = DF.directories.json + "/" + DF.files.oneLineLogData;
        DF.writeFile(file, JSON.stringify(lineMessages));
    };

    DF.writeIssueFile = function(ticketID, fields){
        var issue = {
            ticketID : ticketID,
            fields : JSON.parse(fields),
            url : DF.nira.baseURL + ticketID
        };

        var file = DF.directories.json + "/" + DF.files.issue;
        DF.writeFile(file, JSON.stringify(issue));
    };

    DF.writeFile = function(file, data){
        DF.fs.writeFileSync(file, data);
    };

    DF.mkDirs = function(){
        DF.mkDir(DF.directories.webRoot);
        DF.mkDir(DF.directories.root);
        DF.mkDir(DF.directories.projectRoot);
        DF.mkDir(DF.directories.json);
    };

    DF.mkDir = function(dir){
        try {
            DF.fs.mkdirSync(dir);
        } catch(e){
            if(e.code !== "EEXIST"){
                console.log(e);
            }
        }
    }

    DF.mkDirs();

    return DF;
};
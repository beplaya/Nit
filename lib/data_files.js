module.exports = function DataFiles() {
    if(!(this instanceof DataFiles)) {
        return new DataFiles();
    }
    this.nettings = new require(__dirname + '/nit_settings.js')().load();
    this.nira = new require(__dirname + '/nira/nira.js')(this.nettings);
    this.fs = require('fs');
    this.directories = {};
    this.directories.webRoot = __dirname + "/../web";
    this.directories.root = this.directories.webRoot + "/project_cache";
    this.directories.projectRoot = this.directories.root + "/project_" + this.nettings.projectKey;
    this.directories.json = this.directories.projectRoot + "/json";

    this.files = {
        status : "status.json",
        oneLineLogData : "one_line_log_data.json",
        issue : "issue.json",
    };

    this.writeStatusDataFile = function(statusData, currentBranch, isDetached) {
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
        if(this.statusStringIsClean(jsonData.lines, statusData)){
            jsonData.msg = "";
            jsonData.statusStringIsClean = true;
        }
        for(var i=0; i<lines.length; i++){
            var l = lines[i].trim();
            if(l.length>0)
                jsonData.lines.push(lines[i]);
        }
        //
        var file = this.directories.json + "/" + this.files.status;
        this.writeFile(file, JSON.stringify(jsonData));
    };

    this.statusStringIsClean = function(strings, str) {
       var joined = strings.join();
       return joined.indexOf("nothing to commit, working directory clean") != -1;
    };

    this.writeOneLineLogFile = function(oneLineLogData){
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

        var file = this.directories.json + "/" + this.files.oneLineLogData;
        this.writeFile(file, JSON.stringify(lineMessages));
    };

    this.writeIssueFile = function(ticketID, fields){
        var issue = {
            ticketID : ticketID,
            fields : JSON.parse(fields),
            url : this.nira.baseURL + ticketID
        };

        var file = this.directories.json + "/" + this.files.issue;
        this.writeFile(file, JSON.stringify(issue));
    };

    this.writeFile = function(file, data){
        this.fs.writeFileSync(file, data);
    };

    this.mkDirs = function(){
        this.mkDir(this.directories.webRoot);
        this.mkDir(this.directories.root);
        this.mkDir(this.directories.projectRoot);
        this.mkDir(this.directories.json);
    };

    this.mkDir = function(dir){
        try {
            this.fs.mkdirSync(dir);
        } catch(e){
            if(e.code !== "EEXIST"){
                console.log(e);
            }
        }
    }

    this.mkDirs();

    return DF;
};
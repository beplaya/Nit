module.exports = function Printer(){
    if(!(this instanceof Printer)) {
        return new Printer();
    }
    this.colors = require('colors');

    this.STAGED = "STAGED";
    this.NOT_STAGED = "NOT_STAGED";
    this.UNTRACKED = "UNTRACKED";
    this.margin = "                 ";
    this.smallMargin = "          ";
    this.maxLineLength = 100;
    this.hrChar = "\uD83D\uDD35     ";


    this.colors.setTheme({
      silly: 'rainbow',
      input: 'grey',
      verbose: 'cyan',
      prompt: 'grey',
      good: 'green',
      staged: 'green',
      data: 'grey',
      help: 'cyan',
      important: 'yellow',
      debug: 'blue',
      important: 'blue',
      change: 'red',
      RED: 'red',
      error: 'red',
      name: 'red',
      logo: 'green',
      title: 'green',
      arg: 'white'
    });

    this.printPushResult = function(result){
        if(result.indexOf("Everything up-to-date") != -1) {
            var emoji = this.findEmoji("+1");
            console.log(":)  ".good, emoji, emoji, emoji);
        } else {
            this.print(result);
        }
    };

    this.findEmoji = function(alias) {
        var fs = require("fs");
        var emojis = JSON.parse(fs.readFileSync(__dirname + "/emoji.json").toString());
        for(var i =0; i<emojis.length; i++){
            for(var j =0; j<emojis[i].aliases.length; j++){
                if(emojis[i].aliases[j] === alias){
                    return emojis[i].emoji;
                }
            }
        }
    };

    this.statusStringIsClean = function(strings, str) {
        var joined = strings.join();
        return joined.indexOf("nothing to commit, working directory clean") != -1;
    };

    this.missingCommitMessage = function(){
        this.E("NERROR: Missing a commit message!");
    };

    this.E = function(str) {
        console.log(str.error);
    };

    this.I = function(str) {
        console.log(str.important);
    };

    this.logo = function(path) {
        var fs = require('fs');
        var logo = fs.readFileSync(path).toString();
        this.printLinesWithPrefix("\t\t", logo, 'logo');
    };

    this.description = function(issueID, data) {
        var fields = data.fields;
        var cachedAge = fields.cachedAge || 0;
        var issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
        var status = fields.status ? fields.status.name || "" : "without any status";
        var assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
        var summary = fields.summary || "";
        this._description(cachedAge, issueID, summary, fields.description || "",
            status, issuetype, assignee);
    };

    this._description = function(cachedAge, key, summary, description, status, issuetype, assignee) {
        description = this.truncateLines(description);
        if(cachedAge>1) {
            console.log((" Cached " + cachedAge + " seconds ago").data);
        }
        console.log(("    |  " + key + ": " + summary).title);
        this.hr("    |");
        console.log("    | ", "A", ("'"+issuetype+"'").verbose, "issue that is", ("'"+status+"'").verbose, "assigned to", ("'"+assignee+"'").verbose + ".");
        this.hr("    |");
        this.printLinesWithPrefix("    | ", description);
    };

    this.comments = function(data) {
        var self = this;
        if(data && data.fields && data.fields.comment && data.fields.comment.comments){
            console.log("    ### COMMENTS ###".title);
            var comments = data.fields.comment.comments;
            for(var i=0; i<comments.length; i++) {
                var c = comments[i];
                var author =c.author.displayName;
                console.log("    #".verbose);
                console.log("    #".verbose, "author: ", author.name, "\t created: ", c.created.verbose, "\tupdated: "+c.updated.verbose);
                var body = self.truncateLines(c.body);
                self.printLinesWithPrefix("    #   ", body);
            }
        }else {
            console.log("No comments".error);
        }
    };

    this.truncateLines = function(str) {
        var max = this.maxLineLength;
        var truncated = "";
        var strings = str.split("\n");
        for(var i =0; i<strings.length; i++) {
            var s = strings[i];
            if(s.length > max) {
                var words = s.split(" ");
                var line = "\n";

                for(var j = 0; j<words.length; j++) {
                   line += " "+words[j];
                   var next = line + (j<words.length-1 ? " " + words[j+1] : "");
                   if(next.length >= max){
                        truncated += line;
                        line = "\n";
                   }
                }
                truncated += line === "\n" ? "" : line;
            } else {
                truncated += "\n" + s;
            }
        }
        return truncated;
    };

    this.printLinesWithPrefix = function(margin, str, style) {
        var strings = str.split("\n");
        for(var i =0; i<strings.length; i++) {
            if(strings[i].trim().length>0)
                console.log((margin + strings[i])[style || 'verbose']);
        }
    };

    this.printStatus = function(statusData, currentBranch, isDetached) {
        var strings = statusData.split("\n");
        currentBranch = currentBranch || "?";
        if(isDetached){
            console.log(("~ HEAD Detached ~ " + currentBranch).verbose, this.findEmoji("pushpin"));
        }

        if(this.statusStringIsClean(strings, statusData)){
            console.log(currentBranch.verbose, ("CLEAN").good, this.findEmoji("white_check_mark"));
        } else {
            for(var i =0; i<strings.length; i++) {
                this.pf(strings[i], i);
            }
        }
    };


    this.print = function(str, currentBranch, isDetached) {
        var strings = str.split("\n");
        currentBranch = currentBranch || "?";
        if(isDetached){
            console.log(("~ HEAD Detached ~ " + currentBranch).verbose, this.findEmoji("pushpin"));
        }

        if(this.statusStringIsClean(strings, str)){
            console.log(currentBranch.verbose, ("CLEAN").good, this.findEmoji("white_check_mark"));
        } else {
            for(var i =0; i<strings.length; i++) {
                this.pf(strings[i], i);
            }
        }
    };

    this.printCmd = function(c) {
        var ARG = c.arg;
        while(ARG.length < 15) {
            ARG = ARG + " ";
        }
        ARG = ARG + " > ";

        console.log("\t" + ARG.arg + c.name.help);
    };

    this.logOneLiners = function(data, max) {
        var lines = data.split('\n');
        var max = max || 4;
        max = lines.length > max ? max : lines.length;
        var count = 1;
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
                message = count + " | " + smallHash.verbose + " | - | " + message;
                lineMessages.push(message);
                if(count <= max && message.length > largestLineMessageLength) {
                    largestLineMessageLength = message.length;
                }
                count++;
            }
        }
        for(var i=0; i<max; i++) {
            var message = lineMessages[i];
            var messageLength = message.length;
            for(var j=0; j<largestLineMessageLength-messageLength; j++) {
                message = message + " ";
            }
            message = message + "  |";
            console.log(message);
        }
        if(max < lines.length) {
            console.log("... " + (lineMessages.length - max) + " more logs not shown");
        }
    };

    this.printBranch = function(currentBranch) {
        process.stdout.write(this.smallMargin);
        console.log("On branch:".verbose, currentBranch);
    };

    this.pf = function(str, lineNumber){
        if(str.length==0)
            return undefined;

        var line = "";
        var margin = str.indexOf("On branch") != -1 ? this.smallMargin : this.margin;
        if(!this.hide(str)) {
            process.stdout.write(margin);
        }

        this.notStaged(str);
        this.untracked(str);
        this.isStaged(str);
        if(!this.hide(str)){
            if(this.isGood(str, lineNumber)) {
                console.log(str.good);
            } else if(this.isVerbose(str, lineNumber)) {
                console.log(str.verbose);
            } else if(this.isChange(str, lineNumber)) {
                console.log(str.change);
            } else if(this.isImportant(str, lineNumber)) {
                  console.log(str.important);
            } else if(this.isALineItem(str, lineNumber) || this.state == this.UNTRACKED) {
                if(this.state == this.STAGED)
                    console.log(str.staged.staged);
                else if(this.state == this.NOT_STAGED)
                    console.log(str.change);
                else if(this.state == this.UNTRACKED)
                    console.log(str.change);
                else
                    console.log(str);

            } else {
                console.log(str);
            }
        }
    };

    this.isGood = function(str, lineNumber) {
        return str.indexOf("Your branch is up-to-date") != -1 || str.indexOf("nothing to commit, working directory clean") != -1;
    };

    this.isALineItem = function(str, lineNumber) {
        return str.indexOf("modified:") != -1 || str.indexOf("new file:") != -1 || str.indexOf("deleted") != -1;
    };

    this.isVerbose = function(str, lineNumber) {
        return str.indexOf("On branch") != -1;
    };

    this.isImportant = function(str, lineNumber) {
        return this.notStaged(str) || this.untracked(str) || this.isStaged(str);
    };

    this.isStaged = function(str) {
        var b = str.indexOf("Changes to be committed:") != -1;
        if(b)
            this.state = this.STAGED;
        return b;
    };

    this.notStaged = function(str) {
        var b = str.indexOf("Changes not staged for commit:") != -1 || str.indexOf("Unstaged changes after reset:") != -1;
        if(b)
            this.state = this.NOT_STAGED;
        return b;
    };

    this.untracked = function(str){
        var b = str.indexOf("Untracked files:") != -1;
        if(b)
            this.state = this.UNTRACKED;
        return b;
    };

    this.isChange = function(str, lineNumber) {
        return false;
    };

    this.hide = function(str, lineNumber) {
        return str.indexOf("(use \"git ") != -1;
    };

    this.hr = function(prefix) {
        prefix = prefix || "";
        console.log(prefix + "----------------------------------------------------------------------------------");
    };

    this.hr2 = function(){
        process.stdout.write('\n');
        for(var i =0; i<8; i++) {
            process.stdout.write(this.hrChar);
        }
        process.stdout.write('\n');
    };
}


module.exports = function Printer(){
    var PRINTER = {};
    PRINTER.colors = require('colors');

    PRINTER.STAGED = "STAGED";
    PRINTER.NOT_STAGED = "NOT_STAGED";
    PRINTER.UNTRACKED = "UNTRACKED";
    PRINTER.margin = "                 ";
    PRINTER.smallMargin = "          ";
    PRINTER.maxLineLength = 100;
    PRINTER.hrChar = "\uD83D\uDD35     ";


    PRINTER.colors.setTheme({
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

    PRINTER.printPushResult = function(result){
        if(result.indexOf("Everything up-to-date") != -1) {
            var emoji = PRINTER.findEmoji("+1");
            console.log(":)  ".good, emoji, emoji, emoji);
        } else {
            PRINTER.print(result);
        }
    };

    PRINTER.findEmoji = function(alias) {
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

    PRINTER.statusStringIsClean = function(strings, str) {
        var joined = strings.join();
        return joined.indexOf("nothing to commit, working directory clean") != -1;
        //return strings.length >= 2 &&(strings[0].indexOf("On branch") != -1 && (strings[1].indexOf("nothing to commit") != -1 || (strings.length>=3 && strings[2].indexOf("nothing to commit") != -1)));
    };

    PRINTER.missingCommitMessage = function(){
        PRINTER.E("NERROR: Missing a commit message!");
    };

    PRINTER.E = function(str) {
        console.log(str.error);
    };

    PRINTER.I = function(str) {
        console.log(str.important);
    };

    PRINTER.logo = function(path) {
        var fs = require('fs');
        var logo = fs.readFileSync(path).toString();
        PRINTER.printLinesWithPrefix("\t\t", logo, 'logo');
    };

    PRINTER.description = function(issueID, fields) {
        fields = JSON.parse(fields);
        var cachedAge = fields.cachedAge || 0;
        var issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
        var status = fields.status ? fields.status.name || "" : "without any status";
        var assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
        var summary = fields.summary || "";
        PRINTER._description(cachedAge, issueID, summary, fields.description || "",
            status, issuetype, assignee);
    };

    PRINTER._description = function(cachedAge, key, summary, description, status, issuetype, assignee) {
        description = PRINTER.truncateLines(description);
        if(cachedAge>1) {
            console.log((" Cached " + cachedAge + " seconds ago").data);
        }
        console.log(("    |  " + key + ": " + summary).title);
        PRINTER.hr("    |");
        console.log("    | ", "A", ("'"+issuetype+"'").verbose, "issue that is", ("'"+status+"'").verbose, "assigned to", ("'"+assignee+"'").verbose + ".");
        PRINTER.hr("    |");
        PRINTER.printLinesWithPrefix("    | ", description);
    };

    PRINTER.comments = function(data) {
        var self = PRINTER;
        console.log("    ### COMMENTS ###".title);
        data = JSON.parse(data);
        if(data.comments){
            var comments = data.comments;
            for(var i=0; i<comments.length; i++) {
                var c = comments[i];
                var author =c.author.displayName;
                console.log("    #".verbose);
                console.log("    #".verbose, "author: ", author.name, "\t created: ", c.created.verbose, "\tupdated: "+c.updated.verbose);
                var body = self.truncateLines(c.body);
                self.printLinesWithPrefix("    #   ", body);
            }
        }else {
            console.log("No comments");
        }
    };

    PRINTER.truncateLines = function(str) {
        var max = PRINTER.maxLineLength;
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

    PRINTER.printLinesWithPrefix = function(margin, str, style) {
        var strings = str.split("\n");
        for(var i =0; i<strings.length; i++) {
            if(strings[i].trim().length>0)
                console.log((margin + strings[i])[style || 'verbose']);
        }
    };

    PRINTER.printStatus = function(str, currentBranch, isDetached) {
        var strings = str.split("\n");
        currentBranch = currentBranch || "?";
        if(isDetached){
            console.log(("~ HEAD Detached ~ " + currentBranch).verbose, PRINTER.findEmoji("pushpin"));
        }

        if(PRINTER.statusStringIsClean(strings, str)){
            console.log(currentBranch.verbose, ("CLEAN").good, PRINTER.findEmoji("white_check_mark"));
        } else {
            for(var i =0; i<strings.length; i++) {
                PRINTER.pf(strings[i], i);
            }
        }
    };


    PRINTER.print = function(str, currentBranch, isDetached) {
        var strings = str.split("\n");
        currentBranch = currentBranch || "?";
        if(isDetached){
            console.log(("~ HEAD Detached ~ " + currentBranch).verbose, PRINTER.findEmoji("pushpin"));
        }

        if(PRINTER.statusStringIsClean(strings, str)){
            console.log(currentBranch.verbose, ("CLEAN").good, PRINTER.findEmoji("white_check_mark"));
        } else {
            for(var i =0; i<strings.length; i++) {
                PRINTER.pf(strings[i], i);
            }
        }
    };

    PRINTER.printCmd = function(c) {
        var ARG = c.arg;
        while(ARG.length < 15) {
            ARG = ARG + " ";
        }
        ARG = ARG + " > ";

        console.log("\t" + ARG.arg + c.name.help);
    };

    PRINTER.logOneLiners = function(data, max) {
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

    PRINTER.printBranch = function(currentBranch) {
        process.stdout.write(PRINTER.smallMargin);
        console.log("On branch:".verbose, currentBranch);
    };

    PRINTER.pf = function(str, lineNumber){
        if(str.length==0)
            return;


        var margin = str.indexOf("On branch") != -1 ? PRINTER.smallMargin : PRINTER.margin;
        if(!PRINTER.hide(str)) {
            process.stdout.write(margin);
        }

        PRINTER.notStaged(str);
        PRINTER.untracked(str);
        PRINTER.isStaged(str);
        if(!PRINTER.hide(str)){
            if(PRINTER.isGood(str, lineNumber)) {
                console.log(str.good);
            } else if(PRINTER.isVerbose(str, lineNumber)) {
                console.log(str.verbose);
            } else if(PRINTER.isChange(str, lineNumber)) {
                console.log(str.change);
            } else if(PRINTER.isImportant(str, lineNumber)) {
                  console.log(str.important);
            } else if(PRINTER.isALineItem(str, lineNumber) || PRINTER.state == PRINTER.UNTRACKED) {
                if(PRINTER.state == PRINTER.STAGED)
                    console.log(str.staged.staged);
                else if(PRINTER.state == PRINTER.NOT_STAGED)
                    console.log(str.change);
                else if(PRINTER.state == PRINTER.UNTRACKED)
                    console.log(str.change);
                else
                    console.log(str);

            } else {
                console.log(str);
            }
        }
    };

    PRINTER.isGood = function(str, lineNumber) {
        return str.indexOf("Your branch is up-to-date") != -1 || str.indexOf("nothing to commit, working directory clean") != -1;
    };

    PRINTER.isALineItem = function(str, lineNumber) {
        return str.indexOf("modified:") != -1 || str.indexOf("new file:") != -1 || str.indexOf("deleted") != -1;
    };

    PRINTER.isVerbose = function(str, lineNumber) {
        return str.indexOf("On branch") != -1;
    };

    PRINTER.isImportant = function(str, lineNumber) {
        return PRINTER.notStaged(str) || PRINTER.untracked(str) || PRINTER.isStaged(str);
    };

    PRINTER.isStaged = function(str) {
        var b = str.indexOf("Changes to be committed:") != -1;
        if(b)
            PRINTER.state = PRINTER.STAGED;
        return b;
    };

    PRINTER.notStaged = function(str) {
        var b = str.indexOf("Changes not staged for commit:") != -1 || str.indexOf("Unstaged changes after reset:") != -1;
        if(b)
            PRINTER.state = PRINTER.NOT_STAGED;
        return b;
    };

    PRINTER.untracked = function(str){
        var b = str.indexOf("Untracked files:") != -1;
        if(b)
            PRINTER.state = PRINTER.UNTRACKED;
        return b;
    };

    PRINTER.isChange = function(str, lineNumber) {
        return false;
    };

    PRINTER.hide = function(str, lineNumber) {
        return str.indexOf("(use \"git ") != -1;
    };

    PRINTER.hr = function(prefix) {
        prefix = prefix || "";
        console.log(prefix + "----------------------------------------------------------------------------------");
    };

    PRINTER.hr2 = function(){
        process.stdout.write('\n');
        for(var i =0; i<8; i++) {
            process.stdout.write(PRINTER.hrChar);
        }
        process.stdout.write('\n');
    };

    return PRINTER;
}


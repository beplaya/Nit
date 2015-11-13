module.exports = function Printer(){
    this.colors = require('colors');

    this.STAGED = "STAGED";
    this.NOT_STAGED = "NOT_STAGED";
    this.UNTRACKED = "UNTRACKED";
    this.margin = "                 ";
    this.smallMargin = "          ";
    this.maxLineLength = 80;

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
      title: 'green',
      arg: 'white'
    });

    this.statusStringIsClean = function(strings, str) {
        return strings.length >= 2 &&(strings[0].indexOf("On branch") != -1 && (strings[1].indexOf("nothing to commit") != -1 || (strings.length>=3 && strings[2].indexOf("nothing to commit") != -1)));
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
        this.printLinesWithPrefix("\t\t", logo);
    };

    this.description = function(issueID, fields) {
        var issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
        var status = fields.status ? fields.status.name || "" : "without any status";
        var assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
        var summary = fields.summary || "";
        this._description(issueID, summary, fields.description || "",
            status, issuetype, assignee);
    };

    this._description = function(key, summary, description, status, issuetype, assignee) {
        description = this.truncateLines(description);
        console.log(("\t|  " + key + ": " + summary).title);
        // console.log("\t| ".title, "Status:".title, status, "\tType:".title, issuetype, "\tAssignee:".title,  assignee);
        this.hr("\t|");
        console.log("\t| ", "A", ("'"+issuetype+"'").verbose, "issue that is", ("'"+status+"'").verbose, "assigned to", ("'"+assignee+"'").verbose + ".");
        this.hr("\t|");
        this.printLinesWithPrefix("\t| ", description);
    };

    this.comments = function(data) {
        var self = this;
        console.log("\t### COMMENTS ###".title);
        data = JSON.parse(data);
        if(data.comments){
            var comments = data.comments;
            for(var i=0; i<comments.length; i++) {
                var c = comments[i];
                var author =c.author.displayName;
                console.log("\t#".verbose);
                console.log("\t#".verbose, "author: ", author.name, "\t created: ", c.created.verbose, "\tupdated: "+c.updated.verbose);
                var body = self.truncateLines(c.body);
                self.printLinesWithPrefix("\t#   ", body);
            }
        }else {
            console.log("No comments");
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

    this.printLinesWithPrefix = function(margin, str) {
        var strings = str.split("\n");
        for(var i =0; i<strings.length; i++) {
            console.log((margin + strings[i]).verbose);
        }
    };

    this.print = function(str) {
        var strings = str.split("\n");
        if(this.statusStringIsClean(strings, str)){
            console.log((" ~ "+strings[0]+ " CLEAN ~").good);
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

    this.printBranch = function(currentBranch) {
        process.stdout.write(this.smallMargin);
        console.log("On branch:".verbose, currentBranch);
    };

    this.pf = function(str, lineNumber){
        if(str.length==0)
            return;


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

    return this;
}


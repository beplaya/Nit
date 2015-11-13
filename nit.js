#!/usr/bin/env node




var nit = new Nit();
nit.start(process.argv.slice(2));



function NitSettings() {

    this.defaultSettings = {
       jira : {
           host : "???",
           projectKey : "DEFAULT_PROJECT_KEY"
       },
       featureBranchPrefix : "feature/"
    };

    this.init = function() {
        var fs = require('fs');
        fs.writeFileSync("./.nitconfig", this.defaultSettings.toString());
    };

    this.load = function(){
        var settings = this.loadSettingsFromFile() || this.defaultSettings;
        // Default settings if null
        settings.jira = settings.jira || this.defaultSettings.jira;
        settings.jira.host = settings.jira.host || this.defaultSettings.jira.host;
        settings.jira.projectKey = settings.jira.projectKey || this.defaultSettings.jira.projectKey;
        settings.featureBranchPrefix = settings.featureBranchPrefix || this.defaultSettings.featureBranchPrefix;
        //
        settings.jiraPrefix = settings.jira.projectKey + "-";
        settings.featurePrefix = settings.featureBranchPrefix + settings.jiraPrefix;
        return settings;
    };

    this.loadSettingsFromFile = function(){
        var fs = require('fs');
        var filePath = "./.nitconfig";
        try{
            var data = fs.readFileSync(filePath);
        } catch(e) {
            console.log("Failed to load .nitconfig in current directory. Create a .nitconfig here.  See template" + __dirname + "/.nitconfig");
            process.exit();
            return;
        }
        var content = data ? data : "{}";
        var json = {};
        try {
            var json = JSON.parse(content);
        } catch(e){
            console.log("NError! Invalid .nitconfig!  Parse error. See (nitconfig_template.txt)");
            console.log(e);
        }
        return json;
    };
}

function Printer(){
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

    this.description = function(issueID, fields) {
        var issuetype = fields.issuetype ? fields.issuetype.name || "" : "typeless";
        var status = fields.status ? fields.status.name || "" : "without any status";
        var assignee = fields.assignee ? fields.assignee.displayName || "" : "no one";
        this._description(issueID, fields.description || "",
            status, issuetype, assignee);
    };

    this._description = function(key, description, status, issuetype, assignee) {
        description = this.truncateLines(description);
        console.log(("\t|  " + key).title);
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
        process.stdout.write(this.smallMargin);
        console.log(c.arg.arg, " ---> ", c.name.help);
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
}



function Nit() {
    this.printer = new Printer();
    this.nettings = new NitSettings().load();

    this.nira = new Nira(this.nettings);
    this.nerver = new Nerver();
    this.nitClient = new NitClient(this.nerver);

    this.cmds = [
               {arg: "b", name: "discoverBranch", requiresClean: false, action: function(nit, arg, currentBranch){ nit.onBranch(); }},
               {arg: "cob", name: "createAndCheckoutBranch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutBranch(arg, currentBranch); }},
               {arg: "st", name: "status", requiresClean: false, action: function(nit, arg, currentBranch){ nit.statusPrint(currentBranch); }},
               {arg: "fb", name: "createAndCheckoutFeatureBranch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutFeatureBranch(arg, currentBranch); }},
               {arg: "dev", name: "checkout develop", requiresClean: true, action: function(nit, arg, currentBranch){ nit.gotoDevelop(currentBranch); }},
               {arg: "push", name: "push", requiresClean: true, action: function(nit, arg, currentBranch){ nit.pushFull(currentBranch); }},
               {arg: "fci", name: "make a commit on feature", requiresClean: false, action: function(nit, arg, currentBranch){ nit.featureCommit(arg, currentBranch); }},
               {arg: "sfci", name: "stage and make a commit on feature", requiresClean: false, action: function(nit, arg, currentBranch){ nit.stage(function(){nit.featureCommit(arg, currentBranch); });}},
               {arg: "derge", name: "merge develop into current branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.devMerge(currentBranch); }},
               {arg: "upderge", name: "update develop and merge develop into current branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.updateDevThenMerge(currentBranch); }},
               {arg: "ci", name: "commit", requiresClean: false, action: function(nit, arg, currentBranch){ nit.commit(arg, currentBranch); }},
               {arg: "help", name: "help", requiresClean: false, action: function(nit, arg, currentBranch){ nit.help(); }},
               {arg: "browse", name: "browse jira", requiresClean: false, action: function(nit, arg, currentBranch){ nit.browse(currentBranch); }},
               {arg: "stage", name: "stage", requiresClean: false, action: function(nit, arg, currentBranch){ nit.stage(); }},
               {arg: "sts", name: "status -s", requiresClean: false, action: function(nit, arg, currentBranch){ nit.sts(); }},
               {arg: "nerver", name: "start nerver", requiresClean: false, action: function(nit, arg, currentBranch){ nit.startNerver(); }},
               {arg: "describe", name: "describe", requiresClean: false, action: function(nit, arg, currentBranch){ nit.describe(currentBranch); }},
               {arg: "comments", name: "comments", requiresClean: false, action: function(nit, arg, currentBranch){ nit.comments(currentBranch); }},
               //{arg: "init", name: "initConfig", requiresClean: false, action: function(nit, arg, currentBranch){ nit.nettings.init(); }},
               {arg: "qci", name: "quick stage and commit with a generated message \"['currentBranch'] quick commit.\"", requiresClean: false, action:
                        function(nit, arg, currentBranch){
                            nit.stage(function(){
                                nit.commit("[" + currentBranch + "] quick commit.", currentBranch);
                            });
                        }
               }
         ];

    this.startNerver = function() {
        this.nerver = new Nerver(this.nira).start();
    };

    this.browse = function(currentBranch) {
        var ticket = this.nira.ticketIDFromBranch(currentBranch);
        this.run("open", [this.nira.baseURL + ticket]);
    };

    this.getCommand = function(arg) {
        for(var i=0; i<this.cmds.length; i++){
            if(this.cmds[i].arg === arg){
                return this.cmds[i];
            }
        }
        return undefined;
    };

    this.help = function() {
        var self = this;
        for(var i=0; i<this.cmds.length; i++){
            var c = this.cmds[i];
            self.printer.printCmd(c);
        }
    };

    this.start = function(cliArgs){
        var self = this;
        var cmd = cliArgs[0] ? self.getCommand(cliArgs[0]) : self.getCommand("help");
        if(cmd) {
            self.isCleanStatus(function(data, clean, currentBranch){
                if(clean || !cmd.requiresClean){
                    cmd.action(self, cliArgs[1], currentBranch);
                } else {
                    self.nerrorUnclean();
                }
            });
        } else {
            self.gitInherit(cliArgs);
        }
    };
    //

    this.sts = function() {
        this.gitInherit(["status", "-s"]);
    };

    this.featureCommit = function(message, currentBranch){
        var self = this;
        if(!message){
            self.printer.E("NERROR: Missing a commit message!");
            return;
        }
        if(self.isOnAFeatureBranch(currentBranch)){
            var prefix = currentBranch.replace(self.nettings.featureBranchPrefix, "");
            var msg = prefix + " " + message;
            self.commit(msg);
        } else {
            self.printer.E("NERROR: Cannot commit feature while on non-feature branch '" + currentBranch + "'");
        }
    };

    this.commit = function(message){
        var self= this;
        if(!message){
            self.printer.print("NERROR: Missing a commit message!");
            return;
        }

        self.changesStagedStatus(function(staged, unstaged, untracked){
            if(staged){
                self.git(["commit", "-m", message], function(){
                    if(unstaged || untracked){
                        self.printer.print("NWARNING: Committed some things, but some changes were not staged to commit!");
                    }
                });
            } else {
                self.printer.print("NERROR: Nothing staged to commit!");
            }
        });
    }

    this.changesStagedStatus = function(cb) {
        var self = this;
        self.status(function(data){
            var staged = data.indexOf("Changes to be committed:") != -1;
            var unstaged = data.indexOf("Changes not staged for commit:") != -1;
            var untracked = data.indexOf("Untracked files:") != -1;
            cb && cb(staged, unstaged, untracked)
        });
    };

    this.isOnAFeatureBranch = function(currentBranch){
        var self = this;
        return currentBranch.indexOf(self.nettings.featurePrefix)!=-1;
    };

    this.updateDevThenMerge = function(currentBranch){
        var self = this;
        if(currentBranch==="develop"){
            self.printer.E("Already on develop.  Did no work.");
            return;
        }

        self.gotoDevelop(currentBranch, function(success) {
            self.git(["pull", "origin", "develop"], function(){
                self.git(["checkout", currentBranch], function(data){
                    self.git(["merge", "develop"], function(data){
                        var alreadyUpStrFound = false;
                        var isAlreadyStr = data.indexOf("Already up-to-date") != -1;

                        if(!isAlreadyStr || !alreadyUpStrFound){
                            self.printer.print(data);
                        }
                        if(isAlreadyStr) {
                            alreadyUpStrFound = true;
                        }
                    });
                });
            });
        });
    };

    this.devMerge = function(currentBranch){
        var self = this;
         if(currentBranch==="develop"){
            self.printer.E("Already on develop.  Did no work.");
            return;
        }

        self.printer.I("Merging develop into " + currentBranch);
        var gitArgs = ["merge", "develop"];
        self.git(gitArgs, function(data){
            console.log(data);
        });
    };

    this.gotoDevelop = function(currentBranch, cb){
         this.createAndCheckoutBranch("develop", currentBranch, cb);
    };

    this.createAndCheckoutFeatureBranch = function(branchName, currentBranch, cb) {
        if(!branchName || branchName.length == 0){
            this.printer.E("NError! Cannot create feature branch ''");
            cb && cb();
            return;
        }
        this.createAndCheckoutBranch(this.nettings.featurePrefix + branchName, currentBranch, cb);
    };

    this.createAndCheckoutBranch = function(branchName, currentBranch, cb){
        var self = this;
        if(currentBranch.trim() != branchName.trim()){
           self.git(["checkout", branchName], function(data){
                var search = "error: ";
                if(data.indexOf(search) === -1){
                    cb && cb();
                } else {
                    self.git(["checkout", "-b", branchName], function(){
                        self.printer.print("Created branch "+branchName+" out of "+currentBranch);
                        cb && cb();
                    });
                }
            });
        } else {
            self.printer.print("Already on " + branchName);
            cb && cb();
        }
    };

    this.onBranch = function(currentBranch){
        var self = this;
        this.status(function(data){
            self.printer.printBranch(self.discoverBranch(data));
        });
    };

    this.pushFull = function(currentBranch){
        var self = this;
        self.push(currentBranch);
    };

    this.setPush = function(branch, cb) {
        this.git(["push", "--set-upstream-to origin/" + branch], cb);
    };

    this.push = function(branch) {
        var self = this;
        this.git(["push", "origin", branch], function(data){
            self.printer.print(data);
        });
    };

    this.nerrorUnclean = function() {
        var self = this;
        self.printer.E("NERROR! Unclean status!");
    };

    this.statusPrint = function() {
        var self = this;
        this.git(["status"], function(str){
            self.printer.print(str);
        });
    };

    this.describe = function(currentBranch) {
        var self = this;
        self.nitClient.sendCmd(self.nerver.CMDS.DESCRIPTION, self.nira.ticketIDFromBranch(currentBranch), function(fields){
            fields = JSON.parse(fields);
            self.printer.description(self.nira.ticketIDFromBranch(currentBranch), fields);
        });
    };

    this.comments = function(currentBranch) {
        var self = this;
        self.nitClient.sendCmd(self.nerver.CMDS.COMMENTS, self.nira.ticketIDFromBranch(currentBranch), function(data){
            self.printer.comments(data);
        });
    };

    this.status = function(cb) {
         this.git(["status"], cb);
    };

    this.stage = function(cb) {
        var self = this;
        this.git(["add", "."], function(){
            self.git(["add", "-u"], cb);
        });
    };

    this.isCleanStatus = function(cb){
        var self = this;
        self.status(function(data) {
            cb && cb(data, data.indexOf("nothing to commit") != -1, self.discoverBranch(data));
        });
    };

    this.discoverBranch = function(statusData){
        var search = "On branch ";
        var branch = undefined;
        if(statusData.indexOf(search) != -1){
            var branchStartIndex = search.length;
            var sub1 = statusData.substring(branchStartIndex, statusData.length);
            var branchEndIndex = statusData.indexOf("Your branch");
            branchEndIndex = branchEndIndex === -1 ? statusData.indexOf("nothing") : branchEndIndex;
            branchEndIndex = branchEndIndex === -1 ? statusData.indexOf("Changes") : branchEndIndex;
            branch = statusData.substring(branchStartIndex, branchEndIndex).trim();
        }
        return branch;
    };

    this.git = function(cmdArgs, cb) {
        this.run("git", cmdArgs, cb);
    };

    this.gitInherit = function(cmdArgs, cb) {
        this.runInherit("git", cmdArgs, cb);
    };

    this.runInherit = function(cmd, cmdArgs, cb) {
        var msg = cmd;
        if(cmdArgs){
            for(var i=0; i<cmdArgs.length; i++) {
                msg += " "+cmdArgs[i];
            }
        }
        var spawn = require('child_process').spawn;
        spawn(cmd, cmdArgs, {stdio : 'inherit'});

        cb && cb();
    };

    this.run = function(cmd, cmdArgs, cb) {
        var spawn = require('child_process').spawn,
        ls = spawn(cmd, cmdArgs);
        //console.log("RUNNING ", cmd, cmdArgs);
        var out = "";
        var error = false;
        ls.stdout.on('data', function (data) {
            out += "\n" + (data ? data.toString() : "");
        });
        ls.stderr.on('data', function (data) {
            error = true;
            out += "\n" + (data ? data.toString() : "");
        });

        ls.on('close', function (code) {
            cb && cb(out, error);
        });
    };
}

function Nira(nettings) {

    this.nettings = nettings;
    this.baseURL = "https://" + this.nettings.jira.host + "/browse/";


    this.login = function(username, password, cb) {
        var self = this;
        self.basicAuth = new Buffer(username + ":" + password).toString('base64');
        cb && cb();
    };

    this.getOptions = function(path){
         return {
                    host: this.nettings.jira.host,
                    port: 443,
                    method: 'GET',
                    path : "/rest/api/2/"+path,
                    headers: { "Content-Type": "application/json", "Authorization": "Basic "+this.basicAuth }
                };
    };

    this.getIssue = function(issueID, cb) {
        var self = this;


        var options = self.getOptions('issue/' + issueID);
        self.GET(options, cb);
    };

    this.GET = function(options, cb) {
        var data = "";
        var https = require('https');
        var req = https.request(options, function(res) {
            res.on('data', function(d) {
                data +=d;
            });
            res.on('end', function(){
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    data = {error:e};
                }
                cb && cb(data);
            });
        });

        req.end();

        req.on('error', function(e) {
          cb && cb({error:e});
        });
    };

    this.describe = function(issueID, cb) {
        this.getIssue(issueID, function(data){
            try {
                var F = data.fields;
                cb && cb(F);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };

    this.comments = function(issueID, cb) {
        this.getIssue(issueID, function(data){
            try {
                cb && cb(data.fields.comment);
            } catch (e) {
                cb && cb("ERROR!" + e.toString());
            }
        });
    };
    this.ticketIDFromBranch = function(b){
        return b.replace(this.nettings.featurePrefix, this.nettings.jiraPrefix);
    };
}

function NitClient(nerver) {

    this.nerver = nerver;
    this.fs = require('fs');

    this.sendCmd = function(cmd, option, cb) {
        var self = this;
        var guid = self.generateUUID();
        self.fs.writeFileSync(self.nerver.cmdDir + "/" + cmd +"." + option + "." + guid, "");

        self.readInterval = setInterval(function(){
            var responseFile = self.nerver.responseDir + "/" + guid;
            var content = "";
            self.readInterval.attempts++
            self.readInterval.maxAttempts = 5000;
            content = self.readSync(responseFile) || "";
            if(content.indexOf(self.nerver.NendOfFile) != -1 || self.readInterval.attempts >= self.readInterval.maxAttempts) {
                var finalData = content.replace(self.nerver.NendOfFile, "");
                cb && cb(finalData);
                clearInterval(self.readInterval);
            }
        }, 500);
    };

    this.readSync = function(f) {
        var c = "";
        try {
           c = this.fs.readFileSync(f).toString();
        } catch(e){
            c = e;
        }
        return c.toString();
    };

    this.generateUUID = function(){
        return Date.now();
    };
};

function Nerver(nira) {

    this.fs = require('fs');
    this.nira = nira;
    this.NendOfFile = "\n@NOF@!!_!!*@@";
    this.cmdDir = __dirname+"/cmds";
    this.responseDir = __dirname+"/cmdresponse";
    this.period = 200;
    this.timeoutCount = (8 * 60 * 60000) / this.period;

    this.CMDS = {
        DESCRIPTION : "DESCRIPTION",
        COMMENTS : "COMMENTS"
    };

    this.prompt = function(cb) {
        var self = this;
        var prompt = require('prompt');

        var properties = [
        {
            name: 'username'
        },
        {
            name: 'password',
            hidden: true
        }
        ];

        prompt.start();

        prompt.get(properties, function (err, result) {
            if (err) { return onErr(err); }
            self.nira.login(result.username, result.password, function(){
                cb && cb();
            });
        });

        function onErr(err) {
            console.log(err);
            return 1;
        }
    };


    this.start = function() {
        var self = this;
        self.prompt(function() {
            self.counter = 0;
            self.runInterval = setInterval(function() {
                if(self.counter > self.timeoutCount){
                    clearInterval(self.runInterval);
                    console.log("Nerver session ended.");
                    process.exit();
                    return;
                }
                self.counter++;
                console.log('\n>>>');
                self.mkdir(self.cmdDir);
                self.mkdir(self.responseDir)
                var files = self.fs.readdirSync(self.cmdDir);
                for(var i=0; i<files.length; i++) {
                    var f = files[i];
                    self.run(f);
                    self.deleteFile(f);
                }
                console.log("<<<");
            }, self.period);
        });

    };

    this.deleteFile = function(file) {
        this.fs.unlinkSync(this.cmdDir + "/" + file);
    };

    this.run = function(f) {
        var self = this;
        var split = f.split(".");
        if(!f || split.length !== 3){
            return;
        }
        var cmd = split[0];
        var option = split[1];
        var guid = split[2];
        var responseFile = self.responseDir + "/" + guid;
        try {
            if(cmd === self.CMDS.DESCRIPTION){
                self.nira.describe(option, function(data){
                    data = data || "";
                    self.fs.writeFile(responseFile, JSON.stringify(data)+self.NendOfFile);
                });
            } else if(cmd === self.CMDS.COMMENTS){
                self.nira.comments(option, function(data){
                    data = data || "";
                    self.fs.writeFile(responseFile, JSON.stringify(data)+self.NendOfFile);
                });
            }
        } catch (e) {
             self.fs.writeFile(responseFile, e.toString() + self.NendOfFile)
        }
    };

    this.mkdir = function(dir){
        try { this.fs.mkdirSync(dir); }catch(e){}
    };
}
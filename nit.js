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
      error: 'red',
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
}



function Nit() {
    this.printer = new Printer();
    this.nettings = new NitSettings().load();

    this.nira = new Nira(this.nettings);

    this.cmds = [
               {arg: "b", name: "discoverBranch", requiresClean: false, action: function(nit, arg, currentBranch){ nit.onBranch(); }},
               {arg: "cob", name: "createAndCheckoutBranch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutBranch(arg, currentBranch); }},
               {arg: "st", name: "status", requiresClean: false, action: function(nit, arg, currentBranch){ nit.statusPrint(currentBranch); }},
               {arg: "fb", name: "createAndCheckoutFeatureBranch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutFeatureBranch(arg, currentBranch); }},
               {arg: "dev", name: "checkout develop", requiresClean: true, action: function(nit, arg, currentBranch){ nit.gotoDevelop(currentBranch); }},
               {arg: "push", name: "push", requiresClean: true, action: function(nit, arg, currentBranch){ nit.pushFull(currentBranch); }},
               {arg: "fci", name: "make a commit on feature", requiresClean: false, action: function(nit, arg, currentBranch){ nit.featureCommit(arg, currentBranch); }},
               {arg: "derge", name: "update develop and merge develop into current branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.updateDevThenMerge(currentBranch); }},
               {arg: "ci", name: "commit", requiresClean: false, action: function(nit, arg, currentBranch){ nit.commit(arg, currentBranch); }},
               {arg: "help", name: "help", requiresClean: false, action: function(nit, arg, currentBranch){ nit.help(); }},
               {arg: "browse", name: "browse jira", requiresClean: false, action: function(nit, arg, currentBranch){ nit.browse(currentBranch); }},
               {arg: "stage", name: "stage", requiresClean: false, action: function(nit, arg, currentBranch){ nit.stage(); }},
               {arg: "sts", name: "status -s", requiresClean: false, action: function(nit, arg, currentBranch){ nit.sts(); }},
               //{arg: "init", name: "initConfig", requiresClean: false, action: function(nit, arg, currentBranch){ nit.nettings.init(); }},
               {arg: "qci", name: "stage and commit", requiresClean: false, action:
                        function(nit, arg, currentBranch){
                            nit.stage(function(){
                                nit.commit("quick commit", currentBranch);
                            });
                        }
               }
         ];

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
        var alreadyUpStrFound = false;
        self.gotoDevelop(currentBranch, function(success) {
            if(success === false){
               self.printer.E("Failed to derge!");
               return;
            }
            self.git(["pull", "origin", "develop"], function(){
                self.git(["checkout", currentBranch], function(data){
                    self.git(["merge", "develop"], function(data){
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
                    cb && cb(false);
                } else {
                    self.git(["checkout", "-b", branchName], function(){
                        self.printer.print("Created branch "+branchName+" out of "+currentBranch);
                        cb && cb(true);
                    });
                }
            });
        } else {
            self.printer.print("Already on " + branchName);
            cb && cb(false);
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
        var search = "On branch";
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
        // console.log("RUNNING ", cmd, cmdArgs);
        var ran = false;
        ls.stdout.on('data', function (data) {
            ran = true;
            cb && cb(data ? data.toString() : "");
        });
        ls.stderr.on('data', function (data) {
            ran = true;
            cb && cb(data ? data.toString() : "", true);
        });

        ls.on('close', function (code) {
            if(!ran){
                ran = true;
                cb && cb(code ? code.toString() : "");
            }
        });
    };
}

function Nira(nettings) {

    this.nettings = nettings;
    this.baseURL = "https://" + this.nettings.jira.host + "/browse/";

//    this.getIssue = function(issueID, cb) {
//       var self = this;
//       var http = require('http');
//       http.get({
//            host: self.nettings.host,
//            path: '/browse/' + issueID
//        }, function(response) {
//            // Continuously update stream with data
//            var body = '';
//            response.on('data', function(d) {
//                body += d;
//            });
//            response.on('end', function() {
//
//                // Data reception is done, do whatever with it!
//                var parsed = JSON.parse(body);
//                cb && cb(body);
//            });
//            response.on('error', function() {
//                console.log('https error');
//            })
//        });
//
//    };
//
//
//
//    this.describe = function(issueID) {
//        this.getIssue(issueID, function(data){
//            console.log(data);
//        });
//    };

    this.ticketIDFromBranch = function(b){
        return b.replace(this.nettings.featurePrefix, this.nettings.jiraPrefix);
    };
}
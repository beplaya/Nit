#!/usr/bin/env node

var nit = new Nit();
nit.start(process.argv.slice(2));


function Nit() {

    this.runner = new Runner();
    this.printer = require('./lib/printer.js')();
    this.nettings = require('./lib/nit_settings.js')().load();
    this.nira = require('./lib/nira/nira.js')(this.nettings);
    this.nerver = require('./lib/nerver.js')(this.nira);
    this.nitClient = require('./lib/nit_client.js')(this.nerver);

    this.cmds = [
               {arg: "help", name: "Help", requiresClean: false, action: function(nit, arg, currentBranch){ nit.help(); }},
               {arg: "st", name: "Status", requiresClean: false, action: function(nit, arg, currentBranch){ nit.statusPrint(currentBranch); }},
               {arg: "sts", name: "Status -s", requiresClean: false, action: function(nit, arg, currentBranch){ nit.sts(); }},
               {arg: "b", name: "Discover branch", requiresClean: false, action: function(nit, arg, currentBranch){ nit.onBranch(); }},
               {arg: "push", name: "Push", requiresClean: true, action: function(nit, arg, currentBranch){ nit.push(currentBranch); }},
               {arg: "pull", name: "Pull", requiresClean: false, action: function(nit, arg, currentBranch){ nit.pull(currentBranch); }},
               {arg: "cob", name: "Create and checkout branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutBranch(arg, currentBranch); }},
               {arg: "fb", name: "Create and checkout feature branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutFeatureBranch(arg, currentBranch); }},
               {arg: "dev", name: "Checkout develop", requiresClean: true, action: function(nit, arg, currentBranch){ nit.gotoDevelop(currentBranch); }},
               {arg: "derge", name: "Merge develop into current branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.devMerge(currentBranch); }},
               {arg: "upderge", name: "Update develop and merge develop into current branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.updateDevThenMerge(currentBranch); }},
               {arg: "stage", name: "Stage", requiresClean: false, action: function(nit, arg, currentBranch){ nit.stage(); }},
               {arg: "ci", name: "Commit", requiresClean: false, action: function(nit, arg, currentBranch){ nit.commit(arg, currentBranch); }},
               {arg: "fci", name: "Make a commit on feature", requiresClean: false, action: function(nit, arg, currentBranch){ nit.featureCommit(arg, currentBranch); }},
               {arg: "qfci", name: "Quick stage and make a commit on feature", requiresClean: false, action: function(nit, arg, currentBranch){ nit.stage(function(){nit.featureCommit(arg, currentBranch); });}},
               {arg: "qci", name: "Quick stage and commit with a generated message \"['currentBranch'] quick commit.\"", requiresClean: false, action:
                        function(nit, arg, currentBranch){
                            nit.stage(function(){
                                nit.commit("[" + currentBranch + "] quick commit.", currentBranch);
                            });
                        }
               },
               {arg: "qrci", name: "Quick stage and commit only README.md with a generated message \"['currentBranch'] README update.\"", requiresClean: false, action:
                       function(nit, arg, currentBranch){
                           nit.git(["add", "README.md"], function(){
                               nit.commit("[" + currentBranch + "] README update.", currentBranch);
                           });
                       }
               },
               {arg: "nerver", name: "Start nerver", requiresClean: false, action: function(nit, arg, currentBranch){ nit.startNerver(); }},
               {arg: "browse", name: "Browse jira", requiresClean: false, action: function(nit, arg, currentBranch){ nit.browse(currentBranch); }},
               {arg: "describe", name: "Get JIRA description", requiresClean: false, action: function(nit, arg, currentBranch){ nit.describe(currentBranch); }},
               {arg: "comments", name: "Get JIRA comments", requiresClean: false, action: function(nit, arg, currentBranch){ nit.comments(currentBranch); }},
               {arg: "mkcomment", name: "Create JIRA comment", requiresClean: false, action: function(nit, arg, currentBranch){ nit.createComment(arg, currentBranch); }}
         ];

    this.startNerver = function() {
        this.nerver.start();
    };

    this.browse = function(currentBranch) {
        var ticket = this.nira.ticketIDFromBranch(currentBranch);
        this.runner.run("open", [this.nira.baseURL + ticket]);
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
        self.printer.logo('./logo');
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
            self.printer.E("NERROR: Missing a commit message!");
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
                self.printer.E("NERROR: Nothing staged to commit!");
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

    this.setPull = function(branch, cb) {
        this.git(["push", "--set-upstream-to origin/" + branch], cb);
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

    this.pull = function(branch) {
        var self = this;
        this.git(["pull", "origin", branch], function(data){
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
        self.nitClient.sendCmd("DESCRIBE", self.nira.ticketIDFromBranch(currentBranch), "", function(fields){
            self.printer.description(self.nira.ticketIDFromBranch(currentBranch), fields);
        });
    };

    this.comments = function(currentBranch) {
        var self = this;
        self.nitClient.sendCmd("COMMENTS", self.nira.ticketIDFromBranch(currentBranch), "", function(data){
            self.printer.comments(data);
        });
    };

    this.createComment = function(comment, currentBranch) {
        var self = this;
        self.nitClient.sendCmd("CREATE_COMMENT", self.nira.ticketIDFromBranch(currentBranch), comment, function(data){
            console.log("done");
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
        this.runner.run("git", cmdArgs, cb);
    };

    this.gitInherit = function(cmdArgs, cb) {
        this.runner.runInherit("git", cmdArgs, cb);
    };

}

function Runner() {
    this.child_process = require('child_process');
    this.runInherit = function(cmd, cmdArgs, cb) {
        var msg = cmd;
        if(cmdArgs){
            for(var i=0; i<cmdArgs.length; i++) {
                msg += " "+cmdArgs[i];
            }
        }
        var spawn = this.child_process.spawn;
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

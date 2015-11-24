module.exports = function(){
return [
           {arg: "help", name: "Help", requiresClean: false, action: function(nit, arg, currentBranch){ nit.help(); }},
           {arg: "st", name: "Status", requiresClean: false, action: function(nit, arg, currentBranch){ nit.statusPrint(currentBranch); }},
           {arg: "sts", name: "Status -s", requiresClean: false, action: function(nit, arg, currentBranch){ nit.sts(); }},
           {arg: "b", name: "Discover branch", requiresClean: false, action: function(nit, arg, currentBranch){ nit.onBranch(); }},
           {arg: "l1", name: "'git log --pretty=oneline' with extra Nit formatting", requiresClean: false, action: function(nit, arg, currentBranch){ nit.logOneLiners(); }},
           {arg: "push", name: "Push (assumes origin/<branch>)", requiresClean: true, action: function(nit, arg, currentBranch){ nit.push(currentBranch); }},
           {arg: "pull", name: "Pull (assumes origin/<branch>)", requiresClean: false, action: function(nit, arg, currentBranch){ nit.pull(currentBranch); }},
           {arg: "cob", name: "Create and checkout branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutBranch(arg, currentBranch); }},
           {arg: "fb", name: "Create and checkout feature branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.createAndCheckoutFeatureBranch(arg, currentBranch); }},
           {arg: "dev", name: "Checkout develop", requiresClean: true, action: function(nit, arg, currentBranch){ nit.gotoDevelop(currentBranch); }},
           {arg: "derge", name: "Merge develop into current branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.devMerge(currentBranch); }},
           {arg: "upderge", name: "Update develop and merge develop into current branch", requiresClean: true, action: function(nit, arg, currentBranch){ nit.updateDevThenMerge(currentBranch); }},
           {arg: "stage", name: "Stage", requiresClean: false, action: function(nit, arg, currentBranch){ nit.stage(); }},
           {arg: "ci", name: "Commit", requiresClean: false, takesArray: true, action:
               function(nit, argz, currentBranch){
                   var message = nit.ciMessageFromArgs(argz);
                   nit.commit(message, currentBranch);
               }
           },
           {arg: "fci", name: "Make a commit on feature", requiresClean: false, takesArray: true, action:
               function(nit, argz, currentBranch){
                   var message = nit.ciMessageFromArgs(argz);
                   nit.featureCommit(message, currentBranch);
               }
           },
           {arg: "qfci", name: "Quick stage and make a commit on feature", requiresClean: false, action:
               function(nit, arg, currentBranch){
                   nit.stage(function(){nit.featureCommit(arg, currentBranch); });
               }
           },
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
           //{arg: "mkcomment", name: "Create JIRA comment", requiresClean: false, action: function(nit, arg, currentBranch){ nit.createComment(arg, currentBranch); }}
           {arg: "lcf", name: "Log commit frequency information", requiresClean: false, action: function(nit, arg, currentBranch){ nit.log.getCommitFrequency(); }},
           {arg: "wcf", name: "Log commit frequency information to file", requiresClean: false, action: function(nit, arg, currentBranch){ nit.log.updateStatPage(); }},

     ];
};
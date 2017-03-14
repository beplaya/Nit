module.exports = function(){
return [
           {arg: "help", name: "Help", requiresClean: false, action:            function(nit, arg, currentBranch, statusData, cbAll){ nit.help(cbAll); }},
           {arg: "st", name: "Status", requiresClean: false, action:            function(nit, arg, currentBranch, statusData, cbAll){ nit.printStatusData(statusData, cbAll); }},
           {arg: "sts", name: "Status -s", requiresClean: false, action:        function(nit, arg, currentBranch, statusData, cbAll){ nit.sts(cbAll); }},
           {arg: "b", name: "Discover branch", requiresClean: false, action:    function(nit, arg, currentBranch, statusData, cbAll){ nit.onBranch(cbAll); }},
           {arg: "l1", name: "'git log --pretty=oneline' with extra Nit formatting", requiresClean: false, action:      function(nit, arg, currentBranch, statusData, cbAll){ nit.logOneLiners(currentBranch, cbAll); }},
           {arg: "push", name: "Push (assumes origin/<branch>)", requiresClean: true, action:                           function(nit, arg, currentBranch, statusData, cbAll){ nit.push(currentBranch, cbAll); }},
           {arg: "pull", name: "Pull (assumes origin/<branch>)", requiresClean: false, action:                          function(nit, arg, currentBranch, statusData, cbAll){ nit.pull(currentBranch, cbAll); }},
           {arg: "cob", name: "Create and checkout branch", requiresClean: true, action:                    function(nit, arg, currentBranch, statusData, cbAll){ nit.createAndCheckoutBranch(arg, currentBranch, cbAll); }},
           {arg: "fb", name: "Create and checkout feature branch (#)", requiresClean: true, action:         function(nit, arg, currentBranch, statusData, cbAll){ nit.createAndCheckoutFeatureBranch(arg, currentBranch, cbAll); }},
           {arg: "delfb", name: "Delete feature branch (#)", requiresClean: false, action:                              function(nit, arg, currentBranch, statusData, cbAll){ nit.deleteFeatureBranch(arg, currentBranch, cbAll); }},
           {arg: "dev", name: "Checkout develop", requiresClean: true, action:                                          function(nit, arg, currentBranch, statusData, cbAll){ nit.gotoDevelop(currentBranch, cbAll); }},
           {arg: "derge", name: "Merge develop into current branch", requiresClean: true, action:                       function(nit, arg, currentBranch, statusData, cbAll){ nit.devMerge(currentBranch, cbAll); }},
           {arg: "upderge", name: "Update develop and merge develop into current branch", requiresClean: true, action:  function(nit, arg, currentBranch, statusData, cbAll){ nit.updateDevThenMerge(currentBranch, cbAll); }},
           {arg: "stage", name: "Stage", requiresClean: false, action:                                                  function(nit, arg, currentBranch, statusData, cbAll){ nit.stage(cbAll); }},
           {arg: "ci", name: "Commit", requiresClean: false, takesArray: true, action:
               function(nit, argz, currentBranch, statusData, cbAll){
                   var message = nit.ciMessageFromArgs(argz);
                   nit.commit(message, currentBranch, cbAll);
               }
           },
           {arg: "fci", name: "Make a commit on feature", requiresClean: false, takesArray: true, action:
               function(nit, argz, currentBranch, statusData, cbAll){
                   var message = nit.ciMessageFromArgs(argz);
                   nit.featureCommit(message, currentBranch, cbAll);
               }
           },
           {arg: "qrci", name: "Quick stage and commit only README.md with a generated message \"['currentBranch'] README update.\"", requiresClean: false, action:
               function(nit, arg, currentBranch, statusData, cbAll){
                   nit.git(["add", "README.md"], function(){
                       nit.commit("[" + currentBranch + "] README update.", currentBranch);
                       cbAll && cbAll();
                   });
               }
           },
           {arg: "team", name: "Start team nerver", requiresClean: false, action:                   function(nit, arg, currentBranch, statusData, cbAll){ nit.startTeamNerver(arg, cbAll); }},
           {arg: "browse", name: "Browse jira", requiresClean: false, action:                       function(nit, arg, currentBranch, statusData, cbAll){ nit.browse(currentBranch, cbAll); }},
           {arg: "describe", name: "Get JIRA description", requiresClean: false, action:            function(nit, arg, currentBranch, statusData, cbAll){ nit.describe(currentBranch, cbAll); }},
           {arg: "comments", name: "Get JIRA comments", requiresClean: false, action:               function(nit, arg, currentBranch, statusData, cbAll){ nit.comments(currentBranch, cbAll); }},

     ];
};
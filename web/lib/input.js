module.exports = function(app){
    var bodyParser = require('body-parser');
    app.use( bodyParser.json() );       // to support JSON-encoded bodies
    //
    app.projectData = {};
    //
    app.post('/rest/1.0/input/projects/:project_key/:issue_key/:which_data/:tool', function(req, res){
        try {
            var data = req.body;

            var projectKey = req.params.project_key.toUpperCase();

            var whichData = req.params.which_data.toLowerCase();
            var issueKey = req.params.issue_key;
            var tool = req.params.tool.toLowerCase();
            console.log("<",projectKey, issueKey, whichData, tool, ">");
            if(!app.projectData[projectKey])
            {
                app.projectData[projectKey] = {};
            }
            if(tool==="jira"){
                app.nira.getIssue(issueKey, function(issueData){
                    app.projectData[projectKey]["issue"] = issueData;
                    app.inputListener.onData(projectKey);
                    res.status(200).send(issueData);
                });
            }else{
                app.projectData[projectKey][whichData] = data;
                app.inputListener.onData(projectKey);
                res.status(200).send("{}");
            }
        }catch(e){
            console.log("503", e);
            res.status(503).send("503");
        }
    });

};
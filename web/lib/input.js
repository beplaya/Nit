module.exports = function(app){
    var bodyParser = require('body-parser');
    app.use( bodyParser.json() );       // to support JSON-encoded bodies
    //
    app.projectData = {};
    //
    app.post('/rest/1.0/input/projects/:project_key/:issue_key/:which_data/:tool/:from_update', function(req, res){
        try {
            var data = req.body;

            var projectKey = req.params.project_key.toUpperCase();

            var fromUpdate = req.params.from_update.toLowerCase() === "true";
            var whichData = req.params.which_data.toLowerCase();
            var issueKey = req.params.issue_key;
            var tool = req.params.tool.toLowerCase();
            //console.log("<",projectKey, issueKey, whichData, tool, fromUpdate, ">");
            if(!app.projectData[projectKey])
            {
                app.projectData[projectKey] = {};
            }
            if(tool==="jira"){
                app.nerver.nira.getIssue(issueKey, function(issueData){
                    issueData.url = app.nerver.nira.baseURL + issueKey;
                    app.projectData[projectKey]["issue"] = issueData;
                    app.inputListener.onData(issueData, projectKey, fromUpdate, whichData);
                    res.status(200).send(issueData);
                });
            }else{
                app.projectData[projectKey][whichData] = data;
                app.inputListener.onData(data, projectKey, fromUpdate, whichData);
                res.status(200).send("{}");
            }
        }catch(e){
            console.log("503", e);
            res.status(503).send("503");
        }
    });

};
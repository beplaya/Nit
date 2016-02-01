module.exports = function(app){
    var bodyParser = require('body-parser');
    app.use( bodyParser.json() );       // to support JSON-encoded bodies
//    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//      extended: true
//    }));
    //
    app.projectData = {};
    //
    app.post('/rest/1.0/input/projects/:project_key/:which_data', function(req, res){
        try {
            var data = req.body;

            var projectKey = req.params.project_key.toUpperCase();

            var whichData = req.params.which_data.toLowerCase();
            if(!app.projectData[projectKey])
            {
                app.projectData[projectKey] = {};
            }
            app.projectData[projectKey][whichData] = data;
            //console.dir(app.projectData);
            app.inputListener.onData(projectKey);
            res.status(200).send("{}");
        }catch(e){
            console.log("503", e);
            res.status(503).send("503");
        }
    });

};
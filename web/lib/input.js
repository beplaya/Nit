module.exports = function(app){
    var bodyParser = require('body-parser');
    app.use( bodyParser.json() );       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
      extended: true
    }));
    //
    app.projectData = {};
    //
    app.post('/rest/1.0/input/projects/:project_key/:which_data', function(req, res){
        try {
            var data = req.body;

            var projectKey = req.params.project_key.toUpperCase();
            var whichData = req.params.which_data.toLowerCase();
            var contents = fs.readFileSync(file, "utf8");
            if(!app.projectData[projectKey])
            {
                app.projectData[projectKey] = {};
            }
            app.projectData[projectKey][whichData] = data;
            console.log("received for project/whichdata:", projectKey, "/", whichData);
            console.log("                          data:", data);
            res.status(200).send("{}");
        }catch(e){
            console.log(e);
            res.status(503).send("503");
        }
    });

};
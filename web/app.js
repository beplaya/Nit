var express = require('express');
var app = express();
var port = '9000';
var fs = require('fs');

app.listen(port);

app.get('/test', function(req, res){
	res.send('it works');
});


app.get('/projects/:project_key/:which_data', function(req, res){
    try {
        var projectKey = req.params.project_key.toUpperCase();
        var whichData = req.params.which_data.toLowerCase();
        var file = __dirname+"/project_cache/project_"+projectKey+"/json/"+whichData+".json";
        var contents = fs.readFileSync(file, "utf8");
        contents = JSON.parse(contents);
        res.status(200).json(contents);
	}catch(e){
	    console.log(e);
	    res.status(503).send("503");
    }
});


app.use(express.static(__dirname + '/public'));
console.log('listening on ' + port);
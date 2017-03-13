#!/usr/bin/env node
var cliArgs = process.argv.slice(2);

var debug = false;
try {
    var fs = require('fs');
    debug = fs.existsSync(__dirname + "/debug");
} catch(e) {
    debug = false;
}

var Nit = require(__dirname + "/nit.js");
var SpawnRunner = require("spawn_runner");
var runner = new SpawnRunner(debug);

if(cliArgs[0] === "setup"){

	var cmd = "cd "+__dirname+" && npm install && sudo npm install -g bower "
	    +" && cd web/ && npm install && cd public && bower install && cd "+__dirname
	    +" && cd team/ && npm install && cd public && bower install && cd "+__dirname;

	console.log("Running: "+cmd);
	child_process = require('child_process');
 
	child_process.exec(cmd, function(err, out, code) {
		if (err instanceof Error)
			throw err;
		process.stdout.write("."+out);
	});	
	

} else {
	var nit = new Nit();
	nit.start(cliArgs);
}

module.exports = nit;
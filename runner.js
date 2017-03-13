module.exports = function Runner(debug) {
    if(!this instanceof Runner) {
        return new Runner(debug);
    }
    this.debug = debug;
	this.isWin = /^win/.test(process.platform);
    this.child_process = require('child_process');
    this.runInherit = function(cmd, cmdArgs, cb) {
        if(this.debug) console.log("RUNNING ", "[", cmd,  cmdArgs.join(" "), "]");
		if(this.isWin){
			if(cmd === "open"){
				cmd = "start";
			}
		}
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
        if(this.debug) console.log("RUNNING ", "[", cmd,  cmdArgs.join(" "), "]");
		if(this.isWin){
			if(cmd === "open"){
				cmd = "start";
			}
		}
        var spawn = require('child_process').spawn,
        ls = spawn(cmd, cmdArgs);
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


};
module.exports = function Runner(child_process) {
    var RUNNER = {};
    RUNNER.child_process = child_process;
    RUNNER.runInherit = function(cmd, cmdArgs, cb) {
        var msg = cmd;
        if(cmdArgs){
            for(var i=0; i<cmdArgs.length; i++) {
                msg += " "+cmdArgs[i];
            }
        }
        var spawn = RUNNER.child_process.spawn;
        spawn(cmd, cmdArgs, {stdio : 'inherit'});

        cb && cb();
    };

    RUNNER.run = function(cmd, cmdArgs, cb) {

        var spawn = RUNNER.child_process.spawn,
        ls = spawn(cmd, cmdArgs);
        console.log("RUNNING ", cmd, cmdArgs);
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
    return RUNNER;
}

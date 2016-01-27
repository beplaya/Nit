var express = require('express');
var app = express();
var port = '9000';

app.listen(port);

app.get('/test', function(req, res){
	res.send('it works');
});


app.use(express.static(__dirname + '/public'));
console.log('listening on ' + port);
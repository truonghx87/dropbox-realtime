var express = require("express");
var app = express();
var port = process.env.PORT || 3700;
//var io = require('socket.io').listen(app.listen(port));

var request = require('request');
var config = require("./config/config").config;
var logger = require('./model/log');
/**
 * Set the paths for your files
 * @type {[string]}
 */
var pub = __dirname + '/public',
    view = __dirname + '/views';
    images = pub + '/dropboxImg/';
/** 
 * this code is being used to integrate Dropbox account with Dropbox app 
 */

/*
var dbox  = require("dbox");
var app   = dbox.app({ "app_key": config.dropbox.consumer_key, "app_secret": config.dropbox.consumer_secret });
var reqToken ;
app.requesttoken(function(status, request_token){
  console.log(request_token);
});
return;*/


/*var dbox  = require("dbox");
var app   = dbox.app({ "app_key": config.dropbox.consumer_key, "app_secret": config.dropbox.consumer_secret });
app.accesstoken({ 
    oauth_token_secret: '4IPLDmdBiRZpeNSY',
    oauth_token: '8r6BtEzLMJAx9O80',
    authorize_url: 'https://www.dropbox.com/1/oauth/authorize?oauth_token=8r6BtEzLMJAx9O80' }, function(status, access_token){
    console.log(access_token);
});
return;*/


/**
 * Set your app main configuration
 */
app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(pub));
    app.use(express.static(view));
    app.use(express.errorHandler());
});

/**
 * Render your index/view "my choice was not use jade"
 */
app.get("/views", function(req, res){
    res.render("index");
});
app.get("/webhook", function(req, res){
	logger.info("/webhook get request from dropbox service");
	var challenge = req.param('challenge');
	logger.info("challange: "+ challenge);
	res.set('Content-Type', 'text/plain');
	res.send(200, challenge);
});
var lastCursor = null;

app.post("/webhook", function(req, res) {
	//io.sockets.emit('webhook_post', {req: req});
	downloadNewImages(lastCursor);
	res.send(200, "OK");
});


var DropboxClient = require('dropbox-node').DropboxClient;

// app.get("/test", function(req, res) {
// 	sendMessage('/dropboxImg/tải xuống.jpg');
// 	res.send(200, "challenge");
// 	//downloadNewImages(lastCursor);

// });

function downloadNewImages(cursor) {
	var dropbox = new DropboxClient(config.dropbox.consumer_key, config.dropbox.consumer_secret, 
					config.dropbox.oauth_token, config.dropbox.oauth_token_secret);
	var has_more = true,  entries = [];

	makeDeltaRequest(dropbox, cursor, has_more, entries, function(entries) {
		for(var i = 0, l = entries.length; i < l; i++) {
			var entry = entries[i][1];
			if(!entry.is_dir){
				downloadFromDropbox(dropbox, entry.path);
			}
		}
	});
	logger.info("lastCursor: " + lastCursor);
};

downloadNewImages(null);

var fs = require('fs'),
	path = require('path');

function downloadFromDropbox(dropbox, imagePath) {
	var imgLink = images + path.basename(imagePath),
	relativeLink = '/dropboxImg/'+ path.basename(imagePath);
	var file = fs.createWriteStream(imgLink);
	dropbox.getFile(imagePath).pipe(file); 
	sendMessage(relativeLink);
}


function sendMessage(url) {
  io.sockets.emit('show', { url: url });
}

function makeDeltaRequest(dropboxClient, cursor, hasmore, entries, callback) {
	if(!hasmore){
		callback(entries);
		return;
	}
	dropboxClient.delta(cursor, {}, function(err, changes) {
		io.sockets.emit('delta', {cursor: cursor, lastCursor: lastCursor})
		var has_more = changes.has_more;
		cursor = changes.cursor;
		io.sockets.emit('test', {
			changes : changes,
			cursor: cursor
		});
		entries = entries.concat(changes.entries);
		makeDeltaRequest(dropboxClient, cursor, has_more, entries, callback);
	});
}

var io = require('socket.io').listen(app.listen(port));

io.configure(function () { 
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

io.sockets.on('connection', function (socket) {
	var filenames = fs.readdirSync(images);
	filenames = filenames.map(function(filename){
		return {url: ['/dropboxImg/', filename].join('')};
	});
	socket.emit('firstShow', {firstShow: filenames });
});


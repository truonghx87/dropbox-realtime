var express = require("express");
var app = express();
var port = process.env.PORT || 3700;
//var io = require('socket.io').listen(app.listen(port));

var request = require('request');
var config = require("./config/config").config;
var logger = require('./model/log');

var nodemailer = require("nodemailer");
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


/*var dbox  = require("dbox");
var app   = dbox.app({ "app_key": config.dropbox.consumer_key, "app_secret": config.dropbox.consumer_secret });
var reqToken ;
app.requesttoken(function(status, request_token){
  console.log(request_token);
});
return;*/


/*var dbox  = require("dbox");
var app   = dbox.app({ "app_key": config.dropbox.consumer_key, "app_secret": config.dropbox.consumer_secret });
app.accesstoken({ 
    oauth_token_secret: 'l959a0Imycw2ujaC',
    oauth_token: 'Fuu8ARulcfhXimQT',
    authorize_url: 'https://www.dropbox.com/1/oauth/authorize?oauth_token=Fuu8ARulcfhXimQT' }, function(status, access_token){
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
function isStartWidth(data, path_prefix) {
	return data.lastIndexOf(path_prefix, 0) === 0;
}
function downloadNewImages(cursor) {
	var dropbox = new DropboxClient(config.dropbox.consumer_key, config.dropbox.consumer_secret, 
					config.dropbox.oauth_token, config.dropbox.oauth_token_secret);
	var has_more = true,  entries = [];

	makeDeltaRequest(dropbox, cursor, has_more, entries, function(entries) {
		io.sockets.emit('entries', {entries:  JSON.stringify(entries)} )		
		for(var i = 0, l = entries.length; i < l; i++) {
			var entry = entries[i][1];
			if(entry) {
				if(!entry.is_dir && isStartWidth(entry.path, config.dropbox.image_folder)){
					io.sockets.emit('entry', {entry: JSON.stringify(entry)});
					downloadFromDropbox(dropbox, entry.path);
				}
			} else {
				deleteImage(entries[i][0]);
			}
		}
	});
	logger.info("lastCursor: " + lastCursor);
};

downloadNewImages(null);

var fs = require('fs'),
	path = require('path');

app.post("/uploaddb", function(req, res) {
	var url = req.body.url;
	var amount = req.body.amount;
	var dropbox = new DropboxClient(config.dropbox.consumer_key, config.dropbox.consumer_secret, 
					config.dropbox.oauth_token, config.dropbox.oauth_token_secret);
	var dropboxFilename =  [path.basename(url, path.extname(url)), "-", amount, path.extname(url)].join('');
	var localPath =  images + path.basename(url),
		dropboxPath = [config.dropbox.photobooth, dropboxFilename].join('/');
	dropbox.putFile(localPath, dropboxPath, function (err, data) {

		if(err) {
			console.log(err);
		}

	});
	//mail();
	res.send(200, {filename : dropboxFilename});
});
app.post('/logmail', function(req, res){
  var email = req.body.mail;
  var name = req.body.name;
  var address = req.body.address;
  var filename = req.body.filename;

  var smtpTransport = nodemailer.createTransport("SMTP", config.smtpTransport);
  var mailOptions = config.mailOptions;
  mailOptions.text =
    "Email: " + email + "\n" +
    "Name: " + name + "\n" +
    "Address: " + address + "\n" +
    "File name: " + filename + "\n";
  smtpTransport.sendMail(mailOptions, function() {
    smtpTransport.close();
  });
  res.send(200, "");
});

function deleteImage(imagePath) {

	io.sockets.emit('delete', {imagePath: imagePath});
	var imgLink = images + (path.basename(imagePath)).toLowerCase();

	var fs = require('fs');

	fs.unlink(imgLink, function (err) {
	  if(err) {
	  	io.sockets.emit('err', {err: JSON.stringify(err)})
	  }
	});
}

function downloadFromDropbox(dropbox, imagePath) {
	var imgLink = images + path.basename(imagePath).toLowerCase(),
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
	dropboxClient.delta(cursor, {
		// path_prefix: config.dropbox.image_folder
	}, function(err, changes) {
		logger.info(err);
		
		var has_more = changes.has_more;
		lastCursor = changes.cursor;
		var cursor = lastCursor;

		io.sockets.emit('test', {changes: changes, cursor: cursor, lastCursor: lastCursor});
		
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
	filenames = filenames.filter(function(filename){
		logger.info(filename);
		return filename !== '.keep';
	});
	filenames = filenames.map(function(filename){
		return {url: ['/dropboxImg/', filename].join('')};
	});
	socket.emit('firstShow', {firstShow: filenames });
});


// Create web server
// Load the http module to create an http server.
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var comments = require('./comments');
var mime = require('mime');
var cache = {};

// Start a web server
var server = http.createServer(function(request, response) {
	var pathname = url.parse(request.url).pathname;
	var filePath = false;
	if (pathname == '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + pathname;
	}
	var absPath = './' + filePath;
	serveStatic(response, cache, absPath);
});

// Start the web server on port 3000
server.listen(3000, function() {
	console.log('Server listening on port 3000');
});

// Set up the socket.io server
var io = require('socket.io').listen(server);

// Start the socket.io server
io.sockets.on('connection', function(socket) {
	handleNewComment(socket);
	handleGetComments(socket);
});

// Function to handle new comments
function handleNewComment(socket) {
	socket.on('newComment', function(comment) {
		comments.addComment(comment);
		socket.broadcast.emit('newComment', comment);
	});
}

// Function to handle get comments
function handleGetComments(socket) {
	socket.on('getComments', function() {
		comments.getComments(function(err, comments) {
			if (err) {
				throw err;
			}
			socket.emit('getComments', comments);
		});
	});
}

// Function to serve static files
function serveStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists) {
			if (exists) {
				fs.readFile(absPath, function(err, data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			} else {
				send404(response);
			}
		});
	}
}

// Function to send 404 response
function send404(response) {
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
}
// Import the required modules
const http = require('http');
const fs = require('fs');  // Import the file system module to read HTML files and log requests
const url = require('url'); // Importing the url module

// Function to log the request URL and timestamp
function logRequest(requestUrl) {
  const timestamp = new Date().toISOString(); // Get the current timestamp
  const logMessage = `${timestamp} - Requested URL: ${requestUrl}\n`;

  // Append the log message to log.txt
  fs.appendFile('log.txt', logMessage, (err) => {
    if (err) {
      console.error('Failed to log request:', err);
    }
  });
}

// Create an HTTP server
http.createServer((request, response) => {
  // Parse the request URL
  const parsedUrl = url.parse(request.url, true);
  const path = parsedUrl.pathname.toLowerCase(); // Convert to lowercase for case-insensitive comparison

  // Log the request URL and timestamp
  logRequest(request.url);

  // Check if the URL contains "documentation"
  if (path.includes('documentation')) {
    // Read and return the "documentation.html" file
    fs.readFile('documentation.html', (err, data) => {
      if (err) {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Error: documentation.html not found');
      } else {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(data);
      }
    });
  } else {
    // Otherwise, serve the "index.html" file
    fs.readFile('index.html', (err, data) => {
      if (err) {
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.end('Error: index.html not found');
      } else {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(data);
      }
    });
  }
}).listen(8080);

// Log that the server is running
console.log('My Node server is running on Port 8080.');

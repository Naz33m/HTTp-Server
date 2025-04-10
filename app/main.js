const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString();
    const lines = request.split("\r\n");
    const firstLine = lines[0];
    const parts = firstLine.split(" ");
    const path = parts[1];
    let responseBody = "";
    if (path.startsWith("/echo/")) {
      responseBody = path.substring("/echo/".length);
      console.log(responseBody);
    }
    const contentLength = Buffer.byteLength(responseBody);
    socket.write("HTTP/1.1 200 OK\r\n");
    socket.write("Content-Type: text/plain\r\n");
    socket.write(`Content-Length: ${contentLength}\r\n`);
    socket.write("\r\n");
    socket.write(responseBody);
    socket.end();
  });
});

server.listen(4221, "localhost");

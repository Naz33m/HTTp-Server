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
    console.log(firstLine);
    console.log(parts);
    console.log(path);
    if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }
    socket.end();
  });
  // socket.write("HTTP/1.1 200 OK \r\n\r\n");
  // socket.on("close", () => {
  // socket.end();
  // });
});

server.listen(4221, "localhost");

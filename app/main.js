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
      const contentLength = responseBody.length;
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${contentLength}\r\n\r\n${responseBody}`,
      );
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
      socket.destroy();
    }
  });

  socket.on("error", (e) => {
    console.error("ERROR: ", e);
    socket.end();
  });
  socket.on("close", () => {
    socket.end();
  });
});

server.listen(4221, "localhost");

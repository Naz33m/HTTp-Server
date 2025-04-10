const net = require("net");
const fs = require("fs");

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
    if (path === "/") {
      socket.write("HTTP/1.1 200 OK\r\nContent-length: 0\r\n\r\n");
    } else if (path.startsWith("/echo/")) {
      responseBody = path.substring("/echo/".length);
      const contentLength = responseBody.length;
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${contentLength}\r\n\r\n${responseBody}`,
      );
    } else if (path.startsWith("/user-agent")) {
      const headers = {};
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === "") {
          break;
        }
        const [key, value] = line.split(": ");
        headers[key.toLowerCase()] = value;
      }
      const userAgent = headers["user-agent"];
      const contentLength = userAgent ? userAgent.length : 0;
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${contentLength}\r\n\r\n${userAgent || ""}`,
      );
    } else if (path.startsWith("/files/")) {
      const filename = path.substring("/files/".length);

      const directory = process.argv[3];
      console.log(directory);
      fs.readFile(`${directory}/${filename}`, (err, data) => {
        if (err) {
          socket.write("HTTP/1.1 404 Not Found\r\nContent-length: 0\r\n\r\n");
        } else {
          const contentLength = data.length;
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${contentLength}\r\n\r\n`,
          );
          socket.write(data);
        }
      });
    } else {
      socket.write("HTTP/1.1 404 Not Found\r\nContent-length: 0\r\n\r\n");
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

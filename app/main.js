const net = require("net");
const fs = require("fs");
const zlib = require("zlib");
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  let close = 0;

  socket.on("data", (data) => {
    const request = data.toString();
    const lines = request.split("\r\n");
    const firstLine = lines[0];
    const parts = firstLine.split(" ");
    const path = parts[1];
    let responseBody = "";
    let indexOfHeaderClose = lines.filter(
      (x, index) => x.includes("Connection") && index,
    );
    close = indexOfHeaderClose.length > 0 ? 1 : 0;
    if (path === "/") {
      console.log("inside the base path ");
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-length: 0\r\n${lines[indexOfHeaderClose]} \r\n`,
      );
      if (close === 1) {
        socket.end();
      }
    } else if (path.startsWith("/echo/")) {
      let responseBody = path.substring("/echo/".length);
      let acceptEncoding = null;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === "") break;
        if (line.toLowerCase().startsWith("accept-encoding:")) {
          const encodings = line
            .split(":")[1]
            .trim()
            .split(",")
            .map((e) => e.trim());

          if (encodings.includes("gzip")) {
            acceptEncoding = "gzip";
          } else if (encodings.includes("deflate")) {
            acceptEncoding = "deflate";
          } else if (encodings.includes("br")) {
            acceptEncoding = "br";
          }
          break;
        }
      }
      // socket.write will send data to the client but will not close the connection
      // socket.end() or socket.close() are commonly used for closing connections
      socket.write("HTTP/1.1 200 OK\r\n");
      socket.write("Content-Type: text/plain\r\n");
      if (acceptEncoding === "gzip") {
        const compressedData = zlib.gzipSync(responseBody);
        socket.write("Content-Encoding: gzip\r\n");
        socket.write(`Content-Length: ${compressedData.length}\r\n`);
        socket.write("\r\n");
        socket.write(compressedData);
      } else {
        socket.write(`Content-Length: ${Buffer.byteLength(responseBody)}\r\n`);
        socket.write("\r\n");
        socket.write(responseBody);
      }
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
      // socket.write(
      //   `HTTP/1.1 200 OK\r\nContent-type: text/plain\r\nContent-length: ${contentLength}\r\nUser-Agent: ${userAgent || ""}\r\nConnection:${connectionClose || ""}`,
      // );
      if (headers["connection"]) {
        console.log("connection header found");
        socket.write("HTTP/1.1 200 OK\r\n");
        socket.write("Content-Type: text/plain\r\n");
        socket.write(`Content-Length: ${contentLength}\r\n`);
        socket.write(`Connection: ${headers["connection"]}\r\n`);
        if (headers["user-agent"]) {
          socket.write(userAgent);
        }
        socket.end();
      } else {
        console.log("no connection header found");
        socket.write("HTTP/1.1 200 OK\r\n");
        socket.write("Content-Type: text/plain\r\n");
        socket.write(`Content-Length: ${contentLength}\r\n`);
        if (headers["user-agent"]) {
          socket.write(`User-Agent: ${userAgent}\r\n`);
        }
      }
    } else if (path.startsWith("/files/")) {
      const filename = path.substring("/files/".length);
      const directory = process.argv[3];
      if (parts[0] === "POST" && path.startsWith("/files/")) {
        let body = lines[lines.length - 1];
        let contentLength = body.length;
        fs.writeFile(`${directory}/${filename}`, body, (err) => {
          if (err) {
            socket.write(
              "HTTP/1.1 500 Internal Server Error\r\nContent-length: 0\r\n\r\n",
            );
          } else {
            socket.write(`HTTP/1.1 201 Created\r\n\r\n`);
          }
        });
      } else {
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
      }
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

// curl --http1.1 -v
//   http://localhost:4221/echo/blueberry
// --next http://localhost:4221/echo/pear -H "Connection: close"

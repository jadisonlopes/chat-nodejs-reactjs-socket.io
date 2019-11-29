const express = require("express");
const path = require("path");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "public"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

app.use("/", (req, res) => {
  res.render("index.html");
});

let messages = [];
let connections = [];

removeConnection = id => {
  let filter = connections.filter(c => c.hash !== id);
  connections = filter;
};

addConnection = connection => {
  connections.push(connection);
};

getUsers = () => {
  return connections.map(c => c.author);
};

getIdUser = user => {
  let filter = connections.filter(c => c.author === user);
  return filter[0].hash;
};

io.on("connection", socket => {
  socket.on("disconnect", reason => {
    removeConnection(socket.id);
    io.emit("conectionsUsers", getUsers());
  });

  socket.emit("previousMessages", messages);

  socket.on("sendMessage", data => {
    if (data.destiny === "TODOS") {
      messages.push(data);
      socket.broadcast.emit("receivedMessage", data);
    } else {
      io.to(`${getIdUser(data.destiny)}`).emit("receivedMessage", data);
    }
  });

  socket.on("connectionInit", author => {
    const connection = {
      author: author,
      message: "Entrou no chat"
    };

    addConnection({ hash: socket.id, author });

    messages.push(connection);

    socket.broadcast.emit("connection", connection);
    io.emit("conectionsUsers", getUsers());
  });
});

server.listen(3000);

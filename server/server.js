const mongoose = require('mongoose');
const Document = require('./Document');

mongoose.connect("mongodb://localhost/google-docs-clone", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const defaultValue = "";

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async(documentID) => {
    const document = await findOrCreate(documentID);
    socket.join(documentID);
    socket.emit('load-document',document.Data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentID).emit("receive-changes", delta);
    });

    socket.on('save-document',async Data => {
        await Document.findByIdAndUpdate(documentID , {Data})
    });
  });
});


const findOrCreate = async (id)=>{
    try {
        if(id == null) return;

        const document = await Document.findById(id);
        if(document) return document;

        return Document.create({_id : id, Data : defaultValue});
    } catch (error) {
        console.log(error);
    }
}
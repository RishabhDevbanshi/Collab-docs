const { Schema, model } = require("mongoose");

const DocumentSchema = new Schema({
    _id : String,
    Data : Object
});

module.exports = model("Document",DocumentSchema);
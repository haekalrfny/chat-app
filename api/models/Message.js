import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    recipient: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    },
    text: String,
    file: String,
}, { timestamps: true });

export default mongoose.model("Message", messageSchema)

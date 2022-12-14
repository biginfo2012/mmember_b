const mongoose = require("mongoose");
const schema = mongoose.Schema

const followUpNotes = new schema({
    note: {
        type: String,
        required: true
    },
    followupType: {
        type: String //email sent , manual call  
    },
    noteType: {
        type: String, // this is the type of notes like birthday notes
    },
    status: {
        type: String // taken , booked 
    },
    date: {
        type: String,
    },
    time: {
        type: String,
    },
    userId: {
        type: String,
        index: true
    },
    memberId:{
        type: String,
        index: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    communication_mode: {
        type: String

    }
}, {
    timestamps: true
})

module.exports = mongoose.model("followUpNotes", followUpNotes);
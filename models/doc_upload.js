const mongoose = require("mongoose");
const schema = mongoose.Schema

const documentSchema = new schema({
    document: {
        type: String,
        required: true
    },
    document_name: {
        type: String,
        required: true
    },
    subFolderId: {
        type: String,
        index:true
    },
    rootFolderId: {
        type: String,
        index:true
    },
    userId: {
        type: String,
        index:true
    },
    adminId: {
        type: String,
        index:true
    }
},
    { timestamps: true }
)

module.exports = mongoose.model("uploadDocument", documentSchema);


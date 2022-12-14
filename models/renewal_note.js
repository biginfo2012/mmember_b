const mongoose = require("mongoose");
const schema = mongoose.Schema

const renewalNotesSchema = new schema({
   notes:{
       type:String,
       required:true
   },
   Type:{
        type:String //email sent , manual call  
   },
   status:{
       type:String // follow , booked 
   },
   date:{
        type:String,
        default: new Date().toLocaleDateString()
   },
   time:{
       type:String,
       default:new Date().toLocaleTimeString()
   },
   userId:{
       type:String,
       index:true
   },
   firstName:{
       type:String
   },
   lastName:{
       type:String
   }
},
{ timestamps:true }
)

module.exports = mongoose.model("renewalNote", renewalNotesSchema);


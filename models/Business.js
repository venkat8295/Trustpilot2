const mongo_connect = require("mongoose")

mongo_connect.pluralize(null)
const { Schema } = mongo_connect
const Business = new Schema({
	reviewId: String,
	replyLength: Number
})
module.exports = mongo_connect.model("Business", Business)

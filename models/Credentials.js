const mongo_connect = require("mongoose")

mongo_connect.pluralize(null)
const { Schema } = mongo_connect
const Credentials = new Schema({
	freshDeskAPI: String,
	freshDeskSubDomain: String,
	trustPilotAPI: String,
	trustPilotsecretKey: String,
	trustPilotBusinessName: String,
	tp_email_id: String,
	tp_password: String
})
module.exports = mongo_connect.model("Credentials", Credentials)

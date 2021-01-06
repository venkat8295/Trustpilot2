const express = require("express")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const chalk = require("chalk")
const btoa = require("btoa")
const cron = require("node-cron")
const Handlebars = require("handlebars")
const expressHandlebars = require("express-handlebars")
const path = require("path")
const {
	allowInsecurePrototypeAccess
} = require("@handlebars/allow-prototype-access")
const mongoose_app = require("mongoose")
dotenv.config({ path: "./config/config.env" })
const db = require("./config/db")
const Credentials_fetch = require("./models/Credentials")
const reviewTicket = require("./controllers/reviewTicket")
db.connectDb()

const app = express()
const red = chalk.red.bold
const green = chalk.green.bold
const cyan = chalk.cyan.bold
const PORT = process.env.PORT
const env = process.env.NODE_ENV

// View Engine
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "handlebars")
app.engine(
	"handlebars",
	expressHandlebars({
		defaultLayout: "main",
		handlebars: allowInsecurePrototypeAccess(Handlebars),
		helpers: {
			inc: function (value, options) {
				return parseInt(value) + 1
			},
			ifEquals: function (arg1, arg2, options) {
				return arg1 == arg2 ? options.fn(this) : options.inverse(this)
			}
		}
	})
)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/public", express.static("public"))
app.use("/", require("./controllers/home"))
app.set("port", PORT || 5000)

//For avoidong Heroku $PORT error
app.get("/", function (req, res) {
	var result = "App is running"
	res.send(result)
}).listen(app.get("port"), function () {
	console.log(
		+`${green("✓")} ${cyan(
			` App is running at port ${PORT} in ${env} mode.`
		)}`,
		app.get("port")
	)
})

process.on("unhandledRejection", (reason, p) => {
	throw reason
})

process.on("uncaughtException", (error) => {
	console.log(red("Uncaught Exception ✗", error))

	process.exit(1)
})

const dbFETCH = async () => {
	let returnValue
	try {
		await Credentials_fetch.find({}, async (err, items) => {
			if (err) {
				console.log(err)
			} else {
				console.log("Return End:", items)
				const cronJob = await cron.schedule(
					" * * * * * *",
					async () => {
						console.log("running a task every 5 Minutes")
						for (let i = 0; i < items.length; i++) {
							await reviewTicket.fetchBusinessUnitId(
								items[i].trustPilotAPI,
								items[i].trustPilotBusinessName,
								items[i].freshDeskSubDomain,
								items[i].freshDeskAPI,
								btoa
							)
						}
					}
				)
			}
		})
	} catch (error) {
		console.log("Error_Retrieve::")
		return error
	}
}
dbFETCH()

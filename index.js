const express = require("express")
const bodyParser = require("body-parser")
const dotenv = require("dotenv")
const chalk = require("chalk")
const axios = require("axios")
const qs = require("querystring")
const btoa = require("btoa")
const cron = require("node-cron")
const Handlebars = require("handlebars")
const expressHandlebars = require("express-handlebars")
const path = require("path")
const {
	allowInsecurePrototypeAccess
} = require("@handlebars/allow-prototype-access")
const mongoose_app = require("mongoose")
const { connection: db_connect } = mongoose_app
dotenv.config({ path: "./config/config.env" })
const db = require("./config/db")
const Credentials_fetch = require("./models/Credentials")
const reviewTicket = require("./controllers/reviewTicket")
const { Console } = require("console")
db.connectDb()

const app = express()
const red = chalk.red.bold
const green = chalk.green.bold
const cyan = chalk.cyan.bold
const PORT = process.env.PORT
const env = process.env.NODE_ENV
const grant_type = process.env.grant_type
const username = process.env.username
const password = process.env.password
const freshDesk_subDomain = process.env.freshDesk_subDomain
const freshDesk_apiKey = process.env.freshDesk_apiKey
const business_name = process.env.business_name
const trustPilot_apiKey = process.env.trustPilot_apiKey
const secrets = "wMKH2GoqB19DFLBaBdYisUHtGWENEAjB:XZKTi4GuqcDCg5MF"
const url = `https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken`

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

const authOptions = axios.create({
	headers: {
		Authorization: `Basic ${btoa(secrets)}`,
		"Content-Type": "application/x-www-form-urlencoded"
	}
})
const body = {
	grant_type: `${grant_type}`,
	username: `${username}`,
	password: `${password}`
}
authOptions
	.post(url, qs.stringify(body))
	.then(async (res) => {
		// console.log("res:", res)
		const cronJob = await cron.schedule(" */2 * * * *", async () => {
			console.log("running a task every 2 Minutes")
			/* 	await reviewTicket.fetchBusinessUnitId(
				trustPilot_apiKey,
				business_name,
				freshDesk_subDomain,
				freshDesk_apiKey,
				btoa
			) */
		})
	})
	.catch((error) => {
		console.log("console_error:", error)
	})

const dbFETCH = async () => {
	let returnValue
	try {
		await Credentials_fetch.find({}, async (err, items) => {
			if (err) {
				console.log(err)
			} else {
				console.log("Return End:", items)
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
		})
	} catch (error) {
		console.log("Error_Retrieve::", error)
		return error
	}
}
dbFETCH()

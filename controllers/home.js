const express = require("express")
const axios = require("axios")
const btoa = require("btoa")
const alert = require("alert")
const qs = require("querystring")

const Credentials = require("../models/Credentials")
let credentials
let saveData
const router = express.Router()
const url = `https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken`

router
	.route("/")
	.get((req, res) => {
		res.render("index")
	})
	.post((req, res) => {
		const {
			apikey,
			subdomain,
			tp_apikey,
			tp_secretkey,
			tp_businessName,
			email,
			password
		} = req.body
		validateCredentials(
			apikey,
			subdomain,
			tp_apikey,
			tp_secretkey,
			tp_businessName,
			email,
			password,
			res
		)
	})
// User Defined Functions
const validateCredentials = (
	freshDeskAPI,
	freshDeskSubDomain,
	trustPilotAPI,
	trustPilotsecretKey,
	trustPilotBusinessName,
	tp_email_id,
	tp_password,
	res
) => {
	const request = axios.create({
		baseURL: `https://${freshDeskSubDomain}.freshdesk.com/api/v2`,
		headers: {
			//Authorization: `Basic ${Buffer.from(apikey).toString('base64')}`,
			Authorization: `Basic ${btoa(freshDeskAPI)}`,
			"Content-Type": "application/json"
		}
	})
	const ticketUpdate_open = `/companies?per_page=100`

	request.get(ticketUpdate_open).then(
		async (data) => {
			console.log("Freshworks Access Granted")
			const trustpilotaccess = await trustPilotAccess(
				trustPilotAPI,
				trustPilotsecretKey,
				trustPilotBusinessName,
				tp_email_id,
				tp_password,
				res
			)
			console.log("trustpilotaccess:", trustpilotaccess)
			if (trustpilotaccess == "TP Verified!!") {
				await DBcredentials(
					freshDeskAPI,
					freshDeskSubDomain,
					trustPilotAPI,
					trustPilotsecretKey,
					trustPilotBusinessName,
					tp_email_id,
					tp_password,
					res
				)
			} else {
				console.log("TP Credentials Failed")
				res.render("index")
				alert("TrustPilot Credentials Failed")
			}
		},
		(error) => {
			console.log("Freshworks Credentials Failed")
			res.render("index")
			alert("Freshworks Credentials Failed")
		}
	)
}

const DBcredentials = (
	freshDeskAPI,
	freshDeskSubDomain,
	trustPilotAPI,
	trustPilotsecretKey,
	trustPilotBusinessName,
	tp_email_id,
	tp_password,
	res
) => {
	Credentials.findOne(
		{
			freshDeskAPI: freshDeskAPI,
			freshDeskSubDomain: freshDeskSubDomain,
			trustPilotAPI: trustPilotAPI,
			trustPilotsecretKey: trustPilotsecretKey,
			trustPilotBusinessName: trustPilotBusinessName,
			tp_email_id: tp_email_id,
			tp_password: tp_password
		},
		(err, data) => {
			//if(err) throw err;
			if (err) {
				console.log("err On Saving Data")
				resolve("error")
			}
			console.log("Updated:", data)

			if (data == null || data == undefined) {
				console.log(0)
				credentials = new Credentials({
					freshDeskAPI: freshDeskAPI,
					freshDeskSubDomain: freshDeskSubDomain,
					trustPilotAPI: trustPilotAPI,
					trustPilotsecretKey: trustPilotsecretKey,
					trustPilotBusinessName: trustPilotBusinessName,
					tp_email_id: tp_email_id,
					tp_password: tp_password
				})
				saveData = credentials.save()
				console.log("saveData:", saveData)
				alert("Data Successfully Saved!")
				res.render("index")
			} else {
				console.log("exists")
				alert("Data Already Exists")
				res.render("index")
			}
		}
	)
}

const trustPilotAccess = (
	trustPilotAPI,
	trustPilotsecretKey,
	trustPilotBusinessName,
	tp_email_id,
	tp_password,
	res
) => {
	console.log(1)
	const TP_secrets = `${trustPilotAPI}:${trustPilotsecretKey}`
	const TP_authOptions = axios.create({
		headers: {
			Authorization: `Basic ${btoa(TP_secrets)}`,
			"Content-Type": "application/x-www-form-urlencoded"
		}
	})
	const TP_body = {
		grant_type: "password",
		username: `${tp_email_id}`,
		password: `${tp_password}`
	}
	return new Promise((resolve, reject) => {
		TP_authOptions.post(url, qs.stringify(TP_body))
			.then((res) => {
				console.log("TP Verified!")
				resolve("TP Verified!!")
			})
			.catch((err) => {
				console.log("console_error:")
				resolve("console_error!")
			})
	})
}

module.exports = router

const { default: axios } = require("axios")
const Business = require("../models/Business")
let business
let saveData

const fetchBusinessUnitId = (
	apiKey,
	business_name,
	freshDesk_subDomain,
	freshDesk_apiKey,
	btoa
) => {
	const businees_id_url = `https://api.trustpilot.com/v1/business-units/find?name=${business_name}&apikey=${apiKey}`
	axios
		.get(businees_id_url)
		.then((res) => {
			const { id: businessId } = res.data

			console.log("businessId:", businessId)
			const get_review = `https://api.trustpilot.com/v1/business-units/${businessId}/reviews?apikey=${apiKey}`
			axios
				.get(get_review)
				.then(async (res) => {
					console.log("Res Review:", res.data.reviews.length)
					console.log(
						"Res Review2:",
						res.data.reviews[2].companyReply
					)
					console.log(
						"Res Review3:",
						res.data.reviews[2].companyReply.text
					)
					// for (let i = 0; i < res.data.reviews.length; i++) {
					for (let i = 0; i < 5; i++) {
						createFreshdeskTicket(
							freshDesk_subDomain,
							freshDesk_apiKey,
							btoa,
							res.data.reviews[i].id,
							res.data.reviews[i].title,
							res.data.reviews[i].text,
							res.data.reviews[i].companyReply
						)
					}
				})
				.catch((error) => {
					console.log("error1:", error)
				})
		})
		.catch((error) => {
			console.log("error:::", error)
		})
}

const createFreshdeskTicket = async (
	freshDesk_subDomain,
	freshDesk_apiKey,
	btoa,
	reviewId,
	reviewTitle,
	reviewText,
	reviewReply
) => {
	const request = axios.create({
		baseURL: `https://${freshDesk_subDomain}.freshdesk.com/api/v2`,
		headers: {
			//Authorization: `Basic ${Buffer.from(apikey).toString('base64')}`,
			Authorization: `Basic ${btoa(freshDesk_apiKey)}`,
			"Content-Type": "application/json"
		}
	})

	body_for_open = JSON.stringify({
		description: `<pre>${reviewText}<pre>`,
		subject: `Truspilot Review: ${reviewTitle}`,
		email: "venkatesh.manohar@spritle.com",
		priority: 1,
		status: 2
	})

	ticketUpdate_open = `/tickets`
	await DBupsert(reviewId, request, ticketUpdate_open, body_for_open)
}

const DBupsert = async (
	reviewId,
	request,
	ticketUpdate_open,
	body_for_open
) => {
	await Business.findOne(
		{
			reviewId: reviewId
		},
		async (err, data) => {
			//if(err) throw err;
			if (err) {
				console.log("err On Review ID")
			}
			console.log("Updated:", data)
			if (data == null || data == undefined) {
				console.log(0)
				business = new Business({
					reviewId: reviewId
				})
				saveData = await business.save()
				await request.post(ticketUpdate_open, body_for_open)
			}
		}
	)
}

module.exports = {
	fetchBusinessUnitId
}

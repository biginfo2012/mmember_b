const express = require("express");
const router = express.Router();
const { create, remove, updateNote, birth_this_week, seven_to_forteen, fifteen_to_thirty, moreThirty, thirtyToSixty, sixtyToNinety, this_month, next_month } = require("../controllers/birthday_notes")
const { requireSignin, isAuth, verifySchool } = require("../controllers/auth");
const { all_data } = require("../controllers/birthday_notes");

router.get("/birthday/seven_to_fourteen/:userId/:page_no/:per_page", verifySchool, seven_to_forteen)
router.get("/birthday/fifteen_to_thirty/:userId/:page_no/:per_page", verifySchool, fifteen_to_thirty)
router.get("/birthday/more_than_thirty/:userId/:page_no/:per_page", verifySchool, moreThirty)

router.get("/birthday/thirty_to_sixty/:userId/:page_no/:per_page", verifySchool, thirtyToSixty)
router.get("/birthday/more_than_sixty/:userId/:page_no/:per_page", verifySchool, sixtyToNinety)
router.get("/birthday/birthday_this_week/:userId/:page_no/:per_page", verifySchool, birth_this_week)
router.get("/dashboard/birthday_this_month/:userId/:page_no/:per_page", verifySchool, this_month)
router.get("/dashboard/birthday_next_month/:userId/:page_no/:per_page", verifySchool, next_month)

router.get("/dashboard/birthday_all_data/:userId/:page_no/:per_page/:multiple_data",verifySchool,all_data)



router.post("/birthday/add_note/:userId/:studentId", verifySchool, create)
router.put("/birthday/update_note/:userId/:notesId", requireSignin, updateNote)
router.delete("/birthday/delete_note/:userId/:notesId", requireSignin, remove)


module.exports = router;    
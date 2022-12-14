const express = require("express");
const router = express.Router();
const upload = require('../handler/multer');
const { requireSignin, isAuth, verifySchool } = require("../controllers/auth");
const { category_list, addcategory, updateCategory, removeCategory, tempList, sendEmail, userEmailList } = require("../controllers/email_nurturing_Category")

router.get("/email_nurturing/category_list/:userId", verifySchool, category_list)
router.post("/email_nurturing/addcategory/:userId", verifySchool, addcategory)
router.put("/email_nurturing/edit_category/:userId/:categoryId", requireSignin, updateCategory)
router.delete("/email_nurturing/remove_category/:userId/:categoryId", requireSignin, removeCategory)

module.exports = router
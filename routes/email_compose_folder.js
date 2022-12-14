const express = require("express");
const router = express.Router();
const { create_folder, list_template, update_folder, delete_folder, list_folders } = require("../controllers/email_compose_folder")
const { requireSignin, isAuth, verifySchool } = require("../controllers/auth");

router.get("/email_compose/list_all_folder/:userId", verifySchool, list_folders)
router.get("/email_compose/list_template/:userId/:folderId", verifySchool, list_template)
router.post("/email_compose/create_folder/:userId/:catId", verifySchool, create_folder)
router.put("/email_compose/update_folder/:userId/:folderId", requireSignin, update_folder)
router.delete("/email_compose/delete_folder/:userId/:folderId", requireSignin, delete_folder)

module.exports = router;
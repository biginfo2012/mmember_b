const express = require("express");
const router = express.Router();
const {
  getMuj,
  sendOTP,
  signup,
  signin,
  signout,
  forgetpasaword,
  resetPassword,
  requireSignin,
  activation,
  get_navbar,
  edit_navbar_li,
  edit_navbar_ui,
  isAdmin,
  approveUserRequestByAdmin,
  updateUser,
  school_listing,
  searchUser,
  approvesendgridverification,
  adminApproval,
  unverifiedsendgriduserlist,
  sendOTP_to_email,
  verify_otp,
  createLocations,
  access_school,
  addTwillioNumber,
  memberStatistics,
  incomeStatistics,
  rankStatistics,
  retentionStatistics,
} = require("../controllers/auth");
const { userSignupValidator } = require("../validator");

// Routes
router.get("/muj", getMuj);
router.post("/send-otp", sendOTP);
router.post("/signup", signup);
router.post("/signin", signin);

router.post("/new_ocation", createLocations);
router.post("/signout", signout);
router.post("/forgetPassword", forgetpasaword);
router.patch("/resetPassword", resetPassword);
router.put(
  "/get_user_approved_by_admin/:adminId/:userId",
  isAdmin,
  approveUserRequestByAdmin
);
router.put("/addtwilllio/:adminId/:userId", isAdmin, addTwillioNumber);
//verfications
router.post("/sendOTP_to_email", sendOTP_to_email);
router.post("/verify_otp", verify_otp);
//
router.put("/updateUser/:userId", updateUser);
router.get("/admin/searchUser/:userId", searchUser);
router.post("/adminApproval", adminApproval);

router.get("/get_navbar", get_navbar);
router.post("/edit_navbar_li", edit_navbar_li);
router.post("/edit_navbar_ui", edit_navbar_ui);
router.get("/admin/school_listing/:adminId", isAdmin, school_listing);
router.put(
  "/approvesendgridverification/:adminId/:userId",
  isAdmin,
  approvesendgridverification
);
router.get(
  "/unverifiedsendgriduserlist/:adminId",
  isAdmin,
  unverifiedsendgriduserlist
);

router.get(
  "/Admin/Member_Statistics/:adminId/:per_page/:page_no",
  isAdmin,
  memberStatistics
);
router.get(
  "/Admin/Income_Statistics/:adminId/:yearlyMonthly/:per_page/:page_no",
  isAdmin,
  incomeStatistics
);
router.get(
  "/Admin/Rank_Statistics/:adminId/:per_page/:page_no/:program",
  isAdmin,
  rankStatistics
);
router.get(
  "/Admin/Retention_Statics/:adminId/:per_page/:page_no",
  isAdmin,
  retentionStatistics
);

module.exports = router;

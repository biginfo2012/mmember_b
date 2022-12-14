const express = require("express");
const router = express.Router();
const class_schedule = require("../controllers/class_schedule")
const { requireSignin, isAuth, verifySchool } = require("../controllers/auth");

router.post("/add_classSchedule/:userId", verifySchool, class_schedule.Create);
router.get("/list_of_classSchedule/:userId", verifySchool, class_schedule.read);
router.get("/list_of_classScheduleD/:userId/:dates", verifySchool, class_schedule.readSchedule);
router.get("/searchClasses/:userId", verifySchool, class_schedule.searchClasses);

router.put("/update_classSchedule/:userId/:scheduleId", requireSignin, class_schedule.update);
router.put("/update_All_classSchedule/:userId/", requireSignin, class_schedule.updateAll);

router.get("/class_schedule_by_id/:userId/:scheduleId", requireSignin, class_schedule.class_schedule_Info)

router.delete("/delete_classSchedule/:userId/:scheduleId", requireSignin, class_schedule.remove);
router.delete("/delete_All_classSchedule/:userId", requireSignin, class_schedule.removeAll);


module.exports = router;

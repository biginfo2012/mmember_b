const express = require('express');
const router = express.Router();

const { addmember,
    studentinfo,
    deletemember,
    updatemember,
    read,
    active_trial_Std,
    leads_Std,
    Former_Std,
    active_Std,
    Former_trial_Std,
    camp_Std,
    latestMember,
    expire_member,
    expire_this_month,
    missuCall_list,
    birth_this_month,
    birth_next_month,
    this_month_lead,
    last_three_month,
    missuCall_list_urjent,
    trial_this_month,
    after_school_Std,
    studentCount,
    listMember,
    next_std_find,
    std_count,
    bluckStd,
    delete_multipal_member,
    send_mail_std,
    send_sms_std,
    std_program,
    getStudentsByProgramm,
    getStudentsByCategory,
    getActiveStudents,
    getRankUpdateStripeHistoryByStudentId,
    getRankUpdateTestHistoryByStudentId,
    filter_members,
    invoice_listing,
    invoice_details,
    ActiveMemberslist,
    ActiveMemberslistByProgramName,
    searchStudentbyType,
    searchStudentbyInterest,
    active_trial_this_month,
    active_trial_past3_month,
    leads_this_month,
    leads_past3_month,
    collectionModify,
    mergeMultipleDoc,
    multipleFilter,
    test,
    StatisticsCount,
    leadUpdate,
    filterLeads,
    count

} = require("../controllers/addmember")

const { mergedDocForTest } = require("../controllers/registeredForTest");
const { requireSignin, isAuth, verifySchool } = require("../controllers/auth");
const upload = require('../handler/multer');


router.post('/addMember/multiFilter/:userId', requireSignin, multipleFilter);
router.post('/bluck_student_add/:userId', bluckStd)

// router.post("/member/next_std_find/:stdId",next_std_find)
// perticular std count
router.get('/memeber/std_count/:userId', verifySchool, std_count)

router.post("/student/mergeDocs/:userId/:studentId", requireSignin, mergedDocForTest);
router.put("/student/leadUpdate/:userId/:studentId", requireSignin, leadUpdate);
router.post("/student/mergeDocs/:userId", requireSignin, mergeMultipleDoc);
router.post("/students/leads/:userId", requireSignin, filterLeads);


//dashboard routes
router.get("/member/searchstudent_by_type/:userId/:studentType", verifySchool, searchStudentbyType)
router.get("/member/searchstudent_by_interest/:userId/:intrested", verifySchool, searchStudentbyInterest)
router.get('/member/active_trial_created_this_month/:userId/:page_no/:per_page', verifySchool, active_trial_this_month);
router.get('/member/active_trial_past_3months/:userId/:page_no/:per_page', verifySchool, active_trial_past3_month);
router.get('/member/leads_created_this_month/:userId/:page_no/:per_page', verifySchool, leads_this_month);
router.get('/member/leads_past_3months/:userId/:page_no/:per_page', verifySchool, leads_past3_month);


router.get('/member/student_type_count/:userId', studentCount)
router.get('/member/latest_member/:userId/:page_no/:per_page', verifySchool, latestMember);
router.get('/member/expire_member/:userId', verifySchool, expire_member);
router.get('/member/expire_this_month_member/:userId', verifySchool, expire_this_month);
router.get('/member/miss_you_call/:userId', verifySchool, missuCall_list);
router.get('/member/miss_you_call_urjent/:userId', verifySchool, missuCall_list_urjent)
router.get('/member/this_month_birth/:userId', verifySchool, birth_this_month);
router.get('/member/next_month_birth/:userId', verifySchool, birth_next_month);
// router.get("/member/collectionModify", collectionModify)
router.get("/test", test)


router.get('/member/lead_this_month/:userId', verifySchool, this_month_lead)
router.get('/member/lead_past_three_month/:userId', verifySchool, last_three_month)
router.get('/member/this_month_active_trial/:userId', verifySchool, trial_this_month)

router.get("/member/member_list_name/:userId", verifySchool, listMember)
router.get('/member/member_list/:userId', verifySchool, read);
router.get('/member/member_info/:userId/:StudentId', verifySchool, studentinfo);

router.get('/member/invoice_listing/:userId/:StudentId', verifySchool, invoice_listing)

router.get('/member/invoice_details/:userId/:StudentId', verifySchool, invoice_details)

router.post('/member/add_member/:userId', verifySchool, upload.single('memberprofileImage'), addmember);

router.delete('/member/delete_member/:userId/:memberID', verifySchool, deletemember);
router.delete('/member/delete_multipal_member/:userId', verifySchool, delete_multipal_member)
router.put('/member/update_member/:userId/:memberID', upload.single('memberprofileImage'), verifySchool, updatemember);

//student type
router.get('/member/active_trial/:userId', verifySchool, active_trial_Std);
// router.get('/member/active_student/:userId', verifySchool, active_Std);
router.get('/member/active_student/:userId', active_Std);
router.get('/member/Former_trial/:userId', verifySchool, Former_trial_Std);
router.get('/member/Former_student/:userId', verifySchool, Former_Std);
router.get('/member/Leads/:userId', verifySchool, leads_Std);
router.get('/member/camp_student/:userId', verifySchool, camp_Std);
router.get('/member/after_school_student/:userId', verifySchool, after_school_Std);

// email and text sms send perticular student
router.post('/member/email_send_student/:userId', verifySchool, send_mail_std)
router.post('/member/text_sms_send', send_sms_std)

//filter member by category, subcategory , program
router.post("/member/filter_members/:userId", filter_members)


// student by program
router.get("/member/list_student_by_program/:userId", std_program)

// getActiveStudents

//todo - pavan - add the verication.
router.get('/member/get_students_by_program/:userId/:program', getStudentsByProgramm);
router.get('/member/get_students_by_category/:userId/:category', getStudentsByCategory);
router.get('/member/get_student_rank_update_hisrory/:userId/:studentId', getRankUpdateStripeHistoryByStudentId);
router.get('/member/get_student_rank_update_test_hisrory/:userId/:studentId', getRankUpdateTestHistoryByStudentId);
router.get("/member/get_active_members/:userId", getActiveStudents);



//studeent by status
router.get('/member/get_students_by_Active_Status/:userId', requireSignin, ActiveMemberslist)
router.get('/member/get_Active_member_by_Program/:userId/:programName', ActiveMemberslistByProgramName)

//Statistics

router.get('/member/students_count_Statistics/:userId',requireSignin,StatisticsCount)

router.get('/member/student_count_by_studentType_monthwise/:userId/:per_page/:page_no',requireSignin,count)




module.exports = router

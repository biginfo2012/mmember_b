const express = require('express');
const router = express.Router();
const upload = require('../handler/multer');
const {
	signup,
	signin,
	signout,
	read,
	edit_userInfo,
	update,
	remove,
} = require('../controllers/administrat_user');
const { userSignupValidator } = require('../validator');
const { requireSignin, isAuth, verifySchool } = require('../controllers/auth');

router.post(
	'/users/add_user/:userId',
	verifySchool,
	upload.single('profile_image'),
	signup
);
router.post('/sub_user_signin', signin);

router.get('/administrat_signout', signout);
router.get('/users/user_list/:userId', verifySchool, read);

router.get(
	'/users/user_info/:userId/:sub_user_id',
	requireSignin,
	edit_userInfo
);
router.put(
	'/users/user_update/:userId/:sub_user_id',
	requireSignin,
	upload.single('profile_image'),
	update
);
router.delete(
	'/users/delete_user/:userId/:sub_users_id',
	requireSignin,
	remove
);

module.exports = router;

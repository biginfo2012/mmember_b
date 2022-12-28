const express = require("express");
const router = express.Router();
const cors = require("cors")

const { getForms, getForm, updateFormData, updateFormSettings, deleteForm, moveToTrash, processForm, createForm, markAsFavourite, getFavourites,
    storeForm, loadForm, archiveForm, processStripeConnect, saveFunnelContact, getFunnelContact, createDigitalForm} = require("../../controllers/builder/builder")

const { createAutomation, deleteAutomation, getAutomations, updateAutomationData, moveToTrashAuto } = require("../../controllers/builder/automation")

const { requireSignin, isAuth, verifySchool } = require("../../controllers/auth");

router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

router.post("/verifyStripe", requireSignin, processStripeConnect)

//form-contact
router.post("/contact/:formId", saveFunnelContact);
router.get("/contact/:funnelId/:page_no/:per_page", requireSignin, getFunnelContact);


/**
 * @swagger
 * /api/forms/test:
 *   get:
 *     description: api test
 */
router.get('/test', (req, res) => {
    res.json({
        success: false,
        message: "API Test Successful"
    })
})

/**
 * @swagger
 * /api/forms/process/newstudent:
 *   get:
 *     description: process form
 */
router.get('/process/newstudent/:id/:userId', verifySchool, processForm)

/**
 * @swagger
 * /api/forms/new:
 *   post:
 *     summary: creates new form
 *     description: creates new form
 *     requestBody:
 *       descripton: Body for the new form
 *     responses:
 *       200:
 *         description: Created
 */
router.post('/new/:userId', createForm)

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: get all forms
 *     description: fetch all forms
 *     responses:
 *       200:
 *         description: Fetch forms
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArrayOfForms'
 */
router.get('/', requireSignin, getForms)

/**
 * @swagger
 * /api/forms/update:
 *   patch:
 *     summary: update form
 *     description: update specific form
 *     parameters:
 *       - in: id
 *         name: formId
 *         schema: 
 *           type: string
 *         required: true
 *         description: ID of the form to update
 *     responses:
 *       200:
 *         descripton: update form
 */
router.patch('/update/settings/:id', requireSignin, updateFormSettings)

/**
 * @swagger
 * /api/forms/update:
 *   patch:
 *     summary: update form
 *     description: update specific form
 *     parameters:
 *       - in: id
 *         name: formId
 *         schema: 
 *           type: string
 *         required: true
 *         description: ID of the form to update
 *     responses:
 *       200:
 *         descripton: update form
 */
router.patch('/update/data/:id', requireSignin, updateFormData)


//router.patch('/favourite/:id', favouriteForm)

router.patch('/archive/:id', requireSignin, archiveForm)


/**
 * @swagger
 * /api/forms/delete:
 *   delete:
 *     summary: delete specific form
 *     description: delete specific form
 *     parameters:
 *       - in: id
 *         name: formId
 *         schema:
 *           type: String
 *         required: true
 *         descripton: ID of the form to delete
 */
router.delete('/delete/:id', requireSignin, deleteForm)

/**
 * @swagger
 * /api/forms/trash/:id:
 *   patch:
 *     summary: move form to trash
 *     description: move form to trash
 *     parameters:
 *       - in: id
 *         name: formId
 *         schmema:
 *           type: String
 *         required: true
 */
router.patch('/trash/:id', requireSignin, moveToTrash)


/**
 * @swagger
 * /api/forms/favourite/new:
 *   patch:
 *     summary: mark form as favourite
 *     description: mark form as favourite
 *     parameters:
 *       - in: id
 *         name: formId
 *         schmema:
 *           type: String
 *         required: true
 */
router.patch('/favourite/:id', requireSignin, markAsFavourite)

/**
 * @swagger
 * /api/forms/favourites:
 *   get:
 *     summary: mark form as favourite
 *     description: mark form as favourite
 *     parameters:
 *       - in: id
 *         name: formId
 *         schmema:
 *           type: String
 *         required: true
 */
router.post('/favourites', requireSignin, getFavourites)

/**
 * @swagger
 * /api/forms/store:
 *   get:
 *     summary: store form
 *     description: store form
 */
router.post('/store/:id', requireSignin, storeForm)

/**
 * @swagger
 * /api/forms/load:
 *   get:
 *     summary: load form
 *     description: load form
 */
router.get('/load/:id', requireSignin, loadForm)

/**
 * @swagger
 * /api/form/:id:
 *   get:
 *     summary: get form with id
 *     description: fetch form with ID :id
 *     responses:
 *       200:
 *         description: Fetch form
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArrayOfForms'
 */
router.get('/:id', getForm)

router.post('/digitalFrom/:userId/:formType', requireSignin, createDigitalForm)

/** Automation Part */
/**
 * @swagger
 * /api/forms/automation/new:
 *   post:
 *     summary: creates new form
 *     description: creates new form
 *     requestBody:
 *       description: Body for the new form
 *     responses:
 *       200:
 *         description: Created
 */
router.post('/automation/new/:userId', requireSignin, createAutomation)

/**
 * @swagger
 * /api/forms/automations:
 *   get:
 *     summary: get all forms
 *     description: fetch all forms
 *     responses:
 *       200:
 *         description: Fetch forms
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArrayOfForms'
 */
router.get('/automations/:formId', requireSignin, getAutomations)

/**
 * @swagger
 * /api/forms/automation/update:
 *   patch:
 *     summary: update form
 *     description: update specific form
 *     parameters:
 *       - in: id
 *         name: formId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the form to update
 *     responses:
 *       200:
 *         description: update form
 */
router.patch('/automation/update/:id', requireSignin, updateAutomationData)

/**
 * @swagger
 * /api/forms/automation/delete:
 *   delete:
 *     summary: delete specific form
 *     description: delete specific form
 *     parameters:
 *       - in: id
 *         name: formId
 *         schema:
 *           type: String
 *         required: true
 *         description: ID of the form to delete
 */
router.delete('/automation/delete/:id', requireSignin, deleteAutomation)

/**
 * @swagger
 * /api/forms/automation/trash/:id:
 *   patch:
 *     summary: move form to trash
 *     description: move form to trash
 *     parameters:
 *       - in: id
 *         name: formId
 *         schema:
 *           type: String
 *         required: true
 */
router.patch('/automation/trash/:id', requireSignin, moveToTrashAuto)

module.exports = router;

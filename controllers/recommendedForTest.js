require('dotenv').config();
const Member = require('../models/addmember');
const RecommendedForTest = require('../models/recommendedForTest');
const Finance_infoSchema = require("../models/finance_info");
const AddMember = require("../models/addmember");
const RegisterdForTest = require('../models/registerdForTest');
const Joi = require('@hapi/joi');
const { valorTechPaymentGateWay } = require("./valorTechPaymentGateWay");
const mergeFile = require("../Services/mergeFile")
const cloudUrl = require("../gcloud/imageUrl");
const mergeMultipleFiles = require("../Services/mergeMultipleFiles");
const Program = require("../models/program");




const randomNumber = (length, addNumber) => {
    return parseInt(
        (Math.floor(Math.random() * length) + addNumber).toString().substring(1)
    );
};

const getUidAndInvoiceNumber = () => {
    return {
        uid: randomNumber(100000000000, 100),
    };
};

exports.getRecommededForTest = async (req, res) => {
    let userId = req.params.userId;
    let eventId = req.params.eventId;
    // var order = req.query.order || 1
    // let sortBy = req.query.sortBy || "firstName"
    // var totalCount = await RecommendedForTest
    //     .find({
    //         "userId": userId,
    //         "isDeleted": false
    //     })
    //     .countDocuments();

    // var per_page = parseInt(req.params.per_page) || 10;
    // var page_no = parseInt(req.params.page_no) || 0;
    // var pagination = {
    //     limit: per_page,
    //     skip: per_page * page_no,
    // };
    if (!userId) {
        return res.json({
            success: false,
            msg: "Please include the userId in the parameters!"
        })
    }
    

    let students = await RecommendedForTest.find({
        "eventId": eventId,
        "userId": userId,
        "isDeleted": false
    }).populate('studentId')
    let Registered = await RegisterdForTest.find(
        {
            "eventId": eventId,
            "userId": userId,
            "isDeleted": false
        })
    let Promoted = await RegisterdForTest.find(
        {
            "eventId": eventId,
            "userId": userId,
            "isDeleted": true
        }) 
    // .skip(pagination.skip)
    // .limit(pagination.limit)
    // .sort({ [sortBy]: order });
    if (!students.length) {
        return res.json({
            success: false,
            msg: "There was no data found!"
        })
    }

    res.json({
        success: true,
        data: students,
        count:{recommeded:students.length,Registered:Registered.length,Promoted:Promoted.length}
    })
}

exports.getRegisteredForTest = async (req, res) => {
    let userId = req.params.userId;
    let eventId = req.params.eventId;
    // let sortBy = req.query.sortBy || "fistName"
    // var order = req.query.order || 1
    // var totalCount = await RegisterdForTest
    //     .find({
    //         "userId": userId,
    //         "isDeleted": false
    //     })
    //     .countDocuments();

    // var per_page = parseInt(req.params.per_page) || 10;
    // var page_no = parseInt(req.params.page_no) || 0;
    // var pagination = { limit: per_page, skip: per_page * page_no, };
    if (!userId) { return res.json({ success: false, msg: "Please include the userId in the parameters!" }) }

    let students = await RegisterdForTest.find(
        {
            "eventId": eventId,
            "userId": userId,
            "isDeleted": false
        }).populate('studentId')
    // .skip(pagination.skip)
    // .limit(pagination.limit)
    // .sort({ [sortBy]: order });
    if (!students.length) {
        return res.json({
            success: false, msg: "There was no data found!",
            data: students
        })
    }
    res.json({ success: true, data: students })

}

exports.getPromoted = async (req, res) => {
    let userId = req.params.userId;
    let eventId = req.params.eventId;

    if (!userId) {
        res.json({
            success: false,
            msg: "Please include the userId in the parameters!"
        })
    }

    let students = await RegisterdForTest.find({
        "eventId": eventId,
        "userId": userId,
        "isDeleted": true
    }).populate('studentId')

    if (!students.length) {
        return res.json({
            success: false,
            msg: "data not found"
        })
    }
    res.json({
        success: true,
        data: students,
    })

}

exports.recomendStudent = async (req, res) => {

    let students = req.body;
    let userId = req.params.userId;
    let eventId = req.params.eventId;
    let recommendedFortestSchema = Joi.object({
        studentId: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        memberprofileImage: Joi.string(),
        primaryPhone: Joi.string(),
        // email: Joi.string(),
        // time: Joi.string(),
        // textContent: Joi.string(),
        program: Joi.string().required(),
        eventId: Joi.string().required(),
        status: Joi.string().required(),
        rating: Joi.number().required(),
        current_rank_name: Joi.string(),
        userId: Joi.string().required(),
        next_rank_name: Joi.string(),
        current_rank_img: Joi.string(),
        next_rank_img: Joi.string(),
        lastPromotedDate: Joi.string().required(),
        isRecommended: Joi.boolean().required()
    })

    try {
        if (!students.length) {
            res.json({
                success: false,
                msg: "You haven't selected any student!"
            })
        }

        const recommendedStudentsForTest = [];
        var alredyRecomend = "";
        const promises = [];
        for (let student of students) {
            let appt = await RecommendedForTest.find({$or:[
                { "eventId": eventId, "isDeleted": false, "studentId": student.studentId },
                { "eventId": eventId, "isDeleted": true, "studentId": student.studentId }
            ]});
            const programs = await Program.findOne({ programName: student.program });
            console.log(programs.program_rank);
            if (appt.length === 0 && student.program && programs.program_rank.length > 1) {
                student.userId = userId;
                student.eventId = eventId;
                await recommendedFortestSchema.validateAsync(student);
                recommendedStudentsForTest.push(student)
                //let studentId = student.studentId
                //promises.push(updateStudentsById(studentId))
            } else {
                alredyRecomend += `${student.firstName} ${student.lastName}, `
            }
        }
        //await Promise.all(promises);
        await Promise.all(recommendedStudentsForTest);
        await RecommendedForTest.insertMany(recommendedStudentsForTest);
        if (alredyRecomend) {
            return res.send({
                recommendedStudentsForTest,
                success: false,
                msg: `${alredyRecomend} already recommneded or No Rank available to promte! `
            })
        }
        res.send({
            success: true,
            msg: "Selected students got recommended successfully!"
        })

    } catch (error) {
        res.send({ error: error.message.replace(/\"/g, ""), success: false })
    }
};

// const updateStudentsById = async (studentId) => {
//     return await Member.findByIdAndUpdate({ _id: studentId }, { isRecommended: true })
// }


exports.registerdStudent = async (req, res) => {
    let students = req.body;
    let userId = req.params.userId;
    let eventId = req.params.eventId;
    let registeredFortestSchema = Joi.object({
        studentId: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        memberprofileImage: Joi.string(),
        primaryPhone: Joi.string(),
        // email: Joi.string(),
        // time: Joi.string(),
        // textContent: Joi.string(),
        program: Joi.string().required(),
        eventId: Joi.string().required(),
        rating: Joi.number().required(),
        current_rank_name: Joi.string(),
        userId: Joi.string().required(),
        next_rank_name: Joi.string(),
        current_rank_img: Joi.string(),
        next_rank_img: Joi.string(),
        isPaid: Joi.boolean().required()
    })

    try {
        if (!students.length) {
            return res.json({
                success: false,
                msg: "You haven't selected any student!"
            })
        }
        const regesteredStudentsForTest = [];
        var alredyRegisterd = "";
        const promises = [];
        for (let student of students) {
            let appt = await RegisterdForTest.find({$or:[
                { "eventId": eventId, "isDeleted": false, "studentId": student.studentId },
                { "eventId": eventId, "isDeleted": true, "studentId": student.studentId }
            ]});
            if (appt.length === 0 && !student.isPaid && student.program) {
                student.userId = userId;
                student.eventId = eventId;
                await registeredFortestSchema.validateAsync(student);
                regesteredStudentsForTest.push(student)
                let studentId = student.studentId
                promises.push(updateRecommendedStudentsByIdForRegister(studentId, eventId))
            } else {
                alredyRegisterd += `${student.firstName} ${student.lastName}, `
            }
        }
        await Promise.all(promises);
        await RegisterdForTest.insertMany(regesteredStudentsForTest);
        if (alredyRegisterd) {
            res.send({
                success: false,
                msg: `${alredyRegisterd} These students are already on the recommended list!`
            })
        }
        res.send({
            success: true,
            msg: "Selected students got registered successfully!"
        })

    } catch (error) {
        res.send({ msg: error.message.replace(/\"/g, ""), success: false })
    }

}
const updateRecommendedStudentsByIdForRegister = async (studentId, eventId) => {
    return await RecommendedForTest.updateOne({ studentId: studentId, eventId: eventId, isDeleted:false }, { "isDeleted": true });
}
exports.payAndPromoteTheStudent = async (req, res) => {
    let userId = req.params.userId;
    let eventId = req.params.eventId;
    // let { cardDetails, paidAmount, studentId, financeId } = req.body;
    // let updatePayment;
    // if (cardDetails) {
    //     const { uid } = getUidAndInvoiceNumber();
    //     const expiry_date = cardDetails?.expiry_month + cardDetails?.expiry_year;
    //     cardDetails.expiry_date = expiry_date;
    //     delete cardDetails.expiry_month;
    //     delete cardDetails.expiry_year
    //     const valorPayload = { ...cardDetails, amount: paidAmount, uid }
    //     const resp = await valorTechPaymentGateWay.saleSubscription(valorPayload);
    //     if (resp.data.error_no == "S00") {
    //         const address = {
    //             address: cardDetails?.address,
    //             zip: cardDetails?.zip,
    //             street_no: cardDetails?.street_no,
    //         }
    //         cardDetails.address = address;
    //         await createFinanceDoc({ ...cardDetails, studentId: studentId, userId: userId }, financeId)
    //         updatePayment = await addTestPayment(req.body, userId)
    //         res.send(updatePayment)
    //     } else {
    //         res.send({
    //             success: false,
    //             msg: "Payment is not completed due to technical reason please try again!"
    //         })
    //     }
    // } else {
    // updatePayment = await addTestPayment(req.body, userId)
    // res.send(updatePayment)
    let {
        testId,
        studentId,
        rating,
        current_rank_name,
        next_rank_name,
        current_rank_img,
        next_rank_img,
        method,
        primaryPhone,
        email,
        time,
        textContent,
        firstName,
        lastName,
        memberprofileImage,
        program,
        cheque_no,
        isPaid
    } = req.body;

    let registerd = new RegisterdForTest({
        "studentId": studentId,
        "firstName": firstName,
        "testId": testId,
        "lastName": lastName,
        "rating": rating,
        "current_rank_name": current_rank_name,
        "next_rank_name": next_rank_name,
        "userId": userId,
        "current_rank_img": current_rank_img,
        "method": method,
        "memberprofileImage": memberprofileImage,
        "next_rank_img": next_rank_img,
        "primaryPhone": primaryPhone,
        // "email": email,
        // "textContent": textContent,
        // "time": time,
        "program": program,
        "cheque_no": cheque_no,
        "eventId": eventId,
        isPaid: isPaid
    });
    registerd.save((err, data) => {
        if (err) {
            return res.send({
                success: false,
                msg: "Having some issue while register!"
            })
        } else {
            let history = {
                "current_rank_name": current_rank_name,
                "program": program,
                "current_rank_img": current_rank_img,
                "testPaid": new Date(),
                "promoted": new Date()
            }
            Member.findOneAndUpdate({ _id: studentId },
                {
                    $push: {
                        test_purchasing: testId,
                        rank_update_test_history: history
                    }
                },
                (err, data) => {
                    if (err) {
                        return res.send({
                            success: false,
                            msg: "Having some issue while register!!"
                        })

                    } else {

                        RecommendedForTest.updateOne({
                            "studentId": studentId, "eventId":eventId
                        }, {
                            "isDeleted": true
                        }, (err, data) => {

                            if (err) {
                                return res.send({
                                    success: false,
                                    msg: "Having issue while removing form recommeded list!!"
                                })
                            }
                            else {

                                return res.send({
                                    success: true,
                                    msg: "Student has been promoted to the register list!",
                                })
                            }
                        })
                    }
                })

        }

    })
    // }    
    //If student removed by mistake and adding again to the registerd list...
    // let isStudentRegisterd = await RegisterdForTest.findOne({
    //     "studentId": studentId
    // })
    // if (isStudentRegisterd) {
    //     let removedFromRecommended = await RecommendedForTest.findOneAndUpdate({
    //         "studentId": studentId
    //     }, {
    //         "isDeleted": false
    //     });
    //     if (!removedFromRecommended) {
    //         res.json({
    //             success: false,
    //             msg: "Having issue while removing form recommeded list!!"
    //         })
    //     }

    //     let updateIsDeleted = await RegisterdForTest.findOneAndUpdate({
    //         "studentId": studentId
    //     }, {
    //         "isDeleted": false,
    //         "userId": userId
    //     }, {
    //         new: true
    //     });
    //     if (!updateIsDeleted) {
    //         res.json({
    //             success: false,
    //             msg: "Unable to reflect into the registerd again!!"
    //         })
    //     }
    //     res.json({
    //         success: true,
    //         msg: "Student successfully promoted to registerd list!!",
    //         data: updateIsDeleted
    //     })

    // } 
    //else {
    //If moving the student to the registerd list for the fist time.
    //}
}

const addTestPayment = async (payload, userId) => {


}

function createFinanceDoc(data, financeId) {
    const { studentId } = data;
    return new Promise((resolve, reject) => {
        const financeData = new Finance_infoSchema(data);
        if (financeId) {
            Finance_infoSchema.findByIdAndUpdate(financeId, {
                $set: data
            }).exec((err, resData) => {
                if (err) {
                    resolve({ success: false });
                }
                resolve({ success: true });
            })
        } else {
            financeData.save((err, Fdata) => {
                if (err) {
                    resolve({ success: false, msg: "Finance data is not stored!" });
                } else {
                    AddMember.findByIdAndUpdate(studentId, {
                        $push: { finance_details: Fdata._id },
                    }).exec((err, data) => {
                        if (data) {
                            resolve({ success: true });
                        } else {
                            resolve({ success: false });
                        }
                    });
                }
            });
        }
    });
}

exports.multipleDocMerge = async (req, res) => {
    let recommendedId = req.body.recommendedId;
    let docBody = req.body.docBody;
    try {
        let promises = [];
        let bufCount = 0;
        for (let id in recommendedId) {
            let data = await RecommendedForTest.findOne({ _id: recommendedId[id] });
            let studentId = data.studentId;
            let resp = await Member.findOne({ _id: studentId });
            let mergedInfo = { ...data.toJSON(), ...resp.toJSON() }
            let filebuff = await mergeMultipleFiles(docBody, mergedInfo);
            bufCount = Buffer.byteLength(filebuff) + bufCount
            promises.push(filebuff);

        }
        await Promise.all(promises);
        res.send({ msg: "data!", data: promises, success: true })
        // let resultBuff = Buffer.concat(promises, bufCount)
        // let fileObj = {
        //     fieldname: 'attach',
        //     originalname: 'Test.pdf',
        //     encoding: '7bit',
        //     mimetype: 'application/pdf',
        //     buffer: resultBuff,
        //     size: bufCount
        // }
        // await (cloudUrl.imageUrl(fileObj)).then(data => {
        //     res.send({ msg: "data!", data: data, succes: true })
        // })

    } catch (err) {
        res.send({ msg: err.message.replace(/\"/g, ""), success: false })
    }
}

exports.deleteAll = async (req, res) => {
    let recommendIds = req.body.recommendIds;
    try {
        let promise = [];
        for (let id in recommendIds) {
            await RecommendedForTest.deleteOne({ _id: recommendIds[id] },
                function (err, datas) {
                    if (err) { return res.send({ msg: "The recommended student was not removed!", success: false }) }
                    promise.push(datas)
                })
        }
        Promise.all(promise);
        return res.send({ msg: "Selected Students Have Been Successfully Deleted!", success: true })
    } catch (err) {
        return res.send({ msg: err.message.replace(/\"/g, ""), success: false })
    }

}


exports.removeFromRecomended = async (req, res) => {
    let recommededId = req.params.recommendedId;
    if (!recommededId) {
        res.json({
            success: false,
            msg: "Please give the recomended id in params!"
        })
    }
    recon = await RecommendedForTest.findById(recommededId);
    let studentId = recon.studentId;


    let deleteRecommended = await Member.findOneAndUpdate(studentId, { isRecommended: false })
    if (!deleteRecommended) {
        res.json({
            success: false,
            msg: "The student cannot be removed!"
        })
    }
    let isDeleted = await RecommendedForTest.findByIdAndDelete(recommededId);
    if (!isDeleted) {
        res.json({
            success: false,
            msg: "The student cannot be removed!"
        })
    } else {
        res.json({
            success: true,
            msg: "The recommended student was successfully removed from the list!"
        })

    }
}
exports.deleteAll_for_register = async (req, res) => {
    let regesterIds = req.body.registeredIds;
    try {
        let promise = [];
        for (let id in regesterIds) {
            let {eventId, studentId} = await RegisterdForTest.findOne({ _id: regesterIds[id] });
            await RegisterdForTest.deleteOne({ _id: regesterIds[id] },
                async function (err, datas) {
                    if (err) { return res.send({ msg: "The recommended student was not removed!", success: false }) }
                    await RecommendedForTest.deleteOne({eventId:eventId, studentId:studentId});
                    promise.push(datas)
                })
        }
        Promise.all(promise);
        res.send({ msg: "Selected Students Have Been Successfully Deleted!", success: true })
    } catch (err) {
        return res.send({ msg: err.message.replace(/\"/g, ""), success: false })
    }

}
exports.removeFromRegister = async (req, res) => {
    let regesterId = req.params.regesterId;
    if (!regesterId) {
        res.json({
            success: false,
            msg: "Please give the recomended id in params!"
        })
    }
    recon = await RegisterdForTest.findById(regesterId);
    let studentId = recon.studentId;


    let deleteRecommended = await Member.findOneAndUpdate(studentId, { isRecommended: false })
    if (!deleteRecommended) {
        res.json({
            success: false,
            msg: "The student cannot be removed!"
        })
    }
    let isDeleted = await RegisterdForTest.findByIdAndDelete(regesterId);
    if (!isDeleted) {
        res.json({
            success: false,
            msg: "The student cannot be removed!"
        })
    } else {
        res.json({
            success: true,
            msg: "The recommended student was successfully removed from the list!"
        })

    }
}
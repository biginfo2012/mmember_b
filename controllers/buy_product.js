// const product = require("../models/product");
const buy_product = require("../models/buy_product");
const Finance_infoSchema = require("../models/finance_info");
const AddMember = require("../models/addmember");
const StripeApis = require("../Services/stripe");
const StripeCards = require('../models/stripe_cards')
const StripeCustomers = require('../models/stripe_customers')
const StoreTransaction = require('../models/store_transactions')
const User = require("../models/user");
const _ = require("lodash");
const Joi = require("@hapi/joi");
var mongo = require("mongoose");
const { valorTechPaymentGateWay } = require("./valorTechPaymentGateWay");

const createEMIRecord = require("../Services/createEMi");

const randomNumber = (length, addNumber) => {
    return parseInt(
        (Math.floor(Math.random() * length) + addNumber).toString().substring(1)
    );
};

const getUidAndInvoiceNumber = () => {
    return {
        uid: randomNumber(100000000000, 100),
        invoice_no: randomNumber(10000000, 100),
    };
};


exports.product_InfoById = async (req, res) => {
    var productID = req.params.productID;
    var userId = req.params.userId;
    try {
        let productData = await buy_product.find({
            _id: productID,
            userId: userId,
        });
        res.send({
            msg: "done",
            data: productData,
        });
    } catch (error) {
        res.send({ error: error.message.replace(/\"/g, ""), success: false });
    }
};

let createCardToken = async (body, resp) => {
    let cardNumber = body.cardNumber
    let cardExpiryMonth = body.cardExpiryMonth
    let cardExpiryYear = body.cardExpiryYear
    let cardCvc = body.cardCvc

    let cardToken = await resp.tokens.create({
        card: {
            number: cardNumber,
            exp_month: cardExpiryMonth,
            exp_year: cardExpiryYear,
            cvc: cardCvc,
        },
    });
    return cardToken
};

let createCard = async (req, resp) => {
    try {
        let cardNumber = req.body.card_number
        let cardExpiryMonth = req.body.card_expiry_month
        let cardExpiryYear = req.body.card_expiry_year
        let cardCvc = req.body.card_cvc
        let email = req.body.email
        let phone = req.body.phone
        let cardToken = await createCardToken({ cardNumber, cardExpiryMonth, cardExpiryYear, cardCvc }, resp)
        let findCustomer = await StripeCustomers.findOne({ "email": email })
        let customerId
        let cardCheck = await StripeCards.findOne({ "card_number": cardNumber, "email": email })
        if (cardCheck) {
            return { "status": false, "message": "card already existed with this customer email" }
        }
        if (findCustomer == null) {
            return { "status": false, "message": "customer not existed" }
        }
        else {
            customerId = findCustomer.id
        }
        let cardId = await resp.customers.createSource(
            customerId,
            { source: cardToken.id }
        );
        let storeCard = StripeCards.create(
            {
                "customer_id": customerId,
                "card_id": cardId.id,
                "card_number": cardNumber,
                "email": email,
                "phone": phone
            }
        )

        return cardId
    }
    catch (error) {
        console.log("--------------", JSON.parse(JSON.stringify(error)))
        return error
    }
};

let createPayment = async (req, resp) => {
    try {
        let findCustomer = await StripeCustomers.findOne({ "email": req.body.email })
        if (findCustomer == null) {
            throw { "status": false, "message": "customer not existed" }
        }
        console.log("amount is ------------", req.body.amount, req.body.card_id,)
        console.log(resp)
        let paymentIntent = await resp.paymentIntents.create({
            amount: (req.body.amount) * 100, //stripe uses cents
            currency: 'usd',
            customer: findCustomer.get("id"),
            payment_method_types: ['card'],
            payment_method: req.body.card_id,
            confirm: "true",
            description: req.body.description
        });
        let storeTransaction = await StoreTransaction.create(paymentIntent)
        return paymentIntent
    }
    catch (err) {
        return err
    }
  };

exports.buy_product_stripe = async (req, res) => {
    const userId = req.params.userId;
    let { stripe_sec } = await User.findOne({ _id: userId });
    const studentId = req.params.studentId;
    let stripePayload = req.body.product_details.stripePayload ? req.body.product_details.stripePayload : {};
    let productData = req.body.product_details;
    console.log(productData)
    const Address = stripePayload ? stripePayload.address : "";
    const payLatter = req.body.product_details.pay_latter;
    const financeId = req.body.product_details.financeId ? req.body.product_details.financeId : 1;
    const ptype = req.body.product_details.ptype;
    delete req.body.product_details.stripePayload;
    let memberShipDoc;
    productData.userId = userId;
    try {
        if (!productData.isEMI && productData.balance == 0
            // productData.payment_type == "pif"
        ) {
            productData.due_status = "paid";
            if (ptype === 'credit card') {
                if (stripePayload.pan) {
                    var cli = await require("stripe")(stripe_sec);
                    let cardId
                    let findExistingCard = await StripeCards.findOne({ "card_number": stripePayload.card_number })
                    console.log(findExistingCard)
                    if (findExistingCard) {
                        cardId = findExistingCard["card_id"]
                    }
                    else {
                        console.log(cli)
                        if (!cli) {
                            return res.send({ msg: "please add stipe Keys!", success: false })
                        }
                        let createdCard = await createCard({
                            "body": {
                                "card_number": stripePayload.card_number,
                                "card_expiry_month": stripePayload.card_expiry_month,
                                "card_expiry_year": stripePayload.card_expiry_year,
                                "card_cvc": stripePayload.card_cvc,
                                "email": stripePayload.email,
                                "phone": stripePayload.phone,
                            }
                        }, cli)
                        console.log(createdCard)
                        if (createdCard.status) {
                            return createdCard
                        }
                        cardId = createdCard["id"]
                    }
                    let createPaymentResponse = await createPayment({
                        "body": {
                            "amount": stripePayload.amount,
                            "card_id": cardId,
                            "description": stripePayload.description,
                            "email": stripePayload.email
                        }
                    }, cli)
                    console.log(createPaymentResponse);
                    res.send(createPaymentResponse)
                }
                else {
                    return res.send({
                        msg: "please provide Card Detatils",
                        success: false,
                    });
                }
            }
        } else {
            res.send({ msg: "EMI system not supported yet!", success: false });
        }
    } catch (err) {
        res.send({ msg: error.message.replace(/\"/g, ""), success: false });
    }

}

exports.buy_product = async (req, res) => {
    const userId = req.params.userId;
    const studentId = req.params.studentId;
    let valorPayload = req.body.product_details.valorPayload ? req.body.product_details.valorPayload : {};
    valorPayload.app_id = req.valorCredentials.app_id
    valorPayload.auth_key = req.valorCredentials.auth_key
    valorPayload.epi = req.valorCredentials.epi
    let productData = req.body.product_details;
    const Address = valorPayload ? valorPayload.address : "";
    const payLatter = req.body.product_details.pay_latter;
    const financeId = req.body.product_details.financeId ? req.body.product_details.financeId : 1;
    const ptype = req.body.product_details.ptype;
    delete req.body.product_details.valorPayload;
    let memberShipDoc;
    productData.userId = userId;
    try {
        if (productData.isEMI) {
            if (productData.payment_time > 0 && productData.balance > 0 && productData.payment_type !== "pif") {
                productData.schedulePayments = createEMIRecord(
                    productData.payment_time,
                    productData.payment_money,
                    productData.start_payment_date,
                    productData.createdBy,
                    productData.payment_type,
                    productData.pay_latter,
                    productData.due_every
                );
                if (valorPayload && ptype == "credit card") {
                    valorPayload.descriptor = "BETA TESTING";
                    valorPayload.product_description = "Mymember brand Product";
                    const { uid } = getUidAndInvoiceNumber();
                    delete valorPayload.subscription_starts_from;
                    delete valorPayload.Subscription_valid_for;
                    let addValorPay = valorPayload;
                    valorPayload = { ...valorPayload, uid };
                    const saleFormatedPayload = getFormatedPayload(valorPayload);
                    const resp = await valorTechPaymentGateWay.saleSubscription(
                        saleFormatedPayload
                    );
                    // console.log(resp.data)

                    if (resp.data.error_no == 'S00') {
                        if (payLatter === "credit card" && (productData.payment_type === "monthly" || productData.payment_type === "weekly")) {
                            addValorPay = { ...addValorPay, ...getUidAndInvoiceNumber() };
                            const addFormatedPayload = getFormatedPayload(addValorPay);
                            const addresp = await valorTechPaymentGateWay.addSubscription(
                                addFormatedPayload
                            );
                            // console.log(addresp.data)
                            if (addresp.data.error_no === "S00") {
                                productData.subscription_id = addresp.data.subscription_id
                                productData.transactionId = {
                                    rrn: resp.data.rrn,
                                    txnid: resp.data.txnid,
                                    token: resp.data.token,
                                };
                                if (!financeId) {
                                    valorPayload.address = Address;
                                    valorPayload.userId = userId;
                                    valorPayload.studentId = studentId;
                                    const financeDoc = await createFinanceDoc(valorPayload);
                                    if (financeDoc.success) {
                                        productData.product_status = "Active";
                                        memberShipDoc = await createProductDocument(
                                            productData,
                                            studentId
                                        );
                                        return res.send(memberShipDoc);
                                    } else {
                                        return res.send({
                                            msg: "Finance and product doc not created!",
                                            success: false,
                                        });
                                    }
                                }

                                productData.product_status = "Active";
                                memberShipDoc = await createProductDocument(
                                    productData,
                                    studentId
                                );
                                return res.send(memberShipDoc);

                            } else {
                                res.send({ msg: (addresp.data.mesg ? addresp.data.mesg : addresp.data.msg), success: false });
                            }
                        }
                        else {
                            // paylater with cash
                            if (!financeId) {
                                valorPayload.address = Address;
                                valorPayload.userId = userId;
                                valorPayload.studentId = studentId;
                                const financeDoc = await createFinanceDoc(valorPayload);
                                if (financeDoc.success) {
                                    productData.product_status = "Active";
                                    memberShipDoc = await createProductDocument(
                                        productData,
                                        studentId
                                    );
                                    return res.send(memberShipDoc);
                                } else {
                                    res.send({
                                        msg: "Finance and product doc not created!",
                                        success: false,
                                    });
                                }
                            }

                            productData.product_status = "Active";
                            memberShipDoc = await createProductDocument(
                                productData,
                                studentId
                            );
                            return res.send(memberShipDoc);

                        }
                    }
                    else {
                        res.send({ msg: resp.data.mesg, success: false });
                    }
                }
                else if (ptype === "cash" || ptype === "cheque") {
                    productData.product_status = "Active";
                    memberShipDoc = await createProductDocument(
                        productData,
                        studentId
                    );
                    return res.send(memberShipDoc);
                }
                else {
                    res.send({
                        msg: "payment mode should be cash/cheque or credit card",
                        success: false,
                    });
                }
            } else {
                res.send({
                    msg: "payment type should be weekly/monthly",
                    success: false,
                });
            }
        } else {
            if (!productData.isEMI && productData.balance == 0 && productData.payment_type == "pif") {
                productData.due_status = "paid";
                if (ptype === 'credit card') {
                    if (valorPayload.pan) {
                        const { uid } = getUidAndInvoiceNumber();
                        valorPayload = { ...valorPayload, uid };
                        const FormatedPayload = getFormatedPayload(valorPayload);
                        const resp = await valorTechPaymentGateWay.saleSubscription(
                            FormatedPayload
                        );
                        // console.log(resp.data)
                        if (resp.data.error_no === "S00") {
                            productData.transactionId = {
                                rrn: resp.data.rrn,
                                txnid: resp.data.txnid,
                                token: resp.data.token,
                            };

                            if (!financeId) {
                                valorPayload.address = Address;
                                valorPayload.userId = userId;
                                valorPayload.studentId = studentId;
                                const financeDoc = await createFinanceDoc(valorPayload);
                                if (financeDoc.success) {
                                    memberShipDoc = await createProductDocument(
                                        productData,
                                        studentId
                                    );
                                    return res.send(memberShipDoc);
                                } else {
                                    return res.send({
                                        msg: "Finace and product doc not created!",
                                        success: false,
                                    });
                                }
                            }
                            productData.product_status = "Active";
                            memberShipDoc = await createProductDocument(
                                productData,
                                studentId
                            );
                            return res.send(memberShipDoc);

                        } else {
                            res.send({ msg: resp.data.mesg, success: false });
                        }
                    }
                    else {
                        return res.send({
                            msg: "please provide Card Detatils",
                            success: false,
                        });
                    }
                }
                else if (ptype === "cash" || ptype === "cheque") {
                    memberShipDoc = await createProductDocument(
                        productData,
                        studentId
                    );
                    return res.send(memberShipDoc);
                }
            } else {
                res.send({
                    msg: "payment type should be Pif or Monthly/Weekly",
                    success: false,
                });
            }
        }
    } catch (err) {
        res.send({ msg: err.message.replace(/\"/g, ""), success: false });
    }
};

function getFormatedPayload(valorPayload) {
    const payload = valorPayload;
    const address = payload.address;
    delete payload.address;
    let subscriptionAddress;
    if (payload.Subscription_valid_for) {
        subscriptionAddress = {
            shipping_customer_name: payload.card_holder_name,
            shipping_street_no: address.street_no,
            shipping_street_name: address.address,
            shipping_zip: address.zip,
            billing_customer_name: payload.card_holder_name,
            billing_street_no: address.street_no,
            billing_street_name: address.address,
            billing_zip: address.zip,
        }
        return {
            ...payload,
            ...subscriptionAddress
        }
    }
    delete payload.subscription_day_of_the_month;
    delete payload.Subscription_valid_for;
    delete payload.subscription_starts_from;
    return {
        ...payload,
        ...address,
    };
}

function createProductDocument(productData, studentId) {
    return new Promise((resolve, reject) => {
        let product = new buy_product(productData);
        product.save((err, data) => {
            if (err) {
                reject({ msg: "product not buy", success: err });
            } else {
                update = {
                    $push: { product_details: data._id },
                };
                AddMember.findOneAndUpdate(
                    { _id: studentId },
                    update,
                    (err, stdData) => {
                        if (err) {
                            resolve({
                                msg: "product id is not add in student",
                                success: false,
                            });
                        } else {
                            buy_product
                                .findOneAndUpdate(
                                    { _id: data._id },
                                    {
                                        $push: {
                                            studentInfo: stdData._id,
                                        }
                                    }
                                )
                                .exec(async (err, result) => {
                                    if (err) {
                                        resolve({
                                            msg: "student id is not add in buy membership",
                                            success: false,
                                        });
                                    } else {
                                        resolve({
                                            msg: "product purchase successfully",
                                            success: true,
                                        });
                                    }
                                });
                        }

                    })
            }
        }
        );
    }
    )
}
function createFinanceDoc(data) {
    const { studentId } = data;
    return new Promise((resolve, reject) => {
        const financeData = new Finance_infoSchema(data);

        financeData.save((err, Fdata) => {
            if (err) {
                reject({ success: false, msg: "Finance data is not stored!" });
            } else {
                AddMember.findByIdAndUpdate(studentId, {
                    $push: { finance_details: Fdata._id },
                }).exec((err, data) => {
                    if (data) {
                        resolve({ success: true });
                    } else {
                        reject({ success: false });
                    }
                });
            }
        });
    });
}
exports.update = async (req, res) => {
    const productId = req.params.productId;
    const type = req.params.type;
    const subscription_id = req.body.subscription_id;
    const cardDetails = req.body.cardDetails;
    let expiry_date = ""
    if (cardDetails) {
        expiry_date = toString(cardDetails.expiry_month) + toString(cardDetails.expiry_year)
        delete cardDetails.expiry_month;
        delete cardDetails.expiry_year;
        cardDetails.expiry_date = expiry_date;
    }
    try {
        if (req.body.isTerminate) {
            res.status(200).send({
                msg: "Membership already terminated!",
                success: true,
            });
        } else {
            if (type == "others") {
                await buy_product.updateOne({ _id: productId }, req.body);
                res.status(200).send({
                    msg: "Membership updated successfully!",
                    success: true,
                });
            } else if (type == "freeze") {
                if (subscription_id) {
                    const freezeValorPayload = await valorTechPaymentGateWay.freezeSubscription({ app_id: req.valorCredentials.app_id, auth_key: req.valorCredentials.auth_key, epi: req.valorCredentials.epi, subscription_id, freeze_start_date: req.body.freeze_start_date.split('-').join(''), freeze_stop_date: req.body.freeze_stop_date.split('-').join('') });
                    if (freezeValorPayload?.data?.error_no === "S00") {
                        const freezeRes = await freezeMembership(productId, req.body);
                        if (freezeRes) {
                            res.status(200).send({
                                msg: "Membership freezed successfully",
                                success: true,
                            });
                        } else {
                            res.status(400).send({
                                msg: "Membership not updated but valor freezed product!",
                                success: false,
                            });
                        }
                    } else {
                        res.status(400).send({
                            msg: "Due to the technical issue subscription not freeze please try again or later!",
                            success: false,
                        });
                    }
                } else {
                    const freezeRes = await freezeMembership(productId, req.body);
                    if (freezeRes) {
                        res.status(200).send({
                            msg: "Membership freezed successfully",
                            success: true,
                        });
                    } else {
                        res.status(400).send({
                            msg: "Membership not freezed please try again!",
                            success: false,
                        });
                    }
                }
            } else if (type == "unfreeze") {
                let unfreezeRes;
                if (subscription_id) {
                    const valorRes = await valorTechPaymentGateWay.unfreezeSubscription({ app_id: req.valorCredentials.app_id, auth_key: req.valorCredentials.auth_key, epi: req.valorCredentials.epi, subscription_id });
                    if (valorRes.data.error_no === "S00") {
                        unfreezeRes = await unFreezeMembership(productId, req.body);
                        if (unfreezeRes) {
                            res.status(200).send({
                                msg: "Membership unfreezed successfully",
                                success: true,
                            });
                        } else {
                            res.status(400).send({
                                msg: "Membership not unfreeze in DB but valorPayTech unfreezed product!",
                                success: false,
                            });
                        }
                    } else {
                        res.status(400).send({
                            msg: "Due to internal issue product not unfreezed please try again!!",
                            success: false,
                        });
                    }
                } else {
                    unfreezeRes = await unFreezeMembership(productId, req.body);
                    if (unfreezeRes) {
                        res.status(200).send({
                            msg: "Membership unfreezed successfully",
                            success: true,
                        });
                    } else {
                        res.status(400).send({
                            msg: "Membership not unfreeze please try again!",
                            success: false,
                        });
                    }
                }
            } else if (type == "forfeit") {
                const emiId = req.body.emiId;
                const createdBy = req.body.createdBy;
                const balance = req.body.balance;
                let forfeit;
                if (subscription_id) {
                    const { uid } = getUidAndInvoiceNumber()
                    let valorRes = await valorTechPaymentGateWay.forfeitSubscription({ app_id: req.valorCredentials.app_id, auth_key: req.valorCredentials.auth_key, epi: req.valorCredentials.epi, subscription_id, uid })
                    if (valorRes.data.error_no == "S00") {
                        await paymentProcessing(productId, emiId, balance, createdBy, type, req.body.ptype);
                        forfeit = await forfeitSubscription(productId, req.body.reason)
                        if (forfeit.success) {
                            res.status(200).send(forfeit)
                        } else {
                            res.status(400).send(forfeit)
                        }
                    } else {
                        res.status(400).send({
                            success: false,
                            msg: "Membership forfeting failed please try again!"
                        })
                    }
                } else {
                    await paymentProcessing(productId, emiId, balance, createdBy, type, req.body.ptype);
                    forfeit = await forfeitSubscription(productId, req.body.reason)
                    if (forfeit.success) {
                        res.status(200).send(forfeit)
                    } else {
                        res.status(400).send(forfeit)
                    }
                }
            } else if (type == "terminate") {
                let terminate;
                if (subscription_id) {
                    const valorDelete = await valorTechPaymentGateWay.deleteSubscription({ app_id: req.valorCredentials.app_id, auth_key: req.valorCredentials.auth_key, epi: req.valorCredentials.epi, subscription_id });
                    if (valorDelete.data.error_no === "S00") {
                        terminate = await terminateMembership(productId, req.body.reason)
                        if (terminate.success) {
                            res.status(200).send(terminate)
                        } else {
                            res.status(400).send(terminate)
                        }
                    } else {
                        res.send({
                            msg: "Due to technical reason product not terminating please try later!",
                            success: false
                        })
                    }
                } else {
                    terminate = await terminateMembership(productId, req.body.reason)
                    if (terminate.success) {
                        res.status(200).send(terminate)
                    } else {
                        res.status(400).send(terminate)
                    }
                }
            } else if (type == "refund") {
                let refundRes;
                const balance = req.body.balance
                const emiId = req.body.emiId;
                const createdBy = req.body.createdBy;
                if (cardDetails) {
                    const { uid } = getUidAndInvoiceNumber();
                    const valorRefundRes = await valorTechPaymentGateWay.refundSubscription({ app_id: req.valorCredentials.app_id, auth_key: req.valorCredentials.auth_key, epi: req.valorCredentials.epi, ...cardDetails, uid, amount: req.body.Amount });
                    if (valorRefundRes.data.error_no === "S00") {
                        if (emiId) {
                            await paymentProcessing(productId, emiId, balance, createdBy, type, req.body.ptype);
                        }
                        refundRes = await refundMembership(productId, req.body);
                        if (refundRes) {
                            res.status(200).send({
                                msg: "Membership refunded successfully!",
                                success: true,
                            });
                        } else {
                            res.status(400).send({
                                msg: "Refunded successfully but stundet info not updated!",
                                success: false,
                            });
                        }
                    } else {
                        res.status(400).send({
                            msg: "Due to network issue product not refunded please try again!!",
                            success: true,
                        });
                    }
                } else {
                    if (emiId) {
                        await paymentProcessing(productId, emiId, balance, createdBy, type, req.body.ptype);
                    }
                    refundRes = await refundMembership(productId, req.body);
                    if (refundRes) {
                        res.status(200).send({
                            msg: "Membership refunded successfully!",
                            success: true,
                        });
                    } else {
                        res.status(400).send({
                            msg: "Refund failed please try again!",
                            success: false,
                        });
                    }
                }
            }
        }
    } catch (err) {
        res.send({ error: err.message.replace(/\"/g, ""), success: false });
    }
};

exports.remove = (req, res) => {
    const id = req.params.productId;
    buy_product
        .deleteOne({ _id: id })
        .then((resp) => {
            AddMember.updateOne(
                { product_details: id },
                { $pull: { product_details: id } },
                function (err, data) {
                    if (err) {
                        res.send({ error: "product is not deleted", success: false });
                    } else {
                        res.send({ msg: "product is deleted successfully", success: true });
                    }
                }
            );
        })
        .catch((err) => {
            res.send(err);
        });
};



async function secureLink() {
    let payload = {
        appid: "hN0X2aFHUIoGbUbkzVZqq3MBE3J3USaM",
        appkey: "xwSilkDfrwdYBSF61tn4XEoMKJNaoCin",
        epi: "2129909286",
        amount: 300,
    }
    let resp = await valorTechPaymentGateWay.securePayLink(payload)

    if (resp.data.error_no == 'S00') {
        console.log(resp.data)
        const paymentInfo = {
            uid_mode: 1,
            cardnumber: 5146315000000055,
            expirydate: 1234,
            cvv: 998,
            cardholdername: "parmeshwar",
            epage: 0,
            phone: 9076388126,
            uid: resp.data.uid
        }
        const txn = await valorTechPaymentGateWay.epageCustomTransaction(paymentInfo)
        let data = txn.data
        console.log(data)
        // console.log(txn.data.msg, txn.data.error_no)
        // if (txn.data.error_no === 'S00') {
        //     console.log({ msg: txn.data.msg, token: txn.data.token })
        // }

    }
}

// secureLink()
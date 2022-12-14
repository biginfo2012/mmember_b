var product = require('../models/product')
const cloudUrl = require("../gcloud/imageUrl");
var productFolders = require('../models/productFolder')
const BuyProduct = require("../models/buy_product");
const Student = require("../models/addmember");
const mergeFile = require("../Services/mergeFile")


exports.create = async (req, res) => {
    try {
        const productDetails = req.body;
        productDetails.userId = req.params.userId;
        productDetails.adminId = req.params.adminId;
        productDetails.folderId = req.params.folderId;
        const promises = []
        if (req.files) {
            Object.entries(req.files).forEach(([key, value]) => {
                value.map(file => {
                    if (file.fieldname === "thumbnail") {
                        cloudUrl.imageUrl(file)
                            .then(data => {
                                productDetails.productThumbnail = data
                            })
                            .catch(err => {
                                res.send({ msg: "Thumbnail not uploaded!", success: false })
                            })
                    } else {
                        promises.push(cloudUrl.imageUrl(file))
                    }
                })
            });
        }
        var docs = await Promise.all(promises);
        productDetails.productFile = docs;
        var productObj = new product(productDetails);
        productObj.save((err, productData) => {
            if (err) {
                res.send({ msg: "Product not created!", success: false })
            }
            else {
                productFolders.findByIdAndUpdate(req.params.folderId, { $push: { products: productData._id } })
                    .exec((err, product) => {
                        if (err) {
                            res.send({ msg: 'Product not added in folder', success: false })
                        }
                        else {
                            res.send({ msg: "Product created successfully", success: true })
                        }
                    })
            }
        })
    }
    catch (err) {
        res.send({ msg: err.message.replace(/\"/g, ""), success: false })
    }
}
exports.read = (req, res) => {
    const adminId = req.params.adminId
    const userId = req.params.userId

    product.find({ $and: [{ userId: { $in: [userId] } }, { adminId: adminId }] }).exec((err, data) => {
        if (err) {
            res.send({ msg: 'Products not found' })
        }
        else {
            res.send({ data, success: true })
        }
    })
}

exports.product_info = (req, res) => {
    var productId = req.params.productId;
    product.findById(productId).exec((err, data) => {
        if (err) {
            res.send({ msg: 'Product not found', success: true })
        }
        else {
            res.send({ data, success: true })
        }
    })
}

exports.deleteproduct = (req, res) => {
    const productId = req.params.productId;
    const adminId = req.params.adminId
    const userId = req.params.userId;
    try {
        product.findOneAndRemove(
            { _id: productId, $and: [{ userId: userId }, { adminId: adminId }] })
            .exec((err, data) => {
                if (err) {
                    res.send({ msg: err, success: false })
                }
                else {
                    if (!data) {
                        return res.status(401).send({
                            msg: "This is system generated Product Only admin can delete",
                            success: false,
                        });
                    }
                    productFolders.updateOne({ products: data._id },
                        { $pull: { products: data._id } },
                        function (err, temp) {
                            if (err) {
                                res.send({
                                    msg: "Product not removed",
                                    success: false,
                                });
                            } else {
                                res.send({
                                    msg: "Product removed successfully",
                                    success: true,
                                });
                            }
                        })
                }
            })
    } catch (err) {
        res.send({ msg: err.message.replace(/\"/g, ""), success: false })
    }
};

exports.updateproduct = async (req, res) => {
    try {
        var productData = req.body
        const productId = req.params.productId;
        const adminId = req.params.adminId
        const userId = req.params.userId;
        const new_folderId = req.body.folderId;
        const old_folderId = req.body.old_folderId;
        productData.folderId = new_folderId

        const promises = []
        if (req.files) {
            (req.files).map(file => {
                if (file.originalname.split('.')[0] === "thumbnail") {
                    cloudUrl.imageUrl(file)
                        .then(data => {
                            productData.productThumbnail = data
                        })
                        .catch(err => {
                            res.send({ msg: "Thumbnail not uploaded!", success: false })
                        })
                } else {
                    promises.push(cloudUrl.imageUrl(file))
                }
            });
            var docs = await Promise.all(promises);
            productData.productFile = docs;
        }
        product
            .updateOne({ _id: productId, $and: [{ userId: userId }, { adminId: adminId }] }, { $set: productData })
            .exec(async (err, updateData) => {
                if (err) {
                    res.send({ msg: err, success: false })
                }
                else {
                    if (updateData.n < 1) {
                        return res.send({
                            msg: "This is system generated product Only admin can update",
                            success: false,
                        });
                    }
                    await productFolders.findByIdAndUpdate(new_folderId, {
                        $addToSet: { products: productId },
                    });
                    productFolders
                        .findByIdAndUpdate(old_folderId, {
                            $pull: { products: productId },
                        })
                        .exec((err, temp) => {
                            if (err) {
                                res.send({
                                    msg: "Product  not updated",
                                    success: false,
                                });
                            } else {
                                res.send({
                                    msg: "Product updated successfully",
                                    success: true,
                                });
                            }
                        });
                }
            })
    } catch (err) {
        res.send({ msg: err.message.replace(/\"/g, ""), success: false })
    }

}


exports.mergeDoc = async (req, res) => {
    let docBody = req.body.docUrl;
    let studentId = req.params.studentId;
    let userId = req.params.userId;
    let productId = req.params.productId;
    let buyProductId = req.params.buyProductId;
    try {
        const studentInfo = await Student.findOne({ _id: studentId });
        const productInfo = await product.findOne({ _id: productId });
        const mergedInfo = { ...studentInfo, ...productInfo };
        let fileObj = mergeFile(docBody, mergedInfo)
        //fs.writeFileSync(path.resolve(__dirname, "output.pdf"), finalPDF);
        cloudUrl.imageUrl(fileObj).then(Docresp => {
            BuyProduct.updateOne({ _id: buyProductId }, { $set: { mergedDoc: Docresp } }).then(data => {
                res.send({ msg: "Merged doc added succesfully!", success: true });
            }).catch(err => {
                res.send({ msg: "merged doc not added!", success: false })
            })
        }).catch(err => {
            res.send({ msg: "merged doc not added!", success: false })
        })
    } catch (err) {
        res.send({ msg: "merged doc not added!", success: false })
    }
}

// exports.updateStatus = (req,res)=>{
//     var productId = req.params.productId;
//     var status = req.params.status
//     if(status=='false')
//     {
//     product.findByIdAndUpdate({ _id:productId },{$set:{ status:'true' } })
//     .exec((err,data)=>{
//         if(err){
//             res.send({error:'product status is not update'})
//         }
//         else{
//             product.findById(productId).exec((err,data)=>{
//                 res.send(data)
//                 })                       
//             }
//         })
//     }
//     else if(status=='true'){
//         product.findByIdAndUpdate({ _id:productId },{$set:{ status:'false' } })
//         .exec((err,data)=>{
//         if(err){
//             res.send({error:'product status is not update'})
//         }
//         else{
//             product.findById(productId).exec((err,data)=>{
//                 res.send(data)
//                 })                       
//             }
//         })
//     }
// }
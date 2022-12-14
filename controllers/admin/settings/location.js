const location = require("../../../models/admin/settings/location")
const User = require("../../../models/user")

exports.listLocation = (req, res) => {
    User.find({ isLocation: true })
        .populate('default_location')
        .exec((err, list) => {
            if (err) {
                res.send({ error: 'location list not found' })
            }
            else {
                res.send(list)
            }
        })

}

exports.addLocation = (req, res) => {
    let userId = req.params.userId;
    let locationData = req.body;
    locationData.userId = userId;
    locationData.isLocation = true

    let addLocation = new location(locationData)
    addLocation.save((err, loc) => {
        if (err) {
            console.log(err)
            res.send({ msg: 'location already exist!', success: err })
        }
        else {
            console.log(loc._id)
            User.findOneAndUpdate({ _id: userId },

                {
                    $addToSet: { default_location: [loc._id] },
                },
            )
                .exec(async (err, locupdate) => {
                    await User.findOneAndUpdate({ _id: userId }, {
                        $set: { isLocation: true }
                    })
                    console.log(locupdate)
                    if (err) {
                        res.send({ msg: err, success: false })
                    }
                    else {
                        res.send({ msg: 'location create successfully', Location: loc })
                    }
                })
        }
    })
}

exports.access_school = async (req, res) => {
    let userId = req.params.userId;
    let access_location_list = req.body.access_location_list;
    User.updateOne(
        { _id: userId },
        {
            $set: {
                isAccessLocations: true,
                locations: access_location_list,
            },
        }
    ).exec((err, data) => {
        if (err || data.nModified === 0) {
            return res.send({ msg: 'User not found', success: false });
        } else {
            return res.send({ msg: 'Access Granted!', success: true });
        }
    });
};


exports.updateLocation = (req, res) => {
    try {
        location.updateOne({ _id: req.params.locationId }, req.body)
            .then((result) => {
                res.send({ msg: 'location updated successfully', success: true })
            }).catch((err) => {
                res.send({ msg: 'location is not update', success: false })
            })
    } catch (err) {
        return res.send({ msg: 'location is not update', success: false });
    }
}

exports.removeLocation = (req, res) => {
    let locationId = req.params.locationId;
    location.findByIdAndRemove(locationId)
        .exec((err, delLoc) => {
            if (err) {
                res.send({ msg: 'location not removed ', success: false })
            }
            else {
                User.updateOne({ default_location: locationId }, { $pull: { default_location: locationId } })
                    .exec((err, data) => {
                        if (err) {
                            res.send({ msg: 'location not removed ', success: false })

                        }
                        else {
                            res.send({ msg: 'location removed successfully', success: true })

                        }
                    })
            }
        })

}
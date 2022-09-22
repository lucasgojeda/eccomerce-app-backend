const { response, request } = require('express');

const { Sale, User, Notification } = require('../models');
const { sortArray } = require('../helpers/sortArrays');


const getNotifications = async (req = request, res = response) => {

    const { id } = req;

    try {

        const user = await User.findById(id);


        const [sales, notifications] = await Promise.all([
            Sale.find({ user: user._id }).populate('user', 'name'),
            Notification.find({ user: user._id })
        ])

        let filteredSales = sortArray(sales, orderBy, filterBy);

        res.json({
            msg: 'OK',
            sales: filteredSales,
            notifications
        })

    } catch (error) {
        res.json({
            msg: error
        })
        console.log(error)
    }
};

const updateNotification = async (req = request, res = response) => {

    const { id } = req.params;

    try {

        const notificationDB = await Notification.findById(id)

        if (!notificationDB) {
            return res.status(400).json({
                msg: `The notification with the id ${id} does not exist!`
            });
        }


        const notification = await Notification.findByIdAndUpdate(id, { status: false }, { new: true })

        res.json({
            msg: 'OK',
            notification
        })

    } catch (error) {
        res.json({
            msg: error
        })
        console.log(error)
    }
}


module.exports = {
    getNotifications,
    updateNotification
}

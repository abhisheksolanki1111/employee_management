const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    experience: { type: Number, required: true },
    lastWorkCompany: { type: String, required: true },
    dateOfResignation: { type: Date, required: true },
    joiningDate: { type: Date, required: true },
    history: [{
        _id: false,
        changedAt: { type: Date, default: Date.now },
        data: { type: Object }
    }]
});

module.exports = mongoose.model('Employee', EmployeeSchema);

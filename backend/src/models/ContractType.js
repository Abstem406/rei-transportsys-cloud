const mongoose = require('mongoose');

const contractTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
}, { timestamps: true });

const ContractType = mongoose.model('ContractType', contractTypeSchema);

module.exports = { ContractType }; 
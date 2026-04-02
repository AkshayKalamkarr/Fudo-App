import { Schema } from "mongoose";
const schema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    picture: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    aadharNumber: {
        type: String,
        required: true,
        unique: true,
    },
    drivingLicenseNumber: {
        type: String,
        required: true,
        unique: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    isAvailable: {
        type: Boolean,
        default: false,
    },
    lastActiveAt: {
        type: Date,
        default: Date.now,
    },
});

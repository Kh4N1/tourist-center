const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name!"],
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email"],
    },
    photo: String,
    role: {
        type: String,
        enum: ["user", "guide", "lead-guide", "admin"],
        default: "user",
    },
    password: {
        type: String,
        required: [true, "please Provide a password"],
        minLength: 8,
        select: false,
    },
    passwordConfirm: {
        type: String,
        required: [true, "please confirm your password"],
        validate: {
            // this only works on SAVE !!
            validator: function (el) {
                return el === this.password;
            },
            message: "Password are not the same!",
        },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
});

userSchema.pre("save", async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified("password")) return next();
    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // delete the passwordConfirm field
    this.passwordConfirm = undefined;
});

userSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function (next) {
    // this points to the current middleware
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword,
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10,
        );
        return JWTTimeStamp < changedTimestamp;
    }
    // false means NOT Changed
    return false;
};



const User = mongoose.model("User", userSchema);
module.exports = User;

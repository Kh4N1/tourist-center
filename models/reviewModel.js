const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty!"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this keyword points to model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId , {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating
  })
};

reviewSchema.post("save", function () {
  // this keyword point to current review
  this.constructor.calcAverageRatings(this.tour);
});


reviewSchema.methods.updateAndRecalculateAverage = async function (newRating) {
    // Update the rating of the review
    this.rating = newRating;
    await this.save();

    // Recalculate the average ratings for the associated tour
    await this.constructor.calcAverageRatings(this.tour);
};



const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
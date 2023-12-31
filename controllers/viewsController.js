const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getOverview = catchAsync (async (req, res, next) => {

    // 1) Get the tour data from collection
    const tours = await Tour.find();

    // 2) build template

    // 3) render template using data from point 1
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync (async (req, res, next) => {
    // 1) Get the tour data from collection for the requested tour
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404));
    }
    // 2) Build the tour template

    // 3) render template using data from step 1

    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getLoginForm = catchAsync (async (req, res) => {
    res.status(200).render('login', {
        title: 'Log in'
    });
});

exports.getSignupForm = catchAsync(async (req, res, next) => {
    res.status(201).render('signup', {
      title: 'Sign up to get started',
    });
});

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your Account'
    });
};

exports.getMyTours = catchAsync (async (req, res) => {
    // 1 Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    // 2 Find tours with the returned IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    });
});

exports.updateUserData = catchAsync (async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id, 
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).render('account', {
        title: 'Your Account',
        user: updatedUser
    });
});
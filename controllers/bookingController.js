
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('../models/tourModel')
const Booking = require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')
 
exports.getCheckoutSession = catchAsync(async(req, res, next) =>{
     // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId)
 
    const transformedItems = [{
        quantity: 1,
        price_data: {
            currency: "usd",
            unit_amount: tour.price * 100,
            product_data: {
                name: `${tour.name} Tour`,
                description: tour.description, //description here
                images: [`https://images.unsplash.com/photo-1686256282146-46dd71827a36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=928&q=80`],
                // images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`], //only accepts live images (images hosted on the internet),
            },
        },
    }]
 
     // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/`, //user will be redirected to this url when payment is successful. home page
        // cancel_url: `${req.protocol}://${req.get('host')}/${tour.slug}`, //user will be redirected to this url when payment has an issue. tour page (previous page)
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, //user will be redirected to this url
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId, //this field allows us to pass in some data about this session that we are currently creating.
        line_items: transformedItems,
        mode: 'payment',
 
    })
 
     // 3) Create session as response
     res.status(200).json({
        status: 'success',
        session
     });
});

exports.createBookingCheckout = catchAsync (async (req, res, next) => {
    // This is only temporary because is unsecure, everyone can make booking without paying
    const { tour, user, price }=req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({tour, user, price});
    res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
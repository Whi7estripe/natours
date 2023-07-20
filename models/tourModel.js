const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter a tour name'],
            unique: true,
            trim: true,
            maxlength: [40, 'Tour name cannot be more than 40 characters'],
            minlength: [3, 'Tour name cannot be less than 3 characters']
            // validate: [validator.isAlpha, 'Tour name can only contain letters'],
        },
        slug: String,
        duration: {
            type: Number,
            required: [true, 'Please enter a tour duration']
        },
        maxGroupSize: {
            type: Number,
                    required: [true, 'Please enter a max group size']
        },
        difficulty: {
            type: String,
            required: [true, 'Please enter a tour difficulty'],
            enum: {
                values: ['easy','medium', 'difficult'],
                message: 'Difficulty is either easy, medium or difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating must be less than 5'],
            set: val => Math.round(val *10) / 10
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'Please enter a price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    // this. only points to current doc on NEW document creation, doesn't work on UPDATE
                    return val < this.price;  // discount must be less than price
                },
                message: 'Discount price ({VALUE}) must be less than price'
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'Please enter a tour summary']
        },
        description: {
            type: String,
            trim: true,
            required: [true, 'Please enter a tour description']
        },
        imageCover: {
            type: String,
            required: [true, 'Please enter a tour image cover']
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String
        },
        locations: [
            {
                type: {
                    type: String,
                    default: 'Point',
                    enum: ['Point']
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number
            }
        ],
        guides: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'User'
            }
        ]
    }, 
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// tourSchema.index({price: 1});
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// tourSchema.pre('save', async function(next){
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })

// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// })

// QUERY MIDDLEWARE


tourSchema.pre(/^find/, function (next) {
// tourSchema.pre('find', function (next) {
    this.find({ secretTour: { $ne: true } });

    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next();
});


// tourSchema.post(/^find/, function (docs, next) {
//     // console.log(`Query took ${Date.now() - this.start} ms`);
//     next();
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
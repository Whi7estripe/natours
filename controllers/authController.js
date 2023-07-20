const { promisify } = require('util');
const crypto = require('crypto');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    // Remove password from output
    user.password = undefined;

    return res.status(statusCode).json({
        status: 'Successfully created',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync (async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync (async (req, res, next) => {
    const { email, password } = req.body;

    // Check if user exists
    if(!email || !password) {
        return next(new AppError('Please provide an email and password', 400));
    }

    // Check if user and password match
    const user = await User.findOne({ email }).select('+password');

    if(!user || !(await user.isCorrectPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // if user is found and password is right, send token to client
    createSendToken(user, 200, res);
   
});

exports.logout =  (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync (async (req, res, next) => {
    // Get token from header and check if it exists
    let token;
    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    // console.log(token);
    if(!token) {
        return next(new AppError('You are not logged in', 401));
    };
    // Validate token and Verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
        return next(new AppError('User not found', 401));
    };

    // Check user change password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password', 401));
    };


    // Grant access to protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Only for rendered pages, no errors are returned
exports.isLoggedIn = async (req, res, next) => {

    if (req.cookies.jwt) {
        try {
            // 1) Verify token
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt, 
                process.env.JWT_SECRET
            );
            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if(!currentUser) {
                return next();
            };
            // Check user change password after token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            };
            // 4) There is a logged in user
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array of strings that contains the roles to check 
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    }
}

exports.forgotPassword = catchAsync (async (req, res, next) => {
    // Get user by email
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new AppError('There is no user with that email', 404));
    }

    // Generate random token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    
    try {
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetUrl).sendPasswordReset();

        res.status(200).json({
            status:'success',
            message: 'Token sent to email!.'
        });  
    }  catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Email could not be sent, try again later!', 500));
    }

});

exports.resetPassword = catchAsync (async (req, res, next) => {
    // Get user based on reset token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    // If token is not expired, and the user exists, set the password
    if(!user) {
        return next(new AppError('Password reset token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Update changedPasswordAt property for the user


    // Log in user, send the JWT token
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync (async (req, res, next) => {
    //  Get user from collection
    const user = await User.findById(req.user.id).select('+password');
        // check if password matches
    if(!(await user.isCorrectPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Your current password is wrong!', 401));
    }


  // If so, update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // Log in, Send the JWT token
    createSendToken(user, 200, res);
});
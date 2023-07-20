import axios from 'axios';
import { showAlert } from './alerts';


export const bookTour = async (tourId) => {
    const stripe = Stripe('pk_test_51NVBGyLUZyGtQfy4jEbxhQf4CA5eVpfsY5ehtZLfaOeTzgx1wXPiU66MUS4d9lF9EKFDuHg8QFYnWTdosKm3SG9F001GBrTk8O');
    try {
        // 1 Get checkout session from endpoint (API)
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);
        // 2 Create checkout form + charge the credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }

};
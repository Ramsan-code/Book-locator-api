import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is missing in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default stripe;

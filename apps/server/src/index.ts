import express, { Express } from 'express';
import dotenv from 'dotenv';
import { createBooking } from './firebase';
import { generateItemsForPayment, getTotalPrice } from './helpers';

dotenv.config();

const app: Express = express();

app.use(express.json());

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

app.post('/create', async (req, res) => {
  try {
    const nights = 14;
    const adults = parseInt(req.body.adults);
    const children = parseInt(req.body.children);
    const pets = parseInt(req.body.pets);

    const totalPrice = getTotalPrice({
      nights,
      adults,
      children,
      pets,
    });

    const id = await createBooking({
      email: req.body.email,
      checkIn: req.body.checkIn,
      checkOut: req.body.checkOut,
      adults: req.body.adults,
      children: req.body.children,
      pets: req.body.pets,
      totalPrice,
    });

    const product = await stripe.products.create({
      id,
      name: 'Reservation at Hotel Trinserhof',
      description: `${req.body.checkIn} - ${req.body.checkOut} (${nights} nights, ${adults} x adult, ${children} x child, ${pets} x pet)`,
      metadata: {
        nights,
        adults,
        children,
        pets,
        totalPrice,
      },
    });

    const price = await stripe.prices.create({
      currency: 'eur',
      unit_amount: totalPrice,
      product: product.id,
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
    });

    res.status(200).json({ url: paymentLink.url });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error' });
  }
});

app.post('/send-payment-link', async (req, res) => {
  try {
    const nights = 14;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal', 'ideal', 'klarna'],
      mode: 'payment',
      line_items: generateItemsForPayment({
        nights,
        adults: parseInt(req.body.adults),
        children: parseInt(req.body.children),
        pets: parseInt(req.body.pets),
      }),
      success_url: `${process.env.CLIENT_URL}/success.html`,
      cancel_url: `${process.env.CLIENT_URL}`,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error' });
  }
});

app.listen(process.env.PORT || 3000);

import express, { Express } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createBooking, updateBooking } from './firebase';
import { bookingSchema } from '@bookings/types';

dotenv.config();

const app: Express = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if ([process.env.CLIENT_URL].indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  }),
);

app.use(express.json());

app.post('/submit', async (req, res) => {
  try {
    if (typeof req.body.email !== 'string' || req.body.email === '')
      throw new Error('Missing e-mail');
    const booking = await createBooking(req.body);
    res.send({ message: 'Booking created.', booking });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error' });
  }
});

app.post('/update', async (req, res) => {
  try {
    const booking = await updateBooking(req.body);
    res.send({
      message: 'Booking updated.',
      booking,
      parseResult: bookingSchema.safeParse(req.body),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Error' });
  }
});

// app.post('/send-payment-link', async (req, res) => {
//   try {
//    const nights = 14;

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card', 'paypal', 'ideal', 'klarna'],
//       mode: 'payment',
//       line_items: generateItemsForPayment({
//         nights,
//         adults: parseInt(req.body.adults),
//         children: parseInt(req.body.children),
//         pets: parseInt(req.body.pets),
//       }),
//       success_url: `${process.env.CLIENT_URL}/success.html`,
//       cancel_url: `${process.env.CLIENT_URL}`,
//     });
//     res.json({ url: session.url });
//   } catch (error) {
//     res.status(500).json({ error: error instanceof Error ? error.message : 'Error' });
//   }
// });

app.listen(process.env.PORT);

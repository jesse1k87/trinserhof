// const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

// const product = await stripe.products.create({
//   id,
//   name: 'Reservation at Hotel Trinserhof',
//   description: `${req.body.checkIn} - ${req.body.checkOut} (${nights} nights, ${adults} x adult, ${children} x child, ${pets} x pet)`,
//   metadata: {
//     nights,
//     adults,
//     children,
//     pets,
//     price,
//   },
// });

// const price = await stripe.prices.create({
//   currency: 'eur',
//   unit_amount: price,
//   product: product.id,
// });

// const paymentLink = await stripe.paymentLinks.create({
//   line_items: [
//     {
//       price: price.id,
//       quantity: 1,
//     },
//   ],
// });

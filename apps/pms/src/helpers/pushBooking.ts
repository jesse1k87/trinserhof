export {};

// import { Booking } from '@trinserhof/types';

// export const pushBooking = async (booking: Booking, onError?: (errors: any) => void) => {
//   try {
//     await fetch('http://127.0.0.1:4000/update', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(booking),
//     })
//       .then(async (res) => (res.ok ? res.json() : res.json().then((json) => Promise.reject(json))))
//       // .then(({ booking }) => console.log(booking))
//       .catch((error) => {
//         console.error(error);
//         if (error.error.issues && onError) {
//           onError(error.error.issues);
//         }
//       });
//   } catch (error) {
//     console.error(error);
//   }
// };

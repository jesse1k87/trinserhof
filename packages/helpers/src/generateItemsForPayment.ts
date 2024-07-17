export const generateItemsForPayment = ({
  nights,
  adults,
  children,
  pets,
}: {
  nights: number;
  adults: number;
  children: number;
  pets: number;
}) => {
  const itemTypes = [
    { type: 'Adult', pricePerNight: pricePerNight['Adult'], amount: adults },
    { type: 'Child', pricePerNight: pricePerNight['Child'], amount: children },
    { type: 'Pet', pricePerNight: pricePerNight['Pet'], amount: pets },
  ];

  return itemTypes
    .map(({ type, pricePerNight, amount }) => {
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${type} x ${nights} nights`,
          },
          unit_amount: pricePerNight,
        },
        quantity: amount * nights,
      };
    })
    .flat();
};

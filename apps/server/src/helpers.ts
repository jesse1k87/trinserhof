type Guest = 'Adult' | 'Child' | 'Pet';

const pricePerNight: Record<Guest, number> = {
  Adult: 7500,
  Child: 4500,
  Pet: 1500,
};

export const getTotalPrice = ({
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
  let price = 0;
  price = price + adults * pricePerNight.Adult * nights;
  price = price + children * pricePerNight.Child * nights;
  price = price + pets * pricePerNight.Pet * nights;
  return price;
};

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

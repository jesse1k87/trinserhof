import * as React from 'react';
import { DatePickerWithRange } from './DatePickerWithRange';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NumberPicker } from './NumberPicker';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Select } from './Select';
import { Textarea } from '@/components/ui/textarea';

const getAmountOfNightsFromDateRange = (dateRange: DateRange | undefined) => {
  if (!dateRange) return 0;

  if (!dateRange.from) return 0;
  if (!dateRange.to) return 0;

  const startMillis = new Date(dateRange.from).getTime();
  const endMillis = new Date(dateRange.to).getTime();
  const millisDifference = endMillis - startMillis;
  const daysDifference = millisDifference / (1000 * 60 * 60 * 24);
  return Math.round(daysDifference);
};

type RoomType = 'SUITE' | 'STANDARD_DOUBLE' | 'BASIC_DOUBLE' | 'SINGLE' | 'FAMILY';

export const App = () => {
  const [price, setPrice] = React.useState<number>(0);

  const rooms: Array<{
    type: RoomType;
    pricePerNight: number;
    label: string;
    description: string;
  }> = [
    {
      type: 'SUITE',
      label: 'Suite',
      pricePerNight: 155,
      description: '1 Doppelbett, 1 oder 2 Badezimmer mit Dusche, Balkon, TV, Gratis Parken',
    },
    {
      type: 'STANDARD_DOUBLE',
      pricePerNight: 135,
      label: 'Standard Doppelzimmer',
      description: '',
    },
    { type: 'BASIC_DOUBLE', pricePerNight: 115, label: 'Basic Doppelzimmer', description: '' },
    { type: 'SINGLE', pricePerNight: 75, label: 'Basic Einzelzimmer', description: '' },
    { type: 'FAMILY', pricePerNight: 0, label: 'Familien Zimmer', description: '' },
  ];

  const defaultNights = 1;
  const [roomType, setRoomType] = React.useState<RoomType>('SUITE');
  const [nights, setNights] = React.useState<number>(defaultNights);
  const [adults, setAdults] = React.useState<number>(0);
  const [children, setChildren] = React.useState<number>(0);
  const [pets, setPets] = React.useState<number>(0);

  React.useEffect(() => {
    const room = rooms.find(({ type }) => type === roomType);
    const pricePets = nights * pets * 15;

    if (!room) return;

    if (roomType === 'FAMILY') {
      const priceAdults = adults * 70;
      const priceChildren = children * 45;
      setPrice(pricePets + (priceAdults + priceChildren) * nights);
      return;
    }

    const amountOfPeople = adults + children;
    const amountOfRooms = Math.ceil(amountOfPeople / 2);
    setPrice(pricePets + amountOfRooms * nights * room.pricePerNight);
  }, [roomType, nights, adults, children, pets]);

  return (
    <div className="flex flex-row py-16 min-h-screen justify-center justify-items-center items-center">
      <div className="grid gap-6 grid-cols-1">
        <div className="flex flex-col justify-center items-center mb-6">
          <img src="./hotel-trinserhof.png" className="w-32" />
        </div>

        <div className="grid items-center justify-items-end gap-4 grid-cols-2">
          <div className="flex w-full">
            <Label htmlFor="email">Your e-mail</Label>
          </div>
          <Input type="email" placeholder="your@email.com" />
        </div>

        <div className="grid items-center justify-items-end gap-4 grid-cols-2">
          <div className="flex w-full">
            <Label htmlFor="email">Room type preference</Label>
          </div>
          <Select
            selected={roomType}
            onChange={(value) => setRoomType(value)}
            options={rooms.map(({ type, label, description }) => {
              return { value: type, label, description };
            })}
          />
        </div>

        <div className="grid items-center justify-items-end gap-4 grid-cols-2">
          <div className="flex w-full flex-col">
            <Label htmlFor="email">Checkin- and checkout-dates</Label>
            <div className="pt-1 text-xs text-gray-500">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </div>
          </div>

          <DatePickerWithRange
            from={new Date()}
            to={addDays(new Date(), defaultNights)}
            onChange={(dateRange) => setNights(getAmountOfNightsFromDateRange(dateRange))}
          />
        </div>

        <NumberPicker
          label="Amount of adults"
          sublabel="Age 13+"
          onChange={(newValue) => setAdults(newValue)}
        />
        <NumberPicker
          label="Amount of children"
          sublabel="Ages 2–12"
          onChange={(newValue) => setChildren(newValue)}
        />
        <NumberPicker label="Amount of pets" onChange={(newValue) => setPets(newValue)} />

        <div className="grid items-center justify-items-end gap-4 grid-cols-2">
          <div className="flex w-full">
            <Label htmlFor="email" className="font-semibold">
              Total price
            </Label>
          </div>
          <div className={`flex flex-col font-semibold text-lg ${price === 0 && 'text-gray-400'}`}>
            {new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(price)}
            <div className="flex justify-end text-xs">Incl. VAT </div>
          </div>
        </div>

        <div className="grid items-center justify-items-end gap-4 mt-2">
          <Textarea
            placeholder="Type anything here you want to ask us or let us know."
            id="message"
            className="w-full"
          />
        </div>

        <div className="flex flex-col justify-end gap-2">
          <Button>Request your stay</Button>
          <div className="flex justify-end text-xs text-gray-500">
            After our confirmation, you will receive a link to complete your payment.
          </div>
        </div>

        <div className="grid gap-1 grid-cols-1">
          <div className="text-m font-bold">About Hotel Trinserhof</div>
          {[
            'Checkin between 16:00 and 22:00 (checkout before 11:00).',
            'Breakfast between 8:00 and 10:00.',
            'Restaurant open from 18:00 to 20:00 (except Mondays)',
            'Lunch available on Saturday and Sunday (12:00-14:00).',
            'Free parking.',
          ].map((line, index) => (
            <div key={index} className="text-sm text-gray-500">
              &bull; {line}
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center items-center mt-6">
          <div className="text-xs font-semibold mt-2">Hotel Trinserhof GmbH</div>
          <div className="text-xs text-gray-500">Trins 106, 6152 Trins, Austria</div>
          <div className="text-xs text-gray-500">hotel@trinserhof.com</div>
          <div className="text-xs text-gray-500">+43 676 4002982</div>
        </div>
      </div>
    </div>
  );
};

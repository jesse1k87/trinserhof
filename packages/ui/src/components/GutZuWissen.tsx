import * as React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@trinserhof/ui';

export const GutZuWissen = () => {
  const lines = [
    'Checkin between 16:00 and 22:00 (checkout before 11:00).',
    'Breakfast between 8 and 10.',
    'Restaurant open between 18 and 20',
    'Bar open between 17 and 22.',
    'Monday "Ruhetag" (restaurant and bar closed)',
    'Free parking.',
  ];

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>Gut zu wissen</AccordionTrigger>
        <AccordionContent>
          {lines.map((line, index) => (
            <div key={index} className="text-sm text-base-content/60 my-1">
              {line}
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

import * as React from 'react';

export const Footer = () => {
  return (
    <div className="flex flex-col gap-1 mt-8 justify-center items-center content-center">
      <div className="text-xs font-semibold">Hotel Trinserhof GmbH</div>
      <div className="text-xs text-gray-500">Trins 106, 6152 Trins, Austria</div>
      <div className="text-xs text-gray-500">hotel@trinserhof.com</div>
      <div className="text-xs text-gray-500">+43 676 4002982</div>
    </div>
  );
};

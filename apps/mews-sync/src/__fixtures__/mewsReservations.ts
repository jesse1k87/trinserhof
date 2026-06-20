import type { MewsReservation } from '../mews';

export const mewsReservationFixture: MewsReservation = {
  Id: '9c3e5b5a-1f2d-4a3b-8b9e-1a2b3c4d5e6f',
  Number: '1001',
  State: 'Confirmed',
  CustomerId: 'a1b2c3d4-e5f6-4a3b-8b9e-1a2b3c4d5e6f',
  AssignedResourceId: 'f6e5d4c3-b2a1-4a3b-8b9e-1a2b3c4d5e6f',
  RequestedCategoryId: '11111111-2222-3333-4444-555555555555',
  StartUtc: '2026-07-01T14:00:00Z',
  EndUtc: '2026-07-05T10:00:00Z',
  CreatedUtc: '2026-06-01T09:30:00Z',
  AdultCount: 2,
  ChildCount: 0,
  Notes: null,
  GroupId: null,
  RateId: '66666666-7777-8888-9999-000000000000',
  VoucherCode: null,
  Origin: 'Mews',
};

export const mewsGetAllReservationsResponseFixture = {
  Reservations: [mewsReservationFixture],
};

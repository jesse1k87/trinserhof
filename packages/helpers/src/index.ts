// export { generateItemsForPayment } from './generateItemsForPayment';
export { bookingsAreDifferent } from './bookingsAreDifferent';
export { calculatePrice } from './calculatePrice';
export {
  cleanupLegacyBookings,
  type CleanupBookingsResult,
  type CleanupReviewFlag,
} from './cleanupLegacyBookings';
export { customersAreDifferent } from './customersAreDifferent';
export { dateToString } from './dateToString';
export {
  extractCustomersFromBookings,
  type CustomerSuggestion,
  type ExtractCustomersResult,
} from './extractCustomersFromBookings';
export { formatCurrency } from './formatCurrency';
export { formatDate } from './formatDate';
export { getAmountOfNightsFromDateRange } from './getAmountOfNightsFromDateRange';
export {
  getBookingValidationErrors,
  REQUIRED_BOOKING_FIELD_TYPES,
} from './getBookingValidationErrors';
export {
  getCustomerValidationErrors,
  REQUIRED_CUSTOMER_FIELD_TYPES,
} from './getCustomerValidationErrors';
export { getNewBooking } from './getNewBooking';
export { getNewCustomer } from './getNewCustomer';
export { getNewProduct } from './getNewProduct';
export { getNewProductCategory } from './getNewProductCategory';
export { getNewRoom } from './getNewRoom';
export {
  getProductCategoryValidationErrors,
  REQUIRED_PRODUCT_CATEGORY_FIELD_TYPES,
} from './getProductCategoryValidationErrors';
export {
  getProductValidationErrors,
  REQUIRED_PRODUCT_FIELD_TYPES,
} from './getProductValidationErrors';
export { getRoomValidationErrors, REQUIRED_ROOM_FIELD_TYPES } from './getRoomValidationErrors';
export { getYYYYmmDD } from './getYYYYmmDD';
export { isValidEmailAddress } from './isValidEmailAddress';
export { makeBookingBackwardsCompatible } from './makeBookingBackwardsCompatible';
export { markPastBookingsCheckedOut, type CheckedOutResult } from './markPastBookingsCheckedOut';
export { mergeLegacyNotes } from './mergeLegacyNotes';
export { productCategoriesAreDifferent } from './productCategoriesAreDifferent';
export { productsAreDifferent } from './productsAreDifferent';
export { removeTimeFromDate } from './removeTimeFromDate';
export { resolveCustomerForEmail } from './resolveCustomerForEmail';
export { roomsAreDifferent } from './roomsAreDifferent';
export { seedRooms, type RoomSeedResult } from './seedRooms';
export {
  stripBookingCustomerData,
  BOOKING_CUSTOMER_FIELDS,
  type StripCustomerDataResult,
  type StripCustomerDataReviewFlag,
} from './stripBookingCustomerData';
export { uuidv4 } from './uuidv4';

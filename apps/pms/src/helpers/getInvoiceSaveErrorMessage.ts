export const getInvoiceSaveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith('Invalid invoice data:')) {
    return `This invoice could not be saved: ${error.message.replace('Invalid invoice data: ', '')}`;
  }
  if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
    return 'This invoice is invalid and could not be saved. Please check all required fields.';
  }
  return 'Something went wrong while saving the invoice.';
};

import { TaxInvoiceData } from '../types';

export const SAMPLE_TAX_INVOICE: TaxInvoiceData = {
  id: 'inv-47',
  invoiceNumber: '47',
  invoiceDate: '11/10/2026',
  isNonGst: true,
  invoiceTitle: 'INVOICE',
  gstin: '',
  originalForRecipient: true,
  customerName: 'Rahul Das',
  customerAddress: 'Goalpara, Assam',
  customerPhone: '98765 43210',
  customerGstin: '',
  placeOfSupply: 'Goalpara (Assam)',
  headerBannerImageUrl: '',
  bottomBannerImageUrl: '',
  items: [
    {
      id: 'item-1',
      name: 'Redmi Note 13 (8GB/128GB)',
      subText: 'IMEI: 867530123456789',
      hsnSac: '8517',
      quantity: 1,
      unit: 'PCS',
      rate: 16999,
      taxableValue: 16999,
      igstPercent: 0,
      igstAmount: 0,
      total: 16999
    }
  ],
  totalQty: 1,
  subtotal: 16999.00,
  discount: 0,
  taxableAmount: 16999.00,
  igstPercent: 0,
  totalTax: 0,
  totalAmountAfterTax: 16999.00,
  totalInWords: 'SIXTEEN THOUSAND NINE HUNDRED NINETY NINE RUPEES ONLY',
  bankDetails: {
    name: 'TECHFIX MOBILE REPAIRING SHOP',
    branch: 'Goalpara',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0001234',
    upiId: 'techfix@okaxis'
  },
  paymentMode: 'UPI (Google Pay / PhonePe / Paytm / Others)',
  verificationUrl: 'techfix.wuaze.com/verify',
  terms: [
    'Please keep this invoice for warranty/service reference.',
    'Warranty is valid only for the specified period as per company policy.',
    'Physical damage, water damage and misuse are not covered under warranty.',
    'Goods once sold will not be taken back.',
    'Delivery by: 3–7 working days (for non-stock items).'
  ],
  authorizedSignatoryName: 'For TECHFIX MOBILE REPAIRING SHOP',
  signaturePosition: 'lower',
  showCustomerSignature: true,
  createdAt: new Date().toISOString()
};

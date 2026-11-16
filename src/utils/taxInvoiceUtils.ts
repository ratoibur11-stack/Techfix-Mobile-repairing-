import { TaxInvoiceData, TaxInvoiceItem, ShopBusinessDetails, CustomerRepairRequest, RepairProposal } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';
import { numberToIndianTaxWords } from './numberToWords';

export function convertRepairRequestToTaxInvoice(
  request?: CustomerRepairRequest | null,
  proposal?: RepairProposal | null,
  businessDetails?: ShopBusinessDetails | null
): TaxInvoiceData {
  const shop = businessDetails || BUSINESS_DETAILS;
  const invNumber = proposal?.proposalNumber 
    ? (proposal.proposalNumber.replace(/[^0-9]/g, '') || '47')
    : (request?.requestId ? (request.requestId.replace(/[^0-9]/g, '') || '47') : '47');

  const rawDate = proposal?.createdAt || request?.createdAt || new Date().toISOString();
  let formattedDate = new Date().toLocaleDateString('en-GB');
  try {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-GB');
    }
  } catch (e) {}

  const customerName = (proposal?.clientName || request?.customerName || 'Rahul Das').trim();
  const customerPhone = (proposal?.clientPhone || request?.contactPhone || '98765 43210').trim();
  const customerAddress = request?.pickupAddress || 'Goalpara, Assam';

  const brand = proposal?.deviceBrand || request?.deviceBrand || 'Smartphone';
  const model = proposal?.deviceModel || request?.deviceModel || '';
  const deviceName = `${brand} ${model}`.trim();
  const cost = proposal?.finalPrice || request?.estimatedCost || 1200;
  const problem = request?.problemDescription || proposal?.problemDescription || 'Display Replacement';

  // Non-GST invoice: cost is direct total (no GST added)
  const rate = cost;
  const total = cost;

  const items: TaxInvoiceItem[] = [
    {
      id: 'item-1',
      name: `Mobile Repairing Service`,
      subText: `(${problem}) - ${deviceName}`,
      hsnSac: '9987',
      quantity: 1,
      unit: 'PCS',
      rate: rate,
      taxableValue: rate,
      igstPercent: 0,
      igstAmount: 0,
      total: total
    }
  ];

  const words = numberToIndianTaxWords(total);

  return {
    id: `inv-${invNumber}`,
    invoiceNumber: invNumber,
    invoiceDate: formattedDate,
    isNonGst: true,
    invoiceTitle: 'INVOICE',
    gstin: '',
    originalForRecipient: true,
    customerName,
    customerPhone,
    customerAddress,
    customerGstin: '',
    placeOfSupply: 'Goalpara (Assam)',
    items,
    totalQty: 1,
    subtotal: total,
    discount: 0,
    taxableAmount: total,
    igstPercent: 0,
    totalTax: 0,
    totalAmountAfterTax: total,
    totalInWords: words,
    bankDetails: {
      name: shop.bankAccountName || shop.name || 'TECHFIX MOBILE REPAIRING SHOP',
      branch: shop.bankBranch || 'Goalpara',
      accountNumber: shop.bankAccountNumber || '50200012345678',
      ifsc: shop.bankIfsc || 'HDFC0001234',
      upiId: shop.upiId || 'techfix@okaxis'
    },
    paymentMode: 'UPI (Google Pay / PhonePe / Paytm / Others)',
    verificationUrl: `${shop.websiteDomain || 'techfix.wuaze.com'}/verify`,
    terms: [
      'Please keep this invoice for warranty/service reference.',
      'Warranty is valid only for the specified period as per company policy.',
      'Physical damage, water damage and misuse are not covered under warranty.',
      'Goods once sold will not be taken back.',
      'Delivery by: 3–7 working days (for non-stock items).'
    ],
    authorizedSignatoryName: `For ${shop.name || 'TECHFIX MOBILE REPAIRING SHOP'}`,
    signaturePosition: 'lower',
    showCustomerSignature: true,
    createdAt: new Date().toISOString()
  };
}

export type RepairStatus = 
  | 'Draft' 
  | 'Sent' 
  | 'Approved' 
  | 'In Progress' 
  | 'IC Level Repair' 
  | 'Quality Testing' 
  | 'Ready for Pickup' 
  | 'Completed' 
  | 'Declined';

export type RepairCategory = 'Hardware' | 'Software' | 'IC-Level' | 'Parts & Accessories' | 'Diagnosis';

export interface RepairItem {
  id: string;
  description: string;
  category: RepairCategory;
  cost: number;
  timeEstimate: string;
  warrantyPeriod: string;
}

export interface TimelineEvent {
  id: string;
  stage: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
  isCurrent?: boolean;
  technicianNote?: string;
}

export interface ClientFeedback {
  id: string;
  clientName: string;
  rating: number; // 1-5
  comment: string;
  submittedAt: string;
  approved: boolean;
  serviceType: string;
  deviceModel: string;
}

export interface RepairProposal {
  id: string;
  proposalNumber: string;
  userId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  deviceBrand: string;
  deviceModel: string;
  imeiOrSerial?: string;
  problemDescription: string;
  diagnosticNotes: string;
  riskAssessment?: string;
  repairItems: RepairItem[];
  subtotal: number;
  discount: number;
  tax: number;
  finalPrice: number;
  advancePaid: number;
  balanceDue: number;
  estimatedCompletionTime: string;
  warrantyDays: number;
  status: RepairStatus;
  timelineEvents: TimelineEvent[];
  clientFeedback?: ClientFeedback;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  clientSignature?: string;
  photoUrl?: string;
  devicePhotos?: string[];
  progressPercent?: number;
  expectedDeliveryDate?: string;
  technicianNote?: string;
}

export interface ShopBusinessDetails {
  name: string;
  tagline: string;
  type: string;
  specialization: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  telegram?: string;
  instagram?: string;
  upiId: string;
  upiQrImage: string;
  upiName: string;
  hours: string;
  websiteDomain?: string;
  logoUrl?: string;
  gstin?: string;
  bankAccountName?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRole?: string;
  technicianPhoto?: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: 'Display' | 'Battery' | 'Charger/Cable' | 'Audio' | 'Protection' | 'Component';
  price: number;
  inStock: boolean;
  description: string;
  image: string;
  compatibleModels: string;
}

export interface PreOwnedPhone {
  id: string;
  brand: string;
  model: string;
  condition: 'Like New (10/10)' | 'Excellent (9/10)' | 'Very Good (8/10)';
  storage: string;
  ram: string;
  color: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  testedDetails: string[];
  image: string;
  images?: string[];
  warranty: string;
}

export interface AIDiagnosisRequest {
  deviceBrand: string;
  deviceModel: string;
  symptoms: string;
}

export interface AIDiagnosisResponse {
  primaryIssue: string;
  recommendedCategory: RepairCategory;
  technicalAnalysis: string;
  proposedLineItems: Array<{
    description: string;
    category: RepairCategory;
    cost: number;
    timeEstimate: string;
    warrantyPeriod: string;
  }>;
  estimatedHours: number;
  estimatedDays: string;
  riskAssessment: string;
  clientSummary: string;
}

export interface BannerConfig {
  mainTitle: string;
  highlightText: string;
  locationBadge: string;
  promoAnnouncement: string;
  servicePromise: string;
  heroImage?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRole?: string;
  technicianPhoto?: string;
}

export interface ShopPhotoItem {
  id: string;
  image: string;
  url?: string;
  title: string;
  category: string;
  description: string;
  highlights: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'ADMIN' | 'CUSTOMER';
  isFirstLogin?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export type CustomerUser = UserProfile;



export interface RepairHistoryEntry {
  id: string;
  timestamp: string;
  stage: string;
  title: string;
  note?: string;
  updatedBy?: string;
}

export interface CustomerRepairRequest {
  id: string;
  requestId: string;
  userId?: string;
  customerName: string;
  contactPhone: string;
  whatsappNumber: string;
  email: string;
  deviceBrand: string;
  deviceModel: string;
  problemDescription: string;
  urgency: 'Standard' | 'Urgent Express';
  preferredDate?: string;
  serviceType?: 'Shop Walk-in' | 'Doorstep Pickup';
  pickupAddress?: string;
  devicePasscode?: string;
  status: 'Pending' | 'Contacted' | 'In Progress' | 'Quality Testing' | 'Ready for Pickup' | 'Completed' | 'Approved' | 'Rejected' | 'Converted to Proposal';
  createdAt: string;
  adminNotes?: string;
  // Live Tracking & Admin Control fields
  progressPercent?: number; // 0 to 100 ("Kitna tak hua")
  expectedDeliveryDate?: string; // "28 Sep 2026, 05:00 PM" ("Kab mobile milega")
  technicianNote?: string; // Live update note visible to customer
  assignedTechnician?: string;
  estimatedCost?: number;
  advancePaid?: number;
  balanceDue?: number;
  warrantyPeriod?: string;
  photoUrl?: string;
  devicePhotos?: string[];
  historyLog?: RepairHistoryEntry[];
}

export interface OldPhoneSellRequest {
  id: string;
  requestId: string;
  userId?: string;
  customerName: string;
  contactPhone: string;
  whatsappNumber?: string;
  email?: string;
  deviceBrand: string;
  deviceModel: string;
  storage: string;
  color?: string;
  condition: 'Like New (10/10)' | 'Good (8-9/10)' | 'Average (6-7/10)' | 'Cracked / Damaged (Screen/Body Fault)';
  isCrackedPhone?: boolean;
  damageType?: string;
  screenStatus?: string;
  expectedPrice: number;
  accessoriesIncluded?: string[];
  photoUrl?: string;
  devicePhotos?: string[];
  notes?: string;
  status: 'Pending' | 'Contacted' | 'Inspected' | 'Price Quoted' | 'Purchased' | 'Rejected';
  createdAt: string;
  adminNotes?: string;
  offeredPriceByAdmin?: number;
}

export interface SectionTheme {
  themeName: string;
  gradientBg: string;
  accentColor: string;
  headerBadgeBg: string;
  cardBorderColor: string;
}

export interface SectionThemesMap {
  proposals: SectionTheme;
  repairForm: SectionTheme;
  phones: SectionTheme;
  sellPhone: SectionTheme;
  accessories: SectionTheme;
  tracker: SectionTheme;
  aistudio: SectionTheme;
  services: SectionTheme;
  photos: SectionTheme;
  feedback: SectionTheme;
}

export interface TaxInvoiceItem {
  id: string;
  name: string;
  subText?: string; // e.g. "IMEI: 867530123456789" or "(Display Replacement)"
  hsnSac: string; // e.g. "8517", "3926", "9987"
  quantity: number;
  unit?: string; // "PCS"
  rate: number;
  taxableValue: number;
  igstPercent: number; // e.g. 18
  igstAmount: number;
  total: number;
}

export interface TaxInvoiceBankDetails {
  name: string;
  branch: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

export interface TaxInvoiceData {
  id: string;
  invoiceNumber: string; // e.g. "47"
  invoiceDate: string; // e.g. "11/10/2026"
  gstin: string; // e.g. "26CORPP9399N1ZA"
  originalForRecipient?: boolean;
  
  // Customer details
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerGstin?: string;
  placeOfSupply: string; // e.g. "Goalpara (24)"
  
  // Line items
  items: TaxInvoiceItem[];
  
  // Summary totals
  totalQty: number;
  taxableAmount: number;
  igstPercent: number; // default 18
  totalTax: number;
  totalAmountAfterTax: number;
  totalInWords: string;
  
  // Bank details
  bankDetails: TaxInvoiceBankDetails;
  paymentMode?: string; // "UPI (Google Pay / PhonePe / Paytm / Others)"
  
  // Non-GST and Custom Header/Bottom Images
  isNonGst?: boolean;
  invoiceTitle?: string; // e.g. "INVOICE", "RETAIL INVOICE", "CASH MEMO"
  headerBannerImageUrl?: string; // Custom header image replacing top header
  bottomBannerImageUrl?: string; // Custom image in bottom-left box
  discount?: number;
  subtotal?: number;

  // Verification
  verificationUrl?: string; // "techfix.wuaze.com/verify"
  
  // Terms & Conditions & Signatures
  terms?: string[];
  authorizedSignatoryName?: string; // e.g. "For TECHFIX MOBILE REPAIRING SHOP"
  signaturePosition?: 'standard' | 'lower' | 'extra-space'; // "thoda niche" support
  digitalSignatureUrl?: string; // Optional digital signature / rubber stamp
  showCustomerSignature?: boolean; // Customer sign option
  
  // Metadata
  createdAt?: string;
}


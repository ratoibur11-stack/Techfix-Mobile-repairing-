import { RepairProposal, AccessoryItem, PreOwnedPhone, ShopBusinessDetails, CustomerRepairRequest, OldPhoneSellRequest } from '../types';

export const BUSINESS_DETAILS: ShopBusinessDetails = {
  name: "TECHFIX MOBILE REPAIRING CENTER",
  tagline: "ALL MOBILE SOLUTIONS UNDER ONE ROOF",
  type: "Professional Mobile Repairing & Accessories Centre",
  specialization: "Android Mobile Hardware, Software & IC-Level Repairing",
  address: "Dubapara Lupta Char, Goalpara, Assam, India",
  phone: "+91 98642 45987",
  email: "ratoibur11@gmail.com",
  whatsapp: "919864245987",
  telegram: "techfix_goalpara",
  instagram: "techfix_goalpara",
  upiId: "9864245987@paytm",
  upiQrImage: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=9864245987@paytm&pn=TECHFIX",
  upiName: "TECHFIX",
  hours: "Mon - Sat: 9:00 AM - 8:30 PM | Sunday: 10:00 AM - 5:00 PM",
  websiteDomain: "sarate.wuaze.com",
  logoUrl: "",
  technicianName: "Toibur Rahman",
  technicianPhone: "+91 98642 45987",
  technicianRole: "Master Mobile Technician & Founder"
};

export const COMMON_BRANDS = [
  'Samsung',
  'Xiaomi',
  'Redmi',
  'Vivo',
  'OPPO',
  'Realme',
  'OnePlus',
  'Apple',
  'Poco',
  'Tecno',
  'Infinix',
  'Motorola',
  'Google Pixel'
];

export const INITIAL_PROPOSALS: RepairProposal[] = [
  {
    id: "prop-101",
    proposalNumber: "TECH-8842",
    clientName: "Rahul Das",
    clientPhone: "+91 98765 43210",
    clientEmail: "rahul.das@example.com",
    deviceBrand: "Samsung",
    deviceModel: "Galaxy M31",
    imeiOrSerial: "358921004928172",
    problemDescription: "Phone fell into water. Screen flickers, battery draining extremely fast, and charging port heats up during plugin.",
    diagnosticNotes: "Water ingress detected around charging board and main IC section. Power IC output voltage fluctuating. LCD backlight trace damaged.",
    riskAssessment: "Moderate IC level complexity. Motherboard ultrasonic cleaning required before component reballing.",
    repairItems: [
      {
        id: "item-1",
        description: "Motherboard De-oxidation & Ultrasonic Water Damage Cleaning",
        category: "Hardware",
        cost: 450,
        timeEstimate: "1 Hour",
        warrantyPeriod: "30 Days"
      },
      {
        id: "item-2",
        description: "Power IC (PMIC) Diagnostics & Component Level Repair",
        category: "IC-Level",
        cost: 1200,
        timeEstimate: "2 Hours",
        warrantyPeriod: "90 Days"
      },
      {
        id: "item-3",
        description: "Original AMOLED Display Assembly Replacement with Touch",
        category: "Hardware",
        cost: 2200,
        timeEstimate: "45 Mins",
        warrantyPeriod: "180 Days"
      },
      {
        id: "item-4",
        description: "Type-C Charging Sub-Board & Connector Replacement",
        category: "Parts & Accessories",
        cost: 350,
        timeEstimate: "30 Mins",
        warrantyPeriod: "90 Days"
      }
    ],
    subtotal: 4200,
    discount: 300,
    tax: 0,
    finalPrice: 3900,
    advancePaid: 1000,
    balanceDue: 2900,
    estimatedCompletionTime: "Same Day (5:00 PM)",
    warrantyDays: 90,
    status: "In Progress",
    createdAt: "2026-07-30 10:30 AM",
    updatedAt: "2026-07-30 02:15 PM",
    approvedAt: "2026-07-30 11:15 AM",
    clientSignature: "R. Das",
    timelineEvents: [
      {
        id: "tl-1",
        stage: "Intake & Diagnosis",
        title: "Device Received & Diagnosed",
        description: "Physical inspection and motherboard testing completed by Senior Technician.",
        timestamp: "10:30 AM",
        completed: true,
        technicianNote: "Water indicator pink. Ultrasonic bath scheduled."
      },
      {
        id: "tl-2",
        stage: "Proposal Approval",
        title: "Client Approved Estimate",
        description: "Proposal TECH-8842 accepted with 90-day warranty terms.",
        timestamp: "11:15 AM",
        completed: true
      },
      {
        id: "tl-3",
        stage: "Hardware & IC Repair",
        title: "IC Level Repair & Board Cleaning",
        description: "Power IC reballing & charging flex replacement currently under microscopic soldering.",
        timestamp: "02:00 PM",
        completed: true,
        isCurrent: true,
        technicianNote: "Power rail stabilized at 3.8V. Next step: AMOLED fitting."
      },
      {
        id: "tl-4",
        stage: "Quality Testing",
        title: "Multi-point Quality QC Test",
        description: "Display calibration, touch response, charging speed & signal strength checks.",
        timestamp: "Pending",
        completed: false
      },
      {
        id: "tl-5",
        stage: "Ready for Pickup",
        title: "Ready at Shop",
        description: "Final cleaning, warranty sticker application, and customer invoice ready.",
        timestamp: "Pending",
        completed: false
      }
    ],
    clientFeedback: {
      id: "fb-1",
      clientName: "Rahul Das",
      rating: 5,
      comment: "Very prompt explanation by technician. Glad they showed me the IC issue under microscope before starting repair!",
      submittedAt: "2026-07-30 11:20 AM",
      approved: true,
      serviceType: "Water Damage & IC Repair",
      deviceModel: "Samsung Galaxy M31"
    }
  },
  {
    id: "prop-102",
    proposalNumber: "TECH-8843",
    clientName: "Anwar Hussain",
    clientPhone: "+91 94350 12345",
    clientEmail: "anwar.h@gmail.com",
    deviceBrand: "Redmi",
    deviceModel: "Note 10 Pro",
    imeiOrSerial: "867123049182391",
    problemDescription: "Phone stuck on Mi Logo bootloop after system software update. Will not enter home screen.",
    diagnosticNotes: "Software crash / partition corrupted during OTA update. Hardware test passed. CPU & EMMC ICs healthy.",
    repairItems: [
      {
        id: "item-201",
        description: "Official Firmware Flashing & Boot Partition Repair",
        category: "Software",
        cost: 500,
        timeEstimate: "1 Hour",
        warrantyPeriod: "30 Days"
      },
      {
        id: "item-202",
        description: "System Crash Recovery & Performance Calibration",
        category: "Software",
        cost: 250,
        timeEstimate: "30 Mins",
        warrantyPeriod: "30 Days"
      }
    ],
    subtotal: 750,
    discount: 100,
    tax: 0,
    finalPrice: 650,
    advancePaid: 200,
    balanceDue: 450,
    estimatedCompletionTime: "2 Hours",
    warrantyDays: 30,
    status: "Approved",
    createdAt: "2026-07-30 01:00 PM",
    updatedAt: "2026-07-30 01:30 PM",
    approvedAt: "2026-07-30 01:30 PM",
    timelineEvents: [
      {
        id: "tl-201",
        stage: "Intake & Diagnosis",
        title: "Software Diagnostics Complete",
        description: "Stuck on boot logo. Official fastboot recovery selected to preserve user data if possible.",
        timestamp: "01:00 PM",
        completed: true
      },
      {
        id: "tl-202",
        stage: "Proposal Approval",
        title: "Proposal Approved",
        description: "Client approved software recovery estimate of ₹650.",
        timestamp: "01:30 PM",
        completed: true,
        isCurrent: true
      },
      {
        id: "tl-203",
        stage: "Software Service",
        title: "Official Firmware Installation",
        description: "Flashing latest Miui build via official service box.",
        timestamp: "Pending",
        completed: false
      },
      {
        id: "tl-204",
        stage: "Quality Testing",
        title: "Network & Call Test",
        description: "IMEI verification and connectivity testing.",
        timestamp: "Pending",
        completed: false
      },
      {
        id: "tl-205",
        stage: "Ready for Pickup",
        title: "Ready for Delivery",
        description: "Customer notified for pickup at Dubapara shop.",
        timestamp: "Pending",
        completed: false
      }
    ]
  },
  {
    id: "prop-103",
    proposalNumber: "TECH-8844",
    clientName: "Priya Saikia",
    clientPhone: "+91 88110 99887",
    deviceBrand: "OnePlus",
    deviceModel: "Nord CE 2",
    problemDescription: "No sound from speaker during calls or music. Mic also not catching voice clearly.",
    diagnosticNotes: "Audio IC joint cold solder defect + dust accumulation in lower speaker mesh.",
    repairItems: [
      {
        id: "item-301",
        description: "Audio IC Reballing & Micro-Soldering Repair",
        category: "IC-Level",
        cost: 1400,
        timeEstimate: "2.5 Hours",
        warrantyPeriod: "90 Days"
      },
      {
        id: "item-302",
        description: "Loudspeaker & Microphone Module Replacement",
        category: "Hardware",
        cost: 450,
        timeEstimate: "30 Mins",
        warrantyPeriod: "90 Days"
      }
    ],
    subtotal: 1850,
    discount: 150,
    tax: 0,
    finalPrice: 1700,
    advancePaid: 500,
    balanceDue: 1200,
    estimatedCompletionTime: "Tomorrow 12:00 PM",
    warrantyDays: 90,
    status: "Sent",
    createdAt: "2026-07-30 03:00 PM",
    updatedAt: "2026-07-30 03:15 PM",
    timelineEvents: [
      {
        id: "tl-301",
        stage: "Intake & Diagnosis",
        title: "Audio Diagnostics Complete",
        description: "Audio codec IC output trace dead. Reballing required.",
        timestamp: "03:00 PM",
        completed: true
      },
      {
        id: "tl-302",
        stage: "Proposal Approval",
        title: "Proposal Sent to Client",
        description: "Awaiting client confirmation via WhatsApp / Portal.",
        timestamp: "03:15 PM",
        completed: false,
        isCurrent: true
      }
    ]
  }
];

export const REPAIR_SERVICES = [
  {
    title: "Mobile Hardware Repairing",
    icon: "Smartphone",
    badge: "A to Z Hardware",
    description: "Complete physical component repair, screen replacements, and module fixes for all Android brands.",
    items: [
      "Display / LCD Assembly Replacement",
      "Touch Screen Glass Repair",
      "Charging Connector & Board Replacement",
      "High Capacity Battery Replacement",
      "Power Button & Switch Replacement",
      "Mic, Speaker & Audio Jack Repair",
      "Camera & Glass Lens Replacement",
      "Vibration Motor & Backlight Repair",
      "Water-Damaged Mobile De-oxidation",
      "SIM Slot & Memory Card Section Repair"
    ]
  },
  {
    title: "Software Repairing & Flashing",
    icon: "Cpu",
    badge: "Official Firmware",
    description: "Expert software diagnosis, official firmware flashing, bootloop fixes, and performance optimization.",
    items: [
      "Official Firmware Flashing & OS Installation",
      "Hang / Stuck on Logo Fix",
      "Bootloop & Auto-Restart Troubleshooting",
      "System Crash & Error Code Diagnostics",
      "Software Update & Security Patching",
      "Pattern / PIN / Password Recovery Assistance",
      "App Crash & Network Software Fixes",
      "Speed & Storage Performance Optimization"
    ]
  },
  {
    title: "IC & Motherboard-Level Repairing",
    icon: "CircuitBoard",
    badge: "Micro-Soldering",
    description: "Precision component-level and IC repair under microscope for complex non-powering or shorted mobiles.",
    items: [
      "Charging IC (SMB / BQ) Repair & Reballing",
      "Power IC (PMIC) Fault Finding & Replacement",
      "Audio IC Codec Micro-Soldering",
      "Network & RF IC Section Repair",
      "Motherboard Short-Circuit Diagnosis",
      "Dead Mobile No-Power Troubleshooting",
      "Backlight & Display Driver IC Fix",
      "Component-Level Capacitor & Resistor Soldering"
    ]
  },
  {
    title: "Mobile Parts & Genuine Accessories",
    icon: "ShoppingBag",
    badge: "In-Stock Store",
    description: "Quality tested spare parts, chargers, protection, and audio accessories at fair shop prices.",
    items: [
      "Original AMOLED & IPS Displays",
      "High Capacity Tested Batteries",
      "Fast Charging Adapters & USB Cables",
      "Stereo Earphones & Wireless Speakers",
      "9H Tempered Glass & Matte Screen Guards",
      "Shockproof Covers & Armor Cases",
      "Repairing Flex, Cables & Modules"
    ]
  }
];

export const ACCESSORIES_CATALOG: AccessoryItem[] = [
  {
    id: "acc-1",
    name: "Fast Charging 20W Type-C Adapter",
    category: "Charger/Cable",
    price: 399,
    inStock: true,
    description: "Over-voltage protected fast charger for Samsung, Redmi, Vivo, RealMe.",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80",
    compatibleModels: "Universal Type-C Devices"
  },
  {
    id: "acc-2",
    name: "Braided Nylon 65W Fast Data Cable (1.2m)",
    category: "Charger/Cable",
    price: 199,
    inStock: true,
    description: "Heavy duty copper core with reinforced connector joints.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    compatibleModels: "Type-C / Micro USB"
  },
  {
    id: "acc-3",
    name: "Original 5000mAh Battery (Redmi Note 9/10)",
    category: "Battery",
    price: 750,
    inStock: true,
    description: "High cycle life replacement battery with 6 months warranty.",
    image: "https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80",
    compatibleModels: "Redmi Note 9 / Note 10 Series"
  },
  {
    id: "acc-4",
    name: "Original AMOLED Display (Samsung M31 / F41)",
    category: "Display",
    price: 2200,
    inStock: true,
    description: "100% genuine AMOLED assembly with high brightness and responsive touch.",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
    compatibleModels: "Samsung Galaxy M31, F41, M30s"
  },
  {
    id: "acc-5",
    name: "Deep Bass In-Ear Wired Earphones (3.5mm)",
    category: "Audio",
    price: 249,
    inStock: true,
    description: "Noise isolating ear tips with in-line microphone for clear calls.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    compatibleModels: "Universal 3.5mm Jack"
  },
  {
    id: "acc-6",
    name: "9H UV Curved Tempered Glass",
    category: "Protection",
    price: 149,
    inStock: true,
    description: "Edge-to-edge liquid glue scratch resistant screen guard.",
    image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80",
    compatibleModels: "All Curved Screen Android Phones"
  }
];

export const PRE_OWNED_PHONES: PreOwnedPhone[] = [
  {
    id: "phone-1",
    brand: "Samsung",
    model: "Galaxy A52s 5G",
    condition: "Excellent (9/10)",
    storage: "128 GB",
    ram: "8 GB",
    color: "Awesome Mint",
    price: 11999,
    originalPrice: 28999,
    inStock: true,
    testedDetails: [
      "120Hz Super AMOLED Screen tested",
      "Snapdragon 778G 5G Processor smooth",
      "Camera & OIS tested sharp",
      "Battery health 88% verified",
      "Original charger included"
    ],
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80", // Front View
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=800&q=80", // Back View
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80", // Side Edge
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80"  // Camera Close-up
    ],
    warranty: "3 Months TECHFIX Shop Warranty"
  },
  {
    id: "phone-2",
    brand: "Redmi",
    model: "Note 11 Pro+ 5G",
    condition: "Like New (10/10)",
    storage: "128 GB",
    ram: "6 GB",
    color: "Stealth Black",
    price: 9499,
    originalPrice: 20999,
    inStock: true,
    testedDetails: [
      "108 MP Pro Main Camera tested",
      "67W Turbo Charger included",
      "Dual Stereo Speakers clear",
      "No scratch on glass or body",
      "100% Functionality certified"
    ],
    image: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80", // Front View
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80", // Back View
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80", // Side Profile
      "https://images.unsplash.com/photo-1574944985070-8f3297426535?auto=format&fit=crop&w=800&q=80"  // Camera View
    ],
    warranty: "3 Months TECHFIX Shop Warranty"
  },
  {
    id: "phone-3",
    brand: "Realme",
    model: "Realme 9 Pro 5G",
    condition: "Very Good (8/10)",
    storage: "128 GB",
    ram: "6 GB",
    color: "Sunrise Blue",
    price: 7999,
    originalPrice: 17999,
    inStock: true,
    testedDetails: [
      "5000 mAh battery strong standby",
      "Display touch responsiveness 100%",
      "Fingerprint sensor fast unlock",
      "Clean IMEI & bill verified"
    ],
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80", // Front View
      "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=800&q=80", // Back View
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80", // Side View
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80"  // Screen View
    ],
    warranty: "1 Month TECHFIX Shop Warranty"
  }
];

export const INITIAL_BANNER_CONFIG = {
  mainTitle: "TECHFIX MOBILE REPAIRING CENTER",
  highlightText: "MOBILE REPAIRING CENTER",
  locationBadge: "Goalpara, Assam • Android A to Z Hardware, Software & IC Repairing",
  promoAnnouncement: "🎉 Limited Period Offer: Free Pre-Repair Diagnostics & 10% Discount on AMOLED Display & Battery Replacements!",
  servicePromise: "ALL MOBILE SOLUTIONS UNDER ONE ROOF",
  heroImage: "/images/technician_mobile_repair.jpg",
  primaryCtaText: "Create Repair Proposal",
  secondaryCtaText: "Track Repair Status"
};

export const INITIAL_SHOP_PHOTOS = [
  {
    id: "photo-1",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    title: "TECHFIX Storefront & Entrance",
    category: "Shop Exterior",
    description: "Our main mobile repair centre in Dubapara Lupta Char, Goalpara. Illuminated display cases featuring genuine spare parts and accessories.",
    highlights: ["Glass Accessory Display", "Goalpara Central Location", "Clean & Secure Shop Environment"]
  },
  {
    id: "photo-2",
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    title: "Micro-Soldering & IC Repair Workshop",
    category: "Precision Laboratory",
    description: "State-of-the-art technician workbench equipped with digital microscopes, hot-air rework stations, multi-meters, and IC reballing stencils.",
    highlights: ["Digital Microscope Inspection", "Charging & Power IC Repair", "Motherboard Short-Circuit Diagnosis"]
  },
  {
    id: "photo-3",
    image: "https://images.unsplash.com/photo-1556742049-0a67e8a32379?auto=format&fit=crop&w=800&q=80",
    url: "https://images.unsplash.com/photo-1556742049-0a67e8a32379?auto=format&fit=crop&w=800&q=80",
    title: "Customer Service & Phone Display Counter",
    category: "Client Experience",
    description: "Customer consultation counter where our technician explains pre-repair diagnostic findings, provides printed proposals, and demonstrates tested devices.",
    highlights: ["Pre-Repair Diagnostic Explanation", "Tested Second-Hand Phone Display", "WhatsApp Estimate Consultation"]
  }
];



export const INITIAL_REPAIR_REQUESTS: CustomerRepairRequest[] = [
  {
    id: "req-101",
    requestId: "TF-REQ-8821",
    customerName: "Rofiqul Islam",
    contactPhone: "+91 98642 98765",
    whatsappNumber: "919864298765",
    email: "rofiqul.goalpara@gmail.com",
    deviceBrand: "Samsung",
    deviceModel: "Galaxy M31s",
    problemDescription: "Display glass cracked after accident. Touch is working partially but screen flickering.",
    urgency: "Urgent Express",
    preferredDate: "Today / Tomorrow",
    serviceType: "Shop Walk-in",
    status: "In Progress",
    progressPercent: 65,
    expectedDeliveryDate: "27 Sep 2026, 05:30 PM",
    technicianNote: "Original Super AMOLED screen fitted. Glue curing under UV light for 2 hours before final touch testing.",
    assignedTechnician: "Toibur Rahman (Master Tech)",
    estimatedCost: 2200,
    advancePaid: 500,
    balanceDue: 1700,
    warrantyPeriod: "90 Days Warranty on Replaced Screen",
    createdAt: "2026-09-26 10:15 AM",
    adminNotes: "Client requested genuine AMOLED screen. Advance ₹500 paid via UPI.",
    historyLog: [
      { id: "h1", timestamp: "26 Sep 10:15 AM", stage: "Submitted", title: "Online Repair Application Received", note: "Customer submitted broken screen request with Urgent Express priority." },
      { id: "h2", timestamp: "26 Sep 11:00 AM", stage: "Received", title: "Device Handed Over at Goalpara Lab", note: "Samsung M31s received at shop. Internal frame checked, no motherboard bend." },
      { id: "h3", timestamp: "26 Sep 01:30 PM", stage: "In Progress", title: "Original OLED Display Installation", note: "Old shattered panel disassembled. New original display pasted with precision adhesive." }
    ]
  },
  {
    id: "req-102",
    requestId: "TF-REQ-8822",
    customerName: "Anwar Hussain",
    contactPhone: "+91 91012 34567",
    whatsappNumber: "919101234567",
    email: "anwar.h@gmail.com",
    deviceBrand: "Realme",
    deviceModel: "Realme 8 Pro",
    problemDescription: "Phone not charging. Charging port feeling loose and slow charging indicator.",
    urgency: "Standard",
    preferredDate: "27 Sep 2026",
    serviceType: "Shop Walk-in",
    status: "Ready for Pickup",
    progressPercent: 95,
    expectedDeliveryDate: "Ready for Pickup Today (Goalpara Shop)",
    technicianNote: "Dart 65W charging sub-board replaced. Tested 0% to 100% fast charging with SuperDart meter. Device ready for pickup!",
    assignedTechnician: "Toibur Rahman",
    estimatedCost: 650,
    advancePaid: 200,
    balanceDue: 450,
    warrantyPeriod: "60 Days Parts Warranty",
    createdAt: "2026-09-25 04:45 PM",
    adminNotes: "Sub-board replaced. Fast charging tested successfully.",
    historyLog: [
      { id: "h1", timestamp: "25 Sep 04:45 PM", stage: "Submitted", title: "Online Repair Application", note: "Loose charging port reported." },
      { id: "h2", timestamp: "26 Sep 10:30 AM", stage: "Inspection", title: "Charging IC & Pin Diagnostic", note: "Sub-board pin burnt due to dust accumulation." },
      { id: "h3", timestamp: "26 Sep 02:00 PM", stage: "Ready", title: "QC Testing Passed & Ready for Pickup", note: "Fast charging current stable at 65W. Customer notified via WhatsApp." }
    ]
  },
  {
    id: "req-103",
    requestId: "TF-REQ-8823",
    customerName: "Shop Owner (Test Customer)",
    contactPhone: "+91 98642 11000",
    whatsappNumber: "919864211000",
    email: "ratoibur11@gmail.com",
    deviceBrand: "Apple",
    deviceModel: "iPhone 13 Pro",
    problemDescription: "Battery draining quickly and phone heating up during fast charging.",
    urgency: "Urgent Express",
    preferredDate: "27 Sep 2026",
    serviceType: "Doorstep Pickup",
    pickupAddress: "Main Market, Dubapara Lupta Char, Goalpara",
    status: "Quality Testing",
    progressPercent: 80,
    expectedDeliveryDate: "27 Sep 2026, 06:00 PM",
    technicianNote: "Genuine High-Capacity battery replaced with Apple BMS health programming. Currently undergoing 30-minute stress drain test.",
    assignedTechnician: "Master Tech Toibur",
    estimatedCost: 3200,
    advancePaid: 1000,
    balanceDue: 2200,
    warrantyPeriod: "6 Months Battery Health Guarantee",
    createdAt: "2026-09-26 11:30 AM",
    adminNotes: "Pickup scheduled at Dubapara. 100% original battery cell fitted.",
    historyLog: [
      { id: "h1", timestamp: "26 Sep 11:30 AM", stage: "Submitted", title: "Doorstep Pickup Request Booked", note: "Battery replacement requested for iPhone 13 Pro." },
      { id: "h2", timestamp: "26 Sep 12:15 PM", stage: "Received", title: "Picked Up from Customer Address", note: "Battery health was 72% with service notification." },
      { id: "h3", timestamp: "26 Sep 02:45 PM", stage: "Quality Testing", title: "Battery Cycle & Current Stress Test", note: "100% capacity showing in iOS settings. Thermal test normal under 36°C." }
    ]
  }
];

export const INITIAL_SELL_REQUESTS: OldPhoneSellRequest[] = [
  {
    id: "sell-201",
    requestId: "SELL-2026-901",
    customerName: "Rahul Kalita",
    contactPhone: "+91 98640 12345",
    whatsappNumber: "919864012345",
    email: "rahul.k@gmail.com",
    deviceBrand: "OnePlus",
    deviceModel: "OnePlus 9R 5G",
    storage: "128GB",
    color: "Lake Blue",
    condition: "Good (8-9/10)",
    expectedPrice: 16500,
    accessoriesIncluded: ["Original Box", "65W Warp Charger", "Invoice/Bill"],
    notes: "Minor back glass scuff, screen is 100% clean with guard. Battery holds 1 full day.",
    status: "Pending",
    createdAt: "2026-08-03 11:30 AM",
    adminNotes: "Customer open for inspection today afternoon."
  },
  {
    id: "sell-202",
    requestId: "SELL-2026-902",
    customerName: "Jahidul Islam",
    contactPhone: "+91 91018 76543",
    whatsappNumber: "919101876543",
    email: "jahidul.goalpara@gmail.com",
    deviceBrand: "Apple",
    deviceModel: "iPhone 11",
    storage: "64GB",
    color: "Black",
    condition: "Like New (10/10)",
    expectedPrice: 18000,
    accessoriesIncluded: ["Original Box", "Cable"],
    notes: "Battery health 85%. FaceID working perfectly.",
    status: "Contacted",
    createdAt: "2026-08-02 05:20 PM",
    adminNotes: "Offered ₹16,500 over WhatsApp call."
  }
];

export const INITIAL_SECTION_THEMES = {
  proposals: {
    themeName: 'Deep Blue Sapphire',
    gradientBg: 'from-slate-950 via-blue-950 to-indigo-950',
    accentColor: 'blue',
    headerBadgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    cardBorderColor: 'border-blue-900/40'
  },
  repairForm: {
    themeName: 'Neon Purple Amethyst',
    gradientBg: 'from-slate-950 via-purple-950 to-violet-950',
    accentColor: 'purple',
    headerBadgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    cardBorderColor: 'border-purple-900/40'
  },
  phones: {
    themeName: 'Emerald Mint',
    gradientBg: 'from-slate-950 via-emerald-950 to-teal-950',
    accentColor: 'emerald',
    headerBadgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    cardBorderColor: 'border-emerald-900/40'
  },
  sellPhone: {
    themeName: 'Gold Cash Green',
    gradientBg: 'from-slate-950 via-green-950 to-emerald-950',
    accentColor: 'green',
    headerBadgeBg: 'bg-green-500/20 text-green-300 border-green-500/30',
    cardBorderColor: 'border-green-900/40'
  },
  accessories: {
    themeName: 'Warm Amber Topaz',
    gradientBg: 'from-slate-950 via-amber-950 to-yellow-950',
    accentColor: 'amber',
    headerBadgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    cardBorderColor: 'border-amber-900/40'
  },
  tracker: {
    themeName: 'Cyber Cyan Laser',
    gradientBg: 'from-slate-950 via-cyan-950 to-blue-950',
    accentColor: 'cyan',
    headerBadgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    cardBorderColor: 'border-cyan-900/40'
  },
  aistudio: {
    themeName: 'Galactic Fuchsia AI',
    gradientBg: 'from-slate-950 via-fuchsia-950 to-purple-950',
    accentColor: 'fuchsia',
    headerBadgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    cardBorderColor: 'border-fuchsia-900/40'
  },
  services: {
    themeName: 'Royal Indigo Slate',
    gradientBg: 'from-slate-950 via-indigo-950 to-slate-950',
    accentColor: 'indigo',
    headerBadgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    cardBorderColor: 'border-indigo-900/40'
  },
  photos: {
    themeName: 'Ocean Sky Blue',
    gradientBg: 'from-slate-950 via-sky-950 to-cyan-950',
    accentColor: 'sky',
    headerBadgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    cardBorderColor: 'border-sky-900/40'
  },
  feedback: {
    themeName: 'Velvet Rose Ruby',
    gradientBg: 'from-slate-950 via-rose-950 to-pink-950',
    accentColor: 'rose',
    headerBadgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    cardBorderColor: 'border-rose-900/40'
  }
};


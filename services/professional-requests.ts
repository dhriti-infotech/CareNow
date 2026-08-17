export interface ServiceRequest {
  id: string;
  serviceType: string;
  patientName: string;
  distance: string;
  requestedAt: string;
  offeredPrice: number;
  priority: "NORMAL" | "URGENT";
}

export interface PrescriptionOrder {
  id: string;
  patientName: string;
  medicineCount: number;
  distance: string;
  requestedAt: string;
  estimatedAmount: number;
  prescriptionStatus: "UPLOADED";
}

/**
 * Sample requests for Nurse / Health Worker
 */
export const developmentServiceRequests: ServiceRequest[] = [
  {
    id: "REQ-1001",
    serviceType: "Injection at Home",
    patientName: "Raj Kumar",
    distance: "1.2 km",
    requestedAt: "2 min ago",
    offeredPrice: 250,
    priority: "NORMAL",
  },
  {
    id: "REQ-1002",
    serviceType: "Wound Dressing",
    patientName: "Lakshmi Devi",
    distance: "2.4 km",
    requestedAt: "5 min ago",
    offeredPrice: 350,
    priority: "URGENT",
  },
  {
    id: "REQ-1003",
    serviceType: "BP & Sugar Check",
    patientName: "Mohan Singh",
    distance: "3.1 km",
    requestedAt: "8 min ago",
    offeredPrice: 200,
    priority: "NORMAL",
  },
];

/**
 * Sample prescription orders for Pharmacist
 */
export const developmentPrescriptionOrders: PrescriptionOrder[] = [
  {
    id: "ORD-2001",
    patientName: "Anil Kumar",
    medicineCount: 4,
    distance: "1.4 km",
    requestedAt: "2 min ago",
    estimatedAmount: 485,
    prescriptionStatus: "UPLOADED",
  },
  {
    id: "ORD-2002",
    patientName: "Priya Devi",
    medicineCount: 3,
    distance: "2.1 km",
    requestedAt: "6 min ago",
    estimatedAmount: 325,
    prescriptionStatus: "UPLOADED",
  },
  {
    id: "ORD-2003",
    patientName: "Ravi Sharma",
    medicineCount: 5,
    distance: "3.2 km",
    requestedAt: "11 min ago",
    estimatedAmount: 720,
    prescriptionStatus: "UPLOADED",
  },
];
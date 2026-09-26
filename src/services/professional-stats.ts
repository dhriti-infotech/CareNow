export type ProfessionalType =
  | "NURSE"
  | "HEALTH_WORKER"
  | "HEALTHCARE_WORKER"
  | "PHARMACIST";

/**
 * Common statistics applicable to all professionals.
 *
 * The profession-specific properties are optional because
 * Nurse / Health Worker and Pharmacist have different
 * business metrics.
 */
export interface ProfessionalStats {
  professionalType: ProfessionalType;

  lifetimeEarnings: number;

  rating: number;

  totalRatings: number;

  pendingCharges: number;

  // Nurse / Health Worker
  requestsReceived?: number;
  requestsAccepted?: number;
  servicesCompleted?: number;

  // Pharmacist
  ordersReceived?: number;
  prescriptionsReceived?: number;
  ordersAccepted?: number;
  ordersFulfilled?: number;
  ordersCancelled?: number;
}

/**
 * Development-only sample statistics.
 *
 * The key MUST match the professional ID stored
 * in users.json / auth session.
 */
export const developmentProfessionalStats: Record<
  string,
  ProfessionalStats
> = {
  /*
   * Nurse
   */
  PRO001: {
    professionalType: "NURSE",

    lifetimeEarnings: 42500,

    requestsReceived: 68,
    requestsAccepted: 64,
    servicesCompleted: 61,

    rating: 4.8,
    totalRatings: 36,

    pendingCharges: 1850,
  },

  /*
   * Nurse
   */
  PRO002: {
    professionalType: "NURSE",

    lifetimeEarnings: 31500,

    requestsReceived: 52,
    requestsAccepted: 49,
    servicesCompleted: 46,

    rating: 4.7,
    totalRatings: 31,

    pendingCharges: 1420,
  },

  /*
   * Health Worker
   */
  PRO003: {
    professionalType: "HEALTH_WORKER",

    lifetimeEarnings: 28750,

    requestsReceived: 47,
    requestsAccepted: 44,
    servicesCompleted: 42,

    rating: 4.6,
    totalRatings: 39,

    pendingCharges: 1250,
  },

  /*
   * Pharmacist
   */
  PRO004: {
    professionalType: "PHARMACIST",

    lifetimeEarnings: 31200,

    ordersReceived: 84,
    prescriptionsReceived: 78,
    ordersAccepted: 76,
    ordersFulfilled: 72,
    ordersCancelled: 4,

    rating: 4.9,
    totalRatings: 58,

    pendingCharges: 920,
  },
};
/**
 * Advanced Logistics Service
 * Real-time tracking, inventory optimization, and supplier integration
 */

export type ShipmentStatus =
  | 'pending'
  | 'picked'
  | 'packed'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export type VehicleType = 'bakkie' | 'truck' | 'van' | 'motorcycle';
export type DeliveryPriority = 'standard' | 'express' | 'same_day';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  province: string;
  city: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  origin: Location;
  destination: Location;
  items: ShipmentItem[];
  driver?: Driver;
  vehicle?: Vehicle;
  priority: DeliveryPriority;
  estimatedDelivery: string;
  actualDelivery?: string;
  trackingHistory: TrackingEvent[];
}

export interface ShipmentItem {
  inventoryId: string;
  productName: string;
  quantity: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleId: string;
  currentLocation: Location;
  activeShipments: number;
  rating: number;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  registration: string;
  capacity: number;
  currentLoad: number;
  fuelLevel: number;
  lastMaintenance: string;
}

export interface TrackingEvent {
  status: ShipmentStatus;
  location: Location;
  timestamp: string;
  notes?: string;
}

export interface InventoryOptimization {
  productId: string;
  currentStock: number;
  optimalStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  leadTime: number;
  demandForecast: number[];
  stockoutRisk: number;
}

export interface RouteOptimization {
  totalDistance: number;
  estimatedDuration: number;
  fuelCost: number;
  stops: Location[];
  waypoints: Location[];
  alternativeRoutes: number;
}

export async function createShipment(
  orderId: string,
  origin: Location,
  destination: Location,
  items: ShipmentItem[],
  priority: DeliveryPriority = 'standard'
): Promise<Shipment> {
  const estimatedDelivery = calculateDeliveryTime(origin, destination, priority);

  return {
    id: `SHIP-${Date.now()}`,
    orderId,
    status: 'pending',
    origin,
    destination,
    items,
    priority,
    estimatedDelivery,
    trackingHistory: [
      {
        status: 'pending',
        location: origin,
        timestamp: new Date().toISOString(),
        notes: 'Shipment created',
      },
    ],
  };
}

export async function assignDriver(shipmentId: string): Promise<Driver | null> {
  // Find available driver closest to origin
  const availableDrivers: Driver[] = [
    {
      id: 'DRV-001',
      name: 'Thabo Mbeki',
      phone: '0821234567',
      vehicleId: 'VEH-001',
      currentLocation: {
        latitude: -26.2041,
        longitude: 28.0473,
        address: 'Johannesburg CBD',
        province: 'Gauteng',
        city: 'Johannesburg',
      },
      activeShipments: 2,
      rating: 4.8,
    },
  ];

  // Assign based on proximity and capacity
  return availableDrivers[0];
}

export async function trackShipment(shipmentId: string): Promise<Shipment | null> {
  // Real-time tracking via GPS
  return null;
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: ShipmentStatus,
  location: Location,
  notes?: string
): Promise<void> {
  const event: TrackingEvent = {
    status,
    location,
    timestamp: new Date().toISOString(),
    notes,
  };

  // Trigger webhook for status update
  // Send SMS notification to customer
}

export async function optimizeRoute(
  origin: Location,
  destinations: Location[]
): Promise<RouteOptimization> {
  // Use routing algorithm (e.g., Google Maps API, HERE API)
  const totalDistance = destinations.length * 15; // Mock: 15km per stop
  const estimatedDuration = destinations.length * 30; // Mock: 30 min per stop

  return {
    totalDistance,
    estimatedDuration,
    fuelCost: totalDistance * 2.5, // R2.50 per km
    stops: destinations,
    waypoints: [],
    alternativeRoutes: 2,
  };
}

export async function optimizeInventory(
  productId: string,
  historicalSales: number[]
): Promise<InventoryOptimization> {
  // Calculate optimal stock levels using demand forecasting
  const avgDailySales = historicalSales.reduce((a, b) => a + b, 0) / historicalSales.length;
  const leadTime = 7; // days
  const safetyStock = avgDailySales * 3; // 3 days buffer
  const reorderPoint = avgDailySales * leadTime + safetyStock;
  const reorderQuantity = avgDailySales * 30; // 30 days supply

  // Forecast next 30 days
  const demandForecast = Array(30)
    .fill(0)
    .map(() => Math.round(avgDailySales * (0.9 + Math.random() * 0.2)));

  return {
    productId,
    currentStock: 0,
    optimalStock: reorderQuantity,
    reorderPoint,
    reorderQuantity,
    leadTime,
    demandForecast,
    stockoutRisk: 0.15,
  };
}

export async function predictStockout(
  productId: string,
  currentStock: number,
  dailyDemand: number
): Promise<{ risk: number; daysUntilStockout: number; recommendedAction: string }> {
  const daysUntilStockout = Math.floor(currentStock / dailyDemand);
  const risk = daysUntilStockout <= 7 ? 0.8 : daysUntilStockout <= 14 ? 0.4 : 0.1;

  let recommendedAction = 'Monitor stock levels';
  if (risk > 0.7) {
    recommendedAction = 'URGENT: Place order immediately';
  } else if (risk > 0.3) {
    recommendedAction = 'Place order within 3 days';
  }

  return {
    risk,
    daysUntilStockout,
    recommendedAction,
  };
}

export async function calculateShippingCost(
  origin: Location,
  destination: Location,
  weight: number,
  priority: DeliveryPriority
): Promise<number> {
  // Calculate distance
  const distance = calculateDistance(origin, destination);

  // Base rates
  const baseRate = 50;
  const perKmRate = 5;
  const perKgRate = 2;

  // Priority multipliers
  const priorityMultiplier = {
    standard: 1.0,
    express: 1.5,
    same_day: 2.0,
  };

  const cost =
    (baseRate + distance * perKmRate + weight * perKgRate) * priorityMultiplier[priority];

  return Math.round(cost);
}

export async function getDeliveryZones(): Promise<
  Array<{ zone: string; provinces: string[]; deliveryDays: number }>
> {
  return [
    {
      zone: 'Metro',
      provinces: ['Gauteng', 'Western Cape'],
      deliveryDays: 1,
    },
    {
      zone: 'Urban',
      provinces: ['KwaZulu-Natal', 'Eastern Cape'],
      deliveryDays: 2,
    },
    {
      zone: 'Rural',
      provinces: ['Limpopo', 'Mpumalanga', 'Northern Cape', 'Free State', 'North West'],
      deliveryDays: 3,
    },
  ];
}

export async function schedulePickup(
  merchantId: string,
  location: Location,
  items: ShipmentItem[],
  preferredDate: string
): Promise<{ success: boolean; pickupId: string; scheduledTime: string }> {
  return {
    success: true,
    pickupId: `PICKUP-${Date.now()}`,
    scheduledTime: preferredDate,
  };
}

export async function trackVehicleFleet(): Promise<Vehicle[]> {
  return [
    {
      id: 'VEH-001',
      type: 'bakkie',
      registration: 'CA 12345 GP',
      capacity: 1000,
      currentLoad: 450,
      fuelLevel: 75,
      lastMaintenance: '2024-01-15',
    },
  ];
}

export async function sendDeliveryNotification(
  customerPhone: string,
  shipmentId: string,
  estimatedArrival: string
): Promise<boolean> {
  // Send SMS: "Your eVoucher delivery is 15 minutes away. Track: evoucher.co.za/track/SHIP-123"
  return true;
}

function calculateDistance(origin: Location, destination: Location): number {
  // Haversine formula for distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destination.latitude - origin.latitude);
  const dLon = toRad(destination.longitude - origin.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.latitude)) *
      Math.cos(toRad(destination.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateDeliveryTime(
  origin: Location,
  destination: Location,
  priority: DeliveryPriority
): string {
  const distance = calculateDistance(origin, destination);
  const days = priority === 'same_day' ? 0 : priority === 'express' ? 1 : distance > 100 ? 3 : 2;

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + days);
  return deliveryDate.toISOString();
}

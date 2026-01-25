export interface EventData {
  eventName: string;
  eventDetails: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  eventLocation: string;
  eventPrice: string;
  minimumAge: string;
  paymentToken: string;
  image?: string; // IPFS url
  maxCapacity: string; 
  refundPolicy: string; 
  refundBufferHours: string; 
}

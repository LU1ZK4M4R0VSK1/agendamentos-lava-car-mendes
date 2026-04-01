import { useState, useCallback } from 'react';
import type { Service, VehicleType } from '@/data/services';

export interface BookingData {
  step: number;
  service: Service | null;
  vehicleType: VehicleType | null;
  date: Date | null;
  time: string | null;
  plate: string;
  model: string;
  color: string;
  clientName: string;
  clientPhone: string;
}

const initialState: BookingData = {
  step: 0,
  service: null,
  vehicleType: null,
  date: null,
  time: null,
  plate: '',
  model: '',
  color: '',
  clientName: '',
  clientPhone: '',
};

export function useBooking() {
  const [booking, setBooking] = useState<BookingData>(initialState);

  const setStep = useCallback((step: number) => setBooking(b => ({ ...b, step })), []);
  const setService = useCallback((service: Service) => setBooking(b => ({ ...b, service, step: 1 })), []);
  const setVehicleType = useCallback((vehicleType: VehicleType) => setBooking(b => ({ ...b, vehicleType, step: 2 })), []);
  const setDate = useCallback((date: Date) => setBooking(b => ({ ...b, date })), []);
  const setTime = useCallback((time: string) => setBooking(b => ({ ...b, time, step: 3 })), []);
  const setVehicleDetails = useCallback((plate: string, model: string, color: string) =>
    setBooking(b => ({ ...b, plate, model, color, step: 4 })), []);
  const setClientDetails = useCallback((clientName: string, clientPhone: string) =>
    setBooking(b => ({ ...b, clientName, clientPhone, step: 5 })), []);
  const reset = useCallback(() => setBooking(initialState), []);

  return {
    booking,
    setStep,
    setService,
    setVehicleType,
    setDate,
    setTime,
    setVehicleDetails,
    setClientDetails,
    reset,
  };
}

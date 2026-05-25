import VendorAvailability from "../models/vendorAvailability.model.js";

export const checkAvailabilityConflict = async (
  vendorId,
  availableFrom,
  availableTo,
  newTimeSlots,
  workingDays = []
) => {


  const newFrom = new Date(availableFrom);
  const newTo = new Date(availableTo);

  newFrom.setHours(0, 0, 0, 0);
  newTo.setHours(0, 0, 0, 0);

  const existingAvailabilities =
    await VendorAvailability.find({ vendorId });

  for (const existing of existingAvailabilities) {

    const existingFrom = new Date(existing.availableFrom);
    const existingTo = new Date(existing.availableTo);

    existingFrom.setHours(0, 0, 0, 0);
    existingTo.setHours(0, 0, 0, 0);

    const dateOverlap =
      newFrom <= existingTo &&
      newTo >= existingFrom;

    if (!dateOverlap) continue;


    if (workingDays.length && existing.workingDays?.length) {

      const commonDays = workingDays.filter(day =>
        existing.workingDays.includes(day)
      );

      if (commonDays.length === 0) {
        continue; 
      }

    }

    for (const newSlot of newTimeSlots) {

      const newStart = convertToMinutes(newSlot.startTime);
      const newEnd = convertToMinutes(newSlot.endTime);

      for (const oldSlot of existing.timeSlots) {

        const oldStart = convertToMinutes(oldSlot.startTime);
        const oldEnd = convertToMinutes(oldSlot.endTime);

        const conflict =
          newStart < oldEnd &&
          newEnd > oldStart;

        if (conflict) {
          return true;
        }

      }

    }

  }

  return false;

};


const convertToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
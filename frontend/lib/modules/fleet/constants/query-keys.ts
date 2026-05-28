// export const FLEET_KEYS = {
//   all: ["fleet"] as const,

//   drivers: () => [...FLEET_KEYS.all, "drivers"] as const,

//   vehicles: () => [...FLEET_KEYS.all, "vehicles"] as const,

//   trips: () => [...FLEET_KEYS.all, "trips"] as const,

//   trip: (id: string) =>
//     [...FLEET_KEYS.trips(), id] as const,
// } as const;


export const FLEET_KEYS = {
  all: ["fleet"] as const,

  drivers: () => [...FLEET_KEYS.all, "drivers"] as const,
  driver: (id: string) => [...FLEET_KEYS.drivers(), id] as const,

  vehicles: () => [...FLEET_KEYS.all, "vehicles"] as const,
  vehicle: (id: string) => [...FLEET_KEYS.vehicles(), id] as const,

  trips: () => [...FLEET_KEYS.all, "trips"] as const,
  trip: (id: string) => [...FLEET_KEYS.trips(), id] as const,
} as const;
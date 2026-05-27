export const FLEET_KEYS = {
  all: ["fleet"] as const,

  drivers: () => [...FLEET_KEYS.all, "drivers"] as const,

  vehicles: () => [...FLEET_KEYS.all, "vehicles"] as const,

  trips: () => [...FLEET_KEYS.all, "trips"] as const,

  trip: (id: string) =>
    [...FLEET_KEYS.trips(), id] as const,
} as const;
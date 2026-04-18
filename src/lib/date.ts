function getPartsInTimeZone(value: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  });

  const parts = formatter.formatToParts(value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const year = Number(parts.find((part) => part.type === "year")?.value);

  return { day, month, year };
}

export function startOfDayInTimeZone(value: Date, timeZone: string): Date {
  const { day, month, year } = getPartsInTimeZone(value, timeZone);

  return new Date(Date.UTC(year, month - 1, day));
}

export function assertSnapshotHour(snapshotHour: string): string {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(snapshotHour)) {
    throw new Error(`Invalid snapshot hour "${snapshotHour}". Expected HH:mm.`);
  }

  return snapshotHour;
}

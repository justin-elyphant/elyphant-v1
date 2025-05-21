
/**
 * Normalize any 'event' object (with a .date property) so that .date is always a valid JS Date.
 * Handles:
 *   - native Date objects
 *   - ISO strings
 *   - { iso: string }
 *   - {_type: "Date", value: { iso: string }}
 */
export function normalizeEventDate(event: any) {
  if (!event || !event.date) return null;

  const raw = event.date;
  let dateObj: Date | null = null;

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    dateObj = raw;
  } else if (typeof raw === "string" && !isNaN(Date.parse(raw))) {
    dateObj = new Date(raw);
  } else if (
    typeof raw === "object" &&
    raw !== null &&
    "iso" in raw &&
    typeof raw.iso === "string" &&
    !isNaN(Date.parse(raw.iso))
  ) {
    dateObj = new Date(raw.iso);
  } else if (
    typeof raw === "object" &&
    raw !== null &&
    raw._type === "Date" &&
    raw.value &&
    typeof raw.value.iso === "string" &&
    !isNaN(Date.parse(raw.value.iso))
  ) {
    dateObj = new Date(raw.value.iso);
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    return {
      ...event,
      date: dateObj
    };
  }

  return null;
}

# SCRUM-27  Service Centers Listing: User Guide

## Summary

End-user guide for finding and reading service center information in QueueLanka Pro. Content is based on `ServiceCenterController.cs`, `ServiceCenterService.cs`, and `ServiceCenterDto` as implemented in Sprint 1.

---

## Opening the Service Centers List

1. From the navigation bar or landing page, click **Service Centers** or navigate to `/service-centers`.
2. The page calls `GET /api/service-centers` and displays all active centers.
3. Each card shows: name, address, availability status, opening/closing times, and capacity.

---

## Understanding Center Information

### Key fields on each card

| Field | What it means |
|-------|--------------|
| **Name** | Display name of the service center. |
| **Address** | Physical address string. |
| **Opening / Closing Time** | Local hours in `HH:mm` format (e.g. `08:00` to `17:00`). |
| **Capacity** | Maximum number of tokens that can be issued per day. |
| **Avg. Service Time** | Average minutes to serve one customer (default 15 min). Used for ETA calculations. |
| **Timezone** | IANA timezone identifier (e.g. `Asia/Colombo`). |
| **Available** | Whether the center can accept bookings right now (see below). |

### What "Available" means

The `isAvailable` flag is computed as:

```
isAvailable = center.IsActive AND (availability?.IsAvailable ?? true)
```

- If the center has a **date-specific availability record** (`CenterAvailability`) for today, that record's `IsAvailable` field is used (and may also override `openingTime`/`closingTime`).
- If **no** date-specific record exists, the center's default `CenterOperatingDay` weekly schedule is checked.
- `IsActive = false` always means unavailable, regardless of the schedule.

---

## Viewing a Single Center

1. Click a center card or navigate to `/service-centers/{id}`.
2. The page calls `GET /api/service-centers/{id}`.
3. The detail view shows all fields plus the `location` block if the center has a location record:

   | Location Field | Description |
   |---------------|-------------|
   | `streetAddress` | Street number and name |
   | `city` / `district` / `province` | Administrative location |
   | `postalCode` | Postal code |
   | `country` | Defaults to `Sri Lanka` |
   | `latitude` / `longitude` | WGS-84 coordinates (optional) |
   | `googleMapsUrl` | Direct Maps link (optional) |
   | `landmark` | Nearby landmark for navigation (optional) |

---

## Checking Availability

- To check if a center is accepting bookings, the frontend calls `GET /api/service-centers/{id}/availability`.
- Returns `{ "data": true }` or `{ "data": false }`.
- Use this before attempting to book to avoid a rejection at the booking step.

---

## Common Problems and Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| Center shows as unavailable | `IsActive = false` or a date-specific block for today. | Try a different center, or come back on a different day. |
| No centers shown in list | No active centers in the system. | Contact your administrator. |
| Location map not showing | Center has no `location` record. | Contact the center for address. |
| Cannot find your city | The center's `city` field has not been populated yet. | Use the address field or ask the admin to update location data. |
| Times look wrong | Your browser timezone differs from the center's IANA timezone. | Times shown are in the center's local timezone. |

---

## Tips

- Check the `isAvailable` status before booking to avoid errors.
- Capacity shown is the daily maximum; actual remaining slots depend on existing bookings.
- Opening and closing times may differ on specific dates (public holidays or special schedules).

---

*Document generated from source code: `ServiceCenterController.cs`, `ServiceCenterService.cs`, `ServiceCenterDto.cs`, `ServiceCentersPage.tsx`.*

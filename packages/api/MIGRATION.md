# API package migration boundary

Phase 1 moves Auth/Profile and the verified core Booking operations to
`@alrehla/api-client`. The `@alrehla/api` package remains in the workspace for
domains that have not been migrated.

## Remaining exports

- `aiService`: future migration candidate.
- `bookingService`: ancillary booking/session notes, drafts, messaging,
  attachments, rescheduling, package/service/comparison CRUD, and instructor
  catalog helpers remain temporarily here.
- `cloudinaryService`: application-specific upload integration; future review.
- `communicationService`: future migration candidate.
- `contentService`: future migration candidate.
- `financialService`: future migration candidate.
- `gamificationService`: future migration candidate.
- `orderService`: future migration candidate.
- `publicService`: future migration candidate.
- `reportingService`: future migration candidate.
- `settingsService`: future migration candidate.
- `storageService`: infrastructure/application integration; future review.
- `userService`: Admin user-management and unrelated user operations remain
  temporarily here; Auth/Profile reads migrated in Phase 1 do not use it.

The package's Supabase singleton is retained only for these non-migrated
exports and legacy infrastructure. New Auth/Profile and core Booking callers
must use `@alrehla/api-client` directly.


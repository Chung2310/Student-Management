# Firestore Security Specification - Elite Student Management

## 1. Data Invariants
- A student must have a `fullName`, `rank`, `area`, `status`, and `ownerId`.
- The `ownerId` must strictly match the UID of the user who created the record.
- Only the owner of a student record can read, update, or delete it.
- Sensitive fields like `fullName`, `phone`, and `address` (PII) must be protected by ownership.

## 2. The "Dirty Dozen" Payloads (Expect PERMISSION_DENIED)

1. **Identity Spoofing**: Attempt to create a student with an `ownerId` that does not match `request.auth.uid`.
2. **PII Leak**: Attempt to read a student record as an authenticated user who is not the owner.
3. **Ghost Fields**: Attempt to create or update a student with unexpected fields (e.g., `isAdmin: true`).
4. **Id Poisoning**: Attempt to create a student with a document ID longer than 128 chars.
5. **Type Poisoning**: Sending `fee` as a number instead of a string (if schema mandates string).
6. **Immutable Field Change**: Attempt to change `ownerId` after creation.
7. **Cross-Tenant List**: Attempt to list all students without filtering by `ownerId`.
8. **Malicious Enum**: Setting `rank` to "F1" (invalid rank).
9. **Timestamp Spoofing**: Sending a client-side `createdAt` that doesn't match `request.time`.
10. **Size Exhaustion**: Sending an `address` string that is 1MB in size.
11. **Status Shortcut**: (If applicable, e.g.) Attempt to set status to "Đã đậu" without going through required steps (though currently rules allow owner full control).
12. **Unverified Auth**: Attempt to write data without `email_verified == true` (if enforced).

## 3. Test Runner Concept
The `firestore.rules.test.ts` (conceptual) will verify these denials.

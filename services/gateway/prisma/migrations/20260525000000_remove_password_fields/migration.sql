-- Drop password hash from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "passwordHash";

-- Drop password from Account
ALTER TABLE "Account" DROP COLUMN IF EXISTS "password";

-- Remove all credential-provider accounts (no longer usable)
DELETE FROM "Account" WHERE "providerId" = 'credential';

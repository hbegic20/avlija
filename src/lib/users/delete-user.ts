import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { avatarsBucket, listingImagesBucket } from "@/lib/supabase/storage-url";

type AdminClient = ReturnType<typeof createAdminClient>;

const removeBatchSize = 100;

async function listAllPaths(admin: AdminClient, bucket: string, prefix: string): Promise<string[]> {
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  const nested = await Promise.all(
    (data ?? []).map((entry) =>
      entry.id === null ? listAllPaths(admin, bucket, `${prefix}/${entry.name}`) : Promise.resolve([`${prefix}/${entry.name}`]),
    ),
  );
  return nested.flat();
}

async function removeUserFiles(admin: AdminClient, userId: string) {
  for (const bucket of [listingImagesBucket, avatarsBucket]) {
    const paths = await listAllPaths(admin, bucket, userId);
    for (let start = 0; start < paths.length; start += removeBatchSize) {
      await admin.storage.from(bucket).remove(paths.slice(start, start + removeBatchSize));
    }
  }
}

export async function deleteUserCompletely(userId: string): Promise<void> {
  const admin = createAdminClient();
  await removeUserFiles(admin, userId);
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    throw error;
  }
}

"use client";

import { useRef, useState, useTransition } from "react";
import { updateAvatar } from "@/actions/profile";
import { Avatar } from "@/components/layout/avatar";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/auth/form-alert";
import { bs } from "@/lib/i18n/bs";
import { createClient } from "@/lib/supabase/client";
import { avatarsBucket } from "@/lib/supabase/storage-url";
import { avatarPathFor } from "@/lib/validation/profile";
import { cropToSquareWebp } from "@/lib/profile/crop-avatar";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUpload({
  userId,
  fullName,
  initials,
  initialAvatarUrl,
}: {
  userId: string;
  fullName: string;
  initials: string;
  initialAvatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const upload = (file: File) =>
    startTransition(async () => {
      setError(null);
      if (!acceptedTypes.includes(file.type)) {
        setError(bs.profile.avatar.invalidType);
        return;
      }
      try {
        const blob = await cropToSquareWebp(file);
        const path = avatarPathFor(userId);
        const { error: uploadError } = await createClient()
          .storage.from(avatarsBucket)
          .upload(path, blob, { contentType: "image/webp", upsert: true, cacheControl: "3600" });
        if (uploadError) {
          setError(bs.profile.avatar.uploadFailed);
          return;
        }
        const result = await updateAvatar(path);
        if (result.ok) {
          setAvatarUrl(result.data.avatarUrl);
        } else {
          setError(bs.profile.avatar.uploadFailed);
        }
      } catch {
        setError(bs.profile.avatar.uploadFailed);
      }
    });

  const remove = () =>
    startTransition(async () => {
      setError(null);
      const result = await updateAvatar(null);
      if (result.ok) {
        setAvatarUrl(null);
      } else {
        setError(bs.profile.avatar.uploadFailed);
      }
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-label text-tinta-2 uppercase">{bs.profile.avatar.label}</p>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar fullName={fullName} initials={initials} avatarUrl={avatarUrl} size="lg" decorative={false} />
        <div className="flex flex-col items-start gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                upload(file);
              }
            }}
          />
          <Button variant="secondary" size="sm" loading={pending} onClick={() => inputRef.current?.click()}>
            {avatarUrl ? bs.profile.avatar.change : bs.profile.avatar.choose}
          </Button>
          {avatarUrl && !pending ? (
            <Button variant="ghost" size="sm" onClick={remove} className="-ml-3">
              {bs.profile.avatar.remove}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-small text-tinta-2">{bs.profile.avatar.helper}</p>
      {error ? <FormAlert tone="error">{error}</FormAlert> : null}
    </div>
  );
}

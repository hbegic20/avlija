import type { Metadata } from "next";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { BasicInfoForm } from "@/components/profile/basic-info-form";
import { ChangeEmailForm } from "@/components/profile/change-email-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ContactForm } from "@/components/profile/contact-form";
import { DeleteAccount } from "@/components/profile/delete-account";
import { ProfileSection, ProfileSubheading } from "@/components/profile/profile-section";
import { initialsOf, requireUser } from "@/lib/auth/current-user";
import { authRoutes } from "@/lib/auth/routes";
import { bs } from "@/lib/i18n/bs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: bs.profile.title,
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const user = await requireUser(authRoutes.profile);
  const supabase = await createClient();

  const [{ data: authData }, { data: profile }, { data: contacts }, { data: municipalities }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("full_name, municipality_id, avatar_url").eq("id", user.id).single(),
    supabase.from("profile_contacts").select("phone, has_viber, has_whatsapp").eq("profile_id", user.id).maybeSingle(),
    supabase.from("municipalities").select("id, name").order("name"),
  ]);

  const fullName = profile?.full_name ?? user.fullName;
  const email = authData.user?.email ?? user.email;
  const providers = (authData.user?.app_metadata.providers as string[] | undefined) ?? [];
  const hasPasswordLogin = providers.length === 0 || providers.includes("email");
  const municipalityOptions = (municipalities ?? []).map((municipality) => ({
    value: String(municipality.id),
    label: municipality.name,
  }));

  return (
    <div>
      <h1 className="border-t-2 border-t-tinta pt-3 font-display text-h1">{bs.profile.title}</h1>
      <p className="mt-3 mb-10 max-w-[60ch] text-tinta-2">{bs.profile.description}</p>

      <ProfileSection
        number={bs.profile.basic.label}
        title={bs.profile.basic.title}
        description={bs.profile.basic.description}
      >
        <AvatarUpload
          userId={user.id}
          fullName={fullName}
          initials={initialsOf(fullName)}
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
        <BasicInfoForm
          defaultValues={{
            fullName,
            municipalityId: profile?.municipality_id ? String(profile.municipality_id) : "",
          }}
          municipalityOptions={municipalityOptions}
        />
      </ProfileSection>

      <ProfileSection
        number={bs.profile.contact.label}
        title={bs.profile.contact.title}
        description={bs.profile.contact.description}
      >
        <ContactForm
          defaultValues={{
            phone: contacts?.phone ?? "",
            hasViber: contacts?.has_viber ?? false,
            hasWhatsapp: contacts?.has_whatsapp ?? false,
          }}
        />
      </ProfileSection>

      <ProfileSection
        number={bs.profile.security.label}
        title={bs.profile.security.title}
        description={bs.profile.security.description}
      >
        <div className="flex flex-col gap-5">
          <ProfileSubheading>{bs.profile.security.changePassword}</ProfileSubheading>
          {hasPasswordLogin ? (
            <ChangePasswordForm />
          ) : (
            <p className="text-small text-tinta-2">{bs.profile.security.oauthOnly}</p>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <ProfileSubheading>{bs.profile.security.changeEmail}</ProfileSubheading>
          <ChangeEmailForm currentEmail={email} />
        </div>
      </ProfileSection>

      <DeleteAccount />
    </div>
  );
}

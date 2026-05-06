import { auth } from "@/backend/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/settings");

  const user = session.user;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">View your profile and account details.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary-glow shadow-lg overflow-hidden flex-shrink-0">
                {user.image ? (
                  <img src={user.image} alt={user.name || "Avatar"} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary-foreground text-2xl font-display">
                    {(user.name || "U")[0]}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user.name || "User"}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Signed in with Google</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Email</div>
                  <div className="text-sm">{user.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Role</div>
                  <div className="text-sm capitalize">{user.role || "buyer"}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Your profile is managed through your Google account. To update your name or profile picture, update your Google account settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

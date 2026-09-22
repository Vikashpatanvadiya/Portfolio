import type { Metadata } from "next";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { getContent, storageMode } from "@/lib/content/store";
import { Editor } from "./editor";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <h1 className="mb-6 text-lg font-semibold">admin</h1>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <p className="text-sm text-muted leading-relaxed">
            Set an <code className="text-foreground">ADMIN_PASSWORD</code> environment variable (at least 8 characters)
            to enable the admin panel.
          </p>
        )}
      </main>
    );
  }

  return <Editor initial={await getContent()} storage={storageMode} />;
}

import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <div className="grid min-h-screen place-items-center bg-void px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <Image
            src="/brand/logo.png"
            alt="Rave.LK"
            width={1600}
            height={234}
            priority
            className="mx-auto h-5 w-auto"
          />
          <p className="label-mono mt-4">Content management</p>
        </div>

        <div className="cut-corner border border-bone/12 bg-void-2 p-7">
          <h1 className="display-md mb-1 text-bone">Sign in</h1>
          <p className="mb-7 text-sm text-smoke">
            Use the admin account for this site.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center font-mono text-[10px] tracking-[0.14em] text-smoke uppercase">
          Rave.LK Admin
        </p>
      </div>
    </div>
  );
}

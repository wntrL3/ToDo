import { data, redirect, Link } from "react-router";
import type { Route } from "./+types/signup";
import { users } from "~/lib/appwrite.server";
import { ID, Client, Account } from "node-appwrite";
import { createSessionHeaders } from "~/lib/session.server";

type ActionErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const errors: ActionErrors = {};

  if (!email || !email.includes("@")) {
    errors.email = "Bitte eine gültige E-Mail-Adresse eingeben.";
  }
  if (!password || password.length < 8) {
    errors.password = "Das Passwort muss mindestens 8 Zeichen lang sein.";
  }
  if (Object.keys(errors).length > 0) {
    return data({ errors }, { status: 400 });
  }

  try {
    const user = await users.create(ID.unique(), email, undefined, password);

    // Direkt einloggen nach Registrierung
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!);
    const account = new Account(client);
    await account.createEmailPasswordSession(email, password);

    return redirect("/todos", { headers: createSessionHeaders(user.$id) });
  } catch (error: any) {
    const errors: ActionErrors = { general: "Fehler: " + error.message };
    return data({ errors }, { status: 500 });
  }
}

export default function Signup({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Konto erstellen
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registriere dich, um loszulegen.
          </p>
        </div>

        <form
          method="post"
          noValidate
          className="space-y-4"
        >
          {/* E-Mail */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              E-Mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {actionData?.errors?.email && (
              <p className="mt-1 text-xs text-red-500">{actionData.errors.email}</p>
            )}
          </div>

          {/* Passwort */}
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition-all placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {actionData?.errors?.password && (
              <p className="mt-1 text-xs text-red-500">{actionData.errors.password}</p>
            )}
          </div>

          {/* General error */}
          {actionData?.errors?.general && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionData.errors.general}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800"
          >
            Registrieren
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Bereits ein Konto?{" "}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Jetzt anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}

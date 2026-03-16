import { data, redirect } from "react-router";
import type { Route } from "./+types/login";
import { Client, Account } from "node-appwrite";
import { createSessionHeaders, getUserId } from "~/lib/session.server";
import { Link } from "react-router";

type ActionErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export function loader({ request }: Route.LoaderArgs) {
  const userId = getUserId(request);
  if (userId) return redirect("/todos");
  return null;
}

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
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!);

    const account = new Account(client);
    const session = await account.createEmailPasswordSession(email, password);

    return redirect("/todos", { headers: createSessionHeaders(session.userId) });
  } catch (error: any) {
    const errors: ActionErrors = { general: "E-Mail oder Passwort falsch." };
    return data({ errors }, { status: 401 });
  }
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: "30px",
        borderRadius: 8,
        boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
        background: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Anmelden</h1>

      <form
        method="post"
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* E-Mail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="email">E-Mail</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            style={{
              padding: "10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
          {actionData?.errors?.email && (
            <p style={{ color: "red", fontSize: "13px", margin: 0 }}>
              {actionData.errors.email}
            </p>
          )}
        </div>

        {/* Passwort */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="password">Passwort</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            style={{
              padding: "10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
          {actionData?.errors?.password && (
            <p style={{ color: "red", fontSize: "13px", margin: 0 }}>
              {actionData.errors.password}
            </p>
          )}
        </div>

        {/* Allgemeiner Fehler */}
        {actionData?.errors?.general && (
          <p style={{ color: "red", fontSize: "14px", margin: 0 }}>
            {actionData.errors.general}
          </p>
        )}

        <button
          type="submit"
          style={{
            padding: "10px",
            borderRadius: 6,
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Anmelden
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#6b7280" }}>
        Noch kein Konto?{" "}
        <Link to="/signup" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}

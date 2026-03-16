import { data, redirect, Link } from "react-router";
import type { Route } from "./+types/signup";
import { users } from "~/lib/appwrite.server";
import { ID } from "node-appwrite";

//mögliche Fehlermeldungen im Formular
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
    await users.create(ID.unique(), email, undefined, password);
    return redirect("/todos");
  } catch (error: any) {
    const errors: ActionErrors = { general: "Fehler: " + error.message };
    return data({ errors }, { status: 500 });
  }
}

export default function Signup({ actionData }: Route.ComponentProps) {
  return (
    <div
      style={{
        maxWidth: 420,
        margin: "60px auto",
        padding: "30px",
        borderRadius: 8,
        boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
        background: "#fff",
        fontFamily: "sans-serif"
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Registrieren
      </h1>

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
              fontSize: "14px"
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
              fontSize: "14px"
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

        {/* Button */}
        <button
          type="submit"
          style={{
            padding: "10px",
            borderRadius: 6,
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Registrieren
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#6b7280" }}>
        Bereits ein Konto?{" "}
        <Link to="/login" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>
          Jetzt anmelden
        </Link>
      </p>
    </div>
  );
}
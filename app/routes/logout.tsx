import { redirect } from "react-router";
import { clearSessionHeaders } from "~/lib/session.server";

export async function action() {
  return redirect("/login", { headers: clearSessionHeaders() });
}

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createDlocalSignature,
  getDlocalSignature,
  signaturesMatch,
} from "../_shared/dlocal.ts";

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing Edge Function secret: ${name}`);
  return value;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const login = requiredEnv("DLOCAL_X_LOGIN");
    const secret = requiredEnv("DLOCAL_SECRET_KEY");
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY");
    if (!serviceKey) throw new Error("Missing Supabase server-side key.");

    const receivedLogin = request.headers.get("X-Login");
    const date = request.headers.get("X-Date");
    const receivedSignature = getDlocalSignature(request.headers.get("Authorization"));
    if ((receivedLogin && receivedLogin !== login) || !date || !receivedSignature) {
      return jsonResponse({ error: "Invalid dLocal notification headers." }, 401);
    }

    const rawBody = await request.text();
    const expectedSignature = await createDlocalSignature(
      login,
      date,
      rawBody,
      secret,
    );
    if (!signaturesMatch(expectedSignature, receivedSignature)) {
      return jsonResponse({ error: "Invalid dLocal notification signature." }, 401);
    }

    let notification: Record<string, unknown>;
    try {
      const parsedNotification: unknown = JSON.parse(rawBody);
      if (
        !parsedNotification ||
        typeof parsedNotification !== "object" ||
        Array.isArray(parsedNotification)
      ) {
        return jsonResponse({ error: "Invalid notification body." }, 400);
      }
      notification = parsedNotification as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: "Invalid notification body." }, 400);
    }

    const orderId = typeof notification.order_id === "string"
      ? notification.order_id
      : "";
    const paymentId = typeof notification.id === "string" ? notification.id : null;
    const status = typeof notification.status === "string"
      ? notification.status.toUpperCase()
      : "";
    const amount = Number(notification.amount);
    const currency = typeof notification.currency === "string"
      ? notification.currency.toUpperCase()
      : "";
    const country = typeof notification.country === "string"
      ? notification.country.toUpperCase()
      : "";

    if (!orderId || !status || !Number.isFinite(amount) || currency !== "UYU" || country !== "UY") {
      return jsonResponse({ error: "The notification is missing required payment fields." }, 400);
    }

    const serviceKeyValue = serviceKey;
    const adminClient = createClient(supabaseUrl, serviceKeyValue);
    const { data, error } = await adminClient.rpc("apply_dlocal_ticket_update", {
      p_external_order_id: orderId,
      p_payment_id: paymentId,
      p_payment_status: status,
      p_amount: amount,
      p_currency: currency,
    });
    if (error) {
      console.error("Could not apply dLocal notification:", error.message);
      return jsonResponse({ error: "Could not apply payment notification." }, 400);
    }

    return jsonResponse({ received: true, status: data?.[0]?.order_status ?? "pending" });
  } catch (error) {
    console.error("dLocal webhook processing failed:", error);
    const message = error instanceof Error ? error.message : "Unexpected webhook error.";
    return jsonResponse({ error: message }, 500);
  }
});

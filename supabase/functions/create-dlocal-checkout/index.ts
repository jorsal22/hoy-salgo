import { createClient } from "npm:@supabase/supabase-js@2";
import { createDlocalSignature } from "../_shared/dlocal.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const requiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing Edge Function secret: ${name}`);
  return value;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");
    const accessToken = authorization?.replace(/^Bearer\s+/i, "");
    if (!accessToken || accessToken === authorization) {
      return jsonResponse({ error: "Iniciá sesión para comprar una entrada." }, 401);
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!publishableKey) {
      throw new Error("Missing Supabase publishable key for user verification.");
    }
    const authClient = createClient(supabaseUrl, publishableKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
    const user = userData.user;
    if (userError || !user?.id || !user.email) {
      return jsonResponse({ error: "No se pudo validar tu sesión. Iniciá sesión de nuevo." }, 401);
    }

    let input: Record<string, unknown>;
    try {
      const parsedInput: unknown = await request.json();
      if (!parsedInput || typeof parsedInput !== "object" || Array.isArray(parsedInput)) {
        return jsonResponse({ error: "La solicitud no tiene un formato válido." }, 400);
      }
      input = parsedInput as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: "La solicitud no tiene un formato válido." }, 400);
    }

    const eventId = typeof input.eventId === "string" ? input.eventId : "";
    const name = typeof input.name === "string" ? input.name.trim() : "";
    const rawDocument = typeof input.document === "string" ? input.document.trim() : "";
    if (rawDocument && !/^[\d.\-\s]+$/.test(rawDocument)) {
      return jsonResponse({ error: "La CI o el RUT solo puede contener números, puntos y guiones." }, 400);
    }
    const document = rawDocument.replace(/\D/g, "");
    const enteredCode = typeof input.rrppCode === "string" ? input.rrppCode.trim().toUpperCase() : "";
    const linkedCode = typeof input.linkedRrppCode === "string" ? input.linkedRrppCode.trim().toUpperCase() : "";
    if ((enteredCode && !/^[A-F0-9]{12}$/.test(enteredCode)) ||
        (linkedCode && !/^[A-F0-9]{12}$/.test(linkedCode))) {
      return jsonResponse({ error: "El código de RRPP no es válido." }, 400);
    }
    if (enteredCode && linkedCode && enteredCode !== linkedCode) {
      return jsonResponse({ error: "El código no coincide con el enlace del RRPP. Resolvé la diferencia antes de comprar." }, 400);
    }
    const rrppCode = enteredCode || linkedCode;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
      return jsonResponse({ error: "El evento seleccionado no es válido." }, 400);
    }
    if (name.length < 2 || name.length > 100) {
      return jsonResponse({ error: "Ingresá tu nombre completo." }, 400);
    }
    if (!/^(?:\d{6,8}|\d{12})$/.test(document)) {
      return jsonResponse({ error: "Ingresá una CI de 6 a 8 dígitos o un RUT de 12 dígitos." }, 400);
    }

    const dlocalLogin = requiredEnv("DLOCAL_X_LOGIN");
    const dlocalTransKey = requiredEnv("DLOCAL_X_TRANS_KEY");
    const dlocalSecret = requiredEnv("DLOCAL_SECRET_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY");
    if (!serviceKey) throw new Error("Missing Supabase server-side key.");

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: existingOrder, error: existingOrderError } = await adminClient
      .from("event_ticket_orders")
      .select("id, checkout_url")
      .eq("event_id", eventId)
      .eq("buyer_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    if (existingOrderError) {
      console.error("Could not check for a pending ticket order:", existingOrderError.message);
      throw new Error("No se pudo revisar si ya tenés un pago pendiente.");
    }
    if (existingOrder) {
      const { data: attribution, error: attributionError } = await adminClient
        .from("rrpp_order_attributions")
        .select("rrpp_profiles(code)")
        .eq("order_id", existingOrder.id)
        .maybeSingle();
      if (attributionError) {
        console.error("Could not check the pending order attribution:", attributionError.message);
        throw new Error("No se pudo revisar el RRPP de tu pago pendiente.");
      }
      const profile = attribution?.rrpp_profiles;
      const previousCode = Array.isArray(profile) ? profile[0]?.code : profile?.code;
      if ((previousCode ?? "") !== rrppCode) {
        return jsonResponse({
          error: "Ya tenés un pago pendiente con otro código de RRPP. Contactá soporte antes de cambiarlo.",
        }, 409);
      }
      if (typeof existingOrder.checkout_url === "string") {
        return jsonResponse({
          orderId: existingOrder.id,
          status: "pending",
          redirectUrl: existingOrder.checkout_url,
        });
      }
      return jsonResponse({
        error: "Ya tenés un pago pendiente para este evento. Si no podés continuarlo, contactá soporte.",
      }, 409);
    }

    const { data: reservation, error: reserveError } = await adminClient.rpc(
      "reserve_event_ticket_rrpp",
      {
        p_event_id: eventId,
        p_buyer_id: user.id,
        p_buyer_email: user.email,
        p_rrpp_code: rrppCode || null,
      },
    );
    if (reserveError) {
      console.error("Could not reserve event ticket:", reserveError.message);
      const message = reserveError.message.includes("sold out")
        ? "Las entradas se agotaron."
        : reserveError.message.includes("not enabled")
        ? "La venta de entradas no está habilitada para este evento."
        : reserveError.message.includes("closed")
        ? "La venta para este evento ya está cerrada."
        : reserveError.message.includes("pending payment")
        ? "Ya tenés un pago pendiente para este evento."
        : reserveError.message.includes("Invalid RRPP code")
        ? "El código de RRPP no está habilitado para este evento."
        : "No se pudo reservar la entrada.";
      return jsonResponse({ error: message }, 409);
    }

    const order = reservation?.[0];
    if (!order?.external_order_id || !order?.ticket_order_id || !order?.amount_uyu) {
      throw new Error("Ticket reservation did not return a complete order.");
    }

    const payload = {
      amount: Number(order.amount_uyu),
      currency: "UYU",
      country: "UY",
      payment_method_id: "CARD",
      payment_method_flow: "REDIRECT",
      payer: {
        name,
        email: user.email,
        document,
      },
      order_id: order.external_order_id,
      notification_url: `${supabaseUrl}/functions/v1/dlocal-webhook`,
      description: `Entrada ${String(order.event_title ?? "").slice(0, 180)}`,
    };
    const requestBody = JSON.stringify(payload);
    const date = new Date().toISOString();
    const signature = await createDlocalSignature(
      dlocalLogin,
      date,
      requestBody,
      dlocalSecret,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let providerResponse: Response;
    try {
      providerResponse = await fetch("https://sandbox.dlocal.com/payments", {
        method: "POST",
        headers: {
          "X-Date": date,
          "X-Login": dlocalLogin,
          "X-Trans-Key": dlocalTransKey,
          "Content-Type": "application/json",
          "X-Version": "2.1",
          "User-Agent": "HoySalgo/1.0",
          "Authorization": `V2-HMAC-SHA256, Signature: ${signature}`,
        },
        body: requestBody,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const providerBody = await providerResponse.text();
    let payment: Record<string, unknown>;
    try {
      payment = JSON.parse(providerBody);
    } catch {
      console.error("dLocal returned a non-JSON payment response.");
      return jsonResponse({ error: "dLocal devolvió una respuesta inválida. La reserva quedó pendiente de revisión." }, 502);
    }

    if (!providerResponse.ok) {
      const { error: updateError } = await adminClient.rpc("apply_dlocal_ticket_update", {
        p_external_order_id: order.external_order_id,
        p_payment_id: typeof payment.id === "string" ? payment.id : null,
        p_payment_status: "FAILED",
        p_amount: Number(order.amount_uyu),
        p_currency: "UYU",
      });
      if (updateError) {
        console.error("Could not release failed ticket reservation:", updateError.message);
      }
      console.error("dLocal sandbox rejected the payment request:", providerResponse.status);
      return jsonResponse({ error: "dLocal no pudo iniciar el pago. Revisá la configuración de sandbox." }, 502);
    }

    const paymentStatus = typeof payment.status === "string" ? payment.status : "PENDING";
    const { data: orderUpdate, error: orderUpdateError } = await adminClient.rpc(
      "apply_dlocal_ticket_update",
      {
        p_external_order_id: order.external_order_id,
        p_payment_id: typeof payment.id === "string" ? payment.id : null,
        p_payment_status: paymentStatus,
        p_amount: Number(payment.amount ?? order.amount_uyu),
        p_currency: typeof payment.currency === "string" ? payment.currency : "UYU",
      },
    );
    if (orderUpdateError) {
      console.error("Could not save dLocal payment reference:", orderUpdateError.message);
      return jsonResponse({ error: "El pago se inició, pero no se pudo actualizar la orden. Contactá soporte." }, 502);
    }

    const redirectUrl = typeof payment.redirect_url === "string"
      ? payment.redirect_url
      : "";
    if (redirectUrl) {
      const url = new URL(redirectUrl);
      if (
        url.protocol !== "https:" ||
        (url.hostname !== "dlocal.com" && !url.hostname.endsWith(".dlocal.com"))
      ) {
        throw new Error("dLocal returned an untrusted checkout URL.");
      }
    }

    const updatedOrder = orderUpdate?.[0];
    if (redirectUrl && updatedOrder?.order_status === "pending") {
      const { error: checkoutUrlError } = await adminClient
        .from("event_ticket_orders")
        .update({ checkout_url: redirectUrl })
        .eq("id", order.ticket_order_id)
        .eq("buyer_id", user.id);
      if (checkoutUrlError) {
        console.error("Could not save dLocal checkout URL:", checkoutUrlError.message);
        return jsonResponse({
          error: "dLocal inició el pago, pero no se pudo guardar el enlace. Contactá soporte.",
        }, 502);
      }
    }

    return jsonResponse({
      orderId: order.ticket_order_id,
      status: updatedOrder?.order_status ?? "pending",
      ticketCode: updatedOrder?.issued_ticket_code ?? null,
      redirectUrl: redirectUrl || null,
    });
  } catch (error) {
    console.error("dLocal checkout initialization failed:", error);
    const message = error instanceof Error ? error.message : "Unexpected checkout error.";
    return jsonResponse({ error: message }, 500);
  }
});

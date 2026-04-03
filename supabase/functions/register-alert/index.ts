import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AlertSchema = z.object({
  alertType: z.enum(["email", "whatsapp", "both"]),
  email: z.string().email().optional(),
  whatsappNumber: z.string().optional(),
  state: z.string().min(1).max(100).default("All India"),
  minMagnitude: z.number().min(1).max(10).default(4),
}).refine(
  (data) => {
    if (data.alertType === "email" || data.alertType === "both") {
      return !!data.email;
    }
    return true;
  },
  { message: "Email is required for email alerts", path: ["email"] }
).refine(
  (data) => {
    if (data.alertType === "whatsapp" || data.alertType === "both") {
      return !!data.whatsappNumber;
    }
    return true;
  },
  { message: "WhatsApp number is required for WhatsApp alerts", path: ["whatsappNumber"] }
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = AlertSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { alertType, email, whatsappNumber, state, minMagnitude } = parsed.data;

    // Validate Indian phone number if provided
    let cleanedNumber: string | null = null;
    if (whatsappNumber) {
      cleanedNumber = whatsappNumber.replace(/[\s\-+]/g, "").replace(/^91/, "");
      if (!/^[6-9]\d{9}$/.test(cleanedNumber)) {
        return new Response(
          JSON.stringify({ error: "Please enter a valid Indian mobile number (10 digits starting with 6-9)" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Store subscription in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase.from("alert_subscriptions").insert({
      email: email || null,
      whatsapp_number: cleanedNumber ? `91${cleanedNumber}` : null,
      alert_type: alertType,
      state,
      min_magnitude: minMagnitude,
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to register subscription" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send WhatsApp confirmation via Twilio if applicable
    let whatsappSent = false;
    if ((alertType === "whatsapp" || alertType === "both") && cleanedNumber) {
      const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioSid && twilioAuth && twilioPhone) {
        try {
          const message = `🌍 QuakeInsight Alert Registered!\n\nYou'll receive WhatsApp alerts for earthquakes:\n📍 Region: ${state}\n📊 Magnitude: ${minMagnitude}+\n\nStay safe! Reply STOP to unsubscribe.`;

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const authHeader = btoa(`${twilioSid}:${twilioAuth}`);

          const formData = new URLSearchParams();
          formData.append("To", `whatsapp:+91${cleanedNumber}`);
          formData.append("From", `whatsapp:${twilioPhone}`);
          formData.append("Body", message);

          const twilioResponse = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authHeader}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          });

          const twilioResult = await twilioResponse.json();
          console.log("Twilio WhatsApp response:", JSON.stringify(twilioResult));

          if (twilioResponse.ok) {
            whatsappSent = true;
          } else {
            console.error("Twilio error:", twilioResult);
          }
        } catch (twilioErr) {
          console.error("Twilio WhatsApp error:", twilioErr);
        }
      } else {
        console.warn("Twilio credentials not configured for WhatsApp");
      }
    }

    const messages: string[] = [];
    if (alertType === "email" || alertType === "both") {
      messages.push("Email alerts registered successfully.");
    }
    if (alertType === "whatsapp" || alertType === "both") {
      messages.push(whatsappSent
        ? "WhatsApp confirmation sent!"
        : "WhatsApp alert registered. Confirmation will be sent shortly."
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: messages.join(" ") }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in register-alert:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

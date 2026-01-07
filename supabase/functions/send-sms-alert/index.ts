import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  phoneNumber: string;
  state: string;
  minMagnitude: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, state, minMagnitude }: SMSRequest = await req.json();
    
    console.log(`Registering SMS alert for ${phoneNumber} in ${state}, min magnitude: ${minMagnitude}`);
    
    // Validate Indian phone number
    const cleanedNumber = phoneNumber.replace(/\s/g, "");
    const isValidIndianNumber = /^(\+91|91)?[6-9]\d{9}$/.test(cleanedNumber);
    
    if (!isValidIndianNumber) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid Indian mobile number" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format to E.164
    let formattedNumber = cleanedNumber;
    if (!formattedNumber.startsWith("+91")) {
      if (formattedNumber.startsWith("91")) {
        formattedNumber = "+" + formattedNumber;
      } else {
        formattedNumber = "+91" + formattedNumber;
      }
    }

    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Twilio credentials not configured");
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send confirmation SMS
    const message = `🌍 QuakeInsight Alert Registered!\n\nYou will receive instant SMS alerts for earthquakes:\n📍 State: ${state}\n📊 Minimum Magnitude: ${minMagnitude}+\n\nStay safe! Reply STOP to unsubscribe.`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedNumber,
        From: twilioPhoneNumber,
        Body: message,
      }),
    });

    if (!twilioResponse.ok) {
      const error = await twilioResponse.text();
      console.error("Twilio error:", error);
      throw new Error("Failed to send SMS");
    }

    const result = await twilioResponse.json();
    console.log("SMS sent successfully:", result.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Alert registered! You will receive a confirmation SMS shortly.",
        sid: result.sid 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

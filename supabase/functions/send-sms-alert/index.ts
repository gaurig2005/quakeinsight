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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, state, minMagnitude }: SMSRequest = await req.json();
    
    console.log(`SMS Alert Request - Phone: ${phoneNumber}, State: ${state}, MinMag: ${minMagnitude}`);
    
    // Validate Indian phone number (10 digits starting with 6-9)
    const cleanedNumber = phoneNumber.replace(/\s/g, "").replace(/-/g, "").replace("+91", "").replace("91", "");
    const isValidIndianNumber = /^[6-9]\d{9}$/.test(cleanedNumber);
    
    if (!isValidIndianNumber) {
      console.error("Invalid phone number format:", cleanedNumber);
      return new Response(
        JSON.stringify({ error: "Please enter a valid Indian mobile number (10 digits starting with 6-9)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Cleaned phone number:", cleanedNumber);

    // Get Fast2SMS API key from environment
    const fast2smsApiKey = Deno.env.get("FAST2SMS_API_KEY");

    console.log("Fast2SMS API Key check:", {
      hasApiKey: !!fast2smsApiKey,
      keyLength: fast2smsApiKey?.length || 0,
    });

    if (!fast2smsApiKey) {
      console.error("Missing Fast2SMS API key");
      return new Response(
        JSON.stringify({ error: "SMS service not configured. Please add FAST2SMS_API_KEY." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create confirmation message
    const message = `QuakeInsight Alert Registered! You will receive SMS alerts for earthquakes in ${state} with magnitude ${minMagnitude}+. Stay safe!`;

    // Fast2SMS API endpoint (using Quick SMS route - free)
    const fast2smsUrl = "https://www.fast2sms.com/dev/bulkV2";
    
    console.log("Sending SMS via Fast2SMS...");
    console.log("To:", cleanedNumber);
    console.log("Message:", message);

    // Send SMS via Fast2SMS
    const response = await fetch(fast2smsUrl, {
      method: "POST",
      headers: {
        "authorization": fast2smsApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q", // Quick SMS route (free)
        message: message,
        language: "english",
        flash: 0,
        numbers: cleanedNumber,
      }),
    });

    const responseText = await response.text();
    console.log("Fast2SMS response status:", response.status);
    console.log("Fast2SMS response:", responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Could not parse Fast2SMS response:", responseText);
      return new Response(
        JSON.stringify({ error: "Invalid response from SMS service" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!result.return) {
      console.error("Fast2SMS error:", result);
      let errorMessage = result.message || "Failed to send SMS";
      
      // Common Fast2SMS errors
      if (result.status_code === 411) {
        errorMessage = "Invalid API key. Please check your Fast2SMS API key.";
      } else if (result.status_code === 412) {
        errorMessage = "Insufficient balance. Please recharge your Fast2SMS account.";
      } else if (result.status_code === 413) {
        errorMessage = "Invalid mobile number format.";
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("SMS sent successfully! Request ID:", result.request_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Alert registered! You will receive a confirmation SMS shortly.",
        requestId: result.request_id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-sms-alert:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

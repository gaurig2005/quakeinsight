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
    
    // Validate Indian phone number
    const cleanedNumber = phoneNumber.replace(/\s/g, "").replace(/-/g, "");
    const isValidIndianNumber = /^(\+91|91)?[6-9]\d{9}$/.test(cleanedNumber);
    
    if (!isValidIndianNumber) {
      console.error("Invalid phone number format:", cleanedNumber);
      return new Response(
        JSON.stringify({ error: "Please enter a valid Indian mobile number (10 digits starting with 6-9)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format to E.164 format
    let formattedNumber = cleanedNumber;
    if (formattedNumber.startsWith("+91")) {
      // Already in correct format
    } else if (formattedNumber.startsWith("91") && formattedNumber.length === 12) {
      formattedNumber = "+" + formattedNumber;
    } else if (formattedNumber.length === 10) {
      formattedNumber = "+91" + formattedNumber;
    }
    
    console.log("Formatted phone number:", formattedNumber);

    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    // Log credential status (not the actual values)
    console.log("Twilio credentials check:", {
      hasAccountSid: !!twilioAccountSid,
      accountSidLength: twilioAccountSid?.length || 0,
      hasAuthToken: !!twilioAuthToken,
      authTokenLength: twilioAuthToken?.length || 0,
      hasPhoneNumber: !!twilioPhoneNumber,
      phoneNumber: twilioPhoneNumber || "not set"
    });

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "SMS service not configured. Please contact administrator." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate Twilio Account SID format (should start with AC and be 34 chars)
    if (!twilioAccountSid.startsWith("AC") || twilioAccountSid.length !== 34) {
      console.error("Invalid Twilio Account SID format. Expected: starts with 'AC', length 34. Got length:", twilioAccountSid.length);
      return new Response(
        JSON.stringify({ error: "SMS service configuration error. Invalid Account SID format." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create confirmation message
    const message = `🌍 QuakeInsight Alert Registered!\n\nYou will receive SMS alerts for earthquakes:\n📍 State: ${state}\n📊 Min Magnitude: ${minMagnitude}+\n\nStay safe! Reply STOP to unsubscribe.`;

    // Twilio API endpoint
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    console.log("Sending SMS via Twilio...");
    console.log("To:", formattedNumber);
    console.log("From:", twilioPhoneNumber);

    // Send SMS via Twilio
    const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: formattedNumber,
        From: twilioPhoneNumber,
        Body: message,
      }).toString(),
    });

    const responseText = await twilioResponse.text();
    console.log("Twilio response status:", twilioResponse.status);
    console.log("Twilio response:", responseText);

    if (!twilioResponse.ok) {
      let errorMessage = "Failed to send SMS";
      try {
        const errorData = JSON.parse(responseText);
        console.error("Twilio error details:", errorData);
        errorMessage = errorData.message || errorMessage;
        
        // Provide user-friendly error messages
        if (errorData.code === 20003) {
          errorMessage = "SMS service authentication failed. Please check credentials.";
        } else if (errorData.code === 21211) {
          errorMessage = "Invalid 'To' phone number format.";
        } else if (errorData.code === 21608) {
          errorMessage = "The 'From' number is not verified for this region.";
        } else if (errorData.code === 21610) {
          errorMessage = "This number has unsubscribed from SMS.";
        }
      } catch (e) {
        console.error("Could not parse Twilio error response");
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const result = JSON.parse(responseText);
    console.log("SMS sent successfully! SID:", result.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Alert registered! You will receive a confirmation SMS shortly.",
        sid: result.sid 
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

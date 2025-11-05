import { NextResponse } from "next/server";
import { supabase } from "@/integrations/supabase/client";

export async function POST(req: Request) {
  const body = await req.json();

  const resultCode = body.Body.stkCallback.ResultCode;
  const phone = body.Body.stkCallback.CallbackMetadata?.Item?.find(
    (item: any) => item.Name === "PhoneNumber"
  )?.Value;

  if (resultCode === 0) {
    // Payment successful
    await supabase.from("contact_purchases").insert({
      user_id: "replace_with_user_id",
      property_id: "replace_with_property_id",
      amount: 200,
      payment_status: "completed",
      phone,
    });
  }

  return NextResponse.json({ success: true });
}

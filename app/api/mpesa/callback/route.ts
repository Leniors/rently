import { NextResponse } from "next/server";
import { supabase } from "@/integrations/supabase/client";

type CallbackItem = { Name?: string; Value?: string | number | null };

export async function POST(req: Request) {
  const body = await req.json();
  const resultCode = body?.Body?.stkCallback?.ResultCode ?? body?.Body?.ResultCode;
  const phone = body.Body.stkCallback.CallbackMetadata?.Item?.find(
    (item: CallbackItem) =>
      item.Name === "PhoneNumber" || item.Name === "MSISDN" || item.Name === "Phone"
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

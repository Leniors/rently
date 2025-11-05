import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { phone, amount } = await req.json();

    // ✅ Validate input
    if (!phone || !amount) {
      return NextResponse.json(
        { error: "Phone and amount are required" },
        { status: 400 }
      );
    }

    // ✅ Get M-Pesa credentials
    const consumerKey = process.env.MPESA_CONSUMER_KEY!;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
    const shortCode = process.env.MPESA_SHORTCODE!;
    const passKey = process.env.MPESA_PASSKEY!;
    const callbackUrl =
      process.env.MPESA_CALLBACK_URL || "https://yourapp.vercel.app/api/mpesa/callback";

    // ✅ Generate Base64 Auth
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    // ✅ Request access token
    const tokenRes = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get access token", details: tokenData },
        { status: 500 }
      );
    }

    // ✅ Generate Timestamp and Password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);

    const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString("base64");

    // ✅ Prepare STK Push body
    const body = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: "Rently",
      TransactionDesc: "Property payment",
    };

    // ✅ Send STK Push request
    const stkRes = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const stkData = await stkRes.json();

    if (!stkRes.ok) {
      return NextResponse.json(
        { error: "STK Push request failed", details: stkData },
        { status: 500 }
      );
    }

    return NextResponse.json(stkData);
  } catch (err: unknown) {
    console.error("STK Push error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

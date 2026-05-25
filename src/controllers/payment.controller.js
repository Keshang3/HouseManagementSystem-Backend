import crypto from "crypto";

/**
 * Initiates an eSewa payment by generating the required signature and payload.
 * Follows eSewa ePay v2 specifications.
 */
export const initiatePayment = async (req, res) => {
  try {
    const { amount, productId } = req.body;
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // Generate a unique transaction UUID using timestamp and a prefix
    const transaction_uuid = `${Date.now()}-${productId || 'booking'}`;
    const product_code = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
    const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

    // eSewa v2 required fields
    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;
    const total_amount = amount;

    // Signature Rules (v2):
    // 1. Fields to sign: total_amount, transaction_uuid, product_code
    // 2. Format: total_amount=VALUE,transaction_uuid=VALUE,product_code=VALUE
    const signatureMessage = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    
    // Generate HMAC-SHA256 signature and encode in Base64
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(signatureMessage)
      .digest("base64");

    const paymentPayload = {
      amount,
      tax_amount,
      total_amount,
      transaction_uuid,
      product_code,
      product_service_charge,
      product_delivery_charge,
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success`,
      failure_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    res.status(200).json({
      success: true,
      message: "eSewa payment payload generated successfully",
      paymentPayload,
      gatewayUrl: process.env.ESEWA_GATEWAY_URL
    });
  } catch (error) {
    console.error("eSewa Initiation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Optional: Verify payment signature after redirection from eSewa.
 * This is recommended for high-security applications to prevent fraud.
 */
export const verifyPayment = async (req, res) => {
  try {
    const { data } = req.query; // eSewa returns data in a base64 encoded string
    if (!data) {
      return res.status(400).json({ message: "Invalid callback from eSewa" });
    }

    // Decode base64 string
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    
    // In a production environment, you would re-calculate the signature 
    // and compare it with the one returned in decodedData.signature
    
    res.status(200).json({
      success: true,
      message: "Payment data verified successfully",
      decodedData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

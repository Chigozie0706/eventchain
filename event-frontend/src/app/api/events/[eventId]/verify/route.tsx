import {
  SelfBackendVerifier,
  AttestationId,
  IConfigStorage,
  AllIds,
  DefaultConfigStore,
  VerificationConfig,
  countryCodes,
} from "@selfxyz/core";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  console.log("Received request");
  console.log(request);
  try {
    const pathParts = request.url.split("/");
    const eventId = pathParts[pathParts.indexOf("events") + 1];

    const url = new URL(request.url);
    const minimumAge = Number(url.searchParams.get("minimumAge")) || 0;

    const { attestationId, proof, publicSignals, userContextData } =
      await request.json();

    const NGROK_URL = process.env.NEXT_PUBLIC_SELF_ENDPOINT;

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        {
          message:
            "Proof, publicSignals, attestationId and userContextData are required",
        },
        { status: 400 }
      );
    }

    const disclosures_config: VerificationConfig = {
      excludedCountries: [],
      ofac: false,
      minimumAge,
    };
    const configStore = new DefaultConfigStore(disclosures_config);

    // Initialize verifier with V2 constructor
    const selfBackendVerifier = new SelfBackendVerifier(
      process.env.NEXT_PUBLIC_SELF_SCOPE as string,
      `${NGROK_URL}/api/events/${eventId}/verify`,
      process.env.NEXT_PUBLIC_SELF_ENABLE_MOCK_PASSPORT === "true",
      AllIds, // Accept all document types
      configStore,
      "hex" // Match your frontend userIdType
    );

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );
    if (!result.isValidDetails.isValid) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          message: "Verification failed",
          details: result.isValidDetails,
        },
        { status: 500 }
      );
    }

    if (result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "success",
        result: result.isValidDetails.isValid,
        credentialSubject: result.discloseOutput,
      });
    } else {
      //verificatio failed
      return NextResponse.json({
        status: "error",
        result: false,
        reason: "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: result.isValidDetails,
      });
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json(
      {
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
        error_code: "UNKNOWN_ERROR",
      },
      { status: 200 }
    );
  }
}

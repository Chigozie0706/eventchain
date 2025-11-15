import { NextRequest, NextResponse } from "next/server";
import {
  countryCodes,
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
  VerificationConfig,
} from "@selfxyz/core";

export async function POST(req: NextRequest) {
  console.log("Received request");
  console.log(req);
  try {
    const pathParts = req.url.split("/");
    const eventId = pathParts[pathParts.indexOf("events") + 1];

    const url = new URL(req.url);
    const minimumAge = Number(url.searchParams.get("minimumAge")) || 0;

    const { attestationId, proof, publicSignals, userContextData } =
      await req.json();

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
      minimumAge: 18,
    };
    const configStore = new DefaultConfigStore(disclosures_config);

    const selfBackendVerifier = new SelfBackendVerifier(
      "self-workshop",
      process.env.NEXT_PUBLIC_SELF_ENDPOINT || "",
      true,
      AllIds,
      configStore,
      "hex"
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
      return NextResponse.json({
        status: "error",
        result: result.isValidDetails.isValid,
        message: "Verification failed",
        details: result,
      });
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

import {
  SelfBackendVerifier,
  AttestationId,
  IConfigStorage,
  AllIds,
  DefaultConfigStore,
  VerificationConfig,
  countryCodes,
} from "@selfxyz/core";
import {
  countries,
  Country3LetterCode,
  SelfAppDisclosureConfig,
} from "@selfxyz/common";

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

    const saveOptions = (await configStore.getConfig(
      result.userData.userIdentifier
    )) as unknown as SelfAppDisclosureConfig;

    if (result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "success",
        result: result.isValidDetails.isValid,
        credentialSubject: result.discloseOutput,
        verificationOptions: {
          minimumAge: saveOptions.minimumAge,
          ofac: saveOptions.ofac,
          excludedCountries: saveOptions.excludedCountries?.map(
            (countryName) => {
              const entry = Object.entries(countryCodes).find(
                ([_, name]) => name === countryName
              );
              return entry ? entry[0] : countryName;
            }
          ),
        },
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

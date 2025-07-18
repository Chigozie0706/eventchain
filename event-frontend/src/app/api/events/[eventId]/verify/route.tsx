import { countries, SelfBackendVerifier } from "@selfxyz/core";
import { NextResponse, NextRequest } from "next/server";

// Define interface for validation details based on actual API response
interface ValidationDetails {
  isValidScope: boolean;
  isValidAttestationId: boolean;
  isValidProof: boolean;
  isValidNationality: boolean;
  [key: string]: boolean | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const pathParts = request.url.split("/");
    const eventId = pathParts[pathParts.indexOf("events") + 1];

    const url = new URL(request.url);
    const minimumAge = Number(url.searchParams.get("minimumAge"));

    const body = await request.json();
    const { proof, publicSignals } = body;

    if (!proof || !publicSignals) {
      // Return plain text error message
      return new NextResponse("Proof and publicSignals are required", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    const NGROK_URL = process.env.NEXT_PUBLIC_SELF_ENDPOINT;

    const configuredVerifier = new SelfBackendVerifier(
      process.env.NEXT_PUBLIC_SELF_SCOPE as string,
      `${NGROK_URL}/api/events/${eventId}/verify`,
      "hex",
      process.env.NEXT_PUBLIC_SELF_ENABLE_MOCK_PASSPORT === "true" // Enable mock passport based on env config
    ).setMinimumAge(minimumAge);

    //.excludeCountries(countries.FRANCE);

    // Define the result type that maps to what's returned by the verify method
    type VerifyResult = {
      isValid: boolean;
      isValidDetails?: ValidationDetails;
      credentialSubject?: Record<string, string | boolean | number | undefined>;
      error?: unknown;
    };

    const result = (await configuredVerifier.verify(
      proof,
      publicSignals
    )) as VerifyResult;
    console.log("Verification result:", result);
    console.log("credentialSubject", result.credentialSubject);

    if (result.isValid) {
      // Verification successful, return proper JSON response
      return NextResponse.json({
        status: "success",
        result: result.isValid,
      });
    }

    // Create a formatted error message with all validation issues
    const errorMessage = getAllErrorMessages(result, minimumAge);
    console.log("errorMessage", errorMessage);

    // Return plain text error message
    return new NextResponse(errorMessage, {
      status: 400,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error verifying proof:", error);
    // Return plain text error message
    return new NextResponse(
      error instanceof Error ? error.message : "Unknown error",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }
    );
  }
}

// Get a formatted error message containing all validation issues
function getAllErrorMessages(
  result: {
    isValid: boolean;
    isValidDetails?: ValidationDetails;
    credentialSubject?: Record<string, string | boolean | number | undefined>;
    error?: unknown;
  },
  minimumAge: number
): string {
  const errors: string[] = [];
  const details = result.isValidDetails || ({} as ValidationDetails);
  const credentialSubject = result.credentialSubject || {};

  // Check core validation issues from isValidDetails
  if (details.isValidProof === false) {
    errors.push(
      "Invalid verification proof. Please try scanning the QR code again."
    );
  }

  if (details.isValidScope === false) {
    errors.push("The verification scope is invalid.");
  }

  // if (details.isValidAttestationId === false) {
  //   errors.push("Your attestation couldn't be verified.");
  // }

  // if (details.isValidNationality === false) {
  //   errors.push("Your nationality couldn't be verified.");
  // }

  // Check credentialSubject for additional information
  // Age verification check

  if (credentialSubject.older_than === "0") {
    errors.push(
      `Age verification failed. You must be at least ${minimumAge} years old.`
    );
  }

  // OFAC checks
  if (
    credentialSubject.name_and_dob_ofac === false ||
    credentialSubject.name_and_yob_ofac === false ||
    credentialSubject.passport_no_ofac === false
  ) {
    errors.push("Verification failed due to OFAC restrictions.");
  }

  // Country check - infer from the config
  // Since we excluded France in the verifier configuration
  if (credentialSubject.nationality === "FRA") {
    errors.push("Your country (France) is not eligible for this verification.");
  }

  // Check for any other validation issues in details
  for (const [key, value] of Object.entries(details)) {
    // Skip keys we've already processed
    if (
      key === "isValidProof" ||
      key === "isValidScope" ||
      key === "isValidAttestationId" ||
      key === "isValidNationality"
    ) {
      continue;
    }

    if (value === false) {
      // Convert camelCase to readable format: isValidSomething -> Something verification failed
      const readableKey = key
        .replace(/^isValid/, "")
        .replace(/([A-Z])/g, " $1")
        .trim();
      errors.push(`${readableKey} verification failed.`);
    }
  }

  // If no specific errors were found, check if there's an error message
  if (errors.length === 0 && result.error) {
    if (typeof result.error === "string") {
      return result.error;
    }

    if (result.error && typeof result.error === "object") {
      return JSON.stringify(result.error);
    }

    return "Verification failed. Please try again.";
  }

  // If still no errors found, provide a generic message
  if (errors.length === 0) {
    return "Verification failed. Please try again.";
  }

  // Format the errors with numbers if there are multiple
  if (errors.length === 1) {
    return errors[0];
  }

  return errors.map((error, index) => `${index + 1}. ${error}`).join("\n");
}

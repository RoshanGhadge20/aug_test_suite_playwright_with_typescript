import { env } from "../../config/env";
import { getTargetEnv } from "../../config/environments";
import { resolve } from "path";

/**
 * Get file paths for KYC document uploads from environment configuration.
 * Resolves relative paths to absolute paths from project root.
 */
export interface KycFilePaths {
  panCardPath?: string;
  aadhaarPath?: string;
  signaturePath?: string;
  imagePath?: string;
}

export function getKycFilePaths(envName?: string): KycFilePaths {
  const target = envName || getTargetEnv();
  const prefix = target.toUpperCase();

  const panCardPath = env[`${prefix}_PAN_CARD_PATH` as keyof typeof env];
  const aadhaarPath = env[`${prefix}_AADHAAR_PATH` as keyof typeof env];
  const signaturePath = env[`${prefix}_SIGNATURE_PATH` as keyof typeof env];
  const imagePath = env[`${prefix}_IMAGE_PATH` as keyof typeof env];

  return {
    panCardPath: panCardPath
      ? resolve(process.cwd(), panCardPath as string)
      : undefined,
    aadhaarPath: aadhaarPath
      ? resolve(process.cwd(), aadhaarPath as string)
      : undefined,
    signaturePath: signaturePath
      ? resolve(process.cwd(), signaturePath as string)
      : undefined,
    imagePath: imagePath
      ? resolve(process.cwd(), imagePath as string)
      : undefined,
  };
}
/**
 * Get individual file path with validation.
 * Throws error if path is not configured.
 */
export function getPanCardPath(envName?: string): string {
  const paths = getKycFilePaths(envName);
  if (!paths.panCardPath) {
    throw new Error(
      `PAN card path not configured. Set ${getTargetEnv().toUpperCase()}_PAN_CARD_PATH in .env`,
    );
  }
  return paths.panCardPath;
}

export function getAadhaarPath(envName?: string): string {
  const paths = getKycFilePaths(envName);
  if (!paths.aadhaarPath) {
    throw new Error(
      `Aadhaar path not configured. Set ${getTargetEnv().toUpperCase()}_AADHAAR_PATH in .env`,
    );
  }
  return paths.aadhaarPath;
}

export function getSignaturePath(envName?: string): string {
  const paths = getKycFilePaths(envName);
  if (!paths.signaturePath) {
    throw new Error(
      `Signature path not configured. Set ${getTargetEnv().toUpperCase()}_SIGNATURE_PATH in .env`,
    );
  }
  return paths.signaturePath;
}
export function getImagePath(envName?: string): string {
  const paths = getKycFilePaths(envName);
  if (!paths.imagePath) {
    throw new Error(
      `Image path not configured. Set ${getTargetEnv().toUpperCase()}_IMAGE_PATH in .env`,
    );
  }
  return paths.imagePath;
}

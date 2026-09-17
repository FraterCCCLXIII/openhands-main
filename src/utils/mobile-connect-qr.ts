import QRCode from "qrcode";

export async function mobileConnectQrDataUrl(
  pairingUrl: string,
): Promise<string> {
  return QRCode.toDataURL(pairingUrl, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

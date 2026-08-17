import { NextResponse } from 'next/server'

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQ1iNElO3jClJimv+nrDcVbTPskKp
UgkGUFhUtYRRbAIIgJ6RyATEI40W+Fmf/1x0cubJsjtSCtR799tEVRS6Bw==
-----END PUBLIC KEY-----`

export async function GET() {
  return new NextResponse(PUBLIC_KEY, {
    headers: { 'Content-Type': 'application/x-pem-file' },
  })
}

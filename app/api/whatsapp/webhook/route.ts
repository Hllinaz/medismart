import { NextResponse } from 'next/server';

// Este token debe coincidir exactamente con el que pongas en la web de Meta
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'medismart-verify-2026';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verificamos si Meta está enviando la solicitud correcta
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('¡Webhook verificado con éxito por Meta!');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();

  // Navegar por la estructura del JSON de Meta para extraer el mensaje
  if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
    const message = body.entry[0].changes[0].value.messages[0];
    const sender = message.from;
    const text = message.text?.body;

    console.log(`\n=================================`);
    console.log(`📩 Mensaje entrante de: ${sender}`);
    console.log(`💬 Texto: ${text}`);
    console.log(`=================================\n`);
  }

  // Meta exige que siempre devolvamos un 200 OK rápidamente
  return NextResponse.json({ status: 'ok' });
}
export async function POST() {

    const mensaje = "Hola Juan, recuerda tu cita mañana a las 2:30 PM";

    const response = await fetch(
        "https://graph.facebook.com/v18.0/TU_NUMERO_ID/messages",
        {
            method: "POST",
            headers: {
                "Authorization": "Bearer TU_TOKEN",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: "573001112233",
                type: "text",
                text: {
                    body: mensaje
                }
            })
        }
    );

    const data = await response.json();

    return Response.json(data);
}   
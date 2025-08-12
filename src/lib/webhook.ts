export async function sendToWebhook(payload: unknown) {
  const url = import.meta.env.VITE_WEBHOOK_URL;
  if (!url) throw new Error("VITE_WEBHOOK_URL não definida");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "ficha-cadastral", data: payload }),
  });

  if (!res.ok) throw new Error(`Falha ao enviar: ${res.status}`);
  return res.json().catch(() => ({}));
}

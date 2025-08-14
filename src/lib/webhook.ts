// src/lib/webhook.ts
export async function sendToWebhook(data: any, files: File[] = []) {
  const url = import.meta.env.VITE_WEBHOOK_URL;
  if (!url) throw new Error("VITE_WEBHOOK_URL não definida");

  let res: Response;

  if (files.length > 0) {
    // Envia multipart: JSON (como string) + arquivos
    const form = new FormData();
    form.append("source", "ficha-cadastral");
    form.append("data", JSON.stringify(data));
    files.forEach((f) => form.append("anexos", f, f.name));

    res = await fetch(url, {
      method: "POST",
      body: form, // não definir Content-Type; o browser define o boundary
      mode: "cors",
    });
  } else {
    // Envia JSON puro (fluxo atual)
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "ficha-cadastral", data }),
      mode: "cors",
    });
  }

  if (!res.ok) throw new Error(`Falha ao enviar: ${res.status}`);

  // tenta parsear JSON; se não vier JSON, retorna um objeto simples
  try {
    return await res.json();
  } catch {
    return { success: res.ok, status: res.status };
  }
}

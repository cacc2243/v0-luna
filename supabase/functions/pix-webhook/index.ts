// Supabase Edge Function: pix-webhook
//
// Atua como um REPASSADOR (proxy) fino. Recebe o webhook de pagamento dos
// gateways (Bynet e SigiloPay) e encaminha o corpo, sem alteracoes, para a
// rota /api/pix/webhook do site Next.js, onde vive TODA a logica de negocio
// (marcar pago, desbloquear chat/presentes/verificacao, boost, Facebook
// Purchase, e-mails e notificacoes).
//
// Beneficio: a URL do webhook fica estavel no Supabase
// (https://<ref>.supabase.co/functions/v1/pix-webhook) e nao depende do
// dominio/deploy do site, enquanto a logica permanece centralizada e
// testavel no proprio projeto.
//
// Variavel de ambiente necessaria (secret da function):
//   SITE_WEBHOOK_URL = https://lunaprive.live/api/pix/webhook

const DEFAULT_TARGET = "https://lunaprive.live/api/pix/webhook";

Deno.serve(async (req: Request) => {
  // Healthcheck simples (GET) para validacao no painel dos gateways.
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ status: "ok", message: "pix-webhook proxy ativo" }),
      { headers: { "content-type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const target = Deno.env.get("SITE_WEBHOOK_URL") || DEFAULT_TARGET;

  // Le o corpo bruto para repassar exatamente o que o gateway enviou.
  const rawBody = await req.text();

  try {
    const resp = await fetch(target, {
      method: "POST",
      headers: {
        "content-type": req.headers.get("content-type") || "application/json",
        // Marca a origem para depuracao no site.
        "x-forwarded-by": "supabase-edge-pix-webhook",
      },
      body: rawBody,
    });

    const text = await resp.text();

    // Repassa status e corpo da resposta do site de volta ao gateway.
    return new Response(text, {
      status: resp.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[pix-webhook] Falha ao repassar para o site:", err);
    // 502: erro ao alcancar o destino. O gateway tende a re-tentar.
    return new Response(
      JSON.stringify({ error: "Falha ao repassar webhook para o site" }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
});

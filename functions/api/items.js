export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, name, qty, created_at FROM items ORDER BY id DESC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    const name = String(body?.name ?? "").trim();
    const qty = Number.isFinite(body?.qty) ? Math.trunc(body.qty) : Number(body?.qty);

    if (!name) {
      return new Response(JSON.stringify({ error: "name is required" }), { status: 400 });
    }
    if (!Number.isFinite(qty)) {
      return new Response(JSON.stringify({ error: "qty must be a number" }), { status: 400 });
    }

    const stmt = env.DB.prepare("INSERT INTO items (name, qty) VALUES (?, ?)").bind(name, qty);
    const res = await stmt.run();

    return new Response(JSON.stringify({ ok: true, id: res?.meta?.last_row_id ?? null }), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
}


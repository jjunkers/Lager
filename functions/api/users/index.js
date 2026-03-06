import { hashPassword } from '../../utils/auth';

export async function onRequestGet({ request, env }) {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    if (role !== 'admin' && role !== 'superuser') {
        return new Response(JSON.stringify({ error: 'Kun administratorer kan se brugerlisten.' }), { status: 403 });
    }

    try {
        const results = await env.DB.prepare(
            'SELECT id, username, role, full_name, phone_number, is_active, require_change_password, whatsapp_sent, created_at FROM users ORDER BY created_at DESC'
        ).all();

        return new Response(JSON.stringify(results.results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

export async function onRequestPost({ request, env }) {
    try {
        const { username, password, role, full_name, phone_number, currentUserRole, whatsapp_sent } = await request.json();

        if (currentUserRole !== 'admin' && currentUserRole !== 'superuser') {
            return new Response(JSON.stringify({ error: 'Kun administratorer kan oprette brugere.' }), { status: 403 });
        }

        if (!username || !password) {
            return new Response(JSON.stringify({ error: 'Username and password form required' }), { status: 400 });
        }

        // Check if user exists
        const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
        if (existing) {
            return new Response(JSON.stringify({ error: 'Username already exists' }), { status: 409 });
        }

        const hashedPassword = await hashPassword(password);

        const result = await env.DB.prepare(`
      INSERT INTO users (username, password, role, full_name, phone_number, is_active, require_change_password, whatsapp_sent)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?)
    `).bind(username, hashedPassword, role || 'user', full_name || username, phone_number || null, whatsapp_sent || 0).run();

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

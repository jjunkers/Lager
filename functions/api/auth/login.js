import { verifyPassword } from '../../utils/auth';

export async function onRequestPost({ request, env }) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return new Response(JSON.stringify({ error: 'Missing credentials' }), { status: 400 });
        }

        // 1. Check Database first
        let user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();

        let isValid = false;
        if (user) {
            // Check password (hashed or plaintext fallback for migration)
            if (user.password.startsWith('pbkdf2:')) {
                isValid = await verifyPassword(password, user.password);
            } else if (user.password === password) {
                isValid = true;
            }

            if (!isValid) {
                user = null; // invalid password
            }
        }

        // 2. Fallback: Check if it's the master admin from environment
        if (!isValid && username === 'admin' && env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD) {
            user = {
                id: 9999,
                username: 'admin',
                role: 'admin',
                name: 'Administrator (Recovery)',
                full_name: 'System Administrator',
                require_change_password: 0
            };
            isValid = true;
        }

        if (!isValid || !user) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
        }

        // 3. Check if user is active
        if (user.is_active === 0) {
            return new Response(JSON.stringify({ error: 'Brugeren er deaktiveret. Kontakt administrator.' }), { status: 403 });
        }

        // Don't return password
        const { password: _, ...safeUser } = user;

        return new Response(JSON.stringify(safeUser), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

import { hashPassword } from '../../utils/auth';

export async function onRequestPost({ request, env }) {
    try {
        const { username, full_name, phone_number, role, is_active, password, requireChangePassword, whatsapp_sent, currentUserRole, currentUsername } = await request.json();

        // Security check:
        // 1. Admin can update anyone.
        // 2. Users can only update themselves (username === currentUsername).
        // 3. Non-admins cannot change roles or is_active for anyone.

        const isSelfUpdate = username === currentUsername;
        const isAdmin = currentUserRole === 'admin' || currentUserRole === 'superuser';

        if (!isAdmin && !isSelfUpdate) {
            return new Response(JSON.stringify({ error: 'Du har ikke rettigheder til at rette i denne bruger.' }), { status: 403 });
        }

        if (!isAdmin) {
            // Non-admins cannot change these fields
            if (role !== undefined || is_active !== undefined) {
                return new Response(JSON.stringify({ error: 'Kun administratorer kan ændre roller eller status.' }), { status: 403 });
            }
        }

        if (!username) {
            return new Response(JSON.stringify({ error: 'Username required' }), { status: 400 });
        }

        // Build dynamic update query
        const sets = [];
        const params = [];

        if (full_name !== undefined) {
            sets.push('full_name = ?');
            params.push(full_name);
        }
        if (phone_number !== undefined) {
            sets.push('phone_number = ?');
            params.push(phone_number);
        }
        if (role !== undefined) {
            sets.push('role = ?');
            params.push(role);
        }
        if (is_active !== undefined) {
            sets.push('is_active = ?');
            params.push(is_active);
        }
        if (requireChangePassword !== undefined) {
            sets.push('require_change_password = ?');
            params.push(requireChangePassword ? 1 : 0);
        }
        if (whatsapp_sent !== undefined) {
            sets.push('whatsapp_sent = ?');
            params.push(whatsapp_sent ? 1 : 0);
        }
        if (password && password.length > 0) {
            sets.push('password = ?');
            const hashedPassword = await hashPassword(password);
            params.push(hashedPassword);
            // If changing password manually from admin, maybe reset requireChangePassword?
            // Actually, keep it logic-defined by the caller.
        }

        if (sets.length === 0) {
            return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });
        }

        const query = `UPDATE users SET ${sets.join(', ')} WHERE username = ? `;
        params.push(username);

        const result = await env.DB.prepare(query).bind(...params).run();

        return new Response(JSON.stringify({ success: true, result }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}

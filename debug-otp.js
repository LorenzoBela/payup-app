async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com' })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Body:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();

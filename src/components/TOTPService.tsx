import { TOTP, Secret } from 'otpauth';

export class TOTPService {
    static generateSecret(email: string): { secret: string; qrCodeUrl: string } {
        // Generate a random secret
        const secret = new Secret({ size: 20 });

        // Create TOTP instance
        const totp = new TOTP({
            issuer: 'e-Patrol Log',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secret,
        });

        return {
            secret: secret.base32,
            qrCodeUrl: totp.toString()
        };
    }

    static verifyToken(secret: string, token: string, email: string): boolean {
        try {
            // Create TOTP instance from base32 secret
            const totp = new TOTP({
                issuer: 'e-Patrol Log',
                label: email,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: Secret.fromBase32(secret),
            });

            // Verify with time window tolerance (±1 period = ±30 seconds)
            const delta = totp.validate({
                token: token,
                window: 1
            });

            return delta !== null;
        } catch (error) {
            console.error('TOTP verification error:', error);
            return false;
        }
    }

    static generateToken(secret: string): string {
        try {
            const totp = new TOTP({
                issuer: 'e-Patrol Log',
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: Secret.fromBase32(secret),
            });

            return totp.generate();
        } catch (error) {
            console.error('TOTP generation error:', error);
            return '';
        }
    }
}
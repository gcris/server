import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Shield, Smartphone } from 'lucide-react'

interface GoogleAuthProps {
    user: any
    onAuthComplete: () => void
}

export default function GoogleAuth({ user, onAuthComplete }: GoogleAuthProps) {
    const [totpCode, setTotpCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [showSetup, setShowSetup] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        checkTotpSetup()
    }, [user])

    const checkTotpSetup = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('totp_secret')
                .eq('id', user.id)
                .single()

            if (error) throw error

            if (!data.totp_secret) {
                setShowSetup(true)
                generateTotpSecret()
            }
        } catch (error) {
            console.error('Error checking TOTP setup:', error)
        }
    }

    const generateTotpSecret = async () => {
        try {
            // Generate a simple base32 secret (in real app, use proper crypto library)
            const secret = Array.from({ length: 16 }, () =>
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
            ).join('')

            const issuer = 'e-Patroller'
            const accountName = user.username
            const qrUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`

            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`)

            // Save secret to database
            const { error } = await supabase
                .from('users')
                .update({ totp_secret: secret })
                .eq('id', user.id)

            if (error) throw error
        } catch (error) {
            console.error('Error generating TOTP secret:', error)
            toast({
                title: "Error",
                description: "Failed to generate authenticator setup",
                variant: "destructive"
            })
        }
    }

    const verifyTotpCode = async () => {
        if (!totpCode || totpCode.length !== 6) {
            toast({
                title: "Invalid Code",
                description: "Please enter a 6-digit code",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        try {
            const { TOTPService } = await import('./TOTPService');

            const isValid = TOTPService.verifyToken(user.totp_secret, totpCode, user.email);

            toast({
                title: `Authentication ${isValid ? 'successfull' : 'failed'}`,
                description: isValid ? "Welcome to the admin panel" : "Invalid authentication code",
                variant: isValid ? "default" : "destructive"
            })
            if (isValid) {
                onAuthComplete()
            }

        } catch (error) {
            toast({
                title: "Authentication failed",
                description: "Invalid authentication code",

            })
        } finally {
            setLoading(false)
        }
    }

    const handleSkipSetup = () => {
        setShowSetup(false)
        onAuthComplete()
    }

    if (showSetup) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
                <Card className="w-full max-w-md shadow-2xl border-0 bg-white/10 backdrop-blur-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
                            <Shield className="mr-2 h-6 w-6" />
                            Setup Authenticator
                        </CardTitle>
                        <p className="text-gray-300">Secure your account with 2FA</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <p className="text-white text-sm mb-4">
                                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                            </p>
                            {qrCodeUrl && (
                                <img
                                    src={qrCodeUrl}
                                    alt="QR Code"
                                    className="mx-auto mb-4 bg-white p-2 rounded"
                                />
                            )}
                        </div>

                        <div>
                            <Label htmlFor="setup-code" className="text-white">Enter verification code</Label>
                            <Input
                                id="setup-code"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                                placeholder="123456"
                                maxLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Button
                                onClick={verifyTotpCode}
                                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Complete Setup'}
                            </Button>

                            <Button
                                onClick={handleSkipSetup}
                                variant="outline"
                                className="w-full border-white/30 text-white hover:bg-white/10"
                            >
                                Skip for now
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/10 backdrop-blur-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white flex items-center justify-center">
                        <Smartphone className="mr-2 h-6 w-6" />
                        Two-Factor Authentication
                    </CardTitle>
                    <p className="text-gray-300">Enter the code from your authenticator app</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="totp-code" className="text-white">Authentication Code</Label>
                            <Input
                                id="totp-code"
                                value={totpCode}
                                onChange={(e) => setTotpCode(e.target.value)}
                                className="bg-white/20 border-white/30 text-white placeholder:text-gray-300 text-center text-lg tracking-widest"
                                placeholder="123456"
                                maxLength={6}
                                autoComplete="one-time-code"
                            />
                        </div>

                        <Button
                            onClick={verifyTotpCode}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            disabled={loading || totpCode.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
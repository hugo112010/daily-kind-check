import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(6);

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { signIn, signUp, user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = t('auth.email') + ' invalide';
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = t('auth.password_min');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast({
            title: t('common.error'),
            description: t('auth.login_error'),
            variant: 'destructive',
          });
        }
      } else {
        const { error } = await signUp(email.trim(), password);
        if (error) {
          toast({
            title: t('common.error'),
            description: error.message.includes('already registered') 
              ? 'Cet email est déjà utilisé / This email is already in use'
              : t('auth.signup_error'),
            variant: 'destructive',
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Language toggle */}
      <button
        onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
        className="absolute top-4 right-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg focus-accessible"
      >
        <Globe className="h-5 w-5" />
        <span className="font-medium">{language === 'fr' ? 'EN' : 'FR'}</span>
      </button>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl md:text-3xl">{t('app.name')}</CardTitle>
          <CardDescription className="text-lg">
            {isLogin ? t('auth.login') : t('auth.signup')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">
                {t('auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="h-14 text-lg focus-accessible"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">
                {t('auth.password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-14 text-lg focus-accessible"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? t('common.loading') : isLogin ? t('auth.login') : t('auth.signup')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium focus-accessible p-2 rounded"
            >
              {isLogin ? t('auth.no_account') : t('auth.have_account')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

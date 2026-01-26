import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/lib/errorHandler';
import { CheckCircle, Bell, Lock, Globe } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';

const onboardingSchema = z.object({
  name: z.string().trim().min(1).max(100),
  contactName: z.string().trim().min(1).max(100),
  contactEmail: z.string().trim().email().max(255),
  intervalHours: z.number().min(1).max(168),
});

const Onboarding: React.FC = () => {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [intervalHours, setIntervalHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { t, language, setLanguage } = useLanguage();
  const { updateProfile } = useProfile();
  const { addContact } = useEmergencyContacts();
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    {
      icon: CheckCircle,
      title: t('onboarding.step1.title'),
      description: t('onboarding.step1.desc'),
    },
    {
      icon: Bell,
      title: t('onboarding.step2.title'),
      description: t('onboarding.step2.desc'),
    },
    {
      icon: Lock,
      title: t('onboarding.step3.title'),
      description: t('onboarding.step3.desc'),
    },
  ];

  const validate = () => {
    const result = onboardingSchema.safeParse({
      name: name.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      intervalHours,
    });

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      // Add emergency contact
      const { error: contactError } = await addContact(contactName.trim(), contactEmail.trim(), true);
      if (contactError) throw contactError;

      // Update profile
      const { error: profileError } = await updateProfile({
        name: name.trim(),
        checkin_interval_hours: intervalHours,
        has_completed_onboarding: true,
        last_checkin_at: new Date().toISOString(),
        preferred_language: language,
      });
      if (profileError) throw profileError;

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: getSafeErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer withBottomNav={false}>
      {/* Language toggle */}
      <button
        onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
        className="absolute top-4 right-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg focus-accessible"
      >
        <Globe className="h-5 w-5" />
        <span className="font-medium">{language === 'fr' ? 'EN' : 'FR'}</span>
      </button>

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {t('onboarding.title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('onboarding.subtitle')}
        </p>
      </div>

      {/* Steps explanation */}
      <div className="grid gap-4 mb-8">
        {steps.map((step, index) => (
          <Card key={index} className="border-2">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-medium">
            {t('onboarding.your_name')}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('onboarding.your_name_placeholder')}
            className="h-14 text-lg focus-accessible"
          />
          {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName" className="text-base font-medium">
            {t('onboarding.contact_name')}
          </Label>
          <Input
            id="contactName"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={t('onboarding.contact_name_placeholder')}
            className="h-14 text-lg focus-accessible"
          />
          {errors.contactName && <p className="text-destructive text-sm">{errors.contactName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail" className="text-base font-medium">
            {t('onboarding.contact_email')}
          </Label>
          <Input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t('onboarding.contact_email_placeholder')}
            className="h-14 text-lg focus-accessible"
          />
          {errors.contactEmail && <p className="text-destructive text-sm">{errors.contactEmail}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interval" className="text-base font-medium">
            {t('onboarding.interval')}
          </Label>
          <Input
            id="interval"
            type="number"
            min={1}
            max={168}
            value={intervalHours}
            onChange={(e) => setIntervalHours(parseInt(e.target.value) || 24)}
            className="h-14 text-lg focus-accessible"
          />
          <p className="text-sm text-muted-foreground">
            {t('onboarding.interval_help')}
          </p>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-16 text-xl font-bold"
          disabled={loading}
        >
          {loading ? t('common.loading') : t('onboarding.start')}
        </Button>
      </form>
    </PageContainer>
  );
};

export default Onboarding;

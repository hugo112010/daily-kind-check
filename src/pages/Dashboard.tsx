import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCheckins } from '@/hooks/useCheckins';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, AlertTriangle, LogOut } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import BottomNav from '@/components/layout/BottomNav';

const Dashboard: React.FC = () => {
  const [checkingIn, setCheckingIn] = useState(false);
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { performCheckin } = useCheckins();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect to onboarding if not completed
  React.useEffect(() => {
    if (!profileLoading && profile && !profile.has_completed_onboarding) {
      navigate('/onboarding');
    }
  }, [profile, profileLoading, navigate]);

  const { timeRemaining, status, statusColor, statusIcon } = useMemo(() => {
    if (!profile?.last_checkin_at) {
      return {
        timeRemaining: null,
        status: 'unknown',
        statusColor: 'text-muted-foreground',
        statusIcon: Clock,
      };
    }

    const lastCheckin = new Date(profile.last_checkin_at);
    const deadline = new Date(lastCheckin.getTime() + profile.checkin_interval_hours * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) {
      return {
        timeRemaining: { hours: 0, minutes: 0 },
        status: 'overdue',
        statusColor: 'text-destructive',
        statusIcon: AlertTriangle,
      };
    } else if (diffHours < 2) {
      return {
        timeRemaining: { hours: diffHours, minutes: diffMinutes },
        status: 'soon',
        statusColor: 'text-warning',
        statusIcon: Clock,
      };
    } else {
      return {
        timeRemaining: { hours: diffHours, minutes: diffMinutes },
        status: 'ok',
        statusColor: 'text-success',
        statusIcon: CheckCircle,
      };
    }
  }, [profile]);

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      const { error } = await performCheckin();
      if (error) throw error;

      await refetchProfile();

      toast({
        title: t('dashboard.checkin_success'),
        description: new Date().toLocaleString(),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('dashboard.never');
    return new Date(dateString).toLocaleString();
  };

  if (profileLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">{t('common.loading')}</p>
        </div>
        <BottomNav />
      </PageContainer>
    );
  }

  const StatusIcon = statusIcon;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('dashboard.greeting')}, {profile?.name || ''}!
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors focus-accessible rounded-lg"
          title={t('auth.logout')}
        >
          <LogOut className="h-6 w-6" />
        </button>
      </div>

      {/* Status Card */}
      <Card className="mb-8 border-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusIcon className={`h-8 w-8 ${statusColor}`} />
            <span className={`text-xl font-semibold ${statusColor}`}>
              {status === 'ok' && t('dashboard.status_ok')}
              {status === 'soon' && t('dashboard.status_soon')}
              {status === 'overdue' && t('dashboard.status_overdue')}
            </span>
          </div>

          <div className="space-y-3 text-lg">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">{t('dashboard.last_checkin')}</span>
              <span className="font-medium">{formatDate(profile?.last_checkin_at || null)}</span>
            </div>

            {timeRemaining && (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">{t('dashboard.next_deadline')}</span>
                <span className={`font-bold text-xl ${statusColor}`}>
                  {status === 'overdue' 
                    ? t('dashboard.status_overdue')
                    : timeRemaining.hours > 0 
                      ? `${timeRemaining.hours}h ${timeRemaining.minutes}min`
                      : `${timeRemaining.minutes} ${t('dashboard.minutes_left')}`
                  }
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Big Check-in Button */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={handleCheckin}
          disabled={checkingIn}
          className="btn-xxl bg-primary hover:bg-primary/90 text-primary-foreground w-full max-w-sm h-32 rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          {checkingIn ? t('common.loading') : t('dashboard.checkin_button')}
        </Button>
      </div>

      <BottomNav />
    </PageContainer>
  );
};

export default Dashboard;

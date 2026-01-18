import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  withBottomNav?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  withBottomNav = true,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen bg-background',
        withBottomNav && 'pb-24',
        className
      )}
    >
      <div className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;

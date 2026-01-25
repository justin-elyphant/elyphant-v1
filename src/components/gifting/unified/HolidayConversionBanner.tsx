import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHapticFeedback } from '@/utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

interface HolidayConversionBannerProps {
  holidayLabel: string;
  visible: boolean;
  onConvert: () => void;
  onDismiss: () => void;
  className?: string;
}

const HolidayConversionBanner: React.FC<HolidayConversionBannerProps> = ({
  holidayLabel,
  visible,
  onConvert,
  onDismiss,
  className
}) => {
  const handleConvert = () => {
    triggerHapticFeedback('success');
    onConvert();
  };

  const handleDismiss = () => {
    triggerHapticFeedback('light');
    onDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("overflow-hidden", className)}
        >
          <div className="bg-gradient-to-r from-purple-50 to-sky-50 dark:from-purple-950/30 dark:to-sky-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-4 w-4 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  This is {holidayLabel}!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Make it an annual auto-gift?
                </p>
              </div>
              
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConvert}
                  className="h-8 px-3 bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 text-white"
                >
                  Make Recurring
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HolidayConversionBanner;

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon: LucideIcon;
  gradient?: {
    from: string;
    to: string;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  gradient,
  onClick,
}) => {
  const gradientStyle = gradient
    ? { background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)` }
    : undefined;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        hover={!!onClick} 
        className={`cursor-${onClick ? 'pointer' : 'default'} relative overflow-hidden`}
        onClick={onClick}
      >
        {gradient && (
          <div 
            className="absolute inset-0 opacity-5"
            style={gradientStyle}
          />
        )}
        
        <div className="relative flex items-center">
          <div className="flex-shrink-0">
            <div 
              className="flex items-center justify-center h-12 w-12 rounded-lg text-white"
              style={gradientStyle || { backgroundColor: '#3b82f6' }}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
          
          <div className="ml-4 flex-1">
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-gray-900">
                {value}
              </p>
              {change && (
                <span
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change.type === 'positive'
                      ? 'text-green-600'
                      : change.type === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {change.value}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-500 truncate">
              {title}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
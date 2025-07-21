import { classNames } from '@/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const baseClasses = classNames(
    'inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium',
    sizeClasses[size],
    className
  );

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={classNames(baseClasses, 'object-cover')}
      />
    );
  }

  return (
    <div className={baseClasses}>
      {fallback || '?'}
    </div>
  );
};
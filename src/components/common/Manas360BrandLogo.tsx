import { cn } from '@/lib/utils';

type Manas360BrandLogoProps = {
  className?: string;
  size?: 'sm' | 'md';
  showTagline?: boolean;
  showIcon?: boolean;
  iconSrc?: string;
};

const manasGradient = 'linear-gradient(180deg, #6FA8DC 0%, #1A3D6B 100%)';
const threeSixtyGradient = 'linear-gradient(180deg, #A8D948 0%, #1F5C2E 100%)';

export function Manas360BrandLogo({
  className,
  size = 'md',
  showTagline = true,
  showIcon = false,
  iconSrc = '/AppIcon.jpeg',
}: Manas360BrandLogoProps) {
  const wordmarkClass = size === 'sm' ? 'text-[15px]' : 'text-[22px]';
  const taglineClass = size === 'sm' ? 'text-[6.5px] tracking-[0.14em]' : 'text-[8px] tracking-[0.16em]';
  const iconClass = size === 'sm' ? 'h-10 w-10 rounded-2xl' : 'h-12 w-12 rounded-2xl';

  const wordmark = (
    <div className={cn('select-none', !showIcon && className)}>
      <div
        className={cn(
          'font-display font-extrabold leading-none tracking-[-0.02em]',
          wordmarkClass,
        )}
        aria-label="MANAS360"
      >
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: manasGradient }}
        >
          MANAS
        </span>
        <span className="relative inline-block">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: threeSixtyGradient }}
          >
            360
          </span>
          <sup
            className="absolute -right-[0.45em] -top-[0.12em] text-[0.42em] font-normal leading-none text-[#3D8B3D]"
            aria-hidden="true"
          >
            ®
          </sup>
        </span>
      </div>

      {showTagline && (
        <p
          className={cn(
            'mt-1 font-semibold uppercase leading-tight text-[#3D4F5F]',
            taglineClass,
          )}
        >
          Holistic Mental Wellness&nbsp;|&nbsp;Anytime Anywhere
        </p>
      )}
    </div>
  );

  if (!showIcon) {
    return wordmark;
  }

  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        className={cn('shrink-0 object-cover shadow-wellness-sm', iconClass)}
      />
      {wordmark}
    </div>
  );
}

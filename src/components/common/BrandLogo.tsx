export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
type Props = {
  size?: BrandLogoSize;
  variant?: 'badge' | 'icon';
  glow?: boolean;
  pulse?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
};
const sizes = { xs: 20, sm: 28, md: 36, lg: 48, xl: 64, '2xl': 96 };

export function BrandLogo({ size = 'md', className, onClick, title = 'SafarNama' }: Props) {
  const px = typeof size === 'number' ? size : sizes[size];
  const logo = <img className={className} src="/logo.svg" width={px} height={px} alt={onClick ? '' : title} />;
  return onClick ? <button type="button" aria-label={title} onClick={onClick}>{logo}</button> : logo;
}

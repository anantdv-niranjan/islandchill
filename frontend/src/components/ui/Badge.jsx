import React from 'react';
import { X } from 'lucide-react';

/**
 * Supported Badge Variants
 * - primary: Brand accent gold/amber shades
 * - secondary: Slate/grey neutral shades
 * - success: Emerald green shades
 * - warning: Amber/yellow warning shades
 * - error: Rose/red danger shades
 * - info: Blue informational shades
 */
export const BADGE_VARIANTS = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'purple'];
export const BADGE_SIZES = ['sm', 'md', 'lg'];
export const BADGE_APPEARANCES = ['subtle', 'solid', 'outline'];
export const BADGE_SHAPES = ['rounded', 'pill', 'square'];

/**
 * Normalizes input variant into one of the supported standard variants.
 * Handles common aliases and status strings used across the app.
 */
function normalizeVariant(variant = 'primary') {
  if (!variant || typeof variant !== 'string') return 'primary';
  const clean = variant.toLowerCase().trim();

  // Direct variants
  if (clean === 'primary' || clean === 'accent') return 'primary';
  if (clean === 'secondary' || clean === 'neutral' || clean === 'gray' || clean === 'grey' || clean === 'muted') return 'secondary';
  if (clean === 'success' || clean === 'completed' || clean === 'resolved' || clean === 'active' || clean === 'approved' || clean === 'pass' || clean === 'clean') return 'success';
  if (clean === 'warning' || clean === 'pending' || clean === 'draft' || clean === 'qc' || clean === 'high') return 'warning';
  if (clean === 'error' || clean === 'danger' || clean === 'critical' || clean === 'failed' || clean === 'rejected') return 'error';
  if (clean === 'info' || clean === 'progress' || clean === 'in progress' || clean === 'in-progress' || clean === 'in_progress' || clean === 'running' || clean === 'medium') return 'info';
  if (clean === 'purple') return 'purple';

  return 'primary';
}

/**
 * Badge Component
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Badge content text or elements
 * @param {'primary'|'secondary'|'success'|'warning'|'error'|'info'|'purple'} [props.variant='primary'] - Color variant
 * @param {'subtle'|'solid'|'outline'} [props.appearance='subtle'] - Visual style appearance
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Badge size
 * @param {'rounded'|'pill'|'square'} [props.shape='rounded'] - Corner rounding shape
 * @param {boolean} [props.pill=false] - Shorthand for shape="pill"
 * @param {boolean} [props.solid=false] - Shorthand for appearance="solid"
 * @param {boolean} [props.outline=false] - Shorthand for appearance="outline"
 * @param {boolean} [props.dot=false] - Whether to render a colored status dot indicator
 * @param {boolean} [props.pulse=false] - Whether the status dot should pulse animation
 * @param {string} [props.dotColor] - Optional manual override for dot background color
 * @param {React.ReactNode} [props.icon] - Icon component or element to display
 * @param {'left'|'right'} [props.iconPosition='left'] - Position of the icon
 * @param {Function} [props.onRemove] - Callback when dismiss/remove button is clicked
 * @param {string} [props.removeAriaLabel='Remove'] - Accessibility label for remove button
 * @param {React.ElementType} [props.as='span'] - Polymorphic component tag to render
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.CSSProperties} [props.style={}] - Additional inline styles
 */
export function Badge({
  children,
  variant = 'primary',
  appearance = 'subtle',
  size = 'md',
  shape = 'rounded',
  pill = false,
  solid = false,
  outline = false,
  dot = false,
  pulse = false,
  dotColor,
  icon,
  iconPosition = 'left',
  onRemove,
  removeAriaLabel = 'Remove',
  as: Component = 'span',
  className = '',
  style = {},
  ...rest
}) {
  const resolvedVariant = normalizeVariant(variant);

  // Resolve appearance
  let resolvedAppearance = appearance;
  if (solid) resolvedAppearance = 'solid';
  else if (outline) resolvedAppearance = 'outline';
  if (!['subtle', 'solid', 'outline'].includes(resolvedAppearance)) {
    resolvedAppearance = 'subtle';
  }

  // Resolve size
  const resolvedSize = ['sm', 'md', 'lg'].includes(size) ? size : 'md';

  // Resolve shape
  const isPill = pill || shape === 'pill';
  const shapeClass = isPill ? 'badge-shape-pill' : shape === 'square' ? 'badge-shape-square' : 'badge-shape-rounded';

  // Sizing tokens for icon & remove button
  const iconSizeMap = { sm: 11, md: 13, lg: 15 };
  const closeSizeMap = { sm: 10, md: 12, lg: 13 };
  const currentIconSize = iconSizeMap[resolvedSize];
  const currentCloseSize = closeSizeMap[resolvedSize];

  // Compose class names
  const classes = [
    'badge-base',
    `badge-${resolvedAppearance}-${resolvedVariant}`,
    `badge-size-${resolvedSize}`,
    shapeClass,
    className
  ]
    .filter(Boolean)
    .join(' ');

  // Render Icon if provided
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      // If the icon is a valid React element, clone with default size if not already set
      return (
        <span className="badge-icon">
          {React.cloneElement(icon, {
            size: icon.props.size || currentIconSize,
            'aria-hidden': 'true'
          })}
        </span>
      );
    }
    // If a component function was passed
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return (
        <span className="badge-icon">
          <IconComponent size={currentIconSize} aria-hidden="true" />
        </span>
      );
    }
    return <span className="badge-icon">{icon}</span>;
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (typeof onRemove === 'function') {
      onRemove(e);
    }
  };

  return (
    <Component className={classes} style={style} {...rest}>
      {dot && (
        <span
          className={`badge-dot ${pulse ? 'badge-dot-pulse' : ''}`}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
          aria-hidden="true"
        />
      )}

      {icon && iconPosition === 'left' && renderIcon()}

      {children !== undefined && children !== null && (
        typeof children === 'string' || typeof children === 'number' ? (
          <span>{children}</span>
        ) : (
          children
        )
      )}

      {icon && iconPosition === 'right' && renderIcon()}

      {typeof onRemove === 'function' && (
        <button
          type="button"
          className="badge-remove-btn"
          onClick={handleRemove}
          aria-label={removeAriaLabel}
          title={removeAriaLabel}
        >
          <X size={currentCloseSize} aria-hidden="true" />
        </button>
      )}
    </Component>
  );
}

export default Badge;

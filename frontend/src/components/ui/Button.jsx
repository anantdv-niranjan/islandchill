import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Supported Button Variants:
 * - primary: Brand accent gold/amber shades
 * - secondary: Slate/grey neutral shades
 * - success: Emerald green shades
 * - warning: Amber/yellow warning shades
 * - error: Rose/red danger shades (also accepts 'danger')
 * - info: Blue informational shades
 * - purple: Supplemental brand purple
 * - transparent: Transparent / link / ghost style for links and borderless buttons
 */
export const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'success',
  'warning',
  'error',
  'info',
  'purple',
  'transparent'
];

export const BUTTON_SIZES = ['sm', 'md', 'lg'];
export const BUTTON_APPEARANCES = ['solid', 'subtle', 'outline', 'transparent'];
export const BUTTON_SHAPES = ['rounded', 'pill', 'square'];

/**
 * Normalizes input variant into one of the supported standard variants.
 */
function normalizeVariant(variant = 'primary') {
  if (!variant || typeof variant !== 'string') return 'primary';
  const clean = variant.toLowerCase().trim();

  if (clean === 'primary' || clean === 'accent') return 'primary';
  if (clean === 'secondary' || clean === 'neutral' || clean === 'gray' || clean === 'grey' || clean === 'muted') return 'secondary';
  if (clean === 'success' || clean === 'completed' || clean === 'resolved' || clean === 'active' || clean === 'approved') return 'success';
  if (clean === 'warning' || clean === 'pending' || clean === 'draft' || clean === 'qc') return 'warning';
  if (clean === 'error' || clean === 'danger' || clean === 'critical' || clean === 'failed' || clean === 'rejected') return 'error';
  if (clean === 'info' || clean === 'progress' || clean === 'in progress' || clean === 'in-progress' || clean === 'running') return 'info';
  if (clean === 'purple') return 'purple';
  if (clean === 'transparent' || clean === 'link' || clean === 'ghost') return 'transparent';

  return 'primary';
}

/**
 * Button Component
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Button content
 * @param {'primary'|'secondary'|'success'|'warning'|'error'|'info'|'purple'|'transparent'} [props.variant='primary'] - Button color variant
 * @param {'solid'|'subtle'|'outline'|'transparent'} [props.appearance='solid'] - Visual appearance style
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Button size
 * @param {'rounded'|'pill'|'square'} [props.shape='rounded'] - Corner rounding shape
 * @param {boolean} [props.pill=false] - Shorthand for shape="pill"
 * @param {boolean} [props.solid=false] - Shorthand for appearance="solid"
 * @param {boolean} [props.subtle=false] - Shorthand for appearance="subtle"
 * @param {boolean} [props.outline=false] - Shorthand for appearance="outline"
 * @param {boolean} [props.link=false] - Shorthand for link styling
 * @param {boolean} [props.transparent=false] - Shorthand for variant="transparent"
 * @param {boolean} [props.iconOnly=false] - Square icon button styling
 * @param {boolean} [props.fullWidth=false] - Expands button to 100% width
 * @param {boolean} [props.loading=false] - Shows loading spinner and disables interactions
 * @param {string} [props.loadingText] - Text to show during loading
 * @param {boolean} [props.disabled=false] - Disables the button
 * @param {React.ReactNode} [props.icon] - Icon component or element to display
 * @param {'left'|'right'} [props.iconPosition='left'] - Position of the icon relative to text
 * @param {string} [props.href] - If supplied, automatically renders an <a> anchor tag
 * @param {React.ElementType} [props.as] - Polymorphic element tag (defaults to 'button' or 'a' if href provided)
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Button type attribute
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {React.CSSProperties} [props.style={}] - Additional inline styles
 */
export function Button({
  children,
  variant = 'primary',
  appearance = 'solid',
  size = 'md',
  shape = 'rounded',
  pill = false,
  solid = false,
  subtle = false,
  outline = false,
  link = false,
  transparent = false,
  iconOnly = false,
  fullWidth = false,
  loading = false,
  loadingText,
  disabled = false,
  icon,
  iconPosition = 'left',
  href,
  as,
  type = 'button',
  className = '',
  style = {},
  onClick,
  ...rest
}) {
  // Determine variant (support transparent shorthand)
  const isTransparent = transparent || link || variant === 'transparent' || variant === 'link' || variant === 'ghost';
  const resolvedVariant = isTransparent ? 'transparent' : normalizeVariant(variant);

  // Determine appearance
  let resolvedAppearance = appearance;
  if (solid) resolvedAppearance = 'solid';
  else if (subtle) resolvedAppearance = 'subtle';
  else if (outline) resolvedAppearance = 'outline';
  else if (isTransparent) resolvedAppearance = 'transparent';

  if (!BUTTON_APPEARANCES.includes(resolvedAppearance)) {
    resolvedAppearance = 'solid';
  }

  // Determine size
  const resolvedSize = BUTTON_SIZES.includes(size) ? size : 'md';

  // Determine shape
  const isPill = pill || shape === 'pill';
  const shapeClass = isPill ? 'btn-shape-pill' : shape === 'square' ? 'btn-shape-square' : '';

  // Determine if icon-only button
  const hasNoChildren = children === undefined || children === null || children === '';
  const isIconOnly = iconOnly || (hasNoChildren && !!icon);

  // Determine element tag
  const Component = as || (href ? 'a' : 'button');

  // Sizing tokens for icon & loader spinner
  const iconSizeMap = { sm: 13, md: 15, lg: 17 };
  const currentIconSize = iconSizeMap[resolvedSize];

  // Compose CSS classes
  const classes = [
    'btn-base',
    link ? 'btn-link' : `btn-${resolvedAppearance}-${resolvedVariant}`,
    `btn-size-${resolvedSize}`,
    shapeClass,
    isIconOnly ? 'btn-icon-only' : '',
    fullWidth ? 'btn-full-width' : '',
    loading ? 'btn-loading' : '',
    disabled || loading ? 'btn-disabled' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  // Icon rendering helper
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return (
        <span className="btn-icon">
          {React.cloneElement(icon, {
            size: icon.props.size || currentIconSize,
            'aria-hidden': 'true'
          })}
        </span>
      );
    }
    if (typeof icon === 'function') {
      const IconComponent = icon;
      return (
        <span className="btn-icon">
          <IconComponent size={currentIconSize} aria-hidden="true" />
        </span>
      );
    }
    return <span className="btn-icon">{icon}</span>;
  };

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (typeof onClick === 'function') {
      onClick(e);
    }
  };

  const buttonProps = {
    className: classes,
    style,
    onClick: handleClick,
    disabled: Component === 'button' ? (disabled || loading) : undefined,
    'aria-disabled': (disabled || loading) ? true : undefined,
    ...rest
  };

  if (Component === 'button') {
    buttonProps.type = type;
  } else if (Component === 'a') {
    buttonProps.href = href;
    if (disabled || loading) {
      buttonProps.tabIndex = -1;
    }
  }

  const contentText = loading && loadingText ? loadingText : children;

  return (
    <Component {...buttonProps}>
      {loading && (
        <Loader2 className="btn-spinner" size={currentIconSize} aria-hidden="true" />
      )}

      {!loading && icon && iconPosition === 'left' && renderIcon()}

      {contentText !== undefined && contentText !== null && contentText !== '' && (
        <span>{contentText}</span>
      )}

      {!loading && icon && iconPosition === 'right' && renderIcon()}
    </Component>
  );
}

export default Button;

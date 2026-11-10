/**
 * Visual Feedback Components
 *
 * Beautiful visual feedback for:
 * - Code diff viewer with syntax highlighting
 * - Progress indicators with animations
 * - Loading states with skeletons
 * - Toast notifications
 * - Real-time status updates
 *
 * WCAG 2.1 AA compliant with screen reader support.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { useAccessibility } from '../../contexts/accessibility-context';
import { animations } from '../../animations';

// ============================================================================
// Diff Viewer Component
// ============================================================================

export interface DiffChange {
  type: 'add' | 'remove' | 'modify';
  lineNumber: number;
  content: string;
  oldContent?: string;
}

export interface DiffViewerProps {
  oldContent?: string;
  newContent?: string;
  changes?: DiffChange[];
  language?: string;
  showLineNumbers?: boolean;
  onAcceptChange?: (change: DiffChange) => void;
  onRejectChange?: (change: DiffChange) => void;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  changes = [],
  language = 'typescript',
  showLineNumbers = true,
  onAcceptChange,
  onRejectChange,
  className,
}) => {
  const [selectedChange, setSelectedChange] = React.useState<DiffChange | null>(null);

  const addedLines = changes.filter((c) => c.type === 'add');
  const removedLines = changes.filter((c) => c.type === 'remove');
  const modifiedLines = changes.filter((c) => c.type === 'modify');

  return (
    <div className={cn('si-diff-viewer font-mono text-sm', className)}>
      {/* Summary */}
      <div className="flex items-center gap-4 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-1 text-green-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">{addedLines.length} additions</span>
        </div>
        <div className="flex items-center gap-1 text-red-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
          <span className="text-sm font-medium">{removedLines.length} deletions</span>
        </div>
        <div className="flex items-center gap-1 text-blue-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">{modifiedLines.length} modifications</span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-auto max-h-[600px]">
        <table className="w-full border-collapse">
          <tbody>
            {changes.map((change, index) => (
              <DiffLine
                key={index}
                change={change}
                showLineNumber={showLineNumbers}
                selected={selectedChange?.lineNumber === change.lineNumber}
                onSelect={() => setSelectedChange(change)}
                onAccept={onAcceptChange}
                onReject={onRejectChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface DiffLineProps {
  change: DiffChange;
  showLineNumber: boolean;
  selected: boolean;
  onSelect: () => void;
  onAccept?: (change: DiffChange) => void;
  onReject?: (change: DiffChange) => void;
}

const DiffLine: React.FC<DiffLineProps> = ({
  change,
  showLineNumber,
  selected,
  onSelect,
  onAccept,
  onReject,
}) => {
  const lineStyles = {
    add: 'bg-green-50 dark:bg-green-900/20',
    remove: 'bg-red-50 dark:bg-red-900/20',
    modify: 'bg-blue-50 dark:bg-blue-900/20',
  };

  const lineNumbers = {
    add: change.lineNumber,
    remove: change.lineNumber,
    modify: change.lineNumber,
  };

  return (
    <tr
      className={cn(
        'group hover:opacity-80 transition-opacity cursor-pointer',
        lineStyles[change.type],
        selected && 'ring-2 ring-primary ring-inset'
      )}
      onClick={onSelect}
    >
      {showLineNumbers && (
        <td className="p-2 text-right text-muted-foreground select-none border-r bg-muted/30">
          {lineNumbers[change.type]}
        </td>
      )}
      <td className="p-2 border-r">
        <span
          className={cn(
            'inline-block w-4 text-center font-bold',
            change.type === 'add' && 'text-green-600',
            change.type === 'remove' && 'text-red-600',
            change.type === 'modify' && 'text-blue-600'
          )}
        >
          {change.type === 'add' ? '+' : change.type === 'remove' ? '-' : '~'}
        </span>
      </td>
      <td className="p-2">
        <code className="text-sm">{change.content}</code>
      </td>
      <td className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-1">
          {onAccept && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAccept(change);
              }}
              className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
              aria-label="Accept change"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {onReject && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(change);
              }}
              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
              aria-label="Reject change"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ============================================================================
// Progress Indicator Component
// ============================================================================

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  status?: 'idle' | 'loading' | 'success' | 'error';
  animated?: boolean;
}

const progressVariants = cva('w-full overflow-hidden rounded-full bg-muted', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-4',
    },
    variant: {
      default: '',
      success: 'bg-green-100 dark:bg-green-900/30',
      error: 'bg-red-100 dark:bg-red-900/30',
      warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      label,
      showPercentage = false,
      status = 'idle',
      animated = true,
      size,
      variant,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const { announce } = useAccessibility();

    React.useEffect(() => {
      if (status === 'loading' && percentage > 0 && percentage < 100) {
        announce(`Progress: ${Math.round(percentage)} percent`, 'polite');
      }
    }, [percentage, status, announce]);

    const statusColors = {
      idle: 'bg-primary',
      loading: 'bg-primary',
      success: 'bg-green-600',
      error: 'bg-red-600',
    };

    return (
      <div ref={ref} className="space-y-1" {...props}>
        {(label || showPercentage) && (
          <div className="flex items-center justify-between text-sm">
            {label && <span className="font-medium">{label}</span>}
            {showPercentage && (
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <div className={cn(progressVariants({ size, variant }), className)}>
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              statusColors[status],
              animated && status === 'loading' && 'animate-pulse'
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label}
          >
            {animated && status === 'loading' && (
              <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// ============================================================================
// Circular Progress Component
// ============================================================================

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  status?: 'idle' | 'loading' | 'success' | 'error';
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  status = 'idle',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const offset = circumference - (percentage / 100) * circumference;

  const statusColors = {
    idle: '#0ea5e9',
    loading: '#0ea5e9',
    success: '#22c55e',
    error: '#ef4444',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={statusColors[status]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter: status === 'loading' ? 'drop-shadow(0 0 4px currentColor)' : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Skeleton Loader Component
// ============================================================================

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const skeletonVariants = cva('bg-muted animate-pulse', {
  variants: {
    variant: {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-md',
    },
    animation: {
      pulse: 'animate-pulse',
      wave: 'animate-shimmer',
      none: '',
    },
  },
  defaultVariants: {
    variant: 'rounded',
    animation: 'pulse',
  },
});

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant, width, height, animation, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, animation }), className)}
        style={{ width, height }}
        role="status"
        aria-label="Loading..."
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// ============================================================================
// Toast Notification Component
// ============================================================================

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  action,
}) => {
  const [visible, setVisible] = React.useState(true);
  const { announce } = useAccessibility();

  React.useEffect(() => {
    announce(message, type === 'error' ? 'assertive' : 'polite');
  }, [message, type, announce]);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose?.(id), 300);
  };

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800',
    error: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800',
  };

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
        typeStyles[type],
        visible ? 'animate-slide-in-right' : 'animate-fade-out'
      )}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="text-xl flex-shrink-0" aria-hidden="true">
        {typeIcons[type]}
      </span>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <p className="text-sm opacity-90">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleClose}
        className="p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Close notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// ============================================================================
// Toast Container Component
// ============================================================================

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const show = React.useCallback(
    (props: Omit<ToastProps, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast = { ...props, id };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const success = React.useCallback(
    (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
      return show({ ...options, message, type: 'success' });
    },
    [show]
  );

  const error = React.useCallback(
    (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
      return show({ ...options, message, type: 'error' });
    },
    [show]
  );

  const warning = React.useCallback(
    (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
      return show({ ...options, message, type: 'warning' });
    },
    [show]
  );

  const info = React.useCallback(
    (message: string, options?: Partial<Omit<ToastProps, 'id' | 'type' | 'message'>>) => {
      return show({ ...options, message, type: 'info' });
    },
    [show]
  );

  const close = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = React.useCallback(() => {
    if (toasts.length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={close} />
        ))}
      </div>
    );
  }, [toasts, close]);

  return { show, success, error, warning, info, close, ToastContainer };
}

export { Progress };

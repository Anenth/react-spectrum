import {AllHTMLAttributes, RefObject} from 'react';
import {chain} from '@react-aria/utils';
import {DOMProps} from '@react-types/shared';
import {useId} from '@react-aria/utils';
import {useOverlay} from '@react-aria/overlays';

const VISIBLE_TOOLTIPS = [];

interface TooltipProps extends DOMProps {
  onClose?: () => void,
  role?: 'tooltip'
}

interface TriggerProps extends DOMProps, AllHTMLAttributes<HTMLElement> {
  ref: RefObject<HTMLElement | null>,
}

interface TooltipTriggerState {
  open: boolean,
  setOpen(value: boolean): void
}

interface TooltipTriggerProps {
  tooltipProps: TooltipProps,
  triggerProps: TriggerProps,
  state: TooltipTriggerState
}

interface TooltipTriggerAria {
  tooltipTriggerBaseProps: AllHTMLAttributes<HTMLElement>,
  tooltipAriaProps: AllHTMLAttributes<HTMLElement>,
  tooltipTriggerSingularityProps: AllHTMLAttributes<HTMLElement>
}

export function useTooltipTrigger(props: TooltipTriggerProps): TooltipTriggerAria {
  let {
    tooltipProps,
    triggerProps,
    state
  } = props;

  let tooltipTriggerId = useId();

  let {overlayProps} = useOverlay({
    ref: triggerProps.ref,
    onClose: tooltipProps.onClose,
    isOpen: state.open
  });

  let onKeyDownTrigger = (e) => {
    if (triggerProps.ref && triggerProps.ref.current) {
      // dismiss tooltip on esc key press
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        state.setOpen(false);
      }
    }
  };

  // NEXT PR: move all of the single tooltip concept methods to tooltip trigger so you can apply hide delays and uniform warmup / cooldown ?

  let enter = () => {
    console.log("enter", VISIBLE_TOOLTIPS.length)
    let tooltipBucketItem = triggerProps.ref.current.id;
    VISIBLE_TOOLTIPS.push(tooltipBucketItem);
    console.log('list of tooltips in hover enter', VISIBLE_TOOLTIPS)
  };

  let exit = (e) => {
    console.log("exit", VISIBLE_TOOLTIPS.length)
    let hoveringOverTooltip = false;
    const related = e.relatedTarget || e.nativeEvent.toElement;
    const parent = related.parentNode;
    if (parent.getAttribute('role') === 'tooltip') {
      hoveringOverTooltip = true;
    }
    if (VISIBLE_TOOLTIPS.length > 0 && hoveringOverTooltip === false) {
      state.setOpen(false);
    }
    VISIBLE_TOOLTIPS.pop()
  };

  let enterClick = () => {
    console.log('enter click', VISIBLE_TOOLTIPS.length)
    let tooltipBucketItem = triggerProps.ref.current.id;
    VISIBLE_TOOLTIPS.push(tooltipBucketItem);
    document.addEventListener('mouseenter', testMethod(triggerProps.ref.current.id), true) // is the onHoverChange type error blocking this?
  }

  let testMethod = (currTooltip) => {
    console.log('we are hovering over something!')
    console.log('list of tooltips in test method', VISIBLE_TOOLTIPS)
    console.log('current tooltip in test method', currTooltip)
    if (VISIBLE_TOOLTIPS.length > 1) { // && last index of the visible tooltips array doesn't equal currTooltip
      console.log('trying to close')
      state.setOpen(false);
    }
    // VISIBLE_TOOLTIPS.pop()
    // document.removeEventListener('mouseenter', testMethod, true)
  }

  // investigate: spread tooltipAriaProps as well?
  return {
    tooltipTriggerBaseProps: {
      ...overlayProps,
      id: tooltipTriggerId,
      role: 'button',
      onKeyDown: chain(triggerProps.onKeyDown, onKeyDownTrigger)
    },
    tooltipAriaProps: {
      'aria-describedby': tooltipProps['aria-describedby'] || tooltipTriggerId,
      role: tooltipProps.role || 'tooltip'
    },
    tooltipHoverTriggerSingularityProps: {
      onMouseEnter: enter,
      onMouseLeave: exit
    },
    tooltipClickTriggerSingularityProps: {
      onMouseDown: enterClick
    }
  };
}
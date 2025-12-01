/**
 * TooltipManager - Manages tooltip display with smart positioning and accessibility
 */

class TooltipManager {
    constructor() {
        this.tooltipElement = null;
        this.showTimeout = null;
        this.hideTimeout = null;
        this.currentTarget = null;
        this.delay = 500; // 500ms delay before showing tooltip
        this.isInitialized = false;
    }

    /**
     * Initialize the tooltip system
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        // Create tooltip element
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'tooltip';
        this.tooltipElement.setAttribute('role', 'tooltip');

        // Create tooltip content container
        const content = document.createElement('div');
        content.className = 'tooltip-content';
        this.tooltipElement.appendChild(content);

        // Create tooltip arrow
        const arrow = document.createElement('div');
        arrow.className = 'tooltip-arrow';
        this.tooltipElement.appendChild(arrow);

        // Add to document
        document.body.appendChild(this.tooltipElement);

        this.isInitialized = true;
    }

    /**
     * Attach tooltip to an element
     * @param {HTMLElement} element - Element to attach tooltip to
     * @param {string|Function} content - Tooltip content (string or function that returns string)
     * @param {Object} options - Additional options
     */
    attach(element, content, options = {}) {
        if (!element) return;

        const delay = options.delay !== undefined ? options.delay : this.delay;

        // Mouse events
        element.addEventListener('mouseenter', (e) => {
            this.show(element, content, delay);
        });

        element.addEventListener('mouseleave', () => {
            this.hide();
        });

        // Keyboard accessibility - show on focus
        element.addEventListener('focus', () => {
            this.show(element, content, delay);
        });

        element.addEventListener('blur', () => {
            this.hide();
        });
    }

    /**
     * Show tooltip for an element
     * @param {HTMLElement} element - Target element
     * @param {string|Function} content - Tooltip content
     * @param {number} delay - Delay before showing (ms)
     */
    show(element, content, delay = this.delay) {
        if (!this.isInitialized) {
            this.initialize();
        }

        // Clear any existing timeouts
        this.clearTimeouts();

        // Hide previous tooltip if showing for different element
        if (this.currentTarget && this.currentTarget !== element) {
            this.hideImmediate();
        }

        this.currentTarget = element;

        // Set timeout to show tooltip
        this.showTimeout = setTimeout(() => {
            this.showImmediate(element, content);
        }, delay);
    }

    /**
     * Show tooltip immediately without delay
     * @param {HTMLElement} element - Target element
     * @param {string|Function} content - Tooltip content
     */
    showImmediate(element, content) {
        if (!this.tooltipElement) return;

        // Get content (call function if provided)
        const tooltipContent = typeof content === 'function' ? content() : content;

        // Set content
        const contentElement = this.tooltipElement.querySelector('.tooltip-content');
        contentElement.innerHTML = tooltipContent;

        // Position tooltip
        this.position(element);

        // Show tooltip
        this.tooltipElement.classList.add('visible');
    }

    /**
     * Hide tooltip with fade out
     */
    hide() {
        this.clearTimeouts();

        // Delay hiding slightly to allow moving between nearby elements
        this.hideTimeout = setTimeout(() => {
            this.hideImmediate();
        }, 100);
    }

    /**
     * Hide tooltip immediately
     */
    hideImmediate() {
        if (!this.tooltipElement) return;

        this.tooltipElement.classList.remove('visible');
        this.currentTarget = null;
    }

    /**
     * Clear all timeouts
     */
    clearTimeouts() {
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    /**
     * Smart positioning to avoid viewport overflow
     * @param {HTMLElement} element - Target element
     */
    position(element) {
        if (!this.tooltipElement || !element) return;

        const tooltip = this.tooltipElement;
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        const spacing = 8; // Space between element and tooltip
        const arrowSize = 8;

        // Calculate available space in each direction
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = window.innerWidth - rect.right;

        let placement = 'top';
        let top = 0;
        let left = 0;

        // Determine best placement based on available space
        if (spaceAbove >= tooltipRect.height + spacing) {
            // Place above
            placement = 'top';
            top = rect.top - tooltipRect.height - spacing;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        } else if (spaceBelow >= tooltipRect.height + spacing) {
            // Place below
            placement = 'bottom';
            top = rect.bottom + spacing;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        } else if (spaceRight >= tooltipRect.width + spacing) {
            // Place right
            placement = 'right';
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.right + spacing;
        } else if (spaceLeft >= tooltipRect.width + spacing) {
            // Place left
            placement = 'left';
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.left - tooltipRect.width - spacing;
        } else {
            // Default to top even if it overflows
            placement = 'top';
            top = rect.top - tooltipRect.height - spacing;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        }

        // Ensure tooltip stays within viewport horizontally
        if (left < spacing) {
            left = spacing;
        } else if (left + tooltipRect.width > window.innerWidth - spacing) {
            left = window.innerWidth - tooltipRect.width - spacing;
        }

        // Ensure tooltip stays within viewport vertically
        if (top < spacing) {
            top = spacing;
        } else if (top + tooltipRect.height > window.innerHeight - spacing) {
            top = window.innerHeight - tooltipRect.height - spacing;
        }

        // Apply position
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.setAttribute('data-placement', placement);
    }

    /**
     * Cleanup tooltip system
     */
    cleanup() {
        this.clearTimeouts();

        if (this.tooltipElement && this.tooltipElement.parentNode) {
            this.tooltipElement.parentNode.removeChild(this.tooltipElement);
        }

        this.tooltipElement = null;
        this.currentTarget = null;
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TooltipManager;
}

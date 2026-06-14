/**
 * FormFill AI - Content Script
 * Runs in the context of every web page.
 * Handles: form extraction + form filling.
 */

// Guard against double injection (manifest + service_worker both inject)
if (window.__formfillAILoaded) {
  // Already loaded — skip re-initialization
} else {
  window.__formfillAILoaded = true;

// ─── Form Extraction ──────────────────────────────────────────────────────────
function extractForms() {
  const forms = [];

  // Collect all <form> elements + fallback: inputs not inside a form
  const formEls = Array.from(document.querySelectorAll('form'));

  // If no explicit forms, treat whole page as one implicit form
  if (formEls.length === 0) {
    const looseForms = buildImplicitForm();
    if (looseForms) forms.push(looseForms);
  } else {
    formEls.forEach((form, formIdx) => {
      const fields = extractFieldsFromContainer(form, formIdx);
      if (fields.length > 0) {
        forms.push({
          formIndex: formIdx,
          formId: form.id || null,
          formName: form.name || null,
          formAction: form.action || null,
          fields,
        });
      }
    });
  }

  console.log('[FormFill AI] Extracted forms:', forms.length, 'total fields:', forms.reduce((sum, f) => sum + f.fields.length, 0));
  return { forms };
}

function buildImplicitForm() {
  const fields = extractFieldsFromContainer(document.body, 0);
  if (fields.length === 0) return null;
  return { formIndex: 0, formId: null, formName: null, formAction: null, fields };
}

function extractFieldsFromContainer(container, formIdx) {
  const fields = [];
  const inputs = container.querySelectorAll('input, select, textarea');

  inputs.forEach((el, idx) => {
    if (el.type === 'submit' || el.type === 'button' || el.type === 'reset' ||
        el.type === 'image' || el.type === 'file' || el.type === 'hidden') return;

    // Skip invisible / disabled fields
    if (el.disabled || el.readOnly) return;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return;

    // Build selector to target this element later
    const selector = buildSelector(el, container, formIdx, idx);
    const labelText = findLabel(el);
    const placeholder = el.placeholder || '';
    const name = el.name || '';
    const id = el.id || '';
    const fieldType = el.tagName.toLowerCase() === 'select' ? 'select'
      : el.tagName.toLowerCase() === 'textarea' ? 'textarea'
      : el.type || 'text';

    let options = null;
    if (el.tagName.toLowerCase() === 'select') {
      options = Array.from(el.options).map(o => ({ value: o.value, text: o.text }));
    }

    fields.push({
      selector,
      fieldType,
      id,
      name,
      placeholder,
      labelText,
      options,
      ariaLabel: el.getAttribute('aria-label') || '',
      autocomplete: el.getAttribute('autocomplete') || '',
    });
  });

  return fields;
}

/**
 * Builds a unique CSS selector for an element that will reliably
 * target it via document.querySelector().
 */
function buildSelector(el, container, formIdx, fieldIdx) {
  // Prefer id — most reliable
  if (el.id) return `#${CSS.escape(el.id)}`;

  // Tag a unique data attribute onto the element so we can always find it
  const uniqueId = `ff-${formIdx}-${fieldIdx}-${Date.now()}`;
  el.setAttribute('data-formfill-id', uniqueId);

  // Also build a human-readable hint using name/placeholder for the LLM
  // but the actual selector uses our guaranteed-unique data attribute
  return `[data-formfill-id=${uniqueId}]`;
}

function findLabel(el) {
  // 1. <label for="id">
  if (el.id) {
    const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (label) return label.innerText.trim();
  }
  // 2. Wrapping <label>
  const parentLabel = el.closest('label');
  if (parentLabel) return parentLabel.innerText.trim();
  // 3. Immediately preceding elements that serve as labels
  let prev = el.previousElementSibling;
  while (prev) {
    if (prev.tagName === 'LABEL') return prev.innerText.trim();
    if (prev.tagName === 'INPUT' || prev.tagName === 'SELECT' || prev.tagName === 'TEXTAREA') break;
    // Also check for span/div/b/strong/p that serve as labels
    if (['SPAN', 'DIV', 'P', 'B', 'STRONG', 'H4', 'H5', 'H6'].includes(prev.tagName) && prev.innerText.trim()) {
      return prev.innerText.trim();
    }
    prev = prev.previousElementSibling;
  }
  // 4. Check parent for label-like text
  const parent = el.parentElement;
  if (parent) {
    // Look for adjacent text nodes or label-like sibling elements
    const labelEl = parent.querySelector('label, .label, .field-label, b, strong');
    if (labelEl && labelEl !== el && !labelEl.querySelector('input, select, textarea')) {
      return labelEl.innerText.trim();
    }
  }
  // 5. Check grandparent — many forms wrap label + input in a container div
  const grandparent = el.parentElement?.parentElement;
  if (grandparent) {
    const labelEl = grandparent.querySelector('label, .label, h4, h5, b, strong');
    if (labelEl && !labelEl.querySelector('input, select, textarea')) {
      return labelEl.innerText.trim();
    }
  }
  // 6. aria-label / aria-labelledby
  if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
  if (el.getAttribute('aria-labelledby')) {
    const labelEl = document.getElementById(el.getAttribute('aria-labelledby'));
    if (labelEl) return labelEl.innerText.trim();
  }
  // 7. title attribute
  if (el.title) return el.title.trim();
  // 8. placeholder as last resort (already sent separately but helps label matching)
  if (el.placeholder) return el.placeholder.trim();
  return '';
}

// ─── Form Filling ─────────────────────────────────────────────────────────────
function fillForms(fillMap) {
  let filledCount = 0;
  const errors = [];

  console.log('[FormFill AI] Filling', Object.keys(fillMap).length, 'fields');

  Object.entries(fillMap).forEach(([selector, value]) => {
    try {
      if (value === null || value === undefined) return; // skip null/undefined

      const el = document.querySelector(selector);
      if (!el) {
        console.warn('[FormFill AI] Element not found:', selector);
        errors.push(`Element not found: ${selector}`);
        return;
      }

      console.log('[FormFill AI] Filling:', selector, '→', value);

      // Focus the element first (helps React controlled components)
      el.focus();

      if (el.tagName === 'SELECT') {
        fillSelectElement(el, String(value));
      } else if (el.type === 'checkbox' || el.type === 'radio') {
        fillCheckboxRadio(el, value);
      } else {
        fillInputElement(el, String(value));
      }

      // Highlight filled field briefly
      highlightField(el);
      filledCount++;
    } catch (err) {
      console.error('[FormFill AI] Error filling', selector, ':', err.message);
      errors.push(`Error filling ${selector}: ${err.message}`);
    }
  });

  console.log('[FormFill AI] Fill complete:', filledCount, 'filled,', errors.length, 'errors');
  return { filledCount, errors };
}

function fillInputElement(el, value) {
  // Use native setter to bypass React/Vue/Angular internal state
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }

  // Dispatch full sequence of events that frameworks listen for
  el.dispatchEvent(new Event('focus', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));

  // Also dispatch keyboard events for React 16+ compatibility
  el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
  el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

function fillSelectElement(el, value) {
  // Try to match by value first, then by visible text (exact)
  let matched = false;

  for (const option of el.options) {
    if (option.value === value || option.text === value) {
      el.value = option.value;
      matched = true;
      break;
    }
  }

  // Case-insensitive match
  if (!matched) {
    const lowerValue = value.toLowerCase();
    for (const option of el.options) {
      if (option.value.toLowerCase() === lowerValue ||
          option.text.toLowerCase() === lowerValue) {
        el.value = option.value;
        matched = true;
        break;
      }
    }
  }

  // Fuzzy match: check if the value is contained in option text or vice versa
  if (!matched) {
    const lowerValue = value.toLowerCase();
    for (const option of el.options) {
      if (option.value && (
        option.text.toLowerCase().includes(lowerValue) ||
        lowerValue.includes(option.text.toLowerCase()) ||
        option.value.toLowerCase().includes(lowerValue) ||
        lowerValue.includes(option.value.toLowerCase())
      )) {
        el.value = option.value;
        matched = true;
        break;
      }
    }
  }

  if (!matched) {
    console.warn('[FormFill AI] No matching option for:', value, 'in select with options:', Array.from(el.options).map(o => `${o.value}="${o.text}"`));
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('blur', { bubbles: true }));
}

function fillCheckboxRadio(el, value) {
  const shouldCheck = value === true || value === 'true' || value === '1' ||
    value === 'yes' || value === el.value;
  if (el.checked !== shouldCheck) {
    el.click(); // use click() for proper event dispatch
  }
}

function highlightField(el) {
  const originalOutline = el.style.outline;
  const originalTransition = el.style.transition;
  el.style.transition = 'outline 0.2s ease';
  el.style.outline = '2px solid #7c6af7';
  el.style.outlineOffset = '2px';
  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.transition = originalTransition;
  }, 1800);
}

// ─── Message Listener ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ ready: true });
    return true;
  }

  if (message.type === 'EXTRACT_FORMS') {
    try {
      const result = extractForms();
      sendResponse(result);
    } catch (err) {
      console.error('[FormFill AI] Extract error:', err);
      sendResponse({ forms: [], error: err.message });
    }
    return true;
  }

  if (message.type === 'FILL_FORMS') {
    try {
      const result = fillForms(message.fillMap);
      sendResponse(result);
    } catch (err) {
      console.error('[FormFill AI] Fill error:', err);
      sendResponse({ filledCount: 0, errors: [err.message] });
    }
    return true;
  }
});

// Notify background that content script is ready
chrome.runtime.sendMessage({ type: 'CONTENT_READY' }).catch(() => {});

} // end of double-injection guard

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFormPrefill,
  type FormType,
  type PrefillData,
} from "@/contexts/FormPrefillContext";
import {
  extractActionData,
  executeAction,
  isNavigationAction,
  isFormPrefillAction,
  isCustomAction,
  isConfirmAction,
  getPageName,
  type InterfaceAction,
  type ConfirmAction,
} from "@/lib/interface-agent";

// ============================================================================
// Types
// ============================================================================

export interface PendingConfirmation {
  action: ConfirmAction;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export interface ProcessResult {
  /** Whether an action was found and processed */
  hasAction: boolean;
  /** The cleaned text content without action markers */
  textContent: string;
  /** Feedback message to display to user */
  feedbackMessage?: string;
  /** Whether a confirmation is pending (user needs to confirm) */
  pendingConfirmation?: PendingConfirmation;
}

export interface UseInterfaceAgentReturn {
  /** Process a response from the chat backend */
  processResponse: (response: string) => ProcessResult;

  /** Current pending confirmation (if any) */
  pendingConfirmation: PendingConfirmation | null;

  /** Clear pending confirmation */
  clearConfirmation: () => void;

  /** Execute the pending confirmation */
  confirmAction: () => Promise<void>;

  /** Cancel the pending confirmation */
  cancelAction: () => void;

  /** Whether an action is currently being executed */
  isExecuting: boolean;

  /** Last feedback message */
  lastFeedback: string | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useInterfaceAgent(): UseInterfaceAgentReturn {
  const navigate = useNavigate();
  const { setPrefillData } = useFormPrefill();

  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  /**
   * Execute a navigation action
   */
  const handleNavigation = useCallback(
    (action: InterfaceAction & { type: "navigation" }) => {
      console.log("[useInterfaceAgent] Executing navigation:", action.path);

      // Small delay to allow the chat message to render first
      setTimeout(() => {
        navigate(action.path);
      }, 300);

      return action.message || `Navegando a ${getPageName(action.path)}...`;
    },
    [navigate]
  );

  /**
   * Execute a form prefill action
   */
  const handleFormPrefill = useCallback(
    (action: InterfaceAction & { type: "formPrefill" }) => {
      console.log(
        "[useInterfaceAgent] Executing form prefill:",
        action.formType,
        action.data
      );

      // Set prefill data in context
      setPrefillData(action.formType as FormType, action.data as PrefillData);

      // Navigate to the form
      setTimeout(() => {
        navigate(action.path);
      }, 300);

      return action.message || `Abriendo formulario con datos pre-cargados...`;
    },
    [navigate, setPrefillData]
  );

  /**
   * Execute a custom action
   */
  const handleCustomAction = useCallback(
    async (action: InterfaceAction & { type: "custom" }) => {
      console.log(
        "[useInterfaceAgent] Executing custom action:",
        action.actionId
      );

      const success = await executeAction(action.actionId, action.parameters);

      if (!success) {
        return `No se pudo ejecutar la acción "${action.actionId}"`;
      }

      return action.message || "Acción ejecutada";
    },
    []
  );

  /**
   * Handle a confirmation request
   */
  const handleConfirmation = useCallback(
    (action: ConfirmAction): PendingConfirmation => {
      console.log(
        "[useInterfaceAgent] Requesting confirmation for:",
        action.actionType,
        action.targetId
      );

      return {
        action,
        onConfirm: async () => {
          // This will be called when user confirms
          // The actual deletion should be handled by the chat service
          // We'll send a confirmation message back to the chat
          console.log(
            "[useInterfaceAgent] User confirmed action:",
            action.actionType
          );
        },
        onCancel: () => {
          console.log(
            "[useInterfaceAgent] User cancelled action:",
            action.actionType
          );
        },
      };
    },
    []
  );

  /**
   * Process a response from the chat backend
   */
  const processResponse = useCallback(
    (response: string): ProcessResult => {
      const extracted = extractActionData(response);

      if (!extracted) {
        return {
          hasAction: false,
          textContent: response,
        };
      }

      const { action, textContent } = extracted;
      let feedbackMessage: string | undefined;
      let pendingConf: PendingConfirmation | undefined;

      setIsExecuting(true);

      try {
        if (isNavigationAction(action)) {
          feedbackMessage = handleNavigation(action);
        } else if (isFormPrefillAction(action)) {
          feedbackMessage = handleFormPrefill(action);
        } else if (isCustomAction(action)) {
          // Execute async but don't wait
          handleCustomAction(action).then((msg) => {
            setLastFeedback(msg);
          });
          feedbackMessage = action.message || "Ejecutando acción...";
        } else if (isConfirmAction(action)) {
          pendingConf = handleConfirmation(action);
          setPendingConfirmation(pendingConf);
          feedbackMessage = action.message;
        }

        setLastFeedback(feedbackMessage || null);
      } finally {
        setIsExecuting(false);
      }

      return {
        hasAction: true,
        textContent,
        feedbackMessage,
        pendingConfirmation: pendingConf,
      };
    },
    [
      handleNavigation,
      handleFormPrefill,
      handleCustomAction,
      handleConfirmation,
    ]
  );

  /**
   * Clear pending confirmation
   */
  const clearConfirmation = useCallback(() => {
    setPendingConfirmation(null);
  }, []);

  /**
   * Execute the pending confirmation
   */
  const confirmAction = useCallback(async () => {
    if (!pendingConfirmation) return;

    setIsExecuting(true);
    try {
      await pendingConfirmation.onConfirm();
    } finally {
      setIsExecuting(false);
      clearConfirmation();
    }
  }, [pendingConfirmation, clearConfirmation]);

  /**
   * Cancel the pending confirmation
   */
  const cancelAction = useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.onCancel();
    }
    clearConfirmation();
  }, [pendingConfirmation, clearConfirmation]);

  return {
    processResponse,
    pendingConfirmation,
    clearConfirmation,
    confirmAction,
    cancelAction,
    isExecuting,
    lastFeedback,
  };
}

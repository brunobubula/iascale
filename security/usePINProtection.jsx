import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function usePINProtection() {
  const [showPINDialog, setShowPINDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const checkPINProtection = (feature, callback) => {
    if (!user?.pin_code_hashed) {
      callback();
      return;
    }

    const isProtected = user.pin_protected_features?.includes(feature);
    
    if (isProtected) {
      setPendingAction(() => callback);
      setShowPINDialog(true);
    } else {
      callback();
    }
  };

  const onPINSuccess = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  return {
    showPINDialog,
    setShowPINDialog,
    checkPINProtection,
    onPINSuccess
  };
}
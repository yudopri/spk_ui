"use client";
import React, { useEffect, useState } from "react";
import { Modal, Button } from "flowbite-react";
import { Icon } from "@iconify/react";

type DialogKind = "alert" | "confirm";

interface DialogState {
  kind: DialogKind;
  message: string;
  resolve?: (value: boolean) => void;
}

let emitter: ((dialog: DialogState) => void) | null = null;

export const alertDialog = (message: string) => {
  if (emitter) {
    emitter({ kind: "alert", message });
  } else if (typeof window !== "undefined") {
    console.warn(message);
  }
};

export const confirmDialog = (message: string): Promise<boolean> =>
  new Promise<boolean>((resolve) => {
    if (emitter) {
      emitter({ kind: "confirm", message, resolve });
    } else {
      resolve(false);
    }
  });

const GlobalDialog = () => {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    emitter = (d) => setDialog(d);
    return () => {
      emitter = null;
    };
  }, []);

  const close = (result: boolean) => {
    dialog?.resolve?.(result);
    setDialog(null);
  };

  const isConfirm = dialog?.kind === "confirm";

  return (
    <Modal show={!!dialog} size="md" popup onClose={() => close(false)}>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div
              className={`rounded-full p-3 ${
                isConfirm ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-red-100 dark:bg-red-900/20"
              }`}
            >
              <Icon
                icon={isConfirm ? "solar:question-circle-bold-duotone" : "solar:danger-triangle-bold-duotone"}
                className={`h-12 w-12 ${isConfirm ? "text-yellow-600" : "text-red-600"}`}
              />
            </div>
          </div>
          <p className="mb-6 text-sm font-normal text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {dialog?.message}
          </p>
          <div className="flex justify-center gap-3">
            {isConfirm && (
              <Button color="gray" onClick={() => close(false)}>
                Batal
              </Button>
            )}
            <Button color={isConfirm ? "failure" : "primary"} onClick={() => close(true)}>
              {isConfirm ? "Ya, lanjutkan" : "Tutup"}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default GlobalDialog;

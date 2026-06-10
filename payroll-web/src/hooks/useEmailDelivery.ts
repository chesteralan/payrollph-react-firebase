import { useCallback } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  template?: string;
  attachments?: { filename: string; content: string }[];
}

export function useEmailDelivery() {
  const sendEmail = useCallback(async (payload: EmailPayload) => {
    try {
      await addDoc(collection(db, "email_queue"), {
        ...payload,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to queue email:", err);
    }
  }, []);

  const sendReportEmail = useCallback(
    async (reportName: string, recipientEmail: string, downloadUrl: string) => {
      await sendEmail({
        to: recipientEmail,
        subject: `Report: ${reportName}`,
        body: `Your report "${reportName}" is ready.\nDownload: ${downloadUrl}`,
      });
    },
    [sendEmail],
  );

  return { sendEmail, sendReportEmail };
}

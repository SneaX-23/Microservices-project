import { resend } from "../config/email";
import { paymentFailedTemplate } from "../templates/paymentFailedTemplate";
import { paymentRefundTemplate } from "../templates/pymentRefundTemplate";
import { paymentSuccessTemplate } from "../templates/paymentSuccessTemplate";
import { newUserTemplate } from "../templates/newUserTemplate";

export enum EmailType {
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REFUND_INITIATED = "REFUND_INITIATED",
  NEW_USER = "new_user",
}

export const templateMap: Record<EmailType, (data: any) => string> = {
  [EmailType.PAYMENT_CONFIRMED]: paymentSuccessTemplate,
  [EmailType.PAYMENT_FAILED]: paymentFailedTemplate,
  [EmailType.REFUND_INITIATED]: paymentRefundTemplate,
  [EmailType.NEW_USER]: newUserTemplate,
};

export const subjectMap: Record<EmailType, string> = {
  [EmailType.PAYMENT_CONFIRMED]: "Payment Successful",
  [EmailType.PAYMENT_FAILED]: "Payment Failed",
  [EmailType.REFUND_INITIATED]: "Refund Initiated",
  [EmailType.NEW_USER]: "Welcome to ...",
};

const isEmailType = (value: string): value is EmailType => {
  return Object.values(EmailType).includes(value as EmailType);
};

export const sendMail = async (email: string, type: string, data: any) => {
  if (!isEmailType(type)) {
    throw new Error(`Invalid email type provided: ${type}`);
  }

  const templateFn = templateMap[type];

  const message = {
    from: "Email service <no-reply@sneax.quest>",
    to: email,
    subject: subjectMap[type],
    html: templateFn(data),
  };

  return await resend.emails.send(message);
};

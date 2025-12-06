import { resend } from "../config/email";
import { paymentFailedTemplate } from "../templates/paymentFailedTemplate";
import { paymentRefundTemplate } from "../templates/pymentRefundTemplate";
import { paymentSuccessTemplate } from "../templates/paymentSuccessTemplate";

export const templateMap: Record<string, Function> = {
    PAYMENT_CONFIRMED: paymentSuccessTemplate,
    PAYMENT_FAILED: paymentFailedTemplate,
    REFUND_INITIATED: paymentRefundTemplate,
};

export const sendMail = async (eamil: string, type: string, data: any) => {
    const message = {
        from: "Eamil service <no-reply@sneax.quest>",
        to: eamil,
        subject: "Order Update",
        html: templateMap[type](data),
    }

    await resend.emails.send(message);
}

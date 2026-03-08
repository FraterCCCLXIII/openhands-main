import { randomUUID } from "node:crypto";

import type { ContextRepository } from "@/src/lib/core/repository";
import { nowIso } from "@/src/lib/core/date";
import type { AccessRequest, NotificationChannel, NotificationRecord } from "@/src/types/context-layer";

export class NotificationPublisher {
  constructor(private readonly repository: ContextRepository) {}

  async publishAccessRequest(request: AccessRequest) {
    const notifications = request.channels.map((channel) =>
      this.buildNotification(channel, request),
    );

    for (const notification of notifications) {
      await this.repository.createNotification(notification);
      await this.dispatch(notification);
    }
  }

  private buildNotification(channel: NotificationChannel, request: AccessRequest): NotificationRecord {
    const recipient = request.notificationTargets[channel] ?? `default-${channel}-recipient`;

    return {
      id: randomUUID(),
      channel,
      recipient,
      subject: `Approval requested for ${request.integrationKey}.${request.functionName}`,
      body: `Agent '${request.agentId}' requested [${request.scopes.join(", ") || "default scopes"}] for ${request.integrationKey}.${request.functionName} for ${request.requestedMinutes} minutes.`,
      metadata: {
        requestId: request.id,
        agentClass: request.agentClass,
      },
      createdAt: nowIso(),
    };
  }

  private async dispatch(notification: NotificationRecord) {
    if (notification.channel === "email") {
      await this.sendEmail(notification);
      return;
    }

    if (notification.channel === "sms") {
      await this.sendSms(notification);
    }
  }

  private async sendEmail(notification: NotificationRecord) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;

    if (!apiKey || !from) {
      return;
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [notification.recipient],
        subject: notification.subject,
        text: notification.body,
      }),
    });
  }

  private async sendSms(notification: NotificationRecord) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!sid || !token || !from) {
      return;
    }

    const body = new URLSearchParams({
      To: notification.recipient,
      From: from,
      Body: notification.body,
    });

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
  }
}

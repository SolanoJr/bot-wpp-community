import { proto } from '@whiskeysockets/baileys';

/**
 * Spike 002 — reproduzir o botão nativo "Enviar histórico de mensagens".
 *
 * O capture-store do grupo mostra que o botão NÃO monta/encripta o bundle:
 * ele só publica um `messageHistoryNotice` com 3 metadados. O servidor
 * WhatsApp gera o bundle E2EE e o texto "Você enviou o histórico...".
 *
 * Usamos relayMessage para enviar o proto já montado (o sendMessage do rc14
 * nao conhece `messageHistoryNotice` e rejeita a chave como "Invalid media type").
 */
export interface HistoryNoticeParams {
  receivers: string[];
  oldestMessageTimestamp: number;
  messageCount?: number;
}

export async function sendHistoryNotice(
  sock: any,
  jid: string,
  params: HistoryNoticeParams,
): Promise<string> {
  const message = proto.Message.fromObject({
    messageHistoryNotice: {
      messageHistoryMetadata: {
        historyReceivers: params.receivers,
        oldestMessageTimestamp: params.oldestMessageTimestamp,
        messageCount: params.messageCount ?? 100,
      },
    },
  });
  await sock.relayMessage(jid, message, {});
  return 'messageHistoryNotice enviado via relayMessage';
}

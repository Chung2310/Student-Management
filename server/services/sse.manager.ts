import { Response } from "express";
export class SSEManager {
  private connections = new Map<string, Response[]>();

  addConnection(ownerId: string, res: Response) {
    if (!this.connections.has(ownerId)) {
      this.connections.set(ownerId, []);
    }
    this.connections.get(ownerId)!.push(res);
  }

  removeConnection(ownerId: string, res: Response) {
    if (!this.connections.has(ownerId)) return;
    const clients = this.connections.get(ownerId)!;
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
    }
    if (clients.length === 0) {
      this.connections.delete(ownerId);
    }
  }

  broadcast(ownerId: string, event: string, data: unknown) {
    const clients = this.connections.get(ownerId);
    if (!clients || clients.length === 0) {
      return;
    }
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach((client) => {
      client.write(message);
    });
  }
}

export const sseManager = new SSEManager();

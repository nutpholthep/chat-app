import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users = new Map<string, string>(); // เก็บ UserID และ Socket ID

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.users.entries()].find(([_, socketId]) => socketId === client.id)?.[0];
    if (userId) {
      this.users.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('register')
  handleRegister(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    this.users.set(userId, client.id);
    console.log(`User registered: ${userId} with socket ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { to: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const targetSocketId = this.users.get(data.to);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('receiveMessage', {
        from: client.id,
        message: data.message,
      });
    }
  }
}

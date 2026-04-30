import { Client, Room } from "@colyseus/sdk";

export async function connect(data: any = {}) {
    const client = new Client('http://localhost:2567');
    const room = await client.joinOrCreate('my_room', data);
    console.log("Connected to room:", room.name);
    return room;
}

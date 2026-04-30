import { Room, Client } from "@colyseus/core";
import { MyState, Player } from "./MyState.js";
import { Techs, Vector3 } from "./objects/ServerTechnicals.js";

 
export class MyRoom extends Room {
    maxClients = 4;
    state = new MyState();
 
    messages = {
        doSomething: (client: Client, payload: string) => {
            this.broadcast("broadcast", payload);
        }
    }

    onCreate() {
        this.onMessage("broadcast", (client, payload) => {
            console.log(`Игрок ${client.sessionId} прислал: ${payload}`);

            this.broadcast("broadcast", payload);
            
        });
    }
 
    // Called when a client joins the room
    onJoin(client: Client, data: any = {}) {
        const player = new Player();

        player.changeName(data.name);

        const lastPlayerPos = this.state.players.size > 0 ? Array.from(this.state.players)[this.state.players.size-1][1].position : new Vector3(-2, 0, 0);

        player.setPosition(lastPlayerPos.x + 2, lastPlayerPos.y, lastPlayerPos.z)

        this.state.players.set(client.sessionId, player);
    }
 
    // Called when a client leaves the room
    onLeave(client: Client, options: any) {
        this.state.players.delete(client.sessionId);
    }
 
    // Called when the room is disposed
    onDispose() { }
}
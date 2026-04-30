import * as THREE from 'three';
import { Player } from './Player';

export class GameManager {
    scene: THREE.Scene;
    players: Map<string, Player> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    addPlayer(id: string, state: any) {
        if (this.players.has(id)) {
            return this.players.get(id)!.mesh;
        }
        
        const playerName = state.authData?.name || "Player";
        const playerColor = state.color || 0x00ff00;
        
        const player = new Player(playerColor, playerName);
        
        if (state.position) {
            player.setPosition(state.position);
        }
        
        this.players.set(id, player);
        this.scene.add(player.mesh);
        
        console.log(`Added player ${id} (${playerName}) to scene`);
        return player.mesh;
    }

    removePlayer(id: string) {
        const player = this.players.get(id);
        if (player) {
            this.scene.remove(player.mesh);
            this.players.delete(id);
            console.log(`Removed player ${id} from scene`);
        }
    }
    
    updatePlayerFromServer(id: string, position: any) {
        const player = this.players.get(id);
        if (player && position) {
            player.setPosition(position);
        }
    }
}
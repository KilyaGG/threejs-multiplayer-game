import * as THREE from 'three';
import { Player } from './Player';
import { Techs } from './Technical'

export class GameManager {
    scene: THREE.Scene;
    players: Map<string, Player> = new Map();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    addPlayer(id: string, state: any) {
        const player = new Player(state.color, state.authData.name);
        player.setPosition(state.position);
        this.players.set(id, player);
        this.scene.add(player.mesh);
        return player.mesh
    }

    removePlayer(id: string) {
        const player = this.players.get(id);
        if (player) {
            this.scene.remove(player.mesh);
            this.players.delete(id);
        }
    }
}

import { Room, Client } from "@colyseus/core";
import { MyState, Player } from "./MyState.js";
import { Techs, Vector3, Quaternion, PHYSICS, NETWORK } from "./objects/ServerTechnicals.js";
import { PhysicsWorld } from "./objects/PhysicsWorld.js";

export class MyRoom extends Room {
    maxClients = 4;
    state = new MyState();
    
    gameLoopTimer: NodeJS.Timeout | null = null;
    physicsWorld: PhysicsWorld;
    lastUpdateTime: number = Date.now();

    onCreate() {
        this.autoDispose = false;
        
        this.physicsWorld = new PhysicsWorld();
        
        // Устанавливаем частоту обновления состояния
        this.setPatchRate(30); // 30 обновлений в секунду
        
        this.onMessage("updatePosition", (client, data) => {
            const direction = {
                x: data.direction?.x || 0,
                y: 0,
                z: data.direction?.z || 0
            };
            
            this.physicsWorld.movePlayer(client.sessionId, direction, 1/30);
        });
        
        this.onMessage("jump", (client) => {
            this.physicsWorld.jumpPlayer(client.sessionId);
        });
        
        this.onMessage("broadcast", (client, payload) => {
            this.broadcast("broadcast", {
                sender: this.state.players.get(client.sessionId)?.authData.name,
                content: payload,
                timestamp: Date.now()
            });
        });
        
        this.startGameLoop();
    }

    onJoin(client: Client, data: any = {}) {
        console.log(`Player ${client.sessionId} joined`);
        
        const player = new Player();
        player.changeName(data.name || "Player");
        
        const spawnPos = Techs.getSpawnPosition(this.state.players.size);
        player.setPosition(spawnPos.x, spawnPos.y, spawnPos.z);
        
        this.state.players.set(client.sessionId, player);
        this.physicsWorld.addPlayer(client.sessionId, spawnPos);
        
        this.broadcast("playerJoined", {
            id: client.sessionId,
            name: player.authData.name,
            color: player.color
        });
    }

    onLeave(client: Client, options?: any) {
        const player = this.state.players.get(client.sessionId);
        if (player) {
            this.broadcast("playerLeft", {
                id: client.sessionId,
                name: player.authData.name
            });
        }
        
        this.state.players.delete(client.sessionId);
        this.physicsWorld.removePlayer(client.sessionId);
        
        if (this.state.players.size === 0) {
            this.stopGameLoop();
        }
    }

    onDispose() {
        this.stopGameLoop();
    }
    
    private startGameLoop() {
        if (this.gameLoopTimer) return;
        
        // Запускаем обновление физики 30 раз в секунду
        this.gameLoopTimer = setInterval(() => {
            this.update();
        }, NETWORK.SERVER_UPDATE_RATE);
    }
    
    private stopGameLoop() {
        if (this.gameLoopTimer) {
            clearInterval(this.gameLoopTimer);
            this.gameLoopTimer = null;
        }
    }
    
    private update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        
        // Обновляем физику
        this.physicsWorld.update(deltaTime);
        
        // Синхронизируем позиции
        this.state.players.forEach((player, sessionId) => {
            const physicsPos = this.physicsWorld.getPlayerPosition(sessionId);
            if (physicsPos) {
                player.setPosition(physicsPos.x, physicsPos.y, physicsPos.z);
            }
        });
    }
}
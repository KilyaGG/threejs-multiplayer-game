import { Room, Client } from "@colyseus/core";
import { MyState, Player } from "./MyState.js";
import { Techs, Vector3, Quaternion } from "./objects/ServerTechnicals.js";

export class MyRoom extends Room {
    maxClients = 4;
    state = new MyState();
    
    // Частота обновлений для игрового цикла
    updateInterval: number = 50; // 20 раз в секунду
    gameLoopTimer: NodeJS.Timeout | null = null;

    onCreate() {
        this.autoDispose = false; // Не удаляем комнату автоматически
        
        // Обработка чата/сообщений
        this.onMessage("broadcast", (client, payload) => {
            console.log(`Игрок ${client.sessionId} прислал: ${payload}`);
            this.broadcast("broadcast", {
                sender: this.state.players.get(client.sessionId)?.authData.name,
                content: payload,
                timestamp: Date.now()
            });
        });
        
        // Обработка обновлений позиции и поворота
        this.onMessage("updatePosition", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.setPosition(data.x, data.y - 1, data.z);
                if (data.rotation) {
                    player.setRotation(data.rotation.x, data.rotation.y, data.rotation.z, data.rotation.w);
                }
            }
        });
        
        // Обработка выстрелов
        this.onMessage("shoot", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.handleShooting(client, data);
            }
        });
        
        // Обработка получения урона
        this.onMessage("takeDamage", (client, data) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                this.handleDamage(client.sessionId, data.damage, data.attackerId);
            }
        });
        
        // Запуск игрового цикла
        this.startGameLoop();
    }

    onJoin(client: Client, data: any = {}) {
        console.log(`Игрок ${client.sessionId} подключился:`, data);
        
        const player = new Player();
        player.changeName(data.name || "Player");
        
        // Умное размещение игроков
        const spawnPos = Techs.getSpawnPosition(this.state.players.size);
        player.setPosition(spawnPos.x, spawnPos.y, spawnPos.z);
        
        this.state.players.set(client.sessionId, player);
        
        // Отправляем сообщение о подключении
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
        
        // Если комната пуста, останавливаем игровой цикл
        if (this.state.players.size === 0) {
            this.stopGameLoop();
        }
    }

    onDispose() {
        this.stopGameLoop();
        console.log("Комната уничтожена");
    }
    
    private startGameLoop() {
        if (this.gameLoopTimer) return;
        
        this.gameLoopTimer = setInterval(() => {
            this.update();
        }, this.updateInterval);
    }
    
    private stopGameLoop() {
        if (this.gameLoopTimer) {
            clearInterval(this.gameLoopTimer);
            this.gameLoopTimer = null;
        }
    }
    
    private update() {
        this.state.gameTime += this.updateInterval / 1000;
        
        // Проверка на минимальное количество игроков для игры
        if (this.state.players.size < 2) {
            // Ждем больше игроков
            return;
        }
        
        // Здесь можно добавить игровую логику:
        // - Движение NPC
        // - Спавн предметов
        // - Проверка условий победы
        // - Обновление пуль и т.д.
    }
    
    private handleShooting(client: Client, data: any) {
        // Валидация и обработка выстрела
        const shooter = this.state.players.get(client.sessionId);
        if (!shooter) return;
        
        // Создаем сообщение о выстреле
        const shootMessage = {
            shooterId: client.sessionId,
            position: data.position,
            direction: data.direction,
            weaponType: data.weaponType || "pistol"
        };
        
        // Отправляем всем клиентам, кроме стрелявшего
        this.clients.forEach((otherClient) => {
            if (otherClient.sessionId !== client.sessionId) {
                otherClient.send("playerShoot", shootMessage);
            }
        });
        
        // Отправляем подтверждение стрелявшему
        shooter.addScore(1); // Очки за выстрел
    }
    
    private handleDamage(targetId: string, damage: number, attackerId: string) {
        const target = this.state.players.get(targetId);
        const attacker = this.state.players.get(attackerId);
        
        if (!target || !target.authData.isAlive) return;
        
        target.authData.takeDamage(damage);
        
        // Отправляем информацию о уроне всем клиентам
        const damageMessage = {
            targetId: targetId,
            attackerId: attackerId,
            damage: damage,
            currentHealth: target.authData.health,
            isAlive: target.authData.isAlive
        };
        
        this.broadcast("playerDamaged", damageMessage);
        
        // Обработка смерти
        if (!target.authData.isAlive) {
            if (attacker) {
                attacker.addScore(10); // Очки за убийство
            }
            
            // Возрождение через 3 секунды
            setTimeout(() => {
                if (target && this.state.players.has(targetId)) {
                    target.authData.heal(100);
                    const spawnPos = Techs.getSpawnPosition(Math.floor(Math.random() * 4));
                    target.setPosition(spawnPos.x, spawnPos.y, spawnPos.z);
                    
                    this.broadcast("playerRespawned", {
                        playerId: targetId,
                        position: target.position
                    });
                }
            }, 3000);
        }
    }
}
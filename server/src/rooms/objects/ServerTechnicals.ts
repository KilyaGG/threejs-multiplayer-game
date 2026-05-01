import { Schema, type } from "@colyseus/schema";

export class Vector3 extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
    }

    set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Quaternion extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;
    @type("number") w: number = 1;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    set(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

export const PHYSICS = {
    PLAYER_RADIUS: 0.4,
    PLAYER_HEIGHT: 1.8,
    PLAYER_MASS: 60,
    JUMP_FORCE: 9,
    GRAVITY: -25,
    MAX_SPEED: 12,
    GROUND_Y: -0.5,
};

export const NETWORK = {
    SERVER_UPDATE_RATE: 1000 / 30, // 30 обновлений в секунду с сервера
    CLIENT_SEND_RATE: 1000 / 30,   // 30 отправок в секунду на сервер
};

export class Techs {
    static getRandomColor() {
        return Math.random() * 0xffffff | 0;
    }
    
    static getSpawnPosition(playerCount: number): { x: number, y: number, z: number } {
        const radius = 3;
        const angle = (playerCount * Math.PI * 2) / 4;
        return {
            x: Math.cos(angle) * radius,
            y: 0,
            z: Math.sin(angle) * radius
        };
    }
}

export interface CollisionBox {
    position: { x: number; y: number; z: number };
    size: { width: number; height: number; depth: number };
    rotation?: { x: number; y: number; z: number }; // В градусах
}

export interface SpawnPoint {
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    team?: string; // Для командных режимов
}

export interface MapData {
    name: string;
    version: string;
    collisionBoxes: CollisionBox[];
    spawnPoints: SpawnPoint[];
    
    // Дополнительная информация
    boundaries?: {
        min: { x: number; y: number; z: number };
        max: { x: number; y: number; z: number };
    };
    
    // Особые зоны (опционально)
    deathZones?: CollisionBox[];
    capturePoints?: {
        position: { x: number; y: number; z: number };
        radius: number;
    }[];
}

export class AuthData extends Schema {
    @type("string") name: string = "PlayerDefault";
    @type("number") health: number = 100;
    @type("number") maxHealth: number = 100;
    @type("boolean") isAlive: boolean = true;

    constructor(name: string) {
        super();
        this.name = name;
    }
    
    takeDamage(amount: number) {
        this.health = Math.max(0, this.health - amount);
        this.isAlive = this.health > 0;
    }
    
    heal(amount: number) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        this.isAlive = true;
    }
}
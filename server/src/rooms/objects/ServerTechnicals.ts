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

export class Techs {
    static getRandomColor() {
        return Math.random() * 0xffffff | 0;
    }
    
    static getSpawnPosition(playerCount: number): { x: number, y: number, z: number } {
        // Размещаем игроков по кругу
        const radius = 3;
        const angle = (playerCount * Math.PI * 2) / 4; // Максимум 4 игрока
        return {
            x: Math.cos(angle) * radius,
            y: 0.5,
            z: Math.sin(angle) * radius
        };
    }
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
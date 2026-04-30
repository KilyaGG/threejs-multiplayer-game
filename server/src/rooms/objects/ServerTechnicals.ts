import { Schema, type } from "@colyseus/schema";

export class Vector3 extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
    @type("number") z: number = 0;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(); // Обязательно вызываем конструктор базового класса Schema
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Методы внутри Schema работают только на сервере
    set(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Techs {

    static getRandomColor() {
        return Math.random() * 0xffffff | 0;
    }

}


export class AuthData extends Schema{
    @type("string") name: string = "PlayerDefault";

    constructor(name: string) {
        super(); // Обязательно вызываем конструктор базового класса Schema
        this.name = name;
    }

}
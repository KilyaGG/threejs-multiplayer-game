import { Schema, MapSchema, type } from "@colyseus/schema";
import { Techs, Vector3, Quaternion, AuthData } from "./objects/ServerTechnicals.js";

export class Player extends Schema {
    @type(Vector3) position = new Vector3();
    @type(Quaternion) rotation = new Quaternion();
    @type(AuthData) authData = new AuthData("PlayerDefault");
    @type("number") color: number = Techs.getRandomColor();
    @type("number") score: number = 0;
    @type("string") currentWeapon: string = "pistol";

    setPosition(x: number, y: number, z: number) {
        this.position.set(x, y, z);
    }
    
    setRotation(x: number, y: number, z: number, w: number) {
        this.rotation.set(x, y, z, w);
    }

    changeName(name: string) {
        this.authData.name = name;
    }
    
    addScore(points: number) {
        this.score += points;
    }
}

export class Bullet extends Schema {
    @type("string") id: string;
    @type(Vector3) position = new Vector3();
    @type(Vector3) direction = new Vector3();
    @type("number") speed: number = 20;
    @type("number") damage: number = 10;
    @type("string") ownerId: string;
    
    constructor(id: string, ownerId: string, position: Vector3, direction: Vector3) {
        super();
        this.id = id;
        this.ownerId = ownerId;
        this.position = position;
        this.direction = direction;
    }
}

export class MyState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    
    // Временное хранение пуль (будет заменено на более эффективную систему)
    activeBullets: Bullet[] = [];
    
    // Игровые настройки
    maxPlayers: number = 4;
    gameTime: number = 0;
    isGameStarted: boolean = false;
}
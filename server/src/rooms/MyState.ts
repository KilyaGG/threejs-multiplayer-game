import { Schema, MapSchema, type } from "@colyseus/schema";
import { Techs, Vector3, AuthData } from "./objects/ServerTechnicals.js";
 
export class Player extends Schema {
    @type(Vector3) position = new Vector3();
    @type(AuthData) authData = new AuthData("PlayerDefault");
    @type("number") color: number = Techs.getRandomColor();

    setPosition(x: number, y: number, z: number) {
        this.position.set(x, y, z);
    }

    changeName(name: string) {
        this.authData.name = name;
    }
}
 
export class MyState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
}
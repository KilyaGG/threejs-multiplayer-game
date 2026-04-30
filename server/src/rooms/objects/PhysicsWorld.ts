import CANNON from 'cannon';
import { PHYSICS } from './ServerTechnicals.js';

export class PhysicsWorld {
    world: CANNON.World;
    playerBodies: Map<string, CANNON.Body> = new Map();
    groundBody: CANNON.Body;
    
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, PHYSICS.GRAVITY, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        (this.world.solver as any).iterations = 10;
        
        this.groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: new CANNON.Material('ground'),
            collisionFilterGroup: 1, // Группа для пола
            collisionFilterMask: 2 
        });
        
        this.groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        
        this.groundBody.position.set(0, PHYSICS.GROUND_Y, 0);
        
        (this.world as any).addBody(this.groundBody);
        
        const defaultMaterial = new CANNON.Material('default');
        const groundContact = new CANNON.ContactMaterial(
            this.groundBody.material!,
            defaultMaterial,
            {
                friction: 0.0,
                restitution: 0.0
            }
        );
        this.world.addContactMaterial(groundContact);
    }
    
    addPlayer(playerId: string, position: { x: number, y: number, z: number }) {
        const shape = new CANNON.Cylinder(
            PHYSICS.PLAYER_RADIUS,
            PHYSICS.PLAYER_RADIUS,
            PHYSICS.PLAYER_HEIGHT,
            8
        );
        
        const body = new CANNON.Body({
            mass: PHYSICS.PLAYER_MASS,
            shape: shape,
            linearDamping: 0.0, // Убрали damping чтобы не замедляло
            angularDamping: 0.99,
            fixedRotation: true,
            allowSleep: false,
            collisionFilterGroup: 2, // Группа для игроков
            collisionFilterMask: 1 
        });
        
        body.position.set(position.x, position.y, position.z);
        
        body.angularVelocity.set(0, 0, 0);
        body.inertia.set(0, 0, 0);
        body.invInertia.set(0, 0, 0);
        
        (this.world as any).addBody(body);
        this.playerBodies.set(playerId, body);
        
        console.log(`Added physics body for player ${playerId} at`, position);
        
        return body;
    }
    
    removePlayer(playerId: string) {
        const body = this.playerBodies.get(playerId);
        if (body) {
            (this.world as any).removeBody(body);
            this.playerBodies.delete(playerId);
            console.log(`Removed physics body for player ${playerId}`);
        }
    }
    
    movePlayer(playerId: string, direction: { x: number, y: number, z: number }, deltaTime: number) {
        const body = this.playerBodies.get(playerId);
        if (!body) {
            console.log(`No physics body for player ${playerId}`);
            return;
        }
        
        // Применяем скорость напрямую
        const speed = PHYSICS.MAX_SPEED;
        body.velocity.x = direction.x * speed;
        body.velocity.z = direction.z * speed;
        
        console.log(`Moving player ${playerId}: dir=${direction.x},${direction.z} vel=${body.velocity.x},${body.velocity.z}`);
    }
    
    jumpPlayer(playerId: string): boolean {
        const body = this.playerBodies.get(playerId);
        if (!body) return false;
        
        if (this.isOnGround(body)) {
            body.velocity.y = PHYSICS.JUMP_FORCE;
            console.log(`Player ${playerId} jumped!`);
            return true;
        }
        
        return false;
    }
    
    isOnGround(body: CANNON.Body): boolean {
        const playerBottom = body.position.y - PHYSICS.PLAYER_HEIGHT / 2;
        const groundTop = PHYSICS.GROUND_Y;
        const tolerance = 0.3;
        
        return Math.abs(playerBottom - groundTop) < tolerance && 
               Math.abs(body.velocity.y) < 0.5;
    }
    
    update(deltaTime: number) {
        const fixedTimeStep = 1 / 60;
        const maxSubSteps = 3;
        
        this.world.step(fixedTimeStep, deltaTime, maxSubSteps);
    }
    
    getPlayerPosition(playerId: string): { x: number, y: number, z: number } | null {
        const body = this.playerBodies.get(playerId);
        if (!body) return null;
        
        return {
            x: body.position.x,
            y: body.position.y,
            z: body.position.z
        };
    }
}
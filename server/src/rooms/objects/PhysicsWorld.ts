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
        
        const groundMaterial = new CANNON.Material('ground');
        const playerMaterial = new CANNON.Material('player');
        
        this.groundBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: groundMaterial,
            collisionFilterGroup: 1,
            collisionFilterMask: 2
        });
        
        this.groundBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        
        this.groundBody.position.set(0, PHYSICS.GROUND_Y, 0);
        
        (this.world as any).addBody(this.groundBody);
        
        const groundContact = new CANNON.ContactMaterial(
            groundMaterial,
            playerMaterial,
            {
                friction: 0.0,
                restitution: 0.0
            }
        );
        this.world.addContactMaterial(groundContact);
    }
    
    addPlayer(playerId: string, position: { x: number, y: number, z: number }) {
        // Используем сферу вместо цилиндра для более надежного контакта с землей
        const radius = 0.4;
        const height = 1.8;
        
        // Создаем составное тело: сфера (низ) + сфера (верх)
        const shape = new CANNON.Sphere(radius);
        
        const body = new CANNON.Body({
            mass: PHYSICS.PLAYER_MASS,
            shape: shape,
            material: new CANNON.Material('player'),
            linearDamping: 0.0,
            angularDamping: 0.99,
            fixedRotation: true,
            allowSleep: false,
            collisionFilterGroup: 2,
            collisionFilterMask: 1
        });
        
        // Спавним над землей: земля на -0.5, радиус сферы 0.4
        // Центр сферы должен быть на: groundY + radius = -0.5 + 0.4 = -0.1
        body.position.set(position.x, 3, position.z); // Упадет на землю
        
        body.angularVelocity.set(0, 0, 0);
        body.inertia.set(0, 0, 0);
        body.invInertia.set(0, 0, 0);
        
        (this.world as any).addBody(body);
        this.playerBodies.set(playerId, body);
        
        console.log(`Added player ${playerId} at y=3, will fall to ground`);
        
        return body;
    }
    
    removePlayer(playerId: string) {
        const body = this.playerBodies.get(playerId);
        if (body) {
            (this.world as any).removeBody(body);
            this.playerBodies.delete(playerId);
            console.log(`Removed player ${playerId}`);
        }
    }
    
    movePlayer(playerId: string, direction: { x: number, y: number, z: number }, deltaTime: number) {
        const body = this.playerBodies.get(playerId);
        if (!body) return;
        
        const speed = PHYSICS.MAX_SPEED;
        body.velocity.x = direction.x * speed;
        body.velocity.z = direction.z * speed;
    }
    
    jumpPlayer(playerId: string): boolean {
        const body = this.playerBodies.get(playerId);
        if (!body) return false;
        
        // Для сферы радиусом 0.4 на земле -0.5, центр сферы на -0.1
        const sphereCenter = body.position.y;
        const expectedGroundY = PHYSICS.GROUND_Y + 0.4; // -0.5 + 0.4 = -0.1
        const isNearGround = Math.abs(sphereCenter - expectedGroundY) < 0.15;
        const isStopped = Math.abs(body.velocity.y) < 0.3;
        
        console.log(`Player ${playerId}: y=${sphereCenter.toFixed(3)}, expected=${expectedGroundY}, nearGround=${isNearGround}, stopped=${isStopped}`);
        
        if (isNearGround && isStopped) {
            body.velocity.y = PHYSICS.JUMP_FORCE;
            console.log(`Player ${playerId} JUMPED!`);
            return true;
        }
        
        return false;
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
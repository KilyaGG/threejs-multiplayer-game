import CANNON from 'cannon';
import { PHYSICS, MapData } from './ServerTechnicals.js';
import { MapManager } from './MapManager.js';

export class PhysicsWorld {
    world: CANNON.World;
    playerBodies: Map<string, CANNON.Body> = new Map();
    playerContacts: Map<string, number> = new Map(); // Количество контактов с землей
    mapManager: MapManager;

    private groundMaterial = new CANNON.Material('ground');
    private playerMaterial = new CANNON.Material('player');
    
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, PHYSICS.GRAVITY, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        (this.world.solver as any).iterations = 10;
        
        this.mapManager = new MapManager(this.world);
        
        const playerGroundContact = new CANNON.ContactMaterial(
            this.playerMaterial,
            this.groundMaterial,
            {
                friction: 0.0, // Убирает прилипание к стенам
                restitution: 0.0, // Убирает лишние отскоки
                contactEquationStiffness: 1e6, // Делает коллизию жесткой
                contactEquationRelaxation: 30
            }
        );

        this.world.addContactMaterial(playerGroundContact);
        
        // Отслеживаем коллизии
        this.world.addEventListener('beginContact', (event: any) => {
            this.handleContact(event.bodyA, event.bodyB, true);
        });
        
        this.world.addEventListener('endContact', (event: any) => {
            this.handleContact(event.bodyA, event.bodyB, false);
        });
    }
    
    private handleContact(bodyA: CANNON.Body, bodyB: CANNON.Body, isBegin: boolean, contact?: any): void {
        this.playerBodies.forEach((playerBody, playerId) => {
            if (playerBody === bodyA || playerBody === bodyB) {
                // Если это начало контакта, проверяем, пол ли это
                if (isBegin && contact) {
                    // Вычисляем нормаль (упрощенно)
                    const contactNormal = new CANNON.Vec3();
                    // В Cannon.js в уравнении контакта есть нормаль
                    // Для простоты можно использовать проверку в цикле world.contacts
                }
                
                const currentContacts = this.playerContacts.get(playerId) || 0;
                this.playerContacts.set(playerId, isBegin ? currentContacts + 1 : Math.max(0, currentContacts - 1));
            }
        });
    }
    
    loadMap(mapData: MapData): void {
        // Передаем ссылку на материал, для которого мы настроили трение 0
        this.mapManager.loadMap(mapData, this.groundMaterial); 
    }
    
    getSpawnPoint(index: number): { x: number; y: number; z: number } | null {
        return this.mapManager.getSpawnPoint(index);
    }
    
    addPlayer(playerId: string, position: { x: number, y: number, z: number }) {
        const radius = 0.4;
        
        const shape = new CANNON.Sphere(radius);
        
        const body = new CANNON.Body({
            mass: PHYSICS.PLAYER_MASS,
            shape: shape,
            material: this.playerMaterial,
            linearDamping: 0.0,
            angularDamping: 0.99,
            fixedRotation: true,
            allowSleep: false,
            collisionFilterGroup: 2,
            collisionFilterMask: 1
        });
        
        body.position.set(position.x, position.y, position.z);
        
        body.angularVelocity.set(0, 0, 0);
        body.inertia.set(0, 0, 0);
        body.invInertia.set(0, 0, 0);
        
        (this.world as any).addBody(body);
        this.playerBodies.set(playerId, body);
        this.playerContacts.set(playerId, 0);
        
        console.log(`Added player ${playerId} at y=${position.y}`);
        
        return body;
    }
    
    removePlayer(playerId: string) {
        const body = this.playerBodies.get(playerId);
        if (body) {
            (this.world as any).removeBody(body);
            this.playerBodies.delete(playerId);
            this.playerContacts.delete(playerId);
            console.log(`Removed player ${playerId}`);
        }
    }

    isPlayerGrounded(playerId: string): boolean {
        const body = this.playerBodies.get(playerId);
        if (!body) return false;

        let grounded = false;

        // Проходим по всем уравнениям контактов в мире
        this.world.contacts.forEach((contact) => {
            // Проверяем, участвует ли тело игрока в этом контакте
            if (contact.bi === body || contact.bj === body) {
                const normal = new CANNON.Vec3();
                
                // Если игрок — это тело bj, нормаль направлена на него, 
                // если bi — инвертируем её. Нам нужно получить вектор, смотрящий "в игрока"
                if (contact.bi === body) {
                    contact.ni.negate(normal);
                } else {
                    normal.copy(contact.ni);
                }

                // Если нормаль контакта смотрит вверх (y > 0.5), значит под ногами опора
                if (normal.y > 0.5) {
                    grounded = true;
                }
            }
        });

        return grounded;
    }

    
    isPlayerInAir(playerId: string): boolean {
        return !this.isPlayerGrounded(playerId);
    }
    
    movePlayer(playerId: string, direction: { x: number, y: number, z: number }, deltaTime: number) {
        const body = this.playerBodies.get(playerId);
        if (!body) return;

        const grounded = this.isPlayerGrounded(playerId);
        
        if (grounded) {
            // На земле — жесткий контроль
            body.velocity.x = direction.x * PHYSICS.MAX_SPEED;
            body.velocity.z = direction.z * PHYSICS.MAX_SPEED;
        } else {
            // В воздухе — плавно добавляем скорость (Air Control), 
            // не трогая текущую инерцию и Y-скорость!
            const airSpeed = PHYSICS.MAX_SPEED * 0.5;
            const targetX = direction.x * airSpeed;
            const targetZ = direction.z * airSpeed;

            // Плавное приближение к нужной скорости в воздухе (интерполяция)
            body.velocity.x += (targetX - body.velocity.x) * deltaTime * 5;
            body.velocity.z += (targetZ - body.velocity.z) * deltaTime * 5;
        }
    }



    
    jumpPlayer(playerId: string): boolean {
        const body = this.playerBodies.get(playerId);
        if (!body) return false;
        
        if (this.isPlayerGrounded(playerId)) {
            body.velocity.y = PHYSICS.JUMP_FORCE;
            console.log(`Player ${playerId} JUMPED!`);
            return true;
        }
        
        return false;
    }
    
    update(deltaTime: number) {
        this.world.step(1/60, deltaTime, 3);

        this.playerBodies.forEach((body) => {
            // Если игрок падает — тянем его вниз сильнее (Fall Multiplier)
            if (body.velocity.y < 0) {
                body.velocity.y += PHYSICS.GRAVITY * 1.5 * deltaTime;
            }
        });
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
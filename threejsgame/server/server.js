import { Server } from 'socket.io';


let players = [];

const worldSize = 10;

const chunkLength = 10;

class Chunk {
    constructor(length, middle, chunkBlockdata) {
        this.length = length;
        this.middle = middle;
        this.chunkBlockdata = [];
    }
    GetChunkBounds(chunkLength) {
        let left = this.middle.x - chunkLength/2;
        let right = this.middle.x + chunkLength/2;

        let top = this.middle.z - chunkLength/2;
        let bottom = this.middle.z + chunkLength/2;
        
        const bounds = {
            left: left,
            right: right,
            top: top,
            bottom: bottom
        };
        
        return bounds;
    }
}

//let world = GenerateWorld(50, 50, 1, 100, 9);
let world = GenerateWorldChunks(worldSize, 3, 10, chunkLength);



// Создаем HTTP сервер 
const io = new Server(3000, {
  cors: {
    origin: "http://localhost:5173", // порт по умолчанию у Vite
    methods: ["GET", "POST"]
  }
});


console.log('Сервер запущен, ожидаю игроков...');

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);

    socket.emit('players-new-user', players);

    socket.on('playerConnect', (data) => {
        players.push(data);
        socket.emit('worldData-new-user', GetChunksToSend(data.position));
        console.log(`Игроков на сервере: ${players.length}`);
        socket.broadcast.emit('playerConnect', data);
    })

    socket.on('playerMove', (data) => {
      socket.emit('worldData-new-user', GetChunksToSend(data.position));
      console.log('Игрок изменил координаты:', data);

      players.forEach(player => {
        if (player.id === data.id) {
            player.position = data.position;
        }
      });
      
      socket.broadcast.emit('playerMove', data);
    });
    
    socket.on('disconnect', () => {
      socket.broadcast.emit('player-disconnect', socket.id);
      players.forEach((player, index) => {
        if (player.id === socket.id) {
            players.splice(index, 1);
        }
      });
      console.log('Пользователь отключился:', socket.id);
      
    });
});


function GetChunksToSend(position) {
    let chunksToSend = [];
    for (let i = 0; i < world.length; i++) {
        for (let j = 0; j < world.length; j++) {

            const bounds = world[i][j].GetChunkBounds(chunkLength);

            if (position.x >= bounds.left && position.x <= bounds.right) {
                if (position.z >= bounds.top && position.z <= bounds.bottom) {
                    chunksToSend.push(world[i][j]);
                    chunksToSend.push(world[i+1][j]);
                    chunksToSend.push(world[i-1][j]);
                    chunksToSend.push(world[i][j+1]);
                    chunksToSend.push(world[i][j-1]);
                    chunksToSend.push(world[i+1][j+1]);
                    chunksToSend.push(world[i-1][j-1]);
                    chunksToSend.push(world[i+1][j-1]);
                    chunksToSend.push(world[i-1][j+1]);
                }
                 
            }
            
        }
    }
    return chunksToSend;
}


function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function GenerateWorldChunks(worldSize, maxStructuresOnChunk, maxStructuresHeight, chunkLength) {
    let world = [];

    class Structure {
        constructor(height, size, x, z, color) {
            this.height = height;
            this.size = size;
            this.x = x;
            this.z = z;
            this.color = color;
        }
    };

    const worldCenter = worldSize*worldSize/2;

    for (let i = 0; i < worldSize; i++) {
        world[i] = [];
        for (let j = 0; j < worldSize; j++) {
            let chunk = new Chunk();
            chunk.length = chunkLength;
            let x  = j*chunkLength - worldCenter;;
            let z = i*chunkLength - worldCenter;
            chunk.middle = {x: x, z: z};
            for (let a = 0; a < maxStructuresOnChunk; a++) {
                const chunkBounds = chunk.GetChunkBounds(chunkLength);
                const x = getRandomInt(chunkBounds.left, chunkBounds.right);
                const z = getRandomInt(chunkBounds.top, chunkBounds.bottom);
                const structure = new Structure();
                structure.color = getRandomColor();
                structure.size = 1;
                structure.height = Math.floor(Math.random() * maxStructuresHeight) + 1;
                structure.x = x;
                structure.z = z;
                chunk.chunkBlockdata.push(structure);
            }
            world[i][j] = chunk;
        }
    }
    return world;
}


function GenerateWorld(earthlimitX, earthlimitZ, maxCubeSize, structureNumber, maxStructureHeight) {
    let worldObjects = [];

    class Structure {
        constructor(height, size, x, z, color) {
            this.height = height;
            this.size = size;
            this.x = x;
            this.z = z;
            this.color = color;
        }
    };
    for (let i = 0; i < structureNumber; i++) {
        let foundAFreePlace = false
        while (foundAFreePlace === false) {
            const coords = {
                x: Math.floor(Math.random() * (2*earthlimitX+1)) - earthlimitX,
                z: Math.floor(Math.random() * (2*earthlimitZ+1)) - earthlimitZ
            };
            let placeAlreadyTook = false;
            worldObjects.forEach(object => {
                if (object.x === coords.x && object.z === coords.z) {
                    placeAlreadyTook = true;
                }
            });
            if (!placeAlreadyTook) {
                const structure = new Structure();
                structure.color = getRandomColor();
                structure.size = Math.floor(Math.random()*maxCubeSize) + 1;
                structure.height = Math.floor(Math.random() * maxStructureHeight) + 1;
                structure.x = coords.x;
                structure.z = coords.z;
                worldObjects.push(structure);
                foundAFreePlace = true;
            }
        }

    }

    console.log(`World generated successfully with number of objects ${worldObjects.length}`);
    return worldObjects;
}
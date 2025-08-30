import { Server } from 'socket.io';


let players = [];

const worldSize = 10;
const worldSeed = 214331;
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

let world = GenerateWorldChunks(worldSize, 3, 10, chunkLength, worldSeed);



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
        socket.emit('worldData-new-user', GetChunksToSendImproved(data.position));
        console.log(`Игроков на сервере: ${players.length}`);
        socket.broadcast.emit('playerConnect', data);
    })

    socket.on('playerMove', (data) => {
      socket.emit('worldData-new-user', GetChunksToSendImproved(data.position));
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

function GetChunksToSendImproved(position) {

    let chunksToSend = [];

    let x = position.x;
    let z = position.z;

    const worldCenter = worldSize*worldSize/2;

    let j = Math.floor((x + worldCenter)/chunkLength);
    let i = Math.floor((z + worldCenter)/chunkLength);
    try {
        chunksToSend.push(world[i][j]);
        chunksToSend.push(world[i+1][j]);
        chunksToSend.push(world[i-1][j]);
        chunksToSend.push(world[i][j+1]);
        chunksToSend.push(world[i][j-1]);
        chunksToSend.push(world[i+1][j+1]);
        chunksToSend.push(world[i-1][j-1]);
        chunksToSend.push(world[i+1][j-1]);
        chunksToSend.push(world[i-1][j+1]);
    } catch {}
    return chunksToSend;
}

function GenerateWorldChunks(worldSize, maxStructuresOnChunk, maxStructuresHeight, chunkLength, seed = 12345) {
    let world = [];

    // Детерминированный генератор псевдослучайных чисел
    function seededRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }

    // Локальные функции для работы с детерминированными значениями
    const getRandomInt = (min, max) => Math.floor(seededRandom() * (max - min + 1)) + min;
    const getRandomColor = () => `rgb(${getRandomInt(0, 255)}, ${getRandomInt(0, 255)}, ${getRandomInt(0, 255)})`;

    class Structure {
        constructor(height, size, x, z, color) {
            this.height = height;
            this.size = size;
            this.x = x;
            this.z = z;
            this.color = color;
        }
    }

    const worldCenter = worldSize * worldSize / 2;

    for (let i = 0; i < worldSize; i++) {
        world[i] = [];
        for (let j = 0; j < worldSize; j++) {
            let chunk = new Chunk();
            chunk.length = chunkLength;
            let x = j * chunkLength - worldCenter;
            let z = i * chunkLength - worldCenter;
            chunk.middle = { x: x, z: z };
            
            for (let a = 0; a < maxStructuresOnChunk; a++) {
                const chunkBounds = chunk.GetChunkBounds(chunkLength);
                const x = getRandomInt(chunkBounds.left, chunkBounds.right);
                const z = getRandomInt(chunkBounds.top, chunkBounds.bottom);
                const structure = new Structure();
                structure.color = getRandomColor();
                structure.size = 1;
                structure.height = getRandomInt(1, maxStructuresHeight);
                structure.x = x;
                structure.z = z;
                chunk.chunkBlockdata.push(structure);
            }
            world[i][j] = chunk;
        }
    }

    console.log(`Создал мир ${worldSize}x${worldSize} с сидом ${seed}`);

    return world;
}
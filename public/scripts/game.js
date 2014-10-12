//get playerID from passed url
var playerID = location.search.split('playerID=')[1]

//setup Quintus game engine
var Q = window.Q = Quintus({development: true}).include("Scenes, Sprites, 2D, Input, Touch, UI, TMX, Audio, Anim");
Q.setup("game",{
	"scaleToFit": true,
	"width": 800,
	"height":800
	}).touch(Q.SPRITE_ALL);
//Q.setup("game").touch(Q.SPRITE_ALL);

//setup socket
var socket = Q.socket = io.connect('http://localhost:1337');

//fetch the rest of necessary player data for the level
socket.on("gameInitData", function(data){
	Q.ROLE = data.players[playerID-1].role;
	console.log(Q.ROLE);
});

//initialize global variables
Q.SPRITE_CAR = 1;
Q.SPRITE_DIRECTION = 2;
Q.SPRITE_SPAWN = 4;

//enable inputs
Q.input.keyboardControls();
Q.input.joypadControls();

//disable gravity
Q.gravityY = 0;
Q.gravityX = 0;

Q.SCORE = 0;
Q.SPEED = 10;
Q.DELAY = 10;
Q.SUCCESS = 10;
Q.FAIL = 5;

// create general component for directions
/*Q.component("direction", {
	added: function() {
		var entity = this.entity;
		entity.on("click", function() {
			console.log("direction clicked!");
		});
	}
});*/

// insert direction pointers
/*Q.Sprite.extend("Left", {
	init: function(p) {
		this._super(p, { });
		//this.add("direction");
		console.log("left");
	}
});*/

var spawns = [];

Q.Sprite.extend("Spawn", {
	init: function(p) {

		var openVX = 0;
		var openVY = 0;
		if(p.direction=="Left"){
			openVX = 1 * Q.SPEED;
			openVY = 0;
		} else if(p.direction=="Down"){
				openVX = 0;
			openVY = -1 * Q.SPEED;
		} else if(p.direction=="Right"){
			openVX = -1 * Q.SPEED;
			openVY = 0;
		} else if(p.direction=="Up"){
			openVX = 0;
			openVY = 1 * Q.SPEED;
		}

		this._super(p, {
			type: Q.SPRITE_SPAWN,
			collisionMask: Q.SPRITE_CAR,
			openVX: openVX,
			openVY: openVY,
		});
		spawns[spawns.length] = this;
	}
});

var directions = [];

Q.Sprite.extend("Direction", {
	init: function(p) {
		this._super(p, {
			type: Q.SPRITE_DIRECTION,
			collisionMask: Q.SPRITE_NONE,
			sensor: true,
		});
		this.on("touch");
		this.on("sensor");
		directions.push(this);
	},
	touch: function(touch) {
		if(Q.ROLE === "operator"){
			if(touch.obj.p.sheet=="Left"){
				touch.obj.p.sheet="Down";
			}else if(touch.obj.p.sheet=="Down"){
				touch.obj.p.sheet="Right";
			}else if(touch.obj.p.sheet=="Right"){
				touch.obj.p.sheet="Up";
			}else if(touch.obj.p.sheet=="Up"){
				touch.obj.p.sheet="Left";
			}
			socket.emit("directionChanged", {"id":touch.obj.p.id, "dir":touch.obj.p.sheet});
		}
	},
	sensor: function(col) {
		if(playerID==1){
			col.p.sensorDirection = this;
		}
	}
	});

//change direction on remote directionChanged event
socket.on("directionChanged", function(data){
	for(var i = 0; i < directions.length; i++) {
    	if(directions[i].p.id==data.id){
    		directions[i].p.sheet=data.dir;
    	}
  	}
});

var carCount = 0;
var spawnedCars = new Object();
Q.Sprite.extend("Car", {
	init: function(data) {
		//kind of cars
		var cars = ["Car_Red","Car_Blue","Car_Yellow"];

		if(typeof data !== "undefined"){
			this._super({
				carid: data.carid,
				vx: 0,
				vy: 0,
				type: Q.SPRITE_CAR,
				collisionMask: Q.SPRITE_SPAWN | Q.SPRITE_DIRECTION,
				spawnStart: spawns[data.spawnStartId],
				spawnTarget: spawns[data.spawnTargetId],
				x: data.x,
				y: data.y,
				lastX: 0,
				lastY: 0,
				sensorDirection: data.sensorDirection,
				sheet: data.sheet,
				identifyTarget: data.identifyTarget,
				//x = spawnStart.
			});
			
			this.on("touch");

			this.add("2d");

		}else{
	
			//what car to spawn
			var carId = Math.floor(Math.random() * (cars.length-1));

			//get start and target spawn points
			var spawnStartId = Math.floor(Math.random()*(spawns.length-1));
			var spawnTargetId = Math.floor(Math.random()*(spawns.length-1));
			while(spawnStartId==spawnTargetId){
				spawnTargetId = Math.floor(Math.random()*(spawns.length-1));
			}

			//set initial movement
			var vx = 0;
			var vy = 0;

			if(spawns[spawnStartId].p.direction=="Left"){
				vx = -1 * Q.SPEED;
				vy = 0;
			}else if(spawns[spawnStartId].p.direction=="Down"){
				vx = 0;
				vy = 1 * Q.SPEED;
			}else if(spawns[spawnStartId].p.direction=="Right"){
				vx = 1 * Q.SPEED;
				vy = 0;
			}else if(spawns[spawnStartId].p.direction=="Up"){
				vx = 0;
				vy = -1 * Q.SPEED;
			}

			carCount++;

			this._super({
				carid: carCount,
				vx: vx,
				vy: vy,
				type: Q.SPRITE_CAR,
				collisionMask: Q.SPRITE_SPAWN | Q.SPRITE_DIRECTION,
				spawnStart: spawns[spawnStartId],
				spawnTarget: spawns[spawnTargetId],
				x: spawns[spawnStartId].p.x,
				y: spawns[spawnStartId].p.y,
				lastX: 0,
				lastY: 0,
				sensorDirection: false,
				sheet: cars[carId],
				identifyTarget: 0,
				//x = spawnStart.
			});

			this.on("touch");
			
			if(playerID==1){
				this.on("hit");
			}
			this.add("2d");
			//console.log(this.p.spawnStart);

			socket.emit("newCar", {
				"carid":this.p.carid,
				"vx":this.p.vx,
				"vy":this.p.vy,
				"type":this.p.type,
				"collisionMask":this.p.collisionMask,
				"spawnStartId":spawnStartId,
				"spawnTargetId":spawnTargetId,
				"x":this.p.x,
				"y":this.p.y,
				"lastX":this.p.lastX,
				"lastY":this.p.lastY,
				"sensorDirection":this.p.sensorDirection,
				"sheet": this.p.sheet,
				"identifyTarget": this.p.identifyTarget});
		}
		spawnedCars[this.p.carid] = this;
	},
	step: function(dt) {
		if(playerID==1){
			//restore last movement
			var lastX = this.p.lastX;
			var lastY = this.p.lastY;

			//calculate next movement
			var nextX = this.p.x + this.p.vx * dt;
			var nextY = this.p.y + this.p.vy * dt;

			//calculate change of direction
			if(this.p.sensorDirection != false){
				//sensor detected
				if((this.p.sensorDirection.p.sheet == "Left" && this.p.vx <= 0) ||
				(this.p.sensorDirection.p.sheet == "Down" && this.p.vy >= 0) ||
				(this.p.sensorDirection.p.sheet == "Right" && this.p.vx >= 0) ||
				(this.p.sensorDirection.p.sheet == "Up" && this.p.vy <= 0)){
						

					var dirX = this.p.sensorDirection.p.x;
					var dirY = this.p.sensorDirection.p.y;
					var restDist = 0.0;

					if(this.p.vx == 0 && this.p.vy != 0){
						if(lastY >= dirY && dirY > nextY){
							restDist = dirY-nextY;
						}else if(lastY <= dirY && dirY < nextY){
							restDist = nextY-dirY;
						}else{
							//no step over center
						}
					}else if(this.p.vy == 0 && this.p.vx != 0){
						if(lastX >= dirX && dirX > nextX){
							restDist = dirX-nextX;
						}else if(lastX <= dirX && dirX < nextX){
							restDist = nextX-dirX;
						}else{
							//no step over center
						}
					}else{
						console.log("Car has no speed!");
					}

					

					if(restDist > 0.0){
						if(this.p.sensorDirection.p.sheet == "Left"){
							this.p.vx = -1 * Q.SPEED;
							this.p.vy = 0;
							nextX = this.p.sensorDirection.p.x-restDist;
							nextY = this.p.sensorDirection.p.y;
						}else if(this.p.sensorDirection.p.sheet == "Down"){
							this.p.vx = 0;
							this.p.vy = 1 * Q.SPEED;
							nextX = this.p.sensorDirection.p.x;
							nextY = this.p.sensorDirection.p.y+restDist;
						}else if(this.p.sensorDirection.p.sheet == "Right"){
							this.p.vx = 1 * Q.SPEED;
							this.p.vy = 0;
							nextX = this.p.sensorDirection.p.x+restDist;
							nextY = this.p.sensorDirection.p.y;
						}else if(this.p.sensorDirection.p.sheet == "Up"){
							this.p.vx = 0;
							this.p.vy = -1 * Q.SPEED;
							nextX = this.p.sensorDirection.p.x;
							nextY = this.p.sensorDirection.p.y-restDist;
						}
					}
					
				}

				//store movement as last movement and apply movement
				this.p.lastX = nextX;
				this.p.lastY = nextY;
				this.p.x = nextX; 
				this.p.y = nextY; 

				//reset direction sensor
				this.p.sensorDirection = false;

			}else{

			}
		
			socket.emit("carUpdate", {"carid": this.p.carid, "x": this.p.x, "y": this.p.y});
		}

		//identifiy target when clicked
		if(this.p.identifyTarget > 0){
			if(Math.floor(this.p.identifyTarget/0.2)%2==0){
				this.p.spawnTarget.p.opacity = 0.2;
			}else if (Math.floor(this.p.identifyTarget/0.2)%2==1){
				this.p.spawnTarget.p.opacity = 1;
			}else{
				console.log("identifiy target error")
			}
		}else{
			this.p.identifyTarget = 0;
			this.p.spawnTarget.p.opacity = 1;
		}
		this.p.identifyTarget -=dt;
		
	},
	touch: function(touch) {
		if(Q.ROLE === "disponent"){
			this.p.identifyTarget = 1;
		}
	},
	hit: function(col) {
		if(playerID==1){
			if(col.obj.isA("Spawn")){

				if(col.obj.p.openVX == this.p.vx && col.obj.p.openVY == this.p.vy){

					if(col.obj == this.p.spawnTarget){
						Q.SCORE += Q.SUCCESS;
					}else{
						Q.SCORE -= Q.FAIL;
					}

					console.log(Q.SCORE);
					this.destroy();
					socket.emit("carHitSpawn", {"carid":this.p.carid, "score":Q.SCORE});
				}
			}
		}
	}
});

socket.on("carHitSpawn",function(data){
	spawnedCars[data.carid].destroy();
	Q.SCORE = data.score;
	console.log(Q.SCORE);
});

socket.on("newCar", function(data){
	if(playerID != 1){
		Q.stages[Q.activeStage].insert(new Q.Car(data));
	}
});

socket.on("carUpdate",function(data){
	//console.log(data);
	//console.log(spawnedCars);
	spawnedCars[data.carid].p.x = data.x;
	spawnedCars[data.carid].p.y = data.y;
});

Q.GameObject.extend("CarSpawn", {
	init: function() {
		this.p = {
			spawn: 0,
			spawnDelay: Q.DELAY,
		};
	},
	update: function(dt) {
		this.p.spawn -= dt;

		if(this.p.spawn < 0){
			//spawn actually
			this.stage.insert(new Q.Car());
			//update next spawn time
			this.p.spawn = this.p.spawnDelay;
		}
	}
});

//define initial scene
Q.scene("levelStart", function(stage) {
	Q.stageTMX("level_test.tmx", stage);
	//window.stage = stage;
	if(playerID==1){
		stage.insert(new Q.CarSpawn());
	}
});

//console.log("defined scene");

//load assets
Q.loadTMX("level_test.tmx, spritesheet.png, sprites.json, sprites.png", function() {
	Q.compileSheets("sprites.png", "sprites.json");
	Q.stageScene("levelStart");

	socket.emit("gameInit");
});
//console.log("loaded TMX");+



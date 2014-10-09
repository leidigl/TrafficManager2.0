	

	var players = [];
	var socket = io.connect('http://localhost:1337');
	var UiPlayers = document.getElementById("players");

 

	var Q = window.Q = Quintus({development: true}).include("Scenes, Sprites, 2D, Input, Touch, UI, TMX, Audio, Anim");
	Q.setup({
		width: 320,
		height: 180,
		scaleToFit: true
	}).touch(Q.SPRITE_ALL);

	//Q.setImageSmoothing(false);

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

	Q.Sprite.extend("Direction", {
		init: function(p) {
			this._super(p, {
				type: Q.SPRITE_DIRECTION,
				collisionMask: Q.SPRITE_NONE,
				sensor: true,
			});
			this.on("touch");
			this.on("sensor");
		},
		touch: function(touch) {
			if(touch.obj.p.sheet=="Left"){
				touch.obj.p.sheet="Down";
			}else if(touch.obj.p.sheet=="Down"){
				touch.obj.p.sheet="Right";
			}else if(touch.obj.p.sheet=="Right"){
				touch.obj.p.sheet="Up";
			}else if(touch.obj.p.sheet=="Up"){
				touch.obj.p.sheet="Left";
			}
		},
		sensor: function(col) {
			col.p.sensorDirection = this;
		}
 	});

	Q.Sprite.extend("Car", {
		init: function() {

			//kind of cars
			var cars = ["Car_Red","Car_Blue","Car_Yellow"];
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

			this._super({
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
			this.on("hit");
			this.add("2d");
			//console.log(this.p.spawnStart);
		},
		step: function(dt) {
	
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
			}else{

			}

			//store movement as last movement and apply movement
			this.p.lastX = nextX;
			this.p.lastY = nextY;
			this.p.x = nextX; 
			this.p.y = nextY; 

			//reset direction sensor
			this.p.sensorDirection = false;

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
			console.log("touch")
			this.p.identifyTarget = 1;
		},
		hit: function(col) {
			if(col.obj.isA("Spawn")){

				if(col.obj.p.openVX == this.p.vx && col.obj.p.openVY == this.p.vy){
	
					if(col.obj == this.p.spawnTarget){
						Q.SCORE += Q.SUCCESS;
					}else{
						Q.SCORE -= Q.FAIL;
					}

					console.log(Q.SCORE);
					this.destroy();
				}
			}
		}
	})

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

	socket.on('count', function (data) {
      	UiPlayers.innerHTML = 'Players: ' + data['playerCount'];
    });

	//define scene
	Q.scene("level", function(stage) {
		Q.stageTMX("level_test.tmx", stage);
		stage.insert(new Q.CarSpawn());
	});
	//console.log("defined scene");

	//load assets
	Q.loadTMX("level_test.tmx, spritesheet.png, sprites.json, sprites.png", function() {
		Q.compileSheets("sprites.png", "sprites.json");
		Q.stageScene("level");
	});
	//console.log("loaded TMX");+


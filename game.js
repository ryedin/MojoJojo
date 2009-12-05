(function() {
	
	//private methods
	function gameLoop(game) {
		game.fire("gameLoopBegin");
		
		game.fire("gameLoopEnd");
	}
	
	jojo.Game = Class.create(jojo.event.EventPublisher, {
		frameDelay: 30,
		initialize: function($super, options) {
			//basic validation: require a canvas element to be passed in
			if (!options || !options.canvas) {
				throw new Error("The MojoJojo.Game class requires a canvas element to be passed into the constructor");
			}
			
			//base class construction			
			$super(options);
			
			//entity management objects
			this.entityCollection = []; //flat array of all entities that can be used for sorting algorithms
			this.entityCache = {}; //indexed associative array for fast retrieval
			this.entityKeys = []; //array of keys used to index entities in the cache object
						
			//setup options
			this.frameDelay = options.frameDelay || this.frameDelay;
			this.canvas = options.canvas; //the canvas element to use to draw the game scenes to and listen to events
			this.config = options.config;
			if (options.configPath) {
				this.loadConfig(options.configPath);
			}
			
			//pause game on explicit errors
			this.on("error", this.pauseGame.bind(this));
		},
		loadConfig: function(path) {
			var me = this;
			this.configPath = path;
			var request = new Ajax.Request(path, { 
				method: 'get',
				evalJSON: 'force',
				onSuccess: function(args) {
					me.config = args.responseJSON;
					me.fire("configLoaded");
				},
				onFailure: function(args) {
					me.fire("error", {
						source: "loadConfig",
						message: "Failure loading config file",
						data: args
					});
				}
			});
		},
		startGame: function(options) {
			if (options) {
				Object.extend(this, options);
			}
			var me = this;
			if (!this.wired) { //only want to wire the Mojo listeners once per instance
				this.ctx = this.canvas.getContext('2d');
				Mojo.Event.listen(this.canvas, 'mousedown', this.handleTouch.bind(this));
			    Mojo.Event.listen(this.canvas, 'mouseup', this.handleMouseUp.bind(this));
				Mojo.Event.listen(this.canvas, 'mousemove' , this.handleMouseMove.bind(this));
				this.wired = true;
			}
			this.fire("beforeGameStart");
			if (!this.preventGameStart) {
				this.gameInterval = setInterval(function(){
					try {
						gameLoop(me);
					} 
					catch (error) {
						me.fire("error", {
							source: "gameLoop",
							message: "Failure in gameLoop: " + error.message
						});
					}
				}, this.frameDelay);
				this.gameRunning = true;
				this.fire("gameStarted");
			}
		},
		pauseGame: function() {
			if (this.gameRunning && this.gameInterval) {
				this.fire("beforeGamePause");
				if (!this.preventGamePause) {
					clearInterval(this.gameInterval);
					delete this.gameInterval;
					this.gameRunning = false;
					this.fire("gamePaused");
				}
			}
		},
		handleTouch: function(event) {
			this.fire("touch", {event: event});
		    //handle entity touch events
		    var touchedEntities = findTouchedEntities();//pseudo-code
		    if (touchedEntities) {
				for (var i = 0, _e = touchedEntities; i < touchedEntities.length; i++) {
					_e[i].fire("touch", {game: this, event: event});
				}
			}
		},
		handleMouseUp: function(event) {
			this.fire("mouseUp", {event: event});
		    //handle entity click events
		    var clickedEntities = findClickedEntities(event);//pseudo-code
		    if (clickedEntities) {
				for (var i = 0, _e = clickedEntities; i < clickedEntities.length; i++) {
					_e[i].fire("click", {game: this, event: event});
				}
			}
		},
		handleMouseMove: function(event) {
			this.fire("mouseMove", {event: event});
		    //handle entity "untouch" events (entities where the previous x/y/z was in touchzone but new x/y/z is not)
		    var untouchedEntities = findUntouchedEntities(event);//pseudo-code
		    if (untouchedEntities) {
				for (var i = 0, _e = untouchedEntities; i < untouchedEntities.length; i++) {
					_e[i].fire("untouch", {game: this, event: event});
				}
			}
		    //handle new entity touch events
			var newTouchedEntities = findNewTouchedEntities(event);//pseudo-code
		    if (newTouchedEntities) {
				for (var i = 0, _e = newTouchedEntities; i < newTouchedEntities.length; i++) {
					_e[i].fire("touch", {game: this, event: event});
				}
			}
		},
		addEntity: function(entity) {
			if (!entity.addedToCollection) {
				this.fire("beforeAddEntity", {entity: entity});
				this.entityCollection.push(entity);
				//allow custom indexing function on entity classes (recommended)
				var key = entity.getIndexKey ? entity.getIndexKey() : entity.id;
				this.entityCache[key] = entity;
				this.entityKeys.push(key);
				entity.addedToCollection = true;
				entity.game = this;
				//allow entity classes to define logic upon being added to the scene (for example, for initial pathfinding calculations or other setup)
				entity.fire("added");
				this.fire("entityAdded", {entity: entity});
			}
		}
	});
	
})();

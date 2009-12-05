(function() {
	
	/**
	 * Root namespace for entity class definitions and services
	 */
	jojo.ns("jojo.entity");
	
	/**
	 * Base Entity class.
	 * For the sake of MojoJojo, all entities are defined as Canvas aware objects that have at least the following public members:
	 * {
	 * 		id: string (should be unique across all created entities; if no id is provided, a system generated one will be created automatically via jojo.id()),
	 * 		x: int (current x position in relation to the canvas viewable area; can be negative),
	 * 		y: int (current y position in relation to the canvas viewable area; can be negative),
	 * 		z: int (current z-index in relation to other entities; will determine draw order and affect clickability if other entities are overlapping; can be negative),
	 * 		draw: function(options) {} (will do the work of drawing the entity's UI to the game canvas based on current state)
	 * }
	 * 
	 * Please note that currently this is a 2d game engine, so z really means z-index, not a coordinate on a 3d z-axis
	 */
	jojo.entity.Entity = Class.create(jojo.fsm.FiniteStateMachine, {
		x: 0,
		y: 0,
		z: 0,
		initialize: function($super, options) {
			this.id = options && options.id ? options.id : jojo.id();
			$super(options);
		},
		draw: function() {
			//base class will simply perform validation that there is a game and a canvas available
			if (!this.game || !this.game.canvas) {
				throw new Error("Cannot perform drawing operations without first having a game and canvas object set.");
			}
		}
	});
	
	/**
	 * Sprite based entity. Supports defining multiple underlying images which can be swapped out during state transitions (for buttons or animations, etc).
	 * 
	 * Note: the default draw logic for a SpriteEntity will issue a drawImage(x,y,w,h) command against the canvas 2d context,
	 * where the entity's current x/y coords are in the center of the rectangle,
	 * and will draw the image that is set as the entity's 'currentImage'
	 */
	jojo.entity.SpriteEntity = Class.create(jojo.entity.Entity, {
		w: 0,
		h: 0,
		initialize: function($super, options) {
			$super(options);
			
			if (options) {
				this.images = options.images || []; //should be an array of Image objects	
			}
			if (this.images && this.images.length > 0) {
				this.currentImage = this.images[0];
			}
		},
		draw: function($super) {
			$super();
			
			this.game.ctx.drawImage(this.currentImage, (this.x - (this.w/2)), (this.y - (this.h/2)), this.w, this.h);
		}
	});
	
})();

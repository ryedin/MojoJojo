(function() {
	
	/**
	 * Root namespace for Finite State Machine class definitions and services
	 */
	jojo.ns("jojo.fsm");
	
	//private variables and methods ----------------------------------------------------
	
	//note: an execution scope is required due to js lack of block level scoping in for..in loops (in anything else for that matter, too)
	//(otherwise a simple single closure would result in erroneous values for eventName at time of calling)
	// - more efficient to define once here vs. anonymous closure in loop body (including calling .bind(this) which is way overused by people)
	function wireEvent(fsm, eventName, state) { 
		fsm.on(eventName, function(args) {
			fsm.handleEvent(eventName, args);
		});
	}
	
	jojo.fsm.FiniteStateMachine = Class.create(jojo.event.EventPublisher, {
		initialize: function($super, options) {
			//basic constructor validation - all FSMs must be defined with at least 1 state, and an 'initial' state must be present
			if (!options || !options.states || !options.states.initial) {
				throw new Error("All Finite State Machines must be defined with states, and there must be at least an 'initial' state defined.");
			}
			
			//super class instantiation
			$super(options);
			
			//wire up state transitions for any event handlers found in each state
			this.states = options.states;
			for (var state in this.states) {
				for (var eventName in this.states[state]) {
					wireEvent(this, eventName);
				}
			}
			
			//set initial state and fire stateStartup event
			this.currentState = this.states.initial;
			this.fire("stateStartup");
		},
		handleEvent: function(eventName, args) {
			if (this.currentState[eventName]) {
				var newState = this.currentState[eventName](args);
				if (newState && newState !== this.currentState) {
					this.previousState = this.currentState;
					this.currentState = newState;
					//fire newState event, passing event data that caused the state transition in case some listeners are interested in that info
					this.fire("newState", {eventName: eventName, eventArgs: args});
				}
			}
		}
	});
	
})();

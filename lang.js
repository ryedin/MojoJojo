jojo.ns("jojo.lang");

/**
 * Class to handle collection registration/removal with optional events
 */
jojo.lang.Registry = Class.create();
jojo.lang.Registry.prototype = {
	/**
	 * Creates a new Registry
	 * @constructor
	 * @param {Boolean} unique  True to require unique IDs for all items in the registry
	 * @param {Boolean} fireEvents  True to implement an event publisher
	 * @param {String} uniqueErrorMessage   Error message to throw when unique property is violated
	 */
	initialize: function(unique, fireEvents, uniqueErrorMessage) {
		//public properties
		this.items = [];
		this.itemCache = {};		
		if (typeof unique == "undefined" || unique == null) {
			unique = true;
		}
		this.unique = unique;			
		this.uniqueErrorMessage = uniqueErrorMessage || "Error: All items in this registry instance must have unique IDs.";
		
		//decorate with event functionality if needed
		if (typeof fireEvents == "undefined" || fireEvents == null) {
			fireEvents = false;
		}
		this.fireEvents = fireEvents;
		if (this.fireEvents) {
			Object.extend(this, new jojo.event.EventPublisher());
		}
	},
	/**
	 * Add an item to the registry
	 * @param {Object} item Item to be added
	 * @param {Boolean} onlyAddIfNotAlreadyAdded    True to check if an item already exists with the current item ID - if one exists, method will return false
	 * @param {Integer} stackIndex  Optional, where to insert the item into the stack/list of registry items
	 * @return {Boolean}
	 */
	add: function(item, onlyAddIfNotAlreadyAdded, stackIndex) {			
		if (item.id) {
		    if (onlyAddIfNotAlreadyAdded && this.findById(item.id)) {
				return false;
			}
			if (this.unique && this.findById(item.id) != null) {
				throw new Error(this.uniqueErrorMessage + "\n\nid: " + item.id);
			}
		    
		    if (stackIndex != undefined && !isNaN(stackIndex)) {
				if (this.items.length == 0) {
					this.items.push(item);
				}
				else {
					var tmpItems = [];
					stackIndex = stackIndex < 0 ? 0 : (stackIndex > this.items.length - 1 ? this.items.length - 1 : stackIndex);
					this.each(function(h, index){
						if (index == stackIndex) {
							tmpItems.push(item);
						}
						tmpItems.push(h);
					});
					this.items = tmpItems;
				}
			}
			else {
				this.items.push(item);
			}
		        
			if (this.unique) {
				this.itemCache[item.id] = item;
			}
			
			if (this.fireEvents) {
				this.fire("itemAdded", {item: item});
			}
		} else {
			throw new Error("Items must have 'id' properties in order to be added to a registry.");
	    }
		return true;
	},
	/**
	 * Copy items from one collection based object (basically any object that supports .each enumeration)
	 * into this registry instance
	 */
	addRange: function(collection, onlyAddIfNotAlreadyAdded) {
	    var me = this;
        collection.each(function(item) {
            me.add(item, onlyAddIfNotAlreadyAdded);
        });
	},
	/**
	 * Add an item to the registry
	 * @param {Object} item Item to be added
	 * @param {Integer} stackIndex  Where to insert the item into the stack/list of registry items
	 * @param {Boolean} onlyAddIfNotAlreadyAdded    True to check if an item already exists with the current item ID -
	 *                                              if one exists, method will return false
	 */
	addAt: function(item, stackIndex, onlyAddIfNotAlreadyAdded) {
	    return this.add(item, onlyAddIfNotAlreadyAdded, stackIndex);
	},
	/**
	 * Finds an item in the registry
	 * @param {Function} iterator   Function which returns true when the desired item is found
	 * @return {Object} The item
	 */
	find: function(iterator) {
		return this.items.find(iterator);
	},	
	/**
	 * Finds an item in the registry by ID
	 * @param {String} id   ID of the registry item
	 * @return {Object} The item
	 */
	findById: function(id) {
	    if (this.unique) {
			return this.itemCache[id];
		}
	        
	    for(var i = 0; i < this.items.length; i++) {
		    if (this.items[i].id == id) {
				return this.items[i];
			}
	    }
	    return null;
	},	
	/**
	 * Removes an item from the registry by ID
	 * @param {String} id   ID of the registry item
	 * @return {Boolean}
	 */
	removeById: function(id) {
	    var item = this.findById(id);
	    return this.remove(item);
	},
	/**
	 * Removes an item from the registry
	 * @param {Object} item The registry item
	 * @return {Boolean}
	 */
	remove: function(item) {
	    if (!item) {
	        return false;
	    }
	    var foundItem = false;
		this.items = this.items.reject(function(it) { 
			if (it === item) {
				foundItem = true;
				return true; 
			}
			return false;
		});		
		if(this.unique) {
		    delete this.itemCache[item.id];
		}		    
		if (foundItem) {
			if (this.fireEvents) {
				this.fire("itemRemoved", {item: item});
			}
            if (this.items.length == 0 && this.fireEvents) {
				this.fire("cleared");
			}
            return true;
        }
        return false;
	},
	/**
	 * Removes all items from the registry
	 */
	removeAll: function() {
		var me = this;
		this.each(function(item) {
		    me.remove(item);
		});
	},
	/**
	 * Performs an action on each item in the registry
	 * @param {Function} iterator   Function containing code to execute on each item
	 */
	each: function(iterator) {
	    this.items.each(iterator);
	}
};
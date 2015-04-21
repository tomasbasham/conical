var hyp = (function() {
  'use strict';

  /*
   * Constructor for an experiment.
   *
   * @method Experiment
   *
   * @param {String} id
   *   The id of the experiment.
   *
   * @param {String} description
   *   A long description of the hypothesis.
   *
   * @param {Object} options
   *   Extra options for the experiment.
   *
   * @return {Experiment}
   *   An Experiment object.
   */
  function Experiment(id, description, options) {
    if(id === 'undefined' || typeof id !== 'string') {
      throw new Error('Experiment id is required.');
    }

    if(typeof description !== 'string') {
      options = description;
      description = null;
    }

    // If this was called on the class then create
    // a new Experiment instance.
    if(!(this instanceof Experiment)) {
      return new Experiment(id, description, options);
    }

    this.id = id;
    this.options = options || {};
    this.description = description;
    this.storagePrefix = this.storagePrefix + this.id;

    this.variants = [];
    this.handlers = [];

    // Every user must have an evenly distributed id
    // so they can be placed within variants.
    this.allocateId();

    // Put the user straight into a variant if one
    // was specified in the options.
    if(!!this.options.variant && this.hasVariant(this.options.variant)) {
      this.setVariant(this.options.variant);
    }

    return this;
  }

  /*
   * The lowest possible user id.
   *
   * @type {Number}
   */
  Experiment.prototype.min = 0;

  /*
   * The highest possible user id.
   *
   * @type {Number}
   */
  Experiment.prototype.max = 100000;

  /*
   * The localStorage key for the user id.
   *
   * @type {String}
   */
  Experiment.prototype.uidKey = 'conical_uid';

  /*
   * The localStorage prefix for each experiment.
   *
   * @type {String}
   */
  Experiment.prototype.storagePrefix = 'experiment_';

  /*
   * Represents whether an experiment has been converted.
   *
   * @type {Boolean}
   */
  Experiment.prototype.hasConverted = false;

  /*
   * Returns whether the experiment has expired.
   *
   * @method hasExpired
   *
   * @return {Boolean}
   *   True if the experiment has expired, otherwise false.
   */
  Experiment.prototype.hasExpired = function() {
    return (new Date() > this.options.expiry);
  };

  /*
   * Add a variant to the experiment. A variant
   * comprises of a weighting (default: 0.5) and
   * a callback to run when the variant is
   * chosen for the user.
   *
   * @method addVariant
   *
   * @param {String} id
   *   The id of the experiment.
   *
   * @param {Object} options
   *   Extra options for the experiment.
   *
   * @param {Function} _cb
   *   Callback.
   *
   * @return {Experiment}
   *   The experiment.
   */
  Experiment.prototype.addVariant = function(id, options, _cb) {
    if(id === 'undefined' || typeof id !== 'string') {
      throw new Error('Variant id is required.');
    }

    if(typeof options !== 'object') {
      _cb = options;
      options = {};
    }

    this.variants.push({ id: id, run: _cb, options: options });
    return this;
  };

  /*
   * Segment the user audience and decide whether
   * the user is to be included in the experiment.
   *
   * @method segment
   *
   * @return {Experiment}
   *   The experiment.
   */
  Experiment.prototype.segment = function() {
    if(this.hasExpired()) {
      throw new Error('This experiment has expired.');
    }

    if(this.variants.length <= 0) {
      throw new Error('This experiment has no variants.');
    }

    if(this.isParticipating()) {
      return this;
    }

    // If the user can participate then assign
    // then to a variant, otherwise set the user
    // as not participating.
    return this.canParticipate() ? this.participating() : this.notParticipating();
  };

  /*
   * Run the chosen vairiant.
   *
   * @method start
   *
   * @param {Object} args
   *   Extra arguments to pass to the variant.
   *
   * @return {Experiment}
   *   The experiment.
   */
  Experiment.prototype.start = function(args) {
    var chosenVariant = this.getVariant();

    // Loop through all variants can invoke
    // the variant's callback funtion for
    // which the user has been assigned.
    this.variants.forEach((function(_this) {
      return function(v) {
        if(v.id === chosenVariant.variantId) {
          v.run.call(args);
          _this.trigger('start', chosenVariant);
        }
      };
    })(this));

    return this;
  };

  /*
   * Short hand for invoking any complete handlers. Use
   * this for experiments that require an action to be
   * performed such as button clicks.
   *
   * @method complete
   *
   * @return {Experiment}
   *   The experiment.
   */
  Experiment.prototype.complete = function() {
    this.hasConverted = true;
    this.trigger('complete', this.getVariant());
    this.clearVariant();
    return this;
  };

  /*
   * Allocate the user a permanent conical id.
   *
   * @method allocateId
   *
   * @return {Number}
   *   The user's conical id.
   */
  Experiment.prototype.allocateId = function() {
    var generateRandomId = (function(_this) {
      return function(min, max) {
        var userId = Math.floor(Math.random() * max + min);
        _this.setId(userId);
        return userId;
      };
    })(this);

    return this.hasId() ? this.getId() : generateRandomId(this.min, this.max);
  };

  /*
   * Tests whether the user already has a
   * conical id set.
   *
   * @method hasId
   *
   * @return {Boolean}
   *   True if the user has a conical id, otherwise false.
   */
  Experiment.prototype.hasId = function() {
    return !!this.getId();
  };

  /*
   * Set the user;s conical id.
   *
   * @method setId
   *
   * @param {Number} id
   *   The user's conical id.
   */
  Experiment.prototype.setId = function(id) {
    localStorage.setItem(this.uidKey, id);
  };

  /*
   * Get the user's conical id.
   *
   * @method getId
   *
   * @return {Number}
   *   The user's conical id.
   */
  Experiment.prototype.getId = function() {
    if(typeof Storage === 'undefined') {
      throw new Error('Local storage is not supported in your browser.');
    }

    return parseInt(localStorage.getItem(this.uidKey));
  };

  /*
   * tests whether the user is already participating
   * within the experiment.
   *
   * @method isParticipating
   *
   * @return {Boolean}
   *   True if the user is already participating within the experiment, otherwise false.
   */
  Experiment.prototype.isParticipating = function() {
    return !!this.getVariant();
  };

  /*
   * tests whether the user can participate in
   * this experiment.
   *
   * @method canParticipate
   *
   * @return {Boolean}
   *   True if the user can participate, otherwise false.
   */
  Experiment.prototype.canParticipate = function() {
    return (this.getId() < this.max * (this.options.sampleSize || 1));
  };

  /*
   * Indicate the user is participating in this
   * experiment and determine the variant to
   * assign them.
   *
   * @method participating
   */
  Experiment.prototype.participating = function() {
    var allocateVariant = (function(_this) {
      return function() {
        var cumerlativeWeight, randomVariant, i;

        cumerlativeWeight = 0;
        randomVariant = Math.random();

        for(i = 0; i < _this.variants.length; i++) {
          cumerlativeWeight += (_this.variants[i].options.weight || 0.5);
          if(cumerlativeWeight >= randomVariant) {
            return _this.variants[i];
          }
        }
        return { id: 'no-chosen-variant' };
      };
    })(this);

    this.setVariant(allocateVariant());
    return this;
  };

  /*
   * Indicate the user is not participating in
   * this experiment.
   *
   * @method notParticipating
   */
  Experiment.prototype.notParticipating = function() {
    this.setVariant({ id: 'not-participating' });
    return this;
  };

  /*
   * Tests whether a varient exists within the
   * experiments set of variants.
   *
   * @method hasVariamt
   *
   * @param {Object} variant
   *   The variant to test.
   *
   * @return {Boolean}
   *   True if the variant exists, otherwise false.
   */
  Experiment.prototype.hasVariant = function(variant) {
    return this.variants.some(function(v) {
      return v.id === variant.id;
    });
  };

  /*
   * Set the variant for a particular experiment in the
   * browser's local storage.
   *
   * @method setVariant
   *
   * @param {Object} experiment
   *   The experiment.
   *
   * @param {Object} variant
   *   The chosen variant.
   */
  Experiment.prototype.setVariant = function(variant) {
    if(typeof Storage === 'undefined') {
      throw new Error('Local storage is not supported in your browser.');
    }

    localStorage.setItem(this.storagePrefix, JSON.stringify({
      experimentId: this.id,
      variantId: variant.id
    }));
  };

  /*
   * Get the variant for the experiment from the
   * browser's local storage.
   *
   * @method getVariant
   *
   * @return {Object}
   *   The chosen variant or null.
   */
  Experiment.prototype.getVariant = function() {
    var variant;

    if(typeof Storage === 'undefined') {
      throw new Error('Local storage is not supported in your browser.');
    }

    variant = localStorage.getItem(this.storagePrefix);
    return (variant) ? JSON.parse(variant) : null;
  };

  /*
   * Remove the variant for the experiment from the
   * browser's local storage.
   *
   * @method clearVariant
   */
  Experiment.prototype.clearVariant = function() {
    if(typeof Storage === 'undefined') {
      throw new Error('Local storage is not supported in your browser.');
    }

    localStorage.removeItem(this.storagePrefix);
  };

  /*
   * Call, in series, any handlers that have been
   * registered for the event that has been passed
   * in.
   *
   * @method trigger
   *
   * @param {String} event
   *   Name of the event.
   */
  Experiment.prototype.trigger = function(event) {
    var callbacks, args, i;

    if(event === 'undefined' || typeof event !== 'string') {
      throw new Error('Handler event name must be a string.');
    }

    callbacks = this.handlers[event] || [];
    args = [].slice.call(arguments, 1);

    for(i = 0; i < callbacks.length; i++) {
      callbacks[i].apply(this, args);
    }
  };

  /*
   * Register a callback handler for the event passed
   * in. An event can have multiple event handlers
   * attached to it that are called in the order they
   * were registered.
   *
   * @method on
   *
   * @param {String} event
   *   Name of the event.
   *
   * @param {Function} _cb
   *   Callback.
   */
  Experiment.prototype.on = function(event, _cb) {
    if(event === 'undefined' || typeof event !== 'string') {
      throw new Error('Handler event name must be a string.');
    }

    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(_cb);
    return this;
  };

  return Experiment;
})();

// Setup conical appropriately for the environment.
if(typeof define === 'function' && typeof define.amd !== 'undefined') {
  define('Conical', hyp);
}

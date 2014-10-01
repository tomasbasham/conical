var hyp = (function() {
  'use strict';

  /*
   * Experiment
   *
   * Constructor for an experiment.
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
      description  = null;
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
   * hasExpired
   *
   * @return {Boolean}
   *   True if the experiment has expired, otherwise false.
   */
  Experiment.prototype.hasExpired = function() {
    return (new Date() > this.options.expiry);
  };

  /*
   * addVariant
   *
   * Add a variant to the experiment. A variant
   * comprises of a weighting (default: 0.5) and
   * a callback to run when the variant is
   * chosen for the user.
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
      options  = {};
    }

    this.variants.push({
      id: id,
      run: _cb,
      options: options
    });
    return this;
  };

  /*
   * segment
   *
   * Segment the user audience and decide whether
   * the user is to be included in the experiment.
   *
   * @return {Experiment}
   *   The experiment.
   */
  Experiment.prototype.segment = function() {
    // Has the experiment expired. If so then
    // throw an error.
    if(this.hasExpired()) {
      throw new Error('This experiment has expired.');
    }

    // If no variants have been added to the
    // experiment then throw an error.
    if(this.variants.length <= 0) {
      throw new Error('This experiment has no variants.');
    }

    // If the user has already been assigned to
    // a variant then our work here is done.
    if(this.isParticipating()) {
      return this;
    }

    // If the user can participate then assign
    // then to a variant, otherwise set them to
    // be not participating.
    if(this.canParticipate()) {
      this.participating();
    } else {
      this.notParticipating();
    }
    return this;
  };

  /*
   * start
   *
   * Run the chosen vairiant.
   *
   * @param {Object} args
   *   Extra arguments to pass to the variant.
   *
   * @return {Experiment}
   *   The experiment.
   */
  Experiment.prototype.start = function(args) {
    var chosenVariant = this.getVariant();
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
   * allocateId
   *
   * Allocate the user a permanent conical id.
   *
   * @return {Number}
   *   The user's conical id.
   */
  Experiment.prototype.allocateId = function() {
    var generateRandomId = (function(_this) {
      return function(min, max) {
        var userId = Math.floor(Math.random() * max + min);
        return _this.setId(userId);
      };
    })(this);

    return this.hasId() ? this.getId() : generateRandomId(this.min, this.max);
  };

  /*
   * hasId
   *
   * Tests whether the user already has a
   * conical id set.
   *
   * @return {Boolean}
   *   True if the user has a conical id, otherwise false.
   */
  Experiment.prototype.hasId = function() {
    return !!this.getId();
  };

  /*
   * setId
   *
   * Set the user;s conical id.
   *
   * @param {Number} id
   *   The user's conical id.
   *
   * @return {Number}
   *   The user's conical id.
   */
  Experiment.prototype.setId = function(id) {
    localStorage.setItem(this.uidKey, id);
    return id;
  };

  /*
   * getId
   *
   * Get the user's conical id.
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
   * isParticipating
   *
   * tests whether the user is already participating
   * within the experiment.
   *
   * @return {Boolean}
   *   True if the user is already participating within the experiment, otherwise false.
   */
  Experiment.prototype.isParticipating = function() {
    return !!this.getVariant();
  };

  /*
   * canParticipate
   *
   * tests whether the user can participate in
   * this experiment.
   *
   * @return {Boolean}
   *   True if the user can participate, otherwise false.
   */
  Experiment.prototype.canParticipate = function() {
    return (this.getId() < this.max * (this.options.sampleSize || 1));
  };

  /*
   * participating
   *
   * Indicate the user is participating in this
   * experiment and determine the variant to
   * assign them.
   */
  Experiment.prototype.participating = function() {
    var allocateVariant = (function(_this) {
      return function() {
        var i               = null
        , cumerlativeWeight = 0
        , randomVariant     = Math.random();

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
  };

  /*
   * notParticipating
   *
   * Indicate the user is not participating in
   * this experiment.
   */
  Experiment.prototype.notParticipating = function() {
    this.setVariant({ id: 'not-participating' });
  };

  /*
   * hasVariamt
   *
   * Tests whether a varient exists within the
   * experiments set of variants.
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
   * setVariant
   *
   * Set the variant for a particular experiment in the
   * browser's local storage.
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
   * getVariant
   *
   * Get the variant for the experiment from the
   * browser's local storage.
   *
   * @return {Object}
   *   The chosen variant or null.
   */
  Experiment.prototype.getVariant = function() {
    if(typeof Storage === 'undefined') {
      throw new Error('Local storage is not supported in your browser.');
    }

    var variant = localStorage.getItem(this.storagePrefix);
    return (variant) ? JSON.parse(variant) : null;
  };

  /*
   * clearVariant
   *
   * Remove the variant for the experiment from the
   * browser's local storage.
   */
  Experiment.prototype.clearVariant = function() {
    if(typeof Storage === 'undefined') {
      throw new Error('Local storage is not supported in your browser.');
    }

    localStorage.removeItem(this.storagePrefix);
  };

  /*
   * complete
   *
   * Short hand for invoking any complete handlers. Use
   * this for experiments that require an action to be
   * performed such as button clicks.
   *
   * @return {Experiment}
   *   The experiment.
   */
  Experiment.prototype.complete = function() {
    this.hasConverted = true;
    this.clearVariant();
    this.trigger('complete', this.getVariant());
    return this;
  };

  /*
   * trigger
   *
   * Call, in series, any handlers that have been
   * registered for the event that has been passed
   * in.
   *
   * @param {String} event
   *   Name of the event.
   */
  Experiment.prototype.trigger = function(event) {
    if(event === 'undefined' || typeof event !== 'string') {
      throw new Error('Handler event name must be a string.');
    }

    var i       = null
    , callbacks = this.handlers[event] || []
    , args      = Array.prototype.slice.call(arguments, 1);

    for(i = 0; i < callbacks.length; i++) {
      callbacks[i].call(this, args);
    }
  };

  /*
   * on
   *
   * Register a callback handler for the event passed
   * in. An event can have multiple event handlers
   * attached to it that are called in the order they
   * were registered.
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
if (typeof define === 'function' && typeof define.amd !== 'undefined') {
  define('Conical', hyp);
}
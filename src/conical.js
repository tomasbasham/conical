'use strict';

/**
 * Front end statistical hypothesis testing
 * class supporting multivariant tests.
 *
 * @class Conical
 * @constructor
 */
class Conical {

  /**
   * Constructor for an experiment.
   *
   * @private
   * @method constructor
   * @param {String} id Experiment ID.
   * @param {String} description Experiment description.
   * @param {Object} options Extra options for the experiment.
   * @throws {Error} An error.
   */
  constructor(id, description, options) {
    if(id === 'undefined' || typeof id !== 'string') {
      throw new Error('experiment id is required');
    }

    /**
     * Experiment identifier.
     *
     * @public
     * @type Number
     * @property id
     */
    this.id = id;

    /**
     * Describe the experiment.
     *
     * @public
     * @type String
     * @property description
     */
    this.description = description;

    /**
     * Experiment options.
     *
     * @public
     * @type Object
     * @property options
     */
    this.options = Object.assign({}, {
      sampleSize: 1,
      random: Math.random
    }, options);

    /**
     * The localStorage key for the user id.
     *
     * @private
     * @type String
     * @property uidKey
     */
    this.uidKey = 'conical_uid';

    /**
     * The localStorage prefix for the
     * chosen variant of this experiment.
     *
     * @private
     * @type String
     * @property storagePrefix
     */
    this.storagePrefix = 'experiment_';

    /**
     * Key used to identify the chosen
     * experiment variant in local storage.
     *
     * @private
     * @type String
     * @property experimentKey
     */
    this.experimentKey = this.storagePrefix + this.id;

    /**
     * The lowest possible user id.
     *
     * @private
     * @type Number
     * @property min
     */
    this.min = 0;

    /**
     * The highest possible user id.
     *
     * @private
     * @type Number
     * @property max
     */
    this.max = 100000;

    /**
     * Represents whether an experiment has been converted.
     *
     * @private
     * @type Boolean
     * @property hasConverted
     */
    this.hasConverted = false;

    /**
     * Array of variants.
     *
     * @private
     * @type Array
     * @property variants
     */
    this.variants = [];

    /**
     * Array of handlers.
     *
     * @private
     * @type Array
     * @property handlers
     */
    this.handlers = [];

    // Every user must have an evenly distributed id
    // so they can be placed within variants.
    this.assignId();
  }

  /**
   * Add a variant to the experiment. A variant
   * comprises of a weighting (default: 0.5) and
   * a callback to run when the variant is
   * chosen for the user.
   *
   * @public
   * @method addVariant
   * @param {String} id The id of the experiment.
   * @param {Object} options Extra options for the experiment.
   * @param {Function} cb Callback.
   * @throws {Error} An error.
   */
  addVariant(id, options, cb) {
    if(id === 'undefined' || typeof id !== 'string') {
      throw new Error('variant id is required');
    }

    if(typeof options !== 'object') {
      cb = options;
      options = {};
    }

    options.weight = options.weight || 0.5;
    this.variants.push({ id, options, callback: cb });
  }

  /**
   * Register a callback handler for the event passed
   * in. An event can have multiple event handlers
   * attached to it that are called in the order they
   * were registered.
   *
   * @public
   * @method on
   * @param {String} event Name of the event.
   * @param {Function} cb Callback.
   * @throws {Error} An error.
   */
  on(event, cb) {
    if(event === 'undefined' || typeof event !== 'string') {
      throw new Error('handler event name is required');
    }

    this.handlers[event] = this.handlers[event] || [];
    this.handlers[event].push(cb);
  }

  /**
   * Segment the user audience and decide whether
   * the user is to be included in the experiment.
   *
   * @public
   * @method segment
   * @throws {Error} An error.
   */
  segment() {
    if(this.hasExpired()) {
      this.clearVariant();
      throw new Error('this experiment has expired');
    }

    if(this.variants.length <= 0) {
      throw new Error('this experiment has no variants');
    }

    if(this.isParticipating()) {
      return;
    }

    // If the user can participate then assign
    // then to a variant, otherwise set the user
    // as not participating.
    if(this.canParticipate()) {
      return this.participating();
    }

    this.notParticipating();
  }

  /**
   * Run the vairiant the user has been placed
   * passing through any arguments.
   *
   * @public
   * @method start
   */
  start() {
    const chosenVariant = this.getVariant();
    const args = Array.prototype.slice.call(arguments);

    // Loop through all variants and invoke
    // the variant's callback funtion for
    // which the user has been assigned.
    for(let variant of this.variants) {
      if(variant.id === chosenVariant.id) {
        this.trigger('start', chosenVariant);
        variant.callback.call(this, args);
      }
    }
  }

  /**
   * Short hand for invoking any complete handlers. Use
   * this for experiments that require an action to be
   * performed such as button clicks.
   *
   * @public
   * @method complete
   * @throws {Error} An error.
   */
  complete() {
    if(this.hasConverted) {
      throw new Error('this experiment is already complete');
    }

    const chosenVariant = this.getVariant();

    this.hasConverted = true;
    this.trigger('complete', chosenVariant);
  }

  /**
   * Returns whether the experiment has expired.
   *
   * @private
   * @method hasExpired
   * @return {Boolean} True if the experiment has expired, otherwise false.
   */
  hasExpired() {
    return (new Date() > this.options.expiry);
  }

  /**
   * Allocate the user a permanent conical id.
   *
   * @private
   * @method assignId
   * @return {Number} The user's conical id.
   */
  assignId() {
    const generateRandomId = (min, max) => {
      const id = Math.floor(this.options.random() * max + min);
      this.setId(id);
      return id;
    };

    return this.hasId() ? this.getId() : generateRandomId(this.min, this.max);
  }

  /**
   * Tests whether the user already has a
   * conical id set.
   *
   * @private
   * @method hasId
   * @return {Boolean} True if the user has a conical id, otherwise false.
   */
  hasId() {
    return !!this.getId();
  }

  /**
   * tests whether the user is already participating
   * within the experiment.
   *
   * @private
   * @method isParticipating
   * @return {Boolean} True if the user is participating, otherwise false.
   */
  isParticipating() {
    return !!this.getVariant();
  }

  /**
   * tests whether the user can participate in
   * this experiment.
   *
   * @private
   * @method canParticipate
   * @return {Boolean} True if the user can participate, otherwise false.
   */
  canParticipate() {
    const sampleSize = Math.min(Math.max(this.options.sampleSize, 0), 1);
    return (this.getId() < this.max * sampleSize);
  }

  /**
   * Indicate the user is participating in this
   * experiment and determine the variant to
   * assign them.
   *
   * @private
   * @method participating
   */
  participating() {
    const allocateVariant = () => {
      const randomVariant = this.options.random();
      let cumerlativeWeight = 0;

      for(let variant of this.variants) {
        cumerlativeWeight += variant.options.weight;
        if(cumerlativeWeight >= randomVariant) {
          return variant;
        }
      }

      return { id: 'no-chosen-variant' };
    };

    const allocatedVariant = allocateVariant();
    this.setVariant(allocatedVariant);
  }

  /**
   * Indicate the user is not participating in
   * this experiment.
   *
   * @private
   * @method notParticipating
   */
  notParticipating() {
    this.setVariant({ id: 'not-participating' });
  }

  /**
   * Get the container used to store data
   * relating to the experiment.
   *
   * @private
   * @return {Object} Container object.
   * @throws {Error} An error.
   */
  container() {
    if(typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      throw new Error('localStorage is unavailable in this environment');
    }

    return window.localStorage;
  }

  /**
   * Set the conical id for the user in local
   * storage.
   *
   * @private
   * @method setId
   * @param {Number} id The user's conical id.
   */
  setId(id) {
    const container = this.container();
    container.setItem(this.uidKey, id);
  }

  /**
   * Get the conical id for the user from local
   * storage.
   *
   * @private
   * @method getId
   * @return {Number} The user's conical id.
   */
  getId() {
    const container = this.container();
    return parseInt(container.getItem(this.uidKey));
  }

  /**
   * Set the variant for a particular experiment
   * in local storage.
   *
   * @private
   * @method setVariant
   * @param {Object} variant The chosen variant.
   */
  setVariant(variant) {
    const container = this.container();
    container.setItem(this.experimentKey, JSON.stringify({
      id: variant.id
    }));
  }

  /**
   * Get the variant for the experiment from
   * local storage.
   *
   * @private
   * @method getVariant
   * @return {Object} The chosen variant or undefined.
   */
  getVariant() {
    const container = this.container();
    const variant = container.getItem(this.experimentKey);
    return variant ? JSON.parse(variant) : undefined;
  }

  /**
   * Remove the variant for the experiment from
   * local storage.
   *
   * @private
   * @method clearVariant
   */
  clearVariant() {
    const container = this.container();
    container.removeItem(this.experimentKey);
  }

  /**
   * Call, in series, any handlers that have been
   * registered for the event that has been passed
   * in.
   *
   * @private
   * @method trigger
   * @param {String} event Name of the event.
   * @param {Object} variant Chosen variant.
   */
  trigger(event, variant) {
    const callbacks = this.handlers[event] || [];

    for(let callback of callbacks) {
      callback.call(this, variant);
    }
  }
}

export default Conical;

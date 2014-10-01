/* global chai, sinon, hyp, describe, beforeEach, afterEach, it */
'use strict';

var should = chai.should();

describe('conical', function() {
  var stub = null
  , done   = function(_cb) {
    _cb();
  };

  beforeEach(function() {
    localStorage.clear();
    stub = sinon.stub(Math, 'random', function() {
      return 0.34702089498750865;
    });
  });

  afterEach(function() {
    stub.restore();
  });

  it('can be included without blowing up', function() {
    should.exist(hyp);
  });

  describe('experiments', function() {
    it('can create an experiment', function() {
      var experiment = hyp('test', 'this is a test experiment');
      should.exist(experiment);
    });

    it('has been given the id "test"', function() {
      var experiment = hyp('test', 'this is a test experiment');
      experiment.id.should.equal('test');
    });

    it('has no variants', function() {
      var experiment = hyp('test', 'this is a test experiment');
      experiment.variants.should.have.length(0);
    });
  });

  describe('variants', function() {
    it('can create a variant', function() {
      var experiment = hyp('test', 'this is a test experiment');
      experiment.addVariant('variant', done);
      experiment.variants.should.have.length(1);
    });

    it('can create a weighted variant', function() {
      var experiment = hyp('test', 'this is a test experiment');
      experiment.addVariant('variant', { weight: 0.3 }, done);
      experiment.variants.should.have.length(1);
    });
  });

  describe('segmentation', function() {
    it('should assign new users to a segment', function() {
      var experiment = hyp('test', 'this is a test experiment');
      experiment.getId().should.equal(34702);
    });

    it('should not reassign a user to a segment', function() {
      localStorage.setItem('conical_uid', 1260);
      var experiment = hyp('test', 'this is a test experiment');
      experiment.getId().should.equal(1260);
    });

    it('should choose a variant', function() {
      var experiment = hyp('test', 'this is a test experiment');
      experiment.addVariant('variant-A', { weight: 0.3 }, done);
      experiment.addVariant('variant-B', { weight: 0.7 }, done);
      experiment.segment();
      experiment.variants.should.have.length(2);
      experiment.getVariant().should.deep.equal({ experimentId: 'test', variantId: 'variant-B' });
    });

    it('should give non participating users an appropriate variant id', function() {
      var experiment = hyp('test', 'this is a test experiment', { sampleSize: 0.2 });
      experiment.addVariant('variant-A', { weight: 0.3 }, done);
      experiment.segment();
      experiment.getVariant().should.deep.equal({ experimentId: 'test', variantId: 'not-participating' });
    });
  });

  it('should respond to triggered events', function(done) {
    var experiment = hyp('test', 'this is a test experiment');
    experiment.addVariant('variant', { weight: 0.5 }, done).segment();
    experiment.on('start', function() { done(); });
    experiment.trigger('start');
  });

  it('should be "completable"', function() {
    var experiment = hyp('test', 'this is a test experiment');
    experiment.addVariant('variant', { weight: 0.5 }, done).segment().complete();
    experiment.hasConverted.should.equal(true);
    should.not.exist(experiment.getVariant());
  });

  it('should not run experiments with no variants', function() {
    var experiment = hyp('test', 'this is a test experiment');
    (experiment.segment.bind(experiment)).should.throw(Error);
  });

  it('should not run expired experiments', function() {
    var experiment = hyp('test', 'this is a test experiment', { expiry: new Date(1) });
    (experiment.segment.bind(experiment)).should.throw(Error);
  });
});
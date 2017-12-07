import Conical from 'conical';
import { describe, beforeEach, afterEach, it } from 'mocha';
import { expect } from 'chai';
import Sinon from 'sinon';
import 'mock-local-storage';

let sandbox;

global.window = {};
window.localStorage = global.localStorage;

describe('conical', function() {
  beforeEach(function() {
    sandbox = Sinon.sandbox.create();
  });

  afterEach(function() {
    sandbox.restore();
    global.localStorage.clear();
  });

  it('can be included without blowing up', function() {
    expect(Conical).to.exist;
  });

  describe('experiment', function() {
    describe('when no id is passed', function() {
      it('throws an exception', function() {
        const newConical = () => new Conical();
        expect(newConical).to.throw('experiment id is required');
      });
    });

    describe('when an id is passed', function() {
      it('can create an experiment', function() {
        let experiment = new Conical('test', 'this is a test experiment');
        expect(experiment).to.exist;
      });

      it('has an id', function() {
        let experiment = new Conical('test', 'this is a test experiment');
        expect(experiment.id).to.equal('test');
      });

      it('has no variants', function() {
        let experiment = new Conical('test', 'this is a test experiment');
        expect(experiment.variants).to.have.length(0);
      });
    });
  });

  describe('variants', function() {
    describe('when no id is passed', function() {
      it('throws an exception', function() {
        let experiment = new Conical('test', 'this is a test experiment');
        expect(experiment.addVariant).to.throw('variant id is required');
      });
    });

    describe('when an id is passed', function() {
      it('can create a variant', function() {
        let experiment = new Conical('test', 'this is a test experiment');

        const spy = sandbox.spy();
        experiment.addVariant('variant', spy);

        expect(experiment.variants).to.have.length(1);
      });

      it('can create a weighted variant', function() {
        let experiment = new Conical('test', 'this is a test experiment');

        const spy = sandbox.spy();
        experiment.addVariant('variant', { weight: 0.3 }, spy);

        expect(experiment.variants).to.have.length(1);
      });
    });
  });

  describe('segmentation', function() {
    it('can choose a variant', function() {
      sandbox.stub(Math, 'random', function() {
        return 0.34702089498750865;
      });

      let experiment = new Conical('test', 'this is a test experiment');

      const spy = sandbox.spy();
      experiment.addVariant('variant-A', { weight: 0.3 }, () => 42);
      experiment.addVariant('variant-B', { weight: 0.7 }, spy);

      experiment.segment();
      experiment.start();

      expect(experiment.variants).to.have.length(2);
      expect(spy.calledOnce).to.be.ok;
    });

    it('uses the same variant', function() {
      sandbox.stub(Math, 'random', function() {
        return 0.34702089498750865;
      });

      let experiment = new Conical('test', 'this is a test experiment');
      experiment.addVariant('variant-A', { weight: 0.4 });
      experiment.segment();

      const spy = sandbox.spy();
      experiment = new Conical('test', 'this is a test experiment');
      experiment.addVariant('variant-A', { weight: 0.4 }, spy);

      experiment.segment();
      experiment.start();

      expect(experiment.variants).to.have.length(1);
      expect(spy.calledOnce).to.be.ok;
    });

    it('defaults to a non chosen variant', function() {
      sandbox.stub(Math, 'random', function() {
        return 0.34702089498750865;
      });

      let experiment = new Conical('test', 'this is a test experiment');

      const spy = sandbox.spy();
      experiment.addVariant('variant-A', { weight: 0.3 }, spy);

      experiment.segment();
      experiment.start();

      expect(experiment.variants).to.have.length(1);
      expect(spy.notCalled).to.be.ok
    });

    it('gives non participating users a variant id', function() {
      sandbox.stub(Math, 'random', function() {
        return 0.34702089498750865;
      });

      let experiment = new Conical('test', 'this is a test experiment', {
        sampleSize: 0.2
      });

      const spy = sandbox.spy();
      experiment.addVariant('variant-A', { weight: 0.3 }, spy);

      experiment.segment();
      experiment.start();

      expect(experiment.variants).to.have.length(1);
      expect(spy.notCalled).to.be.ok
    });
  });

  describe('triggered events', function() {
    describe('when no event string is passed', function() {
      it('throws an exception', function() {
        let experiment = new Conical('test', 'this is a test experiment');
        expect(experiment.on).to.throw('handler event name is required');
      });
    });
  });

  describe('when an experiment is started', function() {
    describe('when there are no variants', function() {
      it('throws an exception', function() {
        let experiment = new Conical('test', 'this is a test experiment');

        const boundSegment = experiment.segment.bind(experiment);
        expect(boundSegment).to.throw('this experiment has no variants');
      });
    });

    describe('when there are variants', function() {
      it('invokes the start handler', function() {
        sandbox.stub(Math, 'random', function() {
          return 0.34702089498750865;
        });

        let experiment = new Conical('test', 'this is a test experiment');
        experiment.addVariant('variant', () => 42);

        const spy = sandbox.spy();
        experiment.on('start', spy);

        experiment.segment();
        experiment.start();

        expect(spy.calledWith({ id: 'variant' })).to.be.ok;
      });
    });
  });

  describe('when an experiment is complete', function() {
    it('invokes the complete handler', function() {
      sandbox.stub(Math, 'random', function() {
        return 0.34702089498750865;
      });

      let experiment = new Conical('test', 'this is a test experiment');
      experiment.addVariant('variant', () => 42);

      const spy = sandbox.spy();
      experiment.on('complete', spy);

      experiment.segment();
      experiment.complete();

      expect(spy.calledWith({ id: 'variant' })).to.be.ok;
    });

    it('has converted', function() {
      let experiment = new Conical('test', 'this is a test experiment');

      experiment.complete();
      expect(experiment.hasConverted).to.be.ok;
    });

    it('cannot be completed more than once', function() {
      let experiment = new Conical('test', 'this is a test experiment');
      experiment.complete();

      const boundComplete = experiment.complete.bind(experiment);
      expect(boundComplete).to.throw('this experiment is already complete');
    });
  });

  describe('when an experiment has expired', function() {
    it('throws an exception', function() {
      let experiment = new Conical('test', 'this is a test experiment', {
        expiry: new Date(1)
      });

      const boundSegment = experiment.segment.bind(experiment);
      expect(boundSegment).to.throw('this experiment has expired');
    });
  });

  describe('when localStorage is not defined', function() {
    it('throws an exception', function() {
      const newConical = () => new Conical('test', 'this is a test experiment');

      sandbox.stub(window, 'localStorage', undefined);
      expect(newConical).to.throw('localStorage is unavailable in this environment');
    });
  });
});

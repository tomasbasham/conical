# conical [![Build Status](https://secure.travis-ci.org/whichledlight/conical.png?branch=master)](https://travis-ci.org/whichledlight/conical)

Conical is a statistical hypothesis testing library for front end applications. With more and more web applications moving from a
traditional server rendered approach to a client rendered strategy, we are finding actionable analytics harder to collect and collate.


## Getting Started

### What is Conical?

Conical is a statistical hypothesis testing library for front end applications.

Basically, it allows you to perform multivariate testing upon your user base entirely on the front end. By using front end frameworks such as AngularJS, Ember.js, and Backbone.js you are relying on the client to perform the page rendering and not the server. This makes it more difficult to segment users to test site variants. Conical provides the methods to allocate visitors to variants, given an audience size and variant weighting, such that you can control how many visitors are included within tests.

Conical does **NOT** record the number of participant within a variant or successful conversions. Conical has been designed to be service agnostic and not rely on any one particular analytics engine. Instead conical provides hooks that are triggered upon particular actions. These give you the chance to report participation and successful conversions to the analytics engine of your choice.

It is recommended that this tool is installed through a package manager. Conical lives in the [bower](http://bower.io/) package repository.

```bash
$ bower install conical
```

### Getting to know Conical

Conical is very easy to work with and allows developers to put the application first. If you think it's too opinionated, conical can be easily configured.

To learn how to configure conical and setup multivariate tests, check out the complete [Getting Started Guide](https://github.com/whichledlight/conical/wiki/Getting-Started).


## License

MIT

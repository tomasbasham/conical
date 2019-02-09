# conical [![Build Status](https://travis-ci.com/tomasbasham/conical.svg?branch=master)](https://travis-ci.com/tomasbasham/conical)

A library providing statistical hypothesis testing for front end applications.
With more and more web applications moving from a traditional server rendered
approach to a client rendered strategy, we are finding actionable analytics
harder to collect and collate.

## Installation

From within your project directory run:

```bash
npm install --save conical
```

## Usage

Conical is a statistical hypothesis testing library for front end applications.

Basically, it allows you to perform multivariate testing upon your user base
entirely on the front end. By using front end frameworks such as AngularJS,
Ember.js, and Backbone.js you are relying on the client to perform the page
rendering and not the server. This makes it more difficult to segment users to
test site variants. Conical provides the methods to allocate visitors to
variants, given an audience size and variant weighting, such that you can
control how many visitors are included within tests.

Conical does **NOT** record the number of participants within a variant or
successful conversions. Conical has been designed to be service agnostic and
not rely on any one particular analytics engine. Instead conical provides hooks
that are triggered upon particular actions. These give you the chance to report
participation and successful conversions to the analytics engine of your
choice.

## License

This project is licensed under the [MIT License](LICENSE.md).

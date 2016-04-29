var model = require('nodejs-model');

var Player = model("Player").attr('id', {
  validations: {
  }
}).attr('name', {
  validations: {
    presence: true,
    length: {
      minimum: 3,
      maximum: 50,
      messages: {
        tooShort: 'name is too short!',
        tooLong: 'name is too long!'
      }
    }
  }
}).attr('coins', {
  validations: {
    presence: true
  },
  tags: ['private']
});

module.exports = Player;
function async() {
  require.ensure([], function(require) {
    require('./index');
  }, 'index');
}
